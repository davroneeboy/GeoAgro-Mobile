import React, { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    username: localStorage.getItem("username"),
  });

  const login = (data) => {
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    localStorage.setItem("username", data.username);
    setAuthState({
      accessToken: data.access,
      refreshToken: data.refresh,
      username: data.username,
    });
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    setAuthState({
      accessToken: null,
      refreshToken: null,
      username: null,
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

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const username = localStorage.getItem("username");
    if (accessToken && refreshToken && username) {
      setAuthState({
        accessToken,
        refreshToken,
        username,
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ authState, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
