import React, { useState, useEffect, useContext, useCallback } from "react";
import { Table, Card, Select, Row, Col, Alert, Statistic, Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { 
  fetchRegionsStatistics, 
  fetchRegionApprovedStatistics
} from "../../api/api";
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
          // Для всех плантаций используем новый API статистики регионов
          setApprovedTotals(null);
          
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

          // Загружаем данные через новый API
          const allData = await fetchRegionsStatistics(params, authState.accessToken);
          
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

          // Заполняем данные для регионов из by_region_with_planted_area
          if (allData.by_region_with_planted_area) {
            console.log('Processing by_region_with_planted_area:', allData.by_region_with_planted_area);
            console.log('Available region IDs in data:', Object.keys(data));
            allData.by_region_with_planted_area.forEach(regionData => {
              const regionId = regionData.plantation__district__region?.toString();
              console.log(`Processing region ${regionId} with planted_area ${regionData.planted_area}`);
              if (regionId) {
                // Создаем запись для региона, если её нет
                if (!data[regionId]) {
                  data[regionId] = {
                    region: REGION_NAMES[regionId] || `Region ${regionId}`,
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
                    investment_local: 0,
                    investment_foreign: 0,
                    subsidy_count: 0,
                    total_subsidy: 0
                  };
                }
                
                data[regionId] = {
                  ...data[regionId],
                  total_area: regionData.total_area ?? 0,
                  total_plantations: regionData.count ?? 0,
                  total_fruitarea: regionData.planted_area ?? 0,
                };
                console.log(`Region ${regionId}: total_fruitarea = ${regionData.planted_area}`);
              }
            });
          }

          // Заполняем данные по типам плантаций из by_region_types
          if (allData.by_region_types) {
            allData.by_region_types.forEach(regionData => {
              const regionId = regionData.district__region?.toString();
              if (regionId && data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  bogs_count: regionData.bogs_count ?? 0,
                  bogs_area: regionData.bogs_area ?? 0,
                  uzumzors_count: regionData.uzumzors_count ?? 0,
                  uzumzors_area: regionData.uzumzors_area ?? 0,
                  issiqxonas_count: regionData.issiqxonas_count ?? 0,
                  issiqxonas_area: regionData.issiqxonas_area ?? 0,
                };
              }
            });
          }

          // Заполняем данные по инвестициям из investments_by_region
          if (allData.investments_by_region) {
            allData.investments_by_region.forEach(regionData => {
              const regionId = regionData.plantation__district__region?.toString();
              if (regionId && data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  investment_local: regionData.local ?? 0,
                  investment_foreign: regionData.foreign ?? 0,
                };
              }
            });
          }

          // Заполняем данные по субсидиям из subsidies_by_region
          if (allData.subsidies_by_region) {
            allData.subsidies_by_region.forEach(regionData => {
              const regionId = regionData.plantation__district__region?.toString();
              if (regionId && data[regionId]) {
                data[regionId] = {
                  ...data[regionId],
                  subsidy_count: regionData.beneficiary_count ?? 0,
                  total_subsidy: regionData.total_amount ?? 0,
                };
              }
            });
          }

          // Добавляем общую статистику из корневых полей
          const totalStats = {
            total_plantations: allData.total_plantations ?? 0,
            total_area: allData.total_area ?? 0,
            total_fruitarea: allData.planted_area ?? allData.total_fruitarea ?? 0, // Используем planted_area если есть
            investment_local: allData.investments?.local ?? 0,
            investment_foreign: allData.investments?.foreign ?? 0,
            subsidy_count: allData.subsidies?.beneficiary_count ?? 0,
            total_subsidy: allData.subsidies?.total_amount ?? 0,
            low_fertility_count: 0,
            low_fertility_area: allData.fertility_stats?.low_fertility_area ?? 0,
            high_fertility_count: 0,
            high_fertility_area: allData.fertility_stats?.high_fertility_area ?? 0,
            irrigation_count: 0,
            irrigation_area: 0,
            // Суммируем данные по типам плантаций из by_region_types
            bogs_count: allData.by_region_types?.reduce((sum, region) => sum + (region.bogs_count ?? 0), 0) ?? 0,
            bogs_area: allData.by_region_types?.reduce((sum, region) => sum + (region.bogs_area ?? 0), 0) ?? 0,
            uzumzors_count: allData.by_region_types?.reduce((sum, region) => sum + (region.uzumzors_count ?? 0), 0) ?? 0,
            uzumzors_area: allData.by_region_types?.reduce((sum, region) => sum + (region.uzumzors_area ?? 0), 0) ?? 0,
            issiqxonas_count: allData.by_region_types?.reduce((sum, region) => sum + (region.issiqxonas_count ?? 0), 0) ?? 0,
            issiqxonas_area: allData.by_region_types?.reduce((sum, region) => sum + (region.issiqxonas_area ?? 0), 0) ?? 0,
          };
          
          // Суммируем planted_area по регионам для проверки
          let totalPlantedArea = 0;
          if (allData.by_region_with_planted_area) {
            totalPlantedArea = allData.by_region_with_planted_area.reduce((sum, region) => {
              return sum + (region.planted_area ?? 0);
            }, 0);
          }
          console.log('Sum of planted_area by regions:', totalPlantedArea);
          
          console.log('Total stats from API:', {
            total_plantations: allData.total_plantations,
            total_area: allData.total_area,
            total_fruitarea: allData.total_fruitarea,
            planted_area: allData.planted_area
          });

          console.log('Final processed data:', data);
          console.log('Setting statistics state with:', data);
          setStatistics(data);
          setApprovedTotals(totalStats);
        } else if (activeTab === 'approved') {
          // Для подтвержденных используем новый API статистики одобренных плантаций
          
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

          // Загружаем данные для всех регионов сразу
          const approvedData = await fetchRegionApprovedStatistics(null, params, authState.accessToken);
          console.log('Approved data from API:', approvedData);
          console.log('Approved data keys:', Object.keys(approvedData));
          console.log('by_region_with_planted_area exists:', !!approvedData.by_region_with_planted_area);
          console.log('by_region_with_planted_area length:', approvedData.by_region_with_planted_area?.length);
          
          // Преобразуем данные в нужный формат (используем ту же структуру, что и для 'all')
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
              region: allRegions[regionId],
              total_area: 0,
              total_plantations: 0,
              total_fruitarea: 0,
              total_approved_fruitarea: 0,
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

          // Заполняем данные для регионов из by_region_with_planted_area
          if (approvedData.by_region_with_planted_area) {
            console.log('Processing approved by_region_with_planted_area:', approvedData.by_region_with_planted_area);
            approvedData.by_region_with_planted_area.forEach(regionData => {
              const regionId = regionData.plantation__district__region?.toString();
              console.log(`Processing region ${regionId} with planted_area ${regionData.planted_area}`);
              if (regionId) {
                // Создаем запись для региона, если её нет
                if (!data[regionId]) {
                  data[regionId] = {
                    region: allRegions[regionId] || `Region ${regionId}`,
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
                    investment_local: 0,
                    investment_foreign: 0,
                    subsidy_count: 0,
                    total_subsidy: 0
                  };
                }
                
                data[regionId] = {
                  ...data[regionId],
                  total_area: regionData.total_area ?? 0,
                  total_plantations: regionData.count ?? 0,
                  total_approved_fruitarea: regionData.planted_area ?? 0,
                };
                console.log(`Approved Region ${regionId}: total_approved_fruitarea = ${regionData.planted_area}`);
                console.log(`Updated data for region ${regionId}:`, data[regionId]);
              }
            });
          }

          // Заполняем данные по типам плантаций из by_region_types
          if (approvedData.by_region_types) {
            approvedData.by_region_types.forEach(regionData => {
              const regionId = regionData.district__region?.toString();
              if (regionId) {
                // Создаем запись для региона, если её нет
                if (!data[regionId]) {
                  data[regionId] = {
                    region: allRegions[regionId] || `Region ${regionId}`,
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
                    investment_local: 0,
                    investment_foreign: 0,
                    subsidy_count: 0,
                    total_subsidy: 0
                  };
                }
                
                data[regionId] = {
                  ...data[regionId],
                  bogs_count: regionData.bogs_count ?? 0,
                  bogs_area: regionData.bogs_area ?? 0,
                  uzumzors_count: regionData.uzumzors_count ?? 0,
                  uzumzors_area: regionData.uzumzors_area ?? 0,
                  issiqxonas_count: regionData.issiqxonas_count ?? 0,
                  issiqxonas_area: regionData.issiqxonas_area ?? 0,
                };
              }
            });
          }

          // Заполняем данные по инвестициям из investments_by_region
          if (approvedData.investments_by_region) {
            approvedData.investments_by_region.forEach(regionData => {
              const regionId = regionData.plantation__district__region?.toString();
              if (regionId) {
                // Создаем запись для региона, если её нет
                if (!data[regionId]) {
                  data[regionId] = {
                    region: allRegions[regionId] || `Region ${regionId}`,
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
                    investment_local: 0,
                    investment_foreign: 0,
                    subsidy_count: 0,
                    total_subsidy: 0
                  };
                }
                
                data[regionId] = {
                  ...data[regionId],
                  investment_local: regionData.local ?? 0,
                  investment_foreign: regionData.foreign ?? 0,
                };
              }
            });
          }

          // Заполняем данные по субсидиям из subsidies_by_region
          if (approvedData.subsidies_by_region) {
            approvedData.subsidies_by_region.forEach(regionData => {
              const regionId = regionData.plantation__district__region?.toString();
              if (regionId) {
                // Создаем запись для региона, если её нет
                if (!data[regionId]) {
                  data[regionId] = {
                    region: allRegions[regionId] || `Region ${regionId}`,
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
                    investment_local: 0,
                    investment_foreign: 0,
                    subsidy_count: 0,
                    total_subsidy: 0
                  };
                }
                
                data[regionId] = {
                  ...data[regionId],
                  subsidy_count: regionData.beneficiary_count ?? 0,
                  total_subsidy: regionData.total_amount ?? 0,
                };
              }
            });
          }

          // Добавляем общую статистику из корневых полей
          const totalStats = {
            total_plantations: approvedData.total_plantations ?? 0,
            total_area: approvedData.total_area ?? 0,
            total_approved_fruitarea: approvedData.planted_area ?? approvedData.total_fruitarea ?? 0,
            investment_local: approvedData.investments?.local ?? 0,
            investment_foreign: approvedData.investments?.foreign ?? 0,
            subsidy_count: approvedData.subsidies?.beneficiary_count ?? 0,
            total_subsidy: approvedData.subsidies?.total_amount ?? 0,
            low_fertility_count: 0,
            low_fertility_area: approvedData.fertility_stats?.low_fertility_area ?? 0,
            high_fertility_count: 0,
            high_fertility_area: approvedData.fertility_stats?.high_fertility_area ?? 0,
            irrigation_count: 0,
            irrigation_area: 0,
            // Суммируем данные по типам плантаций из by_region_types
            bogs_count: approvedData.by_region_types?.reduce((sum, region) => sum + (region.bogs_count ?? 0), 0) ?? 0,
            bogs_area: approvedData.by_region_types?.reduce((sum, region) => sum + (region.bogs_area ?? 0), 0) ?? 0,
            uzumzors_count: approvedData.by_region_types?.reduce((sum, region) => sum + (region.uzumzors_count ?? 0), 0) ?? 0,
            uzumzors_area: approvedData.by_region_types?.reduce((sum, region) => sum + (region.uzumzors_area ?? 0), 0) ?? 0,
            issiqxonas_count: approvedData.by_region_types?.reduce((sum, region) => sum + (region.issiqxonas_count ?? 0), 0) ?? 0,
            issiqxonas_area: approvedData.by_region_types?.reduce((sum, region) => sum + (region.issiqxonas_area ?? 0), 0) ?? 0,
          };
          
          console.log('Approved total stats:', totalStats);
          console.log('Setting approved statistics state with:', data);
          console.log('Data keys after processing:', Object.keys(data));
          console.log('Data entries after processing:', Object.entries(data));
          setStatistics(data);
          setApprovedTotals(totalStats);
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

  console.log('Current statistics state:', statistics);
  console.log('Active tab:', activeTab);
  console.log('Statistics entries:', Object.entries(statistics));
  const tableData = Object.entries(statistics).map(([regionId, data]) => {
    console.log(`Table data for region ${regionId}:`, data);
    return {
    key: regionId,
    region: REGION_NAMES[regionId],
    total_area: safeNumber(data.total_area),
      total_plantations: safeNumber(data.total_plantations || data.plantations_count || data.count || 0),
      total_fruitarea: activeTab === 'approved' ? safeNumber(data.total_approved_fruitarea) : safeNumber(data.total_fruitarea || data.total_approved_fruitarea),
      total_approved_fruitarea: safeNumber(data.total_approved_fruitarea),
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
    };
  });

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
    console.log('Total row for', activeTab, ':', totalRow);
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
      <div className="p-4 sm:p-6 pb-8" style={{ background: '#111827', minHeight: '100vh' }}>
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
        <div className="overflow-x-auto mb-6 mr-4" style={{ 
          borderRadius: '8px',
          padding: '0'
        }}>
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
          />
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default RegionsPage;
