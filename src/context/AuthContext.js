import React, { createContext, useState, useEffect } from "react";
import { USER_ROLES, ROLE_PERMISSIONS } from "./constants";

const AuthContext = createContext();

// Ключ для подсчёта активных вкладок
const TABS_KEY = 'activeTabCount';

function getActiveTabCount() {
  const raw = localStorage.getItem(TABS_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setActiveTabCount(n) {
  const safe = Math.max(0, Number(n) || 0);
  if (safe === 0) localStorage.removeItem(TABS_KEY);
  else localStorage.setItem(TABS_KEY, String(safe));
}

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    username: localStorage.getItem("username"),
    userInfo: JSON.parse(localStorage.getItem("userInfo") || "null"),
  });

  const login = (data) => {
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    localStorage.setItem("username", data.username);
    
    // Сохраняем информацию о пользователе
    const userInfo = {
      id: data.id,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role || USER_ROLES.MODERATOR, // По умолчанию moderator
      is_headof_region: data.is_headof_region || false,
      region_id: data.region_id,
      permissions: ROLE_PERMISSIONS[data.role] || ROLE_PERMISSIONS[USER_ROLES.MODERATOR],
    };
    
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    
    setAuthState({
      accessToken: data.access,
      refreshToken: data.refresh,
      username: data.username,
      userInfo,
    });
  };

  const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userInfo");
  };

  const logout = () => {
    clearTokens();
    setAuthState({
      accessToken: null,
      refreshToken: null,
      username: null,
      userInfo: null,
    });
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL2 || 'https://luxa.uz/'}api/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.access);
        setAuthState(prev => ({
          ...prev,
          accessToken: data.access,
        }));
        return data.access;
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      logout();
      throw error;
    }
  };

  // Функция для проверки прав доступа
  const hasPermission = (permission) => {
    return authState.userInfo?.permissions?.[permission] || false;
  };

  // Функция для проверки роли
  const hasRole = (role) => {
    return authState.userInfo?.role === role;
  };

  // Функция для получения региона пользователя (для headofregion)
  const getUserRegion = () => {
    return authState.userInfo?.region_id;
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const username = localStorage.getItem("username");
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    
    if (accessToken && refreshToken && username) {
      setAuthState({
        accessToken,
        refreshToken,
        username,
        userInfo,
      });
    }

    // Учёт активных вкладок: инкремент при монтировании
    try {
      setActiveTabCount(getActiveTabCount() + 1);
    } catch {}

    const handleBeforeUnload = () => {
      try {
        const next = getActiveTabCount() - 1;
        setActiveTabCount(next);
        // Токены не очищаем на закрытии/обновлении вкладки
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Синхронизация между вкладками (login/logout/refresh)
    const onStorage = (e) => {
      if (!e.key) return;
      if (["accessToken","refreshToken","username","userInfo"].includes(e.key)) {
        const at = localStorage.getItem("accessToken");
        const rt = localStorage.getItem("refreshToken");
        const un = localStorage.getItem("username");
        const ui = JSON.parse(localStorage.getItem("userInfo") || "null");
        setAuthState({ accessToken: at, refreshToken: rt, username: un, userInfo: ui });
      }
      if (e.key === TABS_KEY) {
        // Ничего не делаем тут: счётчик нужен только для очистки на последней вкладке
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // На случай размонтирования без beforeunload: просто уменьшим счётчик
      try {
        const next = getActiveTabCount() - 1;
        setActiveTabCount(next);
      } catch {}
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      authState, 
      login, 
      logout, 
      refreshAccessToken,
      hasPermission,
      hasRole,
      getUserRegion,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
