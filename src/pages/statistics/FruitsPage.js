import React, { useState, useEffect } from "react";
import { Table, Card, Select, Row, Col, Alert, Statistic, Button } from "antd";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1 } from "../../config";

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
};

const FruitsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    regions: [],
  });

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

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        setStatistics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      regions: [],
    });
  };

  if (error) return <Alert message={error} type="error" />;

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
      render: (value, record) => (
        <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
          {record.key === "total" ? '-' : (value || 0).toFixed(1)}
        </span>
      ),
    },
  ];

  // Add total row
  const totalRow = {
    key: "total",
    fruit: "Jami",
    ...totals,
    avg_fertility_score: "-",
  };

  const dataWithTotal = [...tableData, totalRow];

  return (
    <StatisticsLayout>
      <div className="p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Mevalar bo'yicha statistika</h1>
          <Button type="primary" danger onClick={handleResetFilters}>
            Filterni tozalash
          </Button>
        </div>

        <Card className="mb-6" bodyStyle={{ background: '#1f2937', border: '1px solid #374151' }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div className="mb-4">
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
          </Row>
        </Card>

        {/* Summary Cards */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami maydon</span>}
                value={totals.total_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Eskirgan maydon</span>}
                value={totals.outdated_ga}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Yuqori hosildor</span>}
                value={totals.high_fertility_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
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
        <Table
          loading={loading}
          columns={columns}
          dataSource={dataWithTotal}
          scroll={{ x: "max-content" }}
          bordered
          size="middle"
          pagination={false}
          className="region-statistics-table"
          style={{ background: '#1f2937', color: '#e5e7eb' }}
        />
      </div>
    </StatisticsLayout>
  );
};

export default FruitsPage;
