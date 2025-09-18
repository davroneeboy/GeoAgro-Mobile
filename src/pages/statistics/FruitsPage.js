import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Card, Select, Row, Col, Alert, Statistic, Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1 } from "../../config";
import AuthContext from "../../context/AuthContext";
import { fetchStatisticsData } from "../../utils/apiUtils";
import { exportToExcel } from "../../utils/excelExport";

const { Option } = Select;

const REGION_NAMES = {
  12: "QQR",
  2: "Andijon",
  3: "Buxoro",
  5: "Jizzax",
  6: "Qashqadaryo",
  7: "Navoiy",
  8: "Namangan",
  9: "Samarqand",
  11: "Surxondaryo",
  10: "Sirdaryo",
  1: "Toshkent",
  4: "Farg‘ona",
  13: "Xorazm",
};

const FruitsPage = () => {
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    regions: [],
  });
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });
  const [exporting, setExporting] = useState(false);

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

  // Функция для экспорта в Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      
      // Получаем данные для экспорта
      const exportData = sortedTableData;
      const exportTotals = {
        total_area: totals.total_area || 0,
        outdated_ga: totals.outdated_ga || 0,
        low_fertility_count: totals.low_fertility_count || 0,
        low_fertility_area: totals.low_fertility_area || 0,
        high_fertility_count: totals.high_fertility_count || 0,
        high_fertility_area: totals.high_fertility_area || 0,
      };
      
      // Генерируем имя файла
      const regionName = filters.regions.length > 0 
        ? filters.regions.map(id => REGION_NAMES[id]).join('_')
        : 'All_Regions';
      const filename = `${regionName}_fruits_statistics_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Экспортируем
      const success = await exportToExcel(exportData, exportTotals, 'fruits', regionName, filename, false);
      
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

  // Transform to table rows
  const tableData = Array.isArray(statistics)
    ? statistics.map((item) => ({
        key: item.fruit_id ?? item.fruit ?? Math.random().toString(36).slice(2),
        id: item.fruit_id ?? item.id ?? null,
        fruit: item.fruit ?? item.name ?? '—',
        total_area: Number(item.total_area || item.area_total || 0),
        plantation_count: Number(item.plantation_count || 0),
        outdated_ga: Number(item.outdated_ga || item.outdated_area || 0),
        low_fertility_count: Number(item.low_fertility?.count || item.low_fertility_count || 0),
        low_fertility_area: Number(item.low_fertility?.area || item.low_fertility_area || 0),
        high_fertility_count: Number(item.high_fertility?.count || item.high_fertility_count || 0),
        high_fertility_area: Number(item.high_fertility?.area || item.high_fertility_area || 0),
        avg_fertility_score: Number(item.avg_fertility_score || item.average_fertility_score || 0),
        regions: item.regions || {},
      }))
    : Object.entries(statistics || {}).map(([fruitId, data]) => ({
        key: fruitId,
        id: Number(fruitId) || data.id || data.fruit_id || null,
        fruit: data.fruit || data.name || fruitId,
        total_area: Number(data.total_area || data.area_total || 0),
        plantation_count: Number(data.plantation_count || 0),
        outdated_ga: Number(data.outdated_ga || data.outdated_area || 0),
        low_fertility_count: Number(data.low_fertility?.count || data.low_fertility_count || 0),
        low_fertility_area: Number(data.low_fertility?.area || data.low_fertility_area || 0),
        high_fertility_count: Number(data.high_fertility?.count || data.high_fertility_count || 0),
        high_fertility_area: Number(data.high_fertility?.area || data.high_fertility_area || 0),
        avg_fertility_score: Number(data.avg_fertility_score || data.average_fertility_score || 0),
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
      total_area: (acc.total_area || 0) + (curr.total_area || 0),
      plantation_count: (acc.plantation_count || 0) + (curr.plantation_count || 0),
      outdated_ga: (acc.outdated_ga || 0) + (curr.outdated_ga || 0),
      low_fertility_count: (acc.low_fertility_count || 0) + (curr.low_fertility_count || 0),
      low_fertility_area: (acc.low_fertility_area || 0) + (curr.low_fertility_area || 0),
      high_fertility_count: (acc.high_fertility_count || 0) + (curr.high_fertility_count || 0),
      high_fertility_area: (acc.high_fertility_area || 0) + (curr.high_fertility_area || 0),
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
      onCell: (record) => record.id ? ({
        onClick: () => navigate(`/statistics/fruits/${record.id}`, { state: { fruitName: record.fruit } }),
        style: { cursor: 'pointer' }
      }) : {},
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
      title: <span style={{ color: '#e5e7eb' }}>Subyektlar</span>,
      dataIndex: "plantation_count",
      key: "plantation_count",
              sorter: true,
              sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'plantation_count' ? sortConfig.order : null,
              render: (value, record) => (
                <span style={{ fontWeight: record.key === "total" ? "bold" : "normal", color: '#e5e7eb' }}>
          {value || 0}
                </span>
              ),
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
          <div className="flex gap-2">
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
            <Button type="primary" danger onClick={handleResetFilters}>
              Filterni tozalash
            </Button>
          </div>
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
