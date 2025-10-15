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
import AuthContext from "../../context/AuthContext";
import { handleApiError } from "../../utils/apiUtils";
import { exportToExcel } from "../../utils/excelExport";
import { API_BASE_URL2 } from "../../config";

const { Option } = Select;
const { RangePicker } = DatePicker;


// Порядок регионов по умолчанию (как на скриншоте)
const REGION_ORDER = ["12","2","3","5","6","7","8","9","11","10","1","4","13"];

const TIME_FILTER_OPTIONS = [
  { value: 7, label: "So'nggi 7 kun" },
  { value: 30, label: "So'nggi 30 kun" },
  { value: 90, label: "So'nggi 90 kun" },
  { value: 365, label: "So'nggi yil" },
  { value: "custom", label: "Maxsus davr" },
];

const ControllersPage = () => {

  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState([]); // regional_distribution
  const [headerTotals, setHeaderTotals] = useState({ total_users: 0, active_users: 0, inactive_users: 0 });
  const [filters, setFilters] = useState({
    timeFilter: null, // по умолчанию не выбран
    customDateRange: null,
  });
  const [timeFilterApplied, setTimeFilterApplied] = useState(false);
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Новый API эндпоинт для детальной статистики пользователей
        const response = await fetch(`${API_BASE_URL2}api/statistics/users/detailed/`, {
          headers: {
            'Authorization': `Bearer ${authState.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
          // Обрабатываем новый формат данных с полными полями
          const processedData = data.map(controller => ({
            user_id: controller.user_id,
            username: controller.username,
            full_name: controller.full_name,
            user_role: controller.user_role,
            user_role_display: controller.user_role_display,
            district_id: controller.district_id,
            district_name: controller.district_name,
            region_id: controller.region_id,
            region_name: controller.region_name,
            is_active: controller.is_active,
            date_joined: controller.date_joined,
            last_login: controller.last_login,
            plantations: controller.plantations,
            // Основные поля plantatsiyalar
            total_plantations: controller.plantations?.total_plantations || 0,
            approved_plantations: controller.plantations?.approved_plantations || 0,
            pending_plantations: controller.plantations?.pending_plantations || 0,
            rejected_plantations: controller.plantations?.rejected_plantations || 0,
            // Поля maydon
            total_area: controller.plantations?.total_area || 0,
            approved_area: controller.plantations?.approved_area || 0,
            pending_area: controller.plantations?.pending_area || 0,
            rejected_area: controller.plantations?.rejected_area || 0,
            last_created: controller.plantations?.last_created,
            // Процент отклонения
            rejected_percentage: controller.plantations?.total_plantations > 0 
              ? (controller.plantations?.rejected_plantations / controller.plantations?.total_plantations) * 100 
              : 0,
            // Процент ожидания
            pending_percentage: controller.plantations?.total_plantations > 0 
              ? (controller.plantations?.pending_plantations / controller.plantations?.total_plantations) * 100 
              : 0,
          }));
          
          setStatistics(processedData);
          
          // Подсчитываем общие статистики
          const activeUsers = processedData.filter(user => user.is_active).length;
          const totalUsers = processedData.length;
          
          setHeaderTotals({
            total_users: totalUsers,
            active_users: activeUsers,
            inactive_users: totalUsers - activeUsers,
          });
        } else {
          setStatistics([]);
          setHeaderTotals({ total_users: 0, active_users: 0, inactive_users: 0 });
        }
      } catch (err) {
        console.error("Error details:", err);
        handleApiError(err);
        setError(err.message || "Маълумотларни юклашда хатолик");
        setStatistics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authState.accessToken]);

  const handleResetFilters = () => {
    setFilters({
      timeFilter: null,
      customDateRange: null,
    });
    setTimeFilterApplied(false);
  };

  const handleTimeFilterChange = (value) => {
    if (value === undefined || value === null) {
      setFilters(prev => ({ ...prev, timeFilter: null, customDateRange: null }));
      setTimeFilterApplied(false);
      return;
    }
    setFilters(prev => ({
      ...prev,
      timeFilter: value,
      customDateRange: value === "custom" ? prev.customDateRange : null,
    }));
    setTimeFilterApplied(true);
  };

  const handleCustomDateRangeChange = (dates) => {
    setFilters(prev => ({
      ...prev,
      customDateRange: dates,
    }));
    setTimeFilterApplied(true);
  };

  // Функция для экспорта в Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      const exportData = sortedTableData;
      const totalArea = tableData.reduce((sum, row) => sum + (row.total_area || 0), 0);
      const approvedArea = tableData.reduce((sum, row) => sum + (row.approved_area || 0), 0);
      const pendingArea = tableData.reduce((sum, row) => sum + (row.pending_area || 0), 0);
      const rejectedArea = tableData.reduce((sum, row) => sum + (row.rejected_area || 0), 0);
      
      const exportTotals = {
        total_plantations: totals.total || 0,
        approved_plantations: totals.approved || 0,
        pending_plantations: totals.pending || 0,
        rejected_plantations: totals.rejected || 0,
        total_area: totalArea,
        approved_area: approvedArea,
        pending_area: pendingArea,
        rejected_area: rejectedArea,
      };
      const timeFilter = timeFilterApplied 
        ? (filters.timeFilter === 'custom' ? 'custom' : filters.timeFilter)
        : 'none';
      const filename = `controllers_statistics_${timeFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  // Подготовка данных для таблицы (обновлено для нового API)
  const tableData = Array.isArray(statistics)
    ? statistics.map((row, idx) => {
        return {
          key: row?.user_id ?? idx,
          user_id: row?.user_id,
          username: row?.username ?? "—",
          full_name: row?.full_name ?? "—",
          user_role: row?.user_role,
          user_role_display: row?.user_role_display ?? "—",
          district_id: row?.district_id,
          district_name: row?.district_name ?? "—",
          region_id: row?.region_id,
          region_name: row?.region_name ?? "—",
          is_active: row?.is_active,
          date_joined: row?.date_joined,
          last_login: row?.last_login,
          // Plantatsiyalar
          total_plantations: Number(row?.total_plantations || 0),
          approved_plantations: Number(row?.approved_plantations || 0),
          pending_plantations: Number(row?.pending_plantations || 0),
          rejected_plantations: Number(row?.rejected_plantations || 0),
          // Maydon
          total_area: Number(row?.total_area || 0),
          approved_area: Number(row?.approved_area || 0),
          pending_area: Number(row?.pending_area || 0),
          rejected_area: Number(row?.rejected_area || 0),
          last_created: row?.last_created,
          // Проценты
          rejected_percentage: Number(row?.rejected_percentage || 0),
          pending_percentage: Number(row?.pending_percentage || 0),
        };
      })
    : [];

  // Итоги по plantatsiyalar
  const totals = tableData.reduce(
    (acc, curr) => ({
      total: acc.total + (curr.total_plantations || 0),
      approved: acc.approved + (curr.approved_plantations || 0),
      pending: acc.pending + (curr.pending_plantations || 0),
      rejected: acc.rejected + (curr.rejected_plantations || 0),
    }),
    { total: 0, approved: 0, pending: 0, rejected: 0 }
  );

  const textLight = { color: '#e5e7eb' };



  const sortedTableData = React.useMemo(() => {
    if (!sortConfig?.field) {
      // Дефолтная сортировка по регионам, если такие данные есть
      const orderIndex = (code) => {
        const idx = REGION_ORDER.indexOf(String(code));
        return idx === -1 ? 999 : idx;
      };
      const rows = [...tableData];
      // Если у строк есть region_code или key содержит регион, сортируем по REGION_ORDER
      if (rows.some(r => r.region_code != null)) {
        rows.sort((a, b) => orderIndex(a.region_code) - orderIndex(b.region_code));
      }
      return rows;
    }
    const collator = new Intl.Collator('ru', { sensitivity: 'base' });
    const getVal = (record) => {
      switch (sortConfig.field) {
        case 'username':
          return record.username || '';
        case 'user_role_display':
          return record.user_role_display || '';
        case 'region':
          return record.region_name || '';
        case 'district':
          return record.district_name || '';
        case 'is_active':
          return record.is_active ? 1 : 0;
        case 'total_plantations':
          return Number(record.total_plantations || 0);
        case 'approved_plantations':
          return Number(record.approved_plantations || 0);
        case 'pending_plantations':
          return Number(record.pending_plantations || 0);
        case 'rejected_plantations':
          return Number(record.rejected_plantations || 0);
        case 'rejection_rate':
          return Number(record.rejected_percentage || 0);
        case 'pending_rate':
          return Number(record.pending_percentage || 0);
        case 'distribution':
          // Сортируем по общему количеству plantatsiyalar для колонки распределения
          return Number(record.total_plantations || 0);
        case 'total_area':
          return Number(record.total_area || 0);
        case 'approved_area':
          return Number(record.approved_area || 0);
        case 'pending_area':
          return Number(record.pending_area || 0);
        case 'rejected_area':
          return Number(record.rejected_area || 0);
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

  // Колонки таблицы для контроллеров
  const columns = React.useMemo(() => {
    const baseColumns = [
      {
        title: <span style={textLight}>Foydalanuvchi</span>,
        dataIndex: 'username',
        key: 'username',
        fixed: 'left',
        width: 150,
        sorter: true,
        sortDirections: ['ascend','descend'],
        sortOrder: sortConfig.field === 'username' ? sortConfig.order : null,
        render: (value, record) => (
          <div>
            <div style={textLight}>{value || '—'}</div>
            <div style={{...textLight, fontSize: '12px', opacity: 0.7}}>
              {record.full_name}
            </div>
          </div>
        ),
      },
      {
        title: <span style={textLight}>Rol</span>,
        dataIndex: 'user_role_display',
        key: 'user_role_display',
        fixed: 'left',
        width: 120,
        sorter: true,
        sortDirections: ['ascend','descend'],
        sortOrder: sortConfig.field === 'user_role_display' ? sortConfig.order : null,
        render: (value) => <span style={textLight}>{value || '—'}</span>,
      },
      {
        title: <span style={textLight}>Viloyat</span>,
        dataIndex: 'region_name',
        key: 'region',
        fixed: 'left',
        width: 120,
        sorter: true,
        sortDirections: ['ascend','descend'],
        sortOrder: sortConfig.field === 'region' ? sortConfig.order : null,
        render: (value) => <span style={textLight}>{value || '—'}</span>,
      },
      {
        title: <span style={textLight}>Tuman</span>,
        dataIndex: 'district_name',
        key: 'district',
        fixed: 'left',
        width: 120,
        sorter: true,
        sortDirections: ['ascend','descend'],
        sortOrder: sortConfig.field === 'district' ? sortConfig.order : null,
        render: (value) => <span style={textLight}>{value || '—'}</span>,
      },
      {
        title: <span style={textLight}>Faol</span>,
        dataIndex: 'is_active',
        key: 'is_active',
        fixed: 'left',
        width: 80,
        sorter: true,
        sortDirections: ['ascend','descend'],
        sortOrder: sortConfig.field === 'is_active' ? sortConfig.order : null,
        render: (value) => (
          <span style={{...textLight, color: value ? '#10b981' : '#ef4444'}}>
            {value ? 'Ha' : 'Yo\'q'}
          </span>
        ),
      }
    ];
    
    // Добавляем колонки Plantatsiyalar
    baseColumns.push({
      title: <span style={textLight}>Plantatsiyalar</span>,
      children: [
        {
          title: <span style={textLight}>Umumiy</span>,
          dataIndex: 'total_plantations',
          key: 'total_plantations',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'total_plantations' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Tasdiqlangan</span>,
          dataIndex: 'approved_plantations',
          key: 'approved_plantations',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'approved_plantations' ? sortConfig.order : null,
          render: (v) => (
            <span style={{...textLight, color: '#10b981', fontWeight: 'bold'}}>
              {v ?? 0}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Kutilmoqda</span>,
          dataIndex: 'pending_plantations',
          key: 'pending_plantations',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'pending_plantations' ? sortConfig.order : null,
          render: (v) => (
            <span style={{...textLight, color: '#f59e0b', fontWeight: 'bold'}}>
              {v ?? 0}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Rad etilgan</span>,
          dataIndex: 'rejected_plantations',
          key: 'rejected_plantations',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'rejected_plantations' ? sortConfig.order : null,
          render: (v) => (
            <span style={{...textLight, color: '#ef4444', fontWeight: 'bold'}}>
              {v ?? 0}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Rad etish %</span>,
          dataIndex: 'rejected_percentage',
          key: 'rejection_rate',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'rejection_rate' ? sortConfig.order : null,
          render: (v) => (
            <span style={{...textLight, color: '#ef4444', fontWeight: 'bold'}}>
              {v ? `${Number(v).toFixed(1)}%` : '0%'}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Kutilmoqda %</span>,
          dataIndex: 'pending_percentage',
          key: 'pending_rate',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'pending_rate' ? sortConfig.order : null,
          render: (v) => (
            <span style={{...textLight, color: '#f59e0b', fontWeight: 'bold'}}>
              {v ? `${Number(v).toFixed(1)}%` : '0%'}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Taqsimot</span>,
          key: 'distribution',
          render: (_, record) => {
            const total = record.total_plantations || 0;
            if (total === 0) return <span style={textLight}>—</span>;
            
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
      ],
    });

    // Добавляем колонки Maydon (GA)
    baseColumns.push({
      title: <span style={textLight}>Maydon (GA)</span>,
      children: [
        {
          title: <span style={textLight}>Umumiy</span>,
          dataIndex: 'total_area',
          key: 'total_area',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'total_area' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ? Number(v).toFixed(1) : '0.0'}</span>,
        },
        {
          title: <span style={textLight}>Tasdiqlangan</span>,
          dataIndex: 'approved_area',
          key: 'approved_area',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'approved_area' ? sortConfig.order : null,
          render: (v) => (
            <span style={{...textLight, color: '#10b981', fontWeight: 'bold'}}>
              {v ? Number(v).toFixed(1) : '0.0'}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Kutilmoqda</span>,
          dataIndex: 'pending_area',
          key: 'pending_area',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'pending_area' ? sortConfig.order : null,
          render: (v) => (
            <span style={{...textLight, color: '#f59e0b', fontWeight: 'bold'}}>
              {v ? Number(v).toFixed(1) : '0.0'}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Rad etilgan</span>,
          dataIndex: 'rejected_area',
          key: 'rejected_area',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'rejected_area' ? sortConfig.order : null,
          render: (v) => (
            <span style={{...textLight, color: '#ef4444', fontWeight: 'bold'}}>
              {v ? Number(v).toFixed(1) : '0.0'}
            </span>
          ),
        },
      ],
    });

    return baseColumns;
  }, [authState.userRole, sortConfig, textLight]);

  // Итоговая строка таблицы
  const totalRow = React.useMemo(() => {
    const totalArea = tableData.reduce((sum, row) => sum + (row.total_area || 0), 0);
    const approvedArea = tableData.reduce((sum, row) => sum + (row.approved_area || 0), 0);
    const pendingArea = tableData.reduce((sum, row) => sum + (row.pending_area || 0), 0);
    const rejectedArea = tableData.reduce((sum, row) => sum + (row.rejected_area || 0), 0);

    return {
      key: 'total',
      username: 'Jami',
      full_name: '',
      user_role_display: '',
      region_name: '',
      district_name: '',
      is_active: '',
      total_plantations: totals.total,
      approved_plantations: totals.approved,
      pending_plantations: totals.pending,
      rejected_plantations: totals.rejected,
      total_area: totalArea,
      approved_area: approvedArea,
      pending_area: pendingArea,
      rejected_area: rejectedArea,
      rejected_percentage: totals.total > 0 ? (totals.rejected / totals.total) * 100 : 0,
      pending_percentage: totals.total > 0 ? (totals.pending / totals.total) * 100 : 0,
      // Добавляем стили для итоговой строки
      _isTotalRow: true,
    };
  }, [totals, tableData]);

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
    return <Spin size="large" className="w-full flex justify-center items-center min-h-screen" />;
  }
  if (error) {
    return <Alert message="Хатолик" description={error} type="error" showIcon className="max-w-xl mx-auto mt-10" />;
  }


  return (
    <StatisticsLayout>
      <div className="p-3 sm:p-4" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white mb-2">
              Nazoratchilar bo'yicha statistika
            </h1>
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

        {/* Фильтры */}
        <Card className="mb-3 sm:mb-4" bodyStyle={{ background: '#1f2937' }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Vaqt filtri</label>
                <Select
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="Vaqt davrini tanlang"
                  value={filters.timeFilter ?? undefined}
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
                  <Option value="username">Foydalanuvchi</Option>
                  <Option value="user_role_display">Rol</Option>
                  <Option value="region">Viloyat</Option>
                  <Option value="district">Tuman</Option>
                  <Option value="is_active">Faol</Option>
                  <Option value="total_plantations">Plantatsiyalar — Umumiy</Option>
                  <Option value="approved_plantations">Plantatsiyalar — Tasdiqlangan</Option>
                  <Option value="pending_plantations">Plantatsiyalar — Kutilmoqda</Option>
                  <Option value="rejected_plantations">Plantatsiyalar — Rad etilgan</Option>
                  <Option value="rejection_rate">Plantatsiyalar — Rad etish %</Option>
                  <Option value="pending_rate">Plantatsiyalar — Kutilmoqda %</Option>
                  <Option value="distribution">Plantatsiyalar — Taqsimot</Option>
                  <Option value="total_area">Maydon — Umumiy</Option>
                  <Option value="approved_area">Maydon — Tasdiqlangan</Option>
                  <Option value="pending_area">Maydon — Kutilmoqda</Option>
                  <Option value="rejected_area">Maydon — Rad etilgan</Option>
                </Select>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Summary Cards */}
        <Row gutter={[12, 12]} className="mb-3 sm:mb-4">
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} styles={{ body: { padding: 16 } }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami foydalanuvchilar</span>}
                value={headerTotals.total_users}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} styles={{ body: { padding: 16 } }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Faol</span>}
                value={headerTotals.active_users}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} styles={{ body: { padding: 16 } }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Nofaol</span>}
                value={headerTotals.inactive_users}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} styles={{ body: { padding: 16 } }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami plantatsiyalar</span>}
                value={totals.total}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} styles={{ body: { padding: 16 } }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Kutilmoqda</span>}
                value={totals.pending}
                precision={0}
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Table */}
        <div className="overflow-x-auto controllers-table" style={{ position: 'relative' }}>
          <style jsx>{`
            .controllers-table .ant-table-thead > tr > th.ant-table-cell-fix-left {
              background: #1f2937 !important;
              border-right: 2px solid #6b7280 !important;
              z-index: 10 !important;
            }
            .controllers-table .ant-table-tbody > tr > td.ant-table-cell-fix-left {
              background: #1f2937 !important;
              border-right: 2px solid #6b7280 !important;
              z-index: 9 !important;
            }
            .controllers-table .ant-table-tbody > tr.total-row > td.ant-table-cell-fix-left {
              background: #374151 !important;
              border-right: 2px solid #6b7280 !important;
            }
            .controllers-table .ant-table-thead > tr > th.ant-table-cell-fix-left:last-child {
              border-right: 2px solid #6b7280 !important;
            }
            .controllers-table .ant-table-tbody > tr > td.ant-table-cell-fix-left:last-child {
              border-right: 2px solid #6b7280 !important;
            }
            .controllers-table .ant-table-container {
              position: relative;
            }
            .controllers-table .ant-table-thead > tr > th.ant-table-cell-fix-left {
              position: sticky !important;
            }
            .controllers-table .ant-table-tbody > tr > td.ant-table-cell-fix-left {
              position: sticky !important;
            }
            .controllers-table .ant-table-thead > tr > th.ant-table-cell-fix-left:nth-child(1) {
              left: 0px;
            }
            .controllers-table .ant-table-thead > tr > th.ant-table-cell-fix-left:nth-child(2) {
              left: 150px;
            }
            .controllers-table .ant-table-thead > tr > th.ant-table-cell-fix-left:nth-child(3) {
              left: 270px;
            }
            .controllers-table .ant-table-thead > tr > th.ant-table-cell-fix-left:nth-child(4) {
              left: 390px;
            }
            .controllers-table .ant-table-thead > tr > th.ant-table-cell-fix-left:nth-child(5) {
              left: 510px;
            }
            .controllers-table .ant-table-tbody > tr > td.ant-table-cell-fix-left:nth-child(1) {
              left: 0px;
            }
            .controllers-table .ant-table-tbody > tr > td.ant-table-cell-fix-left:nth-child(2) {
              left: 150px;
            }
            .controllers-table .ant-table-tbody > tr > td.ant-table-cell-fix-left:nth-child(3) {
              left: 270px;
            }
            .controllers-table .ant-table-tbody > tr > td.ant-table-cell-fix-left:nth-child(4) {
              left: 390px;
            }
            .controllers-table .ant-table-tbody > tr > td.ant-table-cell-fix-left:nth-child(5) {
              left: 510px;
            }
          `}</style>
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
              sticky={{ offsetHeader: 0 }}
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
          </ConfigProvider>
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default ControllersPage;
