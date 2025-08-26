import React from 'react';
import { Layout } from 'antd';
import { useLocation, Link } from 'react-router-dom';
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";

const { Content } = Layout;

const StatisticsLayout = ({ children }) => {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh', background: '#111827' }}>
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
        <div className="px-3 lg:px-4 py-3">
          {children}
        </div>
      </Content>
    </Layout>
  );
};

export default StatisticsLayout; 