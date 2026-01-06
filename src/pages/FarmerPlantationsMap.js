import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { GOOGLE_API_KEY, API_BASE_URL2 } from "../config";
import AuthContext from "../context/AuthContext";
import { fetchFarmerPlantations } from "../api/api";
import ImageWithHeicSupport from "../components/common/ImageWithHeicSupport";

/* global google */

const FarmerPlantationsMap = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plantations, setPlantations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cacheKey, setCacheKey] = useState(null);
  const farmerInn = location.state?.farmer_inn || null;

  const mapRef = useRef(null);
  const polysRef = useRef([]);

  // Добавляем hover-лейбл для названия в правом верхнем углу
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

  // Фоновые полигоны районов по GeoJSON (ограничение по региону/району)
  const loadRegionPolygons = async (mapInstance, filter = {}) => {
    try {
      const regions = [
        'toshkent', 'navoiy', 'jizzax', 'namangan', 'andijon', 'fargona',
        'samarqand', 'buxoro', 'qashqadaryo', 'surxondaryo', 'qoraqalpogiston',
        'xorazm', 'sirdaryo'
      ];

      const regionPromises = regions.map(async (regionName) => {
        try {
          const response = await fetch(`/uzb-geojson/${regionName}.geojson`);
          if (!response.ok) return;
          const geojson = await response.json();

          geojson.features.forEach((feature, index) => {
            if (!feature.geometry || !feature.geometry.coordinates) return;
            const districtName = feature.properties?.name || feature.properties?.NAME || `District ${index}`;

            const drawRing = (ringCoords) => {
              const paths = ringCoords.map(([lng, lat]) => ({ lat, lng }));
              if (!paths.length) return;
              const polygon = new google.maps.Polygon({
                paths,
                strokeColor: "#ffffff",
                strokeOpacity: 1,
                strokeWeight: 2,
                fillOpacity: 0,
                map: mapInstance,
                clickable: true,
                zIndex: 1,
              });
              addPolygonEventListeners(polygon, districtName, mapInstance);
            };

            if (feature.geometry.type === 'Polygon') {
              drawRing(feature.geometry.coordinates[0]);
            } else if (feature.geometry.type === 'MultiPolygon') {
              feature.geometry.coordinates.forEach((polygonCoords) => {
                polygonCoords.forEach((ringCoords) => drawRing(ringCoords));
              });
            }
          });
        } catch {}
      });

      await Promise.all(regionPromises);
    } catch (e) {
      console.error('Ошибка загрузки фоновых полигонов:', e);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const inn = (farmerInn && String(farmerInn).trim() !== '' && Number(farmerInn) > 0) ? farmerInn : undefined;
        // Простое кэширование - проверяем, изменились ли параметры
        const currentCacheKey = `${id}-${inn || 'no-inn'}`;
        if (cacheKey === currentCacheKey && plantations.length > 0) {
          setLoading(false);
          return;
        }
        
        const results = await fetchFarmerPlantations({ farmer_id: id, farmer_inn: inn }, authState.accessToken);
        setPlantations(Array.isArray(results) ? results : []);
        setCacheKey(currentCacheKey);
        // API возвращает count, но наша функция его не возвращает - можно добавить в будущем
      } catch (e) {
        setError(e.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, farmerInn, authState.accessToken]);

  // Обработчик для показа предпросмотра плантации
  const handlePlantationPreview = async (plantation) => {
    try {
      // Загружаем детальную информацию о плантации, если её нет
      let detailedPlantation = plantation;
      if (!Array.isArray(plantation.images)) {
        const headers = { 'Content-Type': 'application/json' };
        if (authState.accessToken) headers.Authorization = `Bearer ${authState.accessToken}`;
        const res = await fetch(`${API_BASE_URL2}api/plantations/${plantation.id}/`, { headers });
        if (res.ok) {
          detailedPlantation = await res.json();
        }
      }
      
      // Переходим на страницу предпросмотра
      navigate(`/plantations/preview/${plantation.id}`, {
        state: {
          previewPlantation: detailedPlantation,
          from: `/farmers/${id}/map`,
          farmer_inn: farmerInn
        }
      });
    } catch (error) {
      console.error('Ошибка загрузки деталей плантации:', error);
      // Переходим на страницу предпросмотра даже при ошибке
      navigate(`/plantations/preview/${plantation.id}`, {
        state: {
          previewPlantation: plantation,
          from: `/farmers/${id}/map`,
          farmer_inn: farmerInn
        }
      });
    }
  };


  // Фокус на выбранной плантации: подстройка масштаба и выделение контура + загрузка картинок
  const focusOnPlantation = async (p) => {
    try {
      const map = mapRef.current;
      if (!map || !p) return;
      const coords = Array.isArray(p.coordinates)
        ? p.coordinates
            .map((c) => {
              const lat = (c && (c.latitude ?? c.lat));
              const lng = (c && (c.longitude ?? c.lng));
              if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
              return null;
            })
            .filter(Boolean)
        : [];
      if (!coords.length) return;
      const bounds = new google.maps.LatLngBounds();
      coords.forEach(c => bounds.extend(c));
      map.fitBounds(bounds, 120);
      setTimeout(() => { try { map.fitBounds(bounds, 120); } catch(_) {} }, 50);

      setSelected(p);
      polysRef.current.forEach(({ poly, data }) => {
        poly.setOptions({ strokeWeight: data.id === p.id ? 4 : 2 });
      });

      // Догружаем детали (включая images), если их нет
      if (!Array.isArray(p.images)) {
        try {
          const headers = { 'Content-Type': 'application/json' };
          if (authState.accessToken) headers.Authorization = `Bearer ${authState.accessToken}`;
          const res = await fetch(`${API_BASE_URL2}api/plantations/${p.id}/`, { headers });
          if (res.ok) {
            const data = await res.json();
            const images = Array.isArray(data?.images) ? data.images : [];
            setSelected({ ...p, images, district: data?.district });
          }
        } catch {}
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (loading || error) return;
    const mapEl = document.getElementById("farmer-map");
    if (!mapEl) return;

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
      const map = new google.maps.Map(mapEl, {
        center: { lat: 41.2995, lng: 69.2401 },
        zoom: 8,
        mapTypeId: "satellite",
        disableDefaultUI: true,
      });
      mapRef.current = map;
      polysRef.current = [];

      // Определяем туман/регион по первой плантации и грузим только его подложку
      let bgFilter = null;
      try {
        if (Array.isArray(plantations) && plantations.length > 0) {
          const p = plantations[0];
          const headers = { 'Content-Type': 'application/json' };
          if (authState.accessToken) headers.Authorization = `Bearer ${authState.accessToken}`;
          const res = await fetch(`${API_BASE_URL2}api/plantations/${p.id}/`, { headers });
          if (res.ok) {
            const data = await res.json();
            const district_name = data?.district?.name || '';
            const region_id = data?.district?.region;
            if (region_id) bgFilter = { region_id, district_name };
          }
        }
      } catch {}

      if (bgFilter) {
        await loadRegionPolygons(map, bgFilter);
      }

      const bounds = new google.maps.LatLngBounds();
      let anyCoords = false;

      const parseCoords = (arr) => {
        return Array.isArray(arr)
          ? arr
              .map((c) => {
                const lat = (c && (c.latitude ?? c.lat));
                const lng = (c && (c.longitude ?? c.lng));
                if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
                return null;
              })
              .filter(Boolean)
          : [];
      };

      plantations.forEach((p) => {
        const coords = parseCoords(p.coordinates);
        
        if (!coords.length) {
          return;
        }
        
        anyCoords = true;
        const isApproved = !!p.is_checked;
        const isRejected = !!p.is_rejected;
        const stroke = isApproved ? '#20c997' : (isRejected ? '#ff4d4f' : '#fadb14');
        
        
        const poly = new google.maps.Polygon({
          paths: coords,
          strokeColor: stroke,
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: stroke,
          fillOpacity: 0.2,
          map,
          zIndex: 10,
        });
        
        polysRef.current.push({ poly, data: p });
        coords.forEach(c => bounds.extend(c));
        
        poly.addListener('mouseover', () => { 
          poly.setOptions({ strokeWeight: 3 }); 
        });
        poly.addListener('mouseout', () => { 
          if (!selected || selected?.id !== p.id) poly.setOptions({ strokeWeight: 2 }); 
        });
        poly.addListener('click', () => { 
          focusOnPlantation(p); 
        });
      });

      if (anyCoords) {
        map.fitBounds(bounds, 120);
      }
    }).catch(() => {
      setError("Google Maps API yuklashda xatolik yuz berdi");
    });
  }, [loading, error, plantations]);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-5">
          <button
            className="ml-1 md:ml-3 px-3 py-1.5 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors shadow"
            onClick={() => navigate(-1)}
          >
            ← Orqaga
          </button>
          <div className="text-gray-100 font-semibold text-base md:text-xl tracking-tight">
            Fermer planstasiyalari xaritasi
            {plantations.length > 0 && (
              <span className="text-sm text-gray-400 ml-2">
                ({plantations.length} ta)
              </span>
            )}
          </div>
          <div className="w-8" />
        </div>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Yuklanmoqda...</div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-400">{error}</div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row">
          <div className="w-full md:w-2/3 h-80 md:h-auto">
            <div id="farmer-map" className="w-full h-full border border-gray-700" />
          </div>
          <div className="w-full md:w-1/3 h-[50vh] md:h-auto overflow-y-auto p-4 bg-gray-800 border-l border-gray-700">
            {plantations.length === 0 ? (
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 text-center text-gray-300">Bu fermerga tegishli plantatsiyalar topilmadi</div>
            ) : selected ? (
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-white mr-3 truncate">
                      {selected.farmer_name || selected.name || 'Fermer'}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${selected.is_checked ? 'bg-green-600/20 text-green-300 border-green-500/50' : (selected.is_rejected ? 'bg-red-600/20 text-red-300 border-red-500/50' : 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50')}`}>
                        {selected.is_checked ? 'Tasdiqlangan' : (selected.is_rejected ? 'Rad etilgan' : 'Kutilmoqda')}
                      </span>
                      <button className="text-gray-300 hover:text-white px-3 py-1 bg-gray-600 rounded" onClick={() => { setSelected(null); polysRef.current.forEach(({ poly }) => poly.setOptions({ strokeWeight: 2 })); }}>← Ro'yxatga</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-300"><span>ID:</span><span className="text-white">{selected.id}</span></div>
                    <div className="flex justify-between text-gray-300"><span>Maydon:</span><span className="text-white">{Number(selected.total_area || 0).toFixed(1)} ga</span></div>
                    <div className="flex justify-between text-gray-300"><span>Holat:</span><span className="text-white">{selected.is_checked ? 'Tasdiqlangan' : (selected.is_rejected ? 'Rad etilgan' : 'Kutilmoqda')}</span></div>
                    <div className="flex justify-between text-gray-300">
                      <span>Unumdorlik:</span>
                      <span className={`text-white ${selected.fertility_score > 70 ? 'text-green-400' : selected.fertility_score > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {Number(selected.fertility_score || 0).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  {Array.isArray(selected.images) && selected.images.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-white font-semibold mb-2">Galereya</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selected.images.map((img, idx) => (
                          <ImageWithHeicSupport key={idx} src={img.image_url} alt={`Rasm ${idx+1}`} className="w-full h-24 object-cover border border-gray-600 rounded" />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <button
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded"
                      onClick={() => navigate(`/plantations/${selected.id}`, { state: { from: `/farmers/${id}/map`, farmer_inn: farmerInn } })}
                    >
                      Plantatsiyani ochish
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-white font-semibold mb-3">Jami: {plantations.length}</h3>
                  <div className="space-y-2">
                    {plantations.map(p => {
                      const isApproved = !!p.is_checked;
                      const isRejected = !!p.is_rejected;
                      const badgeCls = isApproved ? 'bg-green-600/20 text-green-300 border-green-500/50' : (isRejected ? 'bg-red-600/20 text-red-300 border-red-500/50' : 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50');
                      const statusText = isApproved ? 'Tasdiqlangan' : (isRejected ? 'Rad etilgan' : 'Kutilmoqda');
                      return (
                        <div key={p.id} className={`p-3 bg-gray-700 rounded border border-gray-600 hover:bg-gray-650 cursor-pointer`} onClick={() => handlePlantationPreview(p)}>
                          <div className="flex items-center justify-between">
                            <div className="text-white font-medium truncate">
                              {p.farmer_name || p.name || 'Fermer'}
                            </div>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${badgeCls}`}>{statusText}</span>
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            ID: {p.id} • Maydon: {Number(p.total_area || 0).toFixed(1)} ga
                            {p.fertility_score > 0 && (
                              <span className="ml-2 text-yellow-400">
                                • Unumdorlik: {Number(p.fertility_score).toFixed(0)}
                              </span>
                            )}
                          </div>
                          {Array.isArray(p.images) && p.images.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {p.images.slice(0,2).map((img, idx) => (
                                <ImageWithHeicSupport key={idx} src={img.image_url} alt={`Rasm ${idx+1}`} className="w-full h-16 object-cover border border-gray-600 rounded" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerPlantationsMap;

