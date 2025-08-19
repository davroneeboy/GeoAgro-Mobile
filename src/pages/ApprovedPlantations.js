import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
import { useNavigate, useLocation, Link } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import AuthContext from "../context/AuthContext";
// eslint-disable-next-line no-unused-vars
import { landTypeMapping } from "../context/constants";

const ApprovedPlantations = () => {
  const [plantations, setPlantations] = useState([]);
  const [filters, setFilters] = useState({
    region: "All",
    district: "All",
    crop_type: "All",
  });
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [users, setUsers] = useState({}); // Кеш пользователей

  const navigate = useNavigate();
  const location = useLocation();
  const { authState, logout } = useContext(AuthContext);

  // Инициализируем страницу из URL или localStorage
  const initialPageFromUrl = (() => {
    const urlParams = new URLSearchParams(location.search);
    const pageParam = parseInt(urlParams.get("page") || "1", 10);
    const savedPage = parseInt(localStorage.getItem('approvedPlantationsPage') || "1", 10);
    
    const pageToUse = urlParams.get("page") ? pageParam : savedPage;
    const validPage = pageToUse > 0 && pageToUse <= 50 ? pageToUse : 1;
    
    if (!urlParams.get("page") && savedPage !== validPage) {
      window.history.replaceState(null, '', `/approved-plantations?page=${validPage}`);
    }
    
    return validPage;
  })();
  
  const [page, setPage] = useState(initialPageFromUrl);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  // Функция для загрузки районов по региону
  const fetchDistricts = async (regionId) => {
    if (!regionId || regionId === "All") {
      setDistricts([]);
      return;
    }

    setLoadingDistricts(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL2}api/districts/?region=${regionId}`,
        {
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        }
      );
      
      if (response.data && response.data.results) {
        setDistricts(response.data.results);
      } else {
        setDistricts([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке районов:", error);
      setDistricts([]);
      
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Синхронизируем URL с состоянием страницы
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlPage = parseInt(urlParams.get("page") || "1", 10);
    
    if (urlPage !== page && page > 0) {
      window.history.replaceState(null, '', `/approved-plantations?page=${page}`);
    }
  }, [page]);

  // Читаем номер страницы из URL параметров при загрузке
  useEffect(() => {
    const search = location.search;
    const urlParams = new URLSearchParams(search);
    const pageFromUrl = urlParams.get('page');
    
    if (!pageFromUrl) {
      const savedPage = parseInt(localStorage.getItem('approvedPlantationsPage') || "1", 10);
      const validSavedPage = savedPage > 0 && savedPage <= 50 ? savedPage : 1;
      setPage(validSavedPage);
      window.history.replaceState(null, '', `/approved-plantations?page=${validSavedPage}`);
      return;
    }
    
    const pageNumber = parseInt(pageFromUrl);
    
    if (pageNumber > 0 && pageNumber <= 50) {
      setPage(pageNumber);
      localStorage.setItem('approvedPlantationsPage', pageNumber.toString());
    } else {
      setPage(1);
      localStorage.setItem('approvedPlantationsPage', '1');
      navigate('/approved-plantations?page=1', { replace: true });
    }
  }, [location.search, navigate]);

  // Загружаем районы при изменении региона
  useEffect(() => {
    fetchDistricts(filters.region);
  }, [filters.region]);

  // Загружаем данные при изменении страницы или фильтров
  useEffect(() => {
    const fetchApprovedPlantations = async () => {
      if (!authState.accessToken) return;

      setLoading(true);
      setError(null);

      try {
        // Строим параметры запроса с учетом фильтров
        const params = {
          is_checked: 'True',
          region: filters.region !== "All" ? filters.region : undefined,
          district: filters.district !== "All" ? filters.district : undefined,
          crop_type: filters.crop_type !== "All" ? filters.crop_type : undefined,
        };

        // Используем endpoint для карты с подтвержденными плантациями
        const response = await axios.get(
          `${API_BASE_URL2}api/plantations/map/`,
          {
            params,
            headers: {
              Authorization: `Bearer ${authState.accessToken}`,
            },
          }
        );

        // Обрабатываем данные как в fetchPlantationsMap
        const plantationsData = response.data.results || [];
        
        // Загружаем детальную информацию для каждой плантации
        const detailedPlantationsPromises = plantationsData.map(async (plantation) => {
          try {
            const detailResponse = await axios.get(
              `${API_BASE_URL2}api/plantations/${plantation.id}/`,
              {
                headers: {
                  Authorization: `Bearer ${authState.accessToken}`,
                },
                // Подавляем логирование ошибок в консоль
                validateStatus: function (status) {
                  return status < 500; // Не считаем 500 ошибкой для axios
                }
              }
            );
            return detailResponse.data;
          } catch (error) {
            // Если плантация удалена (404 или 500), возвращаем null
            if (error.response?.status === 404 || error.response?.status === 500) {
              console.warn(`Plantation ${plantation.id} not found or deleted, skipping`);
              return null;
            }
            console.error(`Error fetching details for plantation ${plantation.id}:`, error);
            return plantation; // Для других ошибок возвращаем исходные данные
          }
        });
        
        const detailedPlantationsResults = await Promise.all(detailedPlantationsPromises);
        
        // Фильтруем null значения (удаленные плантации)
        const detailedPlantations = detailedPlantationsResults.filter(plantation => plantation !== null);

        // Загружаем информацию о пользователях, если она еще не загружена
        if (Object.keys(users).length === 0 && detailedPlantations.length > 0) {
          try {
            const usersData = await axios.get(`${API_BASE_URL2}api/users/`, {
              headers: {
                Authorization: `Bearer ${authState.accessToken}`,
              },
            });
            
            // Создаем кеш пользователей
            const usersCache = {};
            usersData.data.forEach(user => {
              usersCache[user.id] = user;
            });
            setUsers(usersCache);
          } catch (userError) {
            console.error("Error fetching users:", userError);
          }
        }
        
        setPlantations(detailedPlantations);
        setCount(detailedPlantations.length); // Используем количество успешно загруженных плантаций
      } catch (error) {
        console.error("Ошибка при загрузке подтвержденных плантаций:", error);
        setError("Ошибка при загрузке данных");
        
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedPlantations();
  }, [page, filters, authState.accessToken, logout, navigate, users]);

  // eslint-disable-next-line no-unused-vars
  const handlePageChange = (newPage) => {
    setPage(newPage);
    localStorage.setItem('approvedPlantationsPage', newPage.toString());
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'region') {
      // При изменении региона сбрасываем район
      setFilters(prev => ({ ...prev, [filterType]: value, district: "All" }));
    } else {
      setFilters(prev => ({ ...prev, [filterType]: value }));
    }
    setPage(1); // Сбрасываем на первую страницу при изменении фильтров
    localStorage.setItem('approvedPlantationsPage', '1');
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  const getRegionName = (regionId) => {
    if (!regionId) return "—";
    
    const regionNames = {
      1: "Tashkent",
      2: "Andijan",
      3: "Bukhara",
      4: "Fergana",
      5: "Jizzakh",
      6: "Kashkadarya",
      7: "Navoi",
      8: "Namangan",
      9: "Samarkand",
      10: "Sirdarya",
      11: "Surkhandarya",
      12: "Karakalpakstan",
    };
    
    // Если regionId - это строка с названием региона, возвращаем как есть
    if (typeof regionId === 'string' && regionNames[parseInt(regionId)] === undefined) {
      return regionId;
    }
    
    return regionNames[regionId] || `Region ${regionId}`;
  };

  // Функция для получения имени пользователя
  const getUserName = (userId) => {
    if (!userId || !users[userId]) return "—";
    const user = users[userId];
    return `${user.first_name} ${user.last_name}`.trim() || user.username || `ID: ${userId}`;
  };



  const handleResetFilters = () => {
    setFilters({ region: "All", district: "All", crop_type: "All" });
    setPage(1);
    localStorage.setItem('approvedPlantationsPage', '1');
  };

  // eslint-disable-next-line no-unused-vars
  const totalPages = Math.ceil(count / 20); // Предполагаем 20 элементов на страницу

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Мобильное меню */}
      <div className="lg:hidden bg-gray-800 shadow-lg p-4 border-b border-gray-700 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
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
          <div className="flex items-center space-x-2">
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
              to="/"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bosh sahifa
            </Link>
            <Link
              to="/plantations/uz"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bog'larga o'tish
            </Link>
            <Link
              to="/moderation"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Moderatsiya
            </Link>
          </div>
        )}
      </div>

      {/* Десктопная версия */}
      <div className="hidden lg:flex min-h-screen">
        {/* Левая панель */}
        <div className="w-1/4 p-4 border-r border-gray-700 bg-gray-800 shadow-lg overflow-y-auto">
          <div className="flex justify-start items-center mb-5">
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

          <div className="space-y-3">
            <Link
              to="/"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Bosh sahifa
            </Link>

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
              to="/moderation"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Moderatsiya
            </Link>
          </div>
        </div>

        {/* Центральная панель */}
        <div className="flex-1 bg-gray-900 flex flex-col">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-white text-3xl font-bold mb-2">
                  Tasdiqlangan bog'lar
                </h1>
                <p className="text-sm text-gray-400">
                  Jami: <span className="text-gray-200 font-semibold">{count}</span> ta tasdiqlangan bog'
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Chiqish
              </button>
            </div>

            {/* Фильтры */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                className="px-4 py-2 rounded-lg border border-gray-600 bg-green-500 text-white hover:bg-green-600 transition-colors"
                onClick={handleResetFilters}
              >
                Filterlarni tozalash
              </button>
              <select
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
              >
                <option value="All">Region</option>
                <option value="1">Tashkent</option>
                <option value="2">Andijan</option>
                <option value="3">Bukhara</option>
                <option value="4">Fergana</option>
                <option value="5">Jizzakh</option>
                <option value="6">Kashkadarya</option>
                <option value="7">Navoi</option>
                <option value="8">Namangan</option>
                <option value="9">Samarkand</option>
                <option value="10">Sirdarya</option>
                <option value="11">Surkhandarya</option>
                <option value="12">Karakalpakstan</option>
              </select>
              {filters.region !== "All" && (
                <select
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={filters.district}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                  disabled={loadingDistricts}
                >
                  <option value="All">Barcha tumanlar</option>
                  {loadingDistricts ? (
                    <option value="" disabled>Yuklanmoqda...</option>
                  ) : (
                    districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))
                  )}
                </select>
              )}
              <select
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={filters.crop_type}
                onChange={(e) => handleFilterChange('crop_type', e.target.value)}
              >
                <option value="All">Ekin turi</option>
                <option value="Bog'lar">Bog'lar</option>
                <option value="Issiqxonalar">Issiqxonalar</option>
                <option value="Uzumzorlar">Uzumzorlar</option>
              </select>
            </div>

            {/* Информация о загрузке */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">Ma'lumotlar</h3>
              <p className="text-gray-300 text-sm">
                Bu sahifada faqat tasdiqlangan bog'lar ko'rsatiladi. 
                Jami {count} ta tasdiqlangan bog' topildi.
              </p>
            </div>

            {/* Список плантаций */}
            {loading ? (
              <div className="text-center text-gray-400 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                Yuklanmoqda...
              </div>
            ) : error ? (
              <div className="text-center text-red-400 py-8">
                {error}
              </div>
            ) : plantations.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>Tasdiqlangan bog'lar topilmadi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {plantations.map((plantation) => (
                  <Link
                    key={plantation.id}
                    to={`/plantations/${plantation.id}`}
                    state={{ from: '/approved-plantations' }}
                    className="group block bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-green-500 hover:from-gray-750 hover:to-gray-800 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-green-500/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition-colors">
                          {plantation.name || "Sarlavhasiz bog'"}
                        </h3>
                        <div className="flex items-center space-x-3 text-xs text-gray-400">
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                            </svg>
                            {plantation.total_area} ga
                          </span>
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {getRegionName(plantation.district?.region || plantation.region_id || plantation.region)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">✓</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                      <div className="bg-gray-700/50 rounded-lg p-2 border border-gray-600">
                        <div className="text-xs text-gray-400 mb-1">Qo'shgan</div>
                        <div className="text-white font-semibold text-xs">{getUserName(plantation.created_by)}</div>
                        <div className="text-gray-400 text-xs">{formatDate(plantation.created_at)}</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2 border border-gray-600">
                        <div className="text-xs text-gray-400 mb-1">Tasdiqlagan</div>
                        <div className="text-white font-semibold text-xs">{getUserName(plantation.moderated_by)}</div>
                        <div className="text-gray-400 text-xs">{formatDate(plantation.moderated_at)}</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2 border border-gray-600">
                        <div className="text-xs text-gray-400 mb-1">District</div>
                        <div className="text-white font-semibold text-xs">
                          {plantation.district ? 
                            `${getRegionName(plantation.district.region)}, ${plantation.district.name}` : 
                            "—"
                          }
                        </div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2 border border-gray-600">
                        <div className="text-xs text-gray-400 mb-1">Ekin turi</div>
                        <div className="text-white font-semibold text-xs">
                          {plantation.fruit_areas && plantation.fruit_areas.length > 0 
                            ? plantation.fruit_areas.map(fruit => fruit.fruit).join(', ')
                            : plantation.crop_type || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-gray-700">
                      <div className="flex items-center text-green-400 text-xs font-medium group-hover:text-green-300 transition-colors">
                        <span>Batafsil ko'rish</span>
                        <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Информация о количестве */}
            {plantations.length > 0 && (
              <div className="text-center mt-6">
                <p className="text-gray-400 text-sm">
                  Ko'rsatilgan: {plantations.length} ta tasdiqlangan bog'
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Tasdiqlangan bog'lar
            </h2>
            <button
              onClick={handleLogout}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              Chiqish
            </button>
          </div>
          
          <p className="text-sm text-gray-400 mb-4">
            Jami: <span className="text-gray-200 font-semibold">{count}</span> ta tasdiqlangan bog'
          </p>

          {/* Мобильные фильтры */}
          <div className="space-y-3 mb-4">
            <button
              className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-green-500 text-white hover:bg-green-600 transition-colors text-sm font-medium"
              onClick={handleResetFilters}
            >
              Filterlarni tozalash
            </button>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Viloyat
              </label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="All">Barcha viloyatlar</option>
                <option value="1">Tashkent</option>
                <option value="2">Andijan</option>
                <option value="3">Bukhara</option>
                <option value="4">Fergana</option>
                <option value="5">Jizzakh</option>
                <option value="6">Kashkadarya</option>
                <option value="7">Navoi</option>
                <option value="8">Namangan</option>
                <option value="9">Samarkand</option>
                <option value="10">Sirdarya</option>
                <option value="11">Surkhandarya</option>
                <option value="12">Karakalpakstan</option>
              </select>
            </div>
            {filters.region !== "All" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tuman
                </label>
                <select
                  value={filters.district}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                  disabled={loadingDistricts}
                >
                  <option value="All">Barcha tumanlar</option>
                  {loadingDistricts ? (
                    <option value="" disabled>Yuklanmoqda...</option>
                  ) : (
                    districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Ekin turi
              </label>
              <select
                value={filters.crop_type}
                onChange={(e) => handleFilterChange('crop_type', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="All">Barcha ekinlar</option>
                <option value="uzum">Uzum</option>
                <option value="olma">Olma</option>
                <option value="banan">Banan</option>
                <option value="apelsin">Apelsin</option>
              </select>
            </div>
          </div>

          {/* Мобильный список */}
          {loading ? (
            <div className="text-center text-gray-400 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              Yuklanmoqda...
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">
              {error}
            </div>
          ) : plantations.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              Tasdiqlangan bog'lar topilmadi
            </div>
          ) : (
            <div className="space-y-4">
              {plantations.map((plantation) => (
                <Link
                  key={plantation.id}
                  to={`/plantations/${plantation.id}`}
                  state={{ from: '/approved-plantations' }}
                  className="group block bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-3 border border-gray-600 hover:border-green-500 hover:from-gray-650 hover:to-gray-750 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-green-400 transition-colors">
                        {plantation.name || "Sarlavhasiz bog'"}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                          </svg>
                          {plantation.total_area} ga
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {getRegionName(plantation.district?.region || plantation.region_id || plantation.region)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">✓</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 mb-2">
                    <div className="bg-gray-600/50 rounded p-1.5">
                      <div className="text-xs text-gray-400 mb-0.5">Qo'shgan</div>
                      <div className="text-white font-semibold text-xs">{getUserName(plantation.created_by)}</div>
                      <div className="text-gray-400 text-xs">{formatDate(plantation.created_at)}</div>
                    </div>
                    <div className="bg-gray-600/50 rounded p-1.5">
                      <div className="text-xs text-gray-400 mb-0.5">Tasdiqlagan</div>
                      <div className="text-white font-semibold text-xs">{getUserName(plantation.moderated_by)}</div>
                      <div className="text-gray-400 text-xs">{formatDate(plantation.moderated_at)}</div>
                    </div>
                    <div className="bg-gray-600/50 rounded p-1.5">
                      <div className="text-xs text-gray-400 mb-0.5">District</div>
                      <div className="text-white font-semibold text-xs">
                        {plantation.district ? 
                          `${getRegionName(plantation.district.region)}, ${plantation.district.name}` : 
                          "—"
                        }
                      </div>
                    </div>
                    <div className="bg-gray-600/50 rounded p-1.5">
                      <div className="text-xs text-gray-400 mb-0.5">Ekin turi</div>
                      <div className="text-white font-semibold text-xs">
                        {plantation.fruit_areas && plantation.fruit_areas.length > 0 
                          ? plantation.fruit_areas.map(fruit => fruit.fruit).join(', ')
                          : plantation.crop_type || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1 border-t border-gray-600">
                    <div className="flex items-center text-green-400 text-xs font-medium group-hover:text-green-300 transition-colors">
                      <span>Ko'rish</span>
                      <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Мобильная информация о количестве */}
          {plantations.length > 0 && (
            <div className="text-center mt-4">
              <p className="text-gray-400 text-xs">
                Ko'rsatilgan: {plantations.length} ta tasdiqlangan bog'
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovedPlantations; 