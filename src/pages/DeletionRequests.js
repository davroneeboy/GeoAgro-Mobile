import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/apiUtils';
import AuthContext from '../context/AuthContext';
import PlantationStatusIndicator from '../components/PlantationStatusIndicator';

const DeletionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [filters, setFilters] = useState({
    region: "All",
    district: "All",
    farmer: "All",
    status: "All"
  });
  const [bulkAction, setBulkAction] = useState('');
  const [bulkComment, setBulkComment] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const navigate = useNavigate();
  const { authState, refreshAccessToken, logout } = useContext(AuthContext);

  // Словарь регионов
  const regions = {
    1: "Toshkent shahri",
    2: "Toshkent viloyati", 
    3: "Samarqand viloyati",
    4: "Buxoro viloyati",
    5: "Navoiy viloyati",
    6: "Qashqadaryo viloyati",
    7: "Surxondaryo viloyati",
    8: "Jizzax viloyati",
    9: "Sirdaryo viloyati",
    10: "Farg'ona viloyati",
    11: "Andijon viloyati",
    12: "Namangan viloyati",
    13: "Qoraqalpog'iston Respublikasi"
  };

  // Загрузка запросов на удаление
  const fetchDeletionRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('is_deleting', 'true');
      params.set('moderation_type', 'delete');
      params.set('page', page.toString());
      
      if (filters.region !== "All") params.set('region', filters.region);
      if (filters.district !== "All") params.set('district', filters.district);
      if (filters.farmer !== "All") params.set('farmer', filters.farmer);

      const response = await apiRequest(
        `api/plantations/?${params.toString()}`,
        {},
        refreshAccessToken,
        authState.accessToken
      );

      setRequests(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / 20));
    } catch (error) {
      console.error("Error fetching deletion requests:", error);
      if (error?.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError("O'chirish so'rovlari yuklanmadi");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.accessToken) {
      fetchDeletionRequests();
    }
  }, [page, filters, authState.accessToken]);

  // Обработка запроса на удаление
  const handleRequestAction = async (requestId, action, comment = '') => {
    try {
      const data = {
        is_checked: action === 'approve',
        moderation_comment: comment ? [{ text: comment, image: null }] : []
      };

      await apiRequest(`api/plantations/${requestId}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }, refreshAccessToken, authState.accessToken);

      // Обновляем список
      await fetchDeletionRequests();
    } catch (error) {
      console.error("Error processing deletion request:", error);
      setError("So'rovni qayta ishlashda xatolik");
    }
  };

  // Массовые операции
  const handleBulkAction = async () => {
    if (!bulkAction || selectedRequests.length === 0) return;

    try {
      const promises = selectedRequests.map(requestId => 
        handleRequestAction(requestId, bulkAction, bulkComment)
      );
      
      await Promise.all(promises);
      
      setSelectedRequests([]);
      setShowBulkModal(false);
      setBulkAction('');
      setBulkComment('');
    } catch (error) {
      console.error("Error processing bulk action:", error);
      setError("Ommaviy operatsiyani bajarishda xatolik");
    }
  };

  // Выбор запроса
  const toggleRequestSelection = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">O'chirish so'rovlari yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">O'chirish so'rovlari</h1>
          <p className="text-gray-400">Plantatsiyalarni o'chirish so'rovlarini boshqarish</p>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span className="text-red-300">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Фильтры */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
              value={filters.region}
              onChange={(e) => setFilters({...filters, region: e.target.value})}
            >
              <option value="All">Barcha viloyatlar</option>
              {Object.entries(regions).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
              value={filters.district}
              onChange={(e) => setFilters({...filters, district: e.target.value})}
            >
              <option value="All">Barcha tumanlar</option>
            </select>

            <input
              type="text"
              placeholder="Fermer bo'yicha qidirish..."
              className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
              value={filters.farmer}
              onChange={(e) => setFilters({...filters, farmer: e.target.value})}
            />

            <select
              className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="All">Barcha holatlar</option>
              <option value="pending">Kutilmoqda</option>
              <option value="approved">Tasdiqlangan</option>
              <option value="rejected">Rad etilgan</option>
            </select>
          </div>
        </div>

        {/* Ommaviy operatsiyalar */}
        {selectedRequests.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-600/50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span className="text-yellow-300">
                Tanlangan so'rovlar: {selectedRequests.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Ommaviy operatsiyalar
                </button>
                <button
                  onClick={() => setSelectedRequests([])}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Tanlovni bekor qilish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Список запросов */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-xl mb-4 flex justify-center">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">O'chirish so'rovlari topilmadi</h3>
              <p className="text-gray-500">Tanlangan filtrlarga mos keladigan o'chirish so'rovlari yo'q</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => toggleRequestSelection(request.id)}
                        className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                      />
                      <PlantationStatusIndicator plantation={request} />
                      <span className="text-sm text-gray-400">
                        ID: {request.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Fermer</p>
                        <p className="font-semibold">{request.farmer?.name || 'Ko\'rsatilmagan'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Viloyat</p>
                        <p className="font-semibold">{regions[request.district?.region] || 'Ko\'rsatilmagan'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Maydon</p>
                        <p className="font-semibold">{request.total_area} GA</p>
                      </div>
                    </div>

                    {/* Комментарии к запросу на удаление */}
                    {request.moderation_comment && request.moderation_comment.length > 0 && (
                      <div className="bg-orange-900/20 border border-orange-600/50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-orange-300 font-semibold mb-2">O'chirish so'rovi sababi:</p>
                        {request.moderation_comment.map((comment, idx) => (
                          <p key={idx} className="text-orange-200 text-sm">{comment.text}</p>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/plantations/edit/${request.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Ko'rish
                      </button>
                      <button
                        onClick={() => handleRequestAction(request.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        O'chirishni tasdiqlash
                      </button>
                      <button
                        onClick={() => handleRequestAction(request.id, 'reject', 'O\'chirish so\'rovi rad etildi')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Rad etish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Orqaga
              </button>
              <span className="px-4 py-2 bg-gray-700 text-white rounded-lg">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Oldinga
              </button>
            </div>
          </div>
        )}

        {/* Модальное окно массовых операций */}
        {showBulkModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-96 border border-gray-600">
              <h2 className="text-xl mb-4 text-white">Ommaviy operatsiya</h2>
              <div className="space-y-4">
                <select
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="">Harakatni tanlang</option>
                  <option value="approve">O'chirishni tasdiqlash</option>
                  <option value="reject">So'rovni rad etish</option>
                </select>
                <textarea
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                  placeholder="Izoh (ixtiyoriy)"
                  value={bulkComment}
                  onChange={(e) => setBulkComment(e.target.value)}
                  rows="3"
                />
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Bajarish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeletionRequests;
