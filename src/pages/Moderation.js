import React, { useState, useEffect, useContext, useRef } from "react";
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
    region: "All",
    district: "All",
    farmer: "All",
    // новые фильтры
    farmer_id: "All",
    min_area: "All",
    max_area: "All",
    min_fertility_score: "All",
    max_fertility_score: "All",
    min_irrigation_area: "All",
    max_irrigation_area: "All",
    is_fertile: "All",
    is_checked: "All",
    is_rejected: "All",
    is_deleting: "All",
    land_type: "All",
    created_after: "All",
    created_before: "All",
    moderated_after: "All",
    moderated_before: "All",
    garden_established_year: "All",
    min_established_year: "All",
    max_established_year: "All",
    created_by: "All",
    created_by_username: "All",
    moderated_by: "All",
    moderated_by_username: "All",
    has_moderation_comment: "All",
    // сортировка
    sort_by: "default",
    sort_order: "asc",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { authState, logout } = useContext(AuthContext);

  // Функция для чтения фильтров из URL
  const getFiltersFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      action: searchParams.get('action') || "All",
      status: searchParams.get('status') || "All",
      type: searchParams.get('type') || "All",
      region: searchParams.get('region') || "All",
      district: searchParams.get('district') || "All",
      farmer: searchParams.get('farmer') || "All",
      // новые
      farmer_id: searchParams.get('farmer_id') || "All",
      min_area: searchParams.get('min_area') || "All",
      max_area: searchParams.get('max_area') || "All",
      min_fertility_score: searchParams.get('min_fertility_score') || "All",
      max_fertility_score: searchParams.get('max_fertility_score') || "All",
      min_irrigation_area: searchParams.get('min_irrigation_area') || "All",
      max_irrigation_area: searchParams.get('max_irrigation_area') || "All",
      is_fertile: searchParams.get('is_fertile') || "All",
      is_checked: searchParams.get('is_checked') || "All",
      is_rejected: searchParams.get('is_rejected') || "All",
      is_deleting: searchParams.get('is_deleting') || "All",
      land_type: searchParams.get('land_type') || "All",
      created_after: searchParams.get('created_after') || "All",
      created_before: searchParams.get('created_before') || "All",
      moderated_after: searchParams.get('moderated_after') || "All",
      moderated_before: searchParams.get('moderated_before') || "All",
      garden_established_year: searchParams.get('garden_established_year') || "All",
      min_established_year: searchParams.get('min_established_year') || "All",
      max_established_year: searchParams.get('max_established_year') || "All",
      created_by: searchParams.get('created_by') || "All",
      created_by_username: searchParams.get('created_by_username') || "All",
      moderated_by: searchParams.get('moderated_by') || "All",
      moderated_by_username: searchParams.get('moderated_by_username') || "All",
      has_moderation_comment: searchParams.get('has_moderation_comment') || "All",
      // сортировка
      sort_by: searchParams.get('sort_by') || 'default',
      sort_order: searchParams.get('sort_order') || 'asc',
    };
  };

  // Функция для сохранения фильтров в URL
  const saveFiltersToUrl = (newFilters, newPage = 1) => {
    const searchParams = new URLSearchParams();
    
    // Добавляем страницу
    searchParams.set('page', newPage.toString());
    
    // Добавляем фильтры только если они не "All"
    if (newFilters.action !== "All") searchParams.set('action', newFilters.action);
    if (newFilters.status !== "All") searchParams.set('status', newFilters.status);
    if (newFilters.type !== "All") searchParams.set('type', newFilters.type);
    if (newFilters.region !== "All") searchParams.set('region', newFilters.region);
    if (newFilters.district !== "All") searchParams.set('district', newFilters.district);
    if (newFilters.farmer !== "All") searchParams.set('farmer', newFilters.farmer);
    // новые
    if (newFilters.farmer_id !== "All") searchParams.set('farmer_id', newFilters.farmer_id);
    if (newFilters.min_area !== "All") searchParams.set('min_area', newFilters.min_area);
    if (newFilters.max_area !== "All") searchParams.set('max_area', newFilters.max_area);
    if (newFilters.min_fertility_score !== "All") searchParams.set('min_fertility_score', newFilters.min_fertility_score);
    if (newFilters.max_fertility_score !== "All") searchParams.set('max_fertility_score', newFilters.max_fertility_score);
    if (newFilters.min_irrigation_area !== "All") searchParams.set('min_irrigation_area', newFilters.min_irrigation_area);
    if (newFilters.max_irrigation_area !== "All") searchParams.set('max_irrigation_area', newFilters.max_irrigation_area);
    if (newFilters.is_fertile !== "All") searchParams.set('is_fertile', newFilters.is_fertile);
    if (newFilters.is_checked !== "All") searchParams.set('is_checked', newFilters.is_checked);
    if (newFilters.is_rejected !== "All") searchParams.set('is_rejected', newFilters.is_rejected);
    if (newFilters.is_deleting !== "All") searchParams.set('is_deleting', newFilters.is_deleting);
    if (newFilters.land_type !== "All") searchParams.set('land_type', newFilters.land_type);
    if (newFilters.created_after !== "All") searchParams.set('created_after', newFilters.created_after);
    if (newFilters.created_before !== "All") searchParams.set('created_before', newFilters.created_before);
    if (newFilters.moderated_after !== "All") searchParams.set('moderated_after', newFilters.moderated_after);
    if (newFilters.moderated_before !== "All") searchParams.set('moderated_before', newFilters.moderated_before);
    if (newFilters.garden_established_year !== "All") searchParams.set('garden_established_year', newFilters.garden_established_year);
    if (newFilters.min_established_year !== "All") searchParams.set('min_established_year', newFilters.min_established_year);
    if (newFilters.max_established_year !== "All") searchParams.set('max_established_year', newFilters.max_established_year);
    if (newFilters.created_by !== "All") searchParams.set('created_by', newFilters.created_by);
    if (newFilters.created_by_username !== "All") searchParams.set('created_by_username', newFilters.created_by_username);
    if (newFilters.moderated_by !== "All") searchParams.set('moderated_by', newFilters.moderated_by);
    if (newFilters.moderated_by_username !== "All") searchParams.set('moderated_by_username', newFilters.moderated_by_username);
    if (newFilters.has_moderation_comment !== "All") searchParams.set('has_moderation_comment', newFilters.has_moderation_comment);
    // Сортировка сохраняется всегда для предсказуемости ссылок
    if (newFilters.sort_by) searchParams.set('sort_by', newFilters.sort_by);
    if (newFilters.sort_order) searchParams.set('sort_order', newFilters.sort_order);
    
    const newUrl = `/moderation?${searchParams.toString()}`;
    navigate(newUrl, { replace: true });
  };

  // Инициализируем страницу из URL или localStorage
  const initialPageFromUrl = (() => {
    const urlParams = new URLSearchParams(location.search);
    const pageParam = parseInt(urlParams.get("page") || "1", 10);
    const savedPage = parseInt(localStorage.getItem('moderationPage') || "1", 10);
    
    // Если есть параметр в URL, используем его, иначе используем сохраненную страницу
    const pageToUse = urlParams.get("page") ? pageParam : savedPage;
    const validPage = pageToUse > 0 ? pageToUse : 1;
    
    // Если используем сохраненную страницу, обновляем URL
    if (!urlParams.get("page") && savedPage !== validPage) {
      // Обновляем URL без перезагрузки страницы
      window.history.replaceState(null, '', `/moderation?page=${validPage}`);
    }
    
    return validPage;
  })();
  const [page, setPage] = useState(initialPageFromUrl);
  const isFetchingRef = useRef(false);
  const [count, setCount] = useState(0); // добавляем состояние для общего количества записей
  const [loading, setLoading] = useState(false); // добавляем состояние загрузки
  const [error, setError] = useState(null); // добавляем состояние ошибки
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pageInput, setPageInput] = useState(initialPageFromUrl.toString()); // для поля ввода страницы

  // Проверяем токен при загрузке компонента
  useEffect(() => {
    if (!authState.accessToken) {
      console.log('Токен отсутствует при загрузке компонента, перенаправляем на страницу входа');
      navigate('/login');
    }
  }, [authState.accessToken, navigate]);

  // Обновляем фильтры при изменении URL
  useEffect(() => {
    const newFilters = getFiltersFromUrl();
    
    // RBAC: Для главы региона автоматически устанавливаем фильтр по региону только при первой загрузке
    if (authState.userRole === 'headof_region' && authState.regionId && newFilters.region === "All" && !location.search.includes('region=')) {
      newFilters.region = authState.regionId.toString();
    }
    
    setFilters(newFilters);
  }, [location.search, authState.userRole, authState.regionId]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // eslint-disable-next-line no-unused-vars
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
      13: "Xorazm",
    };
    
    // Если regionId - это строка с названием региона, возвращаем как есть
    if (typeof regionId === 'string' && regionNames[parseInt(regionId)] === undefined) {
      return regionId;
    }
    
    return regionNames[regionId] || `Region ${regionId}`;
  };



  // Синхронизируем URL с состоянием страницы (только при изменении page)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlPage = parseInt(urlParams.get("page") || "1", 10);
    
    if (urlPage !== page && page > 0) {
      console.log('Синхронизируем URL с состоянием страницы:', page);
      window.history.replaceState(null, '', `/moderation?page=${page}`);
    }
    
    // Синхронизируем поле ввода с текущей страницей
    setPageInput(page.toString());
  }, [page]);

  // Читаем номер страницы из URL параметров при загрузке
  useEffect(() => {
    const search = location.search;
    const urlParams = new URLSearchParams(search);
    const pageFromUrl = urlParams.get('page');
    console.log('URL page param:', pageFromUrl);
    
    // Если нет параметра page в URL, используем сохраненную страницу
    if (!pageFromUrl) {
      const savedPage = parseInt(localStorage.getItem('moderationPage') || "1", 10);
      const validSavedPage = savedPage > 0 ? savedPage : 1;
      console.log('Нет параметра page в URL, используем сохраненную страницу:', validSavedPage);
      setPage(validSavedPage);
      // Обновляем URL без перезагрузки
      window.history.replaceState(null, '', `/moderation?page=${validSavedPage}`);
      return;
    }
    
    // Если есть параметр page в URL
    const pageNumber = parseInt(pageFromUrl);
    console.log('Setting page from URL:', pageNumber);
    
    // Проверяем, что номер страницы валидный
    if (pageNumber > 0) {
      setPage(pageNumber);
      localStorage.setItem('moderationPage', pageNumber.toString());
    } else {
      // Если номер страницы невалидный, сбрасываем на первую страницу
      console.log('Невалидный номер страницы в URL:', pageNumber, ', сбрасываем на первую');
      setPage(1);
      localStorage.setItem('moderationPage', '1');
      navigate('/moderation?page=1', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, page, location.search]);



    // Функция для перехода к просмотру плантации (без автоматического подтверждения)
  const handleView = async (id) => {
    // Проверяем наличие токена перед запросом
    if (!authState.accessToken) {
      console.log('Токен отсутствует, перенаправляем на страницу входа');
      navigate('/login');
      return;
    }

    // Сохраняем текущую страницу и фильтры перед переходом
    localStorage.setItem('moderationPage', page.toString());
    
    // Просто переходим к просмотру без автоматического подтверждения
    console.log("Переход к просмотру плантации:", id);
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
      if (page <= 0) {
        console.log('Невалидный номер страницы:', page, ', сбрасываем на первую');
        setPage(1);
        localStorage.setItem('moderationPage', '1');
        navigate('/moderation?page=1', { replace: true });
        return;
      }
      

      
      try {
        // RBAC: Для главы региона используем выбранный фильтр региона или автоматически устанавливаем свой регион
        let regionFilter = filters.region !== "All" ? filters.region : undefined;
        if (authState.userRole === 'headof_region' && authState.regionId && !regionFilter) {
          regionFilter = authState.regionId.toString();
          console.log('Moderation - headof_region detected, auto-setting region filter to:', regionFilter);
        }
        
        console.log('Moderation - userRole:', authState.userRole);
        console.log('Moderation - regionId:', authState.regionId);
        console.log('Moderation - selected region filter:', filters.region);
        console.log('Moderation - final regionFilter:', regionFilter);

        // Создаем объект параметров и очищаем от undefined значений
        const rawParams = {
          page,
          action: filters.action !== "All" ? filters.action : undefined,
          status: filters.status !== "All" ? filters.status : undefined,
          type: filters.type !== "All" ? filters.type : undefined,
          region: regionFilter,
          district: filters.district !== "All" ? filters.district : undefined,
          farmer: filters.farmer !== "All" ? filters.farmer : undefined,
          // новые
          farmer_id: filters.farmer_id !== "All" ? filters.farmer_id : undefined,
          min_area: filters.min_area !== "All" ? filters.min_area : undefined,
          max_area: filters.max_area !== "All" ? filters.max_area : undefined,
          min_fertility_score: filters.min_fertility_score !== "All" ? filters.min_fertility_score : undefined,
          max_fertility_score: filters.max_fertility_score !== "All" ? filters.max_fertility_score : undefined,
          min_irrigation_area: filters.min_irrigation_area !== "All" ? filters.min_irrigation_area : undefined,
          max_irrigation_area: filters.max_irrigation_area !== "All" ? filters.max_irrigation_area : undefined,
          is_fertile: filters.is_fertile !== "All" ? filters.is_fertile : undefined,
          is_checked: filters.is_checked !== "All" ? filters.is_checked : undefined,
          is_rejected: filters.is_rejected !== "All" ? filters.is_rejected : undefined,
          is_deleting: filters.is_deleting !== "All" ? filters.is_deleting : undefined,
          land_type: filters.land_type !== "All" ? filters.land_type : undefined,
          created_after: filters.created_after !== "All" ? filters.created_after : undefined,
          created_before: filters.created_before !== "All" ? filters.created_before : undefined,
          moderated_after: filters.moderated_after !== "All" ? filters.moderated_after : undefined,
          moderated_before: filters.moderated_before !== "All" ? filters.moderated_before : undefined,
          garden_established_year: filters.garden_established_year !== "All" ? filters.garden_established_year : undefined,
          min_established_year: filters.min_established_year !== "All" ? filters.min_established_year : undefined,
          max_established_year: filters.max_established_year !== "All" ? filters.max_established_year : undefined,
          created_by: filters.created_by !== "All" ? filters.created_by : undefined,
          created_by_username: filters.created_by_username !== "All" ? filters.created_by_username : undefined,
          moderated_by: filters.moderated_by !== "All" ? filters.moderated_by : undefined,
          moderated_by_username: filters.moderated_by_username !== "All" ? filters.moderated_by_username : undefined,
          has_moderation_comment: filters.has_moderation_comment !== "All" ? filters.has_moderation_comment : undefined,
          // сортировка
          sort_by: filters.sort_by || 'default',
          sort_order: filters.sort_order || 'asc',
        };
        
        // Очищаем объект от undefined значений
        const params = Object.fromEntries(
          Object.entries(rawParams).filter(([_, value]) => value !== undefined)
        );

        // RBAC: Определяем endpoint в зависимости от роли пользователя
        let moderationEndpoint;
        if (authState.userRole === 'headof_region' && authState.regionId) {
          // Для главы региона используем специальный endpoint для его региона
          moderationEndpoint = `${API_BASE_URL2}api/plantations/forme/moderation/`;
        } else if (authState.userRole === 'observer') {
          // Для наблюдателя — сразу общий список плантаций с фильтрами
          moderationEndpoint = `${API_BASE_URL2}api/plantations/`;
        } else {
          // Для суперпользователя используем общий endpoint модерации
          moderationEndpoint = `${API_BASE_URL2}api/plantations/moderation/`;
        }
        
        let response;
        try {
          response = await axios.get(
            moderationEndpoint,
          {
            params,
            headers: {
              Authorization: `Bearer ${authState.accessToken}`,
            },
          }
        );
        } catch (err) {
          // Фолбэк для observer: если вдруг ошибка, повторим на `/api/plantations/`
          if (authState.userRole === 'observer') {
            response = await axios.get(
              `${API_BASE_URL2}api/plantations/`,
              {
                params,
                headers: {
                  Authorization: `Bearer ${authState.accessToken}`,
                },
              }
            );
          } else {
            throw err;
          }
        }
        
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

              // Определяем название региона по ID
              const getRegionNameById = (regionId) => {
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
                return regionNames[regionId] || `Region ${regionId}`;
              };

              const regionName = getRegionNameById(plantation.district?.region);
              const districtName = plantation.district?.name || "—";

              return {
                id: plantation.id,
                name: plantation.farmer?.name || "—",
                type: plantation.land_type,
                area: `${plantation.total_area ?? 0} га`,
                region: `${regionName}, ${districtName}`,
                status: plantation.status || "—",
                createdAt: plantation.created_at || null,
                updatedAt: plantation.updated_at || null,
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
          localStorage.setItem('moderationPage', '1');
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

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    fetchModerations().finally(() => { isFetchingRef.current = false; });
  }, [page, filters.action, filters.status, filters.type, filters.region, filters.district, filters.farmer, filters.sort_by, filters.sort_order, navigate, authState.accessToken, logout]);

  const handleResetFilters = () => {
    const resetFilters = { action: "All", status: "All", type: "All", region: "All", district: "All", farmer: "All", sort_by: "default", sort_order: "asc" };
    setFilters(resetFilters);
    setPage(1);
    localStorage.setItem('moderationPage', '1');
    saveFiltersToUrl(resetFilters, 1);
  };

  // Функция для перехода на конкретную страницу
  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const newPage = parseInt(pageInput, 10);
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      localStorage.setItem('moderationPage', newPage.toString());
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
    localStorage.setItem('moderationPage', '1');
    saveFiltersToUrl(filters, 1);
  };

  // Функция для перехода в конец
  const goToLastPage = () => {
    const lastPage = totalPages > 0 ? totalPages : 1;
    setPage(lastPage);
    setPageInput(lastPage.toString());
    localStorage.setItem('moderationPage', lastPage.toString());
    saveFiltersToUrl(filters, lastPage);
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
            <Link
              to="/approved-plantations"
              className="block w-full bg-green-500 text-white py-2 rounded-lg font-medium text-center hover:bg-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tasdiqlangan bog'lar
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
              to="/rejected-plantations"
              className="block w-full bg-red-500 text-white py-2 rounded-lg font-medium text-center hover:bg-red-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Rad etilgan bog'lar
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

      {/* Контент */}
      <div className="min-h-screen bg-gray-900 w-full" style={{backgroundColor: '#111827'}}>
          <div className="p-4 sm:p-6 bg-gray-900" style={{backgroundColor: '#111827'}}>
            <h1 className="text-white text-3xl font-bold mb-4 sm:mb-6">
              Moderatsiya
            </h1>

            {/* Фильтры */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              <button
                className="px-3 py-2 sm:px-4 rounded-lg border border-gray-600 bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm sm:text-base"
                onClick={handleResetFilters}
              >
                Filterlarni tozalash
              </button>
              <select
                className="px-3 py-2 sm:px-4 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                value={filters.region}
                onChange={(e) => {
                  const newFilters = { ...filters, region: e.target.value, district: "All" };
                  setFilters(newFilters);
                  setPage(1);
                  localStorage.setItem('moderationPage', '1');
                  saveFiltersToUrl(newFilters, 1);
                }}
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
                <option value="13">Xorazm</option>
              </select>
              {filters.region !== "All" && (
                <select
                  className="px-3 py-2 sm:px-4 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                  value="All"
                  disabled
                >
                  <option value="All">Barcha tumanlar</option>
                </select>
              )}
              <input
                type="text"
                placeholder="Fermer nomi yoki ID"
                className="px-3 py-2 sm:px-4 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base placeholder-gray-400"
                value={filters.farmer === "All" ? "" : filters.farmer}
                onChange={(e) => {
                  const newFilters = { ...filters, farmer: e.target.value || "All" };
                  setFilters(newFilters);
                  setPage(1);
                  localStorage.setItem('moderationPage', '1');
                  saveFiltersToUrl(newFilters, 1);
                }}
              />

              <select
                className="px-3 py-2 sm:px-4 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                value={filters.type}
                onChange={(e) => {
                  const newFilters = { ...filters, type: e.target.value };
                  setFilters(newFilters);
                  setPage(1);
                  localStorage.setItem('moderationPage', '1');
                  saveFiltersToUrl(newFilters, 1);
                }}
              >
                <option value="All">Turi</option>
                <option value="garden">Bog'lar</option>
                <option value="greenhouse">Issiqxonalar</option>
                <option value="vineyard">Uzumzorlar</option>
              </select>

              {/* Sorting */}
              <select className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm" value={filters.sort_by} onChange={(e)=>{ const f={...filters,sort_by:e.target.value}; setFilters(f); setPage(1); localStorage.setItem('moderationPage','1'); saveFiltersToUrl(f,1); }}>
                <option value="default">Standart (yangilangan avval)</option>
                <option value="created_at">Yaratilgan sana</option>
                <option value="updated_at">Yangilangan sana</option>
              </select>
              <select className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm" value={filters.sort_order} onChange={(e)=>{ const f={...filters,sort_order:e.target.value}; setFilters(f); setPage(1); localStorage.setItem('moderationPage','1'); saveFiltersToUrl(f,1); }}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
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
                    localStorage.setItem('moderationPage', '1');
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
                  className="group block bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-blue-500 hover:from-gray-750 hover:to-gray-800 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-blue-500/10"
                  onClick={() => {
                    handleView(plantation.id);
                    // Сохраняем текущую страницу перед переходом
                    localStorage.setItem('moderationPage', page.toString());
                    navigate(`/plantations/edit/${plantation.id}`, { 
                      state: { 
                        from: '/moderation',
                        filters: filters,
                        page: page
                      } 
                    });
                  }}
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {plantation.name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-gray-400">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                          </svg>
                          {plantation.area}
                      </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {plantation.region}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {plantation.action === "Обновленный" && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                    {plantation.action === "Bekor qilinganlar" && (
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                    {plantation.action === "Yaratilgan" && (
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                      <span className="text-xs font-medium">
                        {plantation.action === "Обновленный" && "Yangilangan"}
                        {plantation.action === "Bekor qilinganlar" && "Bekor qilingan"}
                        {plantation.action === "Yaratilgan" && "Yaratilgan"}
                      </span>
                  </div>
                      </div>
                      
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
                    <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 border border-gray-600">
                      <div className="text-xs text-gray-400 mb-1">Turi</div>
                      <div className="text-white font-semibold text-sm sm:text-base">{landTypeMapping[plantation.type]}</div>
                        </div>
                    <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 border border-gray-600">
                      <div className="text-xs text-gray-400 mb-1">Maydon</div>
                      <div className="text-white font-semibold text-sm sm:text-base">{plantation.area}</div>
                        </div>
                    <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 border border-gray-600">
                      <div className="text-xs text-gray-400 mb-1">Region</div>
                      <div className="text-white font-semibold text-sm sm:text-base">{plantation.region}</div>
                        </div>
                    <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 border border-gray-600">
                      <div className="text-xs text-gray-400 mb-1">Qo'shilgan</div>
                      <div className="text-white font-semibold text-xs sm:text-sm">
                        {plantation.createdAt ? new Date(plantation.createdAt).toLocaleString("ru-RU") : "—"}
                          </div>
                      {plantation.updatedAt && (
                        <div className="mt-1 text-[10px] sm:text-xs text-amber-300 flex items-center gap-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-900/50 border border-amber-600/60">Yangilangan</span>
                          <span>{new Date(plantation.updatedAt).toLocaleString("ru-RU")}</span>
                        </div>
                      )}
                      </div>
                    </div>

                      {plantation.action === "Обновленный" && plantation.prev_data && (
                    <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-bold text-blue-200 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            O'zgarishlar:
                          </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.keys(plantation.prev_data).map((key) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium text-gray-300">
                                  {key === "plantation_type" ? "Тип плантации" : key}:
                                </span>
                            <div className="mt-1 flex items-center space-x-2">
                              <span className="line-through text-red-400 bg-red-900/50 px-2 py-1 rounded text-xs">
                                    {plantation.prev_data[key].old}
                                  </span>
                              <span className="text-green-400 font-semibold bg-green-900/50 px-2 py-1 rounded text-xs">
                                    {plantation.prev_data[key].new}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                      <span>Qo'shilgan: {plantation.createdAt ? new Date(plantation.createdAt).toLocaleString("ru-RU") : "—"}</span>
                    </div>
                    <div className="flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                      <span>Tahrirlash</span>
                      <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            {!loading && !error && moderations.length > 0 && (
              <div className="flex flex-col items-center mt-6 sm:mt-8 space-y-3 sm:space-y-4 pb-6">
                {/* Информация о страницах */}
                <div className="text-white text-center">
                  <span className="text-base sm:text-lg font-semibold">Sahifa {page} dan {totalPages || 1}</span>
                  <div className="text-xs sm:text-sm text-gray-400 mt-1">
                    Jami {count} ta yozuv
                  </div>
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
                    localStorage.setItem('moderationPage', newPage.toString());
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
                      localStorage.setItem('moderationPage', newPage.toString());
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
            )}
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
                const newFilters = { ...filters, action: e.target.value };
                setFilters(newFilters);
                setPage(1);
                localStorage.setItem('moderationPage', '1');
                saveFiltersToUrl(newFilters, 1);
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
                const newFilters = { ...filters, status: e.target.value };
                setFilters(newFilters);
                setPage(1);
                localStorage.setItem('moderationPage', '1');
                saveFiltersToUrl(newFilters, 1);
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
                const newFilters = { ...filters, type: e.target.value };
                setFilters(newFilters);
                setPage(1);
                localStorage.setItem('moderationPage', '1');
                saveFiltersToUrl(newFilters, 1);
              }}
            >
              <option value="All">Turi</option>
              <option value="Bog'lar">Bog'lar</option>
              <option value="Issiqxonalar">Issiqxonalar</option>
              <option value="Uzumzorlar">Uzumzorlar</option>
            </select>
            <select
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={filters.region}
              onChange={(e) => {
                const newFilters = { ...filters, region: e.target.value, district: "All" };
                setFilters(newFilters);
                setPage(1);
                localStorage.setItem('moderationPage', '1');
                saveFiltersToUrl(newFilters, 1);
              }}
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
              <option value="13">Xorazm</option>
            </select>
            {filters.region !== "All" && (
              <select
                className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value="All"
                disabled
              >
                <option value="All">Barcha tumanlar</option>
              </select>
            )}
            <input
              type="text"
              placeholder="Fermer nomi yoki ID"
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
              value={filters.farmer === "All" ? "" : filters.farmer}
              onChange={(e) => {
                const newFilters = { ...filters, farmer: e.target.value || "All" };
                setFilters(newFilters);
                setPage(1);
                localStorage.setItem('moderationPage', '1');
                saveFiltersToUrl(newFilters, 1);
              }}
            />
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
              <strong>Xatolik:</strong> {error}
              <button
                className="block w-full mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={() => {
                  setPage(1);
                  localStorage.setItem('moderationPage', '1');
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
                className="group block bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 border border-gray-600 hover:border-blue-500 hover:from-gray-650 hover:to-gray-750 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg"
                onClick={() => {
                  handleView(plantation.id);
                  // Сохраняем текущую страницу перед переходом
                  localStorage.setItem('moderationPage', page.toString());
                  navigate(`/plantations/edit/${plantation.id}`, { 
                    state: { 
                      from: '/moderation',
                      filters: filters,
                      page: page
                    } 
                  });
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {plantation.name}
                    </h3>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                        </svg>
                        {plantation.area}
                    </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {plantation.region}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {plantation.action === "Обновленный" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                  {plantation.action === "Bekor qilinganlar" && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                  {plantation.action === "Yaratilgan" && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                    <span className="text-xs font-medium">
                      {plantation.action === "Обновленный" && "Yangilangan"}
                      {plantation.action === "Bekor qilinganlar" && "Bekor qilingan"}
                      {plantation.action === "Yaratilgan" && "Yaratilgan"}
                    </span>
                  </div>
                  </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-600/50 rounded-lg p-2">
                    <div className="text-xs text-gray-400 mb-1">Turi</div>
                    <div className="text-white font-semibold text-sm">{landTypeMapping[plantation.type]}</div>
                  </div>
                  <div className="bg-gray-600/50 rounded-lg p-2">
                    <div className="text-xs text-gray-400 mb-1">Maydon</div>
                    <div className="text-white font-semibold text-sm">{plantation.area}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    <span>{plantation.createdAt ? new Date(plantation.createdAt).toLocaleString("ru-RU") : "—"}</span>
                    {plantation.updatedAt && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-300">
                        <span className="inline-flex items-center px-1 py-0.5 rounded bg-amber-900/50 border border-amber-600/60 text-[10px]">Yangilangan</span>
                        <span className="text-[10px]">{new Date(plantation.updatedAt).toLocaleString("ru-RU")}</span>
                      </span>
                    )}
                    </div>
                  <div className="flex items-center text-blue-400 text-xs font-medium group-hover:text-blue-300 transition-colors">
                    <span>Tahrirlash</span>
                    <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Пагинация для мобильной версии */}
          {!loading && !error && moderations.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-gray-900/95 border-t border-gray-700 px-4 py-3">
              {/* Информация о страницах */}
              <div className="text-center mb-3">
                <div className="text-white text-sm font-semibold">
                  Sahifa {page} dan {totalPages || 1}
                </div>
                <div className="text-gray-400 text-xs">
                  Jami {count} ta yozuv
                </div>
              </div>
              
              {/* Навигация */}
              <div className="flex items-center justify-center space-x-2">
                {/* Кнопка "В начало" */}
                <button
                  className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                  onClick={goToFirstPage}
                  disabled={page <= 1}
                  title="Birinchi sahifa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Кнопка "Назад" */}
              <button
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                onClick={() => {
                  const newPage = Math.max(page - 1, 1);
                  setPage(newPage);
                  localStorage.setItem('moderationPage', newPage.toString());
                  navigate(`/moderation?page=${newPage}`, { replace: true });
                }}
                disabled={page <= 1}
              >
                Orqaga
              </button>
                
                {/* Поле ввода номера страницы */}
                <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="1"
                    max={totalPages || 1}
                    value={pageInput}
                    onChange={handlePageInputChange}
                    className="w-12 px-1 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-sm"
                    placeholder={page.toString()}
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs"
                  >
                    O'tish
                  </button>
                </form>
                
                {/* Кнопка "Вперед" */}
              <button
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                onClick={() => {
                  const newPage = page + 1;
                  if (newPage <= totalPages) {
                    setPage(newPage);
                    localStorage.setItem('moderationPage', newPage.toString());
                    navigate(`/moderation?page=${newPage}`, { replace: true });
                  }
                }}
                disabled={page >= totalPages}
              >
                Oldinga
              </button>
                
                {/* Кнопка "В конец" */}
                <button
                  className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                  onClick={goToLastPage}
                  disabled={page >= totalPages}
                  title="Oxirgi sahifa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Moderation;