import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
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
  const [rejectedStats, setRejectedStats] = useState(null);

  const pageSize = 20;

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

      // Используем новый API endpoint для статистики отклоненных плантаций
      const statsResponse = await axios.get(`${API_BASE_URL2}api/statistics/rejected/`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` }
      });
      
      console.log("Rejected statistics API response:", statsResponse.data);
      
      // Получаем данные из нового API
      const rejectedData = statsResponse.data;
      
      // Получаем список отклоненных плантаций с деталями
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        is_checked: 'false'
      });
      
      const response = await axios.get(`${API_BASE_URL2}api/plantations/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` }
      });
      
      const plantationsData = response.data.results || [];

      // Получаем детальную информацию для каждой плантации
      const detailedPlantationsPromises = plantationsData.map(async (plantation) => {
        try {
          const detailResponse = await axios.get(
            `${API_BASE_URL2}api/plantations/${plantation.id}/`,
            {
              headers: { Authorization: `Bearer ${authState.accessToken}` },
              validateStatus: function (status) { return status < 500; }
            }
          );
          return detailResponse.data;
        } catch (error) {
          if (error.response?.status === 404 || error.response?.status === 500) {
            console.warn(`Plantation ${plantation.id} not found or deleted, skipping`);
            return null;
          }
          console.error(`Error fetching details for plantation ${plantation.id}:`, error);
          return plantation;
        }
      });

      const detailedPlantationsResults = await Promise.all(detailedPlantationsPromises);
      const detailedPlantations = detailedPlantationsResults.filter(p => p !== null);

      // Фильтруем плантации с непустым moderation_comment
      const filteredPlantations = detailedPlantations.filter(plantation => 
        plantation.moderation_comment && plantation.moderation_comment.trim() !== ''
      );

      setPlantations(filteredPlantations);
      setCount(filteredPlantations.length);
      setRejectedStats(rejectedData); // Save the statistics

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

  useEffect(() => {
    if (authState?.accessToken) {
      fetchRejectedPlantations();
    } else {
      navigate('/login');
    }
  }, [authState, navigate, page]);

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
            {/* <Link
              to="/rejected-plantations"
              className="block w-full bg-red-500 text-white py-2 rounded-lg font-medium text-center hover:bg-red-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Rad etilgan bog'lar
            </Link> */}
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

            <Link
              to="/approved-plantations"
              className="block w-full bg-green-500 text-white py-3 rounded-lg font-medium text-center hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Tasdiqlangan bog'lar
            </Link>

            <Link
              to="/rejected-plantations"
              className="block w-full bg-red-500 text-white py-3 rounded-lg font-medium text-center hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Rad etilgan bog'lar
            </Link>
          </div>
        </div>

        {/* Основной контент */}
        <div className="flex-1 bg-gray-900 text-white overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Rad etilgan bog'lar</h1>
            </div>

            {/* Статистика */}
            {rejectedStats && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Statistika</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Jami rad etilgan</div>
                    <div className="text-2xl font-bold text-white">
                      {rejectedStats.total_rejected_plantations || 0}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {rejectedStats.total_rejected_area || 0} GA
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Bog'lar</div>
                    <div className="text-2xl font-bold text-white">
                      {rejectedStats.rejected_by_type?.bogs?.count || 0}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {rejectedStats.rejected_by_type?.bogs?.area || 0} GA
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Uzumzorlar</div>
                    <div className="text-2xl font-bold text-white">
                      {rejectedStats.rejected_by_type?.uzumzors?.count || 0}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {rejectedStats.rejected_by_type?.uzumzors?.area || 0} GA
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Issiqxonalar</div>
                    <div className="text-2xl font-bold text-white">
                      {rejectedStats.rejected_by_type?.issiqxonas?.count || 0}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {rejectedStats.rejected_by_type?.issiqxonas?.area || 0} GA
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Investitsiyalar</div>
                    <div className="text-2xl font-bold text-white">
                      {((rejectedStats.rejected_investments?.local || 0) + (rejectedStats.rejected_investments?.foreign || 0)).toLocaleString()}
                    </div>
                    <div className="text-gray-500 text-sm">
                      Mahalliy: {(rejectedStats.rejected_investments?.local || 0).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Subsidiyalar</div>
                    <div className="text-2xl font-bold text-white">
                      {rejectedStats.rejected_subsidies?.beneficiary_count || 0}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {(rejectedStats.rejected_subsidies?.total_amount || 0).toLocaleString()} so'm
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">O'rtacha hosildorlik</div>
                    <div className="text-2xl font-bold text-white">
                      {(rejectedStats.rejected_fertility_stats?.average_score || 0).toFixed(1)}
                    </div>
                    <div className="text-gray-500 text-sm">
                      Past: {rejectedStats.rejected_fertility_stats?.low_fertility_area || 0} GA
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Mevali maydon</div>
                    <div className="text-2xl font-bold text-white">
                      {rejectedStats.total_rejected_fruitarea || 0}
                    </div>
                    <div className="text-gray-500 text-sm">
                      GA
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                          {plantation.name || "Noma'lum"}
                        </h3>
                        <p className="text-xs text-gray-400 mb-1">
                          {plantation.farmer?.name || "Fermer nomi yo'q"}
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

                    {plantation.moderation_comment && (
                      <div className="mt-2 bg-gray-700/30 rounded p-2 border border-gray-600">
                        <div className="text-gray-400 text-xs mb-1">Rad etish sababi</div>
                        <div className="text-white text-xs">{plantation.moderation_comment}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Пагинация */}
            {count > pageSize && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, count)} dan {count} ta
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                    className="px-3 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50 hover:bg-gray-600 transition-colors"
                  >
                    Birinchi
                  </button>
                  
                  <button
                    onClick={() => setPage(Math.max(page - 1, 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50 hover:bg-gray-600 transition-colors"
                  >
                    Orqaga
                  </button>
                  
                  <span className="px-3 py-1 bg-gray-700 text-white rounded-md">
                    {page} / {Math.ceil(count / pageSize)}
                  </span>
                  
                  <button
                    onClick={() => setPage(Math.min(page + 1, Math.ceil(count / pageSize)))}
                    disabled={page >= Math.ceil(count / pageSize)}
                    className="px-3 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50 hover:bg-gray-600 transition-colors"
                  >
                    Oldinga
                  </button>
                  
                  <button
                    onClick={() => setPage(Math.ceil(count / pageSize))}
                    disabled={page >= Math.ceil(count / pageSize)}
                    className="px-3 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50 hover:bg-gray-600 transition-colors"
                  >
                    Oxirgi
                  </button>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white mb-1">Rad etilgan bog'lar</h1>
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
                      {plantation.name || "Noma'lum"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {plantation.farmer?.name || "Fermer nomi yo'q"}
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

                {plantation.moderation_comment && (
                  <div className="bg-gray-700/30 rounded p-2 border border-gray-600">
                    <div className="text-gray-400 text-xs mb-1">Sabab</div>
                    <div className="text-white text-xs">{plantation.moderation_comment}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Мобильная пагинация */}
        {count > pageSize && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(page - 1, 1))}
              disabled={page <= 1}
              className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 text-sm"
            >
              Orqaga
            </button>
            
            <span className="text-sm text-gray-400">
              {page} / {Math.ceil(count / pageSize)}
            </span>
            
            <button
              onClick={() => setPage(Math.min(page + 1, Math.ceil(count / pageSize)))}
              disabled={page >= Math.ceil(count / pageSize)}
              className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 text-sm"
            >
              Oldinga
            </button>
          </div>
        )}


      </div>
    </div>
  );
};

export default RejectedPlantations; 