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

  const getColorByFertilityScore = (score) => {
    const red = Math.min(255, Math.max(0, 255 - score * 2.55));
    const green = Math.min(255, Math.max(0, score * 2.55));
    return `rgb(${red}, ${green}, 0)`;
  };

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

  const loadTumanPlantations = async () => {
    setLoading(true);
    try {
      const plantations = await fetchPlantationsMap();

      // Tumanni poligon va bog'lar bilan birga ko'rsatish
      plantations.forEach((plantation) => {
        const coordinates = plantation.coordinates.map((coord) => [
          coord.latitude,
          coord.longitude,
        ]);

        // Bog' poligonlarini chizish
        const polygon = L.polygon(coordinates, {
          color: getColorByFertilityScore(plantation.fertility_score),
          fillColor: getColorByFertilityScore(plantation.fertility_score),
          weight: 2,
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

      // Har bir layerni tozalash
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

      // Tumanni yuklash
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
              map.eachLayer((l) => {
                if (!(l instanceof L.TileLayer)) map.removeLayer(l);
              });

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
              onDistrictClick();
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

  useEffect(() => {
    if (map) {
      initializeMap();
      onMapLoad(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return { mapRef, initializeMap, loadRegionGeoJSON, loading };
};
