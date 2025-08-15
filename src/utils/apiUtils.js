import { API_BASE_URL2 } from '../config';
import axios from 'axios';

export const apiRequest = async (endpoint, options = {}, refreshToken, accessToken) => {
  const url = `${API_BASE_URL2}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Автоматически добавляем токен авторизации, если он передан
  if (accessToken) {
    defaultHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401 && refreshToken) {
      console.log("Token expired, attempting to refresh...");
      try {
        const newToken = await refreshToken();
        
        // Повторяем запрос с новым токеном
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };
        
        const retryResponse = await fetch(url, retryConfig);
        
        if (retryResponse.ok) {
          return await retryResponse.json();
        } else {
          console.error("Failed after token refresh");
          throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
        }
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        window.location.href = '/login';
        throw refreshError;
      }
    }

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Функция для создания axios инстанса с автоматическим добавлением токена
export const createAuthenticatedAxios = (accessToken) => {
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL2,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });

  // Добавляем интерцептор для обработки 401 ошибок
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        console.log("Unauthorized request detected");
        // Здесь можно добавить логику обновления токена
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
}; 