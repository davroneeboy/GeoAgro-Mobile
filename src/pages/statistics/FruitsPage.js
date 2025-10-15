import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Card, Select, Row, Col, Alert, Statistic, Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL2 } from "../../config";
import AuthContext from "../../context/AuthContext";
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
        let url = `${API_BASE_URL2}api/statistics/fruits/`;
        const queryParams = new URLSearchParams();

        if (filters.regions.length > 0) {
          queryParams.append("regions", filters.regions.join(","));
        }

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }

        // Используем новый API v2.0 с fetch
        const response = await fetch(url, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
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
        plantation_count: totals.plantation_count || 0,
        approved_plantations: totals.approved_plantations || 0,
        approved_area: totals.approved_area || 0,
        pending_plantations: totals.pending_plantations || 0,
        pending_area: totals.pending_area || 0,
        rejected_plantations: totals.rejected_plantations || 0,
        rejected_area: totals.rejected_area || 0,
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

  // Transform to table rows - обновлено для новой структуры API
  const tableData = Array.isArray(statistics)
    ? statistics.map((item) => ({
        key: item.fruit_id ?? Math.random().toString(36).slice(2),
        id: item.fruit_id ?? null,
        fruit: item.fruit_name ?? '—',
        total_area: Number(item.total_area || 0),
        plantation_count: Number(item.total_plantations || 0),
        approved_plantations: Number(item.approved_plantations || 0),
        approved_area: Number(item.approved_area || 0),
        pending_plantations: Number(item.pending_plantations || 0),
        pending_area: Number(item.pending_area || 0),
        rejected_plantations: Number(item.rejected_plantations || 0),
        rejected_area: Number(item.rejected_area || 0),
        // Старые поля для совместимости
        outdated_ga: 0,
        low_fertility_count: 0,
        low_fertility_area: 0,
        high_fertility_count: 0,
        high_fertility_area: 0,
        avg_fertility_score: 0,
        regions: {},
      }))
    : Object.entries(statistics || {}).map(([fruitId, data]) => ({
        key: fruitId,
        id: Number(fruitId) || data.fruit_id || null,
        fruit: data.fruit_name || data.fruit || fruitId,
        total_area: Number(data.total_area || 0),
        plantation_count: Number(data.total_plantations || 0),
        approved_plantations: Number(data.approved_plantations || 0),
        approved_area: Number(data.approved_area || 0),
        pending_plantations: Number(data.pending_plantations || 0),
        pending_area: Number(data.pending_area || 0),
        rejected_plantations: Number(data.rejected_plantations || 0),
        rejected_area: Number(data.rejected_area || 0),
        // Старые поля для совместимости
        outdated_ga: 0,
        low_fertility_count: 0,
        low_fertility_area: 0,
        high_fertility_count: 0,
        high_fertility_area: 0,
        avg_fertility_score: 0,
        regions: {},
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
        case 'approved_area':
          return Number(row.approved_area || 0);
        case 'pending_area':
          return Number(row.pending_area || 0);
        case 'rejected_area':
          return Number(row.rejected_area || 0);
        case 'plantation_count':
          return Number(row.plantation_count || 0);
        case 'approved_plantations':
          return Number(row.approved_plantations || 0);
        case 'pending_plantations':
          return Number(row.pending_plantations || 0);
        case 'rejected_plantations':
          return Number(row.rejected_plantations || 0);
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

  // Calculate totals - обновлено для новых полей
  const totals = tableData.reduce(
    (acc, curr) => ({
      total_area: (acc.total_area || 0) + (curr.total_area || 0),
      plantation_count: (acc.plantation_count || 0) + (curr.plantation_count || 0),
      approved_plantations: (acc.approved_plantations || 0) + (curr.approved_plantations || 0),
      approved_area: (acc.approved_area || 0) + (curr.approved_area || 0),
      pending_plantations: (acc.pending_plantations || 0) + (curr.pending_plantations || 0),
      pending_area: (acc.pending_area || 0) + (curr.pending_area || 0),
      rejected_plantations: (acc.rejected_plantations || 0) + (curr.rejected_plantations || 0),
      rejected_area: (acc.rejected_area || 0) + (curr.rejected_area || 0),
      // Старые поля для совместимости
      outdated_ga: 0,
      low_fertility_count: 0,
      low_fertility_area: 0,
      high_fertility_count: 0,
      high_fertility_area: 0,
    }),
    {}
  );

  const columns = [
    {
      title: <span style={{ color: '#e5e7eb' }}>Meva</span>,
      dataIndex: "fruit",
      key: "fruit",
      fixed: "left",
      width: 150,
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
      title: <span style={{ color: '#e5e7eb' }}>Maydon (GA)</span>,
      children: [
        {
          title: <span style={{ color: '#e5e7eb' }}>Jami</span>,
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
          title: <span style={{ color: '#e5e7eb' }}>Tasdiqlangan</span>,
          dataIndex: "approved_area",
          key: "approved_area",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'approved_area' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ 
              fontWeight: record.key === "total" ? "bold" : "bold", 
              color: record.key === "total" ? '#e5e7eb' : '#10b981' 
            }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: <span style={{ color: '#e5e7eb' }}>Kutilmoqda</span>,
          dataIndex: "pending_area",
          key: "pending_area",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'pending_area' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ 
              fontWeight: record.key === "total" ? "bold" : "bold", 
              color: record.key === "total" ? '#e5e7eb' : '#f59e0b' 
            }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: <span style={{ color: '#e5e7eb' }}>Rad etilgan</span>,
          dataIndex: "rejected_area",
          key: "rejected_area",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'rejected_area' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ 
              fontWeight: record.key === "total" ? "bold" : "bold", 
              color: record.key === "total" ? '#e5e7eb' : '#ef4444' 
            }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
      ],
    },
    {
      title: <span style={{ color: '#e5e7eb' }}>Subyektlar</span>,
      children: [
        {
          title: <span style={{ color: '#e5e7eb' }}>Jami</span>,
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
          title: <span style={{ color: '#e5e7eb' }}>Tasdiqlangan</span>,
          dataIndex: "approved_plantations",
          key: "approved_plantations",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'approved_plantations' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ 
              fontWeight: record.key === "total" ? "bold" : "bold", 
              color: record.key === "total" ? '#e5e7eb' : '#10b981' 
            }}>
              {value || 0}
            </span>
          ),
        },
        {
          title: <span style={{ color: '#e5e7eb' }}>Kutilmoqda</span>,
          dataIndex: "pending_plantations",
          key: "pending_plantations",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'pending_plantations' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ 
              fontWeight: record.key === "total" ? "bold" : "bold", 
              color: record.key === "total" ? '#e5e7eb' : '#f59e0b' 
            }}>
              {value || 0}
            </span>
          ),
        },
        {
          title: <span style={{ color: '#e5e7eb' }}>Rad etilgan</span>,
          dataIndex: "rejected_plantations",
          key: "rejected_plantations",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'rejected_plantations' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ 
              fontWeight: record.key === "total" ? "bold" : "bold", 
              color: record.key === "total" ? '#e5e7eb' : '#ef4444' 
            }}>
              {value || 0}
            </span>
          ),
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
    {
      title: <span style={{ color: '#e5e7eb' }}>Taqsimot</span>,
      key: 'distribution',
      render: (_, record) => {
        const total = record.plantation_count || 0;
        if (total === 0) return <span style={{ color: '#e5e7eb' }}>—</span>;
        
        const approved = record.approved_plantations || 0;
        const pending = record.pending_plantations || 0;
        const rejected = record.rejected_plantations || 0;
        
        return (
          <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div 
                className="bg-green-500" 
                style={{ width: `${(approved / total) * 100}%` }}
                title={`Tasdiqlangan: ${approved}`}
              ></div>
              <div 
                className="bg-yellow-500" 
                style={{ width: `${(pending / total) * 100}%` }}
                title={`Kutilmoqda: ${pending}`}
              ></div>
              <div 
                className="bg-red-500" 
                style={{ width: `${(rejected / total) * 100}%` }}
                title={`Rad etilgan: ${rejected}`}
              ></div>
            </div>
          </div>
        );
      },
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
      <div className="p-3 sm:p-4" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white mb-2">Mevalar bo'yicha statistika</h1>
            {/* Легенда статусов */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-300">Tasdiqlangan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-300">Kutilmoqda</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-300">Rad etilgan</span>
              </div>
            </div>
          </div>
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

        <Card className="mb-3 sm:mb-4" bodyStyle={{ background: '#1f2937', border: '1px solid #374151', padding: 12 }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
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
        <Row gutter={[12, 12]} className="mb-3 sm:mb-4">
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 12 }}>
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
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 12 }}>
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
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 12 }}>
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
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 12 }}>
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
        <div className="overflow-x-auto fruits-table" style={{ position: 'relative' }}>
          <style jsx>{`
            .fruits-table .ant-table-thead > tr > th.ant-table-cell-fix-left {
              background: #1f2937 !important;
              border-right: 2px solid #6b7280 !important;
              z-index: 10 !important;
            }
            .fruits-table .ant-table-tbody > tr > td.ant-table-cell-fix-left {
              background: #1f2937 !important;
              border-right: 2px solid #6b7280 !important;
              z-index: 9 !important;
            }
            .fruits-table .ant-table-tbody > tr.total-row > td.ant-table-cell-fix-left {
              background: #374151 !important;
              border-right: 2px solid #6b7280 !important;
            }
            .fruits-table .ant-table-thead > tr > th.ant-table-cell-fix-left:last-child {
              border-right: 2px solid #6b7280 !important;
            }
            .fruits-table .ant-table-tbody > tr > td.ant-table-cell-fix-left:last-child {
              border-right: 2px solid #6b7280 !important;
            }
            .fruits-table .ant-table-container {
              position: relative;
            }
            .fruits-table .ant-table-thead > tr > th.ant-table-cell-fix-left {
              position: sticky !important;
            }
            .fruits-table .ant-table-tbody > tr > td.ant-table-cell-fix-left {
              position: sticky !important;
            }
            .fruits-table .ant-table-thead > tr > th.ant-table-cell-fix-left:nth-child(1) {
              left: 0px;
            }
            .fruits-table .ant-table-tbody > tr > td.ant-table-cell-fix-left:nth-child(1) {
              left: 0px;
            }
          `}</style>
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
            sticky={{ offsetHeader: 0 }}
            className="region-statistics-table"
            style={{ background: '#1f2937', color: '#e5e7eb', minWidth: 600 }}
            rowClassName={(record) => record.key === 'total' ? 'total-row' : ''}
            components={{
              body: {
                row: (props) => {
                  const { children, ...restProps } = props;
                  const isTotalRow = restProps.className?.includes('total-row');
                  return (
                    <tr 
                      {...restProps}
                      style={{
                        ...restProps.style,
                        backgroundColor: isTotalRow ? '#374151' : undefined,
                        fontWeight: isTotalRow ? 'bold' : undefined,
                        borderTop: isTotalRow ? '2px solid #6b7280' : undefined,
                      }}
                    >
                      {children}
                    </tr>
                  );
                }
              }
            }}
          />
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default FruitsPage;
