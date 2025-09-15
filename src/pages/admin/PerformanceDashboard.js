import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  Card,
  Row,
  Col,
  Spin,
  Alert,
  DatePicker,
  Select,
  Button,
  Statistic,
  Table,
  ConfigProvider,
} from "antd";
import { ReloadOutlined, BarChartOutlined, LineChartOutlined } from "@ant-design/icons";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import StatisticsLayout from "../../layouts/StatisticsLayout";
import AuthContext from "../../context/AuthContext";
import { API_BASE_URL1 } from "../../config";
import NotificationsPanel from "../../components/NotificationsPanel";
import dayjs from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const { RangePicker } = DatePicker;
const { Option } = Select;

const DARK_AXIS = {
  ticks: { color: '#e5e7eb' },
  grid: { color: 'rgba(75,85,99,0.4)' },
};

export default function PerformanceDashboard() {
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const [filters, setFilters] = useState({
    date_from: null,
    date_to: null,
    method: null,
    status: null,
    rangePreset: '24h',
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      // Диапазон по умолчанию — 24 часа
      let from = filters.date_from;
      let to = filters.date_to;
      if (!from || !to) {
        const now = dayjs();
        const fromDefault = now.subtract(24, 'hour');
        from = from || fromDefault;
        to = to || now;
      }
      const fromIso = (from && typeof from?.toDate === 'function') ? from.toDate().toISOString() : new Date(from).toISOString();
      const toIso = (to && typeof to?.toDate === 'function') ? to.toDate().toISOString() : new Date(to).toISOString();
      params.append('date_from', fromIso);
      params.append('date_to', toIso);
      params.append('limit', 10000);
      params.append('offset', 0);
      if (filters.method) params.append('method', filters.method);
      if (filters.status) params.append('status', filters.status);

      const resp = await fetch(`${API_BASE_URL1}api/logs/?${params}`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();
      setLogs(Array.isArray(data.results) ? data.results : []);
    } catch (e) {
      setError(e.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.date_from, filters.date_to, filters.method, filters.status]);

  const applyPreset = (preset) => {
    const now = dayjs();
    let from;
    switch (preset) {
      case '1h': from = now.subtract(1, 'hour'); break;
      case '6h': from = now.subtract(6, 'hour'); break;
      case '24h': from = now.subtract(24, 'hour'); break;
      case '7d': from = now.subtract(7, 'day'); break;
      case '30d': from = now.subtract(30, 'day'); break;
      default: from = now.subtract(24, 'hour');
    }
    setFilters((f) => ({ ...f, date_from: from, date_to: now, rangePreset: preset }));
  };

  const toJSDate = (v) => (v && typeof v?.toDate === 'function') ? v.toDate() : (v ? new Date(v) : null);

  const bucketSize = useMemo(() => {
    const from = toJSDate(filters.date_from) || new Date(new Date().getTime() - 24*60*60*1000);
    const to = toJSDate(filters.date_to) || new Date();
    const diffMs = to - from;
    const diffH = diffMs / (1000*60*60);
    if (diffH <= 2) return 1;      // 1 минута
    if (diffH <= 48) return 15;    // 15 минут
    if (diffH <= 24*14) return 60; // 1 час
    return 60*24;                   // 1 день
  }, [filters.date_from, filters.date_to]);

  const agg = useMemo(() => {
    const toBucketKey = (ts) => {
      const d = new Date(ts);
      const minutes = Math.floor(d.getTime() / 60000);
      const bucket = Math.floor(minutes / bucketSize) * bucketSize;
      const bd = new Date(bucket * 60000);
      // Ключ как локальная строка времени
      return bd.toISOString();
    };

    const byBucket = new Map();
    const byPath = new Map();
    const byPathErrors = new Map();

    (logs || []).forEach((l) => {
      const key = toBucketKey(l.timestamp);
      if (!byBucket.has(key)) byBucket.set(key, { count: 0, sumMs: 0, e4xx: 0, e5xx: 0 });
      const b = byBucket.get(key);
      b.count += 1;
      b.sumMs += Number(l.execution_time_ms || 0);
      const status = Number(l.response_status || 0);
      if (status >= 400 && status < 500) b.e4xx += 1;
      if (status >= 500) b.e5xx += 1;

      const p = l.path || '—';
      if (!byPath.has(p)) byPath.set(p, { sumMs: 0, count: 0 });
      const pp = byPath.get(p);
      pp.sumMs += Number(l.execution_time_ms || 0);
      pp.count += 1;

      if (!byPathErrors.has(p)) byPathErrors.set(p, { errors: 0, total: 0 });
      const pe = byPathErrors.get(p);
      pe.total += 1;
      if (status >= 400) pe.errors += 1;
    });

    const labels = Array.from(byBucket.keys()).sort();
    const reqCounts = labels.map((k) => byBucket.get(k).count);
    const avgMs = labels.map((k) => {
      const v = byBucket.get(k); return v.count > 0 ? Math.round(v.sumMs / v.count) : 0;
    });
    const e4xx = labels.map((k) => byBucket.get(k).e4xx);
    const e5xx = labels.map((k) => byBucket.get(k).e5xx);

    const topSlow = Array.from(byPath.entries())
      .map(([path, v]) => ({ path, avg_ms: v.count > 0 ? v.sumMs / v.count : 0, count: v.count }))
      .sort((a, b) => b.avg_ms - a.avg_ms)
      .slice(0, 10);

    const topErrors = Array.from(byPathErrors.entries())
      .map(([path, v]) => ({ path, errors: v.errors, total: v.total, error_rate: v.total ? (v.errors / v.total) * 100 : 0 }))
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 10);

    return { labels, reqCounts, avgMs, e4xx, e5xx, topSlow, topErrors };
  }, [logs, bucketSize]);

  const avgMsAll = useMemo(() => {
    const s = logs.reduce((a,l)=>a+Number(l.execution_time_ms||0),0);
    return logs.length ? Math.round(s/logs.length) : 0;
  }, [logs]);
  const errorsAll = useMemo(() => logs.filter(l=>Number(l.response_status)>=400).length, [logs]);

  const analyzeSecurityAlerts = () => {
    if (!Array.isArray(logs) || logs.length === 0) return;
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    // 1. Всплеск 5xx
    const errors5xx = logs.filter(l => l.response_status >= 500 && l.response_status < 600 && new Date(l.timestamp) > tenMinAgo);
    if (errors5xx.length >= 10) {
      window.addMockNotification && window.addMockNotification({
        type: "security:alert",
        title: "Всплеск 5xx ошибок",
        message: `За 10 минут: ${errors5xx.length} ошибок 5xx. Проверьте стабильность API.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    // 2. Массовые 401/403
    const errorsAuth = logs.filter(l => (l.response_status === 401 || l.response_status === 403) && new Date(l.timestamp) > tenMinAgo);
    if (errorsAuth.length >= 15) {
      window.addMockNotification && window.addMockNotification({
        type: "security:alert",
        title: "Массовые ошибки авторизации",
        message: `За 10 минут: ${errorsAuth.length} ошибок 401/403. Возможна атака или массовый сбой авторизации.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    // 3. Подозрительные IP
    const ipMap = {};
    logs.forEach(l => {
      if (!l.ip || new Date(l.timestamp) <= tenMinAgo) return;
      if (!ipMap[l.ip]) ipMap[l.ip] = 0;
      if (l.response_status === 401 || l.response_status === 403) ipMap[l.ip]++;
    });
    Object.entries(ipMap).forEach(([ip, count]) => {
      if (count >= 7) {
        window.addMockNotification && window.addMockNotification({
          type: "security:alert",
          title: "Подозрительная активность с IP",
          message: `IP ${ip} за 10 минут: ${count} ошибок 401/403. Возможна атака перебора паролей.`,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    });
  };

  if (loading && logs.length === 0) {
    return <Spin tip="Ma'lumotlar yuklanmoqda..." size="large" className="w-full flex justify-center items-center min-h-screen" />;
  }

  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2"><BarChartOutlined /> Performance</h1>
          <div className="flex gap-2">
            <Button icon={<ReloadOutlined />} onClick={fetchLogs} className="bg-blue-600 hover:bg-blue-700 border-blue-600" size="large">Yangilash</Button>
            <Button onClick={analyzeSecurityAlerts} icon={<BarChartOutlined />} style={{ marginBottom: 12 }}>
              Проверить аномалии безопасности
            </Button>
          </div>
        </div>

        {error && <Alert message="Xatolik" description={error} type="error" className="mb-4" showIcon />}

        <Card className="mb-4 sm:mb-6" bodyStyle={{ background: '#1f2937' }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={10}>
              <label className="block mb-2 text-gray-200">Davr</label>
              <RangePicker
                style={{ width: '100%' }}
                value={[filters.date_from, filters.date_to]}
                onChange={(vals) => setFilters((f) => ({ ...f, date_from: vals?.[0] || null, date_to: vals?.[1] || null }))}
                format="DD.MM.YYYY HH:mm"
                showTime
                className="admin-logs-datepicker"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {['1h','6h','24h','7d','30d'].map(p => (
                  <Button key={p} size="small" onClick={() => applyPreset(p)} className={`bg-gray-700 border-gray-600 text-white hover:bg-gray-600 ${filters.rangePreset===p?'!bg-green-600 !border-green-600':''}`}>{p}</Button>
                ))}
              </div>
            </Col>
            <Col xs={24} md={7}>
              <label className="block mb-2 text-gray-200">HTTP metod</label>
              <Select allowClear style={{ width: '100%' }} placeholder="Metod" value={filters.method} onChange={(v)=>setFilters((f)=>({...f, method:v}))} className="admin-logs-select">
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="PATCH">PATCH</Option>
                <Option value="DELETE">DELETE</Option>
              </Select>
            </Col>
            <Col xs={24} md={7}>
              <label className="block mb-2 text-gray-200">Status</label>
              <Select allowClear style={{ width: '100%' }} placeholder="Status" value={filters.status} onChange={(v)=>setFilters((f)=>({...f, status:v}))} className="admin-logs-select">
                {[200,201,400,401,403,404,500].map(s => <Option key={s} value={String(s)}>{s}</Option>)}
              </Select>
            </Col>
          </Row>
        </Card>

        <Row gutter={[12,12]} className="mb-4 sm:mb-6">
          <Col xs={24} md={8}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <Statistic title={<span style={{ color: '#9ca3af' }}>Jami so'rovlar</span>} value={logs.length} valueStyle={{ color: '#e5e7eb' }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <Statistic title={<span style={{ color: '#9ca3af' }}>O'rtacha bajarilish vaqti (ms)</span>} value={avgMsAll} valueStyle={{ color: '#e5e7eb' }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <Statistic title={<span style={{ color: '#9ca3af' }}>Xatoliklar (4xx+5xx)</span>} value={errorsAll} valueStyle={{ color: '#e5e7eb' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12,12]}>
          <Col xs={24} lg={12}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <div className="text-white mb-2 flex items-center gap-2"><LineChartOutlined /> So'rovlar dinamikasi</div>
              <Line
                data={{
                  labels: agg.labels.map(l=>new Date(l).toLocaleString('ru-RU')),
                  datasets: [{ label: 'Requests', data: agg.reqCounts, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.3)', tension: 0.2 }]
                }}
                options={{ responsive:true, plugins:{ legend:{ labels:{ color:'#e5e7eb' } } }, scales:{ x: DARK_AXIS, y: DARK_AXIS } }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <div className="text-white mb-2 flex items-center gap-2"><LineChartOutlined /> O'rtacha vaqt (ms)</div>
              <Line
                data={{
                  labels: agg.labels.map(l=>new Date(l).toLocaleString('ru-RU')),
                  datasets: [{ label: 'Avg ms', data: agg.avgMs, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.3)', tension: 0.2 }]
                }}
                options={{ responsive:true, plugins:{ legend:{ labels:{ color:'#e5e7eb' } } }, scales:{ x: DARK_AXIS, y: DARK_AXIS } }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12,12]} className="mt-4">
          <Col xs={24}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <div className="text-white mb-2 flex items-center gap-2"><BarChartOutlined /> Xatoliklar (4xx/5xx)</div>
              <Bar
                data={{
                  labels: agg.labels.map(l=>new Date(l).toLocaleString('ru-RU')),
                  datasets: [
                    { label: '4xx', data: agg.e4xx, backgroundColor: '#f59e0b' },
                    { label: '5xx', data: agg.e5xx, backgroundColor: '#ef4444' },
                  ]
                }}
                options={{ responsive:true, plugins:{ legend:{ labels:{ color:'#e5e7eb' } } }, scales:{ x: DARK_AXIS, y: DARK_AXIS } }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12,12]} className="mt-4">
          <Col xs={24} lg={12}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <div className="text-white mb-3">Eng sekin yo'llar (AVG ms)</div>
              <div className="overflow-x-auto admin-logs-table">
                <ConfigProvider>
                  <Table
                    size="small"
                    pagination={{ position:['bottomCenter'], pageSize:10 }}
                    columns={[
                      { title: <span style={{color:'#e5e7eb'}}>Yo'l</span>, dataIndex:'path', key:'path', render:(v)=><span style={{color:'#e5e7eb'}} className="font-mono text-xs">{v}</span> },
                      { title: <span style={{color:'#e5e7eb'}}>AVG ms</span>, dataIndex:'avg_ms', key:'avg_ms', render:(v)=><span style={{color:'#e5e7eb'}}>{Math.round(v)}</span> },
                      { title: <span style={{color:'#e5e7eb'}}>Count</span>, dataIndex:'count', key:'count', render:(v)=><span style={{color:'#e5e7eb'}}>{v}</span> },
                    ]}
                    dataSource={agg.topSlow.map((r,i)=>({ key:i, ...r }))}
                    bordered
                  />
                </ConfigProvider>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151' }} bodyStyle={{ padding: 16 }}>
              <div className="text-white mb-3">Eng ko'p xatoliklar</div>
              <div className="overflow-x-auto admin-logs-table">
                <ConfigProvider>
                  <Table
                    size="small"
                    pagination={{ position:['bottomCenter'], pageSize:10 }}
                    columns={[
                      { title: <span style={{color:'#e5e7eb'}}>Yo'l</span>, dataIndex:'path', key:'path', render:(v)=><span style={{color:'#e5e7eb'}} className="font-mono text-xs">{v}</span> },
                      { title: <span style={{color:'#e5e7eb'}}>Errors</span>, dataIndex:'errors', key:'errors', render:(v)=><span style={{color:'#e5e7eb'}}>{v}</span> },
                      { title: <span style={{color:'#e5e7eb'}}>Total</span>, dataIndex:'total', key:'total', render:(v)=><span style={{color:'#e5e7eb'}}>{v}</span> },
                      { title: <span style={{color:'#e5e7eb'}}>Error %</span>, dataIndex:'error_rate', key:'error_rate', render:(v)=><span style={{color:'#e5e7eb'}}>{v.toFixed(1)}%</span> },
                    ]}
                    dataSource={agg.topErrors.map((r,i)=>({ key:i, ...r }))}
                    bordered
                  />
                </ConfigProvider>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
      <NotificationsPanel />
    </StatisticsLayout>
  );
} 