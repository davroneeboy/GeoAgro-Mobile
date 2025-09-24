import React, { useEffect, useState } from 'react';
import { Button, Select, Space, Table, Tag, message, Form, Input, Modal, Popconfirm } from 'antd';
import PageHeader from '../../components/common/PageHeader';
import TableLayout from '../../components/common/TableLayout';
import FilterDrawer from '../../components/common/FilterDrawer';
import { referencesApi } from '../../services/adminApi';
import { exportSimpleSheet } from '../../../utils/excelExport';

function VarietyFormModal({ open, onCancel, onSubmit, initialValues }) {
  const [form] = Form.useForm();
  const [fruits, setFruits] = useState([]);

  useEffect(() => {
    if (open) {
      referencesApi.fruits.list({ page: 1, page_size: 100 }).then((res) => setFruits(res.results || []));
      form.setFieldsValue(initialValues || { name: '', fruit_id: undefined });
    }
  }, [open]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = { name: values.name, fruit_id: Number(values.fruit_id) };
    onSubmit?.(payload);
  };

  return (
    <Modal open={open} title={initialValues?.id ? 'Редактировать сорт' : 'Добавить сорт'} onCancel={onCancel} onOk={handleOk} okText="Сохранить">
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Название" rules={[{ required: true }]}>
          <Input placeholder="Голден" />
        </Form.Item>
        <Form.Item name="fruit_id" label="Фрукт" rules={[{ required: true }]}>
          <Select options={(fruits || []).map(f => ({ value: f.id, label: f.name }))} placeholder="Выберите фрукт" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function FruitVarietiesPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [fruitFilter, setFruitFilter] = useState(undefined);

  const fetchList = async (page = 1, pageSize = 20, search = '', fruit_id = fruitFilter) => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (fruit_id) params.fruit_id = fruit_id;
      const res = await referencesApi.varieties.list(params);
      setData(res.results || []);
      setPagination({ current: page, pageSize, total: res.count || 0 });
    } catch (e) {
      message.error('Не удалось загрузить сорта');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1, pagination.pageSize, q, fruitFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fruitFilter]);

  const handleTableChange = (pag) => {
    fetchList(pag.current, pag.pageSize, q, fruitFilter);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing?.id) {
        await referencesApi.varieties.update(editing.id, values);
      } else {
        await referencesApi.varieties.create(values);
      }
      message.success('Сохранено');
      setModalOpen(false);
      setEditing(null);
      fetchList(pagination.current, pagination.pageSize, q, fruitFilter);
    } catch (e) {
      message.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    try {
      await referencesApi.varieties.delete(id);
      message.success('Удалено');
      fetchList(pagination.current, pagination.pageSize, q, fruitFilter);
    } catch (e) {
      message.error('Ошибка удаления');
    }
  };

  const exportXlsx = () => {
    const rows = (data || []).map(r => ({ id: r.id, name: r.name, fruit: r.fruit?.name || '' }));
    exportSimpleSheet(rows, [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Название', key: 'name', width: 28 },
      { header: 'Фрукт', key: 'fruit', width: 24 },
    ], 'varieties.xlsx', 'Varieties');
  };

  return (
    <div>
      <PageHeader title="Сорта фруктов" extra={<Space><Button onClick={exportXlsx}>Экспорт</Button><Button type="primary" onClick={() => { setEditing(null); setModalOpen(true); }}>Добавить</Button></Space>} />
      <div className="mb-3">
        <Space>
          <span className="text-sm text-gray-500">Фрукт:</span>
          <Select allowClear placeholder="Все" style={{ minWidth: 200 }} onChange={(v) => setFruitFilter(v)} />
        </Space>
      </div>
      <TableLayout searchPlaceholder="Поиск сортов" onSearchChange={(val) => { setQ(val); fetchList(1, pagination.pageSize, val, fruitFilter); }} onOpenFilters={() => setOpen(true)}>
        <Table
          columns={[
            { title: 'Название', dataIndex: 'name' },
            { title: 'Фрукт', dataIndex: 'fruit', render: (v) => <Tag color="blue">{v?.name || v}</Tag> },
            { title: 'Действия', key: 'actions', render: (_, r) => (
              <Space>
                <Button size="small" onClick={() => { setEditing({ id: r.id, name: r.name, fruit_id: r.fruit?.id || r.fruit_id }); setModalOpen(true); }}>Изм.</Button>
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
        <div className="text-xs text-gray-500 mb-1">Фильтры</div>
        <div className="text-gray-400 text-sm">Используйте селектор сверху для фильтра по фрукту</div>
      </FilterDrawer>

      <VarietyFormModal open={modalOpen} initialValues={editing} onCancel={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} />
    </div>
  );
} 