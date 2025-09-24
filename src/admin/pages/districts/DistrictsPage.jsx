import React, { useEffect, useState } from 'react';
import { Button, Popconfirm, Space, Table, Tag, message } from 'antd';
import PageHeader from '../../components/common/PageHeader';
import TableLayout from '../../components/common/TableLayout';
import FilterDrawer from '../../components/common/FilterDrawer';
import DistrictFormModal from '../../components/districts/DistrictFormModal';
import { referencesApi } from '../../services/adminApi';
import { exportSimpleSheet } from '../../../utils/excelExport';

export default function DistrictsPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [regionFilter, setRegionFilter] = useState(undefined);

  const fetchList = async (page = 1, pageSize = 20, search = '', region = regionFilter) => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (region) params.region = region;
      const res = await referencesApi.districts.list(params);
      setData(res.results || []);
      setPagination({ current: page, pageSize, total: res.count || 0 });
    } catch (e) {
      message.error('Не удалось загрузить районы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1, pagination.pageSize, '', regionFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionFilter]);

  const handleTableChange = (pag) => {
    fetchList(pag.current, pag.pageSize, q, regionFilter);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing?.id) {
        await referencesApi.districts.update(editing.id, values);
      } else {
        await referencesApi.districts.create(values);
      }
      message.success('Сохранено');
      setModalOpen(false);
      setEditing(null);
      fetchList(pagination.current, pagination.pageSize, q, regionFilter);
    } catch (e) {
      message.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    try {
      await referencesApi.districts.delete(id);
      message.success('Удалено');
      fetchList(pagination.current, pagination.pageSize, q, regionFilter);
    } catch (e) {
      message.error('Ошибка удаления');
    }
  };

  const exportXlsx = () => {
    const rows = (data || []).map(r => ({ id: r.id, name: r.name, region: typeof r.region === 'object' ? (r.region?.name || r.region?.id) : r.region }));
    exportSimpleSheet(rows, [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Название', key: 'name', width: 28 },
      { header: 'Регион', key: 'region', width: 18 },
    ], 'districts.xlsx', 'Districts');
  };

  return (
    <div>
      <PageHeader title="Районы" extra={<Space><Button onClick={exportXlsx}>Экспорт</Button><Button type="primary" onClick={() => { setEditing(null); setModalOpen(true); }}>Добавить</Button></Space>} />
      <TableLayout searchPlaceholder="Поиск районов" onSearchChange={(val) => { setQ(val); fetchList(1, pagination.pageSize, val, regionFilter); }} onOpenFilters={() => setOpen(true)}>
        <Table
          columns={[
            { title: 'Название', dataIndex: 'name' },
            { title: 'Регион', dataIndex: 'region', render: (v) => <Tag>{typeof v === 'object' ? (v?.name || v?.id) : v}</Tag> },
            { title: 'Действия', key: 'actions', render: (_, record) => (
              <Space>
                <Button size="small" onClick={() => { setEditing({ id: record.id, name: record.name, region: typeof record.region === 'object' ? (record.region?.id || record.region) : record.region }); setModalOpen(true); }}>Изм.</Button>
                <Popconfirm title="Удалить?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger>Удалить</Button>
                </Popconfirm>
              </Space>
            ) },
          ]}
          dataSource={data}
          loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true }}
          onChange={handleTableChange}
          rowKey={(r) => r.id}
        />
      </TableLayout>

      <FilterDrawer open={open} onClose={() => setOpen(false)} onReset={() => { setOpen(false); setRegionFilter(undefined); fetchList(1, pagination.pageSize, '', undefined); }} onApply={() => setOpen(false)}>
        <div className="text-xs text-gray-500 mb-1">Регион (ID)</div>
        <input className="w-full border rounded px-2 py-1" placeholder="Напр. 1" onChange={(e) => setRegionFilter(e.target.value || undefined)} />
      </FilterDrawer>

      <DistrictFormModal open={modalOpen} initialValues={editing} onCancel={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} />
    </div>
  );
} 