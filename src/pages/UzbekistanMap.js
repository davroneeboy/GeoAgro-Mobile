import React, { useEffect, useState } from "react";
/* global google */
import { GOOGLE_API_KEY } from "../config";

const UzbekistanMap = () => {
  const [regionPolygons, setRegionPolygons] = useState([]);
  const [labels, setLabels] = useState([]);
  const [districtId, setDistrictId] = useState(null);

  // Poligon va yorliqlarni tozalash funksiyasi
  const clearPolygons = () => {
    regionPolygons.forEach((polygon) => {
      polygon.setMap(null); // Poligonni xaritadan olib tashlash
    });
    labels.forEach(({ overlay }) => overlay.setMap(null)); // Yorliqlarni olib tashlash
    setRegionPolygons([]);
    setLabels([]);
  };

  // Xarita va GeoJSONni yuklash
  const initializeMap = async () => {
    try {
      const mapInstance = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 41.2995, lng: 69.2401 },
        zoom: 6,
        mapTypeId: "satellite",
        disableDefaultUI: true,
      });

      const geojson = await fetch("/uzb-geojson/navoiy.geojson").then((res) =>
        res.json()
      );

      loadRegions(geojson, mapInstance);
    } catch (error) {
      console.error("Xarita yoki GeoJSONni yuklashda xato:", error);
    }
  };

  // GeoJSONni xaritaga yuklash funksiyasi
  const loadRegions = (geojson, mapInstance) => {
    try {
      clearPolygons(); // Eski poligonlarni tozalash

      const newPolygons = [];
      const newLabels = [];

      geojson.features.forEach((feature) => {
        const paths = feature.geometry.coordinates.flatMap((group) =>
          group[0].map(([lng, lat]) => ({ lat, lng }))
        );

        // Poligon yaratish
        const polygon = new google.maps.Polygon({
          paths,
          strokeColor: "#FFFFFF",
          strokeOpacity: 0.8,
          strokeWeight: 1,
          fillColor: "#4A90E2",
          fillOpacity: 0.4,
          map: mapInstance,
        });

        newPolygons.push(polygon);

        // Yorliq qo'shish
        const bounds = new google.maps.LatLngBounds();
        paths.forEach((coord) => bounds.extend(coord));
        const center = bounds.getCenter();

        const overlay = new google.maps.OverlayView();
        overlay.onAdd = function () {
          const div = document.createElement("div");
          div.style.position = "absolute";
          div.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
          div.style.color = "white";
          div.style.padding = "5px 10px";
          div.style.borderRadius = "5px";
          div.style.fontWeight = "bold";
          div.style.fontSize = "12px";
          div.innerHTML = feature.properties.name;
          this.div = div;
          this.getPanes().overlayLayer.appendChild(div);
        };

        overlay.draw = function () {
          const projection = this.getProjection();
          const position = projection.fromLatLngToDivPixel(center);
          this.div.style.left = `${position.x - this.div.offsetWidth / 2}px`;
          this.div.style.top = `${position.y - this.div.offsetHeight / 2}px`;
        };

        overlay.onRemove = function () {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        };

        overlay.setMap(mapInstance);
        newLabels.push({ overlay, center });

        // Poligonni bosish hodisasi
        google.maps.event.addListener(polygon, "click", () => {
          const currentDistrictId = feature.properties.id;

          if (districtId === currentDistrictId) {
            return;
          }

          setDistrictId(currentDistrictId);
          localStorage.setItem("districtId", currentDistrictId);

          // Tanlangan hududni ko'rsatish
          mapInstance.fitBounds(bounds);
          clearPolygons(); // Eski hududlarni tozalash

          polygon.setOptions({
            strokeColor: "#FFFFFF",
            strokeWeight: 4,
            fillColor: "#FF0000",
            fillOpacity: 0.5,
          });
        });
      });

      setRegionPolygons(newPolygons);
      setLabels(newLabels);
    } catch (error) {
      console.error("GeoJSONni yuklashda xato:", error);
    }
  };

  // Google Maps API-ni yuklash
  useEffect(() => {
    const loadGoogleMaps = () => {
      const existingScript = document.getElementById("googleMaps");
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}`;
        script.id = "googleMaps";
        script.async = true;
        script.defer = true;
        script.setAttribute('loading', 'async');
        script.onload = initializeMap;
        document.body.appendChild(script);
      } else {
        initializeMap();
      }
    };

    loadGoogleMaps();
  }, []);

  return <div id="map" style={{ width: "100%", height: "100vh" }}></div>;
};

export default UzbekistanMap;
