import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Polygon } from "@react-google-maps/api";
import uzbGeoJson from "../assets/regions.geojson";

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

  return (
    <LoadScript googleMapsApiKey="ВАШ_API_КЛЮЧ">
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
    </LoadScript>
  );
};

export default Map;
