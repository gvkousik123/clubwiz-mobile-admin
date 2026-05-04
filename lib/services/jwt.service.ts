import { STORAGE_KEYS } from '@/lib/constants/storage';

/**
 * JWT Token Management Service
 * Handles storing, retrieving, validating, and injecting JWT tokens
 */
export class JWTService {
  /**
   * Store JWT token in localStorage
   */
  static storeToken(token: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.accessToken, token);
        console.log('✅ JWT Token stored successfully');
      } catch (error) {
        console.error('❌ Failed to store JWT token:', error);
      }
    }
  }

  /**
   * Retrieve JWT token from localStorage
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(STORAGE_KEYS.accessToken);
      } catch (error) {
        console.error('❌ Failed to retrieve JWT token:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Remove JWT token from localStorage
   */
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.accessToken);
        console.log('✅ JWT Token removed successfully');
      } catch (error) {
        console.error('❌ Failed to remove JWT token:', error);
      }
    }
  }

  /**
   * Check if user is authenticated (token exists)
   */
  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Decode JWT token (payload only - no verification)
   * Token format: header.payload.signature
   */
  static decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));
      return decoded;
    } catch (error) {
      console.error('❌ Failed to decode JWT:', error);
      return null;
    }
  }

  /**
   * Get current stored token and decode it
   */
  static getCurrentTokenData(): any {
    const token = this.getToken();
    if (!token) return null;
    return this.decodeToken(token);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token?: string): boolean {
    const tokenData = token ? this.decodeToken(token) : this.getCurrentTokenData();
    if (!tokenData?.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return tokenData.exp <= currentTime;
  }

  /**
   * Get time remaining until token expires (in seconds)
   */
  static getTokenTimeRemaining(): number {
    const tokenData = this.getCurrentTokenData();
    if (!tokenData?.exp) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, tokenData.exp - currentTime);
  }

  /**
   * Get user identifier from token
   */
  static getUserIdentifier(): string | null {
    const tokenData = this.getCurrentTokenData();
    return tokenData?.sub || tokenData?.email || tokenData?.user_id || null;
  }

  /**
   * Get token issuer
   */
  static getIssuer(): string | null {
    const tokenData = this.getCurrentTokenData();
    return tokenData?.iss || null;
  }

  /**
   * Get Authorization header value for API requests
   */
  static getAuthorizationHeader(): string | null {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Create headers object with Authorization token
   */
  static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authHeader = this.getAuthorizationHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    return headers;
  }

  /**
   * Remember user session - stores additional user data
   */
  static rememberUser(userData: {
    email?: string;
    phone?: string;
    name?: string;
    userId?: string;
    role?: string;
  }): void {
    if (typeof window !== 'undefined') {
      try {
        if (userData.email) {
          localStorage.setItem('user-email', userData.email);
        }
        if (userData.phone) {
          localStorage.setItem('user-phone', userData.phone);
        }
        if (userData.name) {
          localStorage.setItem('user-name', userData.name);
        }
        if (userData.userId) {
          localStorage.setItem('user-id', userData.userId);
        }
        if (userData.role) {
          localStorage.setItem('user-role', userData.role);
        }
        console.log('✅ User session remembered');
      } catch (error) {
        console.error('❌ Failed to remember user session:', error);
      }
    }
  }

  /**
   * Get remembered user data
   */
  static getRememberedUser(): {
    email?: string;
    phone?: string;
    name?: string;
    userId?: string;
    role?: string;
  } {
    if (typeof window === 'undefined') return {};

    return {
      email: localStorage.getItem('user-email') || undefined,
      phone: localStorage.getItem('user-phone') || undefined,
      name: localStorage.getItem('user-name') || undefined,
      userId: localStorage.getItem('user-id') || undefined,
      role: localStorage.getItem('user-role') || undefined,
    };
  }

  /**
   * Clear all user session data
   */
  static clearSession(): void {
    if (typeof window !== 'undefined') {
      this.removeToken();
      localStorage.removeItem('user-email');
      localStorage.removeItem('user-phone');
      localStorage.removeItem('user-name');
      localStorage.removeItem('user-id');
      localStorage.removeItem('user-role');
      console.log('✅ User session cleared');
    }
  }

  /**
   * Validate OTP response and store token
   * Handles the exact response format from backend
   */
  static handleOTPValidationResponse(response: {
    returnCode?: number;
    returnMessage?: string;
    transactionId?: string | null;
    jwtToken?: string;
    [key: string]: any;
  }): boolean {
    try {
      const returnCode = response.returnCode || response.code;

      // Check if validation was successful (status code 100)
      if (returnCode !== 100) {
        throw new Error(response.returnMessage || 'OTP validation failed');
      }

      // Extract JWT token from response
      const token = response.jwtToken || response.token;
      if (!token) {
        throw new Error('No JWT token in OTP validation response');
      }

      // Store the token
      this.storeToken(token);

      // Remember user if email is available
      if (response.email) {
        this.rememberUser({ email: response.email });
      }

      console.log('✅ OTP Validation Successful - Token Stored');
      console.log(`📊 Token expires in: ${this.getTokenTimeRemaining()} seconds`);
      console.log(`👤 User: ${this.getUserIdentifier()}`);

      return true;
    } catch (error) {
      console.error('❌ OTP Validation Response Error:', error);
      return false;
    }
  }
}
