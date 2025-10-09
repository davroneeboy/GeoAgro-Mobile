import React, { useContext, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import LeftNav from "./LeftNav";

const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const ForbiddenPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4">
    <div className="w-20 h-20 mx-auto mb-8 bg-red-100 rounded-full flex items-center justify-center">
      <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    </div>
    
    <h1 className="text-2xl font-bold text-white mb-4">Рухсат йўқ</h1>
    
    <div className="text-white mb-6 text-center max-w-lg">
      <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
        <div className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-3 mb-3">
          <p className="text-orange-200 text-lg font-medium">Ушбу саҳифани кўриш учун ҳуқуқингиз йўқ.</p>
          <p className="text-orange-100 mt-2">Статистика ва бошқа маълумотларни кўриш учун қўшимча ҳуқуқлар керак.</p>
        </div>
        
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a 
          href="/login" 
          className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Бошқа аккаунт билан кириш
        </a>
        
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Орқага қайтиш
        </button>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { authState, logout, refreshAccessToken } = useContext(AuthContext);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const ranRef = useRef(false);
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('leftNavCollapsed') ?? localStorage.getItem('rightNavCollapsed');
      return saved ? saved === 'true' : true;
    } catch { return true; }
  });

  useEffect(() => {
    const onToggle = () => {
      try {
        const saved = localStorage.getItem('leftNavCollapsed');
        setNavCollapsed(saved === 'true');
      } catch {}
    };
    window.addEventListener('leftnav-toggle', onToggle);
    return () => window.removeEventListener('leftnav-toggle', onToggle);
  }, []);

  useEffect(() => {
    const validateToken = async () => {
      if (ranRef.current) return;
      ranRef.current = true;
      if (!authState.accessToken) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }
      try {
        const payload = decodeJwtPayload(authState.accessToken);
        const nowSec = Math.floor(Date.now() / 1000);
        const isExpired = !payload?.exp || payload.exp <= nowSec;
        if (isExpired) {
          try {
            await refreshAccessToken();
            setIsValid(true);
          } catch {
            logout();
            setIsValid(false);
          }
        } else {
          setIsValid(true);
        }
      } catch {
        logout();
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.accessToken]);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-white">Tekshirilmoqda...</span>
      </div>
    );
  }

  if (!authState.accessToken || !isValid) {
    return <Navigate to="/login" />;
  }

  // RBAC: если роль не разрешена — показываем ForbiddenPage
  
  
  if (allowedRoles.length > 0 && (!authState.userRole || !allowedRoles.includes(authState.userRole))) {
    
    return <ForbiddenPage />;
  }

  const paddingLeft = navCollapsed ? 80 : 360;

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      <div style={{ paddingLeft }} className="px-3 lg:px-4 py-3">
        {children}
      </div>
      <LeftNav />
    </div>
  );
};

export default ProtectedRoute;
