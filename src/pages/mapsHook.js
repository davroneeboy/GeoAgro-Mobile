import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { fetchPlantationsMap } from "../api/api.js";

const CENTER = [41.2995, 69.2401];
const ZOOM = 6;

export const useMapsHook = ({
  onRegionClick,
  onDistrictClick,
  onMapLoad,
  onPlantationClick,
  accessToken,
}) => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);

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



  const initializeMap = async () => {
    try {
      const response = await fetch("/regions.geojson");
      const geoData = await response.json();

      const geoLayer = L.geoJSON(geoData, {
        style: {
          fillColor: "#52ADEC",
          color: "#fff",
          weight: 1,
          fillOpacity: 0.5,
        },
        onEachFeature: (feature, layer) => {
          const regionName = feature.properties?.ADM1_UZ?.replace(
            /tumani|viloyati/g,
            ""
          );

          layer.bindPopup(
            `<div style="display: flex; align-items: center;">
              <span>${regionName || "Noma'lum"}</span>
            </div>`,
            { className: "customPopupLeaflet", closeButton: false }
          );

          layer.on({
            mouseover() {
              this.openPopup();
              this.setStyle({ fillColor: "#278BE3" });
            },
            mouseout() {
              this.closePopup();
              this.setStyle({ fillColor: "#52ADEC" });
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

      geoLayer.addTo(map);
      map.flyToBounds(geoLayer.getBounds());
    } catch (error) {
      console.error("Error loading regions:", error);
    }
  };

  const loadTumanPlantations = async (districtId) => {
    setLoading(true);
    try {
      const plantations = await fetchPlantationsMap(districtId, accessToken);

      // Удаляем только старые полигоны плантаций
      map.eachLayer((layer) => {
        if (layer instanceof L.Polygon && layer.options && layer.options.isPlantation) {
          map.removeLayer(layer);
        }
      });

      // Tumanni poligon va bog'lar bilan birга ko'rsatish
      plantations.forEach((plantation) => {
        const coordinates = plantation.coordinates.map((coord) => [
          coord.latitude,
          coord.longitude,
        ]);

        // Bog' poligonlarini chizish
        const polygon = L.polygon(coordinates, {
          color: "red",
          fillColor: "red",
          weight: 2,
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
      const response = await fetch(`/uzb-geojson/${regionId}.geojson`);
      const geoData = await response.json();

      // Удаляем все слои кроме базовой карты
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

      // Загружаем все районы региона
      const newGeoLayer = L.geoJSON(geoData, {
        style: {
          fillColor: "#52ADEC",
          color: "#fff",
          weight: 1,
          fillOpacity: 0.5,
        },
        onEachFeature: (feature, layer) => {
          const tumanName = feature.properties?.name || "Noma'lum";
          const tumanId = feature.properties?.id;

          layer.on({
            mouseover() {
              layer
                .bindPopup(`<div><strong>${tumanName}</strong></div>`)
                .openPopup();
            },
            mouseout() {
              layer.closePopup();
            },
            click: async () => {
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
                  weight: 3,
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

      newGeoLayer.addTo(map);
      map.flyToBounds(newGeoLayer.getBounds());
    } catch (error) {
      console.error("Error loading region data:", error);
    }
  };

  // Программно восстановить регион и район
  const restoreRegionAndDistrict = async (regionId, districtId, districtName) => {
    try {
      const response = await fetch(`/uzb-geojson/${regionId}.geojson`);
      const geoData = await response.json();

      // Очистить все слои кроме тайлов
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

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
          weight: 3,
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

  return { mapRef, initializeMap, loadRegionGeoJSON, restoreRegionAndDistrict, loading };
};
