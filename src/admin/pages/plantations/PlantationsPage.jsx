import React, { useEffect, useState } from 'react';
import { Button, Table, Tag, message } from 'antd';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import TableLayout from '../../components/common/TableLayout';
import FilterDrawer from '../../components/common/FilterDrawer';
import { moderationApi } from '../../services/adminApi';

export default function PlantationsPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchList = async (page = 1, pageSize = 20, search = '') => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize, status: 'all' };
      if (search) params.search = search;
      const res = await moderationApi.queue(params);
      setData(res.results || []);
      setPagination({ current: page, pageSize, total: res.count || 0 });
    } catch (e) {
      message.error('Не удалось загрузить плантации');
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

  return (
    <div>
      <PageHeader title="Плантации" />
      <TableLayout searchPlaceholder="Поиск плантаций" onSearchChange={(val) => { setQ(val); fetchList(1, pagination.pageSize, val); }} onOpenFilters={() => setOpen(true)}>
        <Table
          columns={[
            { title: 'ID', dataIndex: 'id', width: 90 },
            { title: 'Фермер', dataIndex: 'farmer_name', render: (v, r) => <div>{v || '—'}{r.farmer_phone ? <div className="text-xs text-gray-500">{r.farmer_phone}</div> : null}</div> },
            { title: 'Район', dataIndex: 'district_name' },
            { title: 'Площадь (га)', dataIndex: 'total_area', align: 'right' },
            { title: 'Посажено (га)', dataIndex: 'total_planted_area', align: 'right' },
            { title: 'Статус', dataIndex: 'status', render: (s) => <Tag color={s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'default'}>{s}</Tag> },
            { title: 'Действия', key: 'actions', render: (_, r) => <Link to={`/admin/moderation/${r.id}`}><Button size="small">Подробнее</Button></Link> },
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
        <div className="text-gray-400 text-sm">Используйте поиск сверху</div>
      </FilterDrawer>
    </div>
  );
} 