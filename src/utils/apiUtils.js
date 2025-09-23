import { API_BASE_URL2 } from '../config';
import axios from 'axios';

// In-flight cache для дедупликации параллельных GET-запросов
const inFlightRequests = new Map();
// Отдельный кэш промисов JSON, чтобы не возвращать один и тот же Response
const inFlightJsonRequests = new Map();

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
  if (!url) {
    throw new Error('URL is not defined');
  }
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

// Дедупликация, возвращающая уже распарсенный JSON (исключает повторное чтение body)
const dedupeFetchJson = async (url, config = {}) => {
  const method = (config.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    const resp = await fetch(url, config);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    return resp.json();
  }
  const key = buildRequestKey(url, config);
  if (inFlightJsonRequests.has(key)) {
    return inFlightJsonRequests.get(key);
  }
  const promise = (async () => {
    const resp = await fetch(url, config);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    return resp.json();
  })();
  inFlightJsonRequests.set(key, promise);
  try {
    const data = await promise;
    return data;
  } finally {
    inFlightJsonRequests.delete(key);
  }
};

export const apiRequest = async (endpoint, options = {}, refreshToken, accessToken) => {
  if (!API_BASE_URL2) {
    throw new Error('API_BASE_URL2 is not defined');
  }
  if (!endpoint) {
    throw new Error('Endpoint is not defined');
  }
  const url = `${API_BASE_URL2}${endpoint.endsWith('/') ? endpoint : endpoint + '/'}`;
  
  // Если отправляем FormData, не задаём Content-Type вручную
  const isFormData = typeof FormData !== 'undefined' && options && options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : {
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
          // Создаем ошибку с response объектом для совместимости с axios
          const error = new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
          error.response = {
            status: retryResponse.status,
            statusText: retryResponse.statusText,
            data: null
          };
          throw error;
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
      // Создаем ошибку с response объектом для совместимости с axios
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: null
      };
      throw error;
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
  return await dedupeFetchJson(url, { headers });
}; 

// ================= RBAC & Auth Utils =================

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ROLE_KEY = "user_role";
const REGION_ID_KEY = "region_id";
const USER_INFO_KEY = "user_info";

export function setAuthTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function removeAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setUserRole(role) {
  localStorage.setItem(USER_ROLE_KEY, role);
}

export function getUserRole() {
  return localStorage.getItem(USER_ROLE_KEY);
}

export function setRegionId(regionId) {
  if (regionId !== undefined && regionId !== null) {
    localStorage.setItem(REGION_ID_KEY, String(regionId));
  }
}

export function getRegionId() {
  return localStorage.getItem(REGION_ID_KEY);
}

export function setUserInfo(userInfo) {
  if (userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  }
}

export function getUserInfo() {
  const raw = localStorage.getItem(USER_INFO_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function removeUserData() {
  removeAuthTokens();
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(REGION_ID_KEY);
  localStorage.removeItem(USER_INFO_KEY);
} 

export function handleApiError(error, navigate) {
  if (!error || !error.response) return;
  const status = error.response.status;
  if (status === 401) {
    // Токен истёк — редирект на логин
    if (navigate) navigate("/login");
    else window.location.href = "/login";
  } else if (status === 403) {
    // Нет прав — показываем сообщение и редиректим
    alert("Сизда ушбу саҳифага рухсат йўқ");
    if (navigate) navigate("/");
    else window.location.href = "/";
  }
} 