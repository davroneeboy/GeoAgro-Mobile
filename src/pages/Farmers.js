import React, { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL2 } from "../config";

import AuthContext from "../context/AuthContext";
import { fetchFarmerPlantations } from "../api/api";

const Farmers = () => {
  const { authState } = useContext(AuthContext);
  const [farmers, setFarmers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [noPlantsModalOpen, setNoPlantsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Функция для форматирования номера телефона
  const formatPhoneNumber = (phone) => {
    if (!phone) return phone;
    
    // Убираем все пробелы и символы
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Если номер начинается с 998 и имеет больше 12 цифр, обрезаем
    if (cleanPhone.startsWith('998') && cleanPhone.length > 12) {
      cleanPhone = cleanPhone.substring(0, 12);
    }
    
    // Форматируем в правильный формат
    if (cleanPhone.length === 12 && cleanPhone.startsWith('998')) {
      return `+${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 5)} ${cleanPhone.substring(5, 8)} ${cleanPhone.substring(8, 10)} ${cleanPhone.substring(10, 12)}`;
    }
    
    return phone; // Возвращаем как есть, если не можем отформатировать
  };

  const fetchFarmers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const digitsOnly = (debouncedSearch || "").replace(/\D/g, "");
        const isNumericSearch = debouncedSearch.length > 0 && digitsOnly.length === debouncedSearch.length;
        const PAGE_SIZE = 20;

        const params = new URLSearchParams();
        params.set("page", String(page));
        if (debouncedSearch && !isNumericSearch) params.set("search", debouncedSearch);
        if (isNumericSearch && digitsOnly.length === 9) params.set("inn", digitsOnly);

        let url = `${API_BASE_URL2}api/farmers/?${params.toString()}`;
        console.log("Fetching farmers from:", url);
        
        const headers = {
          'Content-Type': 'application/json',
        };

        // Добавляем Bearer токен к заголовкам
        if (authState.accessToken) {
          headers.Authorization = `Bearer ${authState.accessToken}`;
        }

        let response = await axios.get(url, { headers });
        console.log("Farmers response:", response.data);

        let results = response.data.results || [];

        // Если частичный ИНН (<9), собираем несколько страниц и фильтруем локально
        if (isNumericSearch && digitsOnly.length > 0 && digitsOnly.length < 9) {
          const aggregated = [...results];
          // Попробуем выкачать до 10 страниц (200 записей максимум) или пока страница короче PAGE_SIZE
          for (let p = 2; p <= 10; p += 1) {
            const pageUrl = `${API_BASE_URL2}api/farmers/?page=${p}`;
            console.log("Aggregating page for partial INN:", pageUrl);
            const pageResp = await axios.get(pageUrl, { headers });
            const pageResults = pageResp.data.results || [];
            aggregated.push(...pageResults);
            if (pageResults.length < PAGE_SIZE) break;
          }
          results = aggregated;
        }
        
        // Форматируем номера телефонов
        const formattedFarmers = results.map(farmer => ({
          ...farmer,
          phone_number: formatPhoneNumber(farmer.phone_number)
        }));
        
        // Клиентская фильтрация по частичному ИНН
        const clientFiltered = (isNumericSearch && digitsOnly.length > 0)
          ? formattedFarmers.filter(f => (String(f.inn || "").replace(/\D/g, "")).includes(digitsOnly))
          : formattedFarmers;

        // Клиентская пагинация для частичного ИНН
        if (isNumericSearch && digitsOnly.length > 0 && digitsOnly.length < 9) {
          const total = clientFiltered.length;
          setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
          const start = (page - 1) * PAGE_SIZE;
          const end = start + PAGE_SIZE;
          setFarmers(clientFiltered.slice(start, end));
          return;
        }
        
        setFarmers(clientFiltered);
        const serverCount = response.data.count || clientFiltered.length;
        const effectiveCount = (isNumericSearch && digitsOnly.length > 0) ? clientFiltered.length : serverCount;
        setTotalPages(Math.max(1, Math.ceil(effectiveCount / PAGE_SIZE)));
      } catch (error) {
        console.error("Error fetching farmers:", error);
        console.error("Error details:", error.response?.data || error.message);
        setError(`Failed to load farmers: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, authState.accessToken]
  );

  // Debounce search input (быстрее)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Сбрасывать на первую страницу при изменении поискового запроса
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchFarmers(currentPage);
  }, [currentPage, fetchFarmers]);

  // Fallback to test data if API is not available (только когда нет активного поиска)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && farmers.length === 0 && !debouncedSearch) {
        console.log("API timeout, loading test data");
        const testFarmers = [
          {
            id: 1,
            name: "Улугбек Музафар файз ф/х",
            founder_name: "Салимов Зокир",
            director_name: "Салимов Зокир",
            phone_number: "+998 99 894 94 27",
            address: "БУСТОН КФЙ ЧОТКОЛ КИШЛОГИ",
            inn: "206045148",
            established_year: "2006"
          },
          {
            id: 2,
            name: "Йулдош Хожиметов ф/х",
            founder_name: "Хожиметов Озод",
            director_name: "Хожиметов Озод",
            phone_number: "+998 99 893 42 66",
            address: "Qirg`izovul MFY, Chavkanchak ko`chasi",
            inn: "304322079",
            established_year: "2006"
          },
          {
            id: 3,
            name: "Азиз асил агро ф/х",
            founder_name: "Равшанов Карим",
            director_name: "Равшанов Карим",
            phone_number: "+998 99 899 17 61",
            address: "БУСТОН КФЙ ЧОТКОЛ",
            inn: "206046984",
            established_year: "2019"
          },
          {
            id: 4,
            name: "Мирзаев Абдулла ф/х",
            founder_name: "Мирзаев Абдулла",
            director_name: "Мирзаев Абдулла",
            phone_number: "+998 99 898 36 41",
            address: "СИРДАРЁ КФЙ, ГУЛИСТОН",
            inn: "206047123",
            established_year: "2018"
          },
          {
            id: 5,
            name: "Хакимов Рашид ф/х",
            founder_name: "Хакимов Рашид",
            director_name: "Хакимов Рашид",
            phone_number: "+998 99 894 41 03",
            address: "ФАРГОНА КФЙ, КУВА",
            inn: "206048456",
            established_year: "2017"
          }
        ];
        
        // Форматируем номера телефонов в тестовых данных
        const formattedTestFarmers = testFarmers.map(farmer => ({
          ...farmer,
          phone_number: formatPhoneNumber(farmer.phone_number)
        }));
        
        setFarmers(formattedTestFarmers);
        setTotalPages(1);
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeoutId);
  }, [loading, farmers.length, debouncedSearch]);

  const handleEdit = (id) => {
    navigate(`/farmers/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this farmer?")) {
      try {
        await axios.delete(`${API_BASE_URL2}api/farmers/${id}/`);
        fetchFarmers(currentPage);
      } catch (error) {
        console.error("Error deleting farmer:", error);
        setError("Failed to delete farmer. Please try again later.");
      }
    }
  };

  // Переход на карту плантаций фермера (с предварительной проверкой наличия плантаций)
  const handleOpenMap = async (farmer) => {
    const fid = farmer?.id;
    if (!fid) return;
    try {
      const inn = (farmer?.inn && String(farmer.inn).trim() !== '' && Number(farmer.inn) > 0) ? farmer.inn : undefined;
      const results = await fetchFarmerPlantations({ farmer_id: fid, farmer_inn: inn }, authState.accessToken);
      if (Array.isArray(results) && results.length > 0) {
        navigate(`/farmers/${fid}/map`, { state: { farmer_inn: inn } });
      } else {
        setNoPlantsModalOpen(true);
      }
    } catch (e) {
      setNoPlantsModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Yuklanmoqda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div
            className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <button
              onClick={() => {
                setError(null);
                const testData = [
                  {
                    id: 1,
                    name: "Test Farmer 1",
                    founder_name: "Test Founder 1",
                    director_name: "Test Director 1",
                    phone_number: "+998 99 123 45 67",
                    address: "Test Address 1",
                    inn: "123456789",
                    established_year: "2020"
                  },
                  {
                    id: 2,
                    name: "Test Farmer 2",
                    founder_name: "Test Founder 2",
                    director_name: "Test Director 2",
                    phone_number: "+998 99 123 45 68",
                    address: "Test Address 2",
                    inn: "123456790",
                    established_year: "2021"
                  }
                ];
                
                const formattedTestData = testData.map(farmer => ({
                  ...farmer,
                  phone_number: formatPhoneNumber(farmer.phone_number)
                }));
                
                setFarmers(formattedTestData);
                setTotalPages(1);
                setLoading(false);
              }}
              className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Load Test Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Modal: no plantations */}
      {noPlantsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setNoPlantsModalOpen(false)}></div>
          <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-11/12 max-w-sm p-5">
            <h3 className="text-white text-lg font-semibold mb-3">Xabarnoma</h3>
            <p className="text-gray-300 mb-5">Bu fermerga tegishli plantatsiyalar topilmadi</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
                onClick={() => setNoPlantsModalOpen(false)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Fermerlar
          </h2>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 sticky top-[64px] z-10 bg-gray-900/80 backdrop-blur-md p-3 md:p-0 md:bg-transparent">
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setDebouncedSearch(search.trim()); }}
              className="w-full sm:w-72 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-800 text-white border-gray-600 placeholder-gray-400"
            />
            {authState.userRole === "superuser" && (
              <button
                onClick={() => navigate("/farmers/new")}
                className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
              >
                <span className="mr-2">+</span>
                Yangi fermer
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hidden md:block text-gray-200">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full divide-y divide-gray-700 table-fixed min-w-[900px]">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/8">
                    Nomi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/8">
                    Asoschi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/8">
                    Direktor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/8">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/4">
                    Manzil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/12">
                    INN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/12">
                    Yil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/8">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {farmers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-gray-400"
                    >
                      Fermerlar topilmadi
                    </td>
                  </tr>
                ) : (
                  farmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-200 break-words">
                        <span className="text-white">{farmer.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 break-words">
                        {farmer.founder_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 break-words">
                        {farmer.director_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 break-words">
                        {farmer.phone_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 break-words">
                        {farmer.address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 break-words">
                        {farmer.inn}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 break-words">
                        {farmer.established_year}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium break-words">
                          <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleOpenMap(farmer)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-700 transition-colors duration-200"
                          >
                            Xaritada
                          </button>
                          {authState.userRole === "superuser" && (
                            <>
                            <button
                              onClick={() => handleEdit(farmer.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700 transition-colors duration-200"
                            >
                              Tahrirlash
                            </button>
                            <button
                              onClick={() => handleDelete(farmer.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors duration-200"
                            >
                              O'chirish
                            </button>
                            </>
                          )}
                          </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3 pb-24">
          {farmers.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center text-gray-400">
              Fermerlar topilmadi
            </div>
          ) : (
            farmers.map((farmer) => (
              <div key={farmer.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold break-words">
                      <span className="text-white">{farmer.name}</span>
                    </p>
                    <p className="text-gray-300 text-sm break-words mt-1">INN: <span className="text-gray-200">{farmer.inn || '—'}</span></p>
                    <p className="text-gray-300 text-sm break-words">Direktor: <span className="text-gray-200">{farmer.director_name || '—'}</span></p>
                    <p className="text-gray-300 text-sm break-words">Tel: <span className="text-gray-200">{farmer.phone_number || '—'}</span></p>
                    <p className="text-gray-400 text-xs break-words mt-1">{farmer.address}</p>
                  </div>
                  {authState.userRole === "superuser" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(farmer.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700 transition-colors"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDelete(farmer.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors"
                      >
                        O'chirish
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => handleOpenMap(farmer)}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Xaritada ko'rish
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center">
          <nav
            className="fixed md:static bottom-0 left-0 right-0 md:relative z-20 inline-flex rounded-none md:rounded-md shadow-2xl md:shadow-sm md:-space-x-px bg-gray-900/95 md:bg-transparent backdrop-blur md:backdrop-blur-0 border-t border-gray-700 md:border-0 px-3 py-2 md:p-0"
            aria-label="Pagination"
          >
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 md:rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              Oldingi
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300">
              Sahifa {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 md:rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              Keyingi
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Farmers;
