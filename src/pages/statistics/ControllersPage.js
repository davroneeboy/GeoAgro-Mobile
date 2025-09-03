import React, { useState, useEffect, useContext } from "react";
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
  DatePicker,
  ConfigProvider,
  message,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1 } from "../../config";
import AuthContext from "../../context/AuthContext";
import { fetchStatisticsData } from "../../utils/apiUtils";
import { exportToExcel } from "../../utils/excelExport";

const { Option } = Select;
const { RangePicker } = DatePicker;

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
  13: "Xorazm",
};

const TIME_FILTER_OPTIONS = [
  { value: 7, label: "So'nggi 7 kun" },
  { value: 30, label: "So'nggi 30 kun" },
  { value: 90, label: "So'nggi 90 kun" },
  { value: 365, label: "So'nggi yil" },
  { value: "custom", label: "Maxsus davr" },
];

const ControllersPage = () => {
  console.log("ControllersPage component rendered");

  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [filters, setFilters] = useState({
    timeFilter: 30, // По умолчанию 30 дней
    customDateRange: null,
  });
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data...");
      
      try {
        setLoading(true);
        let url = `${API_BASE_URL1}api/statistics/users/detailed/`;
        const queryParams = new URLSearchParams();

        // Добавляем параметр времени
        if (filters.timeFilter !== "custom") {
          queryParams.append("days", filters.timeFilter);
        } else if (filters.customDateRange && filters.customDateRange.length === 2) {
          const [startDate, endDate] = filters.customDateRange;
          queryParams.append("start_date", startDate.format("YYYY-MM-DD"));
          queryParams.append("end_date", endDate.format("YYYY-MM-DD"));
        }

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }

        console.log("API URL:", url);
        const data = await fetchStatisticsData(url, authState.accessToken);
        console.log("Received data:", data);

        setStatistics(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, authState.accessToken]);

  const handleResetFilters = () => {
    setFilters({
      timeFilter: 30,
      customDateRange: null,
    });
  };

  const handleTimeFilterChange = (value) => {
    setFilters(prev => ({
      ...prev,
      timeFilter: value,
      customDateRange: value === "custom" ? prev.customDateRange : null,
    }));
  };

  const handleCustomDateRangeChange = (dates) => {
    setFilters(prev => ({
      ...prev,
      customDateRange: dates,
    }));
  };

  // Функция для экспорта в Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      
      // Получаем данные для экспорта
      const exportData = sortedTableData;
      const exportTotals = {
        total_plantations: totals.total || 0,
        approved_plantations: totals.approved || 0,
        rejected_plantations: totals.rejected || 0,
        kpi_points: totals.kpiPoints || 0,
        kpi_amount: totals.kpiAmount || 0,
      };
      
      // Генерируем имя файла
      const timeFilter = filters.timeFilter === 'custom' ? 'custom' : filters.timeFilter;
      const filename = `controllers_statistics_${timeFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Экспортируем
      const success = await exportToExcel(exportData, exportTotals, 'controllers', 'Controllers', filename, false);
      
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

  // Подготовка данных для таблицы
  const tableData = statistics.map((user, idx) => ({
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

  const mapRegion = (value) => {
    if (value == null) return "—";
    const num = Number(value);
    return Number.isFinite(num) && REGION_NAMES[num]
      ? REGION_NAMES[num]
      : (REGION_NAMES[value] || String(value));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const sortedTableData = React.useMemo(() => {
    if (!sortConfig?.field) return tableData;
    const collator = new Intl.Collator('ru', { sensitivity: 'base' });
    const getVal = (record) => {
      switch (sortConfig.field) {
        case 'full_name':
          return `${record.first_name || ''} ${record.last_name || ''}`.trim();
        case 'username':
          return record.username || '';
        case 'phone':
          return record.phone_number || '';
        case 'region':
          return mapRegion(record.location?.region) || '';
        case 'district':
          return record.location?.district || '';
        case 'last_login':
          return record.last_login || '';
        case 'total_plantations':
          return Number(record.plantations_stats?.total || 0);
        case 'approved_plantations':
          return Number(record.plantations_stats?.approved || 0);
        case 'rejected_plantations':
          return Number(record.plantations_stats?.rejected || 0);
        case 'rejection_rate':
          return Number(record.plantations_stats?.rejection_rate || 0);
        case 'kpi_points':
          return Number(record.kpi_current?.points || 0);
        case 'kpi_amount':
          return Number(record.kpi_current?.amount || 0);
        default:
          return '';
      }
    };
    const rows = [...tableData];
    rows.sort((a, b) => {
      const aRaw = getVal(a);
      const bRaw = getVal(b);
      let res;
      if (typeof aRaw === 'number' && typeof bRaw === 'number') {
        res = aRaw - bRaw;
      } else {
        const aKey = (aRaw ?? '').toString();
        const bKey = (bRaw ?? '').toString();
        res = collator.compare(aKey, bKey);
      }
      return sortConfig.order === 'descend' ? -res : res;
    });
    return rows;
  }, [tableData, sortConfig]);

  const columns = [
    {
      title: <span style={textLight}>F.I.Sh</span>,
      dataIndex: "full_name",
      key: "full_name",
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'full_name' ? sortConfig.order : null,
      render: (_value, record) => (
        <span style={textLight}>
          {`${record.first_name || ""} ${record.last_name || ""}`.trim() || "—"}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Login</span>,
      dataIndex: "username",
      key: "username",
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'username' ? sortConfig.order : null,
      render: (value) => <span style={textLight}>{value}</span>,
    },
    {
      title: <span style={textLight}>Telefon raqami</span>,
      dataIndex: "phone_number",
      key: "phone",
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'phone' ? sortConfig.order : null,
      render: (value) => <span style={textLight}>{value || "—"}</span>,
    },
    {
      title: <span style={textLight}>Region</span>,
      key: "region",
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'region' ? sortConfig.order : null,
      render: (_v, record) => (
        <span style={textLight}>{mapRegion(record.location?.region)}</span>
      ),
    },
    {
      title: <span style={textLight}>Tuman</span>,
      key: "district",
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'district' ? sortConfig.order : null,
      render: (_v, record) => (
        <span style={textLight}>{record.location?.district || "—"}</span>
      ),
    },
    {
      title: <span style={textLight}>Oxirgi kirish</span>,
      key: "last_login",
      sorter: true,
      sortDirections: ['ascend','descend'],
      sortOrder: sortConfig.field === 'last_login' ? sortConfig.order : null,
      render: (_v, record) => (
        <span style={textLight}>{formatDate(record.last_login)}</span>
      ),
    },
    {
      title: <span style={textLight}>Plantatsiyalar</span>,
      children: [
        {
          title: <span style={textLight}>Umumiy</span>,
          dataIndex: ["plantations_stats", "total"],
          key: "total_plantations",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'total_plantations' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Tasdiqlangan</span>,
          dataIndex: ["plantations_stats", "approved"],
          key: "approved_plantations",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'approved_plantations' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Rad etilgan</span>,
          dataIndex: ["plantations_stats", "rejected"],
          key: "rejected_plantations",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'rejected_plantations' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Rad etish %</span>,
          dataIndex: ["plantations_stats", "rejection_rate"],
          key: "rejection_rate",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'rejection_rate' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ? `${v.toFixed(1)}%` : "0%"}</span>,
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
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'kpi_points' ? sortConfig.order : null,
          render: (value) => <span style={textLight}>{(value || 0).toFixed(1)}</span>,
        },
        {
          title: <span style={textLight}>Summa</span>,
          dataIndex: ["kpi_current", "amount"],
          key: "kpi_amount",
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'kpi_amount' ? sortConfig.order : null,
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
      rejection_rate: totals.total > 0 ? (totals.rejected / totals.total) * 100 : 0,
    },
    kpi_current: {
      points: totals.kpiPoints,
      amount: totals.kpiAmount,
    },
  };

  const dataWithTotal = [...sortedTableData, totalRow];

  const paginationItemStyle = {
    background: '#374151',
    color: '#e5e7eb',
    borderRadius: 6,
    padding: '2px 8px',
    border: '1px solid #4b5563',
  };

  const itemRender = (page, type, originalElement) => {
    switch (type) {
      case 'page':
        return <span style={paginationItemStyle}>{page}</span>;
      case 'prev':
        return <span style={paginationItemStyle}>Orqaga</span>;
      case 'next':
        return <span style={paginationItemStyle}>Oldinga</span>;
      case 'jump-prev':
      case 'jump-next':
        return <span style={paginationItemStyle}>...</span>;
      default:
        return originalElement;
    }
  };

  // Show loading state
  if (loading) {
    console.log("Showing loading state");
    return (
      <StatisticsLayout>
        <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
          <Spin size="large" />
        </div>
      </StatisticsLayout>
    );
  }

  console.log("Rendering table with data:", dataWithTotal);

  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Nazoratchilar bo'yicha statistika
          </h1>
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

        {/* Фильтры */}
        <Card className="mb-4 sm:mb-6" bodyStyle={{ background: '#1f2937' }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Vaqt filtri</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Vaqt davrini tanlang"
                  value={filters.timeFilter}
                  onChange={handleTimeFilterChange}
                >
                  {TIME_FILTER_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            {filters.timeFilter === "custom" && (
              <Col xs={24} md={8}>
                <div className="mb-2 sm:mb-4">
                  <label className="block mb-2 text-gray-200">Maxsus davr</label>
                  <RangePicker
                    style={{ width: "100%" }}
                    value={filters.customDateRange}
                    onChange={handleCustomDateRangeChange}
                    format="DD.MM.YYYY"
                    placeholder={["Boshlanish sanasi", "Tugash sanasi"]}
                  />
                </div>
              </Col>
            )}
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
                  <Option value="full_name">F.I.Sh</Option>
                  <Option value="username">Login</Option>
                  <Option value="phone">Telefon raqami</Option>
                  <Option value="region">Region</Option>
                  <Option value="district">Tuman</Option>
                  <Option value="last_login">Oxirgi kirish</Option>
                  <Option value="total_plantations">Plantatsiyalar — Umumiy</Option>
                  <Option value="approved_plantations">Plantatsiyalar — Tasdiqlangan</Option>
                  <Option value="rejected_plantations">Plantatsiyalar — Rad etilgan</Option>
                  <Option value="rejection_rate">Plantatsiyalar — Rad etish %</Option>
                  <Option value="kpi_points">KPI — Ballar</Option>
                  <Option value="kpi_amount">KPI — Summa</Option>
                </Select>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Summary Cards */}
        <Row gutter={[12, 12]} className="mb-4 sm:mb-6">
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami nazoratchilar</span>}
                value={tableData.length}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami plantatsiyalar</span>}
                value={totals.total}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Tasdiqlangan</span>}
                value={totals.approved}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
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
        <div className="overflow-x-auto controllers-table">
          <ConfigProvider locale={{ Pagination: { items_per_page: 'Sahifa' } }}>
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
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: dataWithTotal.length,
                position: ['bottomCenter'],
                showSizeChanger: true,
                pageSizeOptions: ['10','20','50','100'],
                showQuickJumper: true,
                showLessItems: false,
                itemRender,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
                showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} yozuv`,
              }}
              className="region-statistics-table"
              style={{ background: '#1f2937', color: '#e5e7eb', minWidth: 700 }}
              rowClassName={(record) => record.key === 'total' ? 'total-row' : ''}
            />
          </ConfigProvider>
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default ControllersPage;
