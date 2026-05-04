import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse } from '../api-types';

// ============================================================================
// PASSWORD SERVICE TYPES
// ============================================================================

export interface PasswordResetRequest {
  mobileNumber: string;
  newPassword: string;
}

export interface PasswordResetInitiateEmailRequest {
  email: string;
}

export interface PasswordResetInitiateMobileRequest {
  mobileNumber: string;
}

export interface PasswordResetResponse {
  message: string;
}

// ============================================================================
// PASSWORD SERVICE
// ============================================================================

/**
 * Password Service
 * Handles all password reset related operations
 * Based on API endpoints: /auth/password-reset/reset/mobile, /auth/password-reset/initiate/email, /auth/password-reset/initiate/mobile
 */
export class PasswordService {

  // ============================================================================
  // PASSWORD RESET OPERATIONS
  // ============================================================================

  /**
   * Reset password using mobile number (DEPRECATED - use resetPasswordWithMobile with OTP)
   * POST /auth/password-reset/reset/mobile
   */
  static async resetPasswordWithMobileOld(mobileNumber: string, newPassword: string): Promise<PasswordResetResponse> {
    try {
      const response = await api.post<PasswordResetResponse>('/auth/password-reset/reset/mobile', {
        mobileNumber,
        newPassword
      });

      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Initiate password reset via email
   * POST /auth/password-reset/initiate/email
   */
  static async initiatePasswordResetWithEmail(email: string): Promise<PasswordResetResponse> {
    try {
      const response = await api.post<PasswordResetResponse>('/auth/password-reset/initiate/email', {
        email
      });

      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Initiate password reset via mobile
   * POST /auth/password-reset/initiate/mobile
   */
  static async initiatePasswordResetWithMobile(mobileNumber: string): Promise<PasswordResetResponse> {
    try {
      const response = await api.post<PasswordResetResponse>('/auth/password-reset/initiate/mobile', {
        mobileNumber
      });

      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate mobile number format
   */
  static isValidMobileNumber(mobileNumber: string): boolean {
    // Remove all non-digit characters
    const cleanNumber = mobileNumber.replace(/\D/g, '');

    // Check if it's a valid length (10 digits for most countries)
    // You can adjust this based on your requirements
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  /**
   * Format mobile number
   */
  static formatMobileNumber(mobileNumber: string): string {
    // Remove all non-digit characters
    const cleanNumber = mobileNumber.replace(/\D/g, '');

    // Add country code if not present (assuming +91 for India)
    if (cleanNumber.length === 10 && !cleanNumber.startsWith('91')) {
      return `+91${cleanNumber}`;
    }

    if (cleanNumber.length > 10 && !cleanNumber.startsWith('+')) {
      return `+${cleanNumber}`;
    }

    return cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get password strength level
   */
  static getPasswordStrengthLevel(password: string): 'weak' | 'medium' | 'strong' {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    if (score >= 5) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  }

  /**
   * Get password strength color
   */
  static getPasswordStrengthColor(level: 'weak' | 'medium' | 'strong'): string {
    switch (level) {
      case 'weak':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'strong':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Sanitize and prepare mobile number for API
   */
  static prepareMobileForAPI(mobileNumber: string): string {
    // Remove spaces, dashes, parentheses, and other formatting
    let cleaned = mobileNumber.replace(/[\s\-\(\)\.]/g, '');

    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    return cleaned;
  }

  /**
   * Check if string is email or mobile
   */
  static getContactType(contact: string): 'email' | 'mobile' | 'unknown' {
    if (this.isValidEmail(contact)) {
      return 'email';
    }

    if (this.isValidMobileNumber(contact)) {
      return 'mobile';
    }

    return 'unknown';
  }

  // ============================================================================
  // EMAIL-BASED PASSWORD RESET FLOW
  // ============================================================================

  /**
   * Initiate password reset via email
   * POST /auth/password-reset/initiate/email
   */
  static async initiateEmailReset(email: string): Promise<ApiResponse<PasswordResetResponse>> {
    try {
      const response = await api.post<ApiResponse<PasswordResetResponse>>(
        '/auth/password-reset/initiate/email',
        { email }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Verify password reset token
   * POST /auth/password-reset/verify/token
   */
  static async verifyResetToken(token: string): Promise<ApiResponse<{ valid: boolean }>> {
    try {
      const response = await api.post<ApiResponse<{ valid: boolean }>>(
        '/auth/password-reset/verify/token',
        { token }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Reset password using token
   * POST /auth/password-reset/reset/token
   */
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<ApiResponse<PasswordResetResponse>> {
    try {
      const response = await api.post<ApiResponse<PasswordResetResponse>>(
        '/auth/password-reset/reset/token',
        { token, newPassword }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // MOBILE-BASED PASSWORD RESET FLOW
  // ============================================================================

  /**
   * Initiate password reset via mobile
   * POST /auth/password-reset/initiate/mobile
   */
  static async initiateMobileReset(mobileNumber: string): Promise<ApiResponse<PasswordResetResponse>> {
    try {
      const response = await api.post<ApiResponse<PasswordResetResponse>>(
        '/auth/password-reset/initiate/mobile',
        { mobileNumber }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Verify password reset OTP
   * POST /auth/password-reset/verify/otp
   */
  static async verifyResetOTP(mobileNumber: string, otp: string): Promise<ApiResponse<{ valid: boolean }>> {
    try {
      const response = await api.post<ApiResponse<{ valid: boolean }>>(
        '/auth/password-reset/verify/otp',
        { mobileNumber, otp }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Reset password using mobile OTP
   * POST /auth/password-reset/reset/mobile
   */
  static async resetPasswordWithMobile(mobileNumber: string, otp: string, newPassword: string): Promise<ApiResponse<PasswordResetResponse>> {
    try {
      const response = await api.post<ApiResponse<PasswordResetResponse>>(
        '/auth/password-reset/reset/mobile',
        { mobileNumber, otp, newPassword }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}