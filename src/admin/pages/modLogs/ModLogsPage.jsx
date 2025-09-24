import React, { useEffect, useState } from 'react';
import { Table, message, Space, Select, Input, Button } from 'antd';
import PageHeader from '../../components/common/PageHeader';
import TableLayout from '../../components/common/TableLayout';
import FilterDrawer from '../../components/common/FilterDrawer';
import { logsApi } from '../../services/adminApi';

export default function ModLogsPage() {
  const [filters, setFilters] = useState({ method: null, status: null, path: '' });
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });

  const fetchList = async (page = 1, pageSize = 50) => {
    try {
      setLoading(true);
      const params = { limit: pageSize, offset: (page - 1) * pageSize };
      if (filters.method) params.method = filters.method;
      if (filters.status) params.status = filters.status;
      if (filters.path) params.path = filters.path;
      const res = await logsApi.list(params);
      setData(res.results || []);
      setPagination({ current: page, pageSize, total: res.count || 0 });
    } catch (e) { message.error('Не удалось загрузить логи'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(1, pagination.pageSize); /* eslint-disable-next-line */ }, [filters]);

  const handleTableChange = (pag) => { fetchList(pag.current, pag.pageSize); };

  return (
    <div>
      <PageHeader title="Логи модерации" />
      <TableLayout searchPlaceholder="Поиск по пути" onSearchChange={(val) => setFilters(prev => ({ ...prev, path: val }))} onOpenFilters={() => setOpen(true)}>
        <Table
          columns={[
            { title: 'ID', dataIndex: 'id', width: 80 },
            { title: 'Время', dataIndex: 'timestamp', render: v => v ? new Date(v).toLocaleString() : '—', width: 180 },
            { title: 'Метод', dataIndex: 'method', width: 80 },
            { title: 'Путь', dataIndex: 'path' },
            { title: 'Статус', dataIndex: 'response_status', width: 90 },
            { title: 'Время (ms)', dataIndex: 'execution_time_ms', width: 110 },
          ]}
          dataSource={data}
          loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true }}
          onChange={handleTableChange}
          rowKey={(r) => r.id}
        />
      </TableLayout>

      <FilterDrawer open={open} onClose={() => setOpen(false)} onReset={() => { setFilters({ method: null, status: null, path: '' }); setOpen(false); }} onApply={() => setOpen(false)}>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Метод</div>
            <Select allowClear value={filters.method} onChange={(v) => setFilters(prev => ({ ...prev, method: v }))} style={{ width: '100%' }}>
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
              <Select.Option value="PUT">PUT</Select.Option>
              <Select.Option value="PATCH">PATCH</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
            </Select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Статус</div>
            <Select allowClear value={filters.status} onChange={(v) => setFilters(prev => ({ ...prev, status: v }))} style={{ width: '100%' }}>
              {[200,201,400,401,403,404,500].map(s => (<Select.Option key={s} value={String(s)}>{s}</Select.Option>))}
            </Select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Путь</div>
            <Input value={filters.path} onChange={(e) => setFilters(prev => ({ ...prev, path: e.target.value }))} placeholder="/api/..." />
          </div>
          <div className="text-right">
            <Button type="primary" onClick={() => fetchList(1, pagination.pageSize)}>Применить</Button>
          </div>
        </div>
      </FilterDrawer>
    </div>
  );
} 