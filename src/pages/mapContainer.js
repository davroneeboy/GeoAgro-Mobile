import React, { useState } from "react";
import { useMapsHook } from "./mapsHook";
import styles from "../assets/styles/MapContainer.module.css"; // Импорт модуля CSS
import L from "leaflet"; // Для работы с координатами на карте
import { API_BASE_URL2 } from "../config";
import { useNavigate } from "react-router-dom";
import { fetchPlantationsMap } from "../api/api.js";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import { landTypeMapping } from "../context/constants";

export default function MapContainer() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [plantations, setPlantations] = useState([]);
  const [selectedPlantation, setSelectedPlantation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null); // Ссылка на карту для работы с координатами
  const [loadingPlantation, setLoading] = useState(false);

  // Инициализация карты
  const handleMapLoad = (map) => {
    setMapInstance(map);
  };

  const handleRegionClick = (regionId, regionName) => {
    setSelectedRegion({ id: regionId, name: regionName });
    setSelectedDistrict(null);
    setPlantations([]);
    setSelectedPlantation(null);
  };

  const handleDistrictClick = async (
    districtId = 1,
    districtName = "Tumani"
  ) => {
    setSelectedDistrict({ id: 1, name: districtName }); // Жестко задаем district_id=1
    setSelectedPlantation(null);

    try {
      const plantations = await fetchPlantationsMap();
      setPlantations(plantations);

      // Отображение координат на карте
      if (mapInstance) {
        mapInstance.eachLayer((layer) => {
          if (layer instanceof L.Polygon || layer instanceof L.Marker) {
            mapInstance.removeLayer(layer); // Удаляем предыдущие полигоны/маркеры
          }
        });

        plantations.forEach((plantation) => {
          const coordinates = plantation.coordinates.map((coord) => [
            coord.latitude,
            coord.longitude,
          ]);

          // Добавляем полигон или маркер на карту
          const polygon = L.polygon(coordinates, {
            color: plantation.is_fertile ? "green" : "red",
            weight: 2,
          }).addTo(mapInstance);

          polygon.bindPopup(
            `<strong>${plantation.name || "Sarlavhasiz"}</strong><br>Площадь: ${
              plantation.total_area
            } га`
          );
        });
      }
    } catch (error) {
      console.error("Error fetching plantations:", error);
    }
  };

  const handlePlantationClick = async (plantation, map) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL2}api/plantations/${plantation.id}/`
      );
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      setSelectedPlantation(data);
      const karta = map || mapInstance;
      const coordinates = data.coordinates.map((coord) => [
        coord.latitude,
        coord.longitude,
      ]);
      karta.fitBounds(L.polygon(coordinates).getBounds());
    } catch (error) {
      console.error("Error fetching plantation details:", error);
    } finally {
      setLoading(false);
    }
  };

  const { mapRef, initializeMap, loadRegionGeoJSON, loading } = useMapsHook({
    onRegionClick: handleRegionClick,
    onDistrictClick: handleDistrictClick,
    onPlantationClick: handlePlantationClick,
    onMapLoad: handleMapLoad,
  });

  return (
    <div className={styles.mapContainer}>
      <div className={styles.mapLeft}>
        <div
          className="flex justify-start items-center mb-5 poiner cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            className="h-20 w-auto mr-3"
            src={uzbekistanEmblem}
            alt="O‘zbekiston gerbi"
          />
          <p className="text-start font-extrabold text-gray-900 max-w-64">
            Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish
            agentligi
          </p>
        </div>
        {loading ? (
          <p className="text-gray-500 font-bold">Yuklanmoqda...</p>
        ) : !selectedRegion ? (
          <h4 className="text-gray-600 font-bold">Viloyatni tanlang</h4>
        ) : !selectedDistrict ? (
          <>
            <button
              className="mb-3 bg-blue-500 font-bold text-white px-4 py-2 rounded-md"
              onClick={() => {
                setSelectedRegion(null);
                initializeMap();
              }}
            >
              Viloyatlarga qaytish
            </button>
            <h4 className="text-gray-600 font-bold">
              Viloyat: {selectedRegion.name}
            </h4>
            <h4 className="text-gray-600 font-bold">Tumanni tanlang</h4>
          </>
        ) : (
          <>
            <button
              className="mb-3 bg-blue-500 text-white font-bold px-4 py-2 rounded-md"
              onClick={() => {
                handleRegionClick(selectedRegion.id, selectedRegion.name);
                loadRegionGeoJSON(selectedRegion.id);
              }}
            >
              Tumanlarga qaytish
            </button>
            <h4 className="text-gray-600 font-bold">
              Bog'lar ({selectedDistrict.name}):
            </h4>
            <div className={styles.cardsWrap}>
              {plantations.length > 0 ? (
                plantations.map((plantation) => (
                  <div
                    key={plantation.id}
                    className={styles.cardsItem}
                    onClick={() => handlePlantationClick(plantation)}
                  >
                    <h5>{plantation.name || "Sarlavhasiz"}</h5>
                    <p>Maydoni: {plantation.total_area} GA</p>
                  </div>
                ))
              ) : (
                <p>Hozircha bog'lar mavjud emas</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className={styles.mapWrapper}>
        <div
          id="map"
          ref={mapRef}
          style={{ width: "100%", height: "100vh" }}
        ></div>
      </div>

      <div className={styles.mapRight}>
        {loadingPlantation ? (
          <div className="flex justify-center items-center h-full w-full">
            <p className="text-gray-500 font-bold">Маълумотлар юкланмоқда...</p>
          </div>
        ) : !selectedPlantation ? (
          <p className="text-gray-500 font-bold">Bog'ni tanlang</p>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">
              {selectedPlantation.farmer?.name || "Sarlavhasiz"}
            </h2>
            <div className="space-y-3">
              {/* Статус удаления */}
              {selectedPlantation.is_deleting && (
                <div className="mt-4 text-red-500 font-semibold">
                  Oʻchirish uchun belgilangan
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Plantatsiya turi:</span>
                <span className="font-medium">
                  {landTypeMapping[selectedPlantation.land_type]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">STIR:</span>
                <span className="font-medium">
                  {selectedPlantation.farmer?.inn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Maydon:</span>
                <span className="font-medium">
                  {selectedPlantation.total_area} га
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mintaqa:</span>
                <span className="font-medium">
                  {selectedPlantation.district?.region},{" "}
                  {selectedPlantation.district?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Yaratilgan sana:</span>
                <span className="font-medium">
                  {selectedPlantation.farmer?.established_year}
                </span>
              </div>
            </div>

            {/* Галерея */}
            {selectedPlantation.images?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Galereya:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPlantation.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Изображение ${idx + 1}`}
                      className="w-full h-24 object-cover border rounded-md cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Площади фруктов */}
            {selectedPlantation.fruit_areas?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Mevalar:</h3>
                <div className="space-y-2">
                  {selectedPlantation.fruit_areas.map((fruit, idx) => (
                    <div key={idx} className="text-sm border-b pb-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Meva:</span>
                        <span className="font-medium">{fruit.fruit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sort:</span>
                        <span className="font-medium">{fruit.variety}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Maydon:</span>
                        <span className="font-medium">{fruit.area} ga</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-center">
              <button
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
                onClick={() =>
                  navigate(`/plantations/${selectedPlantation.id}`)
                }
              >
                Batafsil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
