import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/lib/constants/storage';

/**
 * Decodes a JWT token (without verification - for client-side use only)
 * JWT format: header.payload.signature
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Hook to manage and retrieve JWT token from localStorage
 * Automatically syncs across tabs/windows
 */
export function useJWTToken() {
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(STORAGE_KEYS.accessToken);
      setToken(storedToken);

      if (storedToken) {
        const decoded = decodeJWT(storedToken);
        setDecodedToken(decoded);
      }
    }
    setIsLoading(false);
  }, []);

  // Save token to localStorage
  const saveToken = (newToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.accessToken, newToken);
      setToken(newToken);
      const decoded = decodeJWT(newToken);
      setDecodedToken(decoded);
    }
  };

  // Clear token from localStorage
  const clearToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      setToken(null);
      setDecodedToken(null);
    }
  };

  // Check if token is valid (not expired)
  const isTokenValid = (): boolean => {
    if (!decodedToken?.exp) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp > currentTime;
  };

  // Get user email from token
  const getUserEmail = (): string | null => {
    return decodedToken?.sub || decodedToken?.email || null;
  };

  // Get token expiration time
  const getTokenExpiration = (): Date | null => {
    if (!decodedToken?.exp) return null;
    return new Date(decodedToken.exp * 1000);
  };

  // Get issuer from token
  const getIssuer = (): string | null => {
    return decodedToken?.iss || null;
  };

  return {
    token,
    decodedToken,
    isLoading,
    saveToken,
    clearToken,
    isTokenValid,
    getUserEmail,
    getTokenExpiration,
    getIssuer,
    isAuthenticated: !!token && isTokenValid(),
  };
}
