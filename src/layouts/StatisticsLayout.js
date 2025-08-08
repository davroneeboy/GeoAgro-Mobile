import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";

const { Sider, Content } = Layout;

const StatisticsLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/statistics/regions',
      label: 'Viloyatlar',
    },
    {
      key: '/statistics/fruits',
      label: 'Mevalar',
    },
    {
      key: '/statistics/controllers',
      label: 'Nazoratchilar',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#111827' }}>
      <Sider 
        width={280} 
        style={{ 
          background: '#1f2937', // gray-800
          boxShadow: '2px 0 8px rgba(0,0,0,0.2)',
          padding: '16px',
          borderRight: '1px solid #374151' // gray-700
        }}
      >
        <div className="flex items-center mb-6">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src={uzbekistanEmblem}
              alt="Logo"
              style={{ height: '80px', marginRight: '12px' }}
            />
            <p className="text-sm font-bold" style={{ color: '#e5e7eb' }}>
              Qishloq xo'jaligi Vazirligi
            </p>
          </Link>
        </div>
        <Menu
          mode="vertical"
          theme="dark"
          items={menuItems}
          defaultSelectedKeys={[location.pathname]}
          style={{
            background: '#1f2937',
            color: '#d1d5db',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Content style={{ background: '#111827' }}>{children}</Content>
    </Layout>
  );
};

export default StatisticsLayout; 