import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Card, Row, Col, Spin, Alert, Statistic, Button, message } from 'antd';
import StatisticsLayout from '../../layouts/StatisticsLayout';
import { API_BASE_URL1 } from "../../config";
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import AuthContext from '../../context/AuthContext';
import { fetchStatisticsData } from '../../utils/apiUtils';
import { exportToExcel } from '../../utils/excelExport';

const FruitDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const data = await fetchStatisticsData(`${API_BASE_URL1}api/statistics/fruits/${id}/`, authState.accessToken);
        setStatistics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, authState.accessToken]);

  // Функция для экспорта в Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      
      // Получаем данные для экспорта
      const exportData = sortedTableData;
      const exportTotals = {
        total_area: totals.total_area || 0,
        outdated_ga: totals.outdated_ga || 0,
      };
      
      // Генерируем имя файла
      const fruitName = statistics?.fruit || 'fruit';
      const filename = `${fruitName}_varieties_statistics_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Экспортируем
      const success = await exportToExcel(exportData, exportTotals, 'fruit_detail', fruitName, filename, false);
      
      if (success) {
        message.success('Excel fayl muvaffaqiyatli yuklandi!');
      } else {
        message.error('Excel fayl yuklashda xatolik yuz berdi.');
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error('Excel fayl yuklashda xatolik yuz berdi.');
    } finally {
      setExporting(false);
    }
  };

  const tableData = Object.entries(statistics?.data || {}).map(([variety, data]) => ({
    key: variety,
    variety,
    total_area: data.total_area,
    outdated_ga: data.outdated_ga,
    avg_fertility_score: data.avg_fertility_score,
  }));

  const sortedTableData = React.useMemo(() => {
    if (!sortConfig?.field) return tableData;
    const collator = new Intl.Collator('ru', { sensitivity: 'base' });
    const getVal = (row) => {
      switch (sortConfig.field) {
        case 'variety':
          return row.variety || '';
        case 'total_area':
          return Number(row.total_area || 0);
        case 'outdated_ga':
          return Number(row.outdated_ga || 0);
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

  const dataWithTotal = [...sortedTableData, totalRow];

  const textLight = { color: '#e5e7eb' };

  const columns = [
    {
      title: <span style={textLight}>Nav</span>,
      dataIndex: 'variety',
      key: 'variety',
      fixed: 'left',
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'variety' ? sortConfig.order : null,
      render: (text, record) => (
        <span style={{ ...textLight, fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
          {text}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Umumiy Maydon (GA)</span>,
      dataIndex: 'total_area',
      key: 'total_area',
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'total_area' ? sortConfig.order : null,
      render: (value, record) => (
        <span style={{ ...textLight, fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
          {(value || 0).toFixed(1)}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Eskirgan Maydon (GA)</span>,
      dataIndex: 'outdated_ga',
      key: 'outdated_ga',
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'outdated_ga' ? sortConfig.order : null,
      render: (value, record) => (
        <span style={{ ...textLight, fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
          {(value || 0).toFixed(1)}
        </span>
      ),
    },
    {
      title: <span style={textLight}>O'rtacha Hosildorlik</span>,
      dataIndex: 'avg_fertility_score',
      key: 'avg_fertility_score',
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'avg_fertility_score' ? sortConfig.order : null,
      render: (value, record) => (
        <span style={{ ...textLight, fontWeight: record.key === 'total' ? 'bold' : 'normal' }}>
          {record.key === 'total' ? '-' : (value || 0).toFixed(1)}
        </span>
      ),
    },
  ];

  if (loading) return <Spin size="large" />;
  if (error) return <Alert message={error} type="error" />;
  if (!statistics) return <Alert message="Ma'lumot topilmadi" type="info" />;

  return (
    <StatisticsLayout>
      <div className="p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex items-center mb-6">
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/statistics/fruits')}
          >
            Orqaga
          </Button>
          <h1 className="text-2xl font-bold ml-4 text-white">
            {statistics.fruit_name} statistikasi
          </h1>
          <div className="ml-auto">
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportToExcel}
              loading={exporting}
              className="bg-green-600 hover:bg-green-700 border-green-600"
              size="large"
            >
              Excel ga eksport qilish
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <Row gutter={16} className="mb-6">
          <Col span={12}>
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
          <Col span={12}>
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
          style={{ background: '#1f2937', color: '#e5e7eb' }}
          rowClassName={(record) => record.key === 'total' ? 'total-row' : ''}
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
        />
      </div>
    </StatisticsLayout>
  );
};

export default FruitDetailPage; 