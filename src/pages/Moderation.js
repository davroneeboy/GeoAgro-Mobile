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
  const [page, setPage] = useState(1); // Всегда начинаем с первой страницы
  const [count, setCount] = useState(0); // добавляем состояние для общего количества записей
  const [loading, setLoading] = useState(false); // добавляем состояние загрузки
  const [error, setError] = useState(null); // добавляем состояние ошибки
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useContext(AuthContext);

  // Читаем номер страницы из URL параметров при загрузке
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const pageFromUrl = urlParams.get('page');
    console.log('URL page param:', pageFromUrl);
    
    // Если нет параметра page в URL, начинаем с первой страницы
    if (!pageFromUrl) {
      console.log('Нет параметра page в URL, начинаем с первой страницы');
      setPage(1);
      return;
    }
    
    // Если есть параметр page в URL
    const pageNumber = parseInt(pageFromUrl);
    console.log('Setting page from URL:', pageNumber);
    
    // Проверяем, что номер страницы валидный
    if (pageNumber > 0 && pageNumber <= 50) {
      setPage(pageNumber);
    } else {
      // Если номер страницы невалидный, сбрасываем на первую страницу
      console.log('Невалидный номер страницы в URL:', pageNumber, ', сбрасываем на первую');
      setPage(1);
      navigate('/moderation?page=1', { replace: true });
    }
  }, [location.search, navigate]);





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
      setLoading(true);
      setError(null);
      
      // Проверяем номер страницы перед каждым запросом
      if (page <= 0 || page > 50) {
        console.log('Невалидный номер страницы:', page, ', сбрасываем на первую');
        setPage(1);
        navigate('/moderation?page=1', { replace: true });
        return;
      }
      
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
        
        // Проверяем, что response.data существует и содержит results
        if (!response.data || !response.data.results) {
          setModerations([]);
          setCount(0);
          return;
        }
        
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
        
        setCount(response.data.count || 0);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
        
        // Если получили 404, значит страница не существует
        if (error.response?.status === 404) {
          console.log('Страница не найдена (404), возвращаемся на первую страницу');
          setPage(1);
          navigate('/moderation?page=1', { replace: true });
          return; // Прерываем выполнение, чтобы не устанавливать ошибку
        }
        
        // Устанавливаем сообщение об ошибке
        setError(error.response?.data?.message || 'Ошибка при загрузке данных');
        
        // Очищаем данные при ошибке
        setModerations([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchModerations();
  }, [page, filters, navigate]);

  const handleResetFilters = () => {
    setFilters({ action: "All", status: "All", type: "All" });
    setPage(1);
    navigate('/moderation?page=1', { replace: true });
    // Очищаем localStorage при сбросе фильтров
    localStorage.removeItem('moderationPage');
  };

  // убираем фронтовую фильтрацию, используем только moderations

  // вычисляем pageSize и totalPages
  const pageSize = 20; // фиксированный размер страницы
  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div
        className="flex justify-start items-center mb-5 poiner cursor-pointer border-b-4 pb-5"
        onClick={() => {
          navigate("/");
        }}
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
            navigate('/moderation?page=1', { replace: true });
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
            navigate('/moderation?page=1', { replace: true });
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
            navigate('/moderation?page=1', { replace: true });
          }}
        >
          <option value="All">Turi</option>
          <option value="Bog'lar">Bog'lar</option>
          <option value="Issiqxonalar">Issiqxonalar</option>
          <option value="Uzumzorlar">Uzumzorlar</option>
        </select>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Ошибка:</strong> {error}
          <button
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              setPage(1);
              navigate('/moderation?page=1', { replace: true });
            }}
          >
            Вернуться на первую страницу
          </button>
        </div>
      )}

      {/* Состояние загрузки */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Загрузка...</span>
        </div>
      )}

      {/* Список карточек */}
      <div className="space-y-4">
        {!loading && moderations.length === 0 && !error && (
          <div className="text-center py-8 text-gray-500">
            Нет данных для отображения
          </div>
        )}
        {moderations.map((plantation) => (
          <div
            key={plantation.id}
            className="relative p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-md hover:shadow-lg cursor-pointer transform hover:scale-[1.02] transition-all duration-300 ease-in-out"
            onClick={() => {
              handleView(plantation.id);
              navigate(`/plantations/edit/${plantation.id}`);
            }}
          >
            {/* Индикатор статуса */}
            <div className="absolute top-4 right-4">
              {plantation.action === "Обновленный" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <span className="w-2 h-2 mr-1 bg-blue-500 rounded-full"></span>
                  Yangilangan
                </span>
              )}
              {plantation.action === "Bekor qilinganlar" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <span className="w-2 h-2 mr-1 bg-red-500 rounded-full"></span>
                  Bekor qilingan
                </span>
              )}
              {plantation.action === "Yaratilgan" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                  Yaratilgan
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Основная информация */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {plantation.name}
                  </h3>
                </div>
                
                <div className="pl-14 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium text-gray-800 min-w-[120px]">Plantatsiya turi:</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                      {landTypeMapping[plantation.type]}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium text-gray-800 min-w-[120px]">Maydon:</span>
                    <span className="font-semibold text-blue-600">{plantation.area}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium text-gray-800 min-w-[120px]">Region:</span>
                    <span className="text-gray-700">{plantation.region}</span>
                  </div>
                  {plantation.createdAt && (
                    <div className="flex items-center text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Qo'shilgan: {new Date(plantation.createdAt).toLocaleString("ru-RU")}
                    </div>
                  )}
                </div>
              </div>

              {/* Данные для изменений, создания или удаления */}
              <div className="flex items-center">
                {plantation.action === "Обновленный" && plantation.prev_data && (
                  <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      O'zgarishlar:
                    </h4>
                    <div className="space-y-2">
                      {Object.keys(plantation.prev_data).map((key) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium text-gray-700">
                            {key === "plantation_type" ? "Тип плантации" : key}:
                          </span>
                          <div className="mt-1">
                            <span className="line-through text-red-500 bg-red-50 px-2 py-1 rounded mr-2">
                              {plantation.prev_data[key].old}
                            </span>
                            <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                              {plantation.prev_data[key].new}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Иконка редактирования */}
            <div className="absolute bottom-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
          </div>
        ))}
      </div>
      {/* Пагинация */}
      {!loading && !error && moderations.length > 0 && (
        <div className="flex justify-center items-center mt-8 space-x-4 pb-6">
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => {
            const newPage = Math.max(page - 1, 1);
            console.log('Back button: setting page to', newPage);
            setPage(newPage);
            // Обновляем URL
            navigate(`/moderation?page=${newPage}`, { replace: true });
          }}
          disabled={page <= 1}
        >
          Назад
        </button>
        <span>Страница {page} из {totalPages || 1}</span>
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => {
            const newPage = page + 1;
            console.log('Forward button: setting page to', newPage);
            // Проверяем, что новая страница не превышает общее количество страниц
            if (newPage <= totalPages && newPage <= 50) {
              setPage(newPage);
              // Обновляем URL
              navigate(`/moderation?page=${newPage}`, { replace: true });
            } else {
              console.log('Попытка перейти на несуществующую страницу:', newPage);
            }
          }}
          disabled={page >= totalPages || page >= 50}
        >
          Вперед
        </button>
        </div>
      )}
    </div>
  );
};

export default Moderation;
