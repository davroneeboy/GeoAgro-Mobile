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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        width={280} 
        style={{ 
          background: 'white',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          padding: '16px'
        }}
      >
        <div className="flex items-center mb-6">
          <Link to="/">
            <img
              src={uzbekistanEmblem}
              alt="Logo"
              style={{ height: '80px', marginRight: '12px' }}
            />
          </Link>
          <p className="text-sm font-bold text-gray-900">
            Qishloq xo'jaligi Vazirligi
          </p>
        </div>
        <Menu
          mode="vertical"
          items={menuItems}
          defaultSelectedKeys={[location.pathname]}
          style={{
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Content style={{ background: '#f0f2f5' }}>{children}</Content>
    </Layout>
  );
};

export default StatisticsLayout; 