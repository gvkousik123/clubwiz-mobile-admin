import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse, User } from '../api-types';

// ============================================================================
// ADMIN SERVICE
// ============================================================================

/**
 * Admin Service
 * Handles all administrative operations for user and system management
 * These endpoints require ADMIN or SUPERADMIN role
 */
export class AdminService {

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Get all users (Admin only)
   * GET /admin/users
   * 
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 10)
   */
  static async getAllUsers(page: number = 0, size: number = 10): Promise<ApiResponse<User[]>> {
    try {
      const response = await api.get<ApiResponse<User[]>>(
        `/admin/users`,
        { params: { page, size } }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user by username (Admin only)
   * GET /admin/users/{username}
   * 
   * @param username - Username to get
   */
  static async getUserByUsername(username: string): Promise<ApiResponse<User>> {
    try {
      const response = await api.get<ApiResponse<User>>(
        `/admin/users/${username}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete user (Admin only)
   * DELETE /admin/users/{username}
   * 
   * @param username - Username to delete
   */
  static async deleteUser(username: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/admin/users/${username}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Activate user (Admin only)
   * POST /admin/users/{username}/activate
   * 
   * @param username - Username to activate
   */
  static async activateUser(username: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/admin/users/${username}/activate`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Deactivate user (Admin only)
   * POST /admin/users/{username}/deactivate
   * 
   * @param username - Username to deactivate
   */
  static async deactivateUser(username: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/admin/users/${username}/deactivate`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  /**
   * Get user roles (Admin only)
   * GET /admin/users/{username}/roles
   * 
   * @param username - Username to get roles for
   */
  static async getUserRoles(username: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get<ApiResponse<string[]>>(
        `/admin/users/${username}/roles`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Add role to user (Admin only)
   * POST /admin/users/{username}/roles/{role}
   * 
   * @param username - Username to add role to
   * @param role - Role to add (USER, ADMIN, SUPERADMIN)
   */
  static async addUserRole(username: string, role: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/admin/users/${username}/roles/${role}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Remove role from user (Admin only)
   * DELETE /admin/users/{username}/roles/{role}
   * 
   * @param username - Username to remove role from
   * @param role - Role to remove
   */
  static async removeUserRole(username: string, role: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/admin/users/${username}/roles/${role}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get system-wide admin statistics
   * GET /admin/stats
   * 
   * Returns system-wide statistics for admin dashboard
   */
  static async getAdminStats(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(
        `/admin/stats`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // NOTE: All admin management APIs are already implemented above
  // ============================================================================
}
