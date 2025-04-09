import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Card, Select, Row, Col, Spin, Alert, Statistic, Button } from 'antd';
import StatisticsLayout from '../../layouts/StatisticsLayout';
import { API_BASE_URL1 } from "../../config";
import { ArrowLeftOutlined } from '@ant-design/icons';

const REGION_NAMES = {
  1: 'Tashkent',
  2: 'Andijan',
  3: 'Bukhara',
  4: 'Fergana',
  5: 'Jizzakh',
  6: 'Kashkadarya',
  7: 'Navoi',
  8: 'Namangan',
  9: 'Samarkand',
  10: 'Sirdarya',
  11: 'Surkhandarya',
  12: 'Karakalpakstan',
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
        const response = await fetch(`${API_BASE_URL1}api/statistics/regions/${id}/`);
        if (!response.ok) throw new Error('Failed to fetch data');
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
  const tableData = Object.entries(statistics.data || {}).map(([district, data]) => ({
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
  }));

  // Calculate totals for summary cards
  const totals = Object.values(statistics.data || {}).reduce((acc, curr) => ({
    total_area: (acc.total_area || 0) + curr.total_area,
    total_plantations: (acc.total_plantations || 0) + curr.total_plantations,
    outdated_ga: (acc.outdated_ga || 0) + curr.outdated_ga,
    total_investment: (acc.total_investment || 0) + curr.investment.total,
    total_subsidy: (acc.total_subsidy || 0) + curr.subsidy.total_subsidy,
  }), {});

  // Add total row
  const totalRow = {
    key: 'total',
    district: 'Jami',
    total_area: totals.total_area,
    total_plantations: totals.total_plantations,
    outdated_ga: totals.outdated_ga,
    low_fertility_count: Object.values(statistics.data || {}).reduce((acc, curr) => acc + curr.low_fertility.count, 0),
    low_fertility_area: Object.values(statistics.data || {}).reduce((acc, curr) => acc + curr.low_fertility.area, 0),
    high_fertility_count: Object.values(statistics.data || {}).reduce((acc, curr) => acc + curr.high_fertility.count, 0),
    high_fertility_area: Object.values(statistics.data || {}).reduce((acc, curr) => acc + curr.high_fertility.area, 0),
    irrigation_area: Object.values(statistics.data || {}).reduce((acc, curr) => acc + curr.irrigation.area, 0),
    irrigation_count: Object.values(statistics.data || {}).reduce((acc, curr) => acc + curr.irrigation.count, 0),
    investment_local: Object.values(statistics.data || {}).reduce((acc, curr) => acc + curr.investment.local, 0),
    investment_foreign: Object.values(statistics.data || {}).reduce((acc, curr) => acc + curr.investment.foreign, 0),
    investment_total: totals.total_investment,
    subsidy_count: Object.values(statistics.data || {}).reduce((acc, curr) => acc + curr.subsidy.subsidy_count, 0),
    total_subsidy: totals.total_subsidy,
  };

  // Add total row to tableData
  const dataWithTotal = [...tableData, totalRow];

  const columns = [
    {
      title: 'Tuman',
      dataIndex: 'district',
      key: 'district',
      fixed: 'left',
      width: 150,
      render: (text, record) => (
        <span style={{ 
          fontWeight: record.key === 'total' ? 'bold' : 'normal',
          fontStyle: text === 'Test District' ? 'normal' : 'inherit'
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Umumiy maydon',
      children: [
        {
          title: 'Jami (GA)',
          dataIndex: 'total_area',
          key: 'total_area',
          render: (value, record) => (
            <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: 'Plantatsiyalar soni',
          dataIndex: 'total_plantations',
          key: 'total_plantations',
        },
        {
          title: 'Eskirgan (GA)',
          dataIndex: 'outdated_ga',
          key: 'outdated_ga',
          render: (value, record) => (
            <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
      ],
    },
    {
      title: 'Hosildorlik',
      children: [
        {
          title: 'Past',
          children: [
            {
              title: 'Soni',
              dataIndex: 'low_fertility_count',
              key: 'low_fertility_count',
            },
            {
              title: 'Maydon',
              dataIndex: 'low_fertility_area',
              key: 'low_fertility_area',
              render: (value, record) => (
                <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
                  {(value || 0).toFixed(1)}
                </span>
              ),
            },
          ],
        },
        {
          title: 'Yuqori',
          children: [
            {
              title: 'Soni',
              dataIndex: 'high_fertility_count',
              key: 'high_fertility_count',
            },
            {
              title: 'Maydon',
              dataIndex: 'high_fertility_area',
              key: 'high_fertility_area',
              render: (value, record) => (
                <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
                  {(value || 0).toFixed(1)}
                </span>
              ),
            },
          ],
        },
      ],
    },
    {
      title: 'Sug\'orish',
      children: [
        {
          title: 'Maydon',
          dataIndex: 'irrigation_area',
          key: 'irrigation_area',
          render: (value, record) => (
            <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: 'Soni',
          dataIndex: 'irrigation_count',
          key: 'irrigation_count',
        },
      ],
    },
    {
      title: 'Investitsiyalar',
      children: [
        {
          title: 'Mahalliy',
          dataIndex: 'investment_local',
          key: 'investment_local',
          render: (value, record) => (
            <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
        {
          title: 'Xorijiy',
          dataIndex: 'investment_foreign',
          key: 'investment_foreign',
          render: (value, record) => (
            <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
        {
          title: 'Jami',
          dataIndex: 'investment_total',
          key: 'investment_total',
          render: (value, record) => (
            <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
      ],
    },
    {
      title: 'Subsidiyalar',
      children: [
        {
          title: 'Soni',
          dataIndex: 'subsidy_count',
          key: 'subsidy_count',
        },
        {
          title: 'Jami summa',
          dataIndex: 'total_subsidy',
          key: 'total_subsidy',
          render: (value, record) => (
            <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
      ],
    },
  ];

  return (
    <StatisticsLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/statistics/regions')}
          >
            Orqaga
          </Button>
          <h1 className="text-2xl font-bold ml-4">
            {REGION_NAMES[id]} viloyati statistikasi
          </h1>
        </div>

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
                title="Plantatsiyalar soni"
                value={totals.total_plantations}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Jami investitsiyalar"
                value={totals.total_investment}
                precision={0}
                formatter={value => `${value.toLocaleString()} UZS`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Jami subsidiyalar"
                value={totals.total_subsidy}
                precision={0}
                formatter={value => `${value.toLocaleString()} UZS`}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Table */}
        <Table
          loading={loading}
          columns={columns}
          dataSource={dataWithTotal}
          scroll={{ x: 'max-content' }}
          bordered
          size="middle"
          pagination={false}
          className="region-statistics-table"
          rowClassName={(record) => 
            record.key === 'total' ? 'total-row' : 
            record.district === 'Test District' ? 'test-district-row' : ''
          }
        />
      </div>
    </StatisticsLayout>
  );
};

export default RegionDetailPage; 