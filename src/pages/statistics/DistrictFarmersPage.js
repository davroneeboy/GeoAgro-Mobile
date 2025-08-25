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
  const [districtName, setDistrictName] = useState(location.state?.districtName || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exporting, setExporting] = useState(false);

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

        // Загружаем статистику фермеров по району
        const url = `${API_BASE_URL2}api/statistics/farmers/?district_id=${effectiveId}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${authState.accessToken}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

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

        setRows(arr);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [districtId, authState.accessToken]);

  if (loading) return <Spin size="large" />;
  if (error) return <Alert message={error} type="error" showIcon />;

  // Динамические колонки на основе ключей первого объекта
  const textLight = { color: '#e5e7eb' };
  const columns = [
    {
      title: <span style={textLight}>Fermer</span>,
      dataIndex: 'name',
      key: 'name',
      render: (v) => <span style={textLight}>{String(v || '')}</span>,
      sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ru'),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: <span style={textLight}>Subyektlar jami</span>,
      dataIndex: 'total_plantations',
      key: 'total_plantations',
      render: (v) => <span style={textLight}>{Number(v || 0).toLocaleString()}</span>,
      sorter: (a, b) => Number(a.total_plantations || 0) - Number(b.total_plantations || 0),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: <span style={textLight}>Tasdiqlangan</span>,
      dataIndex: 'approved_plantations',
      key: 'approved_plantations',
      render: (v) => <span style={textLight}>{Number(v || 0).toLocaleString()}</span>,
      sorter: (a, b) => Number(a.approved_plantations || 0) - Number(b.approved_plantations || 0),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: <span style={textLight}>Umumiy maydon (GA)</span>,
      dataIndex: 'total_area',
      key: 'total_area',
      render: (v) => <span style={textLight}>{Number(v || 0).toFixed(1)}</span>,
      sorter: (a, b) => Number(a.total_area || 0) - Number(b.total_area || 0),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: <span style={textLight}>Ekilgan maydon (GA)</span>,
      dataIndex: 'planted_area',
      key: 'planted_area',
      render: (v) => <span style={textLight}>{Number(v || 0).toFixed(1)}</span>,
      sorter: (a, b) => Number(a.planted_area || 0) - Number(b.planted_area || 0),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: <span style={textLight}>Tasdiqlash (%)</span>,
      dataIndex: 'approve_percent',
      key: 'approve_percent',
      render: (v) => <span style={textLight}>{Number(v || 0).toFixed(0)}%</span>,
      sorter: (a, b) => Number(a.approve_percent || 0) - Number(b.approve_percent || 0),
      sortDirections: ['ascend', 'descend'],
    },
  ];

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
                dataSource={rows.map((row, idx) => ({ key: row.farmer_id ?? row.id ?? idx, ...row }))}
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
              />
            </ConfigProvider>
          </div>
        </Card>
      </div>
    </StatisticsLayout>
  );
};

export default DistrictFarmersPage; 