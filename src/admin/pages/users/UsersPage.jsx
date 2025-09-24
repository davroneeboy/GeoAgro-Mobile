import React, { useEffect, useState } from 'react';
import { Button, Drawer, Input, Space, Table, Tag, Tooltip, message, Select, Divider } from 'antd';
import UserFormModal from '../../components/users/UserFormModal';
import { usersApi } from '../../services/adminApi';
import { exportToExcel } from '../../../utils/excelExport';

const roleOptions = [
  { value: 0, label: 'Обычный' },
  { value: 1, label: 'Superuser' },
  { value: 2, label: 'Head of Region' },
  { value: 3, label: 'Только просмотр' },
];

const activeOptions = [
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Неактивные' },
];

const columnsDef = [
  { title: 'ID', dataIndex: 'id', sorter: true, width: 90 },
  { title: 'Username', dataIndex: 'username', sorter: true },
  { title: 'Email', dataIndex: 'email', responsive: ['lg'], sorter: true },
  { title: 'Имя', dataIndex: 'first_name', sorter: true },
  { title: 'Фамилия', dataIndex: 'last_name', sorter: true },
  { title: 'Роль', dataIndex: 'user_role_display', render: (v) => <Tag>{v || '—'}</Tag> },
  { title: 'Активен', dataIndex: 'is_active', render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Да' : 'Нет'}</Tag>, responsive: ['md'] },
];

export default function UsersPage() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ role: undefined, region: undefined, district: undefined, is_active: undefined });
  const [sorting, setSorting] = useState({ sort_by: undefined, sort_direction: undefined });

  const fetchList = async (page = 1, pageSize = 20, search = '', f = filters, s = sorting) => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (f.role !== undefined) params.role = f.role;
      if (f.region !== undefined) params.region = f.region;
      if (f.district !== undefined) params.district = f.district;
      if (f.is_active !== undefined) params.is_active = f.is_active;
      if (s.sort_by) params.sort_by = s.sort_by;
      if (s.sort_direction) params.sort_direction = s.sort_direction;
      const res = await usersApi.list(params);
      setData(res.results || []);
      setPagination({ current: page, pageSize, total: res.count || 0 });
    } catch (e) {
      message.error('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1, pagination.pageSize, '', filters, sorting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const handleTableChange = (pag, _filters, sorter) => {
    const nextSorting = { sort_by: undefined, sort_direction: undefined };
    if (Array.isArray(sorter)) sorter = sorter[0];
    if (sorter && sorter.field && sorter.order) {
      nextSorting.sort_by = sorter.field;
      nextSorting.sort_direction = sorter.order === 'ascend' ? 'asc' : 'desc';
    }
    setSorting(nextSorting);
    fetchList(pag.current, pag.pageSize, query, filters, nextSorting);
  };

  const handleSearch = (value) => {
    setQuery(value);
    fetchList(1, pagination.pageSize, value, filters, sorting);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing?.id) {
        await usersApi.update(editing.id, values);
      } else {
        await usersApi.create(values);
      }
      message.success('Сохранено');
      setModalOpen(false);
      setEditing(null);
      fetchList(pagination.current, pagination.pageSize, query, filters, sorting);
    } catch (e) {
      message.error('Ошибка сохранения');
    }
  };

  const runBulk = async (action, ids) => {
    const targets = ids || selectedRowKeys;
    if (!targets.length) return;
    try {
      await usersApi.bulkActions({ action, user_ids: targets });
      message.success('Операция выполнена');
      setSelectedRowKeys([]);
      fetchList(pagination.current, pagination.pageSize, query, filters, sorting);
    } catch (e) {
      message.error('Ошибка массовой операции');
    }
  };

  const exportXlsx = () => {
    const rows = (data || []).map(r => ({
      id: r.id,
      username: r.username,
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      role: r.user_role_display,
      is_active: r.is_active ? 'Да' : 'Нет',
      district: r.district?.name || r.district || '',
      last_login: r.last_login || '',
    }));
    try {
      const ok = exportToExcel(rows, {}, 'controllers', 'Users', 'users.xlsx');
      if (!ok) message.error('Экспорт не удался');
    } catch (e) {
      message.error('Экспорт не удался');
    }
  };

  const toEditValues = (r) => ({
    id: r.id,
    username: r.username,
    email: r.email,
    first_name: r.first_name,
    last_name: r.last_name,
    role: typeof r.user_role === 'number' ? r.user_role : undefined,
    district: r.district?.id || r.district || undefined,
    is_active: !!r.is_active,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Input.Search placeholder="Поиск пользователей" allowClear onSearch={handleSearch} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
        <Space>
          <Tooltip title="Правые фильтры">
            <Button onClick={() => setOpen(true)}>Фильтры</Button>
          </Tooltip>
          <Button onClick={exportXlsx}>Экспорт</Button>
          <Button type="primary" onClick={() => { setEditing(null); setModalOpen(true); }}>Добавить</Button>
        </Space>
      </div>

      <div className="flex items-center gap-2">
        <Button disabled={!selectedRowKeys.length} onClick={() => runBulk('activate')}>Активировать ({selectedRowKeys.length})</Button>
        <Button disabled={!selectedRowKeys.length} onClick={() => runBulk('deactivate')}>Деактивировать</Button>
        <Button danger disabled={!selectedRowKeys.length} onClick={() => runBulk('delete')}>Удалить</Button>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={[
          ...columnsDef,
          {
            title: 'Действия',
            key: 'actions',
            fixed: 'right',
            width: 200,
            render: (_, record) => (
              <Space>
                <Button size="small" onClick={() => { setEditing(toEditValues(record)); setModalOpen(true); }}>Изм.</Button>
                <Button size="small" danger onClick={() => runBulk('delete', [record.id])}>Удалить</Button>
              </Space>
            ),
          },
        ]}
        dataSource={data}
        loading={loading}
        pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true }}
        onChange={handleTableChange}
        rowKey={(r) => r.id}
        scroll={{ x: 1000 }}
      />

      <Drawer title="Фильтры" open={open} onClose={() => setOpen(false)} width={360}>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Роль</div>
            <Select className="w-full" allowClear options={roleOptions} value={filters.role} onChange={(v) => setFilters((p) => ({ ...p, role: v }))} />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Активность</div>
            <Select className="w-full" allowClear options={activeOptions} value={filters.is_active} onChange={(v) => setFilters((p) => ({ ...p, is_active: v }))} />
          </div>
          <Divider>
            Дополнительно
          </Divider>
          <div>
            <div className="text-xs text-gray-500 mb-1">Регион (ID)</div>
            <Input placeholder="Напр. 1" value={filters.region ?? ''} onChange={(e) => setFilters((p) => ({ ...p, region: e.target.value || undefined }))} />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Район (ID)</div>
            <Input placeholder="Напр. 1" value={filters.district ?? ''} onChange={(e) => setFilters((p) => ({ ...p, district: e.target.value || undefined }))} />
          </div>
          <Space>
            <Button onClick={() => { setFilters({ role: undefined, region: undefined, district: undefined, is_active: undefined }); setOpen(false); fetchList(1, pagination.pageSize, query, { role: undefined, region: undefined, district: undefined, is_active: undefined }, sorting); }}>Сбросить</Button>
            <Button type="primary" onClick={() => { setOpen(false); fetchList(1, pagination.pageSize, query, filters, sorting); }}>Применить</Button>
          </Space>
        </div>
      </Drawer>

      <UserFormModal open={modalOpen} initialValues={editing} onCancel={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} />
    </div>
  );
} 