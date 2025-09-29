import React, { useEffect, useState } from 'react';
import { Button, DatePicker, Input, Select, Table, Tag, message } from 'antd';
import { moderationApi } from '../../services/adminApi';
import PageHeader from '../../components/common/PageHeader';
import { Link } from 'react-router-dom';
import { formatNumberShort } from '../../utils/format';
import { exportSimpleSheet } from '../../../utils/excelExport';

const statusOptions = [
  { value: 'pending', label: 'На модерации' },
  { value: 'approved', label: 'Одобрено' },
  { value: 'rejected', label: 'Отклонено' },
  { value: 'all', label: 'Все' },
];

export default function ModerationQueue() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ status: 'pending', region: undefined, district: undefined, search: '', date_from: undefined, date_to: undefined });
  const [sorting, setSorting] = useState({ sort_by: undefined, sort_direction: undefined });

  const fetchList = async (page = 1, pageSize = 20, f = filters, s = sorting) => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };
      if (f.status) params.status = f.status;
      if (f.region) params.region = f.region;
      if (f.district) params.district = f.district;
      if (f.search) params.search = f.search;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;
      if (s.sort_by) params.sort_by = s.sort_by;
      if (s.sort_direction) params.sort_direction = s.sort_direction;
      const res = await moderationApi.queue(params);
      setData(res.results || []);
      setPagination({ current: page, pageSize, total: res.count || 0 });
      setSelectedRowKeys([]);
    } catch (e) {
      message.error('Не удалось загрузить очередь модерации');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1, pagination.pageSize, filters, sorting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', sorter: true, width: 90 },
    { title: 'Фермер', dataIndex: 'farmer_name', render: (v, r) => <div>{v || '—'}{r.farmer_phone ? <div className="text-xs text-gray-500">{r.farmer_phone}</div> : null}</div> },
    { title: 'Район', dataIndex: 'district_name' },
    { title: 'Площадь', dataIndex: 'total_area', align: 'right', render: (v) => formatNumberShort(v) },
    { title: 'Посажено', dataIndex: 'total_planted_area', align: 'right', render: (v) => formatNumberShort(v) },
    { title: 'Статус', dataIndex: 'status', render: (s) => <Tag color={s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'default'}>{s}</Tag> },
    { title: 'Ожидание (ч)', dataIndex: 'waiting_time_hours', align: 'right', render: (v) => formatNumberShort(v) },
    { title: 'Создано', dataIndex: 'created_at', render: (v) => v ? new Date(v).toLocaleString() : '—' },
    { title: 'Действия', key: 'actions', render: (_, r) => <Link to={`/admin/moderation/${r.id}`}><Button size="small">Подробнее</Button></Link> },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const onChangeTable = (pag, _f, sorter) => {
    const next = { sort_by: undefined, sort_direction: undefined };
    if (Array.isArray(sorter)) sorter = sorter[0];
    if (sorter && sorter.field && sorter.order) {
      next.sort_by = sorter.field;
      next.sort_direction = sorter.order === 'ascend' ? 'asc' : 'desc';
    }
    setSorting(next);
    fetchList(pag.current, pag.pageSize, filters, next);
  };

  const runBulk = async (action) => {
    if (!selectedRowKeys.length) return;
    try {
      await moderationApi.bulkActions({ action, plantation_ids: selectedRowKeys, comment: action === 'reject' ? 'Отклонено' : action === 'approve' ? 'Одобрено' : 'Сброшено' });
      message.success('Операция выполнена');
      fetchList(pagination.current, pagination.pageSize, filters, sorting);
    } catch (e) {
      message.error('Ошибка массовой операции');
    }
  };

  const exportXlsx = () => {
    const rows = (data || []).map(r => ({
      id: r.id,
      farmer: r.farmer_name,
      district: r.district_name,
      total_area: r.total_area,
      total_planted_area: r.total_planted_area,
      status: r.status,
      waiting_time_hours: r.waiting_time_hours,
      created_at: r.created_at ? new Date(r.created_at).toLocaleString() : ''
    }));
    exportSimpleSheet(rows, [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Фермер', key: 'farmer', width: 26 },
      { header: 'Район', key: 'district', width: 18 },
      { header: 'Площадь', key: 'total_area', width: 14 },
      { header: 'Посажено', key: 'total_planted_area', width: 14 },
      { header: 'Статус', key: 'status', width: 14 },
      { header: 'Ожидание (ч)', key: 'waiting_time_hours', width: 16 },
      { header: 'Создано', key: 'created_at', width: 22 },
    ], 'moderation-queue.xlsx', 'ModerationQueue');
  };

  return (
    <div className="space-y-3">
      <PageHeader title="Очередь модерации" />

      <div className="flex items-center gap-2 flex-wrap">
        <Select className="w-44" value={filters.status} options={statusOptions} onChange={(v) => setFilters((p) => ({ ...p, status: v }))} />
        <Input placeholder="Регион (ID)" className="w-36" value={filters.region ?? ''} onChange={(e) => setFilters((p) => ({ ...p, region: e.target.value || undefined }))} />
        <Input placeholder="Район (ID)" className="w-36" value={filters.district ?? ''} onChange={(e) => setFilters((p) => ({ ...p, district: e.target.value || undefined }))} />
        <Input.Search placeholder="Поиск..." className="max-w-sm" allowClear value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} onSearch={() => fetchList(1, pagination.pageSize, filters, sorting)} />
        <DatePicker placeholder="От" onChange={(d) => setFilters((p) => ({ ...p, date_from: d ? d.format('YYYY-MM-DD') : undefined }))} />
        <DatePicker placeholder="До" onChange={(d) => setFilters((p) => ({ ...p, date_to: d ? d.format('YYYY-MM-DD') : undefined }))} />
        <Button onClick={() => fetchList(1, pagination.pageSize, filters, sorting)}>Применить</Button>
        <Button onClick={() => { const reset = { status: 'pending', region: undefined, district: undefined, search: '', date_from: undefined, date_to: undefined }; setFilters(reset); fetchList(1, pagination.pageSize, reset, sorting); }}>Сбросить</Button>
        <Button onClick={exportXlsx}>Экспорт</Button>
      </div>

      <div className="flex items-center gap-2">
        <Button type="primary" disabled={!selectedRowKeys.length} onClick={() => runBulk('approve')}>Одобрить ({selectedRowKeys.length})</Button>
        <Button danger disabled={!selectedRowKeys.length} onClick={() => runBulk('reject')}>Отклонить</Button>
        <Button disabled={!selectedRowKeys.length} onClick={() => runBulk('reset')}>Сбросить</Button>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true }}
        onChange={onChangeTable}
        rowKey={(r) => r.id}
        scroll={{ x: 1000 }}
      />
    </div>
  );
} 