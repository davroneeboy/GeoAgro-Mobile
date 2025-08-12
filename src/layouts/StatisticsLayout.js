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
        breakpoint="lg"
        collapsedWidth={0}
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
      <Content style={{ background: '#111827' }}>
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center">
              <img src={uzbekistanEmblem} alt="Logo" className="h-8 w-auto mr-2" />
              <span className="text-white text-sm font-semibold">Statistika</span>
            </Link>
          </div>
          <div className="px-3 pb-3 flex items-center gap-2">
            <Link
              to="/statistics/regions"
              className={`px-3 py-2 text-xs rounded-md border ${location.pathname.startsWith('/statistics/regions') ? 'bg-green-600 text-white border-green-600' : 'bg-gray-700 text-gray-100 border-gray-600'}`}
            >
              Viloyatlar
            </Link>
            <Link
              to="/statistics/fruits"
              className={`px-3 py-2 text-xs rounded-md border ${location.pathname.startsWith('/statistics/fruits') ? 'bg-green-600 text-white border-green-600' : 'bg-gray-700 text-gray-100 border-gray-600'}`}
            >
              Mevalar
            </Link>
            <Link
              to="/statistics/controllers"
              className={`px-3 py-2 text-xs rounded-md border ${location.pathname.startsWith('/statistics/controllers') ? 'bg-green-600 text-white border-green-600' : 'bg-gray-700 text-gray-100 border-gray-600'}`}
            >
              Nazoratchilar
            </Link>
          </div>
        </div>
        {children}
      </Content>
    </Layout>
  );
};

export default StatisticsLayout; 