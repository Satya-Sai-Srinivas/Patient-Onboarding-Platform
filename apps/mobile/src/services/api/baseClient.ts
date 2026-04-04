import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_TIMEOUT = 10000;

// Storage keys
const AUTH_TOKEN_KEY = '@auth_token';

class BaseApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize auth token from storage
    this.loadAuthToken();

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token
          await this.clearAuthToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Load auth token from AsyncStorage
  private async loadAuthToken() {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  }

  // Set and persist auth token
  async setAuthToken(token: string) {
    this.authToken = token;
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  // Clear auth token
  async clearAuthToken() {
    this.authToken = null;
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Generic GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler with user-friendly messages
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message || error.response?.data?.error;
      let userMessage: string;

      // Map status codes to user-friendly messages
      switch (status) {
        case 400:
          userMessage = serverMessage || 'Invalid request. Please check your input and try again.';
          break;
        case 401:
          userMessage = 'Your session has expired. Please log in again.';
          break;
        case 404:
          userMessage = serverMessage || 'The requested resource was not found.';
          break;
        case 429:
          userMessage = 'Too many attempts. Please wait a moment and try again.';
          break;
        case 500:
        case 502:
        case 503:
          userMessage = 'Server error. Please try again later.';
          break;
        case 504:
          userMessage = 'Request timeout. Please check your connection and try again.';
          break;
        default:
          userMessage = serverMessage || error.message || 'An unexpected error occurred.';
      }

      const customError = new Error(userMessage);
      // @ts-ignore
      customError.status = status;
      // @ts-ignore
      customError.data = error.response?.data;
      // @ts-ignore
      customError.serverMessage = serverMessage;
      return customError;
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      const networkError = new Error('No internet connection. Please check your network and try again.');
      // @ts-ignore
      networkError.isNetworkError = true;
      return networkError;
    }

    return error;
  }
}

// Export a singleton instance
export default new BaseApiClient();
