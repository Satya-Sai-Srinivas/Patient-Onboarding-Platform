/**
 * Global Error Handler Utility
 * Provides centralized error handling and user-friendly messages
 */

import { Alert } from 'react-native';

export interface ErrorDetails {
  message: string;
  isNetworkError: boolean;
  isServerError: boolean;
  status?: number;
  originalError?: any;
}

/**
 * Parse error and return user-friendly message
 */
export const parseError = (error: any): ErrorDetails => {
  // Default error details
  const details: ErrorDetails = {
    message: 'An unexpected error occurred. Please try again.',
    isNetworkError: false,
    isServerError: false,
    originalError: error,
  };

  // Network error
  if (error.message === 'Network Error' || error.isNetworkError) {
    details.message = 'Connection error. Please check your internet.';
    details.isNetworkError = true;
    return details;
  }

  // API error with status code
  if (error.status) {
    details.status = error.status;

    // Server errors (5xx)
    if (error.status >= 500) {
      details.message = 'Something went wrong. Please try again.';
      details.isServerError = true;
      return details;
    }

    // Client errors (4xx)
    if (error.message) {
      details.message = error.message;
    }
  }

  // Custom error message
  if (error.message && typeof error.message === 'string') {
    details.message = error.message;
  }

  return details;
};

/**
 * Show error alert to user
 */
export const showErrorAlert = (
  error: any,
  onRetry?: () => void,
  customTitle?: string
) => {
  const details = parseError(error);

  const buttons = [];

  if (onRetry && (details.isNetworkError || details.isServerError)) {
    buttons.push({
      text: 'Retry',
      onPress: onRetry,
    });
  }

  buttons.push({
    text: 'OK',
    style: 'cancel' as const,
  });

  Alert.alert(
    customTitle || 'Error',
    details.message,
    buttons
  );
};

/**
 * Retry wrapper for async functions
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      const details = parseError(error);
      if (details.status && details.status >= 400 && details.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
};

/**
 * Global error handler for uncaught errors
 */
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // TODO: Send to error tracking service
    });
  }

  // Set global error handler
  const originalErrorHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Global error:', error, 'isFatal:', isFatal);

    // Call original handler
    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }

    // TODO: Send to error tracking service
  });
};

/**
 * Check if user is online
 */
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    return true;
  } catch (error) {
    return false;
  }
};
