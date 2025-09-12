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
import { fetchUsersStatisticsByRole } from "../../api/api";

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
        // RBAC: выбираем эндпоинт по роли
        const data = await fetchUsersStatisticsByRole(authState.userRole, {}, authState.accessToken);
        
        if (data) {
          // Для superuser: данные в формате regional_distribution
          if (data.regional_distribution) {
            const rows = Array.isArray(data.regional_distribution) ? data.regional_distribution : [];
            const filtered = rows.filter((r) => {
              const allNullMain = r.district__region == null && r.district__name == null && r.total_plantations == null && r.approved_plantations == null && r.rejected_plantations == null && r.rejected_percentage == null;
              const loc = r.location || {};
              const allNullLoc = loc.region == null && loc.district == null && loc.district_id == null;
              return !(allNullMain && allNullLoc);
            });
            setStatistics(filtered);
            setHeaderTotals({
              total_users: Number(data.total_users || 0),
              active_users: Number(data.active_users || 0),
              inactive_users: Number(data.inactive_users || 0),
            });
          }
          // Для headof_region: данные в формате results (массив пользователей)
          else if (data.results) {
            const users = Array.isArray(data.results) ? data.results : [];
            // Преобразуем формат пользователей в формат regional_distribution
            const transformedData = users.map(user => ({
              id: user.id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              phone_number: user.phone_number,
              location: user.location,
              last_login: user.last_login,
              kpi_current: user.kpi_current,
              plantations_stats: user.plantations_stats,
              // Добавляем поля для совместимости с существующим кодом
              district__region: user.location?.region,
              district__name: user.location?.district,
              district_id: user.location?.district_id,
              total_plantations: user.plantations_stats?.total || 0,
              approved_plantations: user.plantations_stats?.approved || 0,
              rejected_plantations: user.plantations_stats?.rejected || 0,
              rejected_percentage: user.plantations_stats?.rejection_rate || 0,
            }));
            setStatistics(transformedData);
            setHeaderTotals({
              total_users: Number(data.count || 0),
              active_users: Number(data.count || 0), // Для headof_region все пользователи активны
              inactive_users: 0,
            });
          }
          else {
            setStatistics([]);
            setHeaderTotals({ total_users: 0, active_users: 0, inactive_users: 0 });
          }
        } else {
          setStatistics([]);
          setHeaderTotals({ total_users: 0, active_users: 0, inactive_users: 0 });
        }
      } catch (err) {
        console.error("Error details:", err);
        handleApiError(err);
        setError(err.message || "Маълумотларни юклашда хатолик" );
        setStatistics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authState.userRole, authState.accessToken]);

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
      const exportTotals = {
        total_plantations: totals.total || 0,
        approved_plantations: totals.approved || 0,
        rejected_plantations: totals.rejected || 0,
        kpi_points: totals.kpiPoints || 0,
        kpi_amount: totals.kpiAmount || 0,
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

  // Подготовка данных для таблицы (адаптировано для обеих ролей)
  const tableData = Array.isArray(statistics)
    ? statistics.map((row, idx) => {
        // Для headof_region: показываем данные по пользователям
        if (authState.userRole === "headof_region") {
          return {
            key: row?.id ?? idx,
            user_id: row?.id,
            username: row?.username ?? "—",
            full_name: `${row?.first_name || ""} ${row?.last_name || ""}`.trim() || "—",
            phone_number: row?.phone_number ?? "—",
            region_code: row?.location?.region ?? null,
            region_name: mapRegion(row?.location?.region),
            district_name: row?.location?.district ?? "—",
            last_login: row?.last_login,
            kpi_points: Number(row?.kpi_current?.points || 0),
            kpi_amount: Number(row?.kpi_current?.amount || 0),
            total_plantations: Number(row?.total_plantations || 0),
            approved_plantations: Number(row?.approved_plantations || 0),
            rejected_plantations: Number(row?.rejected_plantations || 0),
            rejected_percentage: Number(row?.rejected_percentage || 0),
          };
        }
        // Для superuser: показываем данные по районам (существующая логика)
        else {
          return {
            key: row?.location?.district_id ?? `${row?.district__region || 'nr'}-${row?.district__name || idx}`,
            region_code: row?.district__region ?? row?.location?.region ?? null,
            region_name: mapRegion(row?.district__region ?? row?.location?.region),
            district_name: row?.district__name ?? row?.location?.district ?? "—",
            total_plantations: Number(row?.total_plantations || 0),
            approved_plantations: Number(row?.approved_plantations || 0),
            rejected_plantations: Number(row?.rejected_plantations || 0),
            rejected_percentage: Number(row?.rejected_percentage || 0),
          };
        }
      })
    : [];

  // Итоги по plantatsiyalar
  const totals = tableData.reduce(
    (acc, curr) => ({
      total: acc.total + (curr.total_plantations || 0),
      approved: acc.approved + (curr.approved_plantations || 0),
      rejected: acc.rejected + (curr.rejected_plantations || 0),
    }),
    { total: 0, approved: 0, rejected: 0 }
  );

  const textLight = { color: '#e5e7eb' };

  function mapRegion(value) {
    if (value == null) return "—";
    const num = Number(value);
    return Number.isFinite(num) && REGION_NAMES[num]
      ? REGION_NAMES[num]
      : (REGION_NAMES[value] || String(value));
  }


  const sortedTableData = React.useMemo(() => {
    if (!sortConfig?.field) return tableData;
    const collator = new Intl.Collator('ru', { sensitivity: 'base' });
    const getVal = (record) => {
      switch (sortConfig.field) {
        case 'region':
          return record.region_name || '';
        case 'district':
          return record.district_name || '';
        case 'username':
          return record.username || '';
        case 'phone_number':
          return record.phone_number || '';
        case 'total_plantations':
          return Number(record.total_plantations || 0);
        case 'approved_plantations':
          return Number(record.approved_plantations || 0);
        case 'rejected_plantations':
          return Number(record.rejected_plantations || 0);
        case 'rejection_rate':
          return Number(record.rejected_percentage || 0);
        case 'kpi_points':
          return Number(record.kpi_points || 0);
        case 'kpi_amount':
          return Number(record.kpi_amount || 0);
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

  // Динамические колонки в зависимости от роли
  const columns = React.useMemo(() => {
    const baseColumns = [];
    
    // Для headof_region: показываем информацию о пользователях
    if (authState.userRole === "headof_region") {
      baseColumns.push(
        {
          title: <span style={textLight}>Foydalanuvchi</span>,
          dataIndex: 'username',
          key: 'username',
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
          title: <span style={textLight}>Telefon</span>,
          dataIndex: 'phone_number',
          key: 'phone_number',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'phone_number' ? sortConfig.order : null,
          render: (value) => <span style={textLight}>{value || '—'}</span>,
        },
        {
          title: <span style={textLight}>Tuman</span>,
          dataIndex: 'district_name',
          key: 'district',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'district' ? sortConfig.order : null,
          render: (value) => <span style={textLight}>{value || '—'}</span>,
        }
      );
    }
    // Для superuser: показываем данные по регионам
    else {
      baseColumns.push(
        {
          title: <span style={textLight}>Region</span>,
          dataIndex: 'region_name',
          key: 'region',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'region' ? sortConfig.order : null,
          render: (value) => <span style={textLight}>{value || '—'}</span>,
        },
        {
          title: <span style={textLight}>Tuman</span>,
          dataIndex: 'district_name',
          key: 'district',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'district' ? sortConfig.order : null,
          render: (value) => <span style={textLight}>{value || '—'}</span>,
        }
      );
    }
    
    // Добавляем колонки Plantatsiyalar для обеих ролей
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
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Rad etilgan</span>,
          dataIndex: 'rejected_plantations',
          key: 'rejected_plantations',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'rejected_plantations' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Rad etish %</span>,
          dataIndex: 'rejected_percentage',
          key: 'rejection_rate',
          sorter: true,
          sortDirections: ['ascend','descend'],
          sortOrder: sortConfig.field === 'rejection_rate' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ? `${Number(v).toFixed(1)}%` : '0%'}</span>,
        },
      ],
    });

    // Для headof_region добавляем колонки KPI
    if (authState.userRole === "headof_region") {
      baseColumns.push({
        title: <span style={textLight}>KPI</span>,
        children: [
          {
            title: <span style={textLight}>Ball</span>,
            dataIndex: 'kpi_points',
            key: 'kpi_points',
            sorter: true,
            sortDirections: ['ascend','descend'],
            sortOrder: sortConfig.field === 'kpi_points' ? sortConfig.order : null,
            render: (v) => <span style={textLight}>{v ?? 0}</span>,
          },
          {
            title: <span style={textLight}>Summa</span>,
            dataIndex: 'kpi_amount',
            key: 'kpi_amount',
            sorter: true,
            sortDirections: ['ascend','descend'],
            sortOrder: sortConfig.field === 'kpi_amount' ? sortConfig.order : null,
            render: (v) => <span style={textLight}>{v ? `${Number(v).toFixed(2)}` : '0.00'}</span>,
          },
        ],
      });
    }

    return baseColumns;
  }, [authState.userRole, sortConfig, textLight]);

  // Итоговая строка таблицы (адаптировано для обеих ролей)
  const totalRow = React.useMemo(() => {
    const baseRow = {
      key: 'total',
      total_plantations: totals.total,
      approved_plantations: totals.approved,
      rejected_plantations: totals.rejected,
      rejected_percentage: totals.total > 0 ? (totals.rejected / totals.total) * 100 : 0,
    };

    if (authState.userRole === "headof_region") {
      return {
        ...baseRow,
        username: 'Jami',
        full_name: '',
        phone_number: '',
        district_name: '',
        kpi_points: tableData.reduce((sum, row) => sum + (row.kpi_points || 0), 0),
        kpi_amount: tableData.reduce((sum, row) => sum + (row.kpi_amount || 0), 0),
      };
    } else {
      return {
        ...baseRow,
        region_name: 'Jami',
        district_name: '',
      };
    }
  }, [totals, authState.userRole, tableData]);

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
    return <Spin tip="Маълумотлар юкланмоқда..." size="large" className="w-full flex justify-center items-center min-h-screen" />;
  }
  if (error) {
    return <Alert message="Хатолик" description={error} type="error" showIcon className="max-w-xl mx-auto mt-10" />;
  }


  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {authState.userRole === "headof_region" 
              ? "Mening viloyatimdagi foydalanuvchilar" 
              : "Nazoratchilar bo'yicha statistika"
            }
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
                  <Option value="region">Region</Option>
                  <Option value="district">Tuman</Option>
                  <Option value="total_plantations">Plantatsiyalar — Umumiy</Option>
                  <Option value="approved_plantations">Plantatsiyalar — Tasdiqlangan</Option>
                  <Option value="rejected_plantations">Plantatsiyalar — Rad etilgan</Option>
                  <Option value="rejection_rate">Plantatsiyalar — Rad etish %</Option>
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
                title={<span style={{ color: '#9ca3af' }}>Jami foydalanuvchilar</span>}
                value={headerTotals.total_users}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Faol</span>}
                value={headerTotals.active_users}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Nofaol</span>}
                value={headerTotals.inactive_users}
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
