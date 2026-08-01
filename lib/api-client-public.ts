import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { STORAGE_KEYS } from './constants/storage';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clubwiz.in';
const API_TIMEOUT = 15000; // 15 seconds

// ============================================================================
// PUBLIC API CLIENT (No Authentication Required)
// ============================================================================

/**
 * Public API client for endpoints that don't require authentication
 * Use this for guest users and public data access
 */
export const publicApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Public API response interceptor (handle JWT expiration)
publicApi.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Check for JWT token expiration errors
    if (error.response?.status === 401 ||
      error.response?.data?.error?.includes('JWT token') ||
      error.response?.data?.error?.includes('token is expired')) {

      console.error('🔐 JWT Token expired or invalid:', error.response?.data?.error);

      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.accessToken);
        localStorage.removeItem(STORAGE_KEYS.refreshToken);
        localStorage.removeItem(STORAGE_KEYS.user);

        // Redirect to home page
        window.location.href = '/';
      }

      return Promise.reject({
        ...error,
        isTokenExpired: true,
        message: 'JWT token is expired or invalid. Please login again.'
      });
    }

    // Handle other common HTTP errors for public APIs
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded');
    } else if (error.response?.status >= 500) {
      console.error('Server error');
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// AUTHENTICATED API CLIENT (Original)
// ============================================================================

/**
 * Main API client with authentication support
 * Automatically adds Bearer token to requests
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Check if this is a public endpoint that shouldn't have auth
    const publicEndpoints = [
      '/search/',
      '/clubs/public',
      '/clubs/search',
      '/lookup/',
      '/auth/signin',
      '/auth/signup',
      '/auth/password-reset',
      '/auth/mobile/verify-firebase-token',
      '/auth/google'
    ];

    const isPublicEndpoint = publicEndpoints.some(endpoint =>
      config.url?.includes(endpoint)
    );

    // Only add token for non-public endpoints
    if (!isPublicEndpoint) {
      const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.accessToken) : null;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors and JWT expiration
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Check for JWT token expiration errors
    if (error.response?.status === 401 ||
      error.response?.data?.error?.includes('JWT token') ||
      error.response?.data?.error?.includes('token is expired')) {

      console.error('🔐 JWT Token expired or invalid:', error.response?.data?.error);

      // Clear all auth tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.accessToken);
        localStorage.removeItem(STORAGE_KEYS.refreshToken);
        localStorage.removeItem(STORAGE_KEYS.user);

        // Redirect to home page
        window.location.href = '/';
      }

      return Promise.reject({
        ...error,
        isTokenExpired: true,
        message: 'JWT token is expired or invalid. Please login again.'
      });
    }

    if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden');
    } else if (error.response?.status === 429) {
      // Too many requests
      console.error('Rate limit exceeded');
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error');
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(STORAGE_KEYS.accessToken);
};

/**
 * Check if user is in guest mode
 */
export const isGuestMode = (): boolean => {
  return !isAuthenticated();
};

/**
 * Get appropriate API client based on authentication status
 * @param forcePublic - Force use of public API even if authenticated
 */
export const getApiClient = (forcePublic: boolean = false): AxiosInstance => {
  if (forcePublic || isGuestMode()) {
    return publicApi;
  }
  return apiClient;
};

// ============================================================================
// EXPORTS
// ============================================================================

// Export both clients for flexibility
export { apiClient as api };

// Export the original handler functions for backward compatibility
export const handleApiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.data?.error || error.message;
    console.error('API Error:', message);
    return message;
  } else if (error.request) {
    // Network error
    console.error('Network Error:', error.message);
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    console.error('Error:', error.message);
    return error.message || 'An unexpected error occurred';
  }
};