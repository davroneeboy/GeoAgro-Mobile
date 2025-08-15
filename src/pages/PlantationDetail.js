import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams } from "react-router-dom";
import { GOOGLE_API_KEY, API_BASE_URL2 } from "../config";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { apiRequest } from "../utils/apiUtils";
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
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { authState, refreshAccessToken } = useContext(AuthContext);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const fetchPlantationDetails = useCallback(async () => {
    try {
      setError(null);
      const data = await apiRequest(`api/plantations/${id}/`, {}, refreshAccessToken, authState.accessToken);
      setPlantation(data);
    } catch (error) {
      console.error("Error fetching plantation details:", error);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }, [id, authState.accessToken, refreshAccessToken]);

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
    if (!authState.accessToken) {
      console.error("No access token found. Redirecting to login.");
      navigate('/login');
      return;
    }
    fetchPlantationDetails();
  }, [fetchPlantationDetails, authState.accessToken, navigate]);

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
    <div className="flex flex-col md:flex-row h-screen bg-gray-900">
      {loading ? (
        <div className="flex justify-center items-center h-full w-full bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <p className="text-white">Ma'lumotlar yuklanmoqda...</p>
          </div>
        </div>
      ) : plantation ? (
        <>
          <div className="w-full md:w-1/2 h-64 md:h-full p-4">
            <div id="map" className="w-full h-full border border-gray-600 rounded-lg"></div>
          </div>
          <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 bg-gray-800 shadow-lg relative">
            {/* Кнопка закрытия */}
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors z-10"
              onClick={() => {
                console.log('Navigating back...');
                // Получаем номер страницы из URL или localStorage
                const currentPage = localStorage.getItem('moderationPage') || 1;
                navigate(`/moderation?page=${currentPage}`);
              }}
              title="Закрыть"
            >
              ✕
            </button>
            <h1 className="text-3xl font-bold mb-4 pr-12 text-white">
              {plantation.farmer ? plantation.farmer.name : "Nomalum fermer"}
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Yer turi:</p>
                <p className="text-white">{landTypeMapping[plantation.land_type]}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Maydoni:</p>
                <p className="text-white">{plantation.total_area} GA</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Hosildorlik bahosi:</p>
                <p className="text-white">{plantation.fertility_score}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Devor bilan o'ralgan:</p>
                <p className="text-white">{plantation.fenced ? "✅" : "🚫"}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Bo'sh maydon:</p>
                <p className="text-white">{plantation.empty_area} GA</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Suv xovузlari soni:</p>
                <p className="text-white">{plantation.reservoir_count}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Quduqlar soni:</p>
                <p className="text-white">{plantation.pump_station_count}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Fermer INN'si:</p>
                <p className="text-white">{plantation.farmer?.inn}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Tomchilab sug'oriladigan maydon:</p>
                <p className="text-white">{plantation.irrigation_area} GA</p>
              </div>
            </div>

            {plantation.farmer && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("farmer")}
                >
                  Fermer:
                </h2>
                {expandedSections.farmer && (
                  <div className="space-y-2 text-gray-300">
                    <p>Asoschi: {plantation.farmer.founder_name}</p>
                    <p>Direktor: {plantation.farmer.director_name}</p>
                    <p>Telefon: {plantation.farmer.phone_number}</p>
                    <p>Manzil: {plantation.farmer.address}</p>
                    <p>INN: {plantation.farmer.inn}</p>
                  </div>
                )}
              </div>
            )}
            {plantation.subsidies.length > 0 && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("subsidies")}
                >
                  Subsidiyalar:
                </h2>
                {expandedSections.subsidies && (
                  <div>
                    {plantation.subsidies.map((subsidy, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>Yil: {subsidy.year}</p>
                        <p>Yo'nalishi: {subsidyTypeMapping[subsidy.direction]}</p>
                        <p>Miqdori: {subsidy.amount} UZS</p>
                        <p>Samaradorligi: {subsidy.efficiency}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.trellises.length > 0 && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("trellises")}
                >
                  Shpallar:
                </h2>
                {expandedSections.trellises && (
                  <div>
                    {plantation.trellises.map((trellis, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>
                          Shpalla turi:{" "}
                          {trellisTypeMapping[trellis.trellis_type]}
                        </p>
                        <p>
                          Shpalla maydoni: {trellis.trellis_installed_area} GA
                        </p>
                        <p>Shpallar soni: {trellis.trellis_count}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.reservoirs.length > 0 && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("reservoirs")}
                >
                  Suv Xovuzlari:
                </h2>
                {expandedSections.reservoirs && (
                  <div>
                    {plantation.reservoirs.map((reservoir, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>
                          Ombor turi:{" "}
                          {reservoirTypeMapping[reservoir.reservoir_type]}
                        </p>
                        <p>Hajmi: {reservoir.reservoir_volume}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.fruit_areas.length > 0 && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("fruitAreas")}
                >
                  Mevali hududlar:
                </h2>
                {expandedSections.fruitAreas && (
                  <div>
                    {plantation.fruit_areas.map((area, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>Meva: {area.fruit}</p>
                        <p>Nav: {area.variety}</p>
                        <p>Maydoni: {area.area} GA</p>
                        <p>Ekilgan yili: {area.planted_year}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="w-full sm:w-auto py-2 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                onClick={() => navigate(`/plantations/edit/${plantation.id}`)}
              >
                Tahrirlash
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-full w-full bg-gray-900">
          <p className="text-white">Plantatsiya topilmadi</p>
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
