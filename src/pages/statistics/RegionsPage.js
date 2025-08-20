import React, { useState, useEffect, useContext } from "react";
import { Table, Card, Select, Row, Col, Alert, Statistic, Button } from "antd";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1 } from "../../config";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { fetchStatisticsData } from "../../utils/apiUtils";

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

const RegionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    plantation_type: [],
    garden_established_year: null,
    regions: [],
  });
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'approved', 'moderation'
  const [approvedTotals, setApprovedTotals] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  // Читаем фильтры из URL при загрузке страницы
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const estDate = searchParams.get('est_date');
    const plantationType = searchParams.get('plantation_type');
    const regions = searchParams.get('regions');
    
    const newFilters = {
      plantation_type: plantationType ? plantationType.split(',') : [],
      garden_established_year: estDate ? parseInt(estDate) : null,
      regions: regions ? regions.split(',') : [],
    };
    
    setFilters(newFilters);
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let data;
        
        if (activeTab === 'all') {
          // Для всех плантаций используем обычный API статистики
          setApprovedTotals(null);
          let baseUrl = `${API_BASE_URL1}api/statistics/regions/`;
        const queryParams = new URLSearchParams();

        if (filters.garden_established_year) {
          queryParams.append("est_date", filters.garden_established_year);
        }

        if (queryParams.toString()) {
            baseUrl += `?${queryParams.toString()}`;
        }

          data = await fetchStatisticsData(baseUrl, authState.accessToken);
        } else if (activeTab === 'approved') {
          // Для подтвержденных используем специальный API статистики
          const approvedUrl = `${API_BASE_URL1}api/statistics/approved/`;
          
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
                  total_area: regionData.total_area || 0,
                  total_plantations: regionData.count || 0,
                };
              }
            });
          }
          
          // Сохраняем общие данные для итоговой строки
          const totals = {
            total_area: approvedData.total_approved_area || 0,
            total_plantations: approvedData.total_approved_plantations || 0,
            outdated_ga: approvedData.approved_fertility_stats?.low_fertility_area || 0,
            // Данные по типам плантаций из API
            bogs_count: approvedData.approved_by_type?.bogs?.count || 0,
            bogs_area: approvedData.approved_by_type?.bogs?.area || 0,
            uzumzors_count: approvedData.approved_by_type?.uzumzors?.count || 0,
            uzumzors_area: approvedData.approved_by_type?.uzumzors?.area || 0,
            issiqxonas_count: approvedData.approved_by_type?.issiqxonas?.count || 0,
            issiqxonas_area: approvedData.approved_by_type?.issiqxonas?.area || 0,
            // Остальные данные
            investment_local: approvedData.approved_investments?.local || 0,
            investment_foreign: approvedData.approved_investments?.foreign || 0,
            subsidy_count: approvedData.approved_subsidies?.beneficiary_count || 0,
            total_subsidy: approvedData.approved_subsidies?.total_amount || 0
          };
          setApprovedTotals(totals);
        } else {
          // Для остальных случаев очищаем данные
          setApprovedTotals(null);
          data = {};
        }
        
        // Для вкладки "all" получаем количество плантаций из API статистики
        if (activeTab === 'all') {
          try {
            const regionIds = Object.keys(data);
            
            // Создаем массив промисов для параллельных запросов
            const regionPromises = regionIds.map(async (regionId) => {
              try {
                let regionUrl = `${API_BASE_URL1}api/statistics/regions/${regionId}/`;
                const regionQueryParams = new URLSearchParams();
                
                if (filters.garden_established_year) {
                  regionQueryParams.append("est_date", filters.garden_established_year);
                }
                
                if (regionQueryParams.toString()) {
                  regionUrl += `?${regionQueryParams.toString()}`;
                }
                
                const regionData = await fetchStatisticsData(regionUrl, authState.accessToken);
                
                // Суммируем количество плантаций из всех туманов региона
                let totalPlantations = 0;
                if (regionData.data) {
                  Object.values(regionData.data).forEach(districtData => {
                    totalPlantations += districtData.total_plantations || 0;
                  });
                }
                
                return { regionId, totalPlantations };
              } catch (regionError) {
                console.warn(`Не удалось загрузить данные для региона ${regionId}:`, regionError);
                return { regionId, totalPlantations: 0 };
              }
            });
            
            // Ждем выполнения всех запросов параллельно
            const results = await Promise.all(regionPromises);
            
            // Объединяем данные статистики с данными о количестве плантаций
            results.forEach(({ regionId, totalPlantations }) => {
              data[regionId].total_plantations = totalPlantations;
            });
          } catch (plantationsError) {
            console.warn("Не удалось загрузить данные о плантациях:", plantationsError);
          }
        }

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
  }, [filters, authState.accessToken, activeTab]);

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
    investment_local: safeNumber(data.investment?.local),
    investment_foreign: safeNumber(data.investment?.foreign),
    subsidy_count: safeNumber(data.subsidy?.subsidy_count),
    total_subsidy: safeNumber(data.subsidy?.total_subsidy),
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
  
  if (activeTab === 'approved' && approvedTotals) {
    // Для approved статистики используем данные из API
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
          title: "Plantatsiyalar",
          dataIndex: "total_plantations",
          key: "total_plantations",
          sorter: true,
          sortOrder: sortConfig.field === 'total_plantations' ? sortConfig.order : null,
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value)}</span>,
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
          <Button type="primary" danger onClick={() => {
            setFilters({ plantation_type: [], garden_established_year: null, regions: [] });
            setSortConfig({ field: null, order: 'ascend' });
            navigate('/statistics/regions');
          }}>
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
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Plantatsiya turi</label>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Tanlang"
                  value={filters.plantation_type}
                  onChange={(value) =>
                    setFilters({ ...filters, plantation_type: value })
                  }
                >
                  <Option value="garden">Bog'</Option>
                  <Option value="vineyard">Uzumzor</Option>
                  <Option value="greenhouse">Issiqxona</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Bog' barpo etilgan yil</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Yilni tanlang"
                  value={filters.garden_established_year}
                  onChange={(value) =>
                    setFilters({ ...filters, garden_established_year: value })
                  }
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
            <Col xs={24} md={8}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Viloyatlar</label>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Viloyatlarni tanlang"
                  value={filters.regions}
                  onChange={(value) =>
                    setFilters({ ...filters, regions: value })
                  }
                >
                  {Object.entries(REGION_NAMES).map(([id, name]) => (
                    <Option key={id} value={id}>
                      {name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Saralash ustuni</label>
                <Select
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="Ustunni tanlang"
                  value={sortConfig.field}
                  onChange={(value) => setSortConfig((prev) => ({ ...prev, field: value || null }))}
                >
                  <Option value="region">Viloyat</Option>
                  <Option value="total_area">Jami (GA)</Option>
                  <Option value="outdated_ga">Eskirgan (GA)</Option>
                  <Option value="low_fertility_count">Past hosildor – Soni</Option>
                  <Option value="low_fertility_area">Past hosildor – Maydon</Option>
                  <Option value="high_fertility_count">Yuqori hosildor – Soni</Option>
                  <Option value="high_fertility_area">Yuqori hosildor – Maydon</Option>
                  <Option value="irrigation_area">Sug'orish – Maydon</Option>
                  <Option value="irrigation_count">Sug'orish – Soni</Option>
                  <Option value="investment_local">Investitsiyalar – Mahalliy</Option>
                  <Option value="investment_foreign">Investitsiyalar – Xorijiy</Option>
                  <Option value="subsidy_count">Subsidiyalar – Soni</Option>
                  <Option value="total_subsidy">Subsidiyalar – Jami</Option>
                </Select>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Summary Cards */}
        <Row gutter={[12, 12]} className="mb-4 sm:mb-6">
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>
                  {activeTab === 'approved' ? 'Tasdiqlangan maydon' : 'Jami maydon'}
                </span>}
                value={activeTab === 'approved' && approvedTotals ? approvedTotals.total_area : totalRow.total_area}
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
                  {activeTab === 'approved' ? 'Issiqxona soni' : 'Issiqxonalar'}
                </span>}
                value={activeTab === 'approved' && approvedTotals ? approvedTotals.issiqxonas_count : totalRow.issiqxonas_count}
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
                  {activeTab === 'approved' ? 'Bog\'lar soni' : 'Bog\'lar'}
                </span>}
                value={activeTab === 'approved' && approvedTotals ? approvedTotals.bogs_count : totalRow.bogs_count}
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
                  {activeTab === 'approved' ? 'Uzumzorlar soni' : 'Uzumzorlar'}
                </span>}
                value={activeTab === 'approved' && approvedTotals ? approvedTotals.uzumzors_count : totalRow.uzumzors_count}
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
