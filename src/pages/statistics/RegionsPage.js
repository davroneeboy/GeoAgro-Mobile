  import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Table, Card, Select, Row, Col, Alert, Statistic, Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { 
  fetchRegionsStatisticsWithStatus
} from "../../api/api";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { exportToExcel } from "../../utils/excelExport";


const { Option } = Select;

const REGION_NAMES = {
  12: "Qoraqalpog'iston",
  2: "Andijon",
  3: "Buxoro",
  5: "Jizzax",
  6: "Qashqadaryo",
  7: "Navoiy",
  8: "Namangan",
  9: "Samarqand",
  11: "Surxondaryo",
  10: "Sirdaryo",
  1: "Toshkent",
  4: "Farg‘ona",
  13: "Xorazm",
};

// Порядок регионов по умолчанию (как в предоставленном списке)
const REGION_ORDER = ["12","2","3","5","6","7","8","9","11","10","1","4","13"];


const RegionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const tableContainerRef = useRef(null);
  const [filters, setFilters] = useState({
    plantation_type: [],
    garden_established_year: null,
    regions: [],
    planted_year: null,
    min_fertility: null,
    max_fertility: null,
    sort_by: 'plantations',
    sort_direction: 'desc',
  });
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'approved'
  const [approvedTotals, setApprovedTotals] = useState(null);
  const [rejectedTotals, setRejectedTotals] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Обработчик горизонтального скролла колесиком мыши
  const handleWheelScroll = useCallback((e) => {
    const container = tableContainerRef.current;
    if (!container) return;

    // Проверяем состояние скролла
    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = container;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
    const isAtTop = scrollTop <= 5;
    const canScrollHorizontally = scrollWidth > clientWidth;

    // Если вертикальный скролл достиг конца и есть горизонтальный скролл
    if ((isAtBottom || isAtTop) && canScrollHorizontally) {
      e.preventDefault();
      e.stopPropagation();
      const scrollAmount = e.deltaY * 0.8;
      const newScrollLeft = scrollLeft + scrollAmount;
      container.scrollLeft = Math.max(0, Math.min(newScrollLeft, scrollWidth - clientWidth));
    }
  }, []);

  // Привязываем обработчик события колесика мыши
  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheelScroll, { 
        passive: false, 
        capture: true 
      });
      return () => {
        container.removeEventListener('wheel', handleWheelScroll, { capture: true });
      };
    }
  }, [handleWheelScroll]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);
  const isSyncingUrlRef = useRef(false);

  const areArraysEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (String(a[i]) !== String(b[i])) return false;
    }
    return true;
  };

  const areFiltersEqual = (a, b) => {
    return (
      areArraysEqual(a.plantation_type || [], b.plantation_type || []) &&
      areArraysEqual(a.regions || [], b.regions || []) &&
      String(a.garden_established_year || '') === String(b.garden_established_year || '') &&
      String(a.planted_year || '') === String(b.planted_year || '') &&
      String(a.min_fertility || '') === String(b.min_fertility || '') &&
      String(a.max_fertility || '') === String(b.max_fertility || '') &&
      String(a.sort_by || '') === String(b.sort_by || '') &&
      String(a.sort_direction || '') === String(b.sort_direction || '')
    );
  };

  // Считать фильтры и активную вкладку из URL при загрузке/изменении URL
  useEffect(() => {
    if (isSyncingUrlRef.current) {
      // пропускаем один цикл, если это мы же обновили URL
      isSyncingUrlRef.current = false;
      return;
    }
    const params = new URLSearchParams(location.search);
    const urlTab = params.get('data_type');
    if (urlTab && (urlTab === 'all' || urlTab === 'approved' || urlTab === 'rejected')) {
      if (urlTab !== activeTab) setActiveTab(urlTab);
    } else if (!urlTab && activeTab !== 'all') {
      setActiveTab('all');
    }

    const nextFilters = {
      plantation_type: [],
      garden_established_year: null,
      regions: [],
      planted_year: null,
      min_fertility: null,
      max_fertility: null,
      sort_by: 'plantations',
      sort_direction: 'desc',
    };

    const plantation_type = params.get('plantation_type');
    if (plantation_type) nextFilters.plantation_type = plantation_type.split(',').filter(Boolean);

    const regions = params.get('regions');
    if (regions) nextFilters.regions = regions.split(',').filter(Boolean);

    const est_date = params.get('est_date');
    if (est_date) nextFilters.garden_established_year = isNaN(Number(est_date)) ? null : Number(est_date);

    const planted_year = params.get('planted_year');
    if (planted_year) nextFilters.planted_year = isNaN(Number(planted_year)) ? null : Number(planted_year);

    const min_fertility = params.get('min_fertility');
    if (min_fertility) nextFilters.min_fertility = isNaN(Number(min_fertility)) ? null : Number(min_fertility);

    const max_fertility = params.get('max_fertility');
    if (max_fertility) nextFilters.max_fertility = isNaN(Number(max_fertility)) ? null : Number(max_fertility);

    const sort_by = params.get('sort_by');
    if (sort_by) nextFilters.sort_by = sort_by;

    const sort_direction = params.get('sort_direction');
    if (sort_direction) nextFilters.sort_direction = sort_direction;

    // Обновляем только если реально поменялись значения
    setFilters(prev => (areFiltersEqual(prev, nextFilters) ? prev : { ...prev, ...nextFilters }));
  }, [location.search]);

  // Синхронизировать URL при изменении filters или activeTab
  useEffect(() => {
    const params = new URLSearchParams();

    // Активная вкладка
    if (activeTab && activeTab !== 'all') {
      params.set('data_type', activeTab);
    }

    // Фильтры
    if (filters.plantation_type?.length) {
      params.set('plantation_type', filters.plantation_type.join(','));
    }

    if (filters.regions?.length) {
      params.set('regions', filters.regions.join(','));
    }

    if (filters.garden_established_year) {
      params.set('est_date', String(filters.garden_established_year));
    }

    if (filters.planted_year) {
      params.set('planted_year', String(filters.planted_year));
    }

    if (filters.min_fertility) {
      params.set('min_fertility', String(filters.min_fertility));
    }

    if (filters.max_fertility) {
      params.set('max_fertility', String(filters.max_fertility));
    }

    if (filters.sort_by && filters.sort_by !== 'plantations') {
      params.set('sort_by', filters.sort_by);
    }

    if (filters.sort_direction && filters.sort_direction !== 'desc') {
      params.set('sort_direction', filters.sort_direction);
    }

    const newSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    if (newSearch !== currentSearch) {
      isSyncingUrlRef.current = true;
      navigate({ pathname: location.pathname, search: newSearch ? `?${newSearch}` : '' }, { replace: true });
    }
  }, [filters, activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let data;
        
        if (activeTab === 'all') {
          // Для всех плантаций используем новый API статистики регионов
          setApprovedTotals(null);
          setRejectedTotals(null);
          
          // Подготавливаем параметры для нового API
          const params = {};

        if (filters.garden_established_year) {
            params.est_date = filters.garden_established_year;
          }
          
          if (filters.planted_year) {
            params.planted_year = filters.planted_year;
          }
          
          if (filters.min_fertility) {
            params.min_fertility = filters.min_fertility;
          }
          
          if (filters.max_fertility) {
            params.max_fertility = filters.max_fertility;
          }
          
          if (filters.sort_by !== 'plantations') {
            params.sort_by = filters.sort_by;
          }
          
          if (filters.sort_direction !== 'desc') {
            params.sort_direction = filters.sort_direction;
          }

          // Загружаем данные через новый API с фильтром по статусу
          const allData = await fetchRegionsStatisticsWithStatus('all', params, authState.accessToken);
          
          console.log('API Response:', allData); // Для отладки
          
          // Преобразуем данные в нужный формат для таблицы
          data = {};
          
          // Новый API возвращает массив объектов с данными регионов
          if (Array.isArray(allData)) {
            console.log('Processing regions data:', allData.length, 'items');
            allData.forEach((regionData, index) => {
              const regionId = regionData.region_id?.toString();
              console.log(`Region ${index}:`, { regionId, region_name: regionData.region_name, total_area: regionData.total_area });
              
              // Обрабатываем итоговую строку отдельно
              if (regionId === "TOTAL") {
                console.log('Processing TOTAL row:', {
                  total_area: regionData.total_area,
                  low_fertility: regionData.low_fertility,
                  high_fertility: regionData.high_fertility,
                  irrigation: regionData.irrigation
                });
                data['total'] = {
                  total_area: regionData.total_area || 0,
                  total_plantations: regionData.total_plantations || 0,
                  total_fruitarea: regionData.planted_area || 0,
                  total_approved_fruitarea: regionData.approved_plantations || 0,
                  // Новые поля из API
                  approved_plantations: regionData.approved_plantations || 0,
                  pending_plantations: regionData.pending_plantations || 0,
                  rejected_plantations: regionData.rejected_plantations || 0,
                  planted_area: regionData.planted_area || 0,
                  not_used_area: regionData.not_used_area || 0,
                  outdated_ga: regionData.outdated_ga || 0,
                  // Плодородие
                  low_fertility_count: regionData.low_fertility?.count || 0,
                  low_fertility_area: regionData.low_fertility?.area || 0,
                  high_fertility_count: regionData.high_fertility?.count || 0,
                  high_fertility_area: regionData.high_fertility?.area || 0,
                  // Орошение
                  irrigation_area: regionData.irrigation?.area || 0,
                  irrigation_count: regionData.irrigation?.count || 0,
                  // Типы плантаций
                  bogs_count: regionData.bogs_count || 0,
                  bogs_area: regionData.bogs_area || 0,
                  uzumzors_count: regionData.uzumzors_count || 0,
                  uzumzors_area: regionData.uzumzors_area || 0,
                  issiqxonas_count: regionData.issiqxonas_count || 0,
                  issiqxonas_area: regionData.issiqxonas_area || 0,
                  // Инвестиции
                  investment_local: regionData.investment?.local || 0,
                  investment_foreign: regionData.investment?.foreign || 0,
                  // Субсидии
                  subsidy_count: regionData.subsidy?.subsidy_count || 0,
                  total_subsidy: regionData.subsidy?.total_subsidy || 0,
                  // Отчеты
                  agricultural_report: regionData.agricultural_report || {},
                  bogs_report: regionData.bogs_report || {},
                  uzumzor_report: regionData.uzumzor_report || {},
                  subsidy_report: regionData.subsidy_report || {},
                };
              } else if (regionId) {
                // Обычные регионы
                console.log(`Processing region ${regionId}:`, {
                  total_area: regionData.total_area,
                  low_fertility: regionData.low_fertility,
                  high_fertility: regionData.high_fertility,
                  irrigation: regionData.irrigation
                });
                data[regionId] = {
                  total_area: regionData.total_area || 0,
                  total_plantations: regionData.total_plantations || 0,
                  total_fruitarea: regionData.planted_area || 0,
                  total_approved_fruitarea: regionData.approved_plantations || 0,
                  // Новые поля из API
                  approved_plantations: regionData.approved_plantations || 0,
                  pending_plantations: regionData.pending_plantations || 0,
                  rejected_plantations: regionData.rejected_plantations || 0,
                  planted_area: regionData.planted_area || 0,
                  not_used_area: regionData.not_used_area || 0,
                  outdated_ga: regionData.outdated_ga || 0,
                  // Плодородие
                  low_fertility_count: regionData.low_fertility?.count || 0,
                  low_fertility_area: regionData.low_fertility?.area || 0,
                  high_fertility_count: regionData.high_fertility?.count || 0,
                  high_fertility_area: regionData.high_fertility?.area || 0,
                  // Орошение
                  irrigation_area: regionData.irrigation?.area || 0,
                  irrigation_count: regionData.irrigation?.count || 0,
                  // Типы плантаций
                  bogs_count: regionData.bogs_count || 0,
                  bogs_area: regionData.bogs_area || 0,
                  uzumzors_count: regionData.uzumzors_count || 0,
                  uzumzors_area: regionData.uzumzors_area || 0,
                  issiqxonas_count: regionData.issiqxonas_count || 0,
                  issiqxonas_area: regionData.issiqxonas_area || 0,
                  // Инвестиции
                  investment_local: regionData.investment?.local || 0,
                  investment_foreign: regionData.investment?.foreign || 0,
                  // Субсидии
                  subsidy_count: regionData.subsidy?.subsidy_count || 0,
                  total_subsidy: regionData.subsidy?.total_subsidy || 0,
                  // Отчеты
                  agricultural_report: regionData.agricultural_report || {},
                  bogs_report: regionData.bogs_report || {},
                  uzumzor_report: regionData.uzumzor_report || {},
                  subsidy_report: regionData.subsidy_report || {},
                };
              }
            });
          }

          console.log('Final processed data:', data);
          console.log('Data keys:', Object.keys(data));

          setStatistics(data);
        } else if (activeTab === 'approved') {
          
          // Подготавливаем параметры для нового API
          const params = {};
          
          if (filters.garden_established_year) {
            params.est_date = filters.garden_established_year;
          }
          
          if (filters.planted_year) {
            params.planted_year = filters.planted_year;
          }
          
          if (filters.min_fertility) {
            params.min_fertility = filters.min_fertility;
          }
          
          if (filters.max_fertility) {
            params.max_fertility = filters.max_fertility;
          }
          
          if (filters.sort_by !== 'plantations') {
            params.sort_by = filters.sort_by;
          }
          
          if (filters.sort_direction !== 'desc') {
            params.sort_direction = filters.sort_direction;
          }

          // Загружаем данные для всех регионов сразу с фильтром approved
          const approvedData = await fetchRegionsStatisticsWithStatus('approved', params, authState.accessToken);
          
          console.log('Approved API Response:', approvedData); // Для отладки
          
          // Преобразуем данные в нужный формат для таблицы
          data = {};
          
          // Новый API возвращает массив объектов с данными регионов
          if (Array.isArray(approvedData)) {
            console.log('Processing approved regions data:', approvedData.length, 'items');
            approvedData.forEach((regionData, index) => {
              const regionId = regionData.region_id?.toString();
              console.log(`Approved Region ${index}:`, { regionId, region_name: regionData.region_name, total_area: regionData.total_area });
              
              // Обрабатываем итоговую строку отдельно
              if (regionId === "TOTAL") {
                console.log('Processing approved TOTAL row:', {
                  total_area: regionData.total_area,
                  low_fertility: regionData.low_fertility,
                  high_fertility: regionData.high_fertility,
                  irrigation: regionData.irrigation
                });
                data['total'] = {
                  total_area: regionData.total_area || 0,
                  total_plantations: regionData.total_plantations || 0,
                  total_fruitarea: regionData.planted_area || 0,
                  total_approved_fruitarea: regionData.approved_plantations || 0,
                  // Новые поля из API
                  approved_plantations: regionData.approved_plantations || 0,
                  pending_plantations: regionData.pending_plantations || 0,
                  rejected_plantations: regionData.rejected_plantations || 0,
                  planted_area: regionData.planted_area || 0,
                  not_used_area: regionData.not_used_area || 0,
                  outdated_ga: regionData.outdated_ga || 0,
                  // Плодородие
                  low_fertility_count: regionData.low_fertility?.count || 0,
                  low_fertility_area: regionData.low_fertility?.area || 0,
                  high_fertility_count: regionData.high_fertility?.count || 0,
                  high_fertility_area: regionData.high_fertility?.area || 0,
                  // Орошение
                  irrigation_area: regionData.irrigation?.area || 0,
                  irrigation_count: regionData.irrigation?.count || 0,
                  // Типы плантаций
                  bogs_count: regionData.bogs_count || 0,
                  bogs_area: regionData.bogs_area || 0,
                  uzumzors_count: regionData.uzumzors_count || 0,
                  uzumzors_area: regionData.uzumzors_area || 0,
                  issiqxonas_count: regionData.issiqxonas_count || 0,
                  issiqxonas_area: regionData.issiqxonas_area || 0,
                  // Инвестиции
                  investment_local: regionData.investment?.local || 0,
                  investment_foreign: regionData.investment?.foreign || 0,
                  // Субсидии
                  subsidy_count: regionData.subsidy?.subsidy_count || 0,
                  total_subsidy: regionData.subsidy?.total_subsidy || 0,
                  // Отчеты
                  agricultural_report: regionData.agricultural_report || {},
                  bogs_report: regionData.bogs_report || {},
                  uzumzor_report: regionData.uzumzor_report || {},
                  subsidy_report: regionData.subsidy_report || {},
                };
              } else if (regionId) {
                // Обычные регионы
                console.log(`Processing approved region ${regionId}:`, {
                  total_area: regionData.total_area,
                  low_fertility: regionData.low_fertility,
                  high_fertility: regionData.high_fertility,
                  irrigation: regionData.irrigation
                });
              data[regionId] = {
                  total_area: regionData.total_area || 0,
                  total_plantations: regionData.total_plantations || 0,
                  total_fruitarea: regionData.planted_area || 0,
                  total_approved_fruitarea: regionData.approved_plantations || 0,
                  // Новые поля из API
                  approved_plantations: regionData.approved_plantations || 0,
                  pending_plantations: regionData.pending_plantations || 0,
                  rejected_plantations: regionData.rejected_plantations || 0,
                  planted_area: regionData.planted_area || 0,
                  not_used_area: regionData.not_used_area || 0,
                  outdated_ga: regionData.outdated_ga || 0,
                  // Плодородие
                  low_fertility_count: regionData.low_fertility?.count || 0,
                  low_fertility_area: regionData.low_fertility?.area || 0,
                  high_fertility_count: regionData.high_fertility?.count || 0,
                  high_fertility_area: regionData.high_fertility?.area || 0,
                  // Орошение
                  irrigation_area: regionData.irrigation?.area || 0,
                  irrigation_count: regionData.irrigation?.count || 0,
                  // Типы плантаций
                  bogs_count: regionData.bogs_count || 0,
                  bogs_area: regionData.bogs_area || 0,
                  uzumzors_count: regionData.uzumzors_count || 0,
                  uzumzors_area: regionData.uzumzors_area || 0,
                  issiqxonas_count: regionData.issiqxonas_count || 0,
                  issiqxonas_area: regionData.issiqxonas_area || 0,
          // Инвестиции
                  investment_local: regionData.investment?.local || 0,
                  investment_foreign: regionData.investment?.foreign || 0,
          // Субсидии
                  subsidy_count: regionData.subsidy?.subsidy_count || 0,
                  total_subsidy: regionData.subsidy?.total_subsidy || 0,
                  // Отчеты
                  agricultural_report: regionData.agricultural_report || {},
                  bogs_report: regionData.bogs_report || {},
                  uzumzor_report: regionData.uzumzor_report || {},
                  subsidy_report: regionData.subsidy_report || {},
                };
              }
            });
          }

          console.log('Final processed approved data:', data);
          console.log('Approved data keys:', Object.keys(data));
          
          setStatistics(data);
          setApprovedTotals(data['total'] || null);
          setRejectedTotals(null);
        } else if (activeTab === 'rejected') {
          // Для отклонённых используем новый API статистики
          // Подготавливаем параметры
          const params = {};
          if (filters.garden_established_year) params.est_date = filters.garden_established_year;
          if (filters.planted_year) params.planted_year = filters.planted_year;
          if (filters.min_fertility) params.min_fertility = filters.min_fertility;
          if (filters.max_fertility) params.max_fertility = filters.max_fertility;
          if (filters.sort_by !== 'plantations') params.sort_by = filters.sort_by;
          if (filters.sort_direction !== 'desc') params.sort_direction = filters.sort_direction;

          const rejectedData = await fetchRegionsStatisticsWithStatus('rejected', params, authState.accessToken);
          
          // Преобразуем данные для rejected согласно новой структуре API v2.0
          data = {};
          
          if (Array.isArray(rejectedData)) {
            rejectedData.forEach((regionData, index) => {
              const regionId = regionData.region_id?.toString();
              console.log(`Rejected Region ${index}:`, { regionId, region_name: regionData.region_name, total_area: regionData.total_area });
              
              // Обрабатываем итоговую строку отдельно
              if (regionId === "TOTAL") {
                console.log('Processing rejected TOTAL row:', {
                  total_area: regionData.total_area,
                  low_fertility: regionData.low_fertility,
                  high_fertility: regionData.high_fertility,
                  irrigation: regionData.irrigation
                });
                data['total'] = {
                  total_area: regionData.total_area || 0,
                  total_plantations: regionData.total_plantations || 0,
                  total_fruitarea: regionData.planted_area || 0,
                  total_approved_fruitarea: regionData.approved_plantations || 0,
                  // Новые поля из API
                  approved_plantations: regionData.approved_plantations || 0,
                  pending_plantations: regionData.pending_plantations || 0,
                  rejected_plantations: regionData.rejected_plantations || 0,
                  planted_area: regionData.planted_area || 0,
                  not_used_area: regionData.not_used_area || 0,
                  outdated_ga: regionData.outdated_ga || 0,
                  // Плодородие
                  low_fertility_count: regionData.low_fertility?.count || 0,
                  low_fertility_area: regionData.low_fertility?.area || 0,
                  high_fertility_count: regionData.high_fertility?.count || 0,
                  high_fertility_area: regionData.high_fertility?.area || 0,
                  // Орошение
                  irrigation_area: regionData.irrigation?.area || 0,
                  irrigation_count: regionData.irrigation?.count || 0,
                  // Типы плантаций
                  bogs_count: regionData.bogs_count || 0,
                  bogs_area: regionData.bogs_area || 0,
                  uzumzors_count: regionData.uzumzors_count || 0,
                  uzumzors_area: regionData.uzumzors_area || 0,
                  issiqxonas_count: regionData.issiqxonas_count || 0,
                  issiqxonas_area: regionData.issiqxonas_area || 0,
                  // Инвестиции
                  investment_local: regionData.investment?.local || 0,
                  investment_foreign: regionData.investment?.foreign || 0,
                  // Субсидии
                  subsidy_count: regionData.subsidy?.subsidy_count || 0,
                  total_subsidy: regionData.subsidy?.total_subsidy || 0,
                  // Отчеты
                  agricultural_report: regionData.agricultural_report || {},
                  bogs_report: regionData.bogs_report || {},
                  uzumzor_report: regionData.uzumzor_report || {},
                  subsidy_report: regionData.subsidy_report || {},
                };
              } else if (regionId) {
                // Обычные регионы
                console.log(`Processing rejected region ${regionId}:`, {
                  total_area: regionData.total_area,
                  low_fertility: regionData.low_fertility,
                  high_fertility: regionData.high_fertility,
                  irrigation: regionData.irrigation
                });
                data[regionId] = {
                  total_area: regionData.total_area || 0,
                  total_plantations: regionData.total_plantations || 0,
                  total_fruitarea: regionData.planted_area || 0,
                  total_approved_fruitarea: regionData.approved_plantations || 0,
                  // Новые поля из API
                  approved_plantations: regionData.approved_plantations || 0,
                  pending_plantations: regionData.pending_plantations || 0,
                  rejected_plantations: regionData.rejected_plantations || 0,
                  planted_area: regionData.planted_area || 0,
                  not_used_area: regionData.not_used_area || 0,
                  outdated_ga: regionData.outdated_ga || 0,
                  // Плодородие
                  low_fertility_count: regionData.low_fertility?.count || 0,
                  low_fertility_area: regionData.low_fertility?.area || 0,
                  high_fertility_count: regionData.high_fertility?.count || 0,
                  high_fertility_area: regionData.high_fertility?.area || 0,
                  // Орошение
                  irrigation_area: regionData.irrigation?.area || 0,
                  irrigation_count: regionData.irrigation?.count || 0,
                  // Типы плантаций
                  bogs_count: regionData.bogs_count || 0,
                  bogs_area: regionData.bogs_area || 0,
                  uzumzors_count: regionData.uzumzors_count || 0,
                  uzumzors_area: regionData.uzumzors_area || 0,
                  issiqxonas_count: regionData.issiqxonas_count || 0,
                  issiqxonas_area: regionData.issiqxonas_area || 0,
                  // Инвестиции
                  investment_local: regionData.investment?.local || 0,
                  investment_foreign: regionData.investment?.foreign || 0,
                  // Субсидии
                  subsidy_count: regionData.subsidy?.subsidy_count || 0,
                  total_subsidy: regionData.subsidy?.total_subsidy || 0,
                  // Отчеты
                  agricultural_report: regionData.agricultural_report || {},
                  bogs_report: regionData.bogs_report || {},
                  uzumzor_report: regionData.uzumzor_report || {},
                  subsidy_report: regionData.subsidy_report || {},
                };
              }
            });
          }

          console.log('Final processed rejected data:', data);
          console.log('Rejected data keys:', Object.keys(data));

          setStatistics(data);
          setRejectedTotals(data['total'] || null);
          setApprovedTotals(null);
        } else {
          // Для остальных случаев очищаем данные
          setApprovedTotals(null);
          setRejectedTotals(null);
          data = {};
        }
        
        // Для вкладки "all" данные о количестве плантаций уже получены из основного API

        if (filters.regions.length > 0) {
          const filteredData = {};
          filters.regions.forEach((region) => {
            if (data[region]) filteredData[region] = data[region];
          });
          setStatistics(filteredData);
        } else {
          setStatistics(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authState.accessToken, activeTab, filters]);

  // Обработчики фильтров
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      plantation_type: [],
      garden_established_year: null,
      regions: [],
      planted_year: null,
      min_fertility: null,
      max_fertility: null,
      sort_by: 'plantations',
      sort_direction: 'desc',
    });
  }, []);

  // Функция для экспорта в Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      
      // Получаем данные для экспорта
      const exportData = sortedTableData;
      
      // Отладочная информация для вкладки "all"
      if (activeTab !== 'approved' && activeTab !== 'rejected') {
      }
      
      const exportTotals = activeTab === 'approved' ? approvedTotals : activeTab === 'rejected' ? rejectedTotals : {
        total_area: exportData.reduce((sum, row) => sum + (row.total_area || 0), 0),
        total_plantations: exportData.reduce((sum, row) => sum + (row.total_plantations || 0), 0),
        total_fruitarea: exportData.reduce((sum, row) => sum + (row.total_fruitarea || 0), 0),
        outdated_ga: exportData.reduce((sum, row) => sum + (row.outdated_ga || 0), 0),
        total_investment: exportData.reduce((sum, row) => sum + (row.investment_local || 0) + (row.investment_foreign || 0), 0),
        total_subsidy: exportData.reduce((sum, row) => sum + (row.total_subsidy || 0), 0),
        // Добавляем недостающие поля для вкладки "all"
        bogs_count: exportData.reduce((sum, row) => sum + (row.bogs_count || 0), 0),
        bogs_area: exportData.reduce((sum, row) => sum + (row.bogs_area || 0), 0),
        uzumzors_count: exportData.reduce((sum, row) => sum + (row.uzumzors_count || 0), 0),
        uzumzors_area: exportData.reduce((sum, row) => sum + (row.uzumzors_area || 0), 0),
        issiqxonas_count: exportData.reduce((sum, row) => sum + (row.issiqxonas_count || 0), 0),
        issiqxonas_area: exportData.reduce((sum, row) => sum + (row.issiqxonas_area || 0), 0),
        investment_local: exportData.reduce((sum, row) => sum + (row.investment_local || 0), 0),
        investment_foreign: exportData.reduce((sum, row) => sum + (row.investment_foreign || 0), 0),
        subsidy_count: exportData.reduce((sum, row) => sum + (row.subsidy_count || 0), 0),
        // Новые поля
        approved_plantations: exportData.reduce((sum, row) => sum + (row.approved_plantations || 0), 0),
        pending_plantations: exportData.reduce((sum, row) => sum + (row.pending_plantations || 0), 0),
        rejected_plantations: exportData.reduce((sum, row) => sum + (row.rejected_plantations || 0), 0),
        planted_area: exportData.reduce((sum, row) => sum + (row.planted_area || 0), 0),
        not_used_area: exportData.reduce((sum, row) => sum + (row.not_used_area || 0), 0),
        low_fertility_area: exportData.reduce((sum, row) => sum + (row.low_fertility_area || 0), 0),
        high_fertility_area: exportData.reduce((sum, row) => sum + (row.high_fertility_area || 0), 0),
        irrigation_area: exportData.reduce((sum, row) => sum + (row.irrigation_area || 0), 0),
        irrigation_count: exportData.reduce((sum, row) => sum + (row.irrigation_count || 0), 0)
      };
      
      // Отладочная информация для итогов
      if (activeTab !== 'approved' && activeTab !== 'rejected') {
      }
      
      // Генерируем имя файла
      const regionName = filters.regions.length > 0 
        ? filters.regions.map(id => REGION_NAMES[id]).join('_')
        : 'All_Regions';
      const filename = `${regionName}_statistics_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Экспортируем
      const success = await exportToExcel(exportData, exportTotals, activeTab, regionName, filename, true);
      
      if (success) {
        message.success('Excel fayl muvaffaqiyatli yuklandi!');
      } else {
        message.error('Excel fayl yuklashda xatolik yuz berdi.');
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error('Excel fayl yuklashda xatolik yuz berdi.');
    } finally {
      setExporting(false);
    }
  };

  const safeNumber = (value) => (typeof value === "number" ? value : 0);

  const tableData = Object.entries(statistics)
    .filter(([regionId]) => regionId !== 'total') // Исключаем total из основных данных
    .map(([regionId, data]) => {
    if (regionId === '11') { // Parkent
    }
    
    console.log(`Creating table row for region ${regionId}:`, {
      low_fertility: data.low_fertility,
      high_fertility: data.high_fertility,
      irrigation: data.irrigation,
      low_fertility_area: data.low_fertility_area,
      high_fertility_area: data.high_fertility_area,
      irrigation_area: data.irrigation_area,
      irrigation_count: data.irrigation_count
    });
    
    return {
    key: regionId,
    region: REGION_NAMES[regionId],
    total_area: safeNumber(data.total_area),
      total_plantations: safeNumber(data.total_plantations || data.plantation_count || data.plantations_count || data.count || 0),
      total_fruitarea: activeTab === 'approved' ? safeNumber(data.total_approved_fruitarea) : safeNumber(data.total_fruitarea || data.total_approved_fruitarea),
      total_approved_fruitarea: safeNumber(data.total_approved_fruitarea),
      bogs_count: safeNumber(data.bogs_count),
      bogs_area: safeNumber(data.bogs_area),
      uzumzors_count: safeNumber(data.uzumzors_count),
      uzumzors_area: safeNumber(data.uzumzors_area),
      issiqxonas_count: safeNumber(data.issiqxonas_count),
      issiqxonas_area: safeNumber(data.issiqxonas_area),
      // Новые поля из API
      approved_plantations: safeNumber(data.approved_plantations),
      pending_plantations: safeNumber(data.pending_plantations),
      rejected_plantations: safeNumber(data.rejected_plantations),
      planted_area: safeNumber(data.planted_area),
      not_used_area: safeNumber(data.not_used_area),
      outdated_ga: safeNumber(data.outdated_ga),
      // Плодородие
      low_fertility_count: safeNumber(data.low_fertility_count || 0),
      low_fertility_area: safeNumber(data.low_fertility_area || 0),
      high_fertility_count: safeNumber(data.high_fertility_count || 0),
      high_fertility_area: safeNumber(data.high_fertility_area || 0),
      // Орошение
      irrigation_area: safeNumber(data.irrigation_area || 0),
      irrigation_count: safeNumber(data.irrigation_count || 0),
      // Инвестиции
      investment_local: safeNumber(data.investment?.local || data.investment_local || 0),
      investment_foreign: safeNumber(data.investment?.foreign || data.investment_foreign || 0),
      // Субсидии
      subsidy_count: safeNumber(data.subsidy?.subsidy_count || data.subsidy_count || 0),
      total_subsidy: safeNumber(data.subsidy?.total_subsidy || data.total_subsidy || 0),
      // Отчеты
      agricultural_report: data.agricultural_report || {},
      bogs_report: data.bogs_report || {},
      uzumzor_report: data.uzumzor_report || {},
      subsidy_report: data.subsidy_report || {},
    };
  });

  const sortedTableData = React.useMemo(() => {
    if (!sortConfig?.field) {
      const orderIndex = (id) => {
        const idx = REGION_ORDER.indexOf(String(id));
        return idx === -1 ? 999 : idx;
      };
      const rows = [...tableData];
      rows.sort((a, b) => orderIndex(a.key) - orderIndex(b.key));
      return rows;
    }
    const collator = new Intl.Collator('ru', { sensitivity: 'base' });
    const getVal = (row) => {
      switch (sortConfig.field) {
        case 'region':
          return row.region || '';
        case 'total_area':
          return Number(row.total_area || 0);
        case 'total_plantations':
          return Number(row.total_plantations || 0);
        case 'total_fruitarea':
          return Number(row.total_fruitarea || 0);
        case 'total_approved_fruitarea':
          return Number(row.total_approved_fruitarea || 0);
        case 'low_fertility_count':
          return Number(row.low_fertility_count || 0);
        case 'low_fertility_area':
          return Number(row.low_fertility_area || 0);
        case 'high_fertility_count':
          return Number(row.high_fertility_count || 0);
        case 'high_fertility_area':
          return Number(row.high_fertility_area || 0);
        case 'irrigation_area':
          return Number(row.irrigation_area || 0);
        case 'irrigation_count':
          return Number(row.irrigation_count || 0);
        case 'investment_local':
          return Number(row.investment_local || 0);
        case 'investment_foreign':
          return Number(row.investment_foreign || 0);
        case 'subsidy_count':
          return Number(row.subsidy_count || 0);
        case 'total_subsidy':
          return Number(row.total_subsidy || 0);
        case 'approved_plantations':
          return Number(row.approved_plantations || 0);
        case 'pending_plantations':
          return Number(row.pending_plantations || 0);
        case 'rejected_plantations':
          return Number(row.rejected_plantations || 0);
        case 'planted_area':
          return Number(row.planted_area || 0);
        case 'not_used_area':
          return Number(row.not_used_area || 0);
        default:
          return '';
      }
    };
    const rows = [...tableData];
    rows.sort((a, b) => {
      const aVal = getVal(a);
      const bVal = getVal(b);
      let res;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        res = aVal - bVal;
      } else {
        res = collator.compare(String(aVal ?? ''), String(bVal ?? ''));
      }
      return sortConfig.order === 'descend' ? -res : res;
    });
    return rows;
  }, [tableData, sortConfig]);

  const initialTotalRow = {
    key: "total",
    region: "Jami",
    total_area: 0,
    total_plantations: 0,
    total_fruitarea: 0,
    total_approved_fruitarea: 0,
    bogs_count: 0,
    bogs_area: 0,
    uzumzors_count: 0,
    uzumzors_area: 0,
    issiqxonas_count: 0,
    issiqxonas_area: 0,
    // Новые поля
    approved_plantations: 0,
    pending_plantations: 0,
    rejected_plantations: 0,
    planted_area: 0,
    not_used_area: 0,
    outdated_ga: 0,
    low_fertility_count: 0,
    low_fertility_area: 0,
    high_fertility_count: 0,
    high_fertility_area: 0,
    irrigation_area: 0,
    irrigation_count: 0,
    investment_local: 0,
    investment_foreign: 0,
    subsidy_count: 0,
    total_subsidy: 0,
  };

  let totalRow;
  
  // Проверяем, есть ли данные "total" из API
  if (statistics?.total) {
    console.log('Creating total row from statistics.total:', {
      low_fertility: statistics.total.low_fertility,
      high_fertility: statistics.total.high_fertility,
      irrigation: statistics.total.irrigation
    });
    totalRow = {
      key: "total",
      region: "Jami",
      ...statistics.total
    };
  } else if ((activeTab === 'approved' || activeTab === 'all') && approvedTotals) {
    // Для approved и all статистики используем данные из API
    totalRow = {
      key: "total",
      region: "Jami",
      ...approvedTotals
    };
  } else if (activeTab === 'rejected' && rejectedTotals) {
    totalRow = {
      key: "total",
      region: "Jami",
      ...rejectedTotals
    };
  } else {
    // Для остальных случаев вычисляем сумму
    totalRow = tableData.reduce(
    (acc, curr) => ({
      ...acc,
      total_area: acc.total_area + safeNumber(curr.total_area),
        total_plantations: acc.total_plantations + safeNumber(curr.total_plantations),
        total_fruitarea: acc.total_fruitarea + safeNumber(curr.total_fruitarea),
        total_approved_fruitarea: acc.total_approved_fruitarea + safeNumber(curr.total_approved_fruitarea),
        bogs_count: acc.bogs_count + safeNumber(curr.bogs_count),
        bogs_area: acc.bogs_area + safeNumber(curr.bogs_area),
        uzumzors_count: acc.uzumzors_count + safeNumber(curr.uzumzors_count),
        uzumzors_area: acc.uzumzors_area + safeNumber(curr.uzumzors_area),
        issiqxonas_count: acc.issiqxonas_count + safeNumber(curr.issiqxonas_count),
        issiqxonas_area: acc.issiqxonas_area + safeNumber(curr.issiqxonas_area),
        // Новые поля
        approved_plantations: acc.approved_plantations + safeNumber(curr.approved_plantations),
        pending_plantations: acc.pending_plantations + safeNumber(curr.pending_plantations),
        rejected_plantations: acc.rejected_plantations + safeNumber(curr.rejected_plantations),
        planted_area: acc.planted_area + safeNumber(curr.planted_area),
        not_used_area: acc.not_used_area + safeNumber(curr.not_used_area),
        outdated_ga: acc.outdated_ga + safeNumber(curr.outdated_ga),
        low_fertility_count: acc.low_fertility_count + safeNumber(curr.low_fertility_count),
        low_fertility_area: acc.low_fertility_area + safeNumber(curr.low_fertility_area),
        high_fertility_count: acc.high_fertility_count + safeNumber(curr.high_fertility_count),
        high_fertility_area: acc.high_fertility_area + safeNumber(curr.high_fertility_area),
        irrigation_area: acc.irrigation_area + safeNumber(curr.irrigation_area),
        irrigation_count: acc.irrigation_count + safeNumber(curr.irrigation_count),
      investment_local: acc.investment_local + safeNumber(curr.investment_local),
      investment_foreign: acc.investment_foreign + safeNumber(curr.investment_foreign),
      subsidy_count: acc.subsidy_count + safeNumber(curr.subsidy_count),
      total_subsidy: acc.total_subsidy + safeNumber(curr.total_subsidy),
    }),
    initialTotalRow
  );
  }

  // Всегда добавляем итоговую строку, если она есть
  const dataWithTotal = totalRow ? [...sortedTableData, totalRow] : sortedTableData;

  // Базовые колонки для всех вкладок
  const baseColumns = [
    {
      title: "Viloyat",
      dataIndex: "region",
      key: "region",
      fixed: "left",
      sorter: true,
      sortOrder: sortConfig.field === 'region' ? sortConfig.order : null,
      sortDirections: ['ascend','descend'],
      onCell: (record) => ({
        onClick: () => {
          if (record.key !== "total") {
            const regionId = String(authState?.regionId || '');
            const isHead = String(authState?.userRole) === 'headof_region';
            const target = String(record.key);
            if (isHead && regionId && target !== regionId) {
              message.warning("Siz faqat o'zingizning viloyatingizni ko'ra olasiz");
              return;
            }
            const params = new URLSearchParams(location.search);
            const queryString = params.toString();
            navigate(`/statistics/regions/${record.key}${queryString ? `?${queryString}` : ''}`);
          }
        },
        style: { cursor: record.key !== "total" ? "pointer" : "default", color: '#e5e7eb' },
      }),
      responsive: ['xs', 'sm', 'md', 'lg']
    },
    {
      title: "Umumiy maydon",
      children: [
        {
          title: "Jami (GA)",
          dataIndex: "total_area",
          key: "total_area",
          sorter: true,
          sortOrder: sortConfig.field === 'total_area' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Subyektlar",
          dataIndex: "total_plantations",
          key: "total_plantations",
          sorter: true,
          sortOrder: sortConfig.field === 'total_plantations' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value)}</span>,
        },
        {
          title: activeTab === 'approved' ? "Tasdiqlangan ekilgan maydoni (GA)" : "Ekilgan maydoni (GA)",
          dataIndex: activeTab === 'approved' ? "total_approved_fruitarea" : "total_fruitarea",
          key: activeTab === 'approved' ? "total_approved_fruitarea" : "total_fruitarea",
          sorter: true,
          sortOrder: sortConfig.field === (activeTab === 'approved' ? 'total_approved_fruitarea' : 'total_fruitarea') ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Ekilgan maydon (GA)",
          dataIndex: "planted_area",
          key: "planted_area",
          sorter: true,
          sortOrder: sortConfig.field === 'planted_area' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Foydalanilmagan maydon (GA)",
          dataIndex: "not_used_area",
          key: "not_used_area",
          sorter: true,
          sortOrder: sortConfig.field === 'not_used_area' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
      ],
    },
    {
      title: "Bog'lar",
          children: [
            {
              title: "Soni",
          dataIndex: "bogs_count",
          key: "bogs_count",
              sorter: true,
          sortOrder: sortConfig.field === 'bogs_count' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value)}</span>,
        },
        {
          title: "Maydon (GA)",
          dataIndex: "bogs_area",
          key: "bogs_area",
              sorter: true,
          sortOrder: sortConfig.field === 'bogs_area' ? sortConfig.order : null,
              sortDirections: ['ascend','descend'],
              render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
            },
          ],
        },
    {
      title: "Uzumzorlar",
          children: [
            {
              title: "Soni",
          dataIndex: "uzumzors_count",
          key: "uzumzors_count",
              sorter: true,
          sortOrder: sortConfig.field === 'uzumzors_count' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value)}</span>,
        },
        {
          title: "Maydon (GA)",
          dataIndex: "uzumzors_area",
          key: "uzumzors_area",
              sorter: true,
          sortOrder: sortConfig.field === 'uzumzors_area' ? sortConfig.order : null,
              sortDirections: ['ascend','descend'],
              render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
      ],
    },
  ];

  // Колонка Status только для вкладки "all"
  const statusColumn = activeTab === 'all' ? [{
      title: "Status",
      children: [
        {
          title: "Tasdiqlangan",
          dataIndex: "approved_plantations",
          key: "approved_plantations",
          sorter: true,
          sortOrder: sortConfig.field === 'approved_plantations' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#10b981' }}>{safeNumber(value)}</span>,
        },
        {
          title: "Kutilmoqda",
          dataIndex: "pending_plantations",
          key: "pending_plantations",
          sorter: true,
          sortOrder: sortConfig.field === 'pending_plantations' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#f59e0b' }}>{safeNumber(value)}</span>,
        },
        {
          title: "Rad etilgan",
          dataIndex: "rejected_plantations",
          key: "rejected_plantations",
          sorter: true,
          sortOrder: sortConfig.field === 'rejected_plantations' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#ef4444' }}>{safeNumber(value)}</span>,
        },
      ],
  }] : [];

  // Остальные колонки
  const otherColumns = [
    {
      title: "Unumdorlik",
      children: [
        {
          title: "Past unumdorlik",
          dataIndex: "low_fertility_area",
          key: "low_fertility_area",
          sorter: true,
          sortOrder: sortConfig.field === 'low_fertility_area' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#ef4444' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Yuqori unumdorlik",
          dataIndex: "high_fertility_area",
          key: "high_fertility_area",
          sorter: true,
          sortOrder: sortConfig.field === 'high_fertility_area' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#10b981' }}>{safeNumber(value).toFixed(1)}</span>,
        },
      ],
    },
    {
      title: "Orosh",
      children: [
        {
          title: "Maydon (GA)",
          dataIndex: "irrigation_area",
          key: "irrigation_area",
          sorter: true,
          sortOrder: sortConfig.field === 'irrigation_area' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Soni",
          dataIndex: "irrigation_count",
          key: "irrigation_count",
          sorter: true,
          sortOrder: sortConfig.field === 'irrigation_count' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value)}</span>,
        },
      ],
    },

    {
      title: "Investitsiyalar",
      children: [
        {
          title: "Mahalliy",
          dataIndex: "investment_local",
          key: "investment_local",
          sorter: true,
          sortOrder: sortConfig.field === 'investment_local' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toLocaleString()}</span>,
        },
        {
          title: "Xorijiy",
          dataIndex: "investment_foreign",
          key: "investment_foreign",
          sorter: true,
          sortOrder: sortConfig.field === 'investment_foreign' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toLocaleString()}</span>,
        },
      ],
    },
    {
      title: "Subsidiyalar",
      children: [
        {
          title: "Soni",
          dataIndex: "subsidy_count",
          key: "subsidy_count",
          sorter: true,
          sortOrder: sortConfig.field === 'subsidy_count' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
        },
        {
          title: "Jami summa",
          dataIndex: "total_subsidy",
          key: "total_subsidy",
          sorter: true,
          sortOrder: sortConfig.field === 'total_subsidy' ? sortConfig.order : null,
          sortDirections: ['ascend','descend'],
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toLocaleString()}</span>,
        },
      ],
    },
  ];

  // Объединяем все колонки
  const columns = [
    ...baseColumns,
    ...statusColumn,
    ...otherColumns
  ];

  return (
    <StatisticsLayout>
      <div className="p-3 sm:p-4 pb-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-white">Viloyatlar bo'yicha statistika</h1>
          <Button type="primary" danger           onClick={handleResetFilters}>
            Filterni tozalash
          </Button>
        </div>

        {/* Вкладки для переключения типов данных */}
        <Card className="mb-3 sm:mb-4" bodyStyle={{ background: '#1f2937', padding: 12 }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Barcha planatsiyalar
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Tasdiqlangan
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Rad etilgan
            </button>
          </div>
          
          {/* Кнопка экспорта */}
          <div className="flex justify-end mt-4">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportToExcel}
              loading={exporting}
              className="bg-green-600 hover:bg-green-700 border-green-600"
              size="large"
            >
              Excel ga eksport qilish
            </Button>
          </div>
        </Card>

        {error && (
          <Alert
            message="Xatolik"
            description={error}
            type="error"
            className="mb-4"
            showIcon
          />
        )}

        {/* Filters */}
        <Card className="mb-3 sm:mb-4" bodyStyle={{ background: '#1f2937', padding: 12 }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          {/* Основные фильтры */}
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Plantatsiya turi</label>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Tanlang"
                  value={filters.plantation_type}
                  onChange={(value) => handleFilterChange('plantation_type', value)}
                >
                  <Option value="garden">Bog'</Option>
                  <Option value="vineyard">Uzumzor</Option>
                  <Option value="greenhouse">Issiqxona</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Viloyatlar</label>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Viloyatlarni tanlang"
                  value={filters.regions}
                  onChange={(value) => handleFilterChange('regions', value)}
                >
                  {Object.entries(REGION_NAMES).map(([id, name]) => (
                    <Option key={id} value={id}>
                      {name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Bog' barpo etilgan yil</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Yilni tanlang"
                  value={filters.garden_established_year}
                  onChange={(value) => handleFilterChange('garden_established_year', value)}
                  allowClear
                >
                  {years.map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Meva ekilgan yil</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Yilni tanlang"
                  value={filters.planted_year}
                  onChange={(value) => handleFilterChange('planted_year', value)}
                  allowClear
                >
                  {years.map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>
          
          {/* Кнопка расширенных фильтров */}
          <div className="mb-4">
            <Button 
              type="link" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{ color: '#60a5fa', padding: 0 }}
              icon={
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d={showAdvancedFilters ? "M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" : "M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"}/>
                </svg>
              }
            >
              {showAdvancedFilters ? 'Qo\'shimcha filtrlarni yashirish' : 'Qo\'shimcha filtrlar'}
            </Button>
          </div>

          {/* Дополнительные фильтры */}
          {showAdvancedFilters && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
              <div className="mb-2 sm:mb-4">
                  <label className="block mb-2 text-gray-200">Min hosildorlik (bal)</label>
                <Select
                    style={{ width: "100%" }}
                    placeholder="Min balini tanlang"
                    value={filters.min_fertility}
                    onChange={(value) => handleFilterChange('min_fertility', value)}
                  allowClear
                  >
                    {[...Array(10)].map((_, i) => {
                      const value = (i + 1) * 10;
                      return (
                        <Option key={value} value={value}>
                          {value}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div className="mb-2 sm:mb-4">
                  <label className="block mb-2 text-gray-200">Max hosildorlik (bal)</label>
                  <Select
                  style={{ width: "100%" }}
                    placeholder="Max balini tanlang"
                    value={filters.max_fertility}
                    onChange={(value) => handleFilterChange('max_fertility', value)}
                    allowClear
                  >
                    {[...Array(10)].map((_, i) => {
                      const value = (i + 1) * 10;
                      return (
                        <Option key={value} value={value}>
                          {value}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div className="mb-2 sm:mb-4">
                  <label className="block mb-2 text-gray-200">Saralash</label>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Saralash turini tanlang"
                    value={filters.sort_by}
                    onChange={(value) => handleFilterChange('sort_by', value)}
                  >
                    <Option value="plantations">Plantatsiyalar soni</Option>
                    <Option value="area">Umumiy maydon</Option>
                    <Option value="fruitarea">Mevali maydon</Option>
                    <Option value="investment">Investitsiyalar</Option>
                    <Option value="subsidy">Subsidiyalar</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div className="mb-2 sm:mb-4">
                  <label className="block mb-2 text-gray-200">Saralash yo'nalishi</label>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Yo'nalishni tanlang"
                    value={filters.sort_direction}
                    onChange={(value) => handleFilterChange('sort_direction', value)}
                  >
                    <Option value="desc">Kamayish bo'yicha</Option>
                    <Option value="asc">O'sish bo'yicha</Option>
                </Select>
              </div>
            </Col>
          </Row>
          )}
        </Card>

        {/* Summary Cards */}
        <Row gutter={[12, 12]} className="mb-3 sm:mb-4">
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>
                  {(activeTab === 'approved' || activeTab === 'all') ? 'Jami maydon' : 'Jami maydon'}
                </span>}
                value={(activeTab === 'approved' || activeTab === 'all') && approvedTotals ? approvedTotals.total_area : totalRow.total_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>
                  {activeTab === 'approved' ? 'Tasdiqlangan ekilgan maydoni' : 'Ekilgan maydoni'}
                </span>}
                value={(activeTab === 'approved' || activeTab === 'all') && approvedTotals ? 
                  (activeTab === 'approved' ? approvedTotals.total_approved_fruitarea : approvedTotals.total_fruitarea) : 
                  (activeTab === 'approved' ? totalRow.total_approved_fruitarea : totalRow.total_fruitarea)}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>
                  {(activeTab === 'approved' || activeTab === 'all') ? 'Bog\'lar soni' : 'Bog\'lar'}
                </span>}
                value={(activeTab === 'approved' || activeTab === 'all') && approvedTotals ? approvedTotals.bogs_count : totalRow.bogs_count}
                suffix=""
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>
                  {(activeTab === 'approved' || activeTab === 'all') ? 'Uzumzorlar soni' : 'Uzumzorlar'}
                </span>}
                value={(activeTab === 'approved' || activeTab === 'all') && approvedTotals ? approvedTotals.uzumzors_count : totalRow.uzumzors_count}
                suffix=""
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>

        </Row>

        {/* Main Table */}
        <div 
          ref={tableContainerRef}
          className="overflow-x-auto mb-6 mr-4" 
          style={{ 
            borderRadius: '8px',
            padding: '0',
            position: 'relative'
          }}
        >
          
          {/* CSS стили для улучшения скролла */}
          <style jsx>{`
            .overflow-x-auto {
              scrollbar-width: thin;
              scrollbar-color: #6b7280 #374151;
            }
            .overflow-x-auto::-webkit-scrollbar {
              height: 8px;
            }
            .overflow-x-auto::-webkit-scrollbar-track {
              background: #374151;
              border-radius: 4px;
            }
            .overflow-x-auto::-webkit-scrollbar-thumb {
              background: #6b7280;
              border-radius: 4px;
            }
            .overflow-x-auto::-webkit-scrollbar-thumb:hover {
              background: #9ca3af;
            }
          `}</style>
          <Table
            loading={loading}
            columns={columns}
            dataSource={dataWithTotal}
            onChange={(_, __, sorter) => {
              const s = Array.isArray(sorter) ? sorter[0] : sorter;
              const order = s?.order || null;
              const fieldKey = s?.columnKey || null;
              if (!order || !fieldKey) {
                setSortConfig({ field: null, order: 'ascend' });
              } else {
                setSortConfig({ field: fieldKey, order });
              }
            }}
            scroll={{ x: "max-content" }}
            bordered
            size="small"
            pagination={false}
            className="region-statistics-table"
            style={{ 
              background: '#1f2937', 
              color: '#e5e7eb', 
              minWidth: 700
            }}
            rowClassName={(record) => (record.key === 'total' ? 'total-row-dark' : '')}
          />
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default RegionsPage;
