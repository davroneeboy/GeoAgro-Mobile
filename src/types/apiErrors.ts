/**
 * Централизованные типы и классы для обработки ошибок API
 */

// =============================================
// Коды ошибок API
// =============================================
export enum ApiErrorCode {
  // Сетевые ошибки
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // HTTP ошибки
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Бизнес-логика
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Общие
  UNKNOWN = 'UNKNOWN',
}

// =============================================
// Интерфейсы
// =============================================
export interface ApiErrorDetails {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  status: number;
  statusText: string;
  data?: {
    message?: string;
    detail?: string;
    error?: string;
    errors?: ApiErrorDetails[];
    [key: string]: unknown;
  };
}

export interface SerializedApiError {
  name: string;
  message: string;
  code: ApiErrorCode;
  status: number;
  userMessage: string;
  details?: ApiErrorDetails[];
  timestamp: string;
  requestId?: string;
}

// =============================================
// Сообщения об ошибках на узбекском
// =============================================
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.NETWORK_ERROR]: "Tarmoq xatosi. Internet aloqangizni tekshiring.",
  [ApiErrorCode.TIMEOUT]: "So'rov vaqti tugadi. Qaytadan urinib ko'ring.",
  [ApiErrorCode.BAD_REQUEST]: "Noto'g'ri so'rov. Ma'lumotlarni tekshiring.",
  [ApiErrorCode.UNAUTHORIZED]: "Avtorizatsiya talab qilinadi. Tizimga qayta kiring.",
  [ApiErrorCode.FORBIDDEN]: "Sizda ushbu amalni bajarish huquqi yo'q.",
  [ApiErrorCode.NOT_FOUND]: "So'ralgan ma'lumot topilmadi.",
  [ApiErrorCode.CONFLICT]: "Ma'lumotlar to'qnashuvi. Qaytadan urinib ko'ring.",
  [ApiErrorCode.VALIDATION_ERROR]: "Ma'lumotlar tekshiruvidan o'tmadi.",
  [ApiErrorCode.RATE_LIMITED]: "Juda ko'p so'rov. Biroz kuting.",
  [ApiErrorCode.SERVER_ERROR]: "Server xatosi. Keyinroq urinib ko'ring.",
  [ApiErrorCode.SERVICE_UNAVAILABLE]: "Xizmat vaqtincha mavjud emas.",
  [ApiErrorCode.INVALID_CREDENTIALS]: "Noto'g'ri login yoki parol.",
  [ApiErrorCode.TOKEN_EXPIRED]: "Sessiya muddati tugadi. Qayta kiring.",
  [ApiErrorCode.TOKEN_INVALID]: "Yaroqsiz token. Qayta kiring.",
  [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: "Yetarli huquqlar yo'q.",
  [ApiErrorCode.RESOURCE_NOT_FOUND]: "Resurs topilmadi.",
  [ApiErrorCode.DUPLICATE_ENTRY]: "Bunday ma'lumot allaqachon mavjud.",
  [ApiErrorCode.UNKNOWN]: "Noma'lum xato yuz berdi.",
};

