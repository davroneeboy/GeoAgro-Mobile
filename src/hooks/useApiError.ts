/**
 * React Hook для централизованной обработки ошибок API
 */

import { useState, useCallback, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, ApiErrorCode, isApiError } from '../types/apiErrors';
import {
  handleApiError,
  ErrorHandlerOptions,
  ErrorNotification,
  subscribeToNotifications,
  subscribeToRemoveNotifications,
  removeNotification,
  showNotification as showGlobalNotification,
} from '../utils/errorHandler';
import AuthContext from '../context/AuthContext';

// =============================================
// Типы
// =============================================
export interface UseApiErrorOptions extends Omit<ErrorHandlerOptions, 'navigate' | 'onLogout'> {
  /** Автоматический редирект при ошибке авторизации */
  autoRedirectOnAuth?: boolean;
}

export interface UseApiErrorReturn {
  /** Текущая ошибка */
  error: ApiError | null;
  /** Флаг наличия ошибки */
  hasError: boolean;
  /** Обработать ошибку */
  handleError: (error: unknown, overrideOptions?: Partial<ErrorHandlerOptions>) => ApiError;
  /** Очистить ошибку */
  clearError: () => void;
  /** Установить ошибку вручную */
  setError: (error: ApiError | null) => void;
  /** Показать уведомление */
  showNotification: (notification: Omit<ErrorNotification, 'id' | 'timestamp'>) => string;
  /** Проверить, является ли ошибка определённого типа */
  isErrorType: (code: ApiErrorCode) => boolean;
  /** Обёртка для async функций */
  wrapAsync: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

// =============================================
// Hook
// =============================================
export const useApiError = (options: UseApiErrorOptions = {}): UseApiErrorReturn => {
  const {
    showNotification: shouldShowNotification = true,
    redirectOnAuth = true,
    autoRedirectOnAuth = true,
    logToConsole = true,
    context,
    onError,
  } = options;

  const [error, setErrorState] = useState<ApiError | null>(null);
  const navigate = useNavigate();
  
  // Получение контекста авторизации (может быть null если компонент вне AuthProvider)
  const authContext = useContext(AuthContext) as { logout?: () => void } | null;

  const handleError = useCallback(
    (err: unknown, overrideOptions?: Partial<ErrorHandlerOptions>): ApiError => {
      const apiError = handleApiError(err, {
        showNotification: shouldShowNotification,
        redirectOnAuth: autoRedirectOnAuth && redirectOnAuth,
        navigate,
        onLogout: authContext?.logout,
        logToConsole,
        context,
        onError,
        ...overrideOptions,
      });

      setErrorState(apiError);
      return apiError;
    },
    [
      shouldShowNotification,
      redirectOnAuth,
      autoRedirectOnAuth,
      navigate,
      authContext?.logout,
      logToConsole,
      context,
      onError,
    ]
  );

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const setError = useCallback((err: ApiError | null) => {
    setErrorState(err);
  }, []);

  const showNotification = useCallback(
    (notification: Omit<ErrorNotification, 'id' | 'timestamp'>): string => {
      return showGlobalNotification(notification);
    },
    []
  );

  const isErrorType = useCallback(
    (code: ApiErrorCode): boolean => {
      return error?.code === code;
    },
    [error]
  );

  const wrapAsync = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        clearError();
        return await fn();
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleError, clearError]
  );

  return {
    error,
    hasError: error !== null,
    handleError,
    clearError,
    setError,
    showNotification,
    isErrorType,
    wrapAsync,
  };
};

// =============================================
// Hook для глобальных уведомлений
// =============================================
export interface UseNotificationsReturn {
  notifications: ErrorNotification[];
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  useEffect(() => {
    const unsubscribeAdd = subscribeToNotifications((notification) => {
      setNotifications((prev) => [...prev, notification]);
    });

    const unsubscribeRemove = subscribeToRemoveNotifications((id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });

    return () => {
      unsubscribeAdd();
      unsubscribeRemove();
    };
  }, []);

  const handleRemoveNotification = useCallback((id: string) => {
    removeNotification(id);
  }, []);

  const clearAll = useCallback(() => {
    notifications.forEach((n) => removeNotification(n.id));
  }, [notifications]);

  return {
    notifications,
    removeNotification: handleRemoveNotification,
    clearAll,
  };
};

// =============================================
// Вспомогательные хуки
// =============================================

/**
 * Hook для выполнения async операций с обработкой ошибок
 */
export interface UseAsyncOptions extends UseApiErrorOptions {
  /** Выполнить при монтировании */
  immediate?: boolean;
}

export interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: () => Promise<T | null>;
  reset: () => void;
}

export const useAsync = <T,>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> => {
  const { immediate = false, ...errorOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const { error, handleError, clearError } = useApiError(errorOptions);

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    clearError();

    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [asyncFn, handleError, clearError]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

// Экспорт типов и утилит
export { ApiError, ApiErrorCode, isApiError };

