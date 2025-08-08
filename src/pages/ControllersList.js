import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
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
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div 
          className="flex justify-start items-center mb-6 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <img
            className="h-16 w-auto mr-4"
            src={uzbekistanEmblem}
            alt="O'zbekiston gerbi"
          />
          <p className="text-start font-extrabold text-white max-w-64">
            Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish agentligi
          </p>
        </div>
        <div className="border-b border-gray-700 mb-6 -mx-6" />
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center text-white">Kontrollerlar</h1>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={handleSearchChange}
            className="w-full sm:w-72 p-2 border rounded-lg bg-gray-800 text-white border-gray-600 placeholder-gray-400"
          />
          <select
            value={region}
            onChange={handleRegionChange}
            className="w-full sm:w-56 p-2 border rounded-lg bg-gray-800 text-white border-gray-600"
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
              className="p-4 md:p-6 border rounded-lg bg-gray-800 border-gray-700 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white break-words">{controller.name}</p>
                <p className="text-gray-300 break-words">{controller.email}</p>
                <p className="text-sm text-gray-400 break-words">
                  <span className="font-semibold text-gray-300">Region:</span>{" "}
                  {controller.region}
                  {controller.districts && `, ${controller.districts.join(", ")}`}
                </p>
                <p className="text-sm text-gray-400 break-words">
                  <span className="font-semibold text-gray-300">Tizimga kirgan vahti:</span>{" "}
                  {controller.last_login || "Tizimga kirmagan"}
                </p>
                <p className="text-sm text-gray-400 break-words">
                  <span className="font-semibold text-gray-300">KPI: </span>{" "}
                  {controller.kpi_current.points || 0}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-end">
                <button
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  onClick={openModal}
                >
                  Baholash
                </button>
                <button
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  onClick={() => navigate(`/user/${controller.id}`)}
                >
                  Batafsil
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Пагинация */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <button
            disabled={currentPage === 1}
            onClick={handlePrevPage}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg ${
              currentPage === 1
                ? "bg-gray-700 text-gray-400"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Ortga
          </button>
          <span className="text-gray-300">Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={handleNextPage}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg ${
              currentPage === totalPages
                ? "bg-gray-700 text-gray-400"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Oldinga
          </button>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-md w-96">
            <h2 className="text-xl mb-4 text-white">Hodimni baholang</h2>

            <div className="flex justify-end space-x-4">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                onClick={handleConfirm}
              >
                Tasdiqlash
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
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
