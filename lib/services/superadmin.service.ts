import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse } from '../api-types';
import { AuthService } from './auth.service';

// ============================================================================
// SUPER ADMIN SERVICE TYPES
// ============================================================================

export interface SuperAdminUser {
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  inactiveUsers: number;
  superAdmins: number;
  totalClubs: number;
  totalEvents: number;
  totalBookings: number;
}

export interface AdminClub {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  images: any[];
  locationText: {
    address1: string | null;
    address2: string | null;
    state: string | null;
    city: string | null;
    pincode: string | null;
    fullAddress: string;
  };
  locationMap: { lat: number; lng: number } | null;
  foodCuisines: any[] | null;
  facilities: any[] | null;
  music: any[] | null;
  barOptions: any[] | null;
  entryPricing: {
    coupleEntryPrice: number | null;
    groupEntryPrice: number | null;
    maleStagEntryPrice: number | null;
    femaleStagEntryPrice: number | null;
    coverCharge: number | null;
    redeemDetails: any | null;
    hasTimeRestriction: boolean | null;
    timeRestriction: any | null;
    inclusions: any[] | null;
    exclusions: any[] | null;
  };
  category: string | null;
  owner: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    mobileNumber: string;
    roles: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  members: any[];
  admins: any[];
  isActive: boolean;
  maxMembers: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleManagementRequest {
  username: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

export interface UserStatusRequest {
  username: string;
}

// ============================================================================
// SUPER ADMIN SERVICE
// ============================================================================

/**
 * SuperAdmin Service
 * Handles all super administrative operations
 * These endpoints require SUPERADMIN role
 */
export class SuperAdminService {

  // ============================================================================
  // DASHBOARD & STATISTICS
  // ============================================================================

  /**
   * Get admin dashboard statistics
   * GET /admin/stats
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const response = await api.get<ApiResponse<AdminStats> | AdminStats>('/admin/stats');
      const result = handleApiResponse(response);
      // Handle both wrapped and unwrapped responses
      const data = (result as any).data || result;
      return data as AdminStats;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Get all users with pagination
   * GET /admin/users
   */
  static async getAllUsers(page: number = 0, size: number = 10): Promise<{
    users: SuperAdminUser[];
    pagination: {
      total: number;
      page: number;
      size: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await api.get<ApiResponse<SuperAdminUser[]> | SuperAdminUser[]>('/admin/users', {
        params: { page, size }
      });
      const result = handleApiResponse(response);

      // Handle both wrapped and unwrapped responses
      const usersData = Array.isArray(result) ? result : (result as any).data || [];

      return {
        users: usersData,
        pagination: {
          total: (result as any).pagination?.total || usersData.length,
          page: (result as any).pagination?.page || page,
          size: (result as any).pagination?.limit || size,
          totalPages: (result as any).pagination?.totalPages || Math.ceil(usersData.length / size)
        }
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get user by username
   * GET /admin/users/{username}
   */
  static async getUserByUsername(username: string): Promise<SuperAdminUser> {
    try {
      const response = await api.get<ApiResponse<SuperAdminUser> | SuperAdminUser>(`/admin/users/${username}`);
      const result = handleApiResponse(response);
      // Handle both wrapped and unwrapped responses
      const data = (result as any).data || result;
      return data as SuperAdminUser;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete user
   * DELETE /admin/users/{username}
   */
  static async deleteUser(username: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }> | { message: string }>(`/admin/users/${username}`);
      const result = handleApiResponse(response);
      // Handle both wrapped and unwrapped responses
      const data = (result as any).data || result;
      return data as { message: string };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  // ============================================================================
  // USER STATUS MANAGEMENT
  // ============================================================================

  /**
   * Activate user
   * POST /admin/users/{username}/activate
   */
  static async activateUser(username: string): Promise<{ message: string }> {
    try {
      const response = await api.post<ApiResponse<{ message: string }> | { message: string }>(
        `/admin/users/${username}/activate`
      );
      const result = handleApiResponse(response);
      // Handle both wrapped and unwrapped responses
      const data = (result as any).data || result;
      return data as { message: string };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Deactivate user
   * POST /admin/users/{username}/deactivate
   */
  static async deactivateUser(username: string): Promise<{ message: string }> {
    try {
      const response = await api.post<ApiResponse<{ message: string }> | { message: string }>(
        `/admin/users/${username}/deactivate`
      );
      const result = handleApiResponse(response);
      // Handle both wrapped and unwrapped responses
      const data = (result as any).data || result;
      return data as { message: string };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  /**
   * Get user roles
   * GET /admin/users/{username}/roles
   */
  static async getUserRoles(username: string): Promise<string[]> {
    try {
      const response = await api.get<ApiResponse<string[]> | string[]>(`/admin/users/${username}/roles`);
      const result = handleApiResponse(response);
      // Handle both wrapped and unwrapped responses
      const data = Array.isArray(result) ? result : (result as any).data || [];
      return data as string[];
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Add role to user
   * POST /admin/users/{username}/roles/{role}
   */
  static async addRoleToUser(username: string, role: string): Promise<{ message: string }> {
    try {
      const response = await api.post<ApiResponse<{ message: string }> | { message: string }>(
        `/admin/users/${username}/roles/${role}`
      );
      const result = handleApiResponse(response);
      // Handle both wrapped and unwrapped responses
      const data = (result as any).data || result;
      return data as { message: string };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Remove role from user
   * DELETE /admin/users/{username}/roles/{role}
   */
  static async removeRoleFromUser(username: string, role: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }> | { message: string }>(
        `/admin/users/${username}/roles/${role}`
      );
      const result = handleApiResponse(response);
      // Handle both wrapped and unwrapped responses
      const data = (result as any).data || result;
      return data as { message: string };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk activate users
   */
  static async bulkActivateUsers(usernames: string[]): Promise<{
    successful: string[];
    failed: { username: string; error: string }[];
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as { username: string; error: string }[]
    };

    for (const username of usernames) {
      try {
        await this.activateUser(username);
        results.successful.push(username);
      } catch (error) {
        results.failed.push({
          username,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Bulk deactivate users
   */
  static async bulkDeactivateUsers(usernames: string[]): Promise<{
    successful: string[];
    failed: { username: string; error: string }[];
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as { username: string; error: string }[]
    };

    for (const username of usernames) {
      try {
        await this.deactivateUser(username);
        results.successful.push(username);
      } catch (error) {
        results.failed.push({
          username,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Bulk delete users
   */
  static async bulkDeleteUsers(usernames: string[]): Promise<{
    successful: string[];
    failed: { username: string; error: string }[];
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as { username: string; error: string }[]
    };

    for (const username of usernames) {
      try {
        await this.deleteUser(username);
        results.successful.push(username);
      } catch (error) {
        results.failed.push({
          username,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // ============================================================================
  // NEW ROLE MANAGEMENT ENDPOINTS (Using Users Service - https://clubwiz.in/users/)
  // ============================================================================

  /**
   * Add role to user (Using Users Service)
   * POST /auth/roles/{username}/add/{role}
   */
  static async addRole(username: string, role: 'USER' | 'ADMIN' | 'SUPERADMIN'): Promise<{ message: string }> {
    try {
      const result = await AuthService.addRoleToUser(username, role);
      if (result.success) {
        return { message: result.message || `Role ${role} added to user ${username}` };
      }
      throw new Error(result.error || 'Failed to add role');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Remove role from user (Using Users Service)
   * POST /auth/roles/{username}/remove/{role}
   */
  static async removeRole(username: string, role: 'USER' | 'ADMIN' | 'SUPERADMIN'): Promise<{ message: string }> {
    try {
      const result = await AuthService.removeRoleFromUser(username, role);
      if (result.success) {
        return { message: result.message || `Role ${role} removed from user ${username}` };
      }
      throw new Error(result.error || 'Failed to remove role');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Add role to user (Alternative - Using Users Service)
   * POST /auth/roles/{username}/add/{role}
   */
  static async addRoleToUserAlt(username: string, role: 'USER' | 'ADMIN' | 'SUPERADMIN'): Promise<{ message: string }> {
    return this.addRole(username, role);
  }

  /**
   * Get user roles (Using Users Service)
   * GET /auth/users/{username}/roles
   */
  static async getUserRolesFromUsersService(username: string): Promise<string[]> {
    try {
      const result = await AuthService.getUserRoles(username);
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to get user roles');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if current user has super admin access
   */
  static async hasSupeAdminAccess(): Promise<boolean> {
    try {
      // Try to access admin stats to verify permissions
      await this.getAdminStats();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available roles
   */
  static getAvailableRoles(): Array<{ value: string; label: string }> {
    return [
      { value: 'USER', label: 'User' },
      { value: 'ADMIN', label: 'Admin' },
      { value: 'SUPERADMIN', label: 'Super Admin' }
    ];
  }

  /**
   * Validate role
   */
  static isValidRole(role: string): boolean {
    const validRoles = ['USER', 'ADMIN', 'SUPERADMIN'];
    return validRoles.includes(role.toUpperCase());
  }

  /**
   * Format user display name
   */
  static formatUserDisplayName(user: SuperAdminUser): string {
    return user.fullName || user.username || user.email;
  }

  /**
   * Get user status color
   */
  static getUserStatusColor(user: SuperAdminUser): string {
    return user.isActive ? 'text-green-500' : 'text-red-500';
  }

  /**
   * Get role badge color
   */
  static getRoleBadgeColor(role: string): string {
    switch (role.toUpperCase()) {
      case 'SUPERADMIN':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'ADMIN':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'USER':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }

  // ============================================================================
  // CLUB MANAGEMENT (SUPER ADMIN)
  // ============================================================================

  /**
   * Get all clubs (Super Admin)
   * GET /clubs/admin/all
   */
  static async getAllClubs(): Promise<AdminClub[]> {
    try {
      const response = await api.get<AdminClub[]>(`/clubs/admin/all`);
      const result = handleApiResponse(response);
      // The API returns an array directly
      return Array.isArray(result) ? result : [];
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete club (Super Admin)
   * DELETE /clubs/admin/{id}
   */
  static async deleteClub(clubId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string } | ApiResponse<{ message: string }>>(`/clubs/admin/${clubId}`);
      const result = handleApiResponse(response);
      // Handle both wrapped and unwrapped responses
      const data = (result as any).data || result;
      return data as { message: string };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  }
}