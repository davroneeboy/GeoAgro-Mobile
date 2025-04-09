import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
import { useNavigate } from "react-router-dom";

const REGION_CHOICES = [
  { id: 1, name: "Tashkent" },
  { id: 2, name: "Andijan" },
  { id: 3, name: "Bukhara" },
  { id: 4, name: "Fergana" },
  { id: 5, name: "Jizzakh" },
  { id: 6, name: "Kashkadarya" },
  { id: 7, name: "Navoi" },
  { id: 8, name: "Namangan" },
  { id: 9, name: "Samarkand" },
  { id: 10, name: "Sirdarya" },
  { id: 11, name: "Surkhandarya" },
  { id: 12, name: "Tashkent Region" },
  { id: 13, name: "Karakalpakstan" },
];

const ControllersList = () => {
  const [controllers, setControllers] = useState([]);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { authState } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchControllers = async () => {
      try {
        const params = {};
        if (region) params.region = region;
        if (search) params.search = search;

        const response = await axios.get(`${API_BASE_URL2}/api/users/`, {
          params: params,
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        });
        setControllers(response.data);
      } catch (error) {
        console.error("Ошибка при получении данных контроллеров:", error);
      }
    };

    fetchControllers();
  }, [region, search, authState.accessToken]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchTimeout(
      setTimeout(() => {
        setSearch(value);
      }, 3000)
    );
  };

  const handleRegionChange = (e) => {
    setRegion(e.target.value);
  };

  const paginatedControllers = controllers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(controllers.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirm = () => {
    const data = {
      plantation_id: "",
      action: "update",
      comment: "",
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

  return (
    <div className="h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Kontrollerlar</h1>

        <div className="mb-4 flex justify-between">
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={handleSearchChange}
            className="p-2 border rounded-lg"
          />
          <select
            value={region}
            onChange={handleRegionChange}
            className="p-2 border rounded-lg"
          >
            <option value="">Barcha regionlar</option>
            {REGION_CHOICES.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {paginatedControllers.map((controller) => (
            <div
              key={controller.id}
              className="p-6 border rounded-lg bg-white shadow-lg flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{controller.name}</p>
                <p>{controller.email}</p>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Region:</span>{" "}
                  {controller.region}
                  {controller.districts &&
                    `, ${controller.districts.join(", ")}`}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Tizimga kirgan vahti:</span>{" "}
                  {controller.last_login || "Tizimga kirmagan"}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">KPI: </span>{" "}
                  {controller.kpi_current.points || 0}
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  className="bg-blue-500 mt-3 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  onClick={openModal}
                >
                  Baholash
                </button>
                <button
                  className="bg-green-500 mt-3 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  onClick={() => navigate(`/user/${controller.id}`)}
                >
                  Batafsil
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Пагинация */}
        <div className="flex justify-between mt-6">
          <button
            disabled={currentPage === 1}
            onClick={handlePrevPage}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
                ? "bg-gray-300"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Ortga
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={handleNextPage}
            className={`px-4 py-2 rounded-lg ${
              currentPage === totalPages
                ? "bg-gray-300"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Oldinga
          </button>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md w-96">
            <h2 className="text-xl mb-4">Hodimni baholang</h2>

            <div className="flex justify-end space-x-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md"
                onClick={handleConfirm}
              >
                Tasdiqlash
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-md"
                onClick={closeModal}
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControllersList;
