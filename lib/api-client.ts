import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { STORAGE_KEYS } from './constants/storage';
import {
  SESSION_EXPIRED_EVENT,
  SESSION_EXPIRED_FLAG,
  SESSION_GATE_FLAG,
  messageSaysExpired,
  storedTokenIsExpired,
} from './auth/session-expiry';
import { ApiResponse } from './api-types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clubwiz.in';
const API_TIMEOUT = 600000; // 10 minutes (increased for event/club image upload operations)

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get auth token from localStorage or your preferred storage
    const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.accessToken) : null;

    if (token && token !== 'null' && token !== 'undefined') {
      // Ensure the token doesn't already have the prefix (rare but possible with some libraries)
      const authValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = authValue;
    }

    // Allow Axios to set the correct multipart boundary when FormData is used.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const removeContentType = (headers: Record<string, unknown> | undefined) => {
        if (!headers) return;
        if ('Content-Type' in headers) {
          delete headers['Content-Type'];
        }
        if ('content-type' in headers) {
          delete headers['content-type'];
        }
      };

      removeContentType(config.headers as Record<string, unknown> | undefined);
      removeContentType((config.headers as any)?.common);
      if (config.method) {
        const methodHeaders = (config.headers as any)[config.method];
        removeContentType(methodHeaders);
      }
    }

    // Log all requests for debugging
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      headers: config.headers,
      data: config.data,
      hasToken: !!token,
    });

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Helper function to handle JWT token expiration or unauthorized/forbidden access
const handleForcedLogout = () => {
  if (typeof window !== 'undefined') {
    // Clear all auth-related localStorage
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.userDetails);
    localStorage.removeItem('userRoles'); // Clear user roles
    
    // Clear club registration form data
    localStorage.removeItem(STORAGE_KEYS.clubFormData);
    localStorage.removeItem(STORAGE_KEYS.clubLogoPreview);
    localStorage.removeItem(STORAGE_KEYS.clubFoodDrinksPreview);
    localStorage.removeItem(STORAGE_KEYS.clubAmbiencePreview);
    localStorage.removeItem(STORAGE_KEYS.clubMenuPreview);
    localStorage.removeItem(STORAGE_KEYS.clubSelectedLocation);
    localStorage.removeItem(STORAGE_KEYS.clubSelectedMusicGenres);
    localStorage.removeItem(STORAGE_KEYS.ownedClubId);

    // Survives a hard reload: the root page reads this and forwards to login rather
    // than the first-run intro screen.
    try {
      sessionStorage.setItem(SESSION_EXPIRED_FLAG, '1');
    } catch {
      /* storage unavailable - the event below still drives the UI */
    }

    // Let the mounted gate show "Session expired" with a Login button. It navigates
    // in-app, which matters on Capacitor: WebViewLocalServer serves index.html for
    // any extensionless path, so a hard redirect to /bz/auth/login never lands there.
    if ((window as any)[SESSION_GATE_FLAG]) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      return;
    }

    // No gate mounted (shouldn't happen - it lives in the root layout). Fall back.
    window.location.replace('/bz/auth/login');
  }
};

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log all successful responses for debugging
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    // Log all errors for debugging
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    const status = error.response?.status;
    const errorMessage = error.response?.data?.error || error.response?.data?.message || '';

    // 401 always means the session is gone.
    if (status === 401) {
      console.warn(`Authentication failed (401 Unauthorized): session expired`);
      handleForcedLogout();
      return Promise.reject(error);
    }

    // The backend returns 403 for BOTH an expired JWT and a genuine role/ownership
    // denial (see EVENT-CREATE-EDIT-FRONTEND-GUIDE.md). Only treat it as an expiry
    // when the body says so, or the stored token is actually past its `exp` claim -
    // otherwise a business admin poking at another club's resource would be logged out.
    if (status === 403) {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEYS.accessToken)
        : null;

      if (messageSaysExpired(errorMessage) || storedTokenIsExpired(token)) {
        console.warn(`Access forbidden (403): token expired, session over`);
        handleForcedLogout();
        return Promise.reject(error);
      }

      console.warn(`Access forbidden (403): you may not have permission for this resource`);
      return Promise.reject(error);
    }

    // Any other status whose body still reports a dead token.
    if (messageSaysExpired(errorMessage)) {
      handleForcedLogout();
      return Promise.reject(error);
    }

    // Handle other HTTP errors
    if (error.response?.status >= 500) {
      // Server errors
      console.error('Server error occurred');
    }

    return Promise.reject(error);
  }
);

// Generic API methods
export const api = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },

  // POST request
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },

  // PUT request
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },

  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },

  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },
};

// Utility functions for handling responses
export const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> => {
  return response.data;
};

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default apiClient;