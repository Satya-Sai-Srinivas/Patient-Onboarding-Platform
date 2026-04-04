/**
 * API Error Messages
 * User-friendly error messages for common API errors
 */

export const API_ERROR_MESSAGES = {
  // OTP Errors
  OTP_SEND_FAILED: 'Failed to send OTP. Please try again.',
  OTP_INVALID: 'Invalid OTP code. Please check and try again.',
  OTP_EXPIRED: 'OTP code has expired. Please request a new one.',
  OTP_RATE_LIMIT: 'Too many OTP requests. Please wait a moment before trying again.',

  // Check-In Errors
  CHECKIN_FAILED: 'Check-in failed. Please try again.',
  CHECKIN_ALREADY_EXISTS: 'You have already checked in.',
  QR_CODE_INVALID: 'Invalid QR code. Please scan a valid check-in QR code.',
  QR_CODE_EXPIRED: 'This QR code has expired. Please request a new one.',

  // Queue Errors
  QUEUE_FETCH_FAILED: 'Failed to fetch queue status. Please try again.',

  // Network Errors
  NETWORK_ERROR: 'No internet connection. Please check your network and try again.',
  TIMEOUT: 'Request timeout. Please try again.',

  // Server Errors
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  NOT_FOUND: 'Resource not found.',

  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Get user-friendly error message based on error object
 */
export function getErrorMessage(error: any): string {
  // @ts-ignore
  if (error.isNetworkError) {
    return API_ERROR_MESSAGES.NETWORK_ERROR;
  }

  // @ts-ignore
  const status = error.status;

  switch (status) {
    case 400:
      return error.message || API_ERROR_MESSAGES.OTP_INVALID;
    case 401:
      return API_ERROR_MESSAGES.UNAUTHORIZED;
    case 404:
      return error.message || API_ERROR_MESSAGES.NOT_FOUND;
    case 409:
      return API_ERROR_MESSAGES.CHECKIN_ALREADY_EXISTS;
    case 429:
      return API_ERROR_MESSAGES.OTP_RATE_LIMIT;
    case 500:
    case 502:
    case 503:
      return API_ERROR_MESSAGES.SERVER_ERROR;
    case 504:
      return API_ERROR_MESSAGES.TIMEOUT;
    default:
      return error.message || API_ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}
