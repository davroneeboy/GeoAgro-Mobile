import React, { useState, useEffect, useContext, useCallback } from "react";
import { Table, Card, Select, Row, Col, Alert, Statistic, Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1 } from "../../config";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { exportToExcel } from "../../utils/excelExport";


const { Option } = Select;

const REGION_NAMES = {
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

const DISTRICT_TO_REGION_MAPPING = {
  // Tashkent region districts
  1: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 12: 1, 14: 1, 15: 1, 25: 1,
  // Andijan region districts  
  28: 2, 31: 2, 44: 2,
  // Bukhara region districts
  49: 3, 52: 3, 55: 3,
  // Fergana region districts
  58: 4, 59: 4,
  // Jizzakh region districts
  63: 5, 64: 5, 65: 5, 66: 5, 67: 5, 68: 5, 69: 5, 70: 5, 71: 5, 73: 5,
  // Kashkadarya region districts
  104: 6, 106: 6, 108: 6,
  // Navoi region districts
  // Add district IDs for Navoi region
  
  // Namangan region districts
  115: 8, 116: 8,
  // Samarkand region districts
  129: 9,
  // Sirdarya region districts
  // Add district IDs for Sirdarya region
  
  // Surkhandarya region districts
  133: 11, 134: 11, 135: 11, 136: 11,
  // Karakalpakstan region districts
  88: 12, 113: 12,
  // Xorazm region districts
  // Add district IDs for Xorazm region
};

const RegionsPage = () => {
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let data;
        
        if (activeTab === 'all') {
          // Для всех плантаций используем новый API статистики
          setApprovedTotals(null);
          let allUrl = `${API_BASE_URL1}api/statistics/all/`;
          
          // Добавляем параметры фильтрации
        const queryParams = new URLSearchParams();
          
          if (filters.regions && filters.regions.length > 0) {
            queryParams.append("region", filters.regions[0]); // Берем первый регион
          }

        if (filters.garden_established_year) {
          queryParams.append("est_date", filters.garden_established_year);
        }

          if (filters.planted_year) {
            queryParams.append("planted_year", filters.planted_year);
          }

          if (filters.min_fertility) {
            queryParams.append("min_fertility", filters.min_fertility);
          }

          if (filters.max_fertility) {
            queryParams.append("max_fertility", filters.max_fertility);
          }

          if (filters.sort_by !== 'plantations') {
            queryParams.append("sort_by", filters.sort_by);
          }

          if (filters.sort_direction !== 'desc') {
            queryParams.append("sort_direction", filters.sort_direction);
        }

        if (queryParams.toString()) {
            allUrl += `?${queryParams.toString()}`;
          }
          
          const allResponse = await fetch(allUrl, {
            headers: {
              Authorization: `Bearer ${authState.accessToken}`,
            },
          });
          
          if (!allResponse.ok) {
            throw new Error(`HTTP error! status: ${allResponse.status}`);
          }
          
          const allData = await allResponse.json();
          
          console.log("All data from API:", allData);
          console.log("Investments by region:", allData.investments_by_region);
          console.log("Subsidies by region:", allData.subsidies_by_region);
          
          // Преобразуем данные в нужный формат для таблицы
          data = {};
          
          // Создаем массив всех регионов с нулевыми значениями
          const allRegions = {
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

          // Инициализируем все регионы с нулевыми значениями
          Object.keys(allRegions).forEach(regionId => {
            data[regionId] = {
              total_area: 0,
              total_plantations: 0,
              total_fruitarea: 0,
              // Данные по типам плантаций
              bogs_count: 0,
              bogs_area: 0,
              uzumzors_count: 0,
              uzumzors_area: 0,
              issiqxonas_count: 0,
              issiqxonas_area: 0,
              // Остальные данные
              investment_local: 0,
              investment_foreign: 0,
              subsidy_count: 0,
              total_subsidy: 0
            };
          });

          // Заполняем данные для регионов, которые есть в API
          if (allData.by_region) {
            allData.by_region.forEach(regionData => {
              const regionId = regionData.district__region;
              if (data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  total_area: regionData.total_area ?? 0,
                  total_plantations: regionData.count ?? 0,
                  total_fruitarea: regionData.total_fruitarea ?? 0,
                };
              }
            });
          }

          // Если есть данные по типам плантаций по регионам, заполняем их
          if (allData.by_region_types) {
            allData.by_region_types.forEach(regionTypeData => {
              const regionId = regionTypeData.district__region;
              if (data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  bogs_count: regionTypeData.bogs_count ?? 0,
                  bogs_area: regionTypeData.bogs_area ?? 0,
                  uzumzors_count: regionTypeData.uzumzors_count ?? 0,
                  uzumzors_area: regionTypeData.uzumzors_area ?? 0,
                  issiqxonas_count: regionTypeData.issiqxonas_count ?? 0,
                  issiqxonas_area: regionTypeData.issiqxonas_area ?? 0,
                };
              }
            });
          }

          // Если есть данные по инвестициям по регионам, заполняем их
          if (allData.investments_by_region) {
            allData.investments_by_region.forEach(investmentData => {
              const regionId = investmentData.plantation__district__region;
              if (data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  investment_local: investmentData.local ?? 0,
                  investment_foreign: investmentData.foreign ?? 0,
                };
              }
            });
          }

          // Если есть данные по субсидиям по регионам, заполняем их
          if (allData.subsidies_by_region) {
            // Агрегируем субсидии по регионам
            const subsidiesByRegion = {};
            allData.subsidies_by_region.forEach(subsidyData => {
              const districtId = subsidyData.plantation__district__id;
              const regionId = DISTRICT_TO_REGION_MAPPING[districtId];
              
              if (regionId) {
                if (!subsidiesByRegion[regionId]) {
                  subsidiesByRegion[regionId] = {
                    beneficiary_count: 0,
                    total_amount: 0
                  };
                }
                subsidiesByRegion[regionId].beneficiary_count += subsidyData.beneficiary_count ?? 0;
                subsidiesByRegion[regionId].total_amount += subsidyData.total_amount ?? 0;
              }
            });

            // Применяем агрегированные данные к регионам
            Object.entries(subsidiesByRegion).forEach(([regionId, aggregatedData]) => {
              if (data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  subsidy_count: aggregatedData.beneficiary_count,
                  total_subsidy: aggregatedData.total_amount,
                };
              }
            });
          }

          // Добавляем общую статистику
          setApprovedTotals({
            total_plantations: allData.total_plantations ?? 0,
            total_area: allData.total_area ?? 0,
            total_fruitarea: allData.total_fruitarea ?? 0,
            // Данные по типам плантаций
            bogs_count: allData.by_type?.bogs?.count ?? 0,
            bogs_area: allData.by_type?.bogs?.area ?? 0,
            uzumzors_count: allData.by_type?.uzumzors?.count ?? 0,
            uzumzors_area: allData.by_type?.uzumzors?.area ?? 0,
            issiqxonas_count: allData.by_type?.issiqxonas?.count ?? 0,
            issiqxonas_area: allData.by_type?.issiqxonas?.area ?? 0,
            // Статистика модерации
            moderation_status: allData.moderation_status ?? {},
            // Статистика плодородия
            fertility_stats: allData.fertility_stats ?? {},
            // Инвестиции (обновляем структуру)
            investment_local: allData.investments?.local ?? 0,
            investment_foreign: allData.investments?.foreign ?? 0,
            // Субсидии (обновляем структуру)
            subsidy_count: allData.subsidies?.beneficiary_count ?? 0,
            total_subsidy: allData.subsidies?.total_amount ?? 0
          });
        } else if (activeTab === 'approved') {
          // Для подтвержденных используем специальный API статистики
          let approvedUrl = `${API_BASE_URL1}api/statistics/approved/`;
          
          // Добавляем параметры фильтрации
          const queryParams = new URLSearchParams();
          
          if (filters.regions && filters.regions.length > 0) {
            queryParams.append("region", filters.regions[0]); // Берем первый регион
          }

          if (filters.garden_established_year) {
            queryParams.append("est_date", filters.garden_established_year);
          }

          if (filters.planted_year) {
            queryParams.append("planted_year", filters.planted_year);
          }

          if (filters.min_fertility) {
            queryParams.append("min_fertility", filters.min_fertility);
          }

          if (filters.max_fertility) {
            queryParams.append("max_fertility", filters.max_fertility);
          }

          if (filters.sort_by !== 'plantations') {
            queryParams.append("sort_by", filters.sort_by);
          }

          if (filters.sort_direction !== 'desc') {
            queryParams.append("sort_direction", filters.sort_direction);
          }

          if (queryParams.toString()) {
            approvedUrl += `?${queryParams.toString()}`;
          }
          
          const approvedResponse = await fetch(approvedUrl, {
            headers: {
              Authorization: `Bearer ${authState.accessToken}`,
            },
          });
          
          if (!approvedResponse.ok) {
            throw new Error(`HTTP error! status: ${approvedResponse.status}`);
          }
          
          const approvedData = await approvedResponse.json();
          
          // Преобразуем данные в нужный формат
          data = {};
          
          // Создаем массив всех регионов с нулевыми значениями
          const allRegions = {
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

          // Инициализируем все регионы с нулевыми значениями
          Object.keys(allRegions).forEach(regionId => {
            data[regionId] = {
              total_area: 0,
              total_plantations: 0,
              total_approved_fruitarea: 0,
              outdated_ga: 0,
              // Данные по типам плантаций
              bogs_count: 0,
              bogs_area: 0,
              uzumzors_count: 0,
              uzumzors_area: 0,
              issiqxonas_count: 0,
              issiqxonas_area: 0,
              // Остальные данные
              investment_local: 0,
              investment_foreign: 0,
              subsidy_count: 0,
              total_subsidy: 0
            };
          });

          // Заполняем данные для регионов, которые есть в API
          if (approvedData.approved_by_region) {
            approvedData.approved_by_region.forEach(regionData => {
              const regionId = regionData.district__region;
              if (data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  total_area: regionData.total_area ?? 0,
                  total_plantations: regionData.count ?? 0,
                  total_approved_fruitarea: regionData.total_approved_fruitarea ?? 0,
                };
              }
            });
          }

          // Заполняем данные по типам плантаций для каждого региона
          if (approvedData.approved_by_region_types) {
            approvedData.approved_by_region_types.forEach(regionTypeData => {
              const regionId = regionTypeData.district__region;
              if (data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  bogs_count: regionTypeData.bogs_count || 0,
                  bogs_area: regionTypeData.bogs_area || 0,
                  uzumzors_count: regionTypeData.uzumzors_count || 0,
                  uzumzors_area: regionTypeData.uzumzors_area || 0,
                  issiqxonas_count: regionTypeData.issiqxonas_count || 0,
                  issiqxonas_area: regionTypeData.issiqxonas_area || 0,
                };
              }
            });
          }

          // Заполняем данные по инвестициям для каждого региона
          if (approvedData.approved_investments_by_region) {
            approvedData.approved_investments_by_region.forEach(investmentData => {
              const regionId = investmentData.plantation__district__region;
              if (data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  investment_local: investmentData.local ?? 0,
                  investment_foreign: investmentData.foreign ?? 0,
                };
              }
            });
          }

          // Заполняем данные по субсидиям для каждого региона
          if (approvedData.approved_subsidies_by_region) {
            approvedData.approved_subsidies_by_region.forEach(subsidyData => {
              const regionId = subsidyData.plantation__district__region;
              if (data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  subsidy_count: subsidyData.beneficiary_count ?? 0,
                  total_subsidy: subsidyData.total_amount ?? 0,
                };
              }
            });
          }
          
          // Сохраняем общие данные для итоговой строки
          const totals = {
            total_area: approvedData.total_approved_area ?? 0,
            total_plantations: approvedData.total_approved_plantations ?? 0,
            total_approved_fruitarea: approvedData.total_approved_fruitarea ?? 0,
            outdated_ga: approvedData.approved_fertility_stats?.low_fertility_area ?? 0,
            // Данные по типам плантаций из API
            bogs_count: approvedData.approved_by_type?.bogs?.count ?? 0,
            bogs_area: approvedData.approved_by_type?.bogs?.area ?? 0,
            uzumzors_count: approvedData.approved_by_type?.uzumzors?.count ?? 0,
            uzumzors_area: approvedData.approved_by_type?.uzumzors?.area ?? 0,
            issiqxonas_count: approvedData.approved_by_type?.issiqxonas?.count ?? 0,
            issiqxonas_area: approvedData.approved_by_type?.issiqxonas?.area ?? 0,
            // Остальные данные
            investment_local: approvedData.approved_investments?.local ?? 0,
            investment_foreign: approvedData.approved_investments?.foreign ?? 0,
            subsidy_count: approvedData.approved_subsidies?.beneficiary_count ?? 0,
            total_subsidy: approvedData.approved_subsidies?.total_amount ?? 0
          };
          setApprovedTotals(totals);
        } else {
          // Для остальных случаев очищаем данные
          setApprovedTotals(null);
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
      const exportTotals = activeTab === 'approved' ? approvedTotals : {
        total_area: exportData.reduce((sum, row) => sum + (row.total_area || 0), 0),
        total_plantations: exportData.reduce((sum, row) => sum + (row.total_plantations || 0), 0),
        total_fruitarea: exportData.reduce((sum, row) => sum + (row.total_fruitarea || 0), 0),
        outdated_ga: exportData.reduce((sum, row) => sum + (row.outdated_ga || 0), 0),
        total_investment: exportData.reduce((sum, row) => sum + (row.investment_local || 0) + (row.investment_foreign || 0), 0),
        total_subsidy: exportData.reduce((sum, row) => sum + (row.total_subsidy || 0), 0)
      };
      
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

  const tableData = Object.entries(statistics).map(([regionId, data]) => ({
    key: regionId,
    region: REGION_NAMES[regionId],
    total_area: safeNumber(data.total_area),
    total_plantations: safeNumber(data.total_plantations || data.plantations_count || data.count || 0),
    outdated_ga: safeNumber(data.outdated_ga),
    bogs_count: safeNumber(data.bogs_count),
    bogs_area: safeNumber(data.bogs_area),
    uzumzors_count: safeNumber(data.uzumzors_count),
    uzumzors_area: safeNumber(data.uzumzors_area),
    issiqxonas_count: safeNumber(data.issiqxonas_count),
    issiqxonas_area: safeNumber(data.issiqxonas_area),
    investment_local: safeNumber(data.investment_local),
    investment_foreign: safeNumber(data.investment_foreign),
    subsidy_count: safeNumber(data.subsidy_count),
    total_subsidy: safeNumber(data.total_subsidy),
  }));

  const sortedTableData = React.useMemo(() => {
    if (!sortConfig?.field) return tableData;
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
        case 'outdated_ga':
          return Number(row.outdated_ga || 0);
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
    outdated_ga: 0,
    bogs_count: 0,
    bogs_area: 0,
    uzumzors_count: 0,
    uzumzors_area: 0,
    issiqxonas_count: 0,
    issiqxonas_area: 0,
    investment_local: 0,
    investment_foreign: 0,
    subsidy_count: 0,
    total_subsidy: 0,
  };

  let totalRow;
  
  if ((activeTab === 'approved' || activeTab === 'all') && approvedTotals) {
    // Для approved и all статистики используем данные из API
    totalRow = {
      key: "total",
      region: "Jami",
      ...approvedTotals
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
      outdated_ga: acc.outdated_ga + safeNumber(curr.outdated_ga),
        bogs_count: acc.bogs_count + safeNumber(curr.bogs_count),
        bogs_area: acc.bogs_area + safeNumber(curr.bogs_area),
        uzumzors_count: acc.uzumzors_count + safeNumber(curr.uzumzors_count),
        uzumzors_area: acc.uzumzors_area + safeNumber(curr.uzumzors_area),
        issiqxonas_count: acc.issiqxonas_count + safeNumber(curr.issiqxonas_count),
        issiqxonas_area: acc.issiqxonas_area + safeNumber(curr.issiqxonas_area),
      investment_local: acc.investment_local + safeNumber(curr.investment_local),
      investment_foreign: acc.investment_foreign + safeNumber(curr.investment_foreign),
      subsidy_count: acc.subsidy_count + safeNumber(curr.subsidy_count),
      total_subsidy: acc.total_subsidy + safeNumber(curr.total_subsidy),
    }),
    initialTotalRow
  );
  }

  const dataWithTotal = [...sortedTableData, totalRow];

  const columns = [
    {
      title: "Viloyat",
      dataIndex: "region",
      key: "region",
      fixed: "left",
      sorter: true,
      sortOrder: sortConfig.field === 'region' ? sortConfig.order : null,
      onCell: (record) => ({
        onClick: () => {
          if (record.key !== "total") {
            const params = new URLSearchParams();
            if (filters.garden_established_year) {
              params.append("est_date", filters.garden_established_year);
            }
            if (filters.plantation_type.length > 0) {
              params.append("plantation_type", filters.plantation_type.join(","));
            }
            if (filters.regions.length > 0) {
              params.append("regions", filters.regions.join(","));
            }
            // Добавляем информацию о типе данных
            if (activeTab !== 'all') {
              params.append("data_type", activeTab);
            }
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
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Subyektlar",
          dataIndex: "total_plantations",
          key: "total_plantations",
          sorter: true,
          sortOrder: sortConfig.field === 'total_plantations' ? sortConfig.order : null,
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value)}</span>,
        },
        {
          title: activeTab === 'approved' ? "Tasdiqlangan ekilgan maydoni (GA)" : "Ekilgan maydoni (GA)",
          dataIndex: activeTab === 'approved' ? "total_approved_fruitarea" : "total_fruitarea",
          key: activeTab === 'approved' ? "total_approved_fruitarea" : "total_fruitarea",
          sorter: true,
          sortOrder: sortConfig.field === (activeTab === 'approved' ? 'total_approved_fruitarea' : 'total_fruitarea') ? sortConfig.order : null,
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Eskirgan (GA)",
          dataIndex: "outdated_ga",
          key: "outdated_ga",
          sorter: true,
          sortOrder: sortConfig.field === 'outdated_ga' ? sortConfig.order : null,
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
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value)}</span>,
        },
        {
          title: "Maydon (GA)",
          dataIndex: "bogs_area",
          key: "bogs_area",
              sorter: true,
          sortOrder: sortConfig.field === 'bogs_area' ? sortConfig.order : null,
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
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value)}</span>,
        },
        {
          title: "Maydon (GA)",
          dataIndex: "uzumzors_area",
          key: "uzumzors_area",
              sorter: true,
          sortOrder: sortConfig.field === 'uzumzors_area' ? sortConfig.order : null,
              render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
      ],
    },
    {
      title: "Issiqxonalar",
      children: [
        {
          title: "Soni",
          dataIndex: "issiqxonas_count",
          key: "issiqxonas_count",
          sorter: true,
          sortOrder: sortConfig.field === 'issiqxonas_count' ? sortConfig.order : null,
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value)}</span>,
        },
        {
          title: "Maydon (GA)",
          dataIndex: "issiqxonas_area",
          key: "issiqxonas_area",
          sorter: true,
          sortOrder: sortConfig.field === 'issiqxonas_area' ? sortConfig.order : null,
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
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
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toLocaleString()}</span>,
        },
        {
          title: "Xorijiy",
          dataIndex: "investment_foreign",
          key: "investment_foreign",
          sorter: true,
          sortOrder: sortConfig.field === 'investment_foreign' ? sortConfig.order : null,
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
        },
        {
          title: "Jami summa",
          dataIndex: "total_subsidy",
          key: "total_subsidy",
          sorter: true,
          sortOrder: sortConfig.field === 'total_subsidy' ? sortConfig.order : null,
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toLocaleString()}</span>,
        },
      ],
    },
  ];

  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Viloyatlar bo'yicha statistika</h1>
          <Button type="primary" danger           onClick={handleResetFilters}>
            Filterni tozalash
          </Button>
        </div>

        {/* Вкладки для переключения типов данных */}
        <Card className="mb-4 sm:mb-6" bodyStyle={{ background: '#1f2937', padding: 16 }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
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
        <Card className="mb-4 sm:mb-6" bodyStyle={{ background: '#1f2937', padding: 16 }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
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
        <Row gutter={[12, 12]} className="mb-4 sm:mb-6">
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
                  {(activeTab === 'approved' || activeTab === 'all') ? 'Issiqxona soni' : 'Issiqxonalar'}
                </span>}
                value={(activeTab === 'approved' || activeTab === 'all') && approvedTotals ? approvedTotals.issiqxonas_count : totalRow.issiqxonas_count}
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
        <div className="overflow-x-auto">
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
            style={{ background: '#1f2937', color: '#e5e7eb', minWidth: 700 }}
          />
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default RegionsPage;
