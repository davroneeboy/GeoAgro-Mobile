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
      low_fertility_count:
        (acc.low_fertility_count || 0) + curr.low_fertility_count,
      low_fertility_area:
        (acc.low_fertility_area || 0) + curr.low_fertility_area,
      high_fertility_count:
        (acc.high_fertility_count || 0) + curr.high_fertility_count,
      high_fertility_area:
        (acc.high_fertility_area || 0) + curr.high_fertility_area,
    }),
    {}
  );

  const columns = [
    {
      title: "F.I.Sh",
      dataIndex: "full_name",
      key: "full_name",
      render: (_, record) =>
        `${record.first_name || ""} ${record.last_name || ""}`,
    },
    {
      title: "Login",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Telefon raqami",
      dataIndex: "phone_number",
      key: "phone",
    },
    {
      title: "Plantatsiyalar",
      children: [
        {
          title: "Umumiy",
          dataIndex: ["plantations_stats", "total"],
          key: "total_plantations",
        },
        {
          title: "Tasdiqlangan",
          dataIndex: ["plantations_stats", "approved"],
          key: "approved_plantations",
        },
        {
          title: "Rad etilgan",
          dataIndex: ["plantations_stats", "rejected"],
          key: "rejected_plantations",
        },
      ],
    },
    {
      title: "KPI",
      children: [
        {
          title: "Ballar",
          dataIndex: ["kpi_current", "points"],
          key: "kpi_points",
          render: (value) => (value || 0).toFixed(1),
        },
        {
          title: "Summa",
          dataIndex: ["kpi_current", "amount"],
          key: "kpi_amount",
          render: (value) => value?.toLocaleString() || 0,
        },
      ],
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

  // Show loading state
  if (loading) {
    console.log("Showing loading state"); // Debug log 8
    return (
      <StatisticsLayout>
        <div className="p-6">
          <Spin size="large" />
        </div>
      </StatisticsLayout>
    );
  }

  console.log("Rendering table with data:", dataWithTotal); // Debug log 10

  return (
    <StatisticsLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Nazoratchilar bo'yicha statistika
          </h1>
          <Button type="primary" danger onClick={handleResetFilters}>
            Filterni tozalash
          </Button>
        </div>

        <Card className="mb-6">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div className="mb-4">
                <label className="block mb-2">Viloyatlar</label>
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
            <Card>
              <Statistic
                title="Jami maydon"
                value={totals.total_area}
                suffix="GA"
                precision={1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Eskirgan maydon"
                value={totals.outdated_ga}
                suffix="GA"
                precision={1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Yuqori hosildor"
                value={totals.high_fertility_area}
                suffix="GA"
                precision={1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Past hosildor"
                value={totals.low_fertility_area}
                suffix="GA"
                precision={1}
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
        />
      </div>
    </StatisticsLayout>
  );
};

export default ControllersPage;
