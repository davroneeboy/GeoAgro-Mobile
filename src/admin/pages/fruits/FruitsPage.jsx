import React, { useEffect, useState } from 'react';
import { Button, Popconfirm, Space, Table, message } from 'antd';
import PageHeader from '../../components/common/PageHeader';
import TableLayout from '../../components/common/TableLayout';
import FilterDrawer from '../../components/common/FilterDrawer';
import FruitFormModal from '../../components/fruits/FruitFormModal';
import { referencesApi } from '../../services/adminApi';
import { exportSimpleSheet } from '../../../utils/excelExport';

export default function FruitsPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchList = async (page = 1, pageSize = 20, search = '') => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      const res = await referencesApi.fruits.list(params);
      setData(res.results || []);
      setPagination({ current: page, pageSize, total: res.count || 0 });
    } catch (e) {
      message.error('Не удалось загрузить фрукты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1, pagination.pageSize, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange = (pag) => {
    fetchList(pag.current, pag.pageSize, q);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing?.id) {
        await referencesApi.fruits.update(editing.id, values);
      } else {
        await referencesApi.fruits.create(values);
      }
      message.success('Сохранено');
      setModalOpen(false);
      setEditing(null);
      fetchList(pagination.current, pagination.pageSize, q);
    } catch (e) {
      message.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    try {
      await referencesApi.fruits.delete(id);
      message.success('Удалено');
      fetchList(pagination.current, pagination.pageSize, q);
    } catch (e) {
      message.error('Ошибка удаления');
    }
  };

  const exportXlsx = () => {
    const rows = (data || []).map(r => ({ id: r.id, name: r.name }));
    exportSimpleSheet(rows, [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Название', key: 'name', width: 30 },
    ], 'fruits.xlsx', 'Fruits');
  };

  return (
    <div>
      <PageHeader title="Фрукты" extra={<Space><Button onClick={exportXlsx}>Экспорт</Button><Button type="primary" onClick={() => { setEditing(null); setModalOpen(true); }}>Добавить</Button></Space>} />
      <TableLayout searchPlaceholder="Поиск фруктов" onSearchChange={(val) => { setQ(val); fetchList(1, pagination.pageSize, val); }} onOpenFilters={() => setOpen(true)}>
        <Table
          columns={[
            { title: 'Название', dataIndex: 'name' },
            { title: 'Действия', key: 'actions', render: (_, r) => (
              <Space>
                <Button size="small" onClick={() => { setEditing({ id: r.id, name: r.name }); setModalOpen(true); }}>Изм.</Button>
                <Popconfirm title="Удалить?" onConfirm={() => handleDelete(r.id)}>
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

      <FilterDrawer open={open} onClose={() => setOpen(false)} onReset={() => setOpen(false)} onApply={() => setOpen(false)}>
        <div className="text-xs text-gray-500 mb-1">Поиск по имени</div>
        <div className="text-gray-400 text-sm">Используйте поле поиска сверху</div>
      </FilterDrawer>

      <FruitFormModal open={modalOpen} initialValues={editing} onCancel={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} />
    </div>
  );
} 