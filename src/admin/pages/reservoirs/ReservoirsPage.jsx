import React, { useEffect, useState } from 'react';
import { Button, Popconfirm, Space, Table, message } from 'antd';
import PageHeader from '../../components/common/PageHeader';
import TableLayout from '../../components/common/TableLayout';
import FilterDrawer from '../../components/common/FilterDrawer';
import { referencesApi } from '../../services/adminApi';
import { exportSimpleSheet } from '../../../utils/excelExport';

export default function ReservoirsPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchList = async (page = 1, pageSize = 20, search = '') => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      const res = await referencesApi.reservoirs.list(params);
      setData(res.results || []);
      setPagination({ current: page, pageSize, total: res.count || 0 });
    } catch (e) {
      message.error('Не удалось загрузить резервуары');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchList(1, pagination.pageSize, ''); /* eslint-disable-next-line */ }, []);

  const handleTableChange = (pag) => { fetchList(pag.current, pag.pageSize, q); };

  const handleDelete = async (id) => {
    try { await referencesApi.reservoirs.delete(id); message.success('Удалено'); fetchList(pagination.current, pagination.pageSize, q); }
    catch { message.error('Ошибка удаления'); }
  };

  const exportXlsx = () => {
    const rows = (data || []).map(r => ({ id: r.id, type: r.type, capacity: r.capacity }));
    exportSimpleSheet(rows, [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Тип', key: 'type', width: 24 },
      { header: 'Объём', key: 'capacity', width: 14 },
    ], 'reservoirs.xlsx', 'Reservoirs');
  };

  return (
    <div>
      <PageHeader title="Резервуары" extra={<Space><Button onClick={exportXlsx}>Экспорт</Button></Space>} />
      <TableLayout searchPlaceholder="Поиск по типу" onSearchChange={(val) => { setQ(val); fetchList(1, pagination.pageSize, val); }} onOpenFilters={() => setOpen(true)}>
        <Table
          columns={[
            { title: 'Тип', dataIndex: 'type' },
            { title: 'Объём', dataIndex: 'capacity', align: 'right' },
            { title: 'Описание', dataIndex: 'description' },
            { title: 'Действия', key: 'actions', render: (_, r) => (
              <Space>
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
        <div className="text-xs text-gray-500 mb-1">Фильтр по типу</div>
        <div className="text-gray-400 text-sm">Используйте поле поиска сверху</div>
      </FilterDrawer>
    </div>
  );
} 