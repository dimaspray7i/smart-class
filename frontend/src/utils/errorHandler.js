/**
 * Error handling utilities for consistent error management
 */

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ErrorCodes = {
  // Client errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',

  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',

  // Application errors
  INVALID_STATE: 'INVALID_STATE',
  OPERATION_FAILED: 'OPERATION_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export function getErrorMessage(error, defaultMessage = 'Terjadi kesalahan yang tidak terduga') {
  if (typeof error === 'string') return error;

  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;

  return defaultMessage;
}

export function getErrorCode(error) {
  if (error?.code) return error.code;
  if (error?.response?.data?.code) return error.response.data.code;

  return ErrorCodes.UNKNOWN_ERROR;
}

export function getErrorStatusCode(error) {
  if (error?.statusCode) return error.statusCode;
  if (error?.response?.status) return error.response.status;

  return 500;
}

export function isNetworkError(error) {
  return !error?.response || error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network');
}

export function handleApiError(error, context = '') {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  const statusCode = getErrorStatusCode(error);

  console.error(`[API Error] ${context}:`, {
    message,
    code,
    statusCode,
    error
  });

  // Distinguish error types for better user feedback
  if (statusCode === 401) {
    return {
      message: 'Sesi Anda telah berakhir. Silakan login kembali.',
      code: ErrorCodes.UNAUTHORIZED,
      type: 'warning'
    };
  }

  if (statusCode === 403) {
    return {
      message: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
      code: ErrorCodes.FORBIDDEN,
      type: 'error'
    };
  }

  if (statusCode === 404) {
    return {
      message: 'Data yang dicari tidak ditemukan.',
      code: ErrorCodes.NOT_FOUND,
      type: 'error'
    };
  }

  if (statusCode === 409) {
    return {
      message,
      code: ErrorCodes.CONFLICT,
      type: 'warning'
    };
  }

  if (statusCode >= 500) {
    return {
      message: 'Server mengalami masalah. Silakan coba lagi nanti.',
      code: ErrorCodes.SERVER_ERROR,
      type: 'error'
    };
  }

  if (isNetworkError(error)) {
    return {
      message: 'Koneksi internet Anda terputus. Silakan periksa koneksi Anda.',
      code: ErrorCodes.NETWORK_ERROR,
      type: 'error'
    };
  }

  return {
    message,
    code,
    type: 'error'
  };
}

export function createErrorToast(error, context = '') {
  const errorInfo = handleApiError(error, context);
  return {
    message: `❌ ${errorInfo.message}`,
    type: errorInfo.type
  };
}
