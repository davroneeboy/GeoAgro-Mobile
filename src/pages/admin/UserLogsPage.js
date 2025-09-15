import React, { useEffect, useMemo, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Card,
  Select,
  Row,
  Col,
  Spin,
  Alert,
  Button,
  DatePicker,
  ConfigProvider,
  message,
  Tag,
  Tooltip,
  Modal,
  Input,
  Statistic,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import AuthContext from "../../context/AuthContext";
import { API_BASE_URL1 } from "../../config";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const HTTP_METHOD_COLORS = {
  GET: "blue",
  POST: "green",
  PUT: "orange",
  PATCH: "purple",
  DELETE: "red",
};

const STATUS_COLORS = {
  200: "green",
  201: "green",
  400: "orange",
  401: "red",
  403: "red",
  404: "red",
  500: "red",
};

export default function UserLogsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({
    method: null,
    status: null,
    path: "",
    ip: "",
    successful: null,
    date_from: null,
    date_to: null,
  });

  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });

  const fetchUserLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== "" && value !== undefined) {
          if ((key === "date_from" || key === "date_to") && value) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value);
          }
        }
      });
      params.append("limit", pagination.pageSize);
      params.append("offset", (pagination.current - 1) * pagination.pageSize);

      const resp = await fetch(`${API_BASE_URL1}api/logs/user/${userId}/?${params}`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();

      const results = Array.isArray(data.results) ? data.results : [];
      setLogs(results);
      setTotalCount(data.count || results.length || 0);
      setPagination((p) => ({ ...p, total: data.count || results.length || 0 }));
    } catch (e) {
      setError(e.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filters, pagination.current, pagination.pageSize]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleDateRangeChange = (dates) => {
    setFilters((prev) => ({
      ...prev,
      date_from: dates?.[0] || null,
      date_to: dates?.[1] || null,
    }));
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleExport = async () => {
    try {
      message.loading({ content: "Eksport qilinmoqda...", key: "exp" });

      // Грузим все по текущим фильтрам
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== "" && value !== undefined) {
          if ((key === "date_from" || key === "date_to") && value) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value);
          }
        }
      });
      params.append("limit", 10000);
      params.append("offset", 0);
      const resp = await fetch(`${API_BASE_URL1}api/logs/user/${userId}/?${params}`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();
      const list = Array.isArray(data.results) ? data.results : [];

      const rows = list.map((log) => ({
        ID: log.id,
        Vaqt: log.timestamp ? new Date(log.timestamp).toLocaleString("ru-RU") : "—",
        "Foydalanuvchi ID": log.user_id ?? "—",
        Metod: log.method ?? "—",
        "Yo'l": log.path ?? "—",
        "IP manzil": log.ip_address ?? "—",
        Status: log.response_status ?? "—",
        "Bajarilish vaqti (ms)": Number(log.execution_time_ms ?? 0),
        Muvaffaqiyatli: log.is_successful ? "Ha" : "Yo'q",
        Xatolik: log.is_error ? "Ha" : "Yo'q",
        "Xatolik xabari": log.error_message ?? "—",
        "Tuman ID": log.district_id ?? "—",
      }));

      const header = [
        "ID",
        "Vaqt",
        "Foydalanuvchi ID",
        "Metod",
        "Yo'l",
        "IP manzil",
        "Status",
        "Bajarilish vaqti (ms)",
        "Muvaffaqiyatli",
        "Xatolik",
        "Xatolik xabari",
        "Tuman ID",
      ];
      const ws = XLSX.utils.json_to_sheet(rows, { header });
      ws["!cols"] = [
        { width: 8 },
        { width: 20 },
        { width: 16 },
        { width: 10 },
        { width: 50 },
        { width: 16 },
        { width: 10 },
        { width: 20 },
        { width: 16 },
        { width: 10 },
        { width: 40 },
        { width: 12 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "User Logs");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `user_${userId}_logs_${new Date().toISOString().split("T")[0]}.xlsx`);
      message.success({ content: "Eksport yakunlandi", key: "exp" });
    } catch (e) {
      message.error({ content: "Eksport xatosi: " + e.message, key: "exp" });
    }
  };

  const textLight = { color: "#e5e7eb" };

  const columns = useMemo(() => [
    {
      title: <span style={textLight}>ID</span>,
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (v) => <span style={textLight}>{v}</span>,
    },
    {
      title: <span style={textLight}>Vaqt</span>,
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (timestamp) => (
        <div className="flex items-center gap-2">
          <ClockCircleOutlined style={{ color: "#9ca3af" }} />
          <span style={textLight}>{timestamp ? new Date(timestamp).toLocaleString("ru-RU") : "—"}</span>
        </div>
      ),
    },
    {
      title: <span style={textLight}>Metod</span>,
      dataIndex: "method",
      key: "method",
      width: 90,
      render: (method) => <Tag color={HTTP_METHOD_COLORS[method] || "default"}>{method}</Tag>,
    },
    {
      title: <span style={textLight}>Yo'l</span>,
      dataIndex: "path",
      key: "path",
      width: 300,
      render: (path) => (
        <div className="flex items-center gap-2">
          <GlobalOutlined style={{ color: "#9ca3af" }} />
          <span style={textLight} className="font-mono text-sm">{path || "—"}</span>
        </div>
      ),
    },
    {
      title: <span style={textLight}>IP</span>,
      dataIndex: "ip_address",
      key: "ip_address",
      width: 160,
      render: (ip) => <span style={textLight} className="font-mono text-sm">{ip || "—"}</span>,
    },
    {
      title: <span style={textLight}>Status</span>,
      dataIndex: "response_status",
      key: "response_status",
      width: 100,
      render: (s) => <Tag color={STATUS_COLORS[s] || "default"}>{s}</Tag>,
    },
    {
      title: <span style={textLight}>Vaqt (ms)</span>,
      dataIndex: "execution_time_ms",
      key: "execution_time_ms",
      width: 120,
      render: (ms) => <span className="font-mono" style={{ color: "#e5e7eb" }}>{Number(ms ?? 0)}</span>,
    },
    {
      title: <span style={textLight}>Amallar</span>,
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Tooltip title="Tafsilotlar">
          <Button type="text" icon={<EyeOutlined />} onClick={() => { setSelectedLog(record); setModalVisible(true); }} style={{ color: "#60a5fa" }} />
        </Tooltip>
      ),
    },
  ], [textLight]);

  const paginationItemStyle = {
    background: "#374151",
    color: "#e5e7eb",
    borderRadius: 6,
    padding: "2px 8px",
    border: "1px solid #4b5563",
  };
  const itemRender = (page, type, originalElement) => {
    switch (type) {
      case "page":
        return <span style={paginationItemStyle}>{page}</span>;
      case "prev":
        return <span style={paginationItemStyle}>Orqaga</span>;
      case "next":
        return <span style={paginationItemStyle}>Oldinga</span>;
      case "jump-prev":
      case "jump-next":
        return <span style={paginationItemStyle}>...</span>;
      default:
        return originalElement;
    }
  };

  if (loading && logs.length === 0) {
    return <Spin size="large" className="w-full flex justify-center items-center min-h-screen" />;
  }

  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: "#111827", minHeight: "100vh" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />} className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">Orqaga</Button>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Foydalanuvchi loglari — ID {userId}</h1>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} className="bg-green-600 hover:bg-green-700 border-green-600" size="large">Excel</Button>
            <Button icon={<ReloadOutlined />} onClick={fetchUserLogs} className="bg-blue-600 hover:bg-blue-700 border-blue-600" size="large">Yangilash</Button>
          </div>
        </div>

        {error && <Alert message="Xatolik" description={error} type="error" className="mb-4" showIcon />}

        <Card className="mb-4 sm:mb-6" bodyStyle={{ background: "#1f2937" }} style={{ background: "#1f2937", border: "1px solid #374151" }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">HTTP metod</label>
                <Select allowClear style={{ width: "100%" }} placeholder="Metodni tanlang" value={filters.method} onChange={(v) => handleFilterChange("method", v)} className="admin-logs-select">
                  <Option value="GET">GET</Option>
                  <Option value="POST">POST</Option>
                  <Option value="PUT">PUT</Option>
                  <Option value="PATCH">PATCH</Option>
                  <Option value="DELETE">DELETE</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Status</label>
                <Select allowClear style={{ width: "100%" }} placeholder="Statusni tanlang" value={filters.status} onChange={(v) => handleFilterChange("status", v)} className="admin-logs-select">
                  <Option value="200">200</Option>
                  <Option value="201">201</Option>
                  <Option value="400">400</Option>
                  <Option value="401">401</Option>
                  <Option value="403">403</Option>
                  <Option value="404">404</Option>
                  <Option value="500">500</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Yo'l</label>
                <Input placeholder="Yo'l bo'yicha" value={filters.path} onChange={(e) => handleFilterChange("path", e.target.value)} prefix={<SearchOutlined />} className="admin-logs-input" />
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">IP</label>
                <Input placeholder="IP bo'yicha" value={filters.ip} onChange={(e) => handleFilterChange("ip", e.target.value)} className="admin-logs-input" />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Muvaffaqiyat</label>
                <Select allowClear style={{ width: "100%" }} placeholder="Status" value={filters.successful} onChange={(v) => handleFilterChange("successful", v)} className="admin-logs-select">
                  <Option value={true}>Muvaffaqiyatli</Option>
                  <Option value={false}>Xatolik</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} md={16}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Davr</label>
                <RangePicker style={{ width: "100%" }} value={[filters.date_from, filters.date_to]} onChange={handleDateRangeChange} format="DD.MM.YYYY" placeholder={["Boshlanish", "Tugash"]} className="admin-logs-datepicker" />
              </div>
            </Col>
          </Row>
        </Card>

        <Row gutter={[12, 12]} className="mb-4 sm:mb-6">
          <Col xs={12} md={6}>
            <Card style={{ background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb" }} bodyStyle={{ padding: 16 }}>
              <Statistic title={<span style={{ color: "#9ca3af" }}>Jami so'rovlar</span>} value={totalCount} precision={0} valueStyle={{ color: "#e5e7eb" }} />
            </Card>
          </Col>
        </Row>

        <div className="overflow-x-auto admin-logs-table">
          <ConfigProvider locale={{ Pagination: { items_per_page: "Sahifa" } }}>
            <Table
              loading={loading}
              columns={columns}
              dataSource={logs}
              rowKey={(r) => r.id}
              scroll={{ x: "max-content" }}
              bordered
              size="small"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                position: ["bottomCenter"],
                showSizeChanger: true,
                pageSizeOptions: ["20", "50", "100", "200"],
                showQuickJumper: true,
                itemRender,
                onChange: (page, size) => {
                  setPagination({ current: page, pageSize: size, total: pagination.total });
                },
                showTotal: (total, range) => `${range[0]}-${range[1]} dan ${total} ta yozuv`,
              }}
              style={{ background: "#1f2937", color: "#e5e7eb", minWidth: 900 }}
            />
          </ConfigProvider>
        </div>

        <Modal
          title={`Log tafsilotlari`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
          style={{ top: 20 }}
          className="admin-logs-modal"
        >
          {selectedLog && (
            <div className="space-y-4" style={{ color: "#e5e7eb" }}>
              <Row gutter={16}>
                <Col span={12}>
                  <strong style={{ color: "#e5e7eb" }}>ID:</strong> <span style={{ color: "#e5e7eb" }}>{selectedLog.id}</span>
                </Col>
                <Col span={12}>
                  <strong style={{ color: "#e5e7eb" }}>Vaqt:</strong> <span style={{ color: "#e5e7eb" }}>{selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString("ru-RU") : "—"}</span>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <strong style={{ color: "#e5e7eb" }}>Metod:</strong> <Tag color={HTTP_METHOD_COLORS[selectedLog.method]}>{selectedLog.method}</Tag>
                </Col>
                <Col span={12}>
                  <strong style={{ color: "#e5e7eb" }}>Status:</strong> <Tag color={STATUS_COLORS[selectedLog.response_status]}>{selectedLog.response_status}</Tag>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <strong style={{ color: "#e5e7eb" }}>IP:</strong> <span style={{ color: "#e5e7eb" }}>{selectedLog.ip_address || "—"}</span>
                </Col>
                <Col span={12}>
                  <strong style={{ color: "#e5e7eb" }}>Vaqt (ms):</strong> <span style={{ color: "#e5e7eb" }}>{Number(selectedLog.execution_time_ms ?? 0)}</span>
                </Col>
              </Row>
              <div>
                <strong style={{ color: "#e5e7eb" }}>Yo'l:</strong>
                <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-sm" style={{ backgroundColor: "#374151", color: "#e5e7eb", border: "1px solid #4b5563" }}>
                  {selectedLog.path}
                </div>
              </div>
              {selectedLog.request_body && (
                <div>
                  <strong style={{ color: "#e5e7eb" }}>So'rov tanasi:</strong>
                  <TextArea value={selectedLog.request_body} readOnly rows={4} className="mt-1 font-mono text-sm" style={{ backgroundColor: "#374151", color: "#e5e7eb", borderColor: "#4b5563" }} />
                </div>
              )}
              {selectedLog.response_body && (
                <div>
                  <strong style={{ color: "#e5e7eb" }}>Javob tanasi:</strong>
                  <TextArea value={selectedLog.response_body} readOnly rows={6} className="mt-1 font-mono text-sm" style={{ backgroundColor: "#374151", color: "#e5e7eb", borderColor: "#4b5563" }} />
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </StatisticsLayout>
  );
} 