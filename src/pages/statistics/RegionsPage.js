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
        let url = `${API_BASE_URL1}api/statistics/regions/`;
        const queryParams = new URLSearchParams();

        if (filters.garden_established_year) {
          queryParams.append("est_date", filters.garden_established_year);
        }

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }

        const data = await fetchStatisticsData(url, authState.accessToken);

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
  }, [filters, authState.accessToken]);

  const safeNumber = (value) => (typeof value === "number" ? value : 0);

  const tableData = Object.entries(statistics).map(([regionId, data]) => ({
    key: regionId,
    region: REGION_NAMES[regionId],
    total_area: safeNumber(data.total_area),
    outdated_ga: safeNumber(data.outdated_ga),
    low_fertility_count: safeNumber(data.low_fertility?.count),
    low_fertility_area: safeNumber(data.low_fertility?.area),
    high_fertility_count: safeNumber(data.high_fertility?.count),
    high_fertility_area: safeNumber(data.high_fertility?.area),
    irrigation_area: safeNumber(data.irrigation?.area),
    irrigation_count: safeNumber(data.irrigation?.count),
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

  const totalRow = tableData.reduce(
    (acc, curr) => ({
      ...acc,
      total_area: acc.total_area + safeNumber(curr.total_area),
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
      title: "Hosildorlik",
      children: [
        {
          title: "Past",
          children: [
            {
              title: "Soni",
              dataIndex: "low_fertility_count",
              key: "low_fertility_count",
              sorter: true,
              sortOrder: sortConfig.field === 'low_fertility_count' ? sortConfig.order : null,
            },
            {
              title: "Maydon",
              dataIndex: "low_fertility_area",
              key: "low_fertility_area",
              sorter: true,
              sortOrder: sortConfig.field === 'low_fertility_area' ? sortConfig.order : null,
              render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
            },
          ],
        },
        {
          title: "Yuqori",
          children: [
            {
              title: "Soni",
              dataIndex: "high_fertility_count",
              key: "high_fertility_count",
              sorter: true,
              sortOrder: sortConfig.field === 'high_fertility_count' ? sortConfig.order : null,
            },
            {
              title: "Maydon",
              dataIndex: "high_fertility_area",
              key: "high_fertility_area",
              sorter: true,
              sortOrder: sortConfig.field === 'high_fertility_area' ? sortConfig.order : null,
              render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
            },
          ],
        },
      ],
    },
    {
      title: "Sug'orish",
      children: [
        {
          title: "Maydon",
          dataIndex: "irrigation_area",
          key: "irrigation_area",
          sorter: true,
          sortOrder: sortConfig.field === 'irrigation_area' ? sortConfig.order : null,
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Soni",
          dataIndex: "irrigation_count",
          key: "irrigation_count",
          sorter: true,
          sortOrder: sortConfig.field === 'irrigation_count' ? sortConfig.order : null,
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
                title={<span style={{ color: '#9ca3af' }}>Jami maydon</span>}
                value={totalRow.total_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Eskirgan maydon</span>}
                value={totalRow.outdated_ga}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Hosildor (yuqori)</span>}
                value={totalRow.high_fertility_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Hosildor (past)</span>}
                value={totalRow.low_fertility_area}
                suffix="GA"
                precision={1}
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
