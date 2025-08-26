import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Table, Card, Spin, Alert, Button, ConfigProvider } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL2 } from "../../config";
import AuthContext from "../../context/AuthContext";
import { exportFarmersToExcel } from "../../utils/excelExport";

const DistrictFarmersPage = () => {
  const { districtId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [districtName, setDistrictName] = useState(location.state?.districtName || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exporting, setExporting] = useState(false);
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let effectiveId = districtId;
        // Если districtId не число, пытаемся получить id по имени
        if (isNaN(Number(effectiveId))) {
          try {
            const listRes = await fetch(`${API_BASE_URL2}api/districts/`, {
              headers: { Authorization: `Bearer ${authState.accessToken}` },
            });
            if (listRes.ok) {
              const json = await listRes.json();
              const items = Array.isArray(json?.results) ? json.results : (Array.isArray(json) ? json : []);
              const found = items.find(d => String(d?.name || '').toLowerCase() === String(decodeURIComponent(effectiveId)).toLowerCase());
              if (found?.id) effectiveId = String(found.id);
              if (!districtName && found?.name) setDistrictName(found.name);
            }
          } catch {}
        }

        if (!effectiveId || isNaN(Number(effectiveId))) {
          setError("Tuman ID topilmadi");
          return;
        }

        // Определяем имя района, если не передано
        if (!districtName) {
          try {
            const res = await fetch(`${API_BASE_URL2}api/districts/${effectiveId}/`, {
              headers: { Authorization: `Bearer ${authState.accessToken}` },
            });
            if (res.ok) {
              const d = await res.json();
              setDistrictName(d?.name || "");
            }
          } catch {}
        }

        // Загружаем статистику фермеров по району — корректный эндпоинт
        const headers = { Authorization: `Bearer ${authState.accessToken}` };
        const res = await fetch(`${API_BASE_URL2}api/statistics/farmers/?district_id=${effectiveId}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Поддерживаем разные структуры ответа
        let arr = [];
        if (Array.isArray(data)) {
          arr = data;
        } else if (Array.isArray(data?.results)) {
          arr = data.results;
        } else if (Array.isArray(data?.data)) {
          arr = data.data;
        } else if (Array.isArray(data?.items)) {
          arr = data.items;
        } else if (Array.isArray(data?.rows)) {
          arr = data.rows;
        } else if (Array.isArray(data?.farmers)) {
          arr = data.farmers;
        } else if (data?.farmers && typeof data.farmers === 'object') {
          // Структура вида { summary: {...}, farmers: { id: {...}, ... } }
          arr = Object.entries(data.farmers).map(([farmerId, rec]) => ({ farmer_id: Number(farmerId), ...rec }));
        } else if (Array.isArray(data?.by_farmers)) {
          arr = data.by_farmers;
        } else if (Array.isArray(data?.farmers_stats)) {
          arr = data.farmers_stats;
        } else {
          // Поиск первой подходящей коллекции на глубину 2
          const valuesLevel1 = data && typeof data === 'object' ? Object.values(data) : [];
          const candidate1 = valuesLevel1.find(v => Array.isArray(v) && v.length && typeof v[0] === 'object');
          if (candidate1) {
            arr = candidate1;
          } else {
            const nestedArrays = valuesLevel1
              .filter(v => v && typeof v === 'object')
              .flatMap(o => Object.values(o))
              .filter(v => Array.isArray(v) && v.length && typeof v[0] === 'object');
            if (nestedArrays.length) arr = nestedArrays[0];
          }
        }

        // Если пришёл объект вида { farmerId: { ... } }
        if (!Array.isArray(arr) || arr.length === 0) {
          if (data && typeof data === 'object') {
            const entries = Object.entries(data).filter(([, v]) => v && typeof v === 'object');
            if (entries.length) {
              arr = entries.map(([farmerId, rec]) => ({ farmer_id: Number(farmerId), ...rec }));
            }
          }
        }

        // Нормализуем поля под ожидаемые столбцы
        const normalize = (r) => {
          const name = r.name || r.farmer_name || r.farmer?.name || r.farmer?.full_name || r.company_name || '';
          const total_plantations = Number(r.total_plantations ?? r.plantations_count ?? r.total_count ?? r.count ?? 0);
          const approved_plantations = Number(r.approved_plantations ?? r.approved ?? r.approved_count ?? 0);
          const total_area = Number(r.total_area ?? r.area ?? r.total_ga ?? r.total_areas ?? 0);
          const planted_area = Number(r.planted_area ?? r.total_fruitarea ?? r.fruitarea ?? r.total_planted_area ?? 0);
          const approve_percent = Number(r.approve_percent ?? (total_plantations > 0 ? (approved_plantations / total_plantations) * 100 : 0));
          const farmer_id = r.farmer_id ?? r.id ?? r.farmer?.id;
          return { farmer_id, name, total_plantations, approved_plantations, total_area, planted_area, approve_percent };
        };
        const normalized = Array.isArray(arr) ? arr.map(normalize) : [];
        setSummaryStats(data?.summary || null);
        setRows(normalized);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [districtId, authState.accessToken]);

  // Динамические колонки на основе ключей первого объекта
  const textLight = { color: '#e5e7eb' };
  const collator = new Intl.Collator('ru', { sensitivity: 'base' });

  const columns = [
    {
      title: <span style={textLight}>Fermer</span>,
      dataIndex: 'name',
      key: 'name',
      render: (v) => <span style={textLight}>{String(v || '')}</span>,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: sortConfig.field === 'name' ? sortConfig.order : null,
    },
    {
      title: <span style={textLight}>Subyektlar jami</span>,
      dataIndex: 'total_plantations',
      key: 'total_plantations',
      render: (v) => <span style={textLight}>{Number(v || 0).toLocaleString()}</span>,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: sortConfig.field === 'total_plantations' ? sortConfig.order : null,
    },
    {
      title: <span style={textLight}>Tasdiqlangan</span>,
      dataIndex: 'approved_plantations',
      key: 'approved_plantations',
      render: (v) => <span style={textLight}>{Number(v || 0).toLocaleString()}</span>,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: sortConfig.field === 'approved_plantations' ? sortConfig.order : null,
    },
    {
      title: <span style={textLight}>Umumiy maydon (GA)</span>,
      dataIndex: 'total_area',
      key: 'total_area',
      render: (v) => <span style={textLight}>{Number(v || 0).toFixed(1)}</span>,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: sortConfig.field === 'total_area' ? sortConfig.order : null,
    },
    {
      title: <span style={textLight}>Ekilgan maydon (GA)</span>,
      dataIndex: 'planted_area',
      key: 'planted_area',
      render: (v) => <span style={textLight}>{Number(v || 0).toFixed(1)}</span>,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: sortConfig.field === 'planted_area' ? sortConfig.order : null,
    },
    {
      title: <span style={textLight}>Tasdiqlash (%)</span>,
      dataIndex: 'approve_percent',
      key: 'approve_percent',
      render: (v) => <span style={textLight}>{Number(v || 0).toFixed(0)}%</span>,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: sortConfig.field === 'approve_percent' ? sortConfig.order : null,
    },
  ];

  // Сортировка строк и итоговые суммы
  const sortedRows = React.useMemo(() => {
    if (!sortConfig?.field) return rows;
    const getVal = (row) => {
      switch (sortConfig.field) {
        case 'name': return String(row.name || '');
        case 'total_plantations': return Number(row.total_plantations || 0);
        case 'approved_plantations': return Number(row.approved_plantations || 0);
        case 'total_area': return Number(row.total_area || 0);
        case 'planted_area': return Number(row.planted_area || 0);
        case 'approve_percent': return Number(row.approve_percent || 0);
        default: return '';
      }
    };
    const data = [...rows];
    data.sort((a, b) => {
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
    return data;
  }, [rows, sortConfig]);

  const totals = summaryStats ? {
    total_plantations: Number(summaryStats.total_plantations || 0),
    approved_plantations: Number(summaryStats.total_approved_plantations || 0),
    total_area: Number(summaryStats.total_area || 0),
    planted_area: Number(summaryStats.total_planted_area || 0),
  } : sortedRows.reduce((acc, r) => ({
    total_plantations: (acc.total_plantations || 0) + Number(r.total_plantations || 0),
    approved_plantations: (acc.approved_plantations || 0) + Number(r.approved_plantations || 0),
    total_area: (acc.total_area || 0) + Number(r.total_area || 0),
    planted_area: (acc.planted_area || 0) + Number(r.planted_area || 0),
  }), {});

  const totalApprovePercent = totals.total_plantations > 0
    ? (totals.approved_plantations / totals.total_plantations) * 100
    : 0;

  const totalRow = {
    key: 'total',
    name: 'Jami',
    total_plantations: totals.total_plantations || 0,
    approved_plantations: totals.approved_plantations || 0,
    total_area: totals.total_area || 0,
    planted_area: totals.planted_area || 0,
    approve_percent: totalApprovePercent,
  };

  const dataWithTotal = [...sortedRows.map((row, idx) => ({ key: row.farmer_id ?? row.id ?? idx, ...row })), totalRow];

  if (loading) return <Spin size="large" />;
  if (error) return <Alert message={error} type="error" showIcon />;

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

  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Orqaga</Button>
          <h1 className="text-xl sm:text-2xl font-bold ml-2 sm:ml-4 text-white flex-1">
            Fermerlar statistikasi — {districtName || `ID ${districtId}`}
          </h1>
          <Button
            type="primary"
            className="bg-green-600 hover:bg-green-700 border-green-600"
            loading={exporting}
            onClick={async () => {
              try {
                setExporting(true);
                const ok = exportFarmersToExcel(rows, districtName);
                if (!ok) throw new Error();
              } catch {
                // no-op
              } finally {
                setExporting(false);
              }
            }}
          >
            Excel ga eksport
          </Button>
        </div>

        <Card styles={{ body: { background: '#1f2937' } }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <div className="overflow-x-auto controllers-table">
            <ConfigProvider locale={{ Pagination: { items_per_page: 'Sahifa' } }}>
              <Table
                columns={columns}
                dataSource={dataWithTotal}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: rows.length,
                  position: ['bottomCenter'],
                  showSizeChanger: true,
                  pageSizeOptions: ['20','50','100'],
                  showQuickJumper: true,
                  itemRender,
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  },
                  showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} yozuv`,
                }}
                locale={{ emptyText: 'Ma\'lumot yo\'q' }}
                size="small"
                className="region-statistics-table"
                style={{ background: '#1f2937', color: '#e5e7eb', minWidth: 700 }}
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
            </ConfigProvider>
          </div>
        </Card>
      </div>
    </StatisticsLayout>
  );
};

export default DistrictFarmersPage; 