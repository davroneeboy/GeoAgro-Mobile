import React, { useMemo, useState } from 'react';
import { Button, Drawer, Input, Space, Table, Tag, Tooltip } from 'antd';

const columnsDef = [
  { title: 'Username', dataIndex: 'username', sorter: true },
  { title: 'Email', dataIndex: 'email', responsive: ['lg'] },
  { title: 'First name', dataIndex: 'first_name' },
  { title: 'Last name', dataIndex: 'last_name' },
  { title: 'Роль', dataIndex: 'role', render: (v) => <Tag color={v === 'Superuser' ? 'magenta' : v === 'Head of Region' ? 'geekblue' : 'green'}>{v}</Tag> },
  { title: 'Район', dataIndex: 'district', responsive: ['md'] },
  { title: 'Очки', dataIndex: 'points', width: 90, align: 'right' },
];

const mockData = Array.from({ length: 20 }).map((_, i) => ({
  key: i + 1,
  username: `user_${i + 1}`,
  email: `user_${i + 1}@example.com`,
  first_name: 'Имя',
  last_name: 'Фамилия',
  role: i % 5 === 0 ? 'Superuser' : i % 3 === 0 ? 'Head of Region' : 'Regular User',
  district: ['Tashkent', 'Bukhara', 'Samarkand'][i % 3],
  points: Math.floor(Math.random() * 100),
}));

export default function UsersPage() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const data = useMemo(() => {
    if (!query) return mockData;
    const q = query.toLowerCase();
    return mockData.filter((x) =>
      x.username.toLowerCase().includes(q) ||
      x.email.toLowerCase().includes(q) ||
      x.first_name.toLowerCase().includes(q) ||
      x.last_name.toLowerCase().includes(q)
    );
  }, [query]);

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Input.Search placeholder="Поиск пользователей" allowClear onSearch={setQuery} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
        <Space>
          <Tooltip title="Правые фильтры">
            <Button onClick={() => setOpen(true)}>Фильтры</Button>
          </Tooltip>
          <Button type="primary">Добавить</Button>
        </Space>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={[
          ...columnsDef,
          {
            title: 'Действия',
            key: 'actions',
            fixed: 'right',
            width: 180,
            render: () => (
              <Space>
                <Button size="small">Изм.</Button>
                <Button size="small" danger>Удалить</Button>
              </Space>
            ),
          },
        ]}
        dataSource={data}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 900 }}
      />

      <Drawer title="Фильтры" open={open} onClose={() => setOpen(false)} width={360}>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Роль</div>
            <Space wrap>
              <Tag>Superuser</Tag>
              <Tag>Head of Region</Tag>
              <Tag>Regular User</Tag>
            </Space>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Район</div>
            <Space wrap>
              <Tag>Tashkent</Tag>
              <Tag>Bukhara</Tag>
              <Tag>Samarkand</Tag>
            </Space>
          </div>
          <Space>
            <Button onClick={() => setOpen(false)}>Сбросить</Button>
            <Button type="primary" onClick={() => setOpen(false)}>Применить</Button>
          </Space>
        </div>
      </Drawer>
    </div>
  );
} 