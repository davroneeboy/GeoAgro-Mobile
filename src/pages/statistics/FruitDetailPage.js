import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Card, Row, Col, Spin, Alert, Statistic, Button } from 'antd';
import StatisticsLayout from '../../layouts/StatisticsLayout';
import { API_BASE_URL1 } from "../../config";
import { ArrowLeftOutlined } from '@ant-design/icons';

const FruitDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL1}api/statistics/fruits/${id}/`);
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

  const tableData = Object.entries(statistics.data || {}).map(([variety, data]) => ({
    key: variety,
    variety,
    total_area: data.total_area,
    outdated_ga: data.outdated_ga,
    avg_fertility_score: data.avg_fertility_score,
  }));

  // Calculate totals
  const totals = tableData.reduce((acc, curr) => ({
    total_area: (acc.total_area || 0) + curr.total_area,
    outdated_ga: (acc.outdated_ga || 0) + curr.outdated_ga,
  }), {});

  // Add total row
  const totalRow = {
    key: 'total',
    variety: 'Jami',
    total_area: totals.total_area,
    outdated_ga: totals.outdated_ga,
    avg_fertility_score: '-',
  };

  const dataWithTotal = [...tableData, totalRow];

  const columns = [
    {
      title: 'Nav',
      dataIndex: 'variety',
      key: 'variety',
      fixed: 'left',
      render: (text, record) => (
        <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Umumiy Maydon (GA)',
      dataIndex: 'total_area',
      key: 'total_area',
      render: (value, record) => (
        <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
          {(value || 0).toFixed(1)}
        </span>
      ),
    },
    {
      title: 'Eskirgan Maydon (GA)',
      dataIndex: 'outdated_ga',
      key: 'outdated_ga',
      render: (value, record) => (
        <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
          {(value || 0).toFixed(1)}
        </span>
      ),
    },
    {
      title: 'O\'rtacha Hosildorlik',
      dataIndex: 'avg_fertility_score',
      key: 'avg_fertility_score',
      render: (value, record) => (
        <span style={{ fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
          {record.key === 'total' ? '-' : (value || 0).toFixed(1)}
        </span>
      ),
    },
  ];

  return (
    <StatisticsLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/statistics/fruits')}
          >
            Orqaga
          </Button>
          <h1 className="text-2xl font-bold ml-4">
            {statistics.fruit_name} statistikasi
          </h1>
        </div>

        {/* Summary Cards */}
        <Row gutter={16} className="mb-6">
          <Col span={12}>
            <Card>
              <Statistic
                title="Jami maydon"
                value={totals.total_area}
                suffix="GA"
                precision={1}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="Eskirgan maydon"
                value={totals.outdated_ga}
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
          scroll={{ x: 'max-content' }}
          bordered
          size="middle"
          pagination={false}
          className="region-statistics-table"
          rowClassName={(record) => record.key === 'total' ? 'total-row' : ''}
        />
      </div>
    </StatisticsLayout>
  );
};

export default FruitDetailPage; 