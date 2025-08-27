import React, { createContext, useState, useEffect } from "react";
import { USER_ROLES, ROLE_PERMISSIONS } from "./constants";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    accessToken: sessionStorage.getItem("accessToken"),
    refreshToken: sessionStorage.getItem("refreshToken"),
    username: sessionStorage.getItem("username"),
    userInfo: JSON.parse(sessionStorage.getItem("userInfo") || "null"),
  });

  const login = (data) => {
    sessionStorage.setItem("accessToken", data.access);
    sessionStorage.setItem("refreshToken", data.refresh);
    sessionStorage.setItem("username", data.username);
    
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
    
    sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
    
    setAuthState({
      accessToken: data.access,
      refreshToken: data.refresh,
      username: data.username,
      userInfo,
    });
  };

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userInfo");
    setAuthState({
      accessToken: null,
      refreshToken: null,
      username: null,
      userInfo: null,
    });
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = sessionStorage.getItem("refreshToken");
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
        sessionStorage.setItem("accessToken", data.access);
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
    const accessToken = sessionStorage.getItem("accessToken");
    const refreshToken = sessionStorage.getItem("refreshToken");
    const username = sessionStorage.getItem("username");
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "null");
    
    if (accessToken && refreshToken && username) {
      setAuthState({
        accessToken,
        refreshToken,
        username,
        userInfo,
      });
    }
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
