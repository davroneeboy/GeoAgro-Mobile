import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Select,
  Row,
  Col,
  Spin,
  Alert,
  Statistic,
  Button,
} from "antd";
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

const ControllersPage = () => {
  console.log("ControllersPage component rendered"); // Debug log 1

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    regions: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data..."); // Debug log 2
      console.log("API URL:", `${API_BASE_URL1}api/statistics/users/detailed/`); // Debug log 3

      try {
        setLoading(true);
        let url = `${API_BASE_URL1}api/statistics/users/detailed/`;
        const queryParams = new URLSearchParams();

        if (filters.regions.length > 0) {
          queryParams.append("regions", filters.regions.join(","));
        }

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }

        const response = await fetch(url);

        console.log("Response status:", response.status); // Debug log 4

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received data:", data); // Debug log 5

        setStatistics(data);
      } catch (err) {
        console.error("Error details:", err); // Debug log 6
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  console.log("Current state:", { loading, error, statistics }); // Debug log 7

  const handleResetFilters = () => {
    setFilters({
      regions: [],
    });
  };

  if (error) return <Alert message={error} type="error" />;

  // API возвращает массив пользователей; соберём строки таблицы напрямую
  const tableData = (Array.isArray(statistics) ? statistics : []).map((user, idx) => ({
    key: user.id ?? idx,
    ...user,
  }));

  // Итоги по plantatsiyalar и KPI
  const totals = tableData.reduce(
    (acc, curr) => {
      const p = curr.plantations_stats || {};
      const k = curr.kpi_current || {};
      return {
        total: acc.total + (p.total || 0),
        approved: acc.approved + (p.approved || 0),
        rejected: acc.rejected + (p.rejected || 0),
        kpiPoints: acc.kpiPoints + (k.points || 0),
        kpiAmount: acc.kpiAmount + (k.amount || 0),
      };
    },
    { total: 0, approved: 0, rejected: 0, kpiPoints: 0, kpiAmount: 0 }
  );

  const textLight = { color: '#e5e7eb' };

  const columns = [
    {
      title: <span style={textLight}>F.I.Sh</span>,
      dataIndex: "full_name",
      key: "full_name",
      render: (_value, record) => (
        <span style={textLight}>{`${record.first_name || ""} ${record.last_name || ""}`}</span>
      ),
    },
    {
      title: <span style={textLight}>Login</span>,
      dataIndex: "username",
      key: "username",
      render: (value) => <span style={textLight}>{value}</span>,
    },
    {
      title: <span style={textLight}>Telefon raqami</span>,
      dataIndex: "phone_number",
      key: "phone",
      render: (value) => <span style={textLight}>{value}</span>,
    },
    {
      title: <span style={textLight}>Plantatsiyalar</span>,
      children: [
        {
          title: <span style={textLight}>Umumiy</span>,
          dataIndex: ["plantations_stats", "total"],
          key: "total_plantations",
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Tasdiqlangan</span>,
          dataIndex: ["plantations_stats", "approved"],
          key: "approved_plantations",
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Rad etilgan</span>,
          dataIndex: ["plantations_stats", "rejected"],
          key: "rejected_plantations",
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
      ],
    },
    {
      title: <span style={textLight}>KPI</span>,
      children: [
        {
          title: <span style={textLight}>Ballar</span>,
          dataIndex: ["kpi_current", "points"],
          key: "kpi_points",
          render: (value) => <span style={textLight}>{(value || 0).toFixed(1)}</span>,
        },
        {
          title: <span style={textLight}>Summa</span>,
          dataIndex: ["kpi_current", "amount"],
          key: "kpi_amount",
          render: (value) => (
            <span style={textLight}>{value?.toLocaleString() || 0}</span>
          ),
        },
      ],
    },
  ];

  // Итоговая строка таблицы
  const totalRow = {
    key: "total",
    username: "Jami",
    plantations_stats: {
      total: totals.total,
      approved: totals.approved,
      rejected: totals.rejected,
    },
    kpi_current: {
      points: totals.kpiPoints,
      amount: totals.kpiAmount,
    },
  };

  const dataWithTotal = [...tableData, totalRow];

  // Show loading state
  if (loading) {
    console.log("Showing loading state"); // Debug log 8
    return (
      <StatisticsLayout>
        <div className="p-6" style={{ background: '#111827', minHeight: '100vh' }}>
          <Spin size="large" />
        </div>
      </StatisticsLayout>
    );
  }

  console.log("Rendering table with data:", dataWithTotal); // Debug log 10

  return (
    <StatisticsLayout>
      <div className="p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            Nazoratchilar bo'yicha statistika
          </h1>
          <Button type="primary" danger onClick={handleResetFilters}>
            Filterni tozalash
          </Button>
        </div>

        <Card className="mb-6" bodyStyle={{ background: '#1f2937' }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
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
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami plantatsiyalar</span>}
                value={totals.total}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Tasdiqlangan</span>}
                value={totals.approved}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Rad etilgan</span>}
                value={totals.rejected}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>KPI (summa)</span>}
                value={totals.kpiAmount}
                precision={0}
                formatter={(value) => `${Number(value).toLocaleString()} UZS`}
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

export default ControllersPage;
