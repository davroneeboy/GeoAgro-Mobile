import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_BASE_URL1, API_BASE_URL2 } from "../config";
import { useNavigate, Link } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import AuthContext from "../context/AuthContext";

const RejectedPlantations = () => {
  const navigate = useNavigate();
  const { authState, logout } = useContext(AuthContext);
  
  const [plantations, setPlantations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [filters, setFilters] = useState({
    region: 'All',
    crop_type: 'All',
    farmer: 'All'
  });

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
    }
  };

  const goToFirstPage = () => setPage(1);
  const goToLastPage = () => setPage(totalPages);

  // Функции для работы с фильтрами
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    // Сброс страницы при изменении фильтров
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      region: 'All',
      crop_type: 'All',
      farmer: 'All'
    });
    setPage(1);
  };

  // Проверяем является ли пользователь админом или главой региона
  const isAdmin = () => {
    return authState.userRole === 'superuser' || authState.userRole === 'headof_region';
  };

  // Функция для получения названия региона
  const getRegionNameById = (regionId) => {
    const regionNames = {
      1: "Andijon",
      2: "Buxoro", 
      3: "Farg'ona",
      4: "Jizzax",
      5: "Namangan",
      6: "Navoiy",
      7: "Qashqadaryo",
      8: "Qoraqalpog'iston",
      9: "Samarqand",
      10: "Sirdaryo",
      11: "Surxondaryo",
      12: "Toshkent",
      13: "Xorazm"
    };
    return regionNames[regionId] || "Noma'lum";
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
  const fetchUserDetails = async (userId) => {
    if (!userId || users[userId]) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL2}api/users/${userId}/`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` }
      });
      setUsers(prev => ({ ...prev, [userId]: response.data }));
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchRejectedPlantations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Определяем какой endpoint использовать в зависимости от роли пользователя
      // Примечание: обычный пользователь (user) не имеет доступа к этой странице
      let plantationsEndpoint;
      
      if (authState.userRole === 'superuser') {
        // Для суперпользователя используем API для просмотра всех отклоненных плантаций
        plantationsEndpoint = `${API_BASE_URL1}api/plantations/moderation/rejected/`;
      } else if (authState.userRole === 'headof_region') {
        // Для главы региона используем API для их региона с фильтрацией по региону
        plantationsEndpoint = `${API_BASE_URL1}api/plantations/forme/rejected/`;
      } else {
        // Для обычных пользователей используем API для их района (но они не имеют доступа к этой странице)
        plantationsEndpoint = `${API_BASE_URL1}api/plantations/forme/rejected/`;
      }

      // Получаем список отклоненных плантаций с деталями через новый endpoint
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      });

      // Добавляем фильтры в параметры запроса
      if (filters.region !== 'All') {
        params.append('region', filters.region);
      }
      if (filters.crop_type !== 'All') {
        params.append('crop_type', filters.crop_type);
      }
      if (filters.farmer && filters.farmer !== 'All') {
        params.append('farmer', filters.farmer);
      }

      // RBAC: Для headof_region принудительно устанавливаем фильтр по региону
      if (authState.userRole === 'headof_region' && authState.regionId) {
        params.set('region', authState.regionId.toString());
      }
      
      const response = await axios.get(`${plantationsEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` }
      });
      
      const plantationsData = response.data.results || [];

      console.log("Plantations data from new API:", plantationsData);
      console.log("First plantation structure:", plantationsData[0]);
      
      // Новые endpoints должны возвращать уже отфильтрованные данные с полной информацией
      // Фильтруем только по наличию комментария отказа на всякий случай
      const filteredPlantations = plantationsData.filter(plantation => {
        const comment = plantation.moderation_comment || plantation.comment || plantation.rejection_reason;
        return comment && comment.trim() !== '';
      });

      setPlantations(filteredPlantations);
      setCount(response.data.count || filteredPlantations.length); // Используем count из API response если есть

      // Загружаем информацию о пользователях
      const userIds = new Set();
      filteredPlantations.forEach(plantation => {
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
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Переход к деталям плантации
  const handlePlantationClick = (plantationId) => {
    navigate(`/plantations/${plantationId}`, { 
      state: { from: '/rejected-plantations' } 
    });
  };

  // RBAC: Автоматически устанавливаем фильтр региона для главы региона
  useEffect(() => {
    if (authState.userRole === 'headof_region' && authState.regionId && filters.region === 'All') {
      setFilters(prev => ({
        ...prev,
        region: authState.regionId.toString()
      }));
    }
  }, [authState.userRole, authState.regionId, filters.region]);

  useEffect(() => {
    if (authState?.accessToken) {
      fetchRejectedPlantations();
    } else {
      navigate('/login');
    }
  }, [authState, navigate, page, filters]);

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
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-white text-3xl font-bold mb-2">Rad etilgan bog'lar</h1>
        </div>
            </div>

            {/* Фильтры */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
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
                
                <select
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
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
                  <option value="13">Khorazm</option>
                </select>
                
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

                    {(plantation.moderation_comment || plantation.comment || plantation.rejection_reason) && (
                      <div className="mt-2 bg-gray-700/30 rounded p-2 border border-gray-600">
                        <div className="text-gray-400 text-xs mb-1">Rad etish sababi</div>
                        <div className="text-white text-xs">{plantation.moderation_comment || plantation.comment || plantation.rejection_reason}</div>
                      </div>
                    )}
                    
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
                        onClick={() => setPage(Math.max(page - 1, 1))}
                        disabled={page <= 1}
                      >
                        Orqaga
                      </button>
                      
                      {/* Поле ввода номера страницы */}
                      <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1 sm:space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={Math.min(totalPages, 50)}
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
                        onClick={() => setPage(Math.min(page + 1, totalPages))}
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
                Viloyat
              </label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                <option value="13">Khorazm</option>
              </select>
            </div>
            
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

                {(plantation.moderation_comment || plantation.comment || plantation.rejection_reason) && (
                  <div className="bg-gray-700/30 rounded p-2 border border-gray-600">
                    <div className="text-gray-400 text-xs mb-1">Sabab</div>
                    <div className="text-white text-xs">{plantation.moderation_comment || plantation.comment || plantation.rejection_reason}</div>
                  </div>
                )}
                
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
                    onClick={() => setPage(Math.max(page - 1, 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Orqaga
                  </button>
                  
                  <span className="text-sm text-gray-400 font-medium">
                    {page} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(Math.min(page + 1, totalPages))}
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