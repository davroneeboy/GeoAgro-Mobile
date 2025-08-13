import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, logout } = useContext(AuthContext);

  // Инициализируем страницу сразу из URL, чтобы избежать первого запроса с page=1
  const initialPageFromUrl = (() => {
    const urlParams = new URLSearchParams(location.search);
    const pageParam = parseInt(urlParams.get("page") || "1", 10);
    return pageParam > 0 && pageParam <= 50 ? pageParam : 1;
  })();
  const [page, setPage] = useState(initialPageFromUrl);
  const [count, setCount] = useState(0); // добавляем состояние для общего количества записей
  const [loading, setLoading] = useState(false); // добавляем состояние загрузки
  const [error, setError] = useState(null); // добавляем состояние ошибки
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Проверяем токен при загрузке компонента
  useEffect(() => {
    if (!authState.accessToken) {
      console.log('Токен отсутствует при загрузке компонента, перенаправляем на страницу входа');
      navigate('/login');
    }
  }, [authState.accessToken, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

    // Функция для обновления статуса при просмотре
  const handleView = async (id) => {
    // Проверяем наличие токена перед запросом
    if (!authState.accessToken) {
      console.log('Токен отсутствует, перенаправляем на страницу входа');
      navigate('/login');
      return;
    }

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
      
      // Если получили 401, перенаправляем на страницу входа
      if (error.response?.status === 401) {
        console.log('Токен недействителен (401), перенаправляем на страницу входа');
        logout();
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    const fetchModerations = async () => {
      // Проверяем наличие токена перед запросом
      if (!authState.accessToken) {
        console.log('Токен отсутствует, перенаправляем на страницу входа');
        navigate('/login');
        return;
      }

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
          {
            params,
            headers: {
              Authorization: `Bearer ${authState.accessToken}`,
            },
          }
        );
        
        // Проверяем, что response.data существует и содержит results
        if (!response.data || !response.data.results) {
          setModerations([]);
          setCount(response.data?.count || 0);
          setError(null);
          return;
        }
        
        const formattedData = (Array.isArray(response.data.results) ? response.data.results : [])
          .map((plantation) => {
            try {
              let action;
              if (plantation.is_deleting) {
                action = "Удаленный";
              } else if (plantation.prev_data) {
                action = "Обновленный";
              } else {
                action = "Созданный";
              }

              return {
                id: plantation.id,
                name: plantation.farmer?.name || "—",
                type: plantation.land_type,
                area: `${plantation.total_area ?? 0} га`,
                region: `${plantation.district?.region || "—"}, ${plantation.district?.name || "—"}`,
                status: plantation.status || "—",
                createdAt: plantation.created_at || null,
                is_checked: Boolean(plantation.is_checked),
                action,
                prev_data: plantation.prev_data || null,
                is_deleting: Boolean(plantation.is_deleting),
              };
            } catch (_) {
              return null; // пропускаем битую запись
            }
          })
          .filter(Boolean);
        
        setModerations(formattedData);
        setCount(response.data.count || 0);
        setError(null);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
        
        // Если получили 401, значит токен недействителен
        if (error.response?.status === 401) {
          console.log('Токен недействителен (401), перенаправляем на страницу входа');
          logout();
          navigate('/login');
          return; // Прерываем выполнение, чтобы не устанавливать ошибку
        }
        
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
  }, [page, filters, navigate, authState.accessToken]);

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
    <div className="min-h-screen bg-gray-900 w-full h-full" style={{backgroundColor: '#111827'}}>
      {/* Мобильное меню */}
      <div className="lg:hidden bg-gray-800 shadow-lg p-4 border-b border-gray-700 w-full sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <img
              className="h-10 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                Agrosanoatni rivojlantirish agentligi
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleLogout}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Chiqish
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Мобильное меню выпадающее */}
        {isMobileMenuOpen && (
          <div className="mt-4 space-y-2">
            <Link
              to="/plantations/uz"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bog'larga o'tish
            </Link>
            <Link
              to="/statistics/regions"
              className="block w-full bg-green-500 text-white py-2 rounded-lg font-medium text-center hover:bg-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              To'liq statistika
            </Link>
            <Link
              to="/farmers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Fermerlar
            </Link>
            {/* Kontaktlar перенесены в компактную панель */}
            <Link
              to="/moderation"
              className="block w-full bg-green-500 text-white py-2 rounded-lg font-medium text-center hover:bg-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Moderatsiya
            </Link>
            <Link
              to="/controllers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Nazoratchilar
            </Link>
          </div>
        )}
      </div>

      {/* Десктопная версия */}
      <div className="hidden lg:flex h-screen bg-gray-900 w-full" style={{backgroundColor: '#111827'}}>
        {/* Левая панель */}
        <div className="w-1/4 p-4 border-r border-gray-700 bg-gray-800 shadow-lg h-screen flex flex-col">
          <div 
            className="flex justify-start items-center mb-5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <img
              className="h-20 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <p className="text-start font-extrabold text-white max-w-64">
              Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish
              agentligi
            </p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            <Link
              to="/plantations/uz"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
              Bog'larga o'tish
            </Link>

            <Link
              to="/statistics/regions"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              To'liq statistika
            </Link>

            <Link
              to="/farmers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Fermerlar
            </Link>
          </div>
        </div>

        {/* Центральная панель */}
        <div className="flex-1 bg-gray-900 flex flex-col overflow-y-auto" style={{backgroundColor: '#111827'}}>
          <div className="p-4 sm:p-6 bg-gray-900" style={{backgroundColor: '#111827'}}>
            <h1 className="text-white text-3xl font-bold mb-4 sm:mb-6">
              Moderatsiya
            </h1>

            {/* Фильтры */}
            <div className="flex flex-wrap gap-3 mb-4 sm:mb-6">
              <button
                className="px-4 py-2 rounded-lg border border-gray-600 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                onClick={handleResetFilters}
              >
                Filterlarni tozalash
              </button>
              <select
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
                <strong>Xatolik:</strong> {error}
                <button
                  className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  onClick={() => {
                    setPage(1);
                    navigate('/moderation?page=1', { replace: true });
                  }}
                >
                  Birinchi sahifaga qaytish
                </button>
              </div>
            )}

            {/* Состояние загрузки */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-2 text-white">Yuklanmoqda...</span>
              </div>
            )}

            {/* Список карточек */}
            <div className="space-y-4">
              {!loading && moderations.length === 0 && !error && (
                <div className="text-center py-6 sm:py-8 text-gray-400">
                  Ko'rsatish uchun ma'lumot yo'q
                </div>
              )}
              {moderations.map((plantation) => (
                <div
                  key={plantation.id}
                  className="relative p-6 border border-gray-600 rounded-xl bg-gray-800 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-[1.02] transition-all duration-300 ease-in-out"
                  onClick={() => {
                    handleView(plantation.id);
                    navigate(`/plantations/edit/${plantation.id}`);
                  }}
                >
                  {/* Индикатор статуса */}
                  <div className="absolute top-4 right-4">
                    {plantation.action === "Обновленный" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                        <span className="w-2 h-2 mr-1 bg-blue-400 rounded-full"></span>
                        Yangilangan
                      </span>
                    )}
                    {plantation.action === "Bekor qilinganlar" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-900 text-red-200">
                        <span className="w-2 h-2 mr-1 bg-red-400 rounded-full"></span>
                        Bekor qilingan
                      </span>
                    )}
                    {plantation.action === "Yaratilgan" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                        <span className="w-2 h-2 mr-1 bg-green-400 rounded-full"></span>
                        Yaratilgan
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Основная информация */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center mr-4">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white leading-tight">
                          {plantation.name}
                        </h3>
                      </div>
                      
                      <div className="pl-14 space-y-2">
                        <div className="flex items-center text-sm text-gray-300">
                          <span className="font-medium text-gray-200 min-w-[120px]">Plantatsiya turi:</span>
                          <span className="bg-gray-700 px-2 py-1 rounded-md text-gray-200">
                            {landTypeMapping[plantation.type]}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-300">
                          <span className="font-medium text-gray-200 min-w-[120px]">Maydon:</span>
                          <span className="font-semibold text-blue-400">{plantation.area}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-300">
                          <span className="font-medium text-gray-200 min-w-[120px]">Region:</span>
                          <span className="text-gray-200">{plantation.region}</span>
                        </div>
                        {plantation.createdAt && (
                          <div className="flex items-center text-xs text-gray-400 mt-3 pt-2 border-t border-gray-600">
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
                        <div className="w-full bg-blue-900 border border-blue-700 rounded-lg p-4">
                          <h4 className="text-sm font-bold text-blue-200 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            O'zgarishlar:
                          </h4>
                          <div className="space-y-2">
                            {Object.keys(plantation.prev_data).map((key) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium text-gray-300">
                                  {key === "plantation_type" ? "Тип плантации" : key}:
                                </span>
                                <div className="mt-1">
                                  <span className="line-through text-red-400 bg-red-900 px-2 py-1 rounded mr-2">
                                    {plantation.prev_data[key].old}
                                  </span>
                                  <span className="text-green-400 font-semibold bg-green-900 px-2 py-1 rounded">
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
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    const newPage = Math.max(page - 1, 1);
                    console.log('Back button: setting page to', newPage);
                    setPage(newPage);
                    // Обновляем URL
                    navigate(`/moderation?page=${newPage}`, { replace: true });
                  }}
                  disabled={page <= 1}
                >
                  Orqaga
                </button>
                <span className="text-white">Sahifa {page} dan {totalPages || 1}</span>
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Oldinga
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Правая панель */}
        <div className="w-1/4 p-4 border-l border-gray-700 bg-gray-800 shadow-lg h-screen flex flex-col">
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* Kontaktlar перенесены в компактную панель */}
            <button
              onClick={handleLogout}
              className="block w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Chiqish
            </button>
          </div>
        </div>
      </div>

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-4 bg-gray-900 min-h-screen pb-24" style={{backgroundColor: '#111827'}}>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Moderatsiya
          </h2>
          
          {/* Фильтры для мобильной версии */}
          <div className="space-y-3 mb-4">
            <button
              className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              onClick={handleResetFilters}
            >
              Filterlarni tozalash
            </button>
            <select
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
              <strong>Xatolik:</strong> {error}
              <button
                className="block w-full mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={() => {
                  setPage(1);
                  navigate('/moderation?page=1', { replace: true });
                }}
              >
                Birinchi sahifaga qaytish
              </button>
            </div>
          )}

          {/* Состояние загрузки */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-white">Yuklanmoqda...</span>
            </div>
          )}

          {/* Список карточек для мобильной версии */}
          <div className="space-y-3">
            {!loading && moderations.length === 0 && !error && (
              <div className="text-center py-8 text-gray-400">
                Ko'rsatish uchun ma'lumot yo'q
              </div>
            )}
            {moderations.map((plantation) => (
              <div
                key={plantation.id}
                className="p-4 border border-gray-600 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => {
                  handleView(plantation.id);
                  navigate(`/plantations/edit/${plantation.id}`);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium truncate pr-2">{plantation.name}</h3>
                  {plantation.action === "Обновленный" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                      Yangilangan
                    </span>
                  )}
                  {plantation.action === "Bekor qilinganlar" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-200">
                      Bekor qilingan
                    </span>
                  )}
                  {plantation.action === "Yaratilgan" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                      Yaratilgan
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-300 space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-200 mr-2">Plantatsiya turi:</span>
                    <span className="bg-gray-600 px-2 py-0.5 rounded-md text-gray-100">
                      {landTypeMapping[plantation.type]}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-200 mr-2">Maydon:</span>
                    <span className="font-semibold text-blue-400">{plantation.area}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-200 mr-2">Region:</span>
                    <span className="text-gray-100 truncate">{plantation.region}</span>
                  </div>
                  {plantation.createdAt && (
                    <div className="flex items-center text-xs text-gray-300 pt-2 border-t border-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Qo'shilgan: {new Date(plantation.createdAt).toLocaleString("ru-RU")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Пагинация для мобильной версии */}
          {!loading && !error && moderations.length > 0 && (
            <div className="flex justify-center items-center mt-4 space-x-2 fixed bottom-0 left-0 right-0 z-20 bg-gray-900/95 border-t border-gray-700 px-4 py-2">
              <button
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                onClick={() => {
                  const newPage = Math.max(page - 1, 1);
                  setPage(newPage);
                  navigate(`/moderation?page=${newPage}`, { replace: true });
                }}
                disabled={page <= 1}
              >
                Orqaga
              </button>
              <span className="text-white text-sm">Sahifa {page}</span>
              <button
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                onClick={() => {
                  const newPage = page + 1;
                  if (newPage <= totalPages && newPage <= 50) {
                    setPage(newPage);
                    navigate(`/moderation?page=${newPage}`, { replace: true });
                  }
                }}
                disabled={page >= totalPages || page >= 50}
              >
                Oldinga
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Moderation;
