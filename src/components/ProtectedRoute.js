import React, { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import { API_BASE_URL2 } from "../config";

const ProtectedRoute = ({ children }) => {
  const { authState, logout } = useContext(AuthContext);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!authState.accessToken) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        // Делаем легкий тестовый запрос для проверки токена
        await axios.get(`${API_BASE_URL2}api/users/`, {
          params: { limit: 1 }, // Запрашиваем только одного пользователя
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        });
        setIsValid(true);
      } catch (error) {
        if (error.response?.status === 401) {
          // Токен недействителен, очищаем его
          logout();
          setIsValid(false);
        } else {
          // Другие ошибки (например, сетевые) - считаем токен валидным
          setIsValid(true);
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [authState.accessToken, logout]);

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

  return children;
};

export default ProtectedRoute;
