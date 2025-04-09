import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { API_BASE_URL2, GOOGLE_API_KEY } from "../config";
import {
  landTypeMapping,
  subsidyTypeMapping,
  trellisTypeMapping,
  reservoirTypeMapping,
} from "../context/constants";
/* global google */

const EditPlantation = () => {
  const { id } = useParams();
  const [plantation, setPlantation] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [coordinatesChanged, setCoordinatesChanged] = useState(false);
  // const [area, setArea] = useState(0);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const { authState } = useContext(AuthContext);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // Функция для открытия модального окна
  const openModal = () => {
    setIsModalOpen(true);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Функция для закрытия модального окна
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReason("");
    setCustomReason("");
  };

  const handleConfirm = () => {
    const comment =
      selectedReason === "Своя причина" ? customReason : selectedReason;
    const data = {
      plantation_id: plantation.id,
      action: "update",
      comment: comment,
    };

    // Отправка данных на сервер
    fetch(`${API_BASE_URL2}api/plantations/moderation-logs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.accessToken}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        closeModal();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const fetchPlantationDetails = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL2}api/plantations/${id}/`);
      const data = await response.json();
      setPlantation(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching plantation details:", error);
    }
  }, [id]);

  const initializeMap = useCallback(() => {
    const map = new google.maps.Map(document.getElementById("map"), {
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

      const polygon = new google.maps.Polygon({
        paths,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        editable: true,
        draggable: false, // Prevent dragging the polygon
        map,
      });

      const bounds = new google.maps.LatLngBounds();
      paths.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds);

      const updateCoordinates = () => {
        const newCoordinates = polygon
          .getPath()
          .getArray()
          .map((latLng) => ({
            latitude: latLng.lat(),
            longitude: latLng.lng(),
          }));
        setPlantation((prev) => ({
          ...prev,
          coordinates: newCoordinates,
        }));
        // setCoordinatesChanged(true);

        // Calculate area in square meters and convert to hectares
        // const areaInSquareMeters = google.maps.geometry.spherical.computeArea(polygon.getPath());
        // const areaInHectares = areaInSquareMeters / 10000;
        // setArea(areaInHectares.toFixed(2));
      };

      google.maps.event.addListener(
        polygon.getPath(),
        "set_at",
        updateCoordinates
      );
      google.maps.event.addListener(
        polygon.getPath(),
        "insert_at",
        updateCoordinates
      );
      google.maps.event.addListener(
        polygon.getPath(),
        "remove_at",
        updateCoordinates
      );

      // Initial area calculation
      // const initialAreaInSquareMeters = google.maps.geometry.spherical.computeArea(polygon.getPath());
      // const initialAreaInHectares = initialAreaInSquareMeters / 10000;
      // setArea(initialAreaInHectares.toFixed(2));
    }
  }, [plantation]);

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL2}api/plantations/${id}/update/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authState.accessToken}`,
          },
          body: JSON.stringify({
            coordinates: plantation.coordinates,
            isChecked: true,
          }),
        }
      );
      if (response.ok) {
        alert("Ma'lumotlar muvaffaqiyatli saqlandi.");
        // setCoordinatesChanged(false);
        navigate(`/moderation`);
      } else {
        alert("Kordinatlar yangilanmadi.");
      }
    } catch (error) {
      console.error(
        "Kordinatlarni yangilashda hatolik, tekshirib boshidan urinib ko'ring:",
        error
      );
      alert(
        "Kordinatlarni yangilashda hatolik, tekshirib boshidan urinib ko'ring."
      );
    }
  };

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
          <div className="w-1/2 h-full overflow-y-auto p-6 bg-white shadow-lg">
            <h1 className="text-3xl font-bold mb-4">
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
            <div className="flex justify-end space-x-4">
              <button
                className="bg-green-500 mt-3 text-white px-4 py-2 rounded-md disabled:opacity-50"
                onClick={handleSave}
              >
                Tasdiqlash
              </button>
              <button
                className="bg-red-500 mt-3 text-white px-4 py-2 rounded-md disabled:opacity-50"
                onClick={openModal}
              >
                Bekor qilish
              </button>
              {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-6 rounded-md w-96">
                    <h2 className="text-xl mb-4">Выберите причину</h2>
                    <select
                      className="w-full p-2 mb-4 border rounded-md"
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                    >
                      <option value="">Выберите причину</option>
                      <option value="Не правильные координаты">
                        Не правильные координаты
                      </option>
                      <option value="Фотография не соответствует">
                        Фотография не соответствует
                      </option>
                      <option value="Своя причина">Своя причина</option>
                    </select>
                    {selectedReason === "Своя причина" && (
                      <textarea
                        className="w-full p-2 mb-4 border rounded-md"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Введите свою причину"
                      />
                    )}
                    <div className="flex justify-end space-x-4">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-md"
                        onClick={handleConfirm}
                      >
                        Tasdiqlash
                      </button>
                      <button
                        className="bg-gray-500 text-white px-4 py-2 rounded-md"
                        onClick={closeModal}
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

export default EditPlantation;
