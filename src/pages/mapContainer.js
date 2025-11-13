import React, { useState, useContext, useEffect, useRef } from "react";
import { useMapsHook } from "./mapsHook";
import L from "leaflet"; // Для работы с координатами на карте
import { useNavigate, Link } from "react-router-dom";
import { fetchPlantationsMapAll } from "../api/api.js";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import { landTypeMapping } from "../context/constants";
import AuthContext from "../context/AuthContext";
import { apiRequest } from "../utils/apiUtils";

export default function MapContainer() {
  const navigate = useNavigate();
  const { authState, refreshAccessToken } = useContext(AuthContext);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [plantations, setPlantations] = useState([]);
  const [selectedPlantation, setSelectedPlantation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null); // Ссылка на карту для работы с координатами
  const [loadingPlantation, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLarge =
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
  
  // Фильтры для нового эндпоинта
  const [filters, setFilters] = useState({
    status: 'all', // all, approved, rejected, pending, moderation, deleting
    region: '',
    district_id: null,
    plantation_type: '',
    name: '',
    inn: '',
  });
  const [loadingPlantations, setLoadingPlantations] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
  });


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
    setSelectedDistrict(null); // Сбрасываем выбранный район
    setPlantations([]); // Очищаем список плантаций
    setSelectedPlantation(null); // Очищаем выбранную плантацию
    // Сбрасываем фильтры при смене региона
    setFilters(prev => ({
      ...prev,
      district_id: null,
      region: regionName,
    }));
  };

  // Функция загрузки плантаций через новый эндпоинт
  const loadPlantationsRef = useRef(null);
  loadPlantationsRef.current = async (page = 1, currentFilters = filters, currentDistrict = selectedDistrict, currentRegion = selectedRegion) => {
    if (!currentDistrict && !currentRegion) {
      setPlantations([]);
      return;
    }

    // Предотвращаем множественные одновременные запросы
    if (loadingPlantations) {
      return;
    }

    setLoadingPlantations(true);
    try {
      const params = {
        page,
        page_size: 100,
        returnFullResponse: true,
      };

      // Применяем фильтры согласно документации
      // status: all, approved, rejected, pending/moderation, deleting
      // Явно передаем status, даже если это 'all', чтобы получить все плантации
      if (currentFilters.status) {
        params.status = currentFilters.status;
      }
      
      // Если выбран район - передаем только district_id (не передаем region)
      // Если выбран только регион - передаем только region
      if (currentDistrict) {
        params.district_id = currentDistrict.id;
        // Не передаем region когда есть district_id, так как район уже определяет регион
      } else if (currentRegion) {
        // Если выбран только регион (без района), передаем его название
        params.region = currentRegion.name;
      }
      
      // Дополнительные фильтры
      if (currentFilters.plantation_type) {
        params.plantation_type = currentFilters.plantation_type;
      }
      
      if (currentFilters.name) {
        params.name = currentFilters.name;
      }
      
      if (currentFilters.inn) {
        params.inn = currentFilters.inn;
      }

      // Для "Barchasi" используем большой page_size и загружаем все страницы за минимальное количество запросов
      let allResults = [];
      let totalCount = 0;
      
      if (currentFilters.status === 'all') {
        // Используем максимальный page_size для минимизации количества запросов
        params.page_size = 10000;
        params.page = 1;
        
        // Загружаем первую страницу
        const firstResponse = await fetchPlantationsMapAll(params, authState.accessToken);
        allResults = [...(firstResponse.results || [])];
        totalCount = firstResponse.count || 0;
        
        // Если есть еще данные, загружаем следующую страницу
        if (firstResponse.next) {
          params.page = 2;
          const secondResponse = await fetchPlantationsMapAll(params, authState.accessToken);
          allResults = [...allResults, ...(secondResponse.results || [])];
        }
      } else {
        // Для других фильтров используем стандартную пагинацию
        const response = await fetchPlantationsMapAll(params, authState.accessToken);
        allResults = response.results || [];
        totalCount = response.count || 0;
      }

      setPlantations(allResults);
      setPagination({
        count: totalCount,
        next: currentFilters.status === 'all' ? null : (totalCount > allResults.length ? 'next' : null),
        previous: null,
        currentPage: 1,
      });

      // Отображение координат на карте
      if (mapInstance) {
        // Удаляем только полигоны плантаций, но оставляем границы района
        mapInstance.eachLayer((layer) => {
          if (layer instanceof L.Polygon && layer.options && layer.options.isPlantation) {
            mapInstance.removeLayer(layer);
          }
        });

        const plantationsToShow = allResults;
        
        plantationsToShow.forEach((plantation) => {
          if (!plantation.coordinates || !Array.isArray(plantation.coordinates) || plantation.coordinates.length === 0) {
            return;
          }

          const coordinates = plantation.coordinates.map((coord) => [
            coord.latitude,
            coord.longitude,
          ]);

          // Определяем цвет в зависимости от статуса плантации
          let color = "yellow"; // По умолчанию желтый (на модерации)
          
          // Если выбран конкретный фильтр - используем соответствующий цвет для всех
          if (currentFilters.status === 'approved') {
            color = "green";
          } else if (currentFilters.status === 'rejected') {
            color = "red";
          } else if (currentFilters.status === 'deleting') {
            color = "orange";
          } else if (currentFilters.status === 'pending' || currentFilters.status === 'moderation') {
            color = "yellow";
          } else if (currentFilters.status === 'all') {
            // Для "Barchasi" определяем цвет по реальным полям плантации из API
            if (plantation.is_checked === true && plantation.is_rejected === false && plantation.is_deleting === false) {
              color = "green"; // Проверено и одобрено (зеленый)
            } else if (plantation.is_rejected === true) {
              color = "red"; // Отклонено (красный)
            } else if (plantation.is_deleting === true) {
              color = "orange"; // В процессе удаления (оранжевый)
            } else if (plantation.is_checked === false && plantation.is_rejected === false && plantation.is_deleting === false) {
              color = "yellow"; // На модерации - не проверено и не отклонено (желтый)
            }
          }

          // Добавляем полигон или маркер на карту
          const polygon = L.polygon(coordinates, {
            color: color,
            weight: 3,
            isPlantation: true, // Флаг для идентификации полигонов плантаций
          }).addTo(mapInstance);

          polygon.bindPopup(
            `<strong>${plantation.name || "Sarlavhasiz"}</strong><br>Площадь: ${
              plantation.total_area || 0
            } га`
          );
          
          // Добавляем обработчик клика для загрузки детальной информации
          polygon.on('click', () => {
            handlePlantationClick(plantation, mapInstance);
          });
        });
      }
    } catch (error) {
      console.error("Error fetching plantations:", error);
      
      // Показываем пользователю понятное сообщение об ошибке только если это не пустой результат
      const errorMessage = String(error?.message || '');
      if (errorMessage.includes('404')) {
        // Не показываем ошибку для 404, это может быть нормально (нет данных)
        console.log('No plantations found for selected filters');
      } else if (errorMessage.includes('403')) {
        alert('❌ Ruxsat yo\'q!\n\nBu tumanni ko\'rish uchun ruxsatingiz yo\'q.');
      } else if (errorMessage.includes('400')) {
        alert('❌ Noto\'g\'ri filtrlarni tekshiring.');
      } else {
        // Показываем ошибку только для реальных проблем
        console.error('Plantation loading error:', error);
      }
      
      // Очищаем плантации при ошибке
      setPlantations([]);
    } finally {
      setLoadingPlantations(false);
    }
  };

  // Debounce для поисковых полей
  const searchDebounceRef = useRef(null);
  
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Загружаем плантации ТОЛЬКО если выбран район (туман), не загружаем для региона
    if (!selectedDistrict) {
      return;
    }
    
    // Для поисковых полей используем debounce, для остальных фильтров - сразу
    const isSearchField = filters.name || filters.inn;
    const delay = isSearchField ? 500 : 0;
    
    searchDebounceRef.current = setTimeout(() => {
      loadPlantationsRef.current(1, filters, selectedDistrict, selectedRegion);
    }, delay);
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [selectedDistrict?.id, selectedRegion?.id, filters.status, filters.plantation_type, filters.region, filters.name, filters.inn]);

  const handleDistrictClick = async (districtId, districtName = "Tumani") => {
    const district = { id: districtId, name: districtName };
    setSelectedDistrict(district);
    try {
      localStorage.setItem('mapSelectedDistrict', JSON.stringify(district));
    } catch (e) {}
    setSelectedPlantation(null);
    // Обновляем фильтр district_id
    setFilters(prev => ({ ...prev, district_id: districtId }));
  };

  const handlePlantationClick = async (plantation, map) => {
    setLoading(true);
    try {
      // Для наблюдателя: показываем превью сразу по данным из карты,
      // затем молча пытаемся дозагрузить детали (без алертов при отказе)
      if (authState.userRole === "observer") {
        const karta = map || mapInstance;
        const coordsSimple = (plantation.coordinates || []).map((c) => [c.latitude, c.longitude]);
        if (coordsSimple.length && karta) {
          try { karta.fitBounds(L.polygon(coordsSimple).getBounds()); } catch (e) {}
        }
        // моментально показать превью
        setSelectedPlantation(plantation);
        try {
          const detailed = await apiRequest(`api/plantations/${plantation.id}/`, {}, refreshAccessToken, authState.accessToken);
          setSelectedPlantation(detailed);
        } catch (e) {
          // тихо игнорируем 403/404 для observer
        }
        return;
      }

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
      
      // Показываем пользователю понятное сообщение об ошибке
      if (authState.userRole === "observer") {
        // не тревожим наблюдателя — оставляем текущее превью
      } else if (error.message && error.message.includes('404')) {
        alert('❌ Bu bog\'ga kirish huquqi yo\'q!\n\nSiz faqat o\'z viloyatingizdagi bog\'larni ko\'rishingiz mumkin.');
      } else if (error.message && error.message.includes('403')) {
        alert('❌ Ruxsat yo\'q!\n\nBu bog\'ni ko\'rish uchun ruxsatingiz yo\'q.');
      } else {
        alert('❌ Xatolik!\n\nBog\' ma\'lumotlarini yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
      }
      
      // Очищаем выбранную плантацию при ошибке
      if (authState.userRole !== "observer") {
      setSelectedPlantation(null);
      }
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
    userRole: authState.userRole,
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
            {/* RBAC: скрываем недоступные пункты для обычного пользователя */}
            {authState.userRole !== "user" && (
              <>
                <Link
                  to={authState.userRole === "headof_region" ? "/statistics/controllers" : "/statistics/regions"}
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
                <h4 className="text-gray-300 font-bold text-center mb-3">
                  Bog'lar ({authState.userRole === "user" ? selectedRegion?.name || "Viloyat" : selectedDistrict.name}):
                </h4>
                
                {/* Фильтры */}
                <div className="space-y-2 mb-4 p-2 bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Status:
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                  >
                    <option value="all">Barchasi (Rangli)</option>
                    <option value="approved">Tasdiqlangan (Yashil)</option>
                    <option value="pending">Moderatsiyada (Sariq)</option>
                    <option value="rejected">Rad etilgan (Qizil)</option>
                    <option value="deleting">O'chirilmoqda (To'q sariq)</option>
                  </select>
                  
                  <label className="block text-sm font-medium text-gray-300 mb-1 mt-2">
                    Nomi:
                  </label>
                  <input
                    type="text"
                    value={filters.name}
                    onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Qidirish..."
                    className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                  />
                  
                  <label className="block text-sm font-medium text-gray-300 mb-1 mt-2">
                    STIR:
                  </label>
                  <input
                    type="text"
                    value={filters.inn}
                    onChange={(e) => setFilters(prev => ({ ...prev, inn: e.target.value }))}
                    placeholder="STIR..."
                    className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                  />
                  
                  <button
                    onClick={() => setFilters({
                      status: 'all',
                      region: '',
                      district_id: null,
                      plantation_type: '',
                      name: '',
                      inn: '',
                    })}
                    className="w-full mt-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
                  >
                    Filtrlarni tozalash
                  </button>
                </div>

                {loadingPlantations ? (
                  <p className="text-gray-400 text-center">Yuklanmoqda...</p>
                ) : (
                  <>
                    <div className="space-y-2 mt-4">
                      {plantations.length > 0 ? (
                        <>
                          {plantations.map((plantation) => (
                            <div
                              key={plantation.id}
                              className="p-3 border border-gray-600 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                              onClick={() => handlePlantationClick(plantation)}
                            >
                              <h5 className="text-white font-medium">
                                {plantation.name || "Sarlavhasiz"}
                              </h5>
                              <p className="text-gray-400 text-sm">
                                Maydoni: {plantation.total_area || 0} GA
                              </p>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="text-gray-400 text-center">
                          Hozircha bog'lar mavjud emas
                        </p>
                      )}
                    </div>
                    
                    {/* Пагинация */}
                    {pagination.count > 0 && (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                        {filters.status === 'all' ? (
                          <span>
                            Jami: {plantations.length} / {pagination.count}
                          </span>
                        ) : (
                          <>
                            <span>
                              {((pagination.currentPage - 1) * 100) + 1} - {Math.min(pagination.currentPage * 100, pagination.count)} / {pagination.count}
                            </span>
                            <div className="flex gap-2">
                              {pagination.previous && (
                                <button
                                  onClick={() => loadPlantationsRef.current(pagination.currentPage - 1)}
                                  className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                                >
                                  ←
                                </button>
                              )}
                              {pagination.next && (
                                <button
                                  onClick={() => loadPlantationsRef.current(pagination.currentPage + 1)}
                                  className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
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
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <h2 className="text-lg font-bold mb-3 text-center text-white">
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
                  <div className="mt-4">
                    <h3 className="text-base font-semibold mb-2 text-white">
                      Galereya:
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPlantation.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.image_url}
                          alt={`Изображение ${idx + 1}`}
                          className="w-full h-24 object-cover border border-gray-600 rounded-md cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Площади фруктов */}
                {selectedPlantation.fruit_areas?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-base font-semibold mb-2 text-white">
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
                      navigate(`/plantations/${selectedPlantation.id}`, { state: { from: '/plantations/uz', previewPlantation: selectedPlantation } });
                    }}
                  >
                    Batafsil
                  </button>
                  {/* RBAC: кнопка редактирования только для superuser */}
                  {authState.userRole === "superuser" && (
                    <>
                      <button
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors ml-2"
                        onClick={() => {
                          try {
                            if (selectedRegion) localStorage.setItem('mapSelectedRegion', JSON.stringify(selectedRegion));
                            if (selectedDistrict) localStorage.setItem('mapSelectedDistrict', JSON.stringify(selectedDistrict));
                          } catch (e) {}
                          navigate(`/plantations/edit/${selectedPlantation.id}`, { state: { from: '/plantations/uz' } });
                        }}
                      >
                        Tahrirlash
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-3 text-center">
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
                <h4 className="text-gray-300 font-bold text-center mb-3">
                  Bog'lar ({authState.userRole === "user" ? selectedRegion?.name || "Viloyat" : selectedDistrict.name}):
                </h4>
                
                {/* Фильтры для мобильной версии */}
                <div className="space-y-2 mb-4 p-2 bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Status:
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                  >
                    <option value="all">Barchasi (Rangli)</option>
                    <option value="approved">Tasdiqlangan (Yashil)</option>
                    <option value="pending">Moderatsiyada (Sariq)</option>
                    <option value="rejected">Rad etilgan (Qizil)</option>
                    <option value="deleting">O'chirilmoqda (To'q sariq)</option>
                  </select>
                  
                  <label className="block text-sm font-medium text-gray-300 mb-1 mt-2">
                    Nomi:
                  </label>
                  <input
                    type="text"
                    value={filters.name}
                    onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Qidirish..."
                    className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                  />
                  
                  <label className="block text-sm font-medium text-gray-300 mb-1 mt-2">
                    STIR:
                  </label>
                  <input
                    type="text"
                    value={filters.inn}
                    onChange={(e) => setFilters(prev => ({ ...prev, inn: e.target.value }))}
                    placeholder="STIR..."
                    className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                  />
                  
                  <button
                    onClick={() => setFilters({
                      status: 'all',
                      region: '',
                      district_id: null,
                      plantation_type: '',
                      name: '',
                      inn: '',
                    })}
                    className="w-full mt-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
                  >
                    Filtrlarni tozalash
                  </button>
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
                            className="p-3 border border-gray-600 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                            onClick={() => handlePlantationClick(plantation)}
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
                    
                    {/* Пагинация для мобильной версии */}
                    {pagination.count > 0 && (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                        {filters.status === 'all' ? (
                          <span>
                            Jami: {plantations.length} / {pagination.count}
                          </span>
                        ) : (
                          <>
                            <span>
                              {((pagination.currentPage - 1) * 100) + 1} - {Math.min(pagination.currentPage * 100, pagination.count)} / {pagination.count}
                            </span>
                            <div className="flex gap-2">
                              {pagination.previous && (
                                <button
                                  onClick={() => loadPlantationsRef.current(pagination.currentPage - 1)}
                                  className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                                >
                                  ←
                                </button>
                              )}
                              {pagination.next && (
                                <button
                                  onClick={() => loadPlantationsRef.current(pagination.currentPage + 1)}
                                  className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
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
}
