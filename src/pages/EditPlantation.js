import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { GOOGLE_API_KEY } from "../config";
import { apiRequest } from "../utils/apiUtils";
import {
  landTypeMapping,
  subsidyTypeMapping,
  trellisTypeMapping,
  reservoirTypeMapping,
} from "../context/constants";
/* global google */

const EditPlantation = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [plantation, setPlantation] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [coordinatesChanged, setCoordinatesChanged] = useState(false);
  // const [area, setArea] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const { authState, refreshAccessToken } = useContext(AuthContext);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [createdByUser, setCreatedByUser] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [regionPolygons, setRegionPolygons] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [regionLabels, setRegionLabels] = useState([]);


  // Функция для открытия модального окна
  const openModal = () => {
    setIsModalOpen(true);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Функция для закрытия модального окна
  const closeModal = () => {
    setIsModalOpen(false);
    setCustomReason("");
  };

  const handleConfirm = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Проверяем, что комментарий введен
      if (!customReason.trim()) {
        setError("Iltimos, o'chirish sababini kiriting!");
        return;
      }
      
      // Отправляем PATCH запрос для отклонения плантации
      await apiRequest(`api/plantations/${plantation.id}/update/`, {
        method: "PATCH",
        body: JSON.stringify({
          is_checked: false,
          moderation_comment: customReason.trim()
        })
      }, refreshAccessToken, authState.accessToken);

      console.log("Plantation rejected successfully");
      setSuccessMessage("Plantatsiya muvaffaqiyatli rad etildi!");
      closeModal();
      
      // Перенаправляем обратно на предыдущую страницу
      setTimeout(() => {
        if (location.state?.from) {
          navigate(location.state.from);
        } else {
          navigate('/moderation');
        }
      }, 2000);
    } catch (error) {
      console.error("Error rejecting plantation:", error);
      setError("Plantatsiyani rad etishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }
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
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching plantation details:", error);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
      setLoading(false);
    }
  }, [id, authState.accessToken, refreshAccessToken, fetchUserDetails]);





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
      
      console.log('Loading all regions...');
      
      const newPolygons = [];
      const newLabels = [];
      
      // Загружаем все регионы параллельно
      const regionPromises = regions.map(async (regionName) => {
        try {
          const geojson = await fetch(`/uzb-geojson/${regionName}.geojson`).then((res) => res.json());
          console.log(`Loaded ${regionName}:`, geojson.features.length, 'features');
          
          geojson.features.forEach((feature) => {
            let paths = [];
            
            // Обрабатываем разные типы геометрии
            if (feature.geometry.type === 'Polygon') {
              paths = feature.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
            } else if (feature.geometry.type === 'MultiPolygon') {
              // Для MultiPolygon берем первый полигон
              paths = feature.geometry.coordinates[0][0].map(([lng, lat]) => ({ lat, lng }));
            }
            
            if (paths.length === 0) return;
            
            // Создаем полигон района
            const polygon = new google.maps.Polygon({
              paths,
              strokeColor: "#FFD700",
              strokeOpacity: 1,
              strokeWeight: 3,
              fillOpacity: 0,
              map: mapInstance,
            });

            // Создаем подпись района в углу экрана
            const districtName = feature.properties.name;
            
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

            newPolygons.push(polygon);
          });
        } catch (error) {
          console.error(`Ошибка загрузки региона ${regionName}:`, error);
        }
      });
      
      // Ждем загрузки всех регионов
      await Promise.all(regionPromises);
      
      setRegionPolygons(newPolygons);
      setRegionLabels(newLabels);
      console.log('Loaded total:', newPolygons.length, 'region polygons from all regions');
    } catch (error) {
      console.error("Ошибка загрузки полигонов районов:", error);
    }
  };

  const initializeMap = () => {
    // Проверяем, что элемент карты существует
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      console.warn("Map element not found, skipping map initialization");
      return;
    }

    const map = new google.maps.Map(mapElement, {
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

      const polygon = new google.maps.Polygon({
        paths,
        strokeColor: "#FF0000",
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map,
        editable: true,
        draggable: false,
      });

      const updateCoordinates = () => {
        const newPaths = polygon.getPath();
        const newCoordinates = [];
        for (let i = 0; i < newPaths.getLength(); i++) {
          const vertex = newPaths.getAt(i);
          newCoordinates.push({
            latitude: vertex.lat(),
            longitude: vertex.lng(),
          });
        }
        setPlantation((prev) => ({
          ...prev,
          coordinates: newCoordinates,
        }));
      };

      polygon.addListener("mouseup", updateCoordinates);

      // Устанавливаем границы для отображения полигона
      const bounds = new google.maps.LatLngBounds();
      paths.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds);
    }

    // Загружаем полигоны всех регионов
    loadRegionPolygons(map);
  };

  // Функция для подтверждения плантации (устанавливает is_checked: true)
  const handleApprove = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Отправляем только координаты и is_checked: true для подтверждения
      const updateData = {
        coordinates: plantation.coordinates,
        is_checked: true
      };
      
      await apiRequest(`api/plantations/${id}/update/`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      }, refreshAccessToken, authState.accessToken);

      console.log("Plantation approved successfully");
      setSuccessMessage("Plantatsiya muvaffaqiyatli tasdiqlandi!");
      
      // Задержка перед редиректом, чтобы пользователь увидел уведомление
      setTimeout(() => {
        // Определяем, откуда пришел пользователь
        const fromPage = location.state?.from;
        console.log('Approve redirect, fromPage:', fromPage, 'location.state:', location.state);
        
        if (fromPage === '/approved-plantations') {
          // Если пришел с approved-plantations, возвращаемся туда
          const currentPage = localStorage.getItem('approvedPlantationsPage') || 1;
          window.location.href = `/approved-plantations?page=${currentPage}`;
        } else {
          // По умолчанию возвращаемся на moderation
        const currentPage = localStorage.getItem('moderationPage') || 1;
          const savedFilters = location.state?.filters;
          
          // Восстанавливаем фильтры в URL
          const searchParams = new URLSearchParams();
          searchParams.set('page', currentPage.toString());
          
          if (savedFilters) {
            if (savedFilters.action !== "All") searchParams.set('action', savedFilters.action);
            if (savedFilters.status !== "All") searchParams.set('status', savedFilters.status);
            if (savedFilters.type !== "All") searchParams.set('type', savedFilters.type);
            if (savedFilters.region !== "All") searchParams.set('region', savedFilters.region);
            if (savedFilters.district !== "All") searchParams.set('district', savedFilters.district);
          }
          
          const newUrl = `/moderation?${searchParams.toString()}`;
          window.location.href = newUrl;
        }
      }, 2000);
    } catch (error) {
      console.error("Error approving plantation:", error);
      setError("Plantatsiyani tasdiqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }
  };



  useEffect(() => {
    if (!authState.accessToken) {
      console.error("No access token found. Redirecting to login.");
      window.location.href = '/login';
      return;
    }
    fetchPlantationDetails();
  }, [fetchPlantationDetails, authState.accessToken]);

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
          document.body.appendChild(script);
          script.onload = () => {
            if (typeof google !== "undefined") {
              initializeMap();
            }
          };
            script.onerror = () => {
              console.error("Failed to load Google Maps API");
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
            <div 
              id="map" 
              className="w-full h-full border border-gray-600 rounded-lg"
                            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitUserDrag: 'none',
                KhtmlUserSelect: 'none'
              }}
              onDragStart={(e) => e.preventDefault()}
              onSelectStart={(e) => e.preventDefault()}
            ></div>
          </div>
          <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 bg-gray-800 shadow-lg relative">
            {/* Кнопка закрытия */}
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors z-10"
              onClick={() => {
                // Определяем, откуда пришел пользователь
                const fromPage = location.state?.from;
                console.log('Close button clicked, fromPage:', fromPage, 'location.state:', location.state);
                
                if (fromPage === '/approved-plantations') {
                  // Если пришел с approved-plantations, возвращаемся туда
                  const currentPage = localStorage.getItem('approvedPlantationsPage') || 1;
                  window.location.href = `/approved-plantations?page=${currentPage}`;
                } else {
                  // По умолчанию возвращаемся на moderation
                console.log('Navigating to moderation...');
                const currentPage = localStorage.getItem('moderationPage') || 1;
                  const savedFilters = location.state?.filters;
                  
                  // Восстанавливаем фильтры в URL
                  const searchParams = new URLSearchParams();
                  searchParams.set('page', currentPage.toString());
                  
                  if (savedFilters) {
                    if (savedFilters.action !== "All") searchParams.set('action', savedFilters.action);
                    if (savedFilters.status !== "All") searchParams.set('status', savedFilters.status);
                    if (savedFilters.type !== "All") searchParams.set('type', savedFilters.type);
                    if (savedFilters.region !== "All") searchParams.set('region', savedFilters.region);
                    if (savedFilters.district !== "All") searchParams.set('district', savedFilters.district);
                  }
                  
                  const newUrl = `/moderation?${searchParams.toString()}`;
                  window.location.href = newUrl;
                }
              }}
              title="Закрыть"
            >
              ✕
            </button>
            <h1 className="text-3xl font-bold mb-4 pr-12 text-white">
              {plantation.farmer ? plantation.farmer.name : "Nomalum fermer"}
            </h1>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded-md">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-900 border border-green-600 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-200 text-sm">{successMessage}</p>
                </div>
              </div>
            )}
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
                <p className="font-semibold text-gray-300">Suv xovuzlari soni:</p>
                <p className="text-white">{plantation.reservoir_count}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Quduqlar soni:</p>
                <p className="text-white">{plantation.pump_station_count}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Fermer INN'si:</p>
                <p className="text-white">{plantation.farmer?.inn}</p>
              </div>

              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Qo'shilgan vaqti:</p>
                <p className="text-white">
                  {plantation.created_at 
                    ? new Date(plantation.created_at).toLocaleString("ru-RU", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "—"
                  }
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">
                  Tomchilab sug'oriladigan maydon:
                </p>
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

            {plantation.farmer && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("farmer")}
                >
                  Fermer:
                </h2>
                {expandedSections.farmer && (
                  <div className="space-y-2 text-gray-300">
                    <p>Asoschi: {plantation.farmer.founder_name}</p>
                    <p>Direktor: {plantation.farmer.director_name}</p>
                    <p>Telefon: {plantation.farmer.phone_number}</p>
                    <p>Manzil: {plantation.farmer.address}</p>
                    <p>INN: {plantation.farmer.inn}</p>
                  </div>
                )}
              </div>
            )}

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
                      src={img}
                      alt={`Изображение ${idx + 1}`}
                      className="w-full h-24 object-cover border border-gray-600 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(img)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-4">
              <button
                className="w-full sm:w-auto bg-green-500 mt-3 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-green-600 transition-colors"
                onClick={handleApprove}
              >
                Tasdiqlash
              </button>
              <button
                className="w-full sm:w-auto bg-red-500 mt-3 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-red-600 transition-colors"
                onClick={openModal}
              >
                O'chirish
              </button>
              {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div className="bg-gray-800 p-6 rounded-md w-96 border border-gray-600">
                    <h2 className="text-xl mb-4 text-white">Plantatsiyani rad etish</h2>
                    <p className="text-gray-300 mb-4">Bu plantatsiyani rad etishni xohlaysizmi? Rad etish sababi majburiy.</p>
                    <textarea
                      className="w-full p-2 mb-4 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Rad etish sababini kiriting (majburiy)"
                      rows={4}
                    />
                    <div className="flex justify-end space-x-4">
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                        onClick={handleConfirm}
                      >
                        Rad etish
                      </button>
                      <button
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                        onClick={closeModal}
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

export default EditPlantation;
