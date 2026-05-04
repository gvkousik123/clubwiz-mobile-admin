import { api, handleApiResponse, handleApiError } from '../api-client';
import { STORAGE_KEYS } from '../constants/storage';
import { ApiResponse } from '../api-types';

// Profile Types based on API response structure
export interface UserProfile {
  id: string;
  username?: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  profilePicture?: string;
  isProfileVerified?: boolean;
  otpExpiryTime?: string;
  otpAttempts?: number;
  passportReceivedToken?: string;
  passportReceivedExpiryTime?: string;
  passportReceivedMaxExpiryTime?: string;
  passportReceivedAttempts?: number;
  isActive?: boolean;
  isClubAdded?: boolean;
  providerId?: string;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileStats {
  clubsJoined?: number;
  eventsAttended?: number;
  eventsOrganized?: number;
  totalClubOwned?: number;
  memberSince?: string;
  lastActivity?: string;
}

export interface ProfileUpdateRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

export interface ProfileListItem {
  id: string;
  username?: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  isActive?: boolean;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Profile Service
 * Handles all profile-related API operations
 * Based on API endpoints: /profile, /profile/stats, /profile/all, /profile/admin/{userId}
 */
export class ProfileService {

  // ============================================================================
  // USER PROFILE OPERATIONS
  // ============================================================================

  /**
   * Get current user profile
   * GET /profile
   */
  static async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get<UserProfile>('/profile');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Update user profile
   * PUT /profile
   */
  static async updateProfile(profileData: ProfileUpdateRequest): Promise<UserProfile> {
    try {
      const response = await api.put<UserProfile>('/profile', profileData);

      // Update stored auth data with new profile info
      this.updateStoredProfileData(response.data);

      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get user profile statistics
   * GET /profile/stats
   */
  static async getProfileStats(): Promise<ProfileStats> {
    try {
      const response = await api.get<ProfileStats>('/profile/stats');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  // ============================================================================
  // ADMIN PROFILE OPERATIONS
  // ============================================================================

  /**
   * Get all user profiles (Admin only)
   * GET /profile/all
   */
  static async getAllProfiles(): Promise<ProfileListItem[]> {
    try {
      const response = await api.get<ProfileListItem[]>('/profile/all');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get user profile by ID (Admin only)
   * GET /profile/admin/{userId}
   */
  static async getProfileByAdmin(userId: string): Promise<UserProfile> {
    try {
      const response = await api.get<UserProfile>(`/profile/admin/${userId}`);
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
   * Get stored auth data from localStorage
   */
  static getStoredAuthData(): any {
    try {
      if (typeof window === 'undefined') return null;
      const storedData = localStorage.getItem(STORAGE_KEYS.user);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('Error parsing stored auth data:', error);
      return null;
    }
  }

  /**
   * Update stored auth data with new profile information
   */
  static updateStoredProfileData(profileData: Partial<UserProfile>): void {
    try {
      if (typeof window === 'undefined') return;

      const storedData = this.getStoredAuthData();
      if (storedData) {
        // Merge profile data while preserving auth tokens
        const updatedData = {
          ...storedData,
          ...profileData,
          // Preserve original auth fields
          accessToken: storedData.accessToken,
          refreshToken: storedData.refreshToken,
          type: storedData.type,
        };

        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error updating stored profile data:', error);
    }
  }

  /**
   * Get current user info from stored auth data
   */
  static getCurrentUser(): Partial<UserProfile> | null {
    const authData = this.getStoredAuthData();
    if (!authData) return null;

    return {
      id: authData.id,
      username: authData.username,
      email: authData.email,
      fullName: authData.fullName,
      phoneNumber: authData.phoneNumber,
      profilePicture: authData.profilePicture,
      roles: authData.roles,
    };
  }

  /**
   * Check if user has specific role
   */
  static hasRole(role: string): boolean {
    const authData = this.getStoredAuthData();
    return authData?.roles?.includes(role) || false;
  }

  /**
   * Check if user is admin
   */
  static isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN') || this.hasRole('ADMIN') || this.hasRole('ROLE_BUSINESS_ADMIN');
  }

  /**
   * Check if user is super admin
   */
  static isSuperAdmin(): boolean {
    return this.hasRole('ROLE_SUPERADMIN') || this.hasRole('SUPERADMIN');
  }

  /**
   * Check if user is business admin
   */
  static isBusinessAdmin(): boolean {
    return this.hasRole('ROLE_BUSINESS_ADMIN') || this.hasRole('BUSINESS_ADMIN');
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  /**
   * Get current user ID
   */
  static getCurrentUserId(): string | null {
    const authData = this.getStoredAuthData();
    return authData?.id || null;
  }

  /**
   * Check if user is logged in
   */
  static isLoggedIn(): boolean {
    return !!this.getAccessToken() && !!this.getCurrentUserId();
  }

  /**
   * Check if user has club added
   */
  static hasClubAdded(): boolean {
    const authData = this.getStoredAuthData();
    return authData?.isClubAdded === true;
  }

  /**
   * Check if user's club is active
   */
  static isClubActive(): boolean {
    const authData = this.getStoredAuthData();
    return authData?.isActive === true;
  }

  /**
   * Get club status
   * Returns: { hasClub: boolean, isActive: boolean }
   */
  static getClubStatus(): { hasClub: boolean; isActive: boolean } {
    const authData = this.getStoredAuthData();
    return {
      hasClub: authData?.isClubAdded === true,
      isActive: authData?.isActive === true
    };
  }

  /**
   * Clear all stored data (logout)
   */
  static clearStoredData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.user);
  }
}
