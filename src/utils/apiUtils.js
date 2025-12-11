import { API_BASE_URL2 } from '../config';
import axios from 'axios';
import { ApiError, ApiErrorCode } from '../types/apiErrors';

// In-flight cache для дедупликации параллельных GET-запросов
const inFlightRequests = new Map();
// Отдельный кэш промисов JSON, чтобы не возвращать один и тот же Response
const inFlightJsonRequests = new Map();

/**
 * Построить уникальный ключ для дедупликации запросов
 */
const buildRequestKey = (url, config = {}) => {
  const method = (config.method || 'GET').toUpperCase();
  const headers = Object.entries(config.headers || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${String(v)}`)
    .join('|');
  return `${method} ${url} | ${headers}`;
};

/**
 * Создать ApiError из Response объекта
 */
const createApiErrorFromResponse = async (response) => {
  let errorData = null;
  try {
    errorData = await response.json();
  } catch {
    // Тело не JSON
  }

  const message = 
    errorData?.detail || 
    errorData?.message || 
    errorData?.error ||
    `HTTP ${response.status}: ${response.statusText}`;

  return ApiError.fromHttpStatus(response.status, message, {
    status: response.status,
    statusText: response.statusText,
    data: errorData,
  });
};

/**
 * Дедупликация fetch запросов
 */
const dedupeFetch = async (url, config = {}) => {
  if (!url) {
    throw new ApiError('URL is not defined', ApiErrorCode.BAD_REQUEST, 0);
  }
  const method = (config.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    return await fetch(url, config);
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

/**
 * Дедупликация с автоматическим парсингом JSON
 */
const dedupeFetchJson = async (url, config = {}) => {
  const method = (config.method || 'GET').toUpperCase();
  
  if (method !== 'GET') {
    const resp = await fetch(url, config);
    if (!resp.ok) {
      throw await createApiErrorFromResponse(resp);
    }
    return resp.json();
  }
  
  const key = buildRequestKey(url, config);
  if (inFlightJsonRequests.has(key)) {
    return inFlightJsonRequests.get(key);
  }
  
  const promise = (async () => {
    const resp = await fetch(url, config);
    if (!resp.ok) {
      throw await createApiErrorFromResponse(resp);
    }
    return resp.json();
  })();
  
  inFlightJsonRequests.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightJsonRequests.delete(key);
  }
};

/**
 * Универсальная функция для API запросов с поддержкой:
 * - Дедупликации GET запросов
 * - Автоматического обновления токена при 401
 * - Централизованной обработки ошибок
 */
export const apiRequest = async (endpoint, options = {}, refreshToken, accessToken) => {
  if (!API_BASE_URL2) {
    throw new ApiError('API_BASE_URL2 is not defined', ApiErrorCode.BAD_REQUEST, 0);
  }
  if (!endpoint) {
    throw new ApiError('Endpoint is not defined', ApiErrorCode.BAD_REQUEST, 0);
  }
  
  const url = `${API_BASE_URL2}${endpoint.endsWith('/') ? endpoint : endpoint + '/'}`;
  
  // Если отправляем FormData, не задаём Content-Type вручную
  const isFormData = typeof FormData !== 'undefined' && options && options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : {
    'Content-Type': 'application/json',
  };

  // Автоматически добавляем токен авторизации
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
    const response = await dedupeFetch(url, config);

    // Обработка 401 с попыткой обновления токена
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
          const contentType = retryResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await retryResponse.json();
          }
          return null;
        }
        
        throw await createApiErrorFromResponse(retryResponse);
      } catch (refreshError) {
        // Ошибка обновления токена — редирект на логин
        const tokenError = new ApiError(
          'Token refresh failed',
          ApiErrorCode.TOKEN_EXPIRED,
          401,
          { originalError: refreshError instanceof Error ? refreshError : undefined }
        );
        console.error("Failed to refresh token:", tokenError.toJSON());
        window.location.href = '/login';
        throw tokenError;
      }
    }

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      return null;
    }

    // Создаём ApiError для неуспешных ответов
    throw await createApiErrorFromResponse(response);
  } catch (error) {
    // Если уже ApiError — пробрасываем
    if (error instanceof ApiError) {
      throw error;
    }
    // Сетевые ошибки и другие
    throw ApiError.from(error);
  }
};

/**
 * Создание axios инстанса с централизованной обработкой ошибок
 */
export const createAuthenticatedAxios = (accessToken, options = {}) => {
  const { onAuthError, onError } = options;
  
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL2,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });

  // Интерцептор для преобразования ошибок в ApiError
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const apiError = ApiError.from(error);
      
      // Обработка ошибок авторизации
      if (apiError.isAuthError()) {
        if (onAuthError) {
          onAuthError(apiError);
        } else {
          window.location.href = '/login';
        }
      }
      
      // Общий callback для ошибок
      if (onError) {
        onError(apiError);
      }
      
      return Promise.reject(apiError);
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

/**
 * @deprecated Используйте handleApiError из utils/errorHandler.ts
 * Оставлено для обратной совместимости
 */
export function handleApiError(error, navigate, options = {}) {
  const { showAlert = true, onLogout } = options;
  
  // Преобразуем в ApiError
  const apiError = ApiError.from(error);
  
  if (apiError.isAuthError()) {
    if (onLogout) onLogout();
    if (navigate) navigate("/login");
    else window.location.href = "/login";
    return apiError;
  }
  
  if (apiError.code === ApiErrorCode.FORBIDDEN) {
    if (showAlert) {
      alert(apiError.getUserMessage());
    }
    if (navigate) navigate("/");
    else window.location.href = "/";
    return apiError;
  }
  
  return apiError;
}

// Реэкспорт для удобства
export { ApiError, ApiErrorCode }; 