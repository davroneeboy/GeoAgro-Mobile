import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
import { useNavigate, useLocation, Link } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import AuthContext from "../context/AuthContext";
// eslint-disable-next-line no-unused-vars
import { landTypeMapping, FRUIT_TYPES } from "../context/constants";
import {
  getRegionOptions,
  getDistrictsByRegion,
  getRegionNameById
} from "../utils/moderationFilters";

const ApprovedPlantations = () => {
  const [plantations, setPlantations] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, logout } = useContext(AuthContext);

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

  // Инициализируем фильтры из URL при первой загрузке
  const [filters, setFilters] = useState(() => getFiltersFromUrl());
  const [users, setUsers] = useState({}); // Кеш пользователей

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
    // Обновляем только если фильтры действительно изменились
    setFilters(prev => {
      const hasChanged = 
        prev.region !== newFilters.region ||
        prev.district !== newFilters.district ||
        prev.farmer !== newFilters.farmer ||
        prev.plantation_id !== newFilters.plantation_id;
      
      return hasChanged ? newFilters : prev;
    });
  }, [location.search]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Функция для обработки клика на плантацию с сохранением фильтров
  const handlePlantationClick = (plantationId) => {
    // Сохраняем текущие фильтры и страницу перед переходом
    const searchParams = new URLSearchParams();
    searchParams.set('page', page.toString());
    
    if (filters.region !== 'All') searchParams.set('region', filters.region);
    if (filters.district !== 'All') searchParams.set('district', filters.district);
    if (filters.farmer && filters.farmer !== 'All') searchParams.set('farmer', filters.farmer);
    if (filters.plantation_id && filters.plantation_id !== 'All') searchParams.set('plantation_id', filters.plantation_id);
    
    const returnUrl = `/approved-plantations?${searchParams.toString()}`;
    
    navigate(`/plantations/${plantationId}`, { 
      state: { 
        from: returnUrl,
        filters: filters,
        page: page
      } 
    });
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

        // RBAC: Для главы региона автоматически устанавливаем фильтр по региону
        if ((authState.userRole === 'headof_region' || authState.userRole === 2) && authState.regionId && authState.regionId !== null && authState.regionId !== 'null') {
          params.region_id = authState.regionId.toString();
        }

        // RBAC: Определяем endpoint в зависимости от роли пользователя
        let plantationsEndpoint;
        if (authState.userRole === 'headof_region' || authState.userRole === 2) {
          // Для главы региона используем специальный endpoint для его региона
          plantationsEndpoint = `${API_BASE_URL2}api/plantations/forme/approved-plantations/`;
        } else if (authState.userRole === 'observer') {
          // Для наблюдателя — сразу общий список плантаций с фильтрами
          plantationsEndpoint = `${API_BASE_URL2}api/plantations/`;
        } else {
          // Для суперпользователя используем общий endpoint одобренных плантаций
          plantationsEndpoint = `${API_BASE_URL2}api/approved-plantations/`;
        }

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
                {getRegionOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {filters.region !== "All" && (
                <select
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={filters.district}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                >
                  <option value="All">Barcha tumanlar</option>
                  {getDistrictsByRegion(filters.region).map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {plantations.map((plantation) => {
                  // Определяем тип плантации из разных источников
                  let plantationType = "—";
                  
                  // Если types - это объект с plantation_type
                  if (plantation.types && typeof plantation.types === 'object' && plantation.types.plantation_type) {
                    plantationType = plantation.types.plantation_type === 1 ? "Bog'" : 
                                   plantation.types.plantation_type === 2 ? "Uzumzor" : 
                                   plantation.types.plantation_type === 3 ? "Issiqxona" : "—";
                  }
                  // Если types - это число (ID типа), пока не знаем маппинг, пропускаем
                  else if (plantation.crop_type) {
                    const cropType = String(plantation.crop_type).toLowerCase();
                    if (cropType.includes("bog") || cropType === "garden") {
                      plantationType = "Bog'";
                    } else if (cropType.includes("uzum") || cropType === "vineyard") {
                      plantationType = "Uzumzor";
                    } else if (cropType.includes("issiq") || cropType === "greenhouse") {
                      plantationType = "Issiqxona";
                    }
                  }
                  // Если есть fruit_areas, скорее всего это Bog'
                  else if (plantation.fruit_areas && plantation.fruit_areas.length > 0) {
                    plantationType = "Bog'";
                  }
                  
                  const totalInvestments = plantation.investments?.reduce((sum, inv) => sum + (inv.investment_amount || 0), 0) || 0;
                  const totalFruitArea = plantation.fruit_areas?.reduce((sum, fruit) => sum + (fruit.area || 0), 0) || 0;
                  
                  return (
                    <div
                      key={plantation.id}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-green-600 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handlePlantationClick(plantation.id)}
                    >
                      {/* Заголовок с ID и статусом */}
                      <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-700">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded font-medium">
                              #{plantation.id}
                            </span>
                            <span className="inline-block px-2 py-0.5 bg-green-600 text-white text-xs rounded font-semibold">
                              Tasdiqlangan
                            </span>
                            {plantationType && plantationType !== "—" && (
                              <span className="text-xs px-2 py-0.5 bg-green-600/30 text-green-300 rounded">
                                {plantationType}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white mb-0.5 line-clamp-1">
                            {plantation.farmer?.name || "Fermer nomi yo'q"}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {plantation.name || "Sarlavhasiz bog'"}
                          </p>
                        </div>
                      </div>

                      {/* Компактная сетка основной информации */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-gray-700/30 rounded p-1.5 border border-gray-600">
                          <div className="text-gray-400 text-[10px] mb-0.5">Viloyat</div>
                          <div className="text-white font-medium text-xs truncate">
                            {plantation.region_name 
                              ? getRegionNameById(plantation.region_name)
                              : getRegionNameById(plantation.district?.region)}
                          </div>
                        </div>
                        <div className="bg-gray-700/30 rounded p-1.5 border border-gray-600">
                          <div className="text-gray-400 text-[10px] mb-0.5">Tuman</div>
                          <div className="text-white font-medium text-xs truncate">
                            {plantation.district_name || plantation.district?.name || "—"}
                          </div>
                        </div>
                        <div className="bg-gray-700/30 rounded p-1.5 border border-gray-600">
                          <div className="text-gray-400 text-[10px] mb-0.5">Jami maydon</div>
                          <div className="text-white font-semibold text-xs">
                            {plantation.total_area?.toFixed(1) || 0} GA
                          </div>
                        </div>
                        <div className="bg-gray-700/30 rounded p-1.5 border border-gray-600">
                          <div className="text-gray-400 text-[10px] mb-0.5">Ekilgan</div>
                          <div className="text-white font-semibold text-xs">
                            {plantation.planted_area?.toFixed(1) || 0} GA
                          </div>
                        </div>
                        <div className={`rounded p-1.5 border ${plantation.irrigation_area && plantation.irrigation_area > 0 ? 'bg-green-700/20 border-green-600' : 'bg-gray-700/30 border-gray-600'}`}>
                          <div className={`text-[10px] mb-0.5 ${plantation.irrigation_area && plantation.irrigation_area > 0 ? 'text-green-400' : 'text-gray-400'}`}>Sug'oriladi</div>
                          <div className={`font-semibold text-xs ${plantation.irrigation_area && plantation.irrigation_area > 0 ? 'text-green-300' : 'text-white'}`}>
                            {(plantation.irrigation_area || 0).toFixed(1)} GA
                          </div>
                        </div>
                        {plantation.fertility_score !== undefined && (
                          <div className="bg-gray-700/30 rounded p-1.5 border border-gray-600">
                            <div className="text-gray-400 text-[10px] mb-0.5">Unumdorlik</div>
                            <div className={`font-semibold text-xs ${plantation.is_fertile ? 'text-green-300' : 'text-yellow-300'}`}>
                              {plantation.fertility_score.toFixed(0)}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Фермер - компактно */}
                      {plantation.farmer && (
                        <div className="mb-2 p-1.5 bg-gray-700/20 rounded border border-gray-600">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                            {plantation.farmer.inn && (
                              <>
                                <span className="text-gray-400">STIR:</span>
                                <span className="text-white font-medium">{plantation.farmer.inn}</span>
                              </>
                            )}
                            {plantation.farmer.director_name && (
                              <>
                                <span className="text-gray-400">Direktor:</span>
                                <span className="text-white truncate">{plantation.farmer.director_name}</span>
                              </>
                            )}
                            {plantation.farmer.phone_number && (
                              <>
                                <span className="text-gray-400">Tel:</span>
                                <span className="text-white">{plantation.farmer.phone_number}</span>
                              </>
                            )}
                            {plantation.farmer.established_year && (
                              <>
                                <span className="text-gray-400">Tashkil:</span>
                                <span className="text-white">{plantation.farmer.established_year}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Фрукты - компактно */}
                      {plantation.fruit_areas && plantation.fruit_areas.length > 0 && (
                        <div className="mb-2 p-1.5 bg-gray-700/20 rounded border border-gray-600">
                          <div className="text-[10px] text-gray-400 mb-1">
                            Mevalar ({plantation.fruit_areas.length}): {totalFruitArea.toFixed(1)} GA
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {plantation.fruit_areas.slice(0, 4).map((fruit, idx) => {
                              const fruitName = (FRUIT_TYPES[fruit.fruit] || fruit.fruit);
                              return (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-gray-600/50 text-white rounded">
                                  {fruitName}
                                  {fruit.variety && ` (${fruit.variety})`}
                                  <span className="text-gray-300 ml-1">{fruit.area?.toFixed(1)} GA</span>
                                </span>
                              );
                            })}
                            {plantation.fruit_areas.length > 4 && (
                              <span className="text-[10px] text-gray-500 italic">
                                +{plantation.fruit_areas.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Дополнительная информация в одну строку */}
                      <div className="flex flex-wrap gap-2 mb-2 text-[10px]">
                        {plantation.garden_established_year && (
                          <span className="px-1.5 py-0.5 bg-gray-700/30 text-gray-300 rounded">
                            Bog' yili: {plantation.garden_established_year}
                          </span>
                        )}
                        {plantation.land_type && (
                          <span className="px-1.5 py-0.5 bg-gray-700/30 text-gray-300 rounded">
                            {landTypeMapping[Number(plantation.land_type)] || plantation.land_type}
                          </span>
                        )}
                        {totalInvestments > 0 && (
                          <span className="px-1.5 py-0.5 bg-green-700/30 text-green-300 rounded font-medium">
                            Invest: {(totalInvestments / 1000000).toFixed(1)} mln
                          </span>
                        )}
                        {(plantation.irrigation_systems_count || (plantation.reservoirs && plantation.reservoirs.length > 0) || plantation.pump_station_count) && (
                          <span className="px-1.5 py-0.5 bg-gray-700/30 text-gray-300 rounded">
                            Infra: {plantation.irrigation_systems_count || 0} sug'orish, {(plantation.reservoirs?.length || plantation.reservoir_count || 0)} hovuz, {plantation.pump_station_count || 0} nasos
                          </span>
                        )}
                        {(plantation.empty_area || plantation.not_usable_area || plantation.economic_inefficient_area) && (
                          <span className="px-1.5 py-0.5 bg-gray-700/30 text-gray-300 rounded">
                            Bo'sh: {plantation.empty_area?.toFixed(1) || 0}, Foydalanib bo'lmaydi: {plantation.not_usable_area?.toFixed(1) || 0}
                            {plantation.economic_inefficient_area > 0 && `, Samarasiz: ${plantation.economic_inefficient_area.toFixed(1)}`}
                          </span>
                        )}
                      </div>

                      {/* Футер */}
                      <div className="pt-1.5 border-t border-gray-700 flex justify-between items-center text-[10px] text-gray-500">
                        <div className="flex flex-col gap-0.5">
                          <span>Qo'shgan: {getUserName(plantation.created_by)}</span>
                          {plantation.moderated_by && (
                            <span className="text-green-400">Tasdiqlagan: {getUserName(plantation.moderated_by)}</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 text-right">
                          <span>{formatDate(plantation.created_at)}</span>
                          {plantation.moderated_at && (
                            <span className="text-green-400">{formatDate(plantation.moderated_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                {getRegionOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
                >
                  <option value="All">Barcha tumanlar</option>
                  {getDistrictsByRegion(filters.region).map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
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
                <div
                  key={plantation.id}
                  onClick={() => handlePlantationClick(plantation.id)}
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
                          {plantation.total_area?.toFixed(1) || 0} ga
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

                  {/* Мобильная версия - упрощенная карточка */}
                  <div className="text-xs text-gray-400 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span>Qo'shgan: {getUserName(plantation.created_by)}</span>
                      <span>{formatDate(plantation.created_at)}</span>
                    </div>
                    {plantation.moderated_by && (
                      <div className="flex items-center justify-between">
                        <span className="text-green-400">Tasdiqlagan: {getUserName(plantation.moderated_by)}</span>
                        {plantation.moderated_at && (
                          <span className="text-green-400">{formatDate(plantation.moderated_at)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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