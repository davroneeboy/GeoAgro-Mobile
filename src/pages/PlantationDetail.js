import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import { GOOGLE_API_KEY } from "../config";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { apiRequest } from "../utils/apiUtils";
import {
  landTypeMapping,
  subsidyTypeMapping,
  trellisTypeMapping,
  reservoirTypeMapping,
} from "../context/constants";
/* global google */

const PlantationDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [plantation, setPlantation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);
  const [createdByUser, setCreatedByUser] = useState(null);
  const [moderatedByUser, setModeratedByUser] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [regionPolygons, setRegionPolygons] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [regionLabels, setRegionLabels] = useState([]);
  const navigate = useNavigate();
  const { authState, refreshAccessToken } = useContext(AuthContext);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Функция для получения информации о пользователе
  const fetchUserDetails = useCallback(async (userId) => {
    if (!userId) return null;
    
    try {
      // Получаем список всех пользователей
      const users = await apiRequest('api/users/', {}, refreshAccessToken, authState.accessToken);
      
      // Находим пользователя по ID
      const user = users.find(u => u.id === parseInt(userId));
      return user;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  }, [authState.accessToken, refreshAccessToken]);



  // Функция для добавления обработчиков событий к полигону
  const addPolygonEventListeners = (polygon, districtName, mapInstance) => {
    // Создаем элемент для отображения названия в углу
    let cornerLabel = null;
    
    // Добавляем обработчики событий для полигона
    polygon.addListener('mouseover', function() {
      // Удаляем предыдущую подпись если есть
      if (cornerLabel && cornerLabel.parentNode) {
        cornerLabel.parentNode.removeChild(cornerLabel);
      }
      
      // Создаем новую подпись в правом верхнем углу
      cornerLabel = document.createElement("div");
      cornerLabel.style.position = "absolute";
      cornerLabel.style.top = "20px";
      cornerLabel.style.right = "20px";
      cornerLabel.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
      cornerLabel.style.color = "white";
      cornerLabel.style.padding = "8px 16px";
      cornerLabel.style.borderRadius = "8px";
      cornerLabel.style.fontWeight = "bold";
      cornerLabel.style.fontSize = "18px";
      cornerLabel.style.zIndex = "1000";
      cornerLabel.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
      cornerLabel.style.border = "2px solid #FFD700";
      cornerLabel.style.minWidth = "120px";
      cornerLabel.style.textAlign = "center";
      cornerLabel.innerHTML = districtName;
      
      // Добавляем в контейнер карты
      const mapContainer = mapInstance.getDiv();
      mapContainer.appendChild(cornerLabel);
    });

    polygon.addListener('mouseout', function() {
      // Удаляем подпись при уходе курсора
      if (cornerLabel && cornerLabel.parentNode) {
        cornerLabel.parentNode.removeChild(cornerLabel);
        cornerLabel = null;
      }
    });
  };

  // Функция для загрузки полигонов всех регионов
  const loadRegionPolygons = async (mapInstance) => {
    try {
      // Очищаем старые полигоны
      setRegionPolygons(prev => {
        prev.forEach((polygon) => {
          polygon.setMap(null);
        });
        return [];
      });
      setRegionLabels(prev => {
        prev.forEach(({ overlay }) => overlay.setMap(null));
        return [];
      });
      
      // Список всех регионов
      const regions = [
        'toshkent', 'navoiy', 'jizzax', 'namangan', 'andijon', 'fargona',
        'samarqand', 'buxoro', 'qashqadaryo', 'surxondaryo', 'qoraqalpogiston',
        'xorazm', 'sirdaryo'
      ];
      
      const newPolygons = [];
      const newLabels = [];
      
      // Загружаем все регионы параллельно
      const regionPromises = regions.map(async (regionName) => {
        try {
          const response = await fetch(`/uzb-geojson/${regionName}.geojson`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const geojson = await response.json();
          
          geojson.features.forEach((feature, index) => {
            let paths = [];
            
            // Проверяем наличие геометрии
            if (!feature.geometry || !feature.geometry.coordinates) {
              return;
            }
            
            // Обрабатываем разные типы геометрии
            if (feature.geometry.type === 'Polygon') {
              paths = feature.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
              
                          if (paths.length === 0) {
              return;
            }
              
              // Проверяем наличие названия района
              const districtName = feature.properties?.name || feature.properties?.NAME || `District ${index}`;
              
              // Создаем полигон района
              const polygon = new google.maps.Polygon({
                paths,
                strokeColor: "#FFD700",
                strokeOpacity: 1,
                strokeWeight: 3,
                fillOpacity: 0,
                map: mapInstance,
              });
              
              // Добавляем обработчики событий для полигона
              addPolygonEventListeners(polygon, districtName, mapInstance);
              
              newPolygons.push(polygon);
              
            } else if (feature.geometry.type === 'MultiPolygon') {
              // Для MultiPolygon создаем полигон для каждой части
              const districtName = feature.properties?.name || feature.properties?.NAME || `District ${index}`;
              
              feature.geometry.coordinates.forEach((polygonCoords, polygonIndex) => {
                polygonCoords.forEach((ringCoords, ringIndex) => {
                  const paths = ringCoords.map(([lng, lat]) => ({ lat, lng }));
                  
                  if (paths.length === 0) {
                    return;
                  }
                  
                  // Создаем полигон для этой части
                  const polygon = new google.maps.Polygon({
                    paths,
                    strokeColor: "#FFD700",
                    strokeOpacity: 1,
                    strokeWeight: 3,
                    fillOpacity: 0,
                    map: mapInstance,
                  });
                  
                  // Добавляем обработчики событий для полигона
                  addPolygonEventListeners(polygon, districtName, mapInstance);
                  
                  newPolygons.push(polygon);
                });
              });
              
            } else {
              return;
            }
          });
        } catch (error) {
          console.error(`Ошибка загрузки региона ${regionName}:`, error);
        }
      });
      
      // Ждем загрузки всех регионов
      await Promise.all(regionPromises);
      
      setRegionPolygons(newPolygons);
      setRegionLabels(newLabels);
    } catch (error) {
      console.error("Ошибка загрузки полигонов районов:", error);
    }
  };

  const fetchPlantationDetails = useCallback(async () => {
    try {
      setError(null);
      const data = await apiRequest(`api/plantations/${id}/`, {}, refreshAccessToken, authState.accessToken);
      setPlantation(data);
      
      // Получаем информацию о пользователе, который создал плантацию
      if (data.created_by) {
        const userDetails = await fetchUserDetails(data.created_by);
        setCreatedByUser(userDetails);
      }
      
      // Получаем информацию о пользователе, который подтвердил плантацию
      if (data.moderated_by) {
        const moderatorDetails = await fetchUserDetails(data.moderated_by);
        setModeratedByUser(moderatorDetails);
      }
    } catch (error) {
      console.error("Error fetching plantation details:", error);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }, [id, authState.accessToken, refreshAccessToken, fetchUserDetails]);



  const initializeMap = () => {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      console.warn("Map element not found, skipping map initialization");
      return;
    }

    const mapInstance = new google.maps.Map(mapElement, {
      center: { lat: 41.2995, lng: 69.2401 },
      zoom: 12,
      mapTypeId: "satellite",
      disableDefaultUI: true,
    });

    if (plantation && plantation.coordinates) { 
      const paths = plantation.coordinates.map((coord) => ({
        lat: coord.latitude,
        lng: coord.longitude,
      }));

      new google.maps.Polygon({
        paths,
        strokeColor: "red",
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: "red",
        fillOpacity: 0.35,
        map: mapInstance,
      });

      const bounds = new google.maps.LatLngBounds();
      paths.forEach((coord) => bounds.extend(coord));
      mapInstance.fitBounds(bounds);
      
      // Загружаем полигоны всех регионов
      loadRegionPolygons(mapInstance);
    }
  };

  useEffect(() => {
    if (!authState.accessToken) {
      console.error("No access token found. Redirecting to login.");
      navigate('/login');
      return;
    }
    fetchPlantationDetails();
  }, [fetchPlantationDetails, authState.accessToken, navigate]);

  useEffect(() => {
    if (plantation && !loading) {
      const loadGoogleMapsScript = () => {
        // Добавляем небольшую задержку, чтобы убедиться, что DOM готов
        setTimeout(() => {
          const mapElement = document.getElementById("map");
          if (!mapElement) {
            console.warn("Map element not ready yet");
            return;
          }

        const existingScript = document.getElementById("googleMaps");
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=geometry`;
          script.id = "googleMaps";
          script.async = true;
          script.defer = true;
          script.setAttribute('loading', 'async');
          document.body.appendChild(script);
          script.onload = () => {
            if (typeof google !== "undefined") {
              initializeMap();
            }
          };
        } else {
          if (typeof google !== "undefined") {
            initializeMap();
          }
        }
        }, 100);
      };
      loadGoogleMapsScript();
    }
  }, [plantation, loading]);

  // Очистка полигонов при размонтировании компонента
  useEffect(() => {
    return () => {
      setRegionPolygons(prev => {
        prev.forEach((polygon) => {
          polygon.setMap(null);
        });
        return [];
      });
      setRegionLabels(prev => {
        prev.forEach(({ overlay }) => overlay.setMap(null));
        return [];
      });
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900">
      {loading ? (
        <div className="flex justify-center items-center h-full w-full bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <p className="text-white">Ma'lumotlar yuklanmoqda...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-full w-full bg-gray-900">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-white mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchPlantationDetails();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Qaytadan urinib ko'ring
            </button>
          </div>
        </div>
      ) : plantation ? (
        <>
          <div className="w-full md:w-1/2 h-64 md:h-full p-4">
            <div id="map" className="w-full h-full border border-gray-600 rounded-lg"></div>
          </div>
          <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 bg-gray-800 shadow-lg relative">
            {/* Кнопка закрытия */}
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors z-10"
              onClick={() => {
                console.log('Navigating back...');
                
                const referrer = location.state?.from || document.referrer || '';
                
                if (referrer.includes('/approved-plantations')) {
                  const currentPage = localStorage.getItem('approvedPlantationsPage') || 1;
                  navigate(`/approved-plantations?page=${currentPage}`);
                } else if (referrer.includes('/moderation')) {
                  const currentPage = localStorage.getItem('moderationPage') || 1;
                  navigate(`/moderation?page=${currentPage}`);
                } else if (referrer.includes('/rejected-plantations')) {
                  navigate('/rejected-plantations');
                } else if (referrer.includes('/plantations/uz') || location.state?.from === '/plantations/uz') {
                  navigate('/plantations/uz');
                } else {
                  navigate('/');
                }
              }}
              title="Закрыть"
            >
              ✕
            </button>
            <h1 className="text-xl font-semibold text-white mb-4 pr-12">{plantation.farmer ? plantation.farmer.name : "Nomalum fermer"} <span className="text-xs text-gray-400 ml-2">ID: {plantation?.id || id}</span></h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Yer turi:</p>
                <p className="text-white">{landTypeMapping[plantation.land_type]}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Maydoni:</p>
                <p className="text-white">{plantation.total_area} GA</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Hosildorlik bahosi:</p>
                <p className="text-white">{plantation.fertility_score}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Devor bilan o'ralgan:</p>
                <p className="text-white">{plantation.fenced ? "✅" : "🚫"}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Bo'sh maydon:</p>
                <p className="text-white">{plantation.empty_area} GA</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Suv xovузlari soni:</p>
                <p className="text-white">{plantation.reservoir_count}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Quduqlar soni:</p>
                <p className="text-white">{plantation.pump_station_count}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Tomchilab sug'oriladigan maydon:</p>
                <p className="text-white">{plantation.irrigation_area} GA</p>
              </div>
              {plantation.investments && plantation.investments.length > 0 && (
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="font-semibold text-gray-300 mb-2">Investitsiyalar:</p>
                  <div className="space-y-1 mb-3">
                    {plantation.investments.map((investment, index) => (
                      <div key={investment.id || index} className="text-white text-sm">
                        <span className="text-gray-400">
                          {investment.invest_type === 1 ? 'Mahalliy' : investment.invest_type === 2 ? 'Xorijiy' : `Turi ${investment.invest_type}`}:
                        </span>
                        <span className="ml-2 font-medium">
                          {new Intl.NumberFormat('uz-UZ').format(investment.investment_amount)} UZS
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <p className="font-semibold text-gray-300">Jami investitsiyalar:</p>
                    <p className="text-white font-bold text-green-400 text-lg">
                      {new Intl.NumberFormat('uz-UZ').format(
                        plantation.investments.reduce((total, inv) => total + (inv.investment_amount || 0), 0)
                      )} UZS
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Секция с комментарием модерации */}
            {plantation.moderation_comment && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-semibold">Moderatsiya kommenti</span>
                </div>
                <div className="p-3 rounded-lg border border-gray-600 bg-gray-800/50">
                  <p className="text-gray-200 text-sm">{plantation.moderation_comment}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {plantation.farmer && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="font-semibold">Fermer</span>
                  </div>
                  <div className="space-y-1 text-gray-300 text-sm">
                    <p>Asoschi: {plantation.farmer.founder_name}</p>
                    <p>Direktor: {plantation.farmer.director_name}</p>
                    <p>Telefon: {plantation.farmer.phone_number}</p>
                    <p>Manzil: {plantation.farmer.address}</p>
                    <p>INN: {plantation.farmer.inn}</p>
                  </div>
                </div>
              )}
              {plantation.fruit_areas?.length > 0 && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4c-3 0-5 2-5 5 0 4 5 9 5 9s5-5 5-9c0-3-2-5-5-5z" /></svg>
                    <span className="font-semibold">Mevali hududlar</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                    {plantation.fruit_areas.map((area, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 text-gray-300 text-sm last:border-b-0">
                        <p>Meva: {area.fruit}</p>
                        <p>Nav: {area.variety}</p>
                        <p>Maydoni: {area.area} GA</p>
                        <p>Ekilgan yili: {area.planted_year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Секция с информацией о пользователе, который создал плантацию */}
            {createdByUser && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("user")}
                >
                  Qo'shgan foydalanuvchi:
                </h2>
                {expandedSections.user && (
                  <div className="space-y-2 text-gray-300">
                    <p>Ism Familiya: {`${createdByUser.first_name} ${createdByUser.last_name}`.trim() || "—"}</p>
                    <p>Foydalanuvchi nomi: {createdByUser.username || "—"}</p>
                    <p>Telefon raqami: {createdByUser.phone_number || "—"}</p>
                    {createdByUser.location && (
                      <p>Joylashuv: {createdByUser.location.district || "—"}</p>
                    )}
                    <p>Qo'shilgan vaqti: {
                      plantation.created_at 
                        ? new Date(plantation.created_at).toLocaleString("ru-RU", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "—"
                    }</p>
                    <p>Oxirgi kirish: {
                      createdByUser.last_login 
                        ? new Date(createdByUser.last_login).toLocaleString("ru-RU", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "Hech qachon"
                    }</p>
                    {createdByUser.contact_link && (
                      <p>Aloqa: <a 
                        href={createdByUser.contact_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {createdByUser.contact_link}
                      </a></p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Секция с информацией о пользователе, который подтвердил плантацию */}
            {moderatedByUser && plantation.moderated_at && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("moderator")}
                >
                  Tasdiqlagan foydalanuvchi:
                </h2>
                {expandedSections.moderator && (
                  <div className="space-y-2 text-gray-300">
                    <p>Ism Familiya: {`${moderatedByUser.first_name} ${moderatedByUser.last_name}`.trim() || "—"}</p>
                    <p>Foydalanuvchi nomi: {moderatedByUser.username || "—"}</p>
                    <p>Telefon raqami: {moderatedByUser.phone_number || "—"}</p>
                    {moderatedByUser.location && (
                      <p>Joylashuv: {moderatedByUser.location.district || "—"}</p>
                    )}
                    <p>Tasdiqlangan vaqti: {
                      plantation.moderated_at 
                        ? new Date(plantation.moderated_at).toLocaleString("ru-RU", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "—"
                    }</p>
                    <p>Oxirgi kirish: {
                      moderatedByUser.last_login 
                        ? new Date(moderatedByUser.last_login).toLocaleString("ru-RU", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "Hech qachon"
                    }</p>
                    {moderatedByUser.contact_link && (
                      <p>Aloqa: <a 
                        href={moderatedByUser.contact_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {moderatedByUser.contact_link}
                      </a></p>
                    )}
                  </div>
                )}
              </div>
            )}

            {plantation.subsidies.length > 0 && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("subsidies")}
                >
                  Subsidiyalar:
                </h2>
                {expandedSections.subsidies && (
                  <div>
                    {plantation.subsidies.map((subsidy, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>Yil: {subsidy.year}</p>
                        <p>Yo'nalishi: {subsidyTypeMapping[subsidy.direction]}</p>
                        <p>Miqdori: {subsidy.amount} UZS</p>
                        <p>Samaradorligi: {subsidy.efficiency}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.trellises.length > 0 && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("trellises")}
                >
                  Shpallar:
                </h2>
                {expandedSections.trellises && (
                  <div>
                    {plantation.trellises.map((trellis, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>
                          Shpalla turi:{" "}
                          {trellisTypeMapping[trellis.trellis_type]}
                        </p>
                        <p>
                          Shpalla maydoni: {trellis.trellis_installed_area} GA
                        </p>
                        <p>Shpallar soni: {trellis.trellis_count}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.reservoirs.length > 0 && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("reservoirs")}
                >
                  Suv Xovuzlari:
                </h2>
                {expandedSections.reservoirs && (
                  <div>
                    {plantation.reservoirs.map((reservoir, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>
                          Ombor turi:{" "}
                          {reservoirTypeMapping[reservoir.reservoir_type]}
                        </p>
                        <p>Hajmi: {reservoir.reservoir_volume}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.fruit_areas.length > 0 && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("fruitAreas")}
                >
                  Mevali hududlar:
                </h2>
                {expandedSections.fruitAreas && (
                  <div>
                    {plantation.fruit_areas.map((area, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>Meva: {area.fruit}</p>
                        <p>Nav: {area.variety}</p>
                        <p>Maydoni: {area.area} GA</p>
                        <p>Ekilgan yili: {area.planted_year}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.images?.length > 0 && (
              <div className="mt-6 bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-white">Galereya:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {plantation.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.image_url}
                      alt={`Изображение ${idx + 1}`}
                      className="w-full h-24 object-cover border border-gray-600 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(img.image_url)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="w-full sm:w-auto py-2 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                onClick={() => {
                  // Передаем информацию о том, откуда пришли
                  const fromPage = location.state?.from || '/moderation';
                  navigate(`/plantations/edit/${plantation.id}`, {
                    state: { from: fromPage }
                  });
                }}
              >
                Tahrirlash
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-full w-full bg-gray-900">
          <p className="text-white">Plantatsiya topilmadi</p>
        </div>
      )}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Увеличенное изображение"
            className="max-w-full max-h-full rounded-md"
          />
        </div>
      )}
    </div>
  );
};

export default PlantationDetail;
