import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
import { useNavigate, useLocation, Link } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import AuthContext from "../context/AuthContext";
import {
  getRegionNameById,
  getRegionOptions,
  getDistrictsByRegion
} from "../utils/moderationFilters";

const RejectedPlantations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, logout } = useContext(AuthContext);
  
  const [plantations, setPlantations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState({});
  const loadingUsersRef = useRef(new Set()); // Отслеживаем загружаемых пользователей
  const loadedUsersRef = useRef(new Set()); // Отслеживаем уже загруженных пользователей
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Инициализируем страницу из URL или localStorage
  const initialPageFromUrl = (() => {
    const urlParams = new URLSearchParams(location.search);
    const pageParam = parseInt(urlParams.get("page") || "1", 10);
    const savedPage = parseInt(localStorage.getItem('rejectedPlantationsPage') || "1", 10);
    
    const pageToUse = urlParams.get("page") ? pageParam : savedPage;
    const validPage = pageToUse > 0 ? pageToUse : 1;
    
    if (!urlParams.get("page") && savedPage !== validPage) {
      window.history.replaceState(null, '', `/rejected-plantations?page=${validPage}`);
    }
    
    return validPage;
  })();
  
  const [page, setPage] = useState(initialPageFromUrl);
  const [pageInput, setPageInput] = useState(initialPageFromUrl.toString());

  // Функция для получения фильтров из URL
  const getFiltersFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      region: searchParams.get('region') || 'All',
      district: searchParams.get('district') || 'All',
      crop_type: searchParams.get('crop_type') || 'All',
      farmer: searchParams.get('farmer') || 'All',
      plantation_id: searchParams.get('plantation_id') || 'All'
    };
  };

  // Функция для сохранения фильтров в URL
  const saveFiltersToUrl = (newFilters, newPage = 1) => {
    const searchParams = new URLSearchParams();
    
    // Добавляем страницу
    searchParams.set('page', newPage.toString());
    
    // Добавляем фильтры только если они не "All"
    if (newFilters.region !== 'All') searchParams.set('region', newFilters.region);
    if (newFilters.district !== 'All') searchParams.set('district', newFilters.district);
    if (newFilters.crop_type !== 'All') searchParams.set('crop_type', newFilters.crop_type);
    if (newFilters.farmer && newFilters.farmer !== 'All') searchParams.set('farmer', newFilters.farmer);
    if (newFilters.plantation_id && newFilters.plantation_id !== 'All') searchParams.set('plantation_id', newFilters.plantation_id);
    
    const newUrl = `/rejected-plantations?${searchParams.toString()}`;
    navigate(newUrl, { replace: true });
    localStorage.setItem('rejectedPlantationsPage', newPage.toString());
  };

  const [filters, setFilters] = useState(() => getFiltersFromUrl());

  const pageSize = 20;
  const totalPages = Math.ceil(count / pageSize);

  // Функции пагинации
  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const newPage = parseInt(pageInput);
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setPageInput('');
      saveFiltersToUrl(filters, newPage);
    }
  };

  const goToFirstPage = () => {
    setPage(1);
    setPageInput('1');
    saveFiltersToUrl(filters, 1);
  };
  
  const goToLastPage = () => {
    setPage(totalPages);
    setPageInput(totalPages.toString());
    saveFiltersToUrl(filters, totalPages);
  };

  // Функции для работы с фильтрами
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      // При изменении региона сбрасываем туман
      const newFilters = { ...prev, [filterType]: value };
      if (filterType === 'region') {
        newFilters.district = 'All';
      }
      // Сохраняем фильтры в URL
      saveFiltersToUrl(newFilters, 1);
      return newFilters;
    });
    
    // Сброс страницы при изменении фильтров
    setPage(1);
    localStorage.setItem('rejectedPlantationsPage', '1');
  };

  const handleResetFilters = () => {
    const resetFilters = {
      region: 'All',
      district: 'All',
      crop_type: 'All',
      farmer: 'All',
      plantation_id: 'All'
    };
    setFilters(resetFilters);
    setPage(1);
    saveFiltersToUrl(resetFilters, 1);
  };

  // Проверяем является ли пользователь админом или главой региона
  const isAdmin = () => {
    return authState.userRole === 'superuser' || authState.userRole === 'headof_region';
  };


  // Функция для получения имени пользователя
  const getUserName = (userId) => {
    if (!userId) return "—";
    const user = users[userId];
    if (!user) return "Yuklanmoqda...";
    return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "Noma'lum";
  };

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Функция для получения информации о пользователе
  const fetchUserDetails = useCallback(async (userId) => {
    if (!userId || loadingUsersRef.current.has(userId) || loadedUsersRef.current.has(userId)) {
      return;
    }
    
    loadingUsersRef.current.add(userId);
    
    try {
      const response = await axios.get(`${API_BASE_URL2}api/users/${userId}/`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` }
      });
      setUsers(prev => ({ ...prev, [userId]: response.data }));
      loadedUsersRef.current.add(userId);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      loadingUsersRef.current.delete(userId);
    }
  }, [authState.accessToken]);

  const fetchRejectedPlantations = useCallback(async () => {
    if (!authState?.accessToken) return;
    
    try {
      setLoading(true);
      setError(null);

      // Определяем какой endpoint использовать в зависимости от роли пользователя
      // Примечание: обычный пользователь (user) не имеет доступа к этой странице
      let plantationsEndpoint;
      
      if (authState.userRole === 'superuser' || authState.userRole === 'observer') {
        // Для суперпользователя и наблюдателя используем API для просмотра всех отклоненных плантаций
        plantationsEndpoint = `${API_BASE_URL2}api/plantations/moderation/rejected/`;
      } else if (authState.userRole === 'headof_region' || authState.userRole === 2) {
        // Для главы региона используем API для их региона с фильтрацией по региону
        plantationsEndpoint = `${API_BASE_URL2}api/plantations/forme/moderation/rejected/`;
      } else {
        // Для обычных пользователей используем API для их района (но они не имеют доступа к этой странице)
        plantationsEndpoint = `${API_BASE_URL2}api/plantations/forme/moderation/rejected/`;
      }

      // Получаем список отклоненных плантаций с деталями через новый endpoint
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      });

      // RBAC: Для headof_region принудительно устанавливаем фильтр по региону в первую очередь
      if ((authState.userRole === 'headof_region' || authState.userRole === 2) && authState.regionId && authState.regionId !== null && authState.regionId !== 'null') {
        params.set('region_id', authState.regionId.toString());
      } else if (filters.region !== 'All') {
        // Добавляем фильтр по региону только если он не установлен принудительно
        params.append('region_id', filters.region);
      }

      // Добавляем остальные фильтры в параметры запроса
      if (filters.district !== 'All') {
        params.append('district_id', filters.district);
      }
      if (filters.crop_type !== 'All') {
        params.append('land_type', filters.crop_type);
      }
      if (filters.farmer && filters.farmer !== 'All') {
        params.append('farmer', filters.farmer);
      }
      if (filters.plantation_id && filters.plantation_id !== 'All') {
        params.append('plantation_id', filters.plantation_id);
      }
      
      const response = await axios.get(`${plantationsEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` }
      });
      
      const plantationsData = response.data.results || [];

      
      
      // Новые endpoints уже возвращают только отклонённые плантации.
      // Не отбрасываем записи даже если комментарий отсутствует, чтобы список не пустел.
      const normalized = plantationsData;

      setPlantations(normalized);
      setCount(response.data.count || normalized.length); // Используем count из API response если есть

      // Загружаем информацию о пользователях
      const userIds = new Set();
      normalized.forEach(plantation => {
        if (plantation.created_by) userIds.add(plantation.created_by);
        if (plantation.moderated_by) userIds.add(plantation.moderated_by);
      });

      userIds.forEach(userId => fetchUserDetails(userId));

    } catch (error) {
      console.error("Error fetching rejected plantations:", error);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [authState.userRole, authState.regionId, authState.accessToken, page, filters, fetchUserDetails]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Переход к деталям плантации
  const handlePlantationClick = (plantationId) => {
    // Сохраняем текущие фильтры и страницу перед переходом
    const searchParams = new URLSearchParams();
    searchParams.set('page', page.toString());
    
    if (filters.region !== 'All') searchParams.set('region', filters.region);
    if (filters.district !== 'All') searchParams.set('district', filters.district);
    if (filters.crop_type !== 'All') searchParams.set('crop_type', filters.crop_type);
    if (filters.farmer && filters.farmer !== 'All') searchParams.set('farmer', filters.farmer);
    if (filters.plantation_id && filters.plantation_id !== 'All') searchParams.set('plantation_id', filters.plantation_id);
    
    const returnUrl = `/rejected-plantations?${searchParams.toString()}`;
    
    navigate(`/plantations/${plantationId}`, { 
      state: { 
        from: returnUrl,
        filters: filters,
        page: page
      } 
    });
  };

  // Читаем номер страницы из URL параметров при загрузке
  useEffect(() => {
    const search = location.search;
    const urlParams = new URLSearchParams(search);
    const pageFromUrl = urlParams.get('page');
    
    if (!pageFromUrl) {
      const savedPage = parseInt(localStorage.getItem('rejectedPlantationsPage') || "1", 10);
      const validSavedPage = savedPage > 0 ? savedPage : 1;
      setPage(validSavedPage);
      window.history.replaceState(null, '', `/rejected-plantations?page=${validSavedPage}`);
      return;
    }
    
    const pageNumber = parseInt(pageFromUrl);
    
    if (pageNumber > 0) {
      setPage(pageNumber);
      localStorage.setItem('rejectedPlantationsPage', pageNumber.toString());
    } else {
      setPage(1);
      localStorage.setItem('rejectedPlantationsPage', '1');
      navigate('/rejected-plantations?page=1', { replace: true });
    }
  }, [location.search, navigate]);

  // Синхронизируем URL с состоянием страницы
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlPage = parseInt(urlParams.get("page") || "1", 10);
    
    if (urlPage !== page && page > 0) {
      const searchParams = new URLSearchParams();
      searchParams.set('page', page.toString());
      
      if (filters.region !== 'All') searchParams.set('region', filters.region);
      if (filters.district !== 'All') searchParams.set('district', filters.district);
      if (filters.crop_type !== 'All') searchParams.set('crop_type', filters.crop_type);
      if (filters.farmer && filters.farmer !== 'All') searchParams.set('farmer', filters.farmer);
      if (filters.plantation_id && filters.plantation_id !== 'All') searchParams.set('plantation_id', filters.plantation_id);
      
      const newUrl = `/rejected-plantations?${searchParams.toString()}`;
      navigate(newUrl, { replace: true });
      localStorage.setItem('rejectedPlantationsPage', page.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Обновляем фильтры при изменении URL
  useEffect(() => {
    const newFilters = getFiltersFromUrl();
    // Обновляем только если фильтры действительно изменились
    setFilters(prev => {
      const hasChanged = 
        prev.region !== newFilters.region ||
        prev.district !== newFilters.district ||
        prev.crop_type !== newFilters.crop_type ||
        prev.farmer !== newFilters.farmer ||
        prev.plantation_id !== newFilters.plantation_id;
      
      return hasChanged ? newFilters : prev;
    });
  }, [location.search]);

  // RBAC: Автоматически устанавливаем фильтр региона для главы региона
  useEffect(() => {
    if (authState.userRole === 'headof_region' && authState.regionId && filters.region === 'All') {
      const newFilters = {
        ...filters,
        region: authState.regionId.toString()
      };
      setFilters(newFilters);
      saveFiltersToUrl(newFilters, page);
    }
  }, [authState.userRole, authState.regionId]);

  useEffect(() => {
    if (authState?.accessToken) {
      fetchRejectedPlantations();
    } else {
      navigate('/login');
    }
  }, [authState?.accessToken, navigate, fetchRejectedPlantations]);

  useEffect(() => {
    if (authState.userRole === 'observer') {
      const params = new URLSearchParams(window.location.search);
      let changed = false;
      if (params.has('region')) { params.delete('region'); changed = true; }
      if (params.has('district')) { params.delete('district'); changed = true; }
      if (changed) {
        const query = params.toString();
        navigate(`/rejected-plantations${query ? `?${query}` : ''}`, { replace: true });
      }
      const resetFilters = { region: 'All', district: 'All', crop_type: 'All', farmer: 'All', plantation_id: 'All' };
      setFilters(resetFilters);
      setPage(1);
      saveFiltersToUrl(resetFilters, 1);
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
              to="/approved-plantations"
              className="block w-full bg-green-500 text-white py-2 rounded-lg font-medium text-center hover:bg-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tasdiqlangan bog'lar
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
                <h1 className="text-white text-2xl font-bold mb-2">Rad etilgan bog'lar</h1>
        </div>
            </div>

            {/* Фильтры */}
            <div className="bg-gray-800 rounded-lg p-3 mb-4 border border-gray-700">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-600 bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium"
                  onClick={handleResetFilters}
                >
                  Filterlarni tozalash
                </button>
                <input
                  type="text"
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Fermer INN yoki ID"
                  value={filters.farmer === 'All' ? '' : filters.farmer}
                  onChange={(e) => handleFilterChange('farmer', e.target.value.trim() || 'All')}
                />
                <input
                  type="text"
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Planatsiya ID"
                  value={filters.plantation_id === 'All' ? '' : filters.plantation_id}
                  onChange={(e) => handleFilterChange('plantation_id', e.target.value.trim() || 'All')}
                />
                
                <select
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  {getRegionOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {/* Фильтр по районам - появляется при выборе региона */}
                {filters.region !== "All" && (
                  <select
                    className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    value={filters.district}
                    onChange={(e) => handleFilterChange('district', e.target.value)}
                  >
                    <option value="All">Tuman (barchasi)</option>
                    {getDistrictsByRegion(filters.region).map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                )}
                
                <select
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={filters.crop_type}
                  onChange={(e) => handleFilterChange('crop_type', e.target.value)}
                >
                  <option value="All">Ekin turi</option>
                  <option value="Bog'lar">Bog'lar</option>
                  <option value="Issiqxonalar">Issiqxonalar</option>
                  <option value="Uzumzorlar">Uzumzorlar</option>
                </select>
              </div>
            </div>



            {/* Ошибки */}
            {error && (
              <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Ma'lumotlar yuklanmoqda...</p>
                </div>
              </div>
            )}

            {/* Список плантаций */}
            {!loading && plantations.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {plantations.map((plantation) => (
                  <div
                    key={plantation.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => handlePlantationClick(plantation.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">
                          {plantation.farmer?.name || "Fermer nomi yo'q"}
                        </h3>
                        <p className="text-xs text-gray-400 mb-1">
                          {plantation.name || "Sarlavhasiz bog'"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Maydon: {plantation.total_area || 0} GA
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs rounded">
                          Rad etilgan
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-700/30 rounded p-2 border border-gray-600">
                        <div className="text-gray-400 mb-1">Viloyat</div>
                        <div className="text-white font-medium">
                          {getRegionNameById(plantation.district?.region)}
                        </div>
                      </div>
                      <div className="bg-gray-700/30 rounded p-2 border border-gray-600">
                        <div className="text-gray-400 mb-1">Tuman</div>
                        <div className="text-white font-medium">
                          {plantation.district?.name || "—"}
                        </div>
                      </div>
                      <div className="bg-gray-700/30 rounded p-2 border border-gray-600">
                        <div className="text-gray-400 mb-1">Qo'shgan</div>
                        <div className="text-white font-medium">{getUserName(plantation.created_by)}</div>
                        <div className="text-gray-500">{formatDate(plantation.created_at)}</div>
                      </div>
                      <div className="bg-red-700/20 rounded p-2 border border-red-600">
                        <div className="text-red-400 mb-1">Rad etgan</div>
                        <div className="text-white font-medium">{getUserName(plantation.moderated_by)}</div>
                        <div className="text-red-400">{formatDate(plantation.moderated_at)}</div>
                      </div>
                    </div>

                      <div className="mt-2 bg-gray-700/30 rounded p-2 border border-gray-600">
                        <div className="text-gray-400 text-xs mb-1">Rad etish sababi</div>
                        <div className="text-white text-xs">
                          {Array.isArray(plantation.moderation_comment)
                            ? plantation.moderation_comment.map((c, i) => <span key={i} className="inline-block mr-2">{c?.text}</span>)
                            : (plantation.moderation_comment || plantation.comment || plantation.rejection_reason || '—')}
                        </div>
                      </div>
                    
                  </div>
                ))}
              </div>
            )}

            {/* Красивая пагинация */}
            {count > pageSize && (
              <div className="mt-8">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                    {/* Информация о страницах */}
                    <div className="text-sm text-gray-400">
                      Sahifa {page} dan {totalPages} | Jami: {count} ta rad etilgan bog'
                    </div>
                    
                    {/* Навигационные кнопки */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
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
                          max={totalPages}
                          value={pageInput}
                          onChange={handlePageInputChange}
                          className="w-12 sm:w-16 px-1 sm:px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-sm"
                          placeholder={page.toString()}
                        />
                        <button
                          type="submit"
                          className="px-2 sm:px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs sm:text-sm"
                        >
                          O'tish
                        </button>
                      </form>
                      
                      {/* Кнопка "Вперед" */}
                      <button
                        className="px-3 sm:px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        onClick={() => {
                          const newPage = Math.min(page + 1, totalPages);
                          setPage(newPage);
                          saveFiltersToUrl(filters, newPage);
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
              </div>
            )}

            {/* Информация о количестве */}
            {plantations.length > 0 && (
              <div className="text-center mt-6">
                <p className="text-gray-400 text-sm">
                  Ko'rsatilgan: {plantations.length} ta rad etilgan bog'
                </p>
              </div>
            )}


        </div>
      </div>

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white mb-1">
            Rad etilgan bog'lar
            {!isAdmin() && <span className="text-sm text-gray-400 ml-2">(Mening tumanim)</span>}
          </h1>
        </div>

        {/* Мобильные фильтры */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
          <div className="space-y-3">
            <button
              className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium"
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
                value={filters.farmer === 'All' ? '' : filters.farmer}
                onChange={(e) => handleFilterChange('farmer', e.target.value.trim() || 'All')}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Masalan: 305123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Planatsiya ID
              </label>
              <input
                type="text"
                value={filters.plantation_id === 'All' ? '' : filters.plantation_id}
                onChange={(e) => handleFilterChange('plantation_id', e.target.value.trim() || 'All')}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
            
            {/* Фильтр по районам - появляется при выборе региона */}
            {filters.region !== "All" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tuman
                </label>
                <select
                  value={filters.district}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="All">Tuman (barchasi)</option>
                    {getDistrictsByRegion(filters.region).map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
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
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="All">Barcha ekin turlari</option>
                <option value="Bog'lar">Bog'lar</option>
                <option value="Issiqxonalar">Issiqxonalar</option>
                <option value="Uzumzorlar">Uzumzorlar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Yuklanmoqda...</p>
            </div>
          </div>
        )}

        {/* Мобильный список плантаций */}
        {!loading && plantations.length > 0 && (
          <div className="space-y-3">
            {plantations.map((plantation) => (
              <div
                key={plantation.id}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                onClick={() => handlePlantationClick(plantation.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {plantation.farmer?.name || "Fermer nomi yo'q"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {plantation.name || "Sarlavhasiz bog'"}
                    </p>
                  </div>
                  <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs rounded">
                    Rad etilgan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <div className="text-gray-400">Viloyat/Tuman</div>
                    <div className="text-white">{getRegionNameById(plantation.district?.region)}, {plantation.district?.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Maydon</div>
                    <div className="text-white">{plantation.total_area || 0} GA</div>
                  </div>
                </div>

                  <div className="bg-gray-700/30 rounded p-2 border border-gray-600">
                    <div className="text-gray-400 text-xs mb-1">Sabab</div>
                    <div className="text-white text-xs">
                      {Array.isArray(plantation.moderation_comment)
                        ? plantation.moderation_comment.map((c, i) => <span key={i} className="inline-block mr-2">{c?.text}</span>)
                        : (plantation.moderation_comment || plantation.comment || plantation.rejection_reason || '—')}
                    </div>
                  </div>
                
              </div>
            ))}
          </div>
        )}

        {/* Мобильная пагинация */}
        {count > pageSize && (
          <div className="mt-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="space-y-4">
                {/* Информация о страницах */}
                <div className="text-center text-sm text-gray-400">
                  Sahifa {page} dan {totalPages} | Jami: {count} ta rad etilgan bog'
                </div>
                
                {/* Основные кнопки навигации */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const newPage = Math.max(page - 1, 1);
                      setPage(newPage);
                      saveFiltersToUrl(filters, newPage);
                    }}
                    disabled={page <= 1}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Orqaga
                  </button>
                  
                  <span className="text-sm text-gray-400 font-medium">
                    {page} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => {
                      const newPage = Math.min(page + 1, totalPages);
                      setPage(newPage);
                      saveFiltersToUrl(filters, newPage);
                    }}
                    disabled={page >= totalPages}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Oldinga
                  </button>
                </div>
                
                {/* Дополнительные кнопки и поле ввода */}
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={goToFirstPage}
                    disabled={page <= 1}
                    className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Birinchi sahifa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={pageInput}
                      onChange={handlePageInputChange}
                      placeholder={page.toString()}
                      min="1"
                      max={totalPages}
                      className="w-16 px-2 py-2 bg-gray-700 text-white rounded text-center text-sm border border-gray-600 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      O'tish
                    </button>
                  </form>
                  
                  <button
                    onClick={goToLastPage}
                    disabled={page >= totalPages}
                    className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Oxirgi sahifa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Информация о количестве для мобильной версии */}
        {plantations.length > 0 && (
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              Ko'rsatilgan: {plantations.length} ta rad etilgan bog'
            </p>
          </div>
        )}


      </div>
    </div>
  );
};

export default RejectedPlantations; 