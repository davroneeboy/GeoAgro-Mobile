import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { GOOGLE_API_KEY, API_BASE_URL2 } from "../config";
import { useNavigate } from "react-router-dom";
import {
  landTypeMapping,
  subsidyTypeMapping,
  trellisTypeMapping,
  reservoirTypeMapping,
} from "../context/constants";
/* global google */

const PlantationDetail = () => {
  const { id } = useParams();
  const [plantation, setPlantation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const fetchPlantationDetails = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL2}api/plantations/${id}/`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      setPlantation(data);
    } catch (error) {
      console.error("Error fetching plantation details:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const getColorByFertilityScore = (score) => {
    const red = Math.min(255, Math.max(0, 255 - score * 2.55));
    const green = Math.min(255, Math.max(0, score * 2.55));
    return `rgb(${red}, ${green}, 0)`;
  };

  const initializeMap = useCallback(() => {
    const mapInstance = new google.maps.Map(document.getElementById("map"), {
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

      new google.maps.Polygon({
        paths,
        strokeColor: getColorByFertilityScore(plantation.fertility_score),
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: getColorByFertilityScore(plantation.fertility_score),
        fillOpacity: 0.35,
        map: mapInstance,
      });

      const bounds = new google.maps.LatLngBounds();
      paths.forEach((coord) => bounds.extend(coord));
      mapInstance.fitBounds(bounds);
    }
  }, [plantation]);

  useEffect(() => {
    fetchPlantationDetails();
  }, [fetchPlantationDetails]);

  useEffect(() => {
    if (plantation) {
      const loadGoogleMapsScript = () => {
        const existingScript = document.getElementById("googleMaps");
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=geometry`;
          script.id = "googleMaps";
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
      };
      loadGoogleMapsScript();
    }
  }, [plantation, initializeMap]);

  return (
    <div className="flex flex-row h-screen bg-gray-100">
      {loading ? (
        <div className="flex justify-center items-center h-full w-full">
          <p>Маълумотлар юкланмоқда...</p>
        </div>
      ) : plantation ? (
        <>
          <div className="w-1/2 h-full p-4">
            <div id="map" className="w-full h-full border"></div>
          </div>
          <div className="w-1/2 h-full overflow-y-auto p-6 bg-white shadow-lg relative">
            {/* Кнопка закрытия */}
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors z-10"
              onClick={() => {
                console.log('Navigating to moderation...');
                // Получаем номер страницы из URL или localStorage
                const currentPage = localStorage.getItem('moderationPage') || 1;
                window.location.href = `/moderation?page=${currentPage}`;
              }}
              title="Закрыть"
            >
              ✕
            </button>
            <h1 className="text-3xl font-bold mb-4 pr-12">
              {plantation.farmer ? plantation.farmer.name : "Nomalum fermer"}
            </h1>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="font-semibold">Yer turi:</p>
                <p>{landTypeMapping[plantation.land_type]}</p>
              </div>
              <div>
                <p className="font-semibold">Maydoni:</p>
                <p>{plantation.total_area} GA</p>
              </div>
              <div>
                <p className="font-semibold">Hosildorlik bahosi:</p>
                <p>{plantation.fertility_score}</p>
              </div>
              <div>
                <p className="font-semibold">Devor bilan o‘ralgan:</p>
                <p>{plantation.fenced ? "✅" : "🚫"}</p>
              </div>
              <div>
                <p className="font-semibold">Bo‘sh maydon:</p>
                <p>{plantation.empty_area} GA</p>
              </div>
              <div>
                <p className="font-semibold">Suv xovuzlari soni:</p>
                <p>{plantation.reservoir_count}</p>
              </div>
              <div>
                <p className="font-semibold">Quduqlar soni:</p>
                <p>{plantation.pump_station_count}</p>
              </div>
              <div>
                <p className="font-semibold">Fermer INN'si:</p>
                <p>{plantation.farmer?.inn}</p>
              </div>
              <div>
                <p className="font-semibold">
                  Tomchilab sug'oriladigan maydon:
                </p>
                <p>{plantation.irrigation_area} GA</p>
              </div>

            </div>
            {plantation.farmer && (
              <div className="mb-6">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer"
                  onClick={() => toggleSection("farmer")}
                >
                  Фермер:
                </h2>
                {expandedSections.farmer && (
                  <div>
                    <p>Асосчи: {plantation.farmer.founder_name}</p>
                    <p>Директор: {plantation.farmer.director_name}</p>
                    <p>Телефон: {plantation.farmer.phone_number}</p>
                    <p>Манзил: {plantation.farmer.address}</p>
                    <p>INN: {plantation.farmer.inn}</p>
                  </div>
                )}
              </div>
            )}
            {plantation.subsidies.length > 0 && (
              <div className="mb-6">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer"
                  onClick={() => toggleSection("subsidies")}
                >
                  Субсидиялар:
                </h2>
                {expandedSections.subsidies && (
                  <div>
                    {plantation.subsidies.map((subsidy, idx) => (
                      <div key={idx} className="border-b pb-2 mb-2">
                        <p>Йил: {subsidy.year}</p>
                        <p>Йўналиши: {subsidyTypeMapping[subsidy.direction]}</p>
                        <p>Миқдори: {subsidy.amount} UZS</p>
                        <p>Самарадорлиги: {subsidy.efficiency}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.trellises.length > 0 && (
              <div className="mb-6">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer"
                  onClick={() => toggleSection("trellises")}
                >
                  Шпаллерлар:
                </h2>
                {expandedSections.trellises && (
                  <div>
                    {plantation.trellises.map((trellis, idx) => (
                      <div key={idx} className="border-b pb-2 mb-2">
                        <p>
                          Шпаллер тури:{" "}
                          {trellisTypeMapping[trellis.trellis_type]}
                        </p>
                        <p>
                          Шпаллер майдони: {trellis.trellis_installed_area} GA
                        </p>
                        <p>Шпаллерлар сони: {trellis.trellis_count}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.reservoirs.length > 0 && (
              <div className="mb-6">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer"
                  onClick={() => toggleSection("reservoirs")}
                >
                  Сув Ховузлари:
                </h2>
                {expandedSections.reservoirs && (
                  <div>
                    {plantation.reservoirs.map((reservoir, idx) => (
                      <div key={idx} className="border-b pb-2 mb-2">
                        <p>
                          Омбор тури:{" "}
                          {reservoirTypeMapping[reservoir.reservoir_type]}
                        </p>
                        <p>Хажми: {reservoir.reservoir_volume}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.fruit_areas.length > 0 && (
              <div className="mb-6">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer"
                  onClick={() => toggleSection("fruitAreas")}
                >
                  Мевали ҳудудлар:
                </h2>
                {expandedSections.fruitAreas && (
                  <div>
                    {plantation.fruit_areas.map((area, idx) => (
                      <div key={idx} className="border-b pb-2 mb-2">
                        <p>Мева: {area.fruit}</p>
                        <p>Нави: {area.variety}</p>
                        <p>Майдони: {area.area} GA</p>
                        <p>Экилган йили: {area.planted_year}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.images?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Галерея:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {plantation.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Изображение ${idx + 1}`}
                      className="w-full h-24 object-cover border rounded-md cursor-pointer"
                      onClick={() => setSelectedImage(img)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="py-2 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                onClick={() => navigate(`/plantations/edit/${plantation.id}`)}
              >
                Tahrirlash
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-full w-full">
          <p>Плантация топилмади</p>
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
    </div>
  );
};

export default PlantationDetail;
