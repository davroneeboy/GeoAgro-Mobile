import React, { useMemo, useState } from 'react';
import { Button, Space, Table, Tag, message } from 'antd';
import PageHeader from '../../components/common/PageHeader';
import TableLayout from '../../components/common/TableLayout';
import FilterDrawer from '../../components/common/FilterDrawer';
import DistrictFormModal from '../../components/districts/DistrictFormModal';

const mock = Array.from({ length: 30 }).map((_, i) => ({
  key: i + 1,
  name: ['Xiva', 'Urganch', 'Parkent', 'Zangiota'][i % 4],
  region: ['Khorezm', 'Tashkent', 'Samarkand'][i % 3],
}));

export default function DistrictsPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const data = useMemo(() => {
    if (!q) return mock;
    const s = q.toLowerCase();
    return mock.filter((x) => x.name.toLowerCase().includes(s) || x.region.toLowerCase().includes(s));
  }, [q]);

  const handleSubmit = (values) => {
    message.success('Сохранено (мок)');
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Районы" extra={<Button type="primary" onClick={() => setOpen(true)}>Добавить</Button>} />
      <TableLayout searchPlaceholder="Поиск районов" onSearchChange={setQ} onOpenFilters={() => setOpen(true)}>
        <Table
          columns={[
            { title: 'Название', dataIndex: 'name' },
            { title: 'Регион', dataIndex: 'region', render: (v) => <Tag>{v}</Tag> },
            { title: 'Действия', key: 'actions', render: (_, record) => (
              <Space>
                <Button size="small" onClick={() => setOpen(true)}>Изм.</Button>
                <Button size="small" danger>Удалить</Button>
              </Space>
            ) },
          ]}
          dataSource={data}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </TableLayout>

      <FilterDrawer open={open} onClose={() => setOpen(false)} onReset={() => setOpen(false)} onApply={() => setOpen(false)}>
        <div className="text-xs text-gray-500 mb-1">Регион</div>
        <Space wrap>
          <Tag>Khorezm</Tag>
          <Tag>Tashkent</Tag>
          <Tag>Samarkand</Tag>
        </Space>
      </FilterDrawer>

      <DistrictFormModal open={open} onCancel={() => setOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
} 