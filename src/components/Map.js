import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Polygon } from "@react-google-maps/api";
import uzbGeoJson from "../assets/regions.geojson";
import { GOOGLE_API_KEY } from "../config";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = {
  lat: 41.2995, // Центр Ташкента
  lng: 69.2401,
};

const Map = () => {
  const [mapPolygons, setMapPolygons] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (uzbGeoJson?.features) {
      const polygons = uzbGeoJson.features.map((feature) => {
        const { geometry, properties } = feature;

        if (!geometry || !geometry.coordinates) return null;

        // Обработка Polygon и MultiPolygon
        const paths =
          geometry.type === "Polygon"
            ? geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }))
            : geometry.coordinates.flatMap((group) =>
                group[0].map(([lng, lat]) => ({ lat, lng }))
              );

        return { paths, name: properties.name };
      });

      setMapPolygons(polygons.filter(Boolean));
    }
  }, []);

  // Проверка наличия API ключа
  if (!GOOGLE_API_KEY) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold mb-2">Ошибка загрузки Google Maps</h2>
          <p className="text-gray-400 mb-4">
            API ключ Google Maps не настроен. Проверьте файл .env
          </p>
          <p className="text-sm text-gray-500">
            Убедитесь, что в файле .env есть переменная REACT_APP_GOOGLE_MAPS_API_KEY
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript 
      googleMapsApiKey={GOOGLE_API_KEY}
      onError={(error) => {
        console.error("Ошибка загрузки Google Maps:", error);
        setLoadError(error);
      }}
    >
      {loadError ? (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
          <div className="text-center p-6">
            <h2 className="text-xl font-bold mb-2">Ошибка загрузки Google Maps</h2>
            <p className="text-gray-400 mb-4">
              Не удалось загрузить карту. Возможные причины:
            </p>
            <ul className="text-sm text-gray-500 text-left list-disc list-inside space-y-2 max-w-md mx-auto">
              <li>API ключ неверный или неактивен</li>
              <li>Maps JavaScript API не включен в Google Cloud Console</li>
              <li>Ограничения по домену не включают текущий сайт</li>
              <li>Не настроен биллинг в Google Cloud Console</li>
              <li>Превышены квоты использования API</li>
            </ul>
            <p className="text-xs text-gray-600 mt-4">
              Проверьте настройки в <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a>
            </p>
          </div>
        </div>
      ) : (
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={6}>
          {mapPolygons.map((polygon, index) => (
            <Polygon
              key={index}
              paths={polygon.paths}
              options={{
                fillColor: "#4A90E2",
                fillOpacity: 0.6,
                strokeColor: "#FFFFFF",
                strokeOpacity: 1,
                strokeWeight: 1,
              }}
            />
          ))}
        </GoogleMap>
      )}
    </LoadScript>
  );
};

export default Map;
