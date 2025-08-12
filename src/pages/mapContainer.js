import React, { useState, useContext, useEffect } from "react";
import { useMapsHook } from "./mapsHook";
import L from "leaflet"; // Для работы с координатами на карте
import { API_BASE_URL2 } from "../config";
import { useNavigate, Link } from "react-router-dom";
import { fetchPlantationsMap } from "../api/api.js";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import { landTypeMapping } from "../context/constants";
import AuthContext from "../context/AuthContext";

export default function MapContainer() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [plantations, setPlantations] = useState([]);
  const [selectedPlantation, setSelectedPlantation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null); // Ссылка на карту для работы с координатами
  const [loadingPlantation, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLarge = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Инициализация карты
  const handleMapLoad = (map) => {
    setMapInstance(map);
  };

  const handleRegionClick = (regionId, regionName) => {
    setSelectedRegion({ id: regionId, name: regionName });
    setSelectedDistrict(null);
    setPlantations([]);
    setSelectedPlantation(null);
  };

  const handleDistrictClick = async (
    districtId = 1,
    districtName = "Tumani"
  ) => {
    setSelectedDistrict({ id: 1, name: districtName }); // Жестко задаем district_id=1
    setSelectedPlantation(null);

    try {
      const plantations = await fetchPlantationsMap();
      setPlantations(plantations);

      // Отображение координат на карте
      if (mapInstance) {
        mapInstance.eachLayer((layer) => {
          if (layer instanceof L.Polygon || layer instanceof L.Marker) {
            mapInstance.removeLayer(layer); // Удаляем предыдущие полигоны/маркеры
          }
        });

        plantations.forEach((plantation) => {
          const coordinates = plantation.coordinates.map((coord) => [
            coord.latitude,
            coord.longitude,
          ]);

          // Добавляем полигон или маркер на карту
          const polygon = L.polygon(coordinates, {
            color: plantation.is_fertile ? "green" : "red",
            weight: 2,
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
      const response = await fetch(
        `${API_BASE_URL2}api/plantations/${plantation.id}/`
      );
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
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

  const { mapRef, initializeMap, loadRegionGeoJSON, loading } = useMapsHook({
    onRegionClick: handleRegionClick,
    onDistrictClick: handleDistrictClick,
    onPlantationClick: handlePlantationClick,
    onMapLoad: handleMapLoad,
  });

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
              <svg className="w-3 h-3 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ko'rish
            </button>
            <button 
              onClick={handleLogout}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Chiqish
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
      <div className="hidden lg:flex h-screen">
        {/* Левая панель */}
        <div className="w-1/4 p-4 border-r border-gray-700 bg-gray-800 shadow-lg overflow-y-auto">
          <div 
            className="flex justify-start items-center mb-5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <img
              className="h-20 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <p className="text-start font-extrabold text-white max-w-64">
              Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish
              agentligi
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/plantations/uz"
              className="block w-full bg-green-500 text-white py-3 rounded-lg font-medium text-center hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
              Bog'larga o'tish
            </Link>

            <Link
              to="/statistics/regions"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              To'liq statistika
            </Link>

            <Link
              to="/farmers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Fermerlar
            </Link>
          </div>

          {/* Контент левой панели */}
          <div className="mt-6">
            {loading ? (
              <p className="text-gray-400 font-bold text-center">Yuklanmoqda...</p>
            ) : !selectedRegion ? (
              <h4 className="text-gray-300 font-bold text-center">Viloyatni tanlang</h4>
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
                <h4 className="text-gray-300 font-bold text-center">Tumanni tanlang</h4>
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
                        <h5 className="text-white font-medium">{plantation.name || "Sarlavhasiz"}</h5>
                        <p className="text-gray-400 text-sm">Maydoni: {plantation.total_area} GA</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center">Hozircha bog'lar mavjud emas</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Центральная панель с картой */}
        <div className="flex-1 bg-gray-900">
          <div
            id="map"
            ref={isLarge ? mapRef : null}
            style={{ width: "100%", height: "100vh" }}
          ></div>
        </div>

        {/* Правая панель */}
        <div className="w-1/4 p-4 border-l border-gray-700 bg-gray-800 shadow-lg overflow-y-auto">
          <div className="space-y-4">
            <Link
              to="/contacts"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
            >
              Kontaktlar
            </Link>
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
                <p className="text-gray-400 font-bold">Ma'lumotlar yuklanmoqda...</p>
              </div>
            ) : !selectedPlantation ? (
              <p className="text-gray-400 font-bold text-center">Bog'ni tanlang</p>
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
                      {selectedPlantation.district?.region}, {" "}
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
                    <h3 className="text-lg font-semibold mb-3 text-white">Galereya:</h3>
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
                    <h3 className="text-lg font-semibold mb-3 text-white">Mevalar:</h3>
                    <div className="space-y-2">
                      {selectedPlantation.fruit_areas.map((fruit, idx) => (
                        <div key={idx} className="text-sm border-b border-gray-600 pb-2">
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
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    onClick={() =>
                      navigate(`/plantations/${selectedPlantation.id}`)
                    }
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
            <div ref={!isLarge ? mapRef : null} style={{ width: '100%', height: '100%' }} />
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-400 font-bold text-center">Yuklanmoqda...</p>
            ) : !selectedRegion ? (
              <h4 className="text-gray-300 font-bold text-center">Viloyatni tanlang</h4>
            ) : !selectedDistrict ? (
              <>
                <button
                  className="w-full bg-blue-500 font-bold text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
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
                        <h5 className="text-white font-medium">{plantation.name || "Sarlavhasiz"}</h5>
                        <p className="text-gray-400 text-sm">Maydoni: {plantation.total_area} GA</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center">Hozircha bog'lar mavjud emas</p>
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
