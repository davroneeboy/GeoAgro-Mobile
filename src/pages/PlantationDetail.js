import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import { GOOGLE_API_KEY } from "../config";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { apiRequest } from "../utils/apiUtils";
import { fetchFarmerPlantations } from "../api/api";
import {
  landTypeMapping,
  subsidyTypeMapping,
  trellisTypeMapping,
  reservoirTypeMapping,
} from "../context/constants";
import PlantationStatusIndicator from "../components/PlantationStatusIndicator";
/* global google */

const PlantationDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [plantation, setPlantation] = useState(() => location.state?.previewPlantation || null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);
  const [createdByUser, setCreatedByUser] = useState(null);
  const [moderatedByUser, setModeratedByUser] = useState(null);
  const [farmerPlantsOpen, setFarmerPlantsOpen] = useState(false);
  const [farmerPlants, setFarmerPlants] = useState([]);
  const [farmerPlantsLoading, setFarmerPlantsLoading] = useState(false);
  const [farmerPlantsError, setFarmerPlantsError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [regionPolygons, setRegionPolygons] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [regionLabels, setRegionLabels] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [polygonAreaHectares, setPolygonAreaHectares] = useState(null);
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

  const openFarmerPlantsModal = async () => {
    if (!plantation?.farmer?.id && !plantation?.farmer?.inn) return;
    try {
      setFarmerPlantsOpen(true);
      setFarmerPlantsLoading(true);
      setFarmerPlantsError(null);
      const inn = (plantation?.farmer?.inn && String(plantation.farmer.inn).trim() !== '' && Number(plantation.farmer.inn) > 0) ? plantation.farmer.inn : undefined;
      const list = await fetchFarmerPlantations({ farmer_id: plantation?.farmer?.id, farmer_inn: inn }, authState.accessToken);
      setFarmerPlants(Array.isArray(list) ? list : []);
    } catch (e) {
      setFarmerPlantsError(e?.message || 'Xatolik');
    } finally {
      setFarmerPlantsLoading(false);
    }
  };

  const fetchPlantationDetails = useCallback(async () => {
    try {
      setError(null);
      const data = await apiRequest(`api/plantations/${id}/`, {}, refreshAccessToken, authState.accessToken);
      const normalized = {
        ...data,
        trellises: Array.isArray(data.trellises) ? data.trellises : (Array.isArray(data.trellis_list) ? data.trellis_list : []),
        reservoirs: Array.isArray(data.reservoirs) ? data.reservoirs : (Array.isArray(data.reservoir_list) ? data.reservoir_list : []),
      };
      if (normalized.reservoir_count == null) {
        normalized.reservoir_count = Array.isArray(normalized.reservoirs) ? normalized.reservoirs.length : 0;
      }
      setPlantation(normalized);
      
      // Получаем информацию о пользователе, который создал плантацию
      if (normalized.created_by) {
        const userDetails = await fetchUserDetails(normalized.created_by);
        setCreatedByUser(userDetails);
      }
      
      // Получаем информацию о пользователе, который подтвердил плантацию
      if (normalized.moderated_by) {
        const moderatorDetails = await fetchUserDetails(normalized.moderated_by);
        setModeratedByUser(moderatorDetails);
      }
    } catch (error) {
      console.error("Error fetching plantation details:", error);
      // Для наблюдателя не блокируем просмотр, оставляем превью
      if (authState.userRole !== 'observer') {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
      }
    } finally {
      setLoading(false);
    }
  }, [id, authState.accessToken, refreshAccessToken, fetchUserDetails]);



  const initializeMap = () => {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      
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

      const polygon = new google.maps.Polygon({
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

      // Расчет площади полигона в квадратных метрах
      const areaInSquareMeters = google.maps.geometry.spherical.computeArea(polygon.getPath());
      // Перевод в гектары (1 гектар = 10000 кв.м)
      const areaInHectares = areaInSquareMeters / 10000;
      setPolygonAreaHectares(areaInHectares);

      // Создание информационной панели с площадью на карте
      const areaOverlay = document.createElement("div");
      areaOverlay.style.position = "absolute";
      areaOverlay.style.top = "10px";
      areaOverlay.style.left = "10px";
      areaOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
      areaOverlay.style.color = "white";
      areaOverlay.style.padding = "10px 16px";
      areaOverlay.style.borderRadius = "8px";
      areaOverlay.style.fontWeight = "600";
      areaOverlay.style.fontSize = "15px";
      areaOverlay.style.zIndex = "1000";
      areaOverlay.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      areaOverlay.style.border = "2px solid #4CAF50";
      areaOverlay.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#4CAF50">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm3 3h8v8H8V8z"/>
          </svg>
          <span>Maydon: <strong>${areaInHectares.toFixed(2)} GA</strong></span>
        </div>
      `;
      
      const mapContainer = mapInstance.getDiv();
      mapContainer.appendChild(areaOverlay);
      
      // Загружаем полигоны всех регионов
      loadRegionPolygons(mapInstance);

      // Подгрузить и отрисовать соседние плантации текущего тумана
      (async () => {
        try {
          // Наблюдателю этот эндпоинт недоступен (403), пропускаем тихо
          if (String(authState.userRole) === 'observer') return;

          const tryFetch = async (suffix) => apiRequest(
            `api/plantations/${id}/${suffix}/`,
            {},
            refreshAccessToken,
            authState.accessToken
          );

          let related = null;
          try {
            // корректный путь по бэку
            related = await tryFetch('related-map');
          } catch (e1) {
            const msg1 = String(e1?.message || '');
            if (msg1.includes('404') || msg1.includes('Not Found')) {
              try {
                related = await tryFetch('relatedmap');
              } catch (e2) {
                const msg2 = String(e2?.message || '');
                if (msg2.includes('404') || msg2.includes('Not Found')) {
                  try {
                    related = await tryFetch('related_map');
                  } catch (e3) {
                    const msg3 = String(e3?.message || '');
                    if (msg3.includes('404') || msg3.includes('Not Found')) {
                      // финальный фолбэк на старую опечатку
                      related = await tryFetch('realtedmap');
                    } else {
                      throw e3;
                    }
                  }
                } else {
                  throw e2;
                }
              }
            } else {
              throw e1;
            }
          }

          const items = Array.isArray(related?.results) ? related.results : (Array.isArray(related) ? related : []);
          const filtered = items.filter((p) => String(p?.id) !== String(id));
          filtered.forEach((p) => {
            const coords = Array.isArray(p?.coordinates)
              ? p.coordinates.map((c) => ({ lat: c.latitude, lng: c.longitude }))
              : [];
            if (coords.length) {
              const isApproved = !!p?.is_checked;
              const isRejected = !!p?.is_rejected;
              const fill = isApproved ? '#20c997' : (isRejected ? '#ff4d4f' : '#fadb14');
              const stroke = isApproved ? '#20c997' : (isRejected ? '#ff4d4f' : '#ff0000'); // жёлтый -> красный контур
              const poly = new google.maps.Polygon({
                paths: coords,
                strokeColor: stroke,
                strokeOpacity: 1,
                strokeWeight: 3,
                fillColor: fill,
                fillOpacity: 0.32,
                map: mapInstance,
              });

              const statusText = isApproved ? 'Tasdiqlangan' : (isRejected ? 'Rad etilgan' : 'Kutilmoqda');
              const contentHtml = `
                <div class="tooltip-dark" style="min-width:200px"> 
                  <div class="tooltip-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#62a8ff"><path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>
                    <span>${(p?.name||'Без названия')}</span>
                  </div>
                  <div class="tooltip-row">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#bfbfbf"><path d="M20 6h-4V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16h2v-6h14l2-6a2 2 0 0 0-2-2ZM6 4h8v2H6V4Zm12.62 6H6v-2h14l-1.38 2Z"/></svg>
                    <span>ID: ${p?.id || ''}</span>
                  </div>
                  <div class="tooltip-row">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#bfbfbf"><path d="M3 3h18v18H3V3Zm2 2v14h14V5H5Zm3 3h8v8H8V8Z"/></svg>
                    <span>Maydon: ${(p?.total_area ?? '-') } ga</span>
                  </div>
                  <div class="tooltip-row">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="${fill}"><path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"/></svg>
                    <span>Holat: <span style="color:${fill};font-weight:600;">${statusText}</span></span>
                  </div>
                  <a class="tooltip-link" href="/plantations/${p.id}">Plantatsiyani ochish
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Z"/></svg>
                  </a>
                </div>`;
              const info = new google.maps.InfoWindow({ content: contentHtml });
              try {
                info.addListener('domready', () => {
                  try {
                    const iwC = document.querySelector('.gm-style-iw-c');
                    if (iwC && !iwC.classList.contains('tooltip-dark')) iwC.classList.add('tooltip-dark');
                    const iwD = document.querySelector('.gm-style-iw-d');
                    if (iwD && !iwD.classList.contains('tooltip-dark')) iwD.classList.add('tooltip-dark');
                  } catch (_) {}
                });
              } catch (_) {}
              poly.addListener('mouseover', (e) => {
                info.setPosition(e.latLng);
                info.open({ map: mapInstance });
                poly.setOptions({ strokeWeight: 5 });
              });
              poly.addListener('mouseout', () => { info.close(); poly.setOptions({ strokeWeight: 3 }); });

              poly.addListener('click', () => {
                window.location.href = `/plantations/${p.id}`;
              });

              // больше не расширяем границы под соседние полигоны, чтобы не менять зум
              // coords.forEach((coord) => bounds.extend(coord));
            }
          });
          // if (hasAny) { mapInstance.fitBounds(bounds); } // сохранение текущего зума
        } catch (e) {
          // ignore failures to keep main map usable
        }
      })();
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
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (plantation && !loading) {
      const loadGoogleMapsScript = () => {
        // Добавляем небольшую задержку, чтобы убедиться, что DOM готов
        setTimeout(() => {
          const mapElement = document.getElementById("map");
          if (!mapElement) {
            
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
                
                
                const fromState = location.state?.from;
                const referrer = document.referrer || '';
                
                if (fromState) {
                  navigate(fromState);
                } else if (referrer.includes('/approved-plantations')) {
                  const currentPage = localStorage.getItem('approvedPlantationsPage') || 1;
                  navigate(`/approved-plantations?page=${currentPage}`);
                } else if (referrer.includes('/moderation')) {
                  const currentPage = localStorage.getItem('moderationPage') || 1;
                  navigate(`/moderation?page=${currentPage}`);
                } else if (referrer.includes('/rejected-plantations')) {
                  navigate('/rejected-plantations');
                } else if (referrer.includes('/plantations/uz')) {
                  navigate('/plantations/uz');
                } else if (referrer.includes('/farmers/') && referrer.includes('/map')) {
                  try {
                    const url = new URL(referrer);
                    navigate(url.pathname);
                  } catch (_) {
                    navigate(-1);
                  }
                } else {
                  navigate(-1);
                }
              }}
              title="Закрыть"
            >
              ✕
            </button>
            <h1 className="text-lg font-semibold text-white mb-3 pr-12">{plantation.farmer ? plantation.farmer.name : "Nomalum fermer"} <span className="text-xs text-gray-400 ml-2">ID: {plantation?.id || id}</span></h1>
            
            {/* Блок статуса плантации */}
            <PlantationStatusIndicator plantation={plantation} />
            
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
                <p className="font-semibold text-gray-300">Yaroqsiz maydon:</p>
                <p className="text-white">{plantation.not_usable_area ?? '—'} GA</p>
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
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Kontur raqami:</p>
                <div className="flex items-center gap-2 text-white text-sm">
                  <span className="break-all">
                    {Array.isArray(plantation.kontur_number)
                      ? (() => {
                          const arr = plantation.kontur_number.map((v) => String(v)).filter((s) => s.trim().length > 0);
                          if (arr.length === 0) return '—';
                          const limit = 5;
                          const shown = arr.slice(0, limit).join(', ');
                          const extra = arr.length - limit;
                          return extra > 0 ? `${shown} … va yana ${extra} ta` : shown;
                        })()
                      : (plantation.kontur_number || '—')}
                  </span>
                  {Array.isArray(plantation.kontur_number) && plantation.kontur_number.length > 0 && (
                    <button
                      onClick={() => { try { navigator.clipboard.writeText(plantation.kontur_number.map((v) => String(v)).join(', ')); } catch(_) {} }}
                      className="text-gray-300 hover:text-white"
                      title="Nusxa olish"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                  )}
                </div>
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
                {plantation.updated_at && (
                  <div className="mt-2 text-xs text-amber-300 flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-900/50 border border-amber-600/60">Yangilangan</span>
                    <span className="text-white">
                      {new Date(plantation.updated_at).toLocaleString("ru-RU", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
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
            {(Array.isArray(plantation.moderation_comment) ? plantation.moderation_comment.length > 0 : !!plantation.moderation_comment) && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-semibold">Moderatsiya kommenti</span>
                </div>
                <div className="p-3 rounded-lg border border-gray-600 bg-gray-800/50 space-y-2">
                  {Array.isArray(plantation.moderation_comment) ? (
                    plantation.moderation_comment.map((mc, idx) => (
                      <div key={mc?.id ?? idx} className="flex items-start gap-3">
                        <div className="text-gray-200 text-sm flex-1 whitespace-pre-wrap">{mc?.text || ''}</div>
                        {mc?.image && typeof mc.image === 'string' && (
                          <a href={mc.image} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <img src={mc.image} alt="comment" className="w-16 h-16 object-cover rounded border border-gray-600" />
                          </a>
                        )}

                      </div>
                    ))
                  ) : (
                    <p className="text-gray-200 text-sm">{String(plantation.moderation_comment)}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {plantation.farmer && (
                <div className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-650" onClick={openFarmerPlantsModal} title="Fermer plantatsiyalari">
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
                  <div className="pr-1 space-y-2">
                    {plantation.fruit_areas.map((area, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 text-gray-300 text-sm last:border-b-0">
                        <p>Meva: {area.fruit}</p>
                        <p>Nav: {area.variety}</p>
                        <p>Maydoni: {area.area} GA</p>
                        <p>Ekilgan yili: {area.planted_year}</p>
                        <p>Podvoy: {area.rootstock || '—'}</p>
                        <p>Sxema: {area.schema || '—'}</p>
                        <p>Og'irlik: {area.weight ?? '—'}</p>
                        <p>Sentner: {area.hundredweight ?? '—'}</p>
                        <p>Ko'chat soni: {area.kochat_soni ?? '—'}</p>
                        <p>O'ralgan: {area.fenced ? "✅" : "🚫"}</p>
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
            {(plantation?.trellises?.filter(t => t && (
              (t.trellis_installed_area != null && t.trellis_installed_area !== '' && Number(t.trellis_installed_area) > 0) ||
              (t.trellis_count != null && t.trellis_count !== '' && Number(t.trellis_count) > 0)
            ))?.length > 0) && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("trellises")}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" /></svg>
                  Shpallar:
                  </span>
                </h2>
                {expandedSections.trellises && (
                  <div>
                    {plantation.trellises
                      .filter(trellis => trellis && (
                        (trellis.trellis_installed_area != null && trellis.trellis_installed_area !== '' && Number(trellis.trellis_installed_area) > 0) ||
                        (trellis.trellis_count != null && trellis.trellis_count !== '' && Number(trellis.trellis_count) > 0)
                      ))
                      .map((trellis, idx) => (
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
            {(plantation?.reservoirs?.filter(r => r && r.reservoir_volume != null && r.reservoir_volume !== '' && Number(r.reservoir_volume) > 0)?.length > 0) && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("reservoirs")}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15s3-2 9-2 9 2 9 2-3 2-9 2-9-2-9-2z" /></svg>
                  Suv Xovuzlari:
                  </span>
                </h2>
                {expandedSections.reservoirs && (
                  <div>
                    {plantation.reservoirs
                      .filter(reservoir => reservoir && reservoir.reservoir_volume != null && reservoir.reservoir_volume !== '' && Number(reservoir.reservoir_volume) > 0)
                      .map((reservoir, idx) => (
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
            {/* RBAC: кнопка редактирования только для superuser и headof_region */}
            {/* RBAC: кнопка редактирования только для superuser */}
            {authState.userRole === "superuser" && (
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
            )}
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
      {farmerPlantsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setFarmerPlantsOpen(false)}></div>
          <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-11/12 max-w-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-lg font-semibold">Fermer plantatsiyalari</h3>
              <button className="text-gray-300 hover:text-white px-2 py-1 bg-gray-700 rounded" onClick={() => setFarmerPlantsOpen(false)}>✕</button>
            </div>
            {farmerPlantsLoading ? (
              <div className="text-gray-300">Yuklanmoqda...</div>
            ) : farmerPlantsError ? (
              <div className="text-red-400">{farmerPlantsError}</div>
            ) : farmerPlants.length === 0 ? (
              <div className="text-gray-300">Plantatsiyalar topilmadi</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {farmerPlants.map((p) => {
                  const isApproved = !!p.is_checked;
                  const isRejected = !!p.is_rejected;
                  const badgeCls = isApproved ? 'bg-green-600/20 text-green-300 border-green-500/50' : (isRejected ? 'bg-red-600/20 text-red-300 border-red-500/50' : 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50');
                  const statusText = isApproved ? 'Tasdiqlangan' : (isRejected ? 'Rad etilgan' : 'Kutilmoqda');
                  return (
                    <div key={p.id} className="p-3 bg-gray-700 rounded border border-gray-600 hover:bg-gray-650 cursor-pointer" onClick={() => { setFarmerPlantsOpen(false); navigate(`/plantations/${p.id}`, { state: { from: location.pathname } }); }}>
                            <div className="flex items-center justify-between">
                              <div className="text-white font-medium truncate">{p.name || 'Fermer'}</div>
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${badgeCls}`}>{statusText}</span>
                            </div>
                            <div className="text-gray-400 text-xs mt-1">ID: {p.id} • Maydon: {Number(p.total_area || 0).toFixed(1)} ga</div>
                          </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantationDetail;
