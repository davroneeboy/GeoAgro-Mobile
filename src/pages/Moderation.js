import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
import { useNavigate, useLocation } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import AuthContext from "../context/AuthContext";
import { landTypeMapping } from "../context/constants";

const Moderation = () => {
  const [moderations, setModerations] = useState([]);
  const [filters, setFilters] = useState({
    action: "All",
    status: "All",
    type: "All",
  });
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [count, setCount] = useState(0); // добавляем состояние для общего количества записей
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useContext(AuthContext);

  // Читаем номер страницы из URL параметров при загрузке
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const pageFromUrl = urlParams.get('page');
    if (pageFromUrl) {
      const pageNumber = parseInt(pageFromUrl);
      setPage(pageNumber);
      localStorage.setItem('moderationPage', pageNumber);
    }
  }, [location.search]);

  // Сохраняем номер страницы в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('moderationPage', page);
  }, [page]);



    const handleAccept = async (id) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL2}api/plantations/${id}/update/`,
        {
          is_checked: true,
        },
        {
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        }
      );
      
      // Обновляем состояние только после успешного ответа от сервера
      setModerations(prevModerations => 
        prevModerations.map((item) => 
          item.id === id ? { ...item, is_checked: true } : item
        )
      );
      
      console.log("Запись успешно обновлена:", response.data);
    } catch (error) {
      console.error("Ошибка при обновлении записи:", error.response?.data || error.message);
    }
  };

    // Функция для обновления статуса при просмотре
  const handleView = async (id) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL2}api/plantations/${id}/update/`,
        {
          is_checked: true,
        },
        {
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        }
      );
      
      // Обновляем состояние только после успешного ответа от сервера
      setModerations(prevModerations => 
        prevModerations.map((item) => 
          item.id === id ? { ...item, is_checked: true } : item
        )
      );
      
      console.log("Запись успешно обновлена при просмотре:", response.data);
    } catch (error) {
      console.error("Ошибка при обновлении записи при просмотре:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const fetchModerations = async () => {
      try {
        const params = {
          page,
          action: filters.action !== "All" ? filters.action : undefined,
          status: filters.status !== "All" ? filters.status : undefined,
          type: filters.type !== "All" ? filters.type : undefined,
        };
        const response = await axios.get(
          `${API_BASE_URL2}api/plantations/moderation/`,
          { params }
        );
        const formattedData = response.data.results.map((plantation) => {
          let action;
          if (plantation.is_deleting) {
            action = "Удаленный";
          } else if (plantation.prev_data) {
            action = "Обновленный";
          } else {
            action = "Созданный";
          }
          
          const formattedPlantation = {
            id: plantation.id,
            name: plantation.farmer.name,
            type: plantation.land_type,
            area: `${plantation.total_area} га`,
            region: `${plantation.district.region}, ${plantation.district.name}`,
            status: plantation.status,
            createdAt: plantation.created_at,
            is_checked: plantation.is_checked,
            action,
            prev_data: plantation.prev_data,
            is_deleting: plantation.is_deleting,
          };
          
          return formattedPlantation;
        });
        
        setModerations(formattedData);
        
        setNext(response.data.next);
        setPrevious(response.data.previous);
        setCount(response.data.count || 0);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
      }
    };

    fetchModerations();
  }, [page, filters]);

  const handleResetFilters = () => {
    setFilters({ action: "All", status: "All", type: "All" });
  };

  // убираем фронтовую фильтрацию, используем только moderations

  // вычисляем pageSize и totalPages
  const pageSize = moderations.length > 0 ? moderations.length : 20; // если пусто, по умолчанию 20
  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div
        className="flex justify-start items-center mb-5 poiner cursor-pointer border-b-4 pb-5"
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
      <div>
        <h1 className="text-xl font-bold">Moderatsiya</h1>
      </div>

      {/* Фильтры */}
      <div className="flex space-x-4 mb-6">
        <button
          className="flex-1 px-4 py-2 rounded-lg border bg-blue-500 text-white hover:bg-blue-600"
          onClick={handleResetFilters}
        >
          Filterlarni tozalash
        </button>
        <select
          className="flex-1 border border-gray-300 rounded-lg p-2"
          value={filters.action}
          onChange={(e) => {
            setFilters({ ...filters, action: e.target.value });
            setPage(1);
          }}
        >
          <option value="All">O'zgarishlar</option>
          <option value="Yangilangan">Yangilangan</option>
          <option value="Bekor qilinganlar">Bekor qilinganlar</option>
          <option value="Yaratilgan">Yaratilgan</option>
        </select>
        <select
          className="flex-1 border border-gray-300 rounded-lg p-2"
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value });
            setPage(1);
          }}
        >
          <option value="All">Holati</option>
          <option value="Good">Yaxshi</option>
          <option value="Normal">O'rtacha</option>
          <option value="Bad">Sifatsiz</option>
        </select>
        <select
          className="flex-1 border border-gray-300 rounded-lg p-2"
          value={filters.type}
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value });
            setPage(1);
          }}
        >
          <option value="All">Turi</option>
          <option value="Bog'lar">Bog'lar</option>
          <option value="Issiqxonalar">Issiqxonalar</option>
          <option value="Uzumzorlar">Uzumzorlar</option>
        </select>
      </div>

      {/* Список карточек */}
      <div className="space-y-4">
        {moderations.map((plantation) => (
          <div
            key={plantation.id}
            className="p-6 border rounded-lg bg-white shadow-lg grid grid-cols-3 gap-4 items-center"
          >
            {/* Основная информация */}
            <div>
              <div className="flex items-center mb-2">
                <h3 
                  className="text-lg font-bold text-gray-900 mr-3 cursor-pointer hover:text-blue-600"
                  onClick={() => handleView(plantation.id)}
                >
                  {plantation.name}
                </h3>
              </div>
              <p className="text-sm text-gray-700">
                Plantatsiya turi: {landTypeMapping[plantation.type]}
              </p>
              <p className="text-sm text-gray-700">Maydon: {plantation.area}</p>
              <p className="text-sm text-gray-700">
                Region: {plantation.region}
              </p>
              {plantation.createdAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Qo'shilgan vaqti:{" "}
                  {new Date(plantation.createdAt).toLocaleString("ru-RU")}
                </p>
              )}
            </div>

            {/* Данные для изменений, создания или удаления */}
            <div>
              {plantation.action === "Обновленный" && plantation.prev_data && (
                <div className="bg-gray-100 rounded-lg p-4 border text-gray-700">
                  <h4 className="text-sm font-semibold mb-2">O'zgarishlar:</h4>
                  {Object.keys(plantation.prev_data).map((key) => (
                    <p key={key}>
                      {key === "plantation_type" ? "Тип плантации" : key}:{" "}
                      <del>{plantation.prev_data[key].old}</del> →{" "}
                      <span className="font-semibold">
                        {plantation.prev_data[key].new}
                      </span>
                    </p>
                  ))}
                </div>
              )}
              {plantation.action === "Bekor qilinganlar" && (
                <p className="text-red-500 font-bold">Bekor qilinganlar</p>
              )}
              {plantation.action === "Yaratilgan" && (
                <p className="text-green-500 font-bold">Yartilgan</p>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-4">
              <button
                className="py-2 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                onClick={() => handleAccept(plantation.id)}
              >
                Qabul qilish
              </button>
              <button
                className="py-2 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                onClick={() => {
                  handleView(plantation.id);
                  navigate(`/plantations/edit/${plantation.id}`);
                }}
              >
                Tahrirlash
              </button>

            </div>
          </div>
        ))}
      </div>
      {/* Пагинация */}
      <div className="flex justify-center items-center mt-8 space-x-4 pb-6">
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={!previous}
        >
          Назад
        </button>
        <span>Страница {page} из {totalPages}</span>
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={!next}
        >
          Вперед
        </button>
      </div>
    </div>
  );
};

export default Moderation;
