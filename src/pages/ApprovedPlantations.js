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
    farmer: "All",
    plantation_id: "All",
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
    const validPage = pageToUse > 0 ? pageToUse : 1;
    
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
  const pageSize = 20; // Максимум 20 плантаций на страницу
  const [pageInput, setPageInput] = useState(initialPageFromUrl.toString()); // для поля ввода страницы

  // Функция для получения фильтров из URL
  const getFiltersFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      region: searchParams.get('region') || "All",
      district: searchParams.get('district') || "All",
      farmer: searchParams.get('farmer') || "All",
      plantation_id: searchParams.get('plantation_id') || "All",
    };
  };

  // Функция для сохранения фильтров в URL
  const saveFiltersToUrl = (newFilters, newPage = 1) => {
    const searchParams = new URLSearchParams();
    
    // Добавляем страницу
    searchParams.set('page', newPage.toString());
    
    // Добавляем фильтры только если они не "All"
    if (newFilters.region !== "All") searchParams.set('region', newFilters.region);
    if (newFilters.district !== "All") searchParams.set('district', newFilters.district);
    if (newFilters.farmer && newFilters.farmer !== "All") searchParams.set('farmer', newFilters.farmer);
    if (newFilters.plantation_id && newFilters.plantation_id !== "All") searchParams.set('plantation_id', newFilters.plantation_id);
    
    const newUrl = `/approved-plantations?${searchParams.toString()}`;
    navigate(newUrl, { replace: true });
  };

  // Проверяем токен при загрузке компонента
  useEffect(() => {
    if (!authState.accessToken) {
      
      navigate('/login');
    }
  }, [authState.accessToken, navigate]);

  // Обновляем фильтры при изменении URL
  useEffect(() => {
    const newFilters = getFiltersFromUrl();
    setFilters(newFilters);
  }, [location.search]);

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
      const validSavedPage = savedPage > 0 ? savedPage : 1;
      setPage(validSavedPage);
      window.history.replaceState(null, '', `/approved-plantations?page=${validSavedPage}`);
      return;
    }
    
    const pageNumber = parseInt(pageFromUrl);
    
    if (pageNumber > 0) {
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

  // Вычисляем totalPages
  const totalPages = Math.ceil(count / pageSize);

  // Функция для обработки изменения поля ввода страницы
  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  // Функция для обработки отправки формы с номером страницы
  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const newPage = parseInt(pageInput, 10);
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      localStorage.setItem('approvedPlantationsPage', newPage.toString());
      saveFiltersToUrl(filters, newPage);
    } else {
      // Если введен неверный номер страницы, сбрасываем поле ввода
      setPageInput(page.toString());
    }
  };

  // Функция для перехода в начало
  const goToFirstPage = () => {
    setPage(1);
    setPageInput('1');
    localStorage.setItem('approvedPlantationsPage', '1');
    saveFiltersToUrl(filters, 1);
  };

  // Функция для перехода в конец
  const goToLastPage = () => {
    const lastPage = totalPages > 0 ? totalPages : 1;
    setPage(lastPage);
    setPageInput(lastPage.toString());
    localStorage.setItem('approvedPlantationsPage', lastPage.toString());
    saveFiltersToUrl(filters, lastPage);
  };

  // RBAC: Автоматически устанавливаем фильтр региона для главы региона
  useEffect(() => {
    if (authState.userRole === 'headof_region' && authState.regionId && filters.region === "All") {
      setFilters(prev => ({
        ...prev,
        region: authState.regionId.toString()
      }));
    }
  }, [authState.userRole, authState.regionId, filters.region]);

  // Загружаем данные при изменении страницы или фильтров
  useEffect(() => {
    if (!authState.accessToken) return;
    const fetchApprovedPlantations = async () => {
      if (!authState.accessToken) return;

      setLoading(true);
      setError(null);

      try {
        // Строим параметры запроса с учетом фильтров и пагинации
        const params = {
          page: page.toString(),
          page_size: pageSize.toString(),
          // Новые параметры согласно API
          region_id: filters.region !== "All" ? filters.region : undefined,
          district_id: filters.district !== "All" ? filters.district : undefined,
          farmer: filters.farmer && filters.farmer !== "All" ? filters.farmer : undefined,
          plantation_id: filters.plantation_id && filters.plantation_id !== "All" ? filters.plantation_id : undefined,
        };

        // Используем новый endpoint для одобренных плантаций
        const plantationsEndpoint = `${API_BASE_URL2}api/approved-plantations/`;

        // Используем endpoint для плантаций с пагинацией
        const response = await axios.get(
          plantationsEndpoint,
          {
            params,
            headers: {
              Authorization: `Bearer ${authState.accessToken}`,
            },
          }
        );

        // Обрабатываем данные с пагинацией - новый endpoint уже возвращает полную информацию
        const plantationsData = response.data.results || [];
        
        setPlantations(plantationsData);
        setCount(response.data.count || plantationsData.length);

        // Загружаем информацию о пользователях для отображения имен создателей и модераторов
        const userIds = new Set();
        plantationsData.forEach(plantation => {
          if (plantation.created_by) userIds.add(plantation.created_by);
          if (plantation.moderated_by) userIds.add(plantation.moderated_by);
        });

        // Загружаем только недостающих пользователей  
        const missingUserIds = Array.from(userIds).filter(id => !users[id]);
        if (missingUserIds.length > 0) {
          try {
            const userPromises = missingUserIds.map(async (userId) => {
              try {
                const userResponse = await axios.get(`${API_BASE_URL2}api/users/${userId}/`, {
                  headers: {
                    Authorization: `Bearer ${authState.accessToken}`,
                  },
                });
                return userResponse.data;
              } catch (error) {
                
                return null;
              }
            });

            const userResults = await Promise.all(userPromises);
            const newUsers = { ...users };
            userResults.forEach(user => {
              if (user) {
                newUsers[user.id] = user;
              }
            });
            setUsers(newUsers);
          } catch (userError) {
            console.error("Error fetching users:", userError);
          }
        }
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
  }, [page, filters.region, filters.district, filters.farmer, filters.plantation_id, authState.accessToken, logout, navigate]);

  // eslint-disable-next-line no-unused-vars
  const handlePageChange = (newPage) => {
    setPage(newPage);
    localStorage.setItem('approvedPlantationsPage', newPage.toString());
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters };
    if (filterType === 'region') {
      // При изменении региона сбрасываем район
      newFilters[filterType] = value;
      newFilters.district = "All";
    } else {
      newFilters[filterType] = value;
    }
    setFilters(newFilters);
    setPage(1); // Сбрасываем на первую страницу при изменении фильтров
    localStorage.setItem('approvedPlantationsPage', '1');
    saveFiltersToUrl(newFilters, 1);
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
      1: "Toshkent",
      2: "Andijon",
      3: "Buxoro",
      4: "Farg'ona",
      5: "Jizzax",
      6: "Qashqadaryo",
      7: "Navoiy",
      8: "Namangan",
      9: "Samarqand",
      10: "Sirdaryo",
      11: "Surxondaryo",
      12: "Qoraqalpog'iston",
      13: "Xorazm",
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
    const resetFilters = { region: "All", district: "All", farmer: "All", plantation_id: "All" };
    setFilters(resetFilters);
    setPage(1);
    localStorage.setItem('approvedPlantationsPage', '1');
    saveFiltersToUrl(resetFilters, 1);
  };

  useEffect(() => {
    if (authState.userRole === 'observer') {
      const params = new URLSearchParams(location.search);
      let changed = false;
      if (params.has('region')) { params.delete('region'); changed = true; }
      if (params.has('district')) { params.delete('district'); changed = true; }
      if (changed) {
        const query = params.toString();
        navigate(`/approved-plantations${query ? `?${query}` : ''}`, { replace: true });
      }
      setFilters(prev => ({ ...prev, region: 'All', district: 'All' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.userRole]);


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
            <Link
              to="/rejected-plantations"
              className="block w-full bg-red-500 text-white py-2 rounded-lg font-medium text-center hover:bg-red-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Rad etilgan bog'lar
            </Link>
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="min-h-screen bg-gray-900 flex flex-col">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-white text-2xl font-bold mb-2">
                  Tasdiqlangan bog'lar
                </h1>
                <p className="text-sm text-gray-400">
                  Jami: <span className="text-gray-200 font-semibold">{count}</span> ta tasdiqlangan bog'
                </p>
              </div>

            </div>

            {/* Фильтры */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                className="px-4 py-2 rounded-lg border border-gray-600 bg-green-500 text-white hover:bg-green-600 transition-colors"
                onClick={handleResetFilters}
              >
                Filterlarni tozalash
              </button>
              <input
                type="text"
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Fermer INN yoki ID"
                value={filters.farmer === "All" ? "" : filters.farmer}
                onChange={(e) => handleFilterChange('farmer', e.target.value.trim() || "All")}
              />
              <input
                type="text"
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Planatsiya ID"
                value={filters.plantation_id === "All" ? "" : filters.plantation_id}
                onChange={(e) => handleFilterChange('plantation_id', e.target.value.trim() || "All")}
              />
              <select
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
              >
                <option value="All">Region</option>
                <option value="1">Toshkent</option>
                <option value="2">Andijon</option>
                <option value="3">Buxoro</option>
                <option value="4">Farg'ona</option>
                <option value="5">Jizzax</option>
                <option value="6">Qashqadaryo</option>
                <option value="7">Navoiy</option>
                <option value="8">Namangan</option>
                <option value="9">Samarqand</option>
                <option value="10">Sirdaryo</option>
                <option value="11">Surxondaryo</option>
                <option value="12">Qoraqalpog'iston</option>
                <option value="13">Xorazm</option>
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
                        <h3 className="text-base font-bold text-white mb-1 group-hover:text-green-400 transition-colors">
                          {plantation.farmer?.name || "Sarlavhasiz bog'"}
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
                            : plantation.land_type || "—"}
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

            {/* Пагинация */}
            {plantations.length > 0 && (
              <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Информация о страницах */}
                  <div className="text-sm text-gray-400">
                    Sahifa {page} / {totalPages} ({count} ta jami)
                  </div>
                  
                  {/* Навигация по страницам */}
                  <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                    {/* Кнопка "В начало" */}
                    <button
                      className="p-2 sm:px-3 sm:py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      onClick={goToFirstPage}
                      disabled={page <= 1}
                      title="Birinchi sahifa"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Кнопка "Назад" */}
                    <button
                      className="px-3 sm:px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      onClick={() => {
                        const newPage = Math.max(page - 1, 1);
                        setPage(newPage);
                        localStorage.setItem('approvedPlantationsPage', newPage.toString());
                        saveFiltersToUrl(filters, newPage);
                      }}
                      disabled={page <= 1}
                    >
                      Orqaga
                    </button>
                    
                    {/* Поле ввода номера страницы */}
                    <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1 sm:space-x-2">
                      <input
                        type="number"
                        min="1"
                        max={totalPages || 1}
                        value={pageInput}
                        onChange={handlePageInputChange}
                        className="w-12 sm:w-16 px-1 sm:px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-sm"
                        placeholder={page.toString()}
                      />
                      <button
                        type="submit"
                        className="px-2 sm:px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs sm:text-sm"
                      >
                        O'tish
                      </button>
                    </form>
                    
                    {/* Кнопка "Вперед" */}
                    <button
                      className="px-3 sm:px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      onClick={() => {
                        const newPage = page + 1;
                        if (newPage <= totalPages) {
                          setPage(newPage);
                          localStorage.setItem('approvedPlantationsPage', newPage.toString());
                          saveFiltersToUrl(filters, newPage);
                        }
                      }}
                      disabled={page >= totalPages}
                    >
                      Oldinga
                    </button>
                    
                    {/* Кнопка "В конец" */}
                    <button
                      className="p-2 sm:px-3 sm:py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      onClick={goToLastPage}
                      disabled={page >= totalPages}
                      title="Oxirgi sahifa"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
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

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-3">
        <div className="bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">
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
              className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-green-500 text-white hover:bg-green-600 transition-colors"
              onClick={handleResetFilters}
            >
              Filterlarni tozalash
            </button>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fermer (INN/ID)
              </label>
              <input
                type="text"
                value={filters.farmer === "All" ? "" : filters.farmer}
                onChange={(e) => handleFilterChange('farmer', e.target.value.trim() || "All")}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                placeholder="Masalan: 305123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Planatsiya ID
              </label>
              <input
                type="text"
                value={filters.plantation_id === "All" ? "" : filters.plantation_id}
                onChange={(e) => handleFilterChange('plantation_id', e.target.value.trim() || "All")}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                placeholder="Masalan: 12345"
              />
            </div>
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
                <option value="1">Toshkent</option>
                <option value="2">Andijon</option>
                <option value="3">Buxoro</option>
                <option value="4">Farg'ona</option>
                <option value="5">Jizzax</option>
                <option value="6">Qashqadaryo</option>
                <option value="7">Navoiy</option>
                <option value="8">Namangan</option>
                <option value="9">Samarqand</option>
                <option value="10">Sirdaryo</option>
                <option value="11">Surxondaryo</option>
                <option value="12">Qoraqalpog'iston</option>
                <option value="13">Xorazm</option>
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
                        {plantation.farmer?.name || "Sarlavhasiz bog'"}
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
                          : plantation.land_type || "—"}
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

          {/* Пагинация */}
          {plantations.length > 0 && (
            <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Информация о страницах */}
                <div className="text-sm text-gray-400">
                  Sahifa {page} / {totalPages} ({count} ta jami)
                </div>
                
                {/* Навигация по страницам */}
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                  {/* Кнопка "В начало" */}
                  <button
                    className="p-2 sm:px-3 sm:py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    onClick={goToFirstPage}
                    disabled={page <= 1}
                    title="Birinchi sahifa"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Кнопка "Назад" */}
                  <button
                    className="px-3 sm:px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    onClick={() => {
                      const newPage = Math.max(page - 1, 1);
                      setPage(newPage);
                      localStorage.setItem('approvedPlantationsPage', newPage.toString());
                      saveFiltersToUrl(filters, newPage);
                    }}
                    disabled={page <= 1}
                  >
                    Orqaga
                  </button>
                  
                  {/* Поле ввода номера страницы */}
                  <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1 sm:space-x-2">
                    <input
                      type="number"
                      min="1"
                      max={totalPages || 1}
                      value={pageInput}
                      onChange={handlePageInputChange}
                      className="w-12 sm:w-16 px-1 sm:px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-sm"
                      placeholder={page.toString()}
                    />
                    <button
                      type="submit"
                      className="px-2 sm:px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs sm:text-sm"
                    >
                      O'tish
                    </button>
                  </form>
                  
                  {/* Кнопка "Вперед" */}
                  <button
                    className="px-3 sm:px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    onClick={() => {
                      const newPage = page + 1;
                      if (newPage <= totalPages) {
                        setPage(newPage);
                        localStorage.setItem('approvedPlantationsPage', newPage.toString());
                        saveFiltersToUrl(filters, newPage);
                      }
                    }}
                    disabled={page >= totalPages}
                  >
                    Oldinga
                  </button>
                  
                  {/* Кнопка "В конец" */}
                  <button
                    className="p-2 sm:px-3 sm:py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    onClick={goToLastPage}
                    disabled={page >= totalPages}
                    title="Oxirgi sahifa"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
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