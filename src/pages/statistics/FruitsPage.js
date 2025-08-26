import React, { useState, useEffect, useContext } from "react";
import { Table, Card, Select, Row, Col, Alert, Statistic, Button } from "antd";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1 } from "../../config";
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

const FruitsPage = () => {
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    regions: [],
  });
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let url = `${API_BASE_URL1}api/statistics/fruits/`;
        const queryParams = new URLSearchParams();

        if (filters.regions.length > 0) {
          queryParams.append("regions", filters.regions.join(","));
        }

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }

        const data = await fetchStatisticsData(url, authState.accessToken);
        setStatistics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, authState.accessToken]);

  const handleResetFilters = () => {
    setFilters({
      regions: [],
    });
    setSortConfig({ field: null, order: 'ascend' });
  };

  // Transform to table rows
  const tableData = Object.entries(statistics || {}).map(([fruit, data]) => ({
    key: fruit,
    fruit,
    total_area: data.total_area || 0,
    outdated_ga: data.outdated_ga || 0,
    low_fertility_count: data.low_fertility?.count || 0,
    low_fertility_area: data.low_fertility?.area || 0,
    high_fertility_count: data.high_fertility?.count || 0,
    high_fertility_area: data.high_fertility?.area || 0,
    avg_fertility_score: data.avg_fertility_score || 0,
    regions: data.regions || {},
  }));

  // Sorted data
  const sortedTableData = React.useMemo(() => {
    if (!sortConfig?.field) return tableData;
    const collator = new Intl.Collator('ru', { sensitivity: 'base' });
    const getVal = (row) => {
      switch (sortConfig.field) {
        case 'fruit':
          return row.fruit || '';
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
        case 'avg_fertility_score':
          return Number(row.avg_fertility_score || 0);
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

  // Calculate totals
  const totals = tableData.reduce(
    (acc, curr) => ({
      total_area: (acc.total_area || 0) + curr.total_area,
      outdated_ga: (acc.outdated_ga || 0) + curr.outdated_ga,
      low_fertility_count: (acc.low_fertility_count || 0) + curr.low_fertility_count,
      low_fertility_area: (acc.low_fertility_area || 0) + curr.low_fertility_area,
      high_fertility_count: (acc.high_fertility_count || 0) + curr.high_fertility_count,
      high_fertility_area: (acc.high_fertility_area || 0) + curr.high_fertility_area,
    }),
    {}
  );

  const columns = [
    {
      title: <span style={{ color: '#e5e7eb' }}>Meva</span>,
      dataIndex: "fruit",
      key: "fruit",
      fixed: "left",
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'fruit' ? sortConfig.order : null,
      render: (text, record) => (
        <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
          {text}
        </span>
      ),
    },
    {
      title: <span style={{ color: '#e5e7eb' }}>Umumiy maydon</span>,
      children: [
        {
          title: <span style={{ color: '#e5e7eb' }}>Jami (GA)</span>,
          dataIndex: "total_area",
          key: "total_area",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'total_area' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: <span style={{ color: '#e5e7eb' }}>Eskirgan (GA)</span>,
          dataIndex: "outdated_ga",
          key: "outdated_ga",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'outdated_ga' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
      ],
    },
    {
      title: <span style={{ color: '#e5e7eb' }}>Hosildorlik</span>,
      children: [
        {
          title: <span style={{ color: '#e5e7eb' }}>Past</span>,
          children: [
            {
              title: <span style={{ color: '#e5e7eb' }}>Soni</span>,
              dataIndex: "low_fertility_count",
              key: "low_fertility_count",
              sorter: true,
              sortDirections: ['ascend','descend'],
              sortOrder: sortConfig.field === 'low_fertility_count' ? sortConfig.order : null,
              render: (value, record) => (
                <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
                  {value}
                </span>
              ),
            },
            {
              title: <span style={{ color: '#e5e7eb' }}>Maydon</span>,
              dataIndex: "low_fertility_area",
              key: "low_fertility_area",
              sorter: true,
              sortDirections: ['ascend','descend'],
              sortOrder: sortConfig.field === 'low_fertility_area' ? sortConfig.order : null,
              render: (value, record) => (
                <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
                  {(value || 0).toFixed(1)}
                </span>
              ),
            },
          ],
        },
        {
          title: <span style={{ color: '#e5e7eb' }}>Yuqori</span>,
          children: [
            {
              title: <span style={{ color: '#e5e7eb' }}>Soni</span>,
              dataIndex: "high_fertility_count",
              key: "high_fertility_count",
              sorter: true,
              sortDirections: ['ascend','descend'],
              sortOrder: sortConfig.field === 'high_fertility_count' ? sortConfig.order : null,
              render: (value, record) => (
                <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
                  {value}
                </span>
              ),
            },
            {
              title: <span style={{ color: '#e5e7eb' }}>Maydon</span>,
              dataIndex: "high_fertility_area",
              key: "high_fertility_area",
              sorter: true,
              sortDirections: ['ascend','descend'],
              sortOrder: sortConfig.field === 'high_fertility_area' ? sortConfig.order : null,
              render: (value, record) => (
                <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
                  {(value || 0).toFixed(1)}
                </span>
              ),
            },
          ],
        },
      ],
    },
    {
      title: <span style={{ color: '#e5e7eb' }}>O'rtacha Hosildorlik</span>,
      dataIndex: "avg_fertility_score",
      key: "avg_fertility_score",
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'avg_fertility_score' ? sortConfig.order : null,
      render: (value, record) => (
        <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
          {record.key === "total" ? '-' : (value || 0).toFixed(1)}
        </span>
      ),
    },
  ];

  // Total row
  const totalRow = {
    key: "total",
    fruit: "Jami",
    ...totals,
    avg_fertility_score: "-",
  };

  const dataWithTotal = [...sortedTableData, totalRow];

  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Mevalar bo'yicha statistika</h1>
          <Button type="primary" danger onClick={handleResetFilters}>
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

        <Card className="mb-4 sm:mb-6" bodyStyle={{ background: '#1f2937', border: '1px solid #374151', padding: 16 }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <Row gutter={[12, 12]}>
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
                  <Option value="fruit">Meva</Option>
                  <Option value="total_area">Jami (GA)</Option>
                  <Option value="outdated_ga">Eskirgan (GA)</Option>
                  <Option value="low_fertility_count">Past hosildor – Soni</Option>
                  <Option value="low_fertility_area">Past hosildor – Maydon</Option>
                  <Option value="high_fertility_count">Yuqori hosildor – Soni</Option>
                  <Option value="high_fertility_area">Yuqori hosildor – Maydon</Option>
                  <Option value="avg_fertility_score">O'rtacha hosildorlik</Option>
                </Select>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Summary Cards */}
        <Row gutter={[12, 12]} className="mb-4 sm:mb-6">
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami maydon</span>}
                value={totals.total_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Eskirgan maydon</span>}
                value={totals.outdated_ga}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Yuqori hosildor</span>}
                value={totals.high_fertility_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Past hosildor</span>}
                value={totals.low_fertility_area}
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
            style={{ background: '#1f2937', color: '#e5e7eb', minWidth: 600 }}
            rowClassName={(record) => record.key === 'total' ? 'total-row' : ''}
          />
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default FruitsPage;
