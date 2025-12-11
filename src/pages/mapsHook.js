import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { fetchPlantationsMap } from "../api/api.js";

const CENTER = [41.2995, 69.2401];
const ZOOM = 6;
const ZOOM_HIDE_FILL = 12; // При этом зуме убирается заливка

export const useMapsHook = ({
  onRegionClick,
  onDistrictClick,
  onMapLoad,
  onPlantationClick,
  accessToken,
  userRole,
}) => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(ZOOM);
  
  // Refs для слоёв
  const currentDistrictsLayerRef = useRef(null);
  const currentRegionsLayerRef = useRef(null);

  useEffect(() => {
    const mapInstance = L.map(mapRef.current, {
      attributionControl: false,
      zoomControl: false,
    }).setView(CENTER, ZOOM);

    setMap(mapInstance);

    // Используем слой без аннотаций
    L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(mapInstance);

    return () => mapInstance.remove();
  }, []);

  // Обработчик изменения зума для убирания заливки
  useEffect(() => {
    if (!map) return;

    let lastZoom = map.getZoom();

    const handleZoomEnd = () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);

      // Проверяем, пересекли ли порог ZOOM_HIDE_FILL
      const wasAboveThreshold = lastZoom >= ZOOM_HIDE_FILL;
      const isAboveThreshold = newZoom >= ZOOM_HIDE_FILL;

      if (wasAboveThreshold !== isAboveThreshold) {
        // Обновляем стили заливки
        const shouldHideFill = isAboveThreshold;

        if (currentDistrictsLayerRef.current) {
          currentDistrictsLayerRef.current.setStyle({
            fillOpacity: shouldHideFill ? 0 : 0.5,
            fillColor: shouldHideFill ? "transparent" : "#52ADEC",
          });
        }

        if (currentRegionsLayerRef.current) {
          currentRegionsLayerRef.current.setStyle({
            fillOpacity: shouldHideFill ? 0 : 0.5,
            fillColor: shouldHideFill ? "transparent" : "#52ADEC",
          });
        }
      }

      lastZoom = newZoom;
    };

    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  const initializeMap = async () => {
    try {
      const url = "/regions.geojson";
      if (!url) {
        throw new Error('Regions GeoJSON URL is not defined');
      }
      const response = await fetch(url);
      const geoData = await response.json();

      // Сбрасываем refs
      currentDistrictsLayerRef.current = null;
      currentRegionsLayerRef.current = null;

      const geoLayer = L.geoJSON(geoData, {
        style: {
          fillColor: "#52ADEC",
          color: "#fff",
          weight: 2,
          fillOpacity: 0.5,
        },
        onEachFeature: (feature, layer) => {
          const regionName = feature.properties?.ADM1_UZ?.replace(
            /tumani|viloyati/g,
            ""
          );

          // Используем tooltip вместо popup для избежания лагов
          layer.bindTooltip(
            `<div style="display: flex; align-items: center;">
              <span>${regionName || "Noma'lum"}</span>
            </div>`,
            { 
              permanent: false,
              direction: 'center',
              className: 'region-tooltip',
              opacity: 0.9,
              interactive: false, // Важно: tooltip не реагирует на события мыши
              sticky: true // Tooltip следует за курсором
            }
          );

          layer.on({
            mouseover() {
              this.openTooltip();
              this.setStyle({ 
                fillColor: "#1E6BA8", // Более темный синий при наведении
                fillOpacity: 0.7,
                weight: 3
              });
            },
            mouseout() {
              this.closeTooltip();
              this.setStyle({ 
                fillColor: "#52ADEC",
                fillOpacity: 0.5,
                weight: 2
              });
            },
            click: async () => {
              const regionId = feature.properties?.id;
              if (regionId) {
                await loadRegionGeoJSON(regionId);
                onRegionClick(regionId, feature.properties?.name);
              }
            },
          });
        },
      });

      currentRegionsLayerRef.current = geoLayer;
      geoLayer.addTo(map);
      map.flyToBounds(geoLayer.getBounds());
    } catch (error) {
      console.error("Error loading regions:", error);
    }
  };

  const loadTumanPlantations = async (districtId) => {
    setLoading(true);
    try {
      const plantations = await fetchPlantationsMap(districtId, accessToken, userRole);

      // Удаляем только старые полигоны плантаций
      map.eachLayer((layer) => {
        if (layer instanceof L.Polygon && layer.options && layer.options.isPlantation) {
          map.removeLayer(layer);
        }
      });

      // Tumanni poligon va bog'lar bilan birga ko'rsatish
      plantations.forEach((plantation) => {
        const coordinates = plantation.coordinates.map((coord) => [
          coord.latitude,
          coord.longitude,
        ]);

        // Bog' poligonlarini chizish
        const polygon = L.polygon(coordinates, {
          color: "red",
          fillColor: "red",
          weight: 3,
          isPlantation: true, // Флаг для идентификации полигонов плантаций
        }).addTo(map);



        polygon.bindPopup(
          `<strong>${plantation.name || "Sarlavhasiz"}</strong><br>Maydon: ${
            plantation.total_area
          } га`
        );
        polygon.on("click", () => {
          onPlantationClick(plantation, map);
        });
      });
      

      
      setLoading(false);
    } catch (error) {
      console.error("Error loading tuman plantations:", error);
    }
  };

  const loadRegionGeoJSON = async (regionId) => {
    try {
      if (!regionId) {
        throw new Error('Region ID is not defined');
      }
      const url = `/uzb-geojson/${regionId}.geojson`;
      if (!url) {
        throw new Error('Region GeoJSON URL is not defined');
      }
      const response = await fetch(url);
      const geoData = await response.json();

      // Удаляем все слои кроме базовой карты
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

      // Сбрасываем refs
      currentDistrictsLayerRef.current = null;
      currentRegionsLayerRef.current = null;

      const currentZoomLevel = map.getZoom();
      const shouldHideFill = currentZoomLevel >= ZOOM_HIDE_FILL;

      // Загружаем все районы региона
      const newGeoLayer = L.geoJSON(geoData, {
        style: {
          fillColor: shouldHideFill ? "transparent" : "#52ADEC",
          color: "#fff",
          weight: 2,
          fillOpacity: shouldHideFill ? 0 : 0.5,
        },
         onEachFeature: (feature, layer) => {
           const tumanName = feature.properties?.name || "Noma'lum";
           const tumanId = feature.properties?.id;

           // Добавляем tooltip вместо popup для избежания лагов
          layer.bindTooltip(`<div><strong>${tumanName}</strong></div>`, {
            permanent: false,
            direction: 'center',
            className: 'district-tooltip',
            opacity: 0.9,
            interactive: false, // Важно: tooltip не реагирует на события мыши
            sticky: true // Tooltip следует за курсором
          });

           layer.on({
            mouseover() {
              layer.openTooltip();
              layer.setStyle({ 
                fillColor: "#1E6BA8", // Более темный синий при наведении
                fillOpacity: 0.7,
                weight: 3
              });
            },
            mouseout() {
              layer.closeTooltip();
              const zoom = map.getZoom();
              const hideFill = zoom >= ZOOM_HIDE_FILL;
              layer.setStyle({ 
                fillColor: hideFill ? "transparent" : "#52ADEC",
                fillOpacity: hideFill ? 0 : 0.5,
                weight: 2
              });
            },
            click: async () => {
              // Сбрасываем ref районов т.к. переходим к выбору конкретного района
              currentDistrictsLayerRef.current = null;

              // Удаляем все слои кроме базовой карты
              map.eachLayer((l) => {
                if (!(l instanceof L.TileLayer)) {
                  map.removeLayer(l);
                }
              });

              // Добавляем только выбранный район
              const singleTumanLayer = L.geoJSON(feature, {
                style: {
                  fillColor: "transparent",
                  color: "#FFFFFF",
                  weight: 4,
                  fillOpacity: 0,
                },
              });

               singleTumanLayer.addTo(map);
               map.flyToBounds(singleTumanLayer.getBounds());
               
               await loadTumanPlantations(tumanId); // Tumanning `id` bilan funksiyani chaqiramiz
              onDistrictClick(tumanId, tumanName);
            },
          });
        },
      });

      currentDistrictsLayerRef.current = newGeoLayer;
      newGeoLayer.addTo(map);
      map.flyToBounds(newGeoLayer.getBounds());
    } catch (error) {
      console.error("Error loading region data:", error);
    }
  };

  // Программно восстановить регион и район
  const restoreRegionAndDistrict = async (regionId, districtId, districtName) => {
    try {
      if (!regionId) {
        throw new Error('Region ID is not defined in restore');
      }
      const url = `/uzb-geojson/${regionId}.geojson`;
      if (!url) {
        throw new Error('Region GeoJSON URL is not defined in restore');
      }
      const response = await fetch(url);
      const geoData = await response.json();

      // Очистить все слои кроме тайлов
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

      // Сбрасываем refs
      currentDistrictsLayerRef.current = null;
      currentRegionsLayerRef.current = null;

      // Найти нужный район по id
      const targetFeature = geoData.features?.find(
        (f) => String(f.properties?.id) === String(districtId)
      );

      if (!targetFeature) {
        // Если не нашли — просто загрузим регион
        await loadRegionGeoJSON(regionId);
        return;
      }

      // Добавить только выбранный район
      const singleTumanLayer = L.geoJSON(targetFeature, {
        style: {
          fillColor: "transparent",
          color: "#FFFFFF",
          weight: 4,
          fillOpacity: 0,
        },
      });

       singleTumanLayer.addTo(map);
       map.flyToBounds(singleTumanLayer.getBounds());
       
       await loadTumanPlantations(districtId);
      if (typeof onRegionClick === 'function') {
        onRegionClick(regionId, undefined);
      }
      if (typeof onDistrictClick === 'function') {
        onDistrictClick(districtId, districtName || targetFeature.properties?.name);
      }
    } catch (e) {
      console.error('Error restoring region/district:', e);
    }
  };

  useEffect(() => {
    if (map) {
      initializeMap();
      onMapLoad(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return { mapRef, initializeMap, loadRegionGeoJSON, restoreRegionAndDistrict, loading, currentZoom };
};
