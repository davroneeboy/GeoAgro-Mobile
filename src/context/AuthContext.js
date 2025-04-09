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
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
