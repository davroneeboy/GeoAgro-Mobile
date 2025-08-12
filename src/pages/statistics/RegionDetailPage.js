import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Card, Row, Col, Spin, Alert, Statistic, Button } from "antd";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1 } from "../../config";
import { ArrowLeftOutlined } from "@ant-design/icons";

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

const RegionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL1}api/statistics/regions/${id}/`
        );
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
  }, [id]);

  if (loading) return <Spin size="large" />;
  if (error) return <Alert message={error} type="error" />;
  if (!statistics) return <Alert message="Ma'lumot topilmadi" type="info" />;

  // Transform data for table
  const tableData = Object.entries(statistics.data || {}).map(
    ([district, data]) => ({
      key: district,
      district,
      total_area: data.total_area,
      total_plantations: data.total_plantations,
      outdated_ga: data.outdated_ga,
      low_fertility_count: data.low_fertility.count,
      low_fertility_area: data.low_fertility.area,
      high_fertility_count: data.high_fertility.count,
      high_fertility_area: data.high_fertility.area,
      irrigation_area: data.irrigation.area,
      irrigation_count: data.irrigation.count,
      investment_local: data.investment.local,
      investment_foreign: data.investment.foreign,
      investment_total: data.investment.total,
      subsidy_count: data.subsidy.subsidy_count,
      total_subsidy: data.subsidy.total_subsidy,
    })
  );

  // Calculate totals for summary cards
  const totals = Object.values(statistics.data || {}).reduce(
    (acc, curr) => ({
      total_area: (acc.total_area || 0) + curr.total_area,
      total_plantations: (acc.total_plantations || 0) + curr.total_plantations,
      outdated_ga: (acc.outdated_ga || 0) + curr.outdated_ga,
      total_investment: (acc.total_investment || 0) + curr.investment.total,
      total_subsidy: (acc.total_subsidy || 0) + curr.subsidy.total_subsidy,
    }),
    {}
  );

  // Add total row
  const totalRow = {
    key: "total",
    district: "Jami",
    total_area: totals.total_area,
    total_plantations: totals.total_plantations,
    outdated_ga: totals.outdated_ga,
    low_fertility_count: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.low_fertility.count,
      0
    ),
    low_fertility_area: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.low_fertility.area,
      0
    ),
    high_fertility_count: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.high_fertility.count,
      0
    ),
    high_fertility_area: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.high_fertility.area,
      0
    ),
    irrigation_area: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.irrigation.area,
      0
    ),
    irrigation_count: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.irrigation.count,
      0
    ),
    investment_local: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.investment.local,
      0
    ),
    investment_foreign: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.investment.foreign,
      0
    ),
    investment_total: totals.total_investment,
    subsidy_count: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.subsidy.subsidy_count,
      0
    ),
    total_subsidy: totals.total_subsidy,
  };

  // Add total row to tableData
  const dataWithTotal = [...tableData, totalRow];

  const textLight = { color: '#e5e7eb' };

  const columns = [
    {
      title: <span style={textLight}>Tuman</span>,
      dataIndex: "district",
      key: "district",
      fixed: "left",
      width: 150,
      render: (text, record) => (
        <span
          style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}
        >
          {text}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Umumiy maydon</span>,
      children: [
        {
          title: <span style={textLight}>Jami (GA)</span>,
          dataIndex: "total_area",
          key: "total_area",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Plantatsiyalar soni</span>,
          dataIndex: "total_plantations",
          key: "total_plantations",
          render: (value) => <span style={textLight}>{value}</span>,
        },
        {
          title: <span style={textLight}>Eskirgan (GA)</span>,
          dataIndex: "outdated_ga",
          key: "outdated_ga",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
      ],
    },
    {
      title: <span style={textLight}>Hosildorlik</span>,
      children: [
        {
          title: <span style={textLight}>Past</span>,
          children: [
            {
              title: <span style={textLight}>Soni</span>,
              dataIndex: "low_fertility_count",
              key: "low_fertility_count",
              render: (value) => <span style={textLight}>{value}</span>,
            },
            {
              title: <span style={textLight}>Maydon</span>,
              dataIndex: "low_fertility_area",
              key: "low_fertility_area",
              render: (value, record) => (
                <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
                  {(value || 0).toFixed(1)}
                </span>
              ),
            },
          ],
        },
        {
          title: <span style={textLight}>Yuqori</span>,
          children: [
            {
              title: <span style={textLight}>Soni</span>,
              dataIndex: "high_fertility_count",
              key: "high_fertility_count",
              render: (value) => <span style={textLight}>{value}</span>,
            },
            {
              title: <span style={textLight}>Maydon</span>,
              dataIndex: "high_fertility_area",
              key: "high_fertility_area",
              render: (value, record) => (
                <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
                  {(value || 0).toFixed(1)}
                </span>
              ),
            },
          ],
        },
      ],
    },
    {
      title: <span style={textLight}>Sug'orish</span>,
      children: [
        {
          title: <span style={textLight}>Maydon</span>,
          dataIndex: "irrigation_area",
          key: "irrigation_area",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Soni</span>,
          dataIndex: "irrigation_count",
          key: "irrigation_count",
          render: (value) => <span style={textLight}>{value}</span>,
        },
      ],
    },
    {
      title: <span style={textLight}>Investitsiyalar</span>,
      children: [
        {
          title: <span style={textLight}>Mahalliy</span>,
          dataIndex: "investment_local",
          key: "investment_local",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Xorijiy</span>,
          dataIndex: "investment_foreign",
          key: "investment_foreign",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Jami</span>,
          dataIndex: "investment_total",
          key: "investment_total",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
      ],
    },
    {
      title: <span style={textLight}>Subsidiyalar</span>,
      children: [
        {
          title: <span style={textLight}>Soni</span>,
          dataIndex: "subsidy_count",
          key: "subsidy_count",
          render: (value) => <span style={textLight}>{value}</span>,
        },
        {
          title: <span style={textLight}>Jami summa</span>,
          dataIndex: "total_subsidy",
          key: "total_subsidy",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
      ],
    },
  ];

  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex items-center mb-4 sm:mb-6">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/statistics/regions")}
          >
            Orqaga
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold ml-2 sm:ml-4 text-white">
            {REGION_NAMES[id]} viloyati statistikasi
          </h1>
        </div>

        {/* Summary Cards */}
        <Row gutter={[12, 12]} className="mb-4 sm:mb-6">
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
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
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Plantatsiyalar soni</span>}
                value={totals.total_plantations}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami investitsiyalar</span>}
                value={totals.total_investment}
                precision={0}
                formatter={(value) => `${Number(value).toLocaleString()} UZS`}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami subsidiyalar</span>}
                value={totals.total_subsidy}
                precision={0}
                formatter={(value) => `${Number(value).toLocaleString()} UZS`}
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
          scroll={{ x: "max-content" }}
          bordered
            size="small"
          pagination={false}
          className="region-statistics-table"
            style={{ background: '#1f2937', color: '#e5e7eb', minWidth: 600 }}
        />
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default RegionDetailPage;
