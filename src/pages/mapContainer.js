import React, { useState, useContext, useEffect, useRef } from "react";
import { useMapsHook } from "./mapsHook";
import L from "leaflet"; // Для работы с координатами на карте
import { useNavigate, Link } from "react-router-dom";
import { fetchPlantationsMap } from "../api/api.js";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import { landTypeMapping } from "../context/constants";
import AuthContext from "../context/AuthContext";
import { apiRequest } from "../utils/apiUtils";

export default function MapContainer() {
  const navigate = useNavigate();
  const { authState, logout, refreshAccessToken } = useContext(AuthContext);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [plantations, setPlantations] = useState([]);
  const [selectedPlantation, setSelectedPlantation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null); // Ссылка на карту для работы с координатами
  const [loadingPlantation, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLarge =
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Инициализация карты
  const handleMapLoad = (map) => {
    setMapInstance(map);
  };

  const handleRegionClick = (regionId, regionName) => {
    const region = { id: regionId, name: regionName };
    setSelectedRegion(region);
    try {
      localStorage.setItem('mapSelectedRegion', JSON.stringify(region));
      localStorage.removeItem('mapSelectedDistrict');
    } catch (e) {}
    setSelectedDistrict(null);
    setPlantations([]);
    setSelectedPlantation(null);
  };

  const handleDistrictClick = async (districtId, districtName = "Tumani") => {
    const district = { id: districtId, name: districtName };
    setSelectedDistrict(district);
    try {
      localStorage.setItem('mapSelectedDistrict', JSON.stringify(district));
    } catch (e) {}
    setSelectedPlantation(null);

    try {
      const plantations = await fetchPlantationsMap(districtId, authState.accessToken);
      setPlantations(plantations);

      // Отображение координат на карте
      if (mapInstance) {
        // Удаляем только полигоны плантаций, но оставляем границы района
        mapInstance.eachLayer((layer) => {
          if (layer instanceof L.Polygon && layer.options && layer.options.isPlantation) {
            mapInstance.removeLayer(layer);
          }
        });

        plantations.forEach((plantation) => {
          const coordinates = plantation.coordinates.map((coord) => [
            coord.latitude,
            coord.longitude,
          ]);

          // Добавляем полигон или маркер на карту
          const polygon = L.polygon(coordinates, {
            color: "red",
            weight: 2,
            isPlantation: true, // Флаг для идентификации полигонов плантаций
          }).addTo(mapInstance);

          polygon.bindPopup(
            `<strong>${plantation.name || "Sarlavhasiz"}</strong><br>Площадь: ${
              plantation.total_area
            } га`
          );
        });
      }
    } catch (error) {
      console.error("Error fetching plantations:", error);
    }
  };

  const handlePlantationClick = async (plantation, map) => {
    setLoading(true);
    try {
      const data = await apiRequest(`api/plantations/${plantation.id}/`, {}, refreshAccessToken, authState.accessToken);
      setSelectedPlantation(data);
      const karta = map || mapInstance;
      const coordinates = data.coordinates.map((coord) => [
        coord.latitude,
        coord.longitude,
      ]);
      karta.fitBounds(L.polygon(coordinates).getBounds());
    } catch (error) {
      console.error("Error fetching plantation details:", error);
    } finally {
      setLoading(false);
    }
  };

  const { mapRef, initializeMap, loadRegionGeoJSON, restoreRegionAndDistrict, loading } = useMapsHook({
    onRegionClick: handleRegionClick,
    onDistrictClick: handleDistrictClick,
    onPlantationClick: handlePlantationClick,
    onMapLoad: handleMapLoad,
    accessToken: authState.accessToken,
  });
  const restoredRef = useRef(false);
  useEffect(() => {
    if (!mapInstance || restoredRef.current) return;
    try {
      const savedRegion = JSON.parse(localStorage.getItem('mapSelectedRegion') || 'null');
      const savedDistrict = JSON.parse(localStorage.getItem('mapSelectedDistrict') || 'null');
      if (savedRegion && savedDistrict) {
        restoredRef.current = true;
        restoreRegionAndDistrict(savedRegion.id, savedDistrict.id, savedDistrict.name);
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstance]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Мобильное меню */}
      <div className="lg:hidden bg-gray-800 shadow-lg p-4 border-b border-gray-700 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
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
            <button className="px-2 py-1 border border-gray-600 text-white rounded text-xs flex items-center">
              <svg
                className="w-3 h-3 mr-1 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ko'rish
            </button>
            <button
              onClick={handleLogout}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs flex items-center"
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
              Chiqish
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

        {/* Мобильное меню выпадающее */}
        {isMobileMenuOpen && (
          <div className="mt-4 space-y-2">
            <Link
              to="/plantations/uz"
              className="block w-full bg-green-500 text-white py-2 rounded-lg font-medium text-center hover:bg-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bog'larga o'tish
            </Link>
            <Link
              to="/statistics/regions"
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
              to="/contacts"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Kontaktlar
            </Link>
            <Link
              to="/moderation"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Moderatsiya
            </Link>
            <Link
              to="/controllers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Nazoratchilar
            </Link>
          </div>
        )}
      </div>

      {/* Десктопная версия */}
      <div className="hidden lg:flex h-screen px-3 gap-3">
        {/* Левая панель (только список/контент) */}
        <div className="w-64 p-4 border-r border-gray-700 bg-gray-800 shadow-lg overflow-y-auto rounded-md">
          {/* Контент левой панели */}
          <div className="mt-2">
            {loading ? (
              <p className="text-gray-400 font-bold text-center">
                Yuklanmoqda...
              </p>
            ) : !selectedRegion ? (
              <h4 className="text-gray-300 font-bold text-center">
                Viloyatni tanlang
              </h4>
            ) : !selectedDistrict ? (
              <>
                <button
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
                <h4 className="text-gray-300 font-bold text-center">
                  Tumanni tanlang
                </h4>
              </>
            ) : (
              <>
                <button
                  className="mb-3 w-full bg-blue-500 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    handleRegionClick(selectedRegion.id, selectedRegion.name);
                    loadRegionGeoJSON(selectedRegion.id);
                  }}
                >
                  Tumanlarga qaytish
                </button>
                <h4 className="text-gray-300 font-bold text-center">
                  Bog'lar ({selectedDistrict.name}):
                </h4>
                <div className="space-y-2 mt-4">
                  {plantations.length > 0 ? (
                    plantations.map((plantation) => (
                      <div
                        key={plantation.id}
                        className="p-3 border border-gray-600 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => handlePlantationClick(plantation)}
                      >
                        <h5 className="text-white font-medium">
                          {plantation.name || "Sarlavhasiz"}
                        </h5>
                        <p className="text-gray-400 text-sm">
                          Maydoni: {plantation.total_area} GA
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center">
                      Hozircha bog'lar mavjud emas
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Центральная панель с картой */}
        <div className="flex-1 bg-gray-900 rounded-md overflow-hidden">
          <div
            id="map"
            ref={isLarge ? mapRef : null}
            style={{ width: "100%", height: "100vh" }}
          ></div>
        </div>

        {/* Правая панель */}
        <div className="w-1/4 p-4 border-l border-gray-700 bg-gray-800 shadow-lg overflow-y-auto rounded-md">
          <div className="space-y-4">
            {/* Kontaktlar перенесены в компактную панель, ссылка убрана */}
            <button
              onClick={handleLogout}
              className="block w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Chiqish
            </button>
          </div>

          {/* Контент правой панели */}
          <div className="mt-6">
            {loadingPlantation ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-400 font-bold">
                  Ma'lumotlar yuklanmoqda...
                </p>
              </div>
            ) : !selectedPlantation ? (
              <p className="text-gray-400 font-bold text-center">
                Bog'ni tanlang
              </p>
            ) : (
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h2 className="text-xl font-bold mb-4 text-center text-white">
                  {selectedPlantation.farmer?.name || "Sarlavhasiz"}
                </h2>
                <div className="space-y-3">
                  {/* Статус удаления */}
                  {selectedPlantation.is_deleting && (
                    <div className="mt-4 text-red-400 font-semibold">
                      Oʻchirish uchun belgilangan
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plantatsiya turi:</span>
                    <span className="text-white font-medium">
                      {landTypeMapping[selectedPlantation.land_type]}
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
                      {selectedPlantation.district?.region},{" "}
                      {selectedPlantation.district?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Yaratilgan sana:</span>
                    <span className="text-white font-medium">
                      {selectedPlantation.farmer?.established_year}
                    </span>
                  </div>
                </div>

                {/* Галерея */}
                {selectedPlantation.images?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">
                      Galereya:
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPlantation.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Изображение ${idx + 1}`}
                          className="w-full h-24 object-cover border border-gray-600 rounded-md cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Площади фруктов */}
                {selectedPlantation.fruit_areas?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">
                      Mevalar:
                    </h3>
                    <div className="space-y-2">
                      {selectedPlantation.fruit_areas.map((fruit, idx) => (
                        <div
                          key={idx}
                          className="text-sm border-b border-gray-600 pb-2"
                        >
                          <div className="flex justify-between">
                            <span className="text-gray-400">Meva:</span>
                            <span className="text-white font-medium">
                              {fruit.fruit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Sort:</span>
                            <span className="text-white font-medium">
                              {fruit.variety}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Maydon:</span>
                            <span className="text-white font-medium">
                              {fruit.area} ga
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-center mt-4">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    onClick={() => {
                      try {
                        if (selectedRegion) localStorage.setItem('mapSelectedRegion', JSON.stringify(selectedRegion));
                        if (selectedDistrict) localStorage.setItem('mapSelectedDistrict', JSON.stringify(selectedDistrict));
                      } catch (e) {}
                      navigate(`/plantations/${selectedPlantation.id}`, { state: { from: '/plantations/uz' } });
                    }}
                  >
                    Batafsil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Bog'lar xaritasi
          </h2>

          {/* Контейнер карты для мобильной версии */}
          <div className="w-full h-64 mb-4 border border-gray-700 rounded-md overflow-hidden">
            <div
              ref={!isLarge ? mapRef : null}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-400 font-bold text-center">
                Yuklanmoqda...
              </p>
            ) : !selectedRegion ? (
              <h4 className="text-gray-300 font-bold text-center">
                Viloyatni tanlang
              </h4>
            ) : !selectedDistrict ? (
              <>
                <button
                  className="w-full bg-blue-500 font-bold text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    try {
                      localStorage.removeItem('mapSelectedRegion');
                      localStorage.removeItem('mapSelectedDistrict');
                    } catch (e) {}
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
                  className="w-full bg-blue-500 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    handleRegionClick(selectedRegion.id, selectedRegion.name);
                    loadRegionGeoJSON(selectedRegion.id);
                  }}
                >
                  Tumanlarga qaytish
                </button>
                <h4 className="text-gray-300 font-bold text-center">
                  Bog'lar ({selectedDistrict.name}):
                </h4>
                <div className="space-y-2 mt-4">
                  {plantations.length > 0 ? (
                    plantations.map((plantation) => (
                      <div
                        key={plantation.id}
                        className="p-3 border border-gray-600 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => handlePlantationClick(plantation)}
                      >
                        <h5 className="text-white font-medium">
                          {plantation.name || "Sarlavhasiz"}
                        </h5>
                        <p className="text-gray-400 text-sm">
                          Maydoni: {plantation.total_area} GA
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center">
                      Hozircha bog'lar mavjud emas
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
