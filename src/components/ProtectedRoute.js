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

const ProtectedRoute = ({ children }) => {
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
      if (ranRef.current) return; // guard for StrictMode double-invoke in dev
      ranRef.current = true;

      if (!authState.accessToken) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      try {
        // Локальная проверка exp из JWT
        const payload = decodeJwtPayload(authState.accessToken);
        const nowSec = Math.floor(Date.now() / 1000);
        const isExpired = !payload?.exp || payload.exp <= nowSec;

        if (isExpired) {
          // Пытаемся освежить токен без лишних API запросов-"пингов"
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
        // На любой ошибке пробуем разлогинить
        logout();
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
    // намеренно не включаем logout/refreshAccessToken как зависимости, чтобы не перезапускать в dev
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
