import React, { useMemo, useState } from 'react';
import { Button, Space, Table, Tag, message } from 'antd';
import PageHeader from '../../components/common/PageHeader';
import TableLayout from '../../components/common/TableLayout';
import FilterDrawer from '../../components/common/FilterDrawer';
import FarmerFormModal from '../../components/farmers/FarmerFormModal';

const mock = Array.from({ length: 40 }).map((_, i) => ({
  key: i + 1,
  name: ['Пахтаобод истикболи', 'Шонтак отa', 'Эрназар пoлвон', 'Улугбек угли кaдам'][i % 4],
  district: ['Buloqboshi', 'Parkent', 'Zangiota'][i % 3],
  year: 2015 + (i % 10),
}));

export default function FarmersPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const data = useMemo(() => {
    if (!q) return mock;
    const s = q.toLowerCase();
    return mock.filter((x) => x.name.toLowerCase().includes(s) || String(x.year).includes(s) || x.district.toLowerCase().includes(s));
  }, [q]);

  const handleSubmit = () => {
    message.success('Сохранено (мок)');
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Фермеры" extra={<Button type="primary" onClick={() => setOpen(true)}>Добавить</Button>} />
      <TableLayout searchPlaceholder="Поиск фермеров" onSearchChange={setQ} onOpenFilters={() => setOpen(true)}>
        <Table
          columns={[
            { title: 'Хўжалик номи', dataIndex: 'name' },
            { title: 'Район', dataIndex: 'district' },
            { title: 'Год', dataIndex: 'year', render: (y) => <Tag color={y % 2 ? 'green' : 'blue'}>{y}</Tag> },
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
        <div className="text-xs text-gray-500 mb-1">Год организации</div>
        <Space wrap>
          <Tag>2019</Tag>
          <Tag>2020</Tag>
          <Tag>2021</Tag>
          <Tag>2022</Tag>
          <Tag>2023</Tag>
          <Tag>2024</Tag>
        </Space>
      </FilterDrawer>

      <FarmerFormModal open={open} onCancel={() => setOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
} 