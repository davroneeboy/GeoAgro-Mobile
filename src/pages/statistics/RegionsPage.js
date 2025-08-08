import React, { useState, useEffect } from "react";
import { Table, Card, Select, Row, Col, Alert, Statistic, Button } from "antd";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1 } from "../../config";
import { useNavigate } from "react-router-dom";

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

const RegionsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    plantation_type: [],
    garden_established_year: null,
    regions: [],
  });

  // Generate years from 1990 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1989 },
    (_, i) => currentYear - i
  );

  // Fetch statistics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Build URL with query parameters
        let url = `${API_BASE_URL1}api/statistics/regions/`;
        const queryParams = new URLSearchParams();

        // Add est_date filter if year is selected
        if (filters.garden_established_year) {
          queryParams.append("est_date", filters.garden_established_year);
        }

        // Add query parameters to URL if any exist
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();

        // Filter data based on selected regions
        if (filters.regions.length > 0) {
          const filteredData = {};
          filters.regions.forEach((region) => {
            if (data[region]) {
              filteredData[region] = data[region];
            }
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
  }, [filters]); // Effect will run when filters change

  // Transform data for table with safe number handling
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

  // Initialize totalRow with zeros to prevent undefined values
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

  // Calculate totals for summary row with safe addition
  const totalRow = tableData.reduce(
    (acc, curr) => ({
      ...acc,
      total_area: acc.total_area + safeNumber(curr.total_area),
      outdated_ga: acc.outdated_ga + safeNumber(curr.outdated_ga),
      low_fertility_count:
        acc.low_fertility_count + safeNumber(curr.low_fertility_count),
      low_fertility_area:
        acc.low_fertility_area + safeNumber(curr.low_fertility_area),
      high_fertility_count:
        acc.high_fertility_count + safeNumber(curr.high_fertility_count),
      high_fertility_area:
        acc.high_fertility_area + safeNumber(curr.high_fertility_area),
      irrigation_area: acc.irrigation_area + safeNumber(curr.irrigation_area),
      irrigation_count:
        acc.irrigation_count + safeNumber(curr.irrigation_count),
      investment_local:
        acc.investment_local + safeNumber(curr.investment_local),
      investment_foreign:
        acc.investment_foreign + safeNumber(curr.investment_foreign),
      subsidy_count: acc.subsidy_count + safeNumber(curr.subsidy_count),
      total_subsidy: acc.total_subsidy + safeNumber(curr.total_subsidy),
    }),
    initialTotalRow
  );

  // Add total row to table data
  const dataWithTotal = [...tableData, totalRow];

  // Add reset filters function
  const handleResetFilters = () => {
    setFilters({
      plantation_type: [],
      garden_established_year: null,
      regions: [],
    });
  };

  // Add row click handler
  const handleRowClick = (record) => {
    if (record.key !== "total") {
      // Don't navigate for total row
      navigate(`/statistics/regions/${record.key}`);
    }
  };

  const columns = [
    {
      title: "Viloyat",
      dataIndex: "region",
      key: "region",
      fixed: "left",
      onCell: (record) => ({
        onClick: () => handleRowClick(record),
        style: { cursor: record.key !== "total" ? "pointer" : "default", color: '#e5e7eb' },
      }),
    },
    {
      title: "Umumiy maydon",
      children: [
        {
          title: "Jami (GA)",
          dataIndex: "total_area",
          key: "total_area",
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Eskirgan (GA)",
          dataIndex: "outdated_ga",
          key: "outdated_ga",
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
            },
            {
              title: "Maydon",
              dataIndex: "low_fertility_area",
              key: "low_fertility_area",
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
            },
            {
              title: "Maydon",
              dataIndex: "high_fertility_area",
              key: "high_fertility_area",
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
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toFixed(1)}</span>,
        },
        {
          title: "Soni",
          dataIndex: "irrigation_count",
          key: "irrigation_count",
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
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toLocaleString()}</span>,
        },
        {
          title: "Xorijiy",
          dataIndex: "investment_foreign",
          key: "investment_foreign",
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
        },
        {
          title: "Jami summa",
          dataIndex: "total_subsidy",
          key: "total_subsidy",
          render: (value) => <span style={{ color: '#e5e7eb' }}>{safeNumber(value).toLocaleString()}</span>,
        },
      ],
    },
  ];

  return (
    <StatisticsLayout>
      <div className="p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Viloyatlar bo'yicha statistika</h1>
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

        {/* Filters */}
        <Card className="mb-6" bodyStyle={{ background: '#1f2937' }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <Row gutter={16}>
            <Col span={8}>
              <div className="mb-4">
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
            <Col span={8}>
              <div className="mb-4">
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
            <Col span={8}>
              <div className="mb-4">
                <label className="block mb-2 text-gray-2 00">Viloyatlar</label>
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
                title={<span style={{ color: '#9ca3af' }}>Jami maydon</span>}
                value={totalRow.total_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Eskirgan maydon</span>}
                value={totalRow.outdated_ga}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami investitsiyalar</span>}
                value={totalRow.investment_local + totalRow.investment_foreign}
                precision={0}
                formatter={(value) => `${value.toLocaleString()} UZS`}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami subsidiyalar</span>}
                value={totalRow.total_subsidy}
                precision={0}
                formatter={(value) => `${value.toLocaleString()} UZS`}
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

export default RegionsPage;
