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
  Tag,
  Tooltip,
  Modal,
  Input,
} from "antd";
import { 
  DownloadOutlined, 
  EyeOutlined, 
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  UserOutlined,
  GlobalOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import AuthContext from "../../context/AuthContext";
import { handleApiError } from "../../utils/apiUtils";
import { API_BASE_URL1 } from "../../config";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const HTTP_METHOD_COLORS = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  PATCH: 'purple',
  DELETE: 'red',
};

const STATUS_COLORS = {
  200: 'green',
  201: 'green',
  400: 'orange',
  401: 'red',
  403: 'red',
  404: 'red',
  500: 'red',
};

const AdminLogsPage = () => {
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [filters, setFilters] = useState({
    method: null,
    status: null,
    path: '',
    ip: '',
    successful: null,
    district_id: null,
    date_from: null,
    date_to: null,
  });
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  const [exporting, setExporting] = useState(false);

  // Загрузка логов
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      // Добавляем фильтры
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '' && value !== undefined) {
          if (key === 'date_from' || key === 'date_to') {
            if (value) {
              params.append(key, value.toISOString());
            }
          } else {
            params.append(key, value);
          }
        }
      });
      
      // Пагинация
      params.append('limit', pagination.pageSize);
      params.append('offset', (pagination.current - 1) * pagination.pageSize);
      
      const response = await fetch(`${API_BASE_URL1}api/logs/?${params}`, {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLogs(data.results || []);
      setTotalCount(data.count || 0);
      setPagination(prev => ({ ...prev, total: data.count || 0 }));
      
    } catch (err) {
      setError(handleApiError(err));
      message.error('Логи загрузить не удалось');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.current, pagination.pageSize]);

  // Обработчики фильтров
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({
      ...prev,
      date_from: dates?.[0] || null,
      date_to: dates?.[1] || null,
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      method: null,
      status: null,
      path: '',
      ip: '',
      successful: null,
      district_id: null,
      date_from: null,
      date_to: null,
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Просмотр деталей лога
  const handleViewLog = (log) => {
    setSelectedLog(log);
    setModalVisible(true);
  };

  // Экспорт в Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '' && value !== undefined) {
          if (key === 'date_from' || key === 'date_to') {
            if (value) params.append(key, value.toISOString());
          } else {
            params.append(key, value);
          }
        }
      });
      params.append('limit', 10000);
      params.append('offset', 0);
      const response = await fetch(`${API_BASE_URL1}api/logs/?${params}`, {
        headers: { 'Authorization': `Bearer ${authState.accessToken}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();

      const rows = (data.results || []).map((log) => ({
        ID: log.id,
        Vaqt: log.timestamp ? new Date(log.timestamp).toLocaleString('ru-RU') : '—',
        'Foydalanuvchi ID': log.user_id ?? '—',
        Metod: log.method ?? '—',
        "Yo'l": log.path ?? '—',
        'IP manzil': log.ip_address ?? '—',
        Status: log.response_status ?? '—',
        'Bajarilish vaqti (ms)': Number(log.execution_time_ms ?? 0),
        Muvaffaqiyatli: log.is_successful ? 'Ha' : 'Yo\'q',
        Xatolik: log.is_error ? 'Ha' : 'Yo\'q',
        'Xatolik xabari': log.error_message ?? '—',
        'Tuman ID': log.district_id ?? '—',
      }));

      const header = [
        'ID','Vaqt','Foydalanuvchi ID','Metod',"Yo'l",'IP manzil','Status','Bajarilish vaqti (ms)','Muvaffaqiyatli','Xatolik','Xatolik xabari','Tuman ID'
      ];
      const ws = XLSX.utils.json_to_sheet(rows, { header });
      ws['!cols'] = [
        { width: 8 },{ width: 20 },{ width: 16 },{ width: 10 },{ width: 50 },{ width: 16 },{ width: 10 },{ width: 20 },{ width: 14 },{ width: 10 },{ width: 40 },{ width: 12 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Admin Logs');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `admin_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
      message.success('Логи экспортированы');
    } catch (err) {
      message.error('Ошибка экспорта: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Подготовка данных для таблицы
  const tableData = logs.map((log, index) => ({
    key: log.id || index,
    ...log,
  }));

  const textLight = { color: '#e5e7eb' };

  // Колонки таблицы
  const columns = [
    {
      title: <span style={textLight}>ID</span>,
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => <span style={textLight}>{id}</span>,
    },
    {
      title: <span style={textLight}>Vaqt</span>,
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp) => (
        <div className="flex items-center gap-2">
          <ClockCircleOutlined style={{ color: '#9ca3af' }} />
          <span style={textLight}>
            {new Date(timestamp).toLocaleString('ru-RU')}
          </span>
        </div>
      ),
    },
    {
      title: <span style={textLight}>Foydalanuvchi</span>,
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      render: (userId) => (
        <div className="flex items-center gap-2">
          <UserOutlined style={{ color: '#9ca3af' }} />
          {userId ? (
            <Link to={`/admin/logs/user/${userId}`} className="text-green-400 hover:text-green-300">
              <span style={textLight}>{userId}</span>
            </Link>
          ) : (
            <span style={textLight}>—</span>
          )}
        </div>
      ),
    },
    {
      title: <span style={textLight}>Metod</span>,
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method) => (
        <Tag color={HTTP_METHOD_COLORS[method] || 'default'} className="font-mono">
          {method}
        </Tag>
      ),
    },
    {
      title: <span style={textLight}>Yo'l</span>,
      dataIndex: 'path',
      key: 'path',
      width: 250,
      render: (path) => (
        <div className="flex items-center gap-2">
          <GlobalOutlined style={{ color: '#9ca3af' }} />
          <span style={textLight} className="font-mono text-sm">{path}</span>
        </div>
      ),
    },
    {
      title: <span style={textLight}>IP</span>,
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
      render: (ip) => <span style={textLight} className="font-mono text-sm">{ip}</span>,
    },
    {
      title: <span style={textLight}>Status</span>,
      dataIndex: 'response_status',
      key: 'response_status',
      width: 80,
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'} className="font-mono">
          {status}
        </Tag>
      ),
    },
    {
      title: <span style={textLight}>Vaqt (ms)</span>,
      dataIndex: 'execution_time_ms',
      key: 'execution_time_ms',
      width: 100,
      render: (time) => (
        <span className={`font-mono ${
          time > 1000 ? 'text-red-400' : 
          time > 500 ? 'text-yellow-400' : 
          'text-green-400'
        }`}>
          {time}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Holat</span>,
      key: 'status',
      width: 100,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record.is_successful ? (
            <CheckCircleOutlined style={{ color: '#10b981' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#ef4444' }} />
          )}
          <span style={textLight}>
            {record.is_successful ? 'Muvaffaq' : 'Xatolik'}
          </span>
        </div>
      ),
    },
    {
      title: <span style={textLight}>Amallar</span>,
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="Tafsilotlarni ko'rish">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewLog(record)}
            style={{ color: '#60a5fa' }}
          />
        </Tooltip>
      ),
    },
  ];

  // Статистика
  const stats = {
    total: totalCount,
    successful: logs.filter(log => log.is_successful).length,
    errors: logs.filter(log => log.is_error).length,
    avgTime: logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.execution_time_ms, 0) / logs.length) : 0,
  };

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

  if (loading && logs.length === 0) {
    return <Spin size="large" className="w-full flex justify-center items-center min-h-screen" />;
  }

  return (
    <StatisticsLayout>
      <div className="p-3 sm:p-4" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-white">
            Admin loglar
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
              Excel ga eksport
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchLogs}
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 border-blue-600"
              size="large"
            >
              Yangilash
            </Button>
            <Button type="primary" danger onClick={handleResetFilters}>
              Filtrni tozalash
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
            <Col xs={24} md={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">HTTP metod</label>
                <Select
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="Metodni tanlang"
                  value={filters.method}
                  onChange={(value) => handleFilterChange('method', value)}
                  className="admin-logs-select"
                >
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
                <label className="block mb-2 text-gray-200">Status kod</label>
                <Select
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="Statusni tanlang"
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  className="admin-logs-select"
                >
                  <Option value="200">200 - OK</Option>
                  <Option value="201">201 - Created</Option>
                  <Option value="400">400 - Bad Request</Option>
                  <Option value="401">401 - Unauthorized</Option>
                  <Option value="403">403 - Forbidden</Option>
                  <Option value="404">404 - Not Found</Option>
                  <Option value="500">500 - Server Error</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Yo'l</label>
                <Input
                  placeholder="Yo'l bo'yicha filtr"
                  value={filters.path}
                  onChange={(e) => handleFilterChange('path', e.target.value)}
                  prefix={<SearchOutlined />}
                  className="admin-logs-input"
                />
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">IP manzil</label>
                <Input
                  placeholder="IP bo'yicha filtr"
                  value={filters.ip}
                  onChange={(e) => handleFilterChange('ip', e.target.value)}
                  className="admin-logs-input"
                />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Muvaffaqiyat</label>
                <Select
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="Statusni tanlang"
                  value={filters.successful}
                  onChange={(value) => handleFilterChange('successful', value)}
                  className="admin-logs-select"
                >
                  <Option value={true}>Muvaffaqiyatli</Option>
                  <Option value={false}>Xatoliklar</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} md={16}>
              <div className="mb-2 sm:mb-4">
                <label className="block mb-2 text-gray-200">Davr</label>
                <RangePicker
                  style={{ width: "100%" }}
                  value={[filters.date_from, filters.date_to]}
                  onChange={handleDateRangeChange}
                  format="DD.MM.YYYY"
                  placeholder={["Boshlang'ich sana", "Tugash sanasi"]}
                  className="admin-logs-datepicker"
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Summary Cards */}
        <Row gutter={[12, 12]} className="mb-3 sm:mb-4">
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Jami so'rovlar</span>}
                value={stats.total}
                precision={0}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Muvaffaqiyatli</span>}
                value={stats.successful}
                precision={0}
                valueStyle={{ color: '#10b981' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Xatoliklar</span>}
                value={stats.errors}
                precision={0}
                valueStyle={{ color: '#ef4444' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>O'rtacha vaqt</span>}
                value={stats.avgTime}
                precision={0}
                suffix="ms"
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Table */}
        <div className="overflow-x-auto admin-logs-table">
          <ConfigProvider 
            locale={{ Pagination: { items_per_page: 'Sahifadagi yozuvlar' } }}
            theme={{
              components: {
                Table: {
                  headerBg: '#1f2937',
                  headerColor: '#e5e7eb',
                  bodyBg: '#1f2937',
                  rowHoverBg: '#374151',
                  borderColor: '#374151',
                  headerSplitColor: '#374151',
                },
                Pagination: {
                  itemBg: '#374151',
                  itemInputBg: '#374151',
                  itemLinkBg: '#374151',
                  itemActiveBg: '#059669',
                  itemActiveColorDisabled: '#ffffff',
                },
              },
            }}
          >
            <Table
              loading={loading}
              columns={columns}
              dataSource={tableData}
              scroll={{ x: "max-content" }}
              bordered
              size="small"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                position: ['bottomCenter'],
                showSizeChanger: true,
                pageSizeOptions: ['20', '50', '100', '200'],
                showQuickJumper: true,
                showLessItems: false,
                itemRender,
                onChange: (page, size) => {
                  setPagination(prev => ({ ...prev, current: page, pageSize: size }));
                },
                showTotal: (total, range) => `${range[0]}-${range[1]} dan ${total} ta yozuv`,
              }}
              className="admin-logs-table"
              style={{ 
                background: '#1f2937', 
                color: '#e5e7eb', 
                minWidth: 1200 
              }}
              components={{
                body: {
                  wrapper: (props) => (
                    <tbody 
                      {...props} 
                      style={{ 
                        ...props.style, 
                        backgroundColor: '#1f2937',
                        color: '#e5e7eb'
                      }} 
                    />
                  ),
                  row: (props) => (
                    <tr 
                      {...props} 
                      style={{ 
                        ...props.style, 
                        backgroundColor: '#1f2937',
                        color: '#e5e7eb'
                      }} 
                    />
                  ),
                },
                header: {
                  wrapper: (props) => (
                    <thead 
                      {...props} 
                      style={{ 
                        ...props.style, 
                        backgroundColor: '#1f2937',
                        color: '#e5e7eb'
                      }} 
                    />
                  ),
                  row: (props) => (
                    <tr 
                      {...props} 
                      style={{ 
                        ...props.style, 
                        backgroundColor: '#1f2937',
                        color: '#e5e7eb'
                      }} 
                    />
                  ),
                },
              }}
            />
          </ConfigProvider>
        </div>

        {/* Modal для просмотра деталей лога */}
        <Modal
          title="Log tafsilotlari"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
          style={{ top: 20 }}
          className="admin-logs-modal"
          styles={{
            content: {
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
            },
            header: {
              backgroundColor: '#1f2937',
              borderBottom: '1px solid #374151',
              color: '#e5e7eb',
            },
            body: {
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
            },
          }}
        >
          {selectedLog && (
            <div className="space-y-4" style={{ color: '#e5e7eb' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <strong style={{ color: '#e5e7eb' }}>ID:</strong> <span style={{ color: '#e5e7eb' }}>{selectedLog.id}</span>
                </Col>
                <Col span={12}>
                  <strong style={{ color: '#e5e7eb' }}>Vaqt:</strong> <span style={{ color: '#e5e7eb' }}>{new Date(selectedLog.timestamp).toLocaleString('ru-RU')}</span>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <strong style={{ color: '#e5e7eb' }}>Foydalanuvchi ID:</strong> <span style={{ color: '#e5e7eb' }}>{selectedLog.user_id || '—'}</span>
                </Col>
                <Col span={12}>
                  <strong style={{ color: '#e5e7eb' }}>Tuman ID:</strong> <span style={{ color: '#e5e7eb' }}>{selectedLog.district_id || '—'}</span>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <strong style={{ color: '#e5e7eb' }}>Metod:</strong> <Tag color={HTTP_METHOD_COLORS[selectedLog.method]}>{selectedLog.method}</Tag>
                </Col>
                <Col span={12}>
                  <strong style={{ color: '#e5e7eb' }}>Status:</strong> <Tag color={STATUS_COLORS[selectedLog.response_status]}>{selectedLog.response_status}</Tag>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <strong style={{ color: '#e5e7eb' }}>IP manzil:</strong> <span style={{ color: '#e5e7eb' }}>{selectedLog.ip_address}</span>
                </Col>
                <Col span={12}>
                  <strong style={{ color: '#e5e7eb' }}>Bajarilish vaqti:</strong> <span style={{ color: '#e5e7eb' }}>{selectedLog.execution_time_ms} ms</span>
                </Col>
              </Row>
              <div>
                <strong style={{ color: '#e5e7eb' }}>Yo'l:</strong>
                <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-sm" style={{ backgroundColor: '#374151', color: '#e5e7eb', border: '1px solid #4b5563' }}>
                  {selectedLog.path}
                </div>
              </div>
              {selectedLog.request_body && (
                <div>
                  <strong style={{ color: '#e5e7eb' }}>So'rov tanasi:</strong>
                  <TextArea
                    value={selectedLog.request_body}
                    readOnly
                    rows={4}
                    className="mt-1 font-mono text-sm"
                    style={{ backgroundColor: '#374151', color: '#e5e7eb', borderColor: '#4b5563' }}
                  />
                </div>
              )}
              {selectedLog.response_body && (
                <div>
                  <strong style={{ color: '#e5e7eb' }}>Javob tanasi:</strong>
                  <TextArea
                    value={selectedLog.response_body}
                    readOnly
                    rows={6}
                    className="mt-1 font-mono text-sm"
                    style={{ backgroundColor: '#374151', color: '#e5e7eb', borderColor: '#4b5563' }}
                  />
                </div>
              )}
              {selectedLog.error_message && (
                <div>
                  <strong style={{ color: '#e5e7eb' }}>Xatolik xabari:</strong>
                  <div className="bg-red-50 border border-red-200 p-2 rounded mt-1 text-red-800" style={{ backgroundColor: '#7f1d1d', color: '#fecaca', border: '1px solid #dc2626' }}>
                    {selectedLog.error_message}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </StatisticsLayout>
  );
};

export default AdminLogsPage;
