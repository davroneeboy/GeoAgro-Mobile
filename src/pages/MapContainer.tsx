import React, { useState, useContext, useEffect, useRef, useCallback } from "react";
import { useMapsHook } from "./mapsHook";
import L from "leaflet";
import { useNavigate, Link } from "react-router-dom";
import { fetchPlantationsMapAll, fetchDistrictDetail } from "../api/api.js";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import { landTypeMapping } from "../context/constants";
import AuthContext from "../context/AuthContext";
import { apiRequest } from "../utils/apiUtils";
import { MapDistrictStatsCard } from "../components/common/MapDistrictStats";
import type {
  MapFilters,
  MapPagination,
  SelectedRegion,
  SelectedDistrict,
  DistrictStats,
  PlantationDetail,
  Plantation,
  AuthContextType,
  FilterStatus,
  PlantationMapParams,
  Coordinate,
} from "../types";

// =============================================
// Constants
// =============================================

const PAGE_SIZE_DEFAULT = 100;
const PAGE_SIZE_ALL = 10000;
const DEBOUNCE_DELAY_MS = 500;
const LARGE_SCREEN_BREAKPOINT = 1024;

const INITIAL_FILTERS: MapFilters = {
  status: "all",
  name: "",
  inn: "",
};

const INITIAL_PAGINATION: MapPagination = {
  count: 0,
  next: null,
  previous: null,
  currentPage: 1,
};

// =============================================
// Helper Functions
// =============================================

const getPlantationColor = (
  plantation: Plantation,
  filterStatus: FilterStatus
): string => {
  if (filterStatus === "approved") return "green";
  if (filterStatus === "rejected") return "red";
  if (filterStatus === "deleting") return "orange";
  if (filterStatus === "pending" || filterStatus === "moderation") return "yellow";

  if (filterStatus === "all") {
    if (
      plantation.is_checked === true &&
      plantation.is_rejected === false &&
      plantation.is_deleting === false
    ) {
      return "green";
    }
    if (plantation.is_rejected === true) return "red";
    if (plantation.is_deleting === true) return "orange";
    if (
      plantation.is_checked === false &&
      plantation.is_rejected === false &&
      plantation.is_deleting === false
    ) {
      return "yellow";
    }
  }

  return "yellow";
};

const saveToLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage errors
  }
};

const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore localStorage errors
  }
};

const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// =============================================
// Component
// =============================================

const MapContainer: React.FC = () => {
  const navigate = useNavigate();
  const { authState, refreshAccessToken } = useContext(AuthContext) as AuthContextType;

  // State
  const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<SelectedDistrict | null>(null);
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [selectedPlantation, setSelectedPlantation] = useState<PlantationDetail | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [loadingPlantation, setLoadingPlantation] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<MapFilters>(INITIAL_FILTERS);
  const [loadingPlantations, setLoadingPlantations] = useState<boolean>(false);
  const [pagination, setPagination] = useState<MapPagination>(INITIAL_PAGINATION);
  const [districtStats, setDistrictStats] = useState<DistrictStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Refs
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef<boolean>(false);
  const loadPlantationsRef = useRef<
    (
      page?: number,
      currentFilters?: MapFilters,
      currentDistrict?: SelectedDistrict | null,
      currentRegion?: SelectedRegion | null
    ) => Promise<void>
  >();

  // Computed
  const isLarge =
    typeof window !== "undefined" ? window.innerWidth >= LARGE_SCREEN_BREAKPOINT : true;

  // Handlers
  const handleMapLoad = useCallback((map: L.Map): void => {
    setMapInstance(map);
  }, []);

  const handleRegionClick = useCallback(
    (regionId: string | number, regionName: string): void => {
      const region: SelectedRegion = { id: regionId, name: regionName };
      setSelectedRegion(region);
      saveToLocalStorage("mapSelectedRegion", region);
      removeFromLocalStorage("mapSelectedDistrict");
      setSelectedDistrict(null);
      setPlantations([]);
      setSelectedPlantation(null);
      setDistrictStats(null);
    },
    []
  );

  const loadDistrictStats = useCallback(
    async (districtId: number): Promise<void> => {
      if (!districtId || !authState?.accessToken) return;

      setLoadingStats(true);
      try {
        const stats = await fetchDistrictDetail(districtId, authState.accessToken);
        setDistrictStats(stats);
      } catch (error) {
        console.error("Error loading district stats:", error);
        setDistrictStats(null);
      } finally {
        setLoadingStats(false);
      }
    },
    [authState?.accessToken]
  );

  const handleDistrictClick = useCallback(
    async (districtId: number, districtName: string = "Tumani"): Promise<void> => {
      const district: SelectedDistrict = { id: districtId, name: districtName };
      setSelectedDistrict(district);
      saveToLocalStorage("mapSelectedDistrict", district);
      setSelectedPlantation(null);
      loadDistrictStats(districtId);
    },
    [loadDistrictStats]
  );

  const handlePlantationClick = useCallback(
    async (plantation: Plantation, map?: L.Map): Promise<void> => {
      setLoadingPlantation(true);
      try {
        if (authState.userRole === "observer") {
          const karta = map || mapInstance;
          const coordsSimple = (plantation.coordinates || []).map(
            (c: Coordinate) => [c.latitude, c.longitude] as [number, number]
          );

          if (coordsSimple.length && karta) {
            try {
              karta.fitBounds(L.polygon(coordsSimple).getBounds());
            } catch {
              // Ignore bounds error
            }
          }

          setSelectedPlantation(plantation as PlantationDetail);

          try {
            const detailed = await apiRequest(
              `api/plantations/${plantation.id}/`,
              {},
              refreshAccessToken,
              authState.accessToken
            );
            setSelectedPlantation(detailed as PlantationDetail);
          } catch {
            // Silently ignore 403/404 for observer
          }
          return;
        }

        const data = await apiRequest(
          `api/plantations/${plantation.id}/`,
          {},
          refreshAccessToken,
          authState.accessToken
        );

        setSelectedPlantation(data as PlantationDetail);
        const karta = map || mapInstance;
        const coordinates = (data.coordinates as Coordinate[]).map(
          (coord) => [coord.latitude, coord.longitude] as [number, number]
        );
        karta?.fitBounds(L.polygon(coordinates).getBounds());
      } catch (error) {
        console.error("Error fetching plantation details:", error);

        if (authState.userRole === "observer") {
          // Don't disturb observer
        } else if ((error as Error).message?.includes("404")) {
          alert(
            "❌ Bu bog'ga kirish huquqi yo'q!\n\nSiz faqat o'z viloyatingizdagi bog'larni ko'rishingiz mumkin."
          );
        } else if ((error as Error).message?.includes("403")) {
          alert("❌ Ruxsat yo'q!\n\nBu bog'ni ko'rish uchun ruxsatingiz yo'q.");
        } else {
          alert(
            "❌ Xatolik!\n\nBog' ma'lumotlarini yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
          );
        }

        if (authState.userRole !== "observer") {
          setSelectedPlantation(null);
        }
      } finally {
        setLoadingPlantation(false);
      }
    },
    [authState.accessToken, authState.userRole, mapInstance, refreshAccessToken]
  );

  // Load plantations function
  loadPlantationsRef.current = async (
    page = 1,
    currentFilters = filters,
    currentDistrict = selectedDistrict,
    currentRegion = selectedRegion
  ): Promise<void> => {
    if (!currentDistrict && !currentRegion) {
      setPlantations([]);
      return;
    }

    if (loadingPlantations) return;

    setLoadingPlantations(true);
    try {
      const params: PlantationMapParams = {
        page,
        page_size: PAGE_SIZE_DEFAULT,
        returnFullResponse: true,
      };

      if (currentFilters.status) {
        params.status = currentFilters.status;
      }

      if (currentDistrict) {
        params.district_id = currentDistrict.id;
      } else if (currentRegion) {
        params.region = currentRegion.name;
      }

      if (currentFilters.name) {
        params.name = currentFilters.name;
      }

      if (currentFilters.inn) {
        params.inn = currentFilters.inn;
      }

      let allResults: Plantation[] = [];
      let totalCount = 0;

      if (currentFilters.status === "all") {
        params.page_size = PAGE_SIZE_ALL;
        params.page = 1;

        const firstResponse = await fetchPlantationsMapAll(params, authState.accessToken);
        allResults = [...(firstResponse.results || [])];
        totalCount = firstResponse.count || 0;

        if (firstResponse.next) {
          params.page = 2;
          const secondResponse = await fetchPlantationsMapAll(params, authState.accessToken);
          allResults = [...allResults, ...(secondResponse.results || [])];
        }
      } else {
        const response = await fetchPlantationsMapAll(params, authState.accessToken);
        allResults = response.results || [];
        totalCount = response.count || 0;
      }

      setPlantations(allResults);
      setPagination({
        count: totalCount,
        next:
          currentFilters.status === "all"
            ? null
            : totalCount > allResults.length
            ? "next"
            : null,
        previous: null,
        currentPage: 1,
      });

      // Display plantations on map
      if (mapInstance) {
        mapInstance.eachLayer((layer) => {
          if (
            layer instanceof L.Polygon &&
            layer.options &&
            (layer.options as L.PolygonOptions).isPlantation
          ) {
            mapInstance.removeLayer(layer);
          }
        });

        allResults.forEach((plantation) => {
          if (
            !plantation.coordinates ||
            !Array.isArray(plantation.coordinates) ||
            plantation.coordinates.length === 0
          ) {
            return;
          }

          const coordinates = plantation.coordinates.map(
            (coord) => [coord.latitude, coord.longitude] as [number, number]
          );

          const color = getPlantationColor(plantation, currentFilters.status);

          const polygon = L.polygon(coordinates, {
            color,
            weight: 3,
            isPlantation: true,
          }).addTo(mapInstance);

          polygon.bindPopup(
            `<strong>${plantation.name || "Sarlavhasiz"}</strong><br>Площадь: ${
              plantation.total_area || 0
            } га`
          );

          polygon.on("click", () => {
            handlePlantationClick(plantation, mapInstance);
          });
        });
      }
    } catch (error) {
      console.error("Error fetching plantations:", error);

      const errorMessage = String((error as Error)?.message || "");
      if (errorMessage.includes("404")) {
        console.log("No plantations found for selected filters");
      } else if (errorMessage.includes("403")) {
        alert("❌ Ruxsat yo'q!\n\nBu tumanni ko'rish uchun ruxsatingiz yo'q.");
      } else if (errorMessage.includes("400")) {
        alert("❌ Noto'g'ri filtrlarni tekshiring.");
      } else {
        console.error("Plantation loading error:", error);
      }

      setPlantations([]);
    } finally {
      setLoadingPlantations(false);
    }
  };

  const handleFilterChange = useCallback(
    (key: keyof MapFilters, value: string): void => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleResetFilters = useCallback((): void => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const handleNavigateToPlantation = useCallback((): void => {
    if (!selectedPlantation) return;
    
    if (selectedRegion) saveToLocalStorage("mapSelectedRegion", selectedRegion);
    if (selectedDistrict) saveToLocalStorage("mapSelectedDistrict", selectedDistrict);
    
    navigate(`/plantations/${selectedPlantation.id}`, {
      state: { from: "/plantations/uz", previewPlantation: selectedPlantation },
    });
  }, [navigate, selectedDistrict, selectedPlantation, selectedRegion]);

  const handleNavigateToEdit = useCallback((): void => {
    if (!selectedPlantation) return;
    
    if (selectedRegion) saveToLocalStorage("mapSelectedRegion", selectedRegion);
    if (selectedDistrict) saveToLocalStorage("mapSelectedDistrict", selectedDistrict);
    
    navigate(`/plantations/edit/${selectedPlantation.id}`, {
      state: { from: "/plantations/uz" },
    });
  }, [navigate, selectedDistrict, selectedPlantation, selectedRegion]);

  // Initialize map hook
  const {
    mapRef,
    initializeMap,
    loadRegionGeoJSON,
    restoreRegionAndDistrict,
    loading,
    currentZoom,
  } = useMapsHook({
    onRegionClick: handleRegionClick,
    onDistrictClick: handleDistrictClick,
    onPlantationClick: handlePlantationClick,
    onMapLoad: handleMapLoad,
    accessToken: authState.accessToken,
    userRole: authState.userRole,
  });

  // Effects
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!selectedDistrict) return;

    const isSearchField = filters.name || filters.inn;
    const delay = isSearchField ? DEBOUNCE_DELAY_MS : 0;

    searchDebounceRef.current = setTimeout(() => {
      loadPlantationsRef.current?.(1, filters, selectedDistrict, selectedRegion);
    }, delay);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [
    selectedDistrict?.id,
    selectedRegion?.id,
    filters.status,
    filters.name,
    filters.inn,
    selectedDistrict,
    selectedRegion,
    filters,
  ]);

  useEffect(() => {
    if (!mapInstance || restoredRef.current) return;

    const savedRegion = getFromLocalStorage<SelectedRegion | null>("mapSelectedRegion", null);
    const savedDistrict = getFromLocalStorage<SelectedDistrict | null>(
      "mapSelectedDistrict",
      null
    );

    if (savedRegion && savedDistrict) {
      restoredRef.current = true;
      restoreRegionAndDistrict(
        savedRegion.id as string,
        savedDistrict.id,
        savedDistrict.name
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstance]);

  // Render helpers
  const renderLeftPanelContent = (): React.ReactNode => {
    if (loading) {
      return (
        <p className="text-gray-400 font-bold text-center">Yuklanmoqda...</p>
      );
    }

    if (!selectedRegion) {
      return (
        <h4 className="text-gray-300 font-bold text-center">Viloyatni tanlang</h4>
      );
    }

    if (!selectedDistrict) {
      return (
        <>
          <button
            type="button"
            className="mb-3 w-full bg-blue-500 font-bold text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            onClick={() => {
              setSelectedRegion(null);
              initializeMap();
            }}
          >
            Viloyatlarga qaytish
          </button>
          <h4 className="text-gray-300 font-bold text-center">
            Viloyat: {selectedRegion.name}
          </h4>
          <h4 className="text-gray-300 font-bold text-center">Tumanni tanlang</h4>
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          className="mb-3 w-full bg-blue-500 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => {
            handleRegionClick(selectedRegion.id, selectedRegion.name);
            loadRegionGeoJSON(selectedRegion.id as string);
          }}
        >
          Tumanlarga qaytish
        </button>
        <h4 className="text-gray-300 font-bold text-center mb-3">
          Bog'lar (
          {authState.userRole === "user"
            ? selectedRegion?.name || "Viloyat"
            : selectedDistrict.name}
          ):
        </h4>

        <MapDistrictStatsCard
          stats={districtStats}
          loading={loadingStats}
          paginationCount={pagination.count}
          compact={false}
          className="mb-4"
        />

        {loadingPlantations ? (
          <p className="text-gray-400 text-center">Yuklanmoqda...</p>
        ) : (
          <>
            <div className="space-y-2 mt-4">
              {plantations.length > 0 ? (
                plantations.map((plantation) => (
                  <div
                    key={plantation.id}
                    role="button"
                    tabIndex={0}
                    className="p-3 border border-gray-600 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => handlePlantationClick(plantation)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handlePlantationClick(plantation);
                      }
                    }}
                  >
                    <h5 className="text-white font-medium">
                      {plantation.name || "Sarlavhasiz"}
                    </h5>
                    <p className="text-gray-400 text-sm">
                      Maydoni: {plantation.total_area || 0} GA
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">
                  Hozircha bog'lar mavjud emas
                </p>
              )}
            </div>

            {pagination.count > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                {filters.status === "all" ? (
                  <span>
                    Jami: {plantations.length} / {pagination.count}
                  </span>
                ) : (
                  <>
                    <span>
                      {(pagination.currentPage - 1) * PAGE_SIZE_DEFAULT + 1} -{" "}
                      {Math.min(
                        pagination.currentPage * PAGE_SIZE_DEFAULT,
                        pagination.count
                      )}{" "}
                      / {pagination.count}
                    </span>
                    <div className="flex gap-2">
                      {pagination.previous && (
                        <button
                          type="button"
                          onClick={() =>
                            loadPlantationsRef.current?.(pagination.currentPage - 1)
                          }
                          className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                          aria-label="Oldingi sahifa"
                        >
                          ←
                        </button>
                      )}
                      {pagination.next && (
                        <button
                          type="button"
                          onClick={() =>
                            loadPlantationsRef.current?.(pagination.currentPage + 1)
                          }
                          className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                          aria-label="Keyingi sahifa"
                        >
                          →
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </>
    );
  };

  const renderPlantationDetail = (): React.ReactNode => {
    if (loadingPlantation) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-400 font-bold">Ma'lumotlar yuklanmoqda...</p>
        </div>
      );
    }

    if (!selectedPlantation) {
      return <p className="text-gray-400 font-bold text-center">Bog'ni tanlang</p>;
    }

    return (
      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
        <h2 className="text-lg font-bold mb-3 text-center text-white">
          {selectedPlantation.farmer?.name || "Sarlavhasiz"}
        </h2>
        <div className="space-y-3">
          {selectedPlantation.is_deleting && (
            <div className="mt-4 text-red-400 font-semibold">
              Oʻchirish uchun belgilangan
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Plantatsiya turi:</span>
            <span className="text-white font-medium">
              {selectedPlantation.land_type
                ? landTypeMapping[Number(selectedPlantation.land_type) as keyof typeof landTypeMapping] || selectedPlantation.land_type
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">STIR:</span>
            <span className="text-white font-medium">
              {selectedPlantation.farmer?.inn}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Maydon:</span>
            <span className="text-white font-medium">
              {selectedPlantation.total_area} га
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Mintaqa:</span>
            <span className="text-white font-medium">
              {selectedPlantation.district?.region}, {selectedPlantation.district?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Yaratilgan sana:</span>
            <span className="text-white font-medium">
              {selectedPlantation.farmer?.established_year}
            </span>
          </div>
        </div>

        {selectedPlantation.images && selectedPlantation.images.length > 0 && (
          <div className="mt-4">
            <h3 className="text-base font-semibold mb-2 text-white">Galereya:</h3>
            <div className="grid grid-cols-2 gap-2">
              {selectedPlantation.images.map((img, idx) => (
                <img
                  key={img.id || idx}
                  src={img.image_url}
                  alt={`${selectedPlantation.name || "Bog'"} - rasm ${idx + 1}`}
                  className="w-full h-24 object-cover border border-gray-600 rounded-md cursor-pointer"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}

        {selectedPlantation.fruit_areas && selectedPlantation.fruit_areas.length > 0 && (
          <div className="mt-4">
            <h3 className="text-base font-semibold mb-2 text-white">Mevalar:</h3>
            <div className="space-y-2">
              {selectedPlantation.fruit_areas.map((fruit, idx) => (
                <div
                  key={fruit.id || idx}
                  className="text-sm border-b border-gray-600 pb-2"
                >
                  <div className="flex justify-between">
                    <span className="text-gray-400">Meva:</span>
                    <span className="text-white font-medium">{fruit.fruit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sort:</span>
                    <span className="text-white font-medium">{fruit.variety}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Maydon:</span>
                    <span className="text-white font-medium">{fruit.area} ga</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <button
            type="button"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            onClick={handleNavigateToPlantation}
          >
            Batafsil
          </button>
          {authState.userRole === "superuser" && (
            <button
              type="button"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors ml-2"
              onClick={handleNavigateToEdit}
            >
              Tahrirlash
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-800 shadow-lg p-4 border-b border-gray-700 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div
            role="button"
            tabIndex={0}
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/");
            }}
          >
            <img
              className="h-10 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                Agrosanoatni rivojlantirish agentligi
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              className="px-2 py-1 border border-gray-600 text-white rounded text-xs flex items-center"
              aria-label="Ko'rish rejimi"
            >
              <svg
                className="w-3 h-3 mr-1 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ko'rish
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              aria-label={isMobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="mt-4 space-y-2" aria-label="Mobil navigatsiya">
            <Link
              to="/plantations/uz"
              className="block w-full bg-green-500 text-white py-2 rounded-lg font-medium text-center hover:bg-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bog'larga o'tish
            </Link>
            {authState.userRole !== "user" && (
              <>
                <Link
                  to={
                    authState.userRole === "headof_region"
                      ? "/statistics/controllers"
                      : "/statistics/regions"
                  }
                  className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  To'liq statistika
                </Link>
                <Link
                  to="/farmers"
                  className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Fermerlar
                </Link>
                <Link
                  to="/moderation"
                  className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Moderatsiya
                </Link>
                {authState.userRole === "superuser" && (
                  <Link
                    to="/controllers"
                    className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Nazoratchilar
                  </Link>
                )}
              </>
            )}
          </nav>
        )}
      </div>

      {/* Desktop Filters */}
      {selectedDistrict && (
        <div className="hidden lg:block bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center gap-4 max-w-7xl mx-auto">
            <span className="text-gray-400 text-sm font-medium whitespace-nowrap">
              Filtrlar:
            </span>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-1.5 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              aria-label="Status filtri"
            >
              <option value="all">Barchasi (Rangli)</option>
              <option value="approved">Tasdiqlangan (Yashil)</option>
              <option value="pending">Moderatsiyada (Sariq)</option>
              <option value="rejected">Rad etilgan (Qizil)</option>
              <option value="deleting">O'chirilmoqda (To'q sariq)</option>
            </select>

            <input
              type="text"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              placeholder="Nomi bo'yicha qidirish..."
              className="px-3 py-1.5 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-48"
              aria-label="Nomi bo'yicha qidirish"
            />

            <input
              type="text"
              value={filters.inn}
              onChange={(e) => handleFilterChange("inn", e.target.value)}
              placeholder="STIR bo'yicha..."
              className="px-3 py-1.5 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-40"
              aria-label="STIR bo'yicha qidirish"
            />

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 text-sm transition-colors flex items-center gap-1"
              aria-label="Filtrlarni tozalash"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Tozalash
            </button>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div
        className="hidden lg:flex flex-1 px-3 gap-3"
        style={{ height: selectedDistrict ? "calc(100vh - 52px)" : "100vh" }}
      >
        {/* Left Panel */}
        <div className="w-64 p-4 border-r border-gray-700 bg-gray-800 shadow-lg overflow-y-auto rounded-md">
          <div className="mt-2">{renderLeftPanelContent()}</div>
        </div>

        {/* Map Panel */}
        <div className="flex-1 bg-gray-900 rounded-md overflow-hidden relative">
          <div
            id="map"
            ref={isLarge ? mapRef : null}
            role="application"
            aria-label="Interaktiv xarita"
            tabIndex={0}
            className="w-full h-screen focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          />

          {/* Zoom Indicator */}
          <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700 z-[1000]">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Zoom:</span>
              <span className="text-white font-bold">
                {currentZoom?.toFixed(1) || "6.0"}
              </span>
              {currentZoom >= 12 && (
                <span className="text-green-400 text-xs ml-2">
                  • To'ldirish o'chirilgan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/4 p-4 border-l border-gray-700 bg-gray-800 shadow-lg overflow-y-auto rounded-md">
          <div className="space-y-4" />
          <div className="mt-6">{renderPlantationDetail()}</div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-3 text-center">
            Bog'lar xaritasi
          </h2>

          <div className="w-full h-64 mb-4 border border-gray-700 rounded-md overflow-hidden">
            <div
              ref={!isLarge ? mapRef : null}
              role="application"
              aria-label="Interaktiv xarita"
              className="w-full h-full"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-400 font-bold text-center">Yuklanmoqda...</p>
            ) : !selectedRegion ? (
              <h4 className="text-gray-300 font-bold text-center">
                Viloyatni tanlang
              </h4>
            ) : !selectedDistrict ? (
              <>
                <button
                  type="button"
                  className="w-full bg-blue-500 font-bold text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    removeFromLocalStorage("mapSelectedRegion");
                    removeFromLocalStorage("mapSelectedDistrict");
                    setSelectedRegion(null);
                    initializeMap();
                  }}
                >
                  Viloyatlarga qaytish
                </button>
                <h4 className="text-gray-300 font-bold text-center">
                  Viloyat: {selectedRegion.name}
                </h4>
                <h4 className="text-gray-300 font-bold text-center">
                  Tumanni tanlang
                </h4>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="w-full bg-blue-500 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    handleRegionClick(selectedRegion.id, selectedRegion.name);
                    loadRegionGeoJSON(selectedRegion.id as string);
                  }}
                >
                  Tumanlarga qaytish
                </button>
                <h4 className="text-gray-300 font-bold text-center mb-3">
                  Bog'lar (
                  {authState.userRole === "user"
                    ? selectedRegion?.name || "Viloyat"
                    : selectedDistrict.name}
                  ):
                </h4>

                <MapDistrictStatsCard
                  stats={districtStats}
                  loading={loadingStats}
                  paginationCount={pagination.count}
                  compact
                  className="mb-4"
                />

                {/* Mobile Filters */}
                <div className="mb-4 p-2 bg-gray-700 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange("status", e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                      aria-label="Status filtri"
                    >
                      <option value="all">Barchasi</option>
                      <option value="approved">Tasdiqlangan</option>
                      <option value="pending">Moderatsiyada</option>
                      <option value="rejected">Rad etilgan</option>
                      <option value="deleting">O'chirilmoqda</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
                      aria-label="Filtrlarni tozalash"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    placeholder="Nomi yoki STIR..."
                    className="w-full px-2 py-1.5 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                    aria-label="Nomi yoki STIR bo'yicha qidirish"
                  />
                </div>

                {loadingPlantations ? (
                  <p className="text-gray-400 text-center">Yuklanmoqda...</p>
                ) : (
                  <>
                    <div className="space-y-2 mt-4">
                      {plantations.length > 0 ? (
                        plantations.map((plantation) => (
                          <div
                            key={plantation.id}
                            role="button"
                            tabIndex={0}
                            className="p-3 border border-gray-600 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                            onClick={() => handlePlantationClick(plantation)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handlePlantationClick(plantation);
                              }
                            }}
                          >
                            <h5 className="text-white font-medium">
                              {plantation.name || "Sarlavhasiz"}
                            </h5>
                            <p className="text-gray-400 text-sm">
                              Maydoni: {plantation.total_area || 0} GA
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center">
                          Hozircha bog'lar mavjud emas
                        </p>
                      )}
                    </div>

                    {pagination.count > 0 && (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                        {filters.status === "all" ? (
                          <span>
                            Jami: {plantations.length} / {pagination.count}
                          </span>
                        ) : (
                          <>
                            <span>
                              {(pagination.currentPage - 1) * PAGE_SIZE_DEFAULT + 1} -{" "}
                              {Math.min(
                                pagination.currentPage * PAGE_SIZE_DEFAULT,
                                pagination.count
                              )}{" "}
                              / {pagination.count}
                            </span>
                            <div className="flex gap-2">
                              {pagination.previous && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    loadPlantationsRef.current?.(
                                      pagination.currentPage - 1
                                    )
                                  }
                                  className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                                  aria-label="Oldingi sahifa"
                                >
                                  ←
                                </button>
                              )}
                              {pagination.next && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    loadPlantationsRef.current?.(
                                      pagination.currentPage + 1
                                    )
                                  }
                                  className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                                  aria-label="Keyingi sahifa"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;

