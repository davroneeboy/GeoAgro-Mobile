/**
 * Централизованный обработчик ошибок API
 */

import { ApiError, ApiErrorCode, isApiError } from '../types/apiErrors';

// =============================================
// Типы
// =============================================
export interface ErrorHandlerOptions {
  /** Показать уведомление пользователю */
  showNotification?: boolean;
  /** Перенаправить на страницу входа при 401 */
  redirectOnAuth?: boolean;
  /** Функция навигации (для редиректа) */
  navigate?: (path: string) => void;
  /** Callback для обработки ошибки */
  onError?: (error: ApiError) => void;
  /** Callback для logout */
  onLogout?: () => void;
  /** Логировать ошибку в консоль */
  logToConsole?: boolean;
  /** Контекст для логирования */
  context?: string;
}

export interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  code?: ApiErrorCode;
  autoHide?: boolean;
  duration?: number;
}

// =============================================
// Глобальное хранилище уведомлений
// =============================================
type NotificationListener = (notification: ErrorNotification) => void;
type NotificationRemoveListener = (id: string) => void;

const notificationListeners: Set<NotificationListener> = new Set();
const notificationRemoveListeners: Set<NotificationRemoveListener> = new Set();

/** Подписаться на уведомления */
export const subscribeToNotifications = (
  listener: NotificationListener
): (() => void) => {
  notificationListeners.add(listener);
  return () => notificationListeners.delete(listener);
};

/** Подписаться на удаление уведомлений */
export const subscribeToRemoveNotifications = (
  listener: NotificationRemoveListener
): (() => void) => {
  notificationRemoveListeners.add(listener);
  return () => notificationRemoveListeners.delete(listener);
};

/** Генерация уникального ID */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/** Показать уведомление */
export const showNotification = (notification: Omit<ErrorNotification, 'id' | 'timestamp'>): string => {
  const id = generateId();
  const fullNotification: ErrorNotification = {
    ...notification,
    id,
    timestamp: new Date(),
    autoHide: notification.autoHide ?? true,
    duration: notification.duration ?? 5000,
  };

  notificationListeners.forEach((listener) => listener(fullNotification));

  // Автоматическое скрытие
  if (fullNotification.autoHide && fullNotification.duration) {
    setTimeout(() => {
      removeNotification(id);
    }, fullNotification.duration);
  }

  return id;
};

/** Удалить уведомление */
export const removeNotification = (id: string): void => {
  notificationRemoveListeners.forEach((listener) => listener(id));
};

// =============================================
// Логирование ошибок
// =============================================
export const logError = (error: ApiError, context?: string): void => {
  const logData = {
    context,
    ...error.toJSON(),
    stack: error.stack,
  };

  // В development выводим полную информацию
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔴 API Error: ${error.code}`);
    console.error('Message:', error.message);
    console.error('User Message:', error.userMessage);
    console.error('Status:', error.status);
    console.error('Details:', error.details);
    if (context) console.error('Context:', context);
    console.error('Full Error:', logData);
    console.groupEnd();
  } else {
    // В production — минимальный вывод
    console.error(`API Error [${context || 'unknown'}]:`, error.message);
  }

  // TODO: Здесь можно добавить отправку в систему мониторинга (Sentry, etc.)
};

// =============================================
// Главный обработчик ошибок
// =============================================
export const handleApiError = (
  error: unknown,
  options: ErrorHandlerOptions = {}
): ApiError => {
  const {
    showNotification: shouldShowNotification = true,
    redirectOnAuth = true,
    navigate,
    onError,
    onLogout,
    logToConsole = true,
    context,
  } = options;

  // Преобразуем в ApiError
  const apiError = isApiError(error) ? error : ApiError.from(error);

  // Логируем
  if (logToConsole) {
    logError(apiError, context);
  }

  // Обработка ошибок авторизации
  if (apiError.isAuthError() && redirectOnAuth) {
    // Вызываем logout callback
    if (onLogout) {
      onLogout();
    }

    // Показываем уведомление перед редиректом
    if (shouldShowNotification) {
      showNotification({
        type: 'warning',
        title: 'Sessiya tugadi',
        message: apiError.getUserMessage(),
        code: apiError.code,
        autoHide: true,
        duration: 3000,
      });
    }

    // Редирект на страницу входа
    setTimeout(() => {
      if (navigate) {
        navigate('/login');
      } else {
        window.location.href = '/login';
      }
    }, 500);

    return apiError;
  }

  // Показываем уведомление
  if (shouldShowNotification) {
    const notificationType = getNotificationType(apiError);
    showNotification({
      type: notificationType,
      title: getNotificationTitle(apiError),
      message: apiError.getUserMessage(),
      code: apiError.code,
      autoHide: true,
      duration: getDuration(apiError),
    });
  }

  // Вызываем callback
  if (onError) {
    onError(apiError);
  }

  return apiError;
};

// =============================================
// Вспомогательные функции
// =============================================
const getNotificationType = (error: ApiError): 'error' | 'warning' | 'info' => {
  switch (error.code) {
    case ApiErrorCode.NETWORK_ERROR:
    case ApiErrorCode.TIMEOUT:
      return 'warning';
    case ApiErrorCode.VALIDATION_ERROR:
    case ApiErrorCode.BAD_REQUEST:
      return 'warning';
    case ApiErrorCode.RATE_LIMITED:
      return 'info';
    default:
      return 'error';
  }
};

const getNotificationTitle = (error: ApiError): string => {
  switch (error.code) {
    case ApiErrorCode.NETWORK_ERROR:
      return 'Tarmoq xatosi';
    case ApiErrorCode.TIMEOUT:
      return "Vaqt tugadi";
    case ApiErrorCode.UNAUTHORIZED:
    case ApiErrorCode.TOKEN_EXPIRED:
      return 'Avtorizatsiya';
    case ApiErrorCode.FORBIDDEN:
      return "Ruxsat yo'q";
    case ApiErrorCode.NOT_FOUND:
      return 'Topilmadi';
    case ApiErrorCode.VALIDATION_ERROR:
      return 'Tekshirish xatosi';
    case ApiErrorCode.SERVER_ERROR:
      return 'Server xatosi';
    case ApiErrorCode.RATE_LIMITED:
      return "Ko'p so'rovlar";
    default:
      return 'Xato';
  }
};

const getDuration = (error: ApiError): number => {
  // Важные ошибки показываем дольше
  if (error.isAuthError()) return 3000;
  if (error.code === ApiErrorCode.VALIDATION_ERROR) return 7000;
  if (error.code === ApiErrorCode.SERVER_ERROR) return 6000;
  return 5000;
};

// =============================================
// Утилиты для компонентов
// =============================================

/**
 * Обёртка для async функций с обработкой ошибок
 */
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options?: ErrorHandlerOptions
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, options);
      return null;
    }
  };
};

/**
 * Создать обработчик ошибок с предустановленными опциями
 */
export const createErrorHandler = (defaultOptions: ErrorHandlerOptions) => {
  return (error: unknown, overrideOptions?: Partial<ErrorHandlerOptions>) => {
    return handleApiError(error, { ...defaultOptions, ...overrideOptions });
  };
};

// =============================================
// Экспорт для обратной совместимости
// =============================================
export { ApiError, ApiErrorCode, isApiError };

