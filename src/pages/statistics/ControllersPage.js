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
} from "antd";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1 } from "../../config";
import AuthContext from "../../context/AuthContext";
import { fetchStatisticsData } from "../../utils/apiUtils";

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
  13: "Xorazm",
};

const ControllersPage = () => {
  console.log("ControllersPage component rendered"); // Debug log 1

  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    regions: [],
  });
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });

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

        const data = await fetchStatisticsData(url, authState.accessToken);
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
  }, [filters, authState.accessToken]);

  console.log("Current state:", { loading, error, statistics }); // Debug log 7

  const handleResetFilters = () => {
    setFilters({
      regions: [],
    });
  };

  // Error alert will be rendered inside the layout below

  // API возвращает массив пользователей; соберём строки таблицы напрямую
  const tableData = (Array.isArray(statistics) ? statistics : []).map((user, idx) => ({
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

  const formatDistricts = (listLike) => {
    if (listLike == null) return '—';
    const list = Array.isArray(listLike) ? listLike : [listLike];
    const normalized = list
      .map((d) => {
        if (d == null) return '';
        if (typeof d === 'string') return d.trim();
        if (typeof d === 'number') return String(d);
        if (typeof d === 'object') {
          return d.name || d.title || d.label || d.district || d.district_name || String(d.id ?? '');
        }
        return '';
      })
      .map((s) => s?.trim())
      .filter(Boolean);
    return normalized.join(', ') || '—';
  };

  const extractDistrictNames = (record) => {
    const raw =
      record?.districts ??
      record?.district ??
      record?.location?.districts ??
      record?.location?.district ??
      record?.district_names ??
      record?.location?.district_name ??
      record?.location?.districts_names ??
      null;

    if (typeof raw === 'string' && raw.includes(',')) {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return raw;
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
          return mapRegion(record.region ?? record.location?.region) || '';
        case 'districts':
          return formatDistricts(extractDistrictNames(record)) || '';
        case 'total_plantations':
          return Number(record.plantations_stats?.total || 0);
        case 'approved_plantations':
          return Number(record.plantations_stats?.approved || 0);
        case 'rejected_plantations':
          return Number(record.plantations_stats?.rejected || 0);
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
      sortOrder: sortConfig.field === 'full_name' ? sortConfig.order : null,
      render: (_value, record) => (
        <span style={textLight}>{`${record.first_name || ""} ${record.last_name || ""}`}</span>
      ),
    },
    {
      title: <span style={textLight}>Login</span>,
      dataIndex: "username",
      key: "username",
      sorter: true,
      sortOrder: sortConfig.field === 'username' ? sortConfig.order : null,
      render: (value) => <span style={textLight}>{value}</span>,
    },
    {
      title: <span style={textLight}>Telefon raqami</span>,
      dataIndex: "phone_number",
      key: "phone",
      sorter: true,
      sortOrder: sortConfig.field === 'phone' ? sortConfig.order : null,
      render: (value) => <span style={textLight}>{value}</span>,
    },
    {
      title: <span style={textLight}>Region</span>,
      key: "region",
      sorter: true,
      sortOrder: sortConfig.field === 'region' ? sortConfig.order : null,
      render: (_v, record) => (
        <span style={textLight}>{mapRegion(record.region ?? record.location?.region)}</span>
      ),
    },
    {
      title: <span style={textLight}>Tumanlar</span>,
      key: "districts",
      sorter: true,
      sortOrder: sortConfig.field === 'districts' ? sortConfig.order : null,
      render: (_v, record) => {
        const list = extractDistrictNames(record);
        return <span style={textLight}>{formatDistricts(list)}</span>;
      },
    },
    {
      title: <span style={textLight}>Plantatsiyalar</span>,
      children: [
        {
          title: <span style={textLight}>Umumiy</span>,
          dataIndex: ["plantations_stats", "total"],
          key: "total_plantations",
          sorter: true,
          sortOrder: sortConfig.field === 'total_plantations' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Tasdiqlangan</span>,
          dataIndex: ["plantations_stats", "approved"],
          key: "approved_plantations",
          sorter: true,
          sortOrder: sortConfig.field === 'approved_plantations' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
        },
        {
          title: <span style={textLight}>Rad etilgan</span>,
          dataIndex: ["plantations_stats", "rejected"],
          key: "rejected_plantations",
          sorter: true,
          sortOrder: sortConfig.field === 'rejected_plantations' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{v ?? 0}</span>,
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
          sortOrder: sortConfig.field === 'kpi_points' ? sortConfig.order : null,
          render: (value) => <span style={textLight}>{(value || 0).toFixed(1)}</span>,
        },
        {
          title: <span style={textLight}>Summa</span>,
          dataIndex: ["kpi_current", "amount"],
          key: "kpi_amount",
          sorter: true,
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
    },
    kpi_current: {
      points: totals.kpiPoints,
      amount: totals.kpiAmount,
    },
  };

  const dataWithTotal = [...sortedTableData, totalRow];

  // Show loading state
  if (loading) {
    console.log("Showing loading state"); // Debug log 8
    return (
      <StatisticsLayout>
        <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
          <Spin size="large" />
        </div>
      </StatisticsLayout>
    );
  }

  console.log("Rendering table with data:", dataWithTotal); // Debug log 10

  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Nazoratchilar bo'yicha statistika
          </h1>
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

        <Card className="mb-4 sm:mb-6" bodyStyle={{ background: '#1f2937' }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
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
                  <Option value="full_name">F.I.Sh</Option>
                  <Option value="username">Login</Option>
                  <Option value="phone">Telefon raqami</Option>
                  <Option value="region">Region</Option>
                  <Option value="districts">Tumanlar</Option>
                  <Option value="total_plantations">Plantatsiyalar — Umumiy</Option>
                  <Option value="approved_plantations">Plantatsiyalar — Tasdiqlangan</Option>
                  <Option value="rejected_plantations">Plantatsiyalar — Rad etilgan</Option>
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
                title={<span style={{ color: '#9ca3af' }}>Rad etilgan</span>}
                value={totals.rejected}
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
            style={{ background: '#1f2937', color: '#e5e7eb', minWidth: 700 }}
          />
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default ControllersPage;
