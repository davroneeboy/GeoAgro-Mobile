import { API_BASE_URL2 } from '../config';
import axios from 'axios';

// In-flight cache для дедупликации параллельных GET-запросов
const inFlightRequests = new Map();

const buildRequestKey = (url, config = {}) => {
  const method = (config.method || 'GET').toUpperCase();
  const headers = Object.entries(config.headers || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${String(v)}`)
    .join('|');
  // Для GET тело игнорируем
  return `${method} ${url} | ${headers}`;
};

const dedupeFetch = async (url, config = {}) => {
  const method = (config.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    const resp = await fetch(url, config);
    return resp;
  }
  const key = buildRequestKey(url, config);
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }
  const promise = fetch(url, config).finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
};

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
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    // Дедупликация только для GET
    const response = await dedupeFetch(url, config);

    if (response.status === 401 && refreshToken) {
      try {
        const newToken = await refreshToken();
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };
        const retryResponse = await dedupeFetch(url, retryConfig);
        if (retryResponse.ok) {
          return await retryResponse.json();
        } else {
          throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
        }
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        window.location.href = '/login';
        throw refreshError;
      }
    }

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        return null;
      }
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
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
}; 

// Функция для создания заголовков с токеном авторизации для статистических API
export const createAuthHeaders = (accessToken) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

// Функция для выполнения API запросов к статистическим эндпоинтам
export const fetchStatisticsData = async (url, accessToken) => {
  const headers = createAuthHeaders(accessToken);
  const response = await dedupeFetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return await response.json();
}; 