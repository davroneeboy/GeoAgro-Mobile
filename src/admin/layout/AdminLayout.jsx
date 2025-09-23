import React, { useMemo } from 'react';
import { Layout, Menu, Dropdown } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content, Footer } = Layout;

const menuItems = [
  { key: '/admin', label: <Link to="/admin">Дашборд</Link> },
  { key: '/admin/districts', label: <Link to="/admin/districts">Районы</Link> },
  { key: '/admin/farmers', label: <Link to="/admin/farmers">Фермеры</Link> },
  { key: '/admin/fruits', label: <Link to="/admin/fruits">Фрукты</Link> },
  { key: '/admin/fruit-varieties', label: <Link to="/admin/fruit-varieties">Сорта фруктов</Link> },
  { key: '/admin/investments', label: <Link to="/admin/investments">Инвестиции</Link> },
  { key: '/admin/plantations', label: <Link to="/admin/plantations">Плантации</Link> },
  { key: '/admin/reservoirs', label: <Link to="/admin/reservoirs">Резервуары</Link> },
  { key: '/admin/rootstocks', label: <Link to="/admin/rootstocks">Подвои</Link> },
  { key: '/admin/subsidys', label: <Link to="/admin/subsidys">Субсидии</Link> },
  { key: '/admin/trellis', label: <Link to="/admin/trellis">Шпалеры</Link> },
  { key: '/admin/users', label: <Link to="/admin/users">Пользователи</Link> },
  { key: '/admin/mod-logs', label: <Link to="/admin/mod-logs">Логи модерации</Link> },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const selectedKeys = useMemo(() => {
    const found = menuItems.find(item => pathname.startsWith(item.key));
    return [found ? found.key : '/admin'];
  }, [pathname]);


  return (
    <Layout className="min-h-screen">
      <Sider breakpoint="lg" collapsible>
        <div className="text-white text-center py-4 font-semibold tracking-wide">Agro Console</div>
        <Menu theme="dark" mode="inline" selectedKeys={selectedKeys} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="bg-white/90 backdrop-blur px-4 flex items-center justify-between shadow-sm">
          <div className="font-medium">Панель управления</div>
          <Dropdown menu={{ items: [
            { key: 'profile', label: 'Профиль' },
            { type: 'divider' },
            { key: 'logout', label: 'Выйти' },
          ]}} trigger={["click"]}>
            <button className="px-3 py-1 rounded hover:bg-gray-100">Аккаунт</button>
          </Dropdown>
        </Header>
        <Content className="p-4">
          <div className="bg-white rounded-md shadow-sm p-4 min-h-[60vh]">
            <Outlet />
          </div>
        </Content>
        <Footer className="text-center">© {new Date().getFullYear()} Agrosanoat</Footer>
      </Layout>
    </Layout>
  );
} 