import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { GOOGLE_API_KEY } from "../config";
import AuthContext from "../context/AuthContext";
import { apiRequest } from "../utils/apiUtils";

/* global google */

const PlantationPreviewPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { authState, refreshAccessToken } = useContext(AuthContext);

  const [plantation, setPlantation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [regionPolygons, setRegionPolygons] = useState([]);
  const [regionLabels, setRegionLabels] = useState([]);
  const [otherPlantations, setOtherPlantations] = useState([]);
  const mapRef = useRef(null);
  const polygonRef = useRef(null);

  // Функция для добавления hover-лейблов для районов
  const addPolygonEventListeners = (polygon, districtName, mapInstance) => {
    let cornerLabel = null;
    polygon.addListener('mouseover', function() {
      if (cornerLabel && cornerLabel.parentNode) {
        cornerLabel.parentNode.removeChild(cornerLabel);
      }
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
      const mapContainer = mapInstance.getDiv();
      mapContainer.appendChild(cornerLabel);
    });
    polygon.addListener('mouseout', function() {
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
                clickable: true,
                zIndex: 1,
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
                    clickable: true,
                    zIndex: 1,
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

  // Функция для загрузки других плантаций фермера
  const loadOtherPlantations = async (mapInstance) => {
    if (!plantation?.farmer?.id) return;
    
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
      
      const newPlantations = [];
      
      filtered.forEach((p) => {
        const coords = Array.isArray(p?.coordinates)
          ? p.coordinates.map((c) => ({ lat: c.latitude, lng: c.longitude }))
          : [];
        if (coords.length) {
          const isApproved = !!p?.is_checked;
          const isRejected = !!p?.is_rejected;
          const fill = isApproved ? '#20c997' : (isRejected ? '#ff4d4f' : '#fadb14');
          const stroke = isApproved ? '#20c997' : (isRejected ? '#ff4d4f' : '#ff0000');
          const poly = new google.maps.Polygon({
            paths: coords,
            strokeColor: stroke,
            strokeOpacity: 1,
            strokeWeight: 3,
            fillColor: fill,
            fillOpacity: 0.32,
            map: mapInstance,
            zIndex: 10,
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
                <span>Maydon: ${p?.total_area ? Number(p.total_area).toFixed(1) : '-'} ga</span>
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

          newPlantations.push({ polygon: poly, data: p });
        }
      });
      
      setOtherPlantations(newPlantations);
    } catch (e) {
      // ignore failures to keep main map usable
      console.error("Ошибка загрузки других плантаций:", e);
    }
  };

  // Загрузка данных плантации
  useEffect(() => {
    const loadPlantation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Если данные переданы через state, используем их
        if (location.state?.previewPlantation) {
          setPlantation(location.state.previewPlantation);
          setLoading(false);
          return;
        }

        // Иначе загружаем с сервера
        const data = await apiRequest(
          `api/plantations/${id}/`,
          {},
          refreshAccessToken,
          authState.accessToken
        );
        setPlantation(data);
      } catch (err) {
        setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    loadPlantation();
  }, [id, location.state, authState.accessToken, refreshAccessToken]);

  // Инициализация карты
  useEffect(() => {
    if (!plantation || !plantation.coordinates) return;

    const ensureScript = () => new Promise((resolve, reject) => {
      if (typeof google !== "undefined") return resolve();
      const existing = document.getElementById("googleMaps");
      if (existing) {
        existing.onload = () => resolve();
        existing.onerror = () => reject();
        return;
      }
      const script = document.createElement("script");
      script.id = "googleMaps";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });

    ensureScript().then(async () => {
      const mapEl = document.getElementById("plantation-preview-map");
      if (!mapEl) return;

      const map = new google.maps.Map(mapEl, {
        center: { lat: 41.2995, lng: 69.2401 },
        zoom: 8,
        mapTypeId: "satellite",
        disableDefaultUI: true,
      });
      mapRef.current = map;

      // Создаем полигон плантации
      const coords = plantation.coordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude
      }));

      if (coords.length > 0) {
        const polygon = new google.maps.Polygon({
          paths: coords,
          strokeColor: "#FF0000",
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: "#FF0000",
          fillOpacity: 0.2,
          map: map,
          zIndex: 10,
        });
        polygonRef.current = polygon;

        // Фокусируем карту на плантации
        const bounds = new google.maps.LatLngBounds();
        coords.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, 120);

        // Загружаем границы районов
        await loadRegionPolygons(map);

        // Загружаем другие плантации фермера
        await loadOtherPlantations(map);
      }
    }).catch(() => {
      setError("Google Maps API yuklashda xatolik yuz berdi");
    });
  }, [plantation, authState.userRole, authState.accessToken, refreshAccessToken]);

  const getLandTypeText = (landType) => {
    const mapping = {
      'lalmi': 'Лалми',
      'suvli': 'Сувли',
      'suvsiz': 'Сувсиз'
    };
    return mapping[landType] || landType;
  };

  const getFruitName = (fruit) => {
    if (!fruit) return 'N/A';
    return fruit.name || fruit;
  };

  const getVarietyName = (variety) => {
    if (!variety) return 'N/A';
    return variety.name || variety;
  };

  const handleViewDetails = () => {
    navigate(`/plantations/${plantation.id}`, { 
      state: { 
        from: location.state?.from || `/farmers/${plantation.farmer?.id}/map`,
        farmer_inn: location.state?.farmer_inn,
        previewPlantation: plantation 
      } 
    });
  };

  const handleEdit = () => {
    navigate(`/plantations/edit/${plantation.id}`, { 
      state: { from: location.state?.from || `/farmers/${plantation.farmer?.id}/map` } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">{error}</div>
      </div>
    );
  }

  if (!plantation) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-300">Plantatsiya topilmadi</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* CSS стили для tooltip'ов */}
      <style jsx>{`
        .tooltip-dark {
          background: #1f2937 !important;
          color: white !important;
          border-radius: 8px !important;
          padding: 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .tooltip-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #62a8ff;
        }
        .tooltip-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          font-size: 14px;
        }
        .tooltip-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
          margin-top: 8px;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(59, 130, 246, 0.1);
          transition: all 0.2s;
        }
        .tooltip-link:hover {
          background: rgba(59, 130, 246, 0.2);
          color: #1d4ed8;
        }
      `}</style>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-5">
          <button
            className="ml-1 md:ml-3 px-3 py-1.5 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors shadow"
            onClick={() => navigate(-1)}
          >
            ← Orqaga
          </button>
          <div className="text-gray-100 font-semibold text-base md:text-xl tracking-tight">
            Plantatsiya ko'rinishi
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Map Section */}
        <div className="w-full md:w-1/2 h-80 md:h-full">
          <div id="plantation-preview-map" className="w-full h-full border border-gray-700" />
        </div>

        {/* Info Panel */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full overflow-y-auto p-6 bg-gray-800 border-l border-gray-700">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{plantation.farmer_name || plantation.name || 'Fermer'}</h2>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                plantation.is_checked 
                  ? 'bg-green-600/20 text-green-300 border-green-500/50' 
                  : (plantation.is_rejected 
                    ? 'bg-red-600/20 text-red-300 border-red-500/50' 
                    : 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50')
              }`}>
                {plantation.is_checked ? 'Tasdiqlangan' : (plantation.is_rejected ? 'Rad etilgan' : 'Kutilmoqda')}
              </span>
            </div>

            {/* Plantation Details */}
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Plantatsiya turi:</span>
                <span className="text-white">{getLandTypeText(plantation.land_type)}</span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>STIR:</span>
                <span className="text-white">{plantation.farmer?.inn || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>Maydon:</span>
                <span className="text-white">{Number(plantation.total_area || 0).toFixed(1)} га</span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>Mintaqa:</span>
                <span className="text-white">
                  {plantation.district?.region?.name || 'N/A'}, {plantation.district?.name || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>Yaratilgan sana:</span>
                <span className="text-white">
                  {plantation.created_at ? new Date(plantation.created_at).getFullYear() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Gallery */}
            {Array.isArray(plantation.images) && plantation.images.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2">Galereya</h3>
                <div className="grid grid-cols-2 gap-2">
                  {plantation.images.slice(0, 4).map((img, idx) => (
                    <img
                      key={idx}
                      src={img.image_url}
                      alt={`Rasm ${idx + 1}`}
                      className="w-full h-20 object-cover border border-gray-600 rounded cursor-pointer hover:opacity-80"
                      onClick={() => setSelectedImage(img.image_url)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Fruits Details */}
            {plantation.fruits && plantation.fruits.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2">Mevalar</h3>
                {plantation.fruits.map((fruit, idx) => (
                  <div key={idx} className="space-y-1 mb-3 p-3 bg-gray-700 rounded border border-gray-600">
                    <div className="flex justify-between text-gray-300">
                      <span>Meva:</span>
                      <span className="text-white">{getFruitName(fruit.fruit)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Sort:</span>
                      <span className="text-white">{getVarietyName(fruit.variety)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Maydon:</span>
                      <span className="text-white">{Number(fruit.area || 0).toFixed(1)} га</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleViewDetails}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded transition-colors"
              >
                Batafsil
              </button>
              <button
                onClick={handleEdit}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded transition-colors"
              >
                Tahrirlash
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
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

export default PlantationPreviewPage;