// =============================================
// Класс ApiError
// =============================================
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly userMessage: string;
  public readonly details?: ApiErrorDetails[];
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly originalError?: Error;
  public readonly response?: ApiErrorResponse;

  constructor(
    message: string,
    code: ApiErrorCode = ApiErrorCode.UNKNOWN,
    status: number = 0,
    options?: {
      details?: ApiErrorDetails[];
      requestId?: string;
      originalError?: Error;
      response?: ApiErrorResponse;
      userMessage?: string;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.userMessage = options?.userMessage || ERROR_MESSAGES[code] || message;
    this.details = options?.details;
    this.timestamp = new Date();
    this.requestId = options?.requestId;
    this.originalError = options?.originalError;
    this.response = options?.response;

    // Сохраняем стек вызовов
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Создать ApiError из HTTP статуса
   */
  static fromHttpStatus(
    status: number,
    message?: string,
    response?: ApiErrorResponse
  ): ApiError {
    const codeMap: Record<number, ApiErrorCode> = {
      400: ApiErrorCode.BAD_REQUEST,
      401: ApiErrorCode.UNAUTHORIZED,
      403: ApiErrorCode.FORBIDDEN,
      404: ApiErrorCode.NOT_FOUND,
      409: ApiErrorCode.CONFLICT,
      422: ApiErrorCode.VALIDATION_ERROR,
      429: ApiErrorCode.RATE_LIMITED,
      500: ApiErrorCode.SERVER_ERROR,
      502: ApiErrorCode.SERVER_ERROR,
      503: ApiErrorCode.SERVICE_UNAVAILABLE,
      504: ApiErrorCode.TIMEOUT,
    };

    const code = codeMap[status] || ApiErrorCode.UNKNOWN;
    const defaultMessage = `HTTP ${status}: ${response?.statusText || 'Error'}`;

    return new ApiError(message || defaultMessage, code, status, {
      response,
      details: response?.data?.errors,
    });
  }

  /**
   * Создать ApiError из сетевой ошибки
   */
  static fromNetworkError(error: Error): ApiError {
    const isTimeout = error.message.toLowerCase().includes('timeout');
    const code = isTimeout ? ApiErrorCode.TIMEOUT : ApiErrorCode.NETWORK_ERROR;

    return new ApiError(error.message, code, 0, {
      originalError: error,
    });
  }

  /**
   * Создать ApiError из ответа API
   */
  static fromResponse(response: ApiErrorResponse): ApiError {
    const data = response.data;
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      `HTTP ${response.status}: ${response.statusText}`;

    return ApiError.fromHttpStatus(response.status, message, response);
  }

  /**
   * Создать ApiError из любой ошибки
   */
  static from(error: unknown): ApiError {
    // Уже ApiError
    if (error instanceof ApiError) {
      return error;
    }

    // Error с response (axios-like)
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as Error & { response?: ApiErrorResponse };
      if (axiosError.response) {
        return ApiError.fromResponse(axiosError.response);
      }
      return ApiError.fromNetworkError(error);
    }

    // Обычный Error
    if (error instanceof Error) {
      // Проверяем на сетевые ошибки
      if (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('Failed to fetch')
      ) {
        return ApiError.fromNetworkError(error);
      }
      return new ApiError(error.message, ApiErrorCode.UNKNOWN, 0, {
        originalError: error,
      });
    }

    // Строка или другой тип
    const message = typeof error === 'string' ? error : 'Unknown error';
    return new ApiError(message, ApiErrorCode.UNKNOWN);
  }

  /**
   * Проверить, требуется ли повторная авторизация
   */
  isAuthError(): boolean {
    return (
      this.code === ApiErrorCode.UNAUTHORIZED ||
      this.code === ApiErrorCode.TOKEN_EXPIRED ||
      this.code === ApiErrorCode.TOKEN_INVALID
    );
  }

  /**
   * Проверить, является ли ошибка временной (можно повторить запрос)
   */
  isRetryable(): boolean {
    return (
      this.code === ApiErrorCode.NETWORK_ERROR ||
      this.code === ApiErrorCode.TIMEOUT ||
      this.code === ApiErrorCode.SERVER_ERROR ||
      this.code === ApiErrorCode.SERVICE_UNAVAILABLE ||
      this.code === ApiErrorCode.RATE_LIMITED
    );
  }

  /**
   * Сериализовать для логирования
   */
  toJSON(): SerializedApiError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      userMessage: this.userMessage,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
    };
  }

  /**
   * Получить сообщение для отображения пользователю
   */
  getUserMessage(): string {
    // Если есть детальные ошибки валидации, собираем их
    if (this.details && this.details.length > 0) {
      return this.details.map((d) => d.message).join('. ');
    }
    return this.userMessage;
  }
}

// =============================================
// Type Guards
// =============================================
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const isNetworkError = (error: unknown): boolean => {
  if (isApiError(error)) {
    return error.code === ApiErrorCode.NETWORK_ERROR;
  }
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (isApiError(error)) {
    return error.isAuthError();
  }
  return false;
};

