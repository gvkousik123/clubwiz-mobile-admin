import { api, handleApiResponse, handleApiError } from '../api-client';
import {
  ApiResponse,
  SessionInfo,
  CORSOriginsResponse
} from '../api-types';
import { AuthService } from './auth.service';

// ============================================================================
// SESSION SERVICE TYPES
// ============================================================================

export interface SessionDeleteResponse {
  message: string;
  success: boolean;
}

// ============================================================================
// SESSION SERVICE
// ============================================================================

/**
 * Session Management Service
 * Handles session management, CORS settings, and related operations
 * NOTE: Session APIs now use the Users Service (https://clubwiz.in/users/)
 */
export class SessionService {

  // ============================================================================
  // CORS MANAGEMENT
  // ============================================================================

  /**
   * Get CORS origins and settings
   * GET /auth/cors-origins
   */
  static async getCorsOrigins(): Promise<CORSOriginsResponse> {
    try {
      const response = await api.get<CORSOriginsResponse>('/auth/cors-origins');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT (Using Users Service)
  // ============================================================================

  /**
   * Get all active sessions for authenticated user
   * GET /auth/sessions (Users Service)
   */
  static async getUserSessions(): Promise<SessionInfo[]> {
    try {
      const result = await AuthService.getActiveSessions();
      if (result.success && result.data) {
        return result.data as unknown as SessionInfo[];
      }
      throw new Error(result.error || 'Failed to fetch sessions');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch sessions');
    }
  }

  /**
   * Delete specific session by ID
   * DELETE /auth/sessions/{id} (Users Service)
   */
  static async deleteSession(sessionId: string): Promise<SessionDeleteResponse> {
    try {
      const result = await AuthService.revokeSessionById(sessionId);
      return {
        success: result.success,
        message: result.message || 'Session deleted successfully'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete session');
    }
  }

  /**
   * Revoke all sessions for authenticated user (logout from all devices)
   * DELETE /auth/sessions (Users Service)
   */
  static async revokeAllSessions(): Promise<SessionDeleteResponse> {
    try {
      const result = await AuthService.revokeAllSessions();
      return {
        success: result.success,
        message: result.message || 'All sessions revoked successfully'
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to revoke sessions');
    }
  }

  // ============================================================================
  // SESSION UTILITIES
  // ============================================================================

  /**
   * Get current session info
   */
  static getCurrentSession(): SessionInfo | null {
    if (typeof window === 'undefined') return null;

    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;

      const user = JSON.parse(userData);

      // Create session info from stored user data
      return {
        sessionId: 'current',
        userId: user.id || user.user?.id,
        username: user.username || user.user?.username,
        roles: user.roles || user.user?.roles || [],
        isActive: true,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: 'unknown',
        userAgent: navigator.userAgent
      };
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * Check if user has specific role in current session
   */
  static hasRole(role: string): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    return session.roles.includes(role.toUpperCase());
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');

    return !!(token && user);
  }

  /**
   * Get session display name
   */
  static getSessionDisplayName(session: SessionInfo): string {
    return session.username || session.userId || 'Unknown User';
  }

  /**
   * Format session creation time
   */
  static formatSessionTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Check if session is current session
   */
  static isCurrentSession(sessionId: string): boolean {
    const currentSession = this.getCurrentSession();
    return currentSession?.sessionId === sessionId;
  }

  /**
   * Get session status color for UI
   */
  static getSessionStatusColor(session: SessionInfo): string {
    if (!session.isActive) return 'text-red-500';

    const lastActivity = new Date(session.lastActivity);
    const now = new Date();
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursSinceActivity < 1) return 'text-green-500';
    if (hoursSinceActivity < 24) return 'text-yellow-500';
    return 'text-orange-500';
  }

  /**
   * Get browser info from user agent
   */
  static getBrowserInfo(userAgent: string): { browser: string; os: string } {
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
      userAgent.includes('Firefox') ? 'Firefox' :
        userAgent.includes('Safari') ? 'Safari' :
          userAgent.includes('Edge') ? 'Edge' : 'Unknown';

    const os = userAgent.includes('Windows') ? 'Windows' :
      userAgent.includes('Mac') ? 'macOS' :
        userAgent.includes('Linux') ? 'Linux' :
          userAgent.includes('Android') ? 'Android' :
            userAgent.includes('iOS') ? 'iOS' : 'Unknown';

    return { browser, os };
  }
}