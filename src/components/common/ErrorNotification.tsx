/**
 * Компонент для отображения уведомлений об ошибках
 */

import React, { useEffect, useState } from 'react';
import { useNotifications, type UseNotificationsReturn } from '../../hooks/useApiError';
import type { ErrorNotification as NotificationType } from '../../utils/errorHandler';
import { ApiErrorCode } from '../../types/apiErrors';

// =============================================
// Иконки
// =============================================
const ErrorIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const NetworkIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
    />
  </svg>
);

// =============================================
// Типы
// =============================================
interface NotificationItemProps {
  notification: NotificationType;
  onClose: (id: string) => void;
}

interface ErrorNotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible?: number;
}

// =============================================
// Стили
// =============================================
const getTypeStyles = (type: NotificationType['type']): string => {
  switch (type) {
    case 'error':
      return 'bg-red-900/95 border-red-500 text-red-100';
    case 'warning':
      return 'bg-yellow-900/95 border-yellow-500 text-yellow-100';
    case 'info':
      return 'bg-blue-900/95 border-blue-500 text-blue-100';
    default:
      return 'bg-gray-900/95 border-gray-500 text-gray-100';
  }
};

const getIconColor = (type: NotificationType['type']): string => {
  switch (type) {
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-yellow-400';
    case 'info':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};

const getIcon = (type: NotificationType['type'], code?: ApiErrorCode): React.ReactElement => {
  // Специальная иконка для сетевых ошибок
  if (code === ApiErrorCode.NETWORK_ERROR) {
    return <NetworkIcon />;
  }

  switch (type) {
    case 'error':
      return <ErrorIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'info':
      return <InfoIcon />;
    default:
      return <InfoIcon />;
  }
};

const getPositionStyles = (position: ErrorNotificationContainerProps['position']): string => {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'top-center':
      return 'top-4 left-1/2 -translate-x-1/2';
    case 'bottom-right':
      return 'bottom-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'bottom-center':
      return 'bottom-4 left-1/2 -translate-x-1/2';
    case 'top-right':
    default:
      return 'top-4 right-4';
  }
};

// =============================================
// Компонент уведомления
// =============================================
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification.autoHide || !notification.duration) return;

    const startTime = Date.now();
    const duration = notification.duration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification.autoHide, notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 200);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative overflow-hidden
        min-w-[320px] max-w-md
        border-l-4 rounded-lg shadow-2xl
        backdrop-blur-sm
        transform transition-all duration-200 ease-out
        ${getTypeStyles(notification.type)}
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Иконка */}
          <div className={`flex-shrink-0 ${getIconColor(notification.type)}`}>
            {getIcon(notification.type, notification.code)}
          </div>

          {/* Контент */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
            <p className="text-sm opacity-90 break-words">{notification.message}</p>
            {notification.code && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-black/20 opacity-70">
                {notification.code}
              </span>
            )}
          </div>

          {/* Кнопка закрытия */}
          <button
            type="button"
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Yopish"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Прогресс-бар */}
      {notification.autoHide && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              notification.type === 'error'
                ? 'bg-red-400'
                : notification.type === 'warning'
                ? 'bg-yellow-400'
                : 'bg-blue-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// =============================================
// Контейнер уведомлений
// =============================================
export const ErrorNotificationContainer: React.FC<ErrorNotificationContainerProps> = ({
  position = 'top-right',
  maxVisible = 5,
}) => {
  const { notifications, removeNotification }: UseNotificationsReturn = useNotifications();

  // Показываем только последние N уведомлений
  const visibleNotifications = notifications.slice(-maxVisible);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed z-50 flex flex-col gap-3 ${getPositionStyles(position)}`}
      aria-label="Xabarnomalar"
    >
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

// =============================================
// Inline Error Display
// =============================================
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  onRetry,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`
        flex items-center gap-3 p-4
        bg-red-900/30 border border-red-700/50 rounded-lg
        text-red-200
        ${className}
      `}
    >
      <ErrorIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
      <p className="flex-1 text-sm">{message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 text-xs font-medium bg-red-800 hover:bg-red-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Qayta urinish
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 hover:bg-red-800/50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Yopish"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================
// Empty State with Error
// =============================================
interface ErrorEmptyStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorEmptyState: React.FC<ErrorEmptyStateProps> = ({
  title = 'Xato yuz berdi',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center p-8 text-center
        ${className}
      `}
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
        <ErrorIcon className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Qayta urinish
        </button>
      )}
    </div>
  );
};

// Экспорт по умолчанию
export default ErrorNotificationContainer;

