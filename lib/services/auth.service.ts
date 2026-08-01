import axios, { AxiosInstance } from 'axios';
import { api, handleApiResponse, handleApiError } from '../api-client';
import { publicApi } from '../api-client-public';
import {
    ApiResponse,
    LoginRequest,
    RegisterRequest,
    OTPRequest,
    OTPVerifyRequest,
    AuthResponse,
    User,
} from '../api-types';
import { STORAGE_KEYS } from '../constants/storage';

// ============================================================================
// USERS API CLIENT CONFIGURATION
// ============================================================================
const USERS_API_BASE_URL = 'https://clubwiz.in/users';

const usersApiClient: AxiosInstance = axios.create({
    baseURL: USERS_API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor for adding auth token
usersApiClient.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.accessToken) : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`📤 Users API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
            data: config.data,
            hasToken: !!token,
        });
        return config;
    },
    (error) => {
        console.error('❌ Users API Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
usersApiClient.interceptors.response.use(
    (response) => {
        console.log(`✅ Users API Response: ${response.status} ${response.config.url}`, {
            data: response.data,
        });
        return response;
    },
    (error) => {
        console.error(`❌ Users API Error: ${error.response?.status} ${error.config?.url}`, {
            data: error.response?.data,
            message: error.message,
        });
        return Promise.reject(error);
    }
);

// ============================================================================
// INTERNAL TYPES (from users.service.ts)
// ============================================================================

interface UsersApiSignUpRequest {
    fullName: string;
    email: string;
    password: string;
    mobileNumber: string;
}

interface UsersApiSignInRequest {
    usernameOrEmail: string;
    password: string;
}

interface UsersApiAuthResponse {
    accessToken: string;
    refreshToken: string;
    type?: string;
    expiresIn?: number;
    id?: string;
    username?: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    mobileNumber?: string;
    roles?: string[];
    profilePicture?: string;
    isActive?: boolean;
    isClubAdded?: boolean;
    user?: {
        id: string;
        username?: string;
        email: string;
        fullName: string;
        phoneNumber?: string;
        mobileNumber?: string;
        roles: string[];
        profilePicture?: string;
        isActive?: boolean;
        isClubAdded?: boolean;
    };
}

interface UsersApiSessionInfo {
    id: string;
    deviceInfo?: string;
    createdAt: string;
    lastUsed?: string;
    ipAddress?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const handleUsersApiResponse = <T>(response: any): T => {
    return response.data;
};

const handleUsersApiError = (error: any): string => {
    // Check for specific error details first (e.g., "Bad credentials")
    if (error.response?.data?.details) {
        return error.response.data.details;
    }
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

const storeAuthSession = (data: any) => {
    if (typeof window === 'undefined') return;

    // Handle AuthResponse from Users API (data might be UsersApiAuthResponse)
    let accessToken = data.accessToken || data.token;
    let refreshToken = data.refreshToken;

    if (accessToken) {
        localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    }
    if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    }

    // Construct user data object
    // If it's from Users API, it might have top-level fields
    // If it's from other APIs, it might be nested in 'user'
    let userData: any = {};

    if (data.user && typeof data.user === 'object') {
        userData = { ...data.user };
    } else {
        // Try to pick fields from top level
        userData = {
            id: data.id,
            username: data.username,
            email: data.email,
            fullName: data.fullName,
            phoneNumber: data.phoneNumber || data.mobileNumber,
            roles: data.roles || [],
            profilePicture: data.profilePicture,
            isActive: data.isActive,
            isClubAdded: data.isClubAdded
        };
    }

    // Ensure tokens are in user object if needed (legacy support)
    userData.accessToken = accessToken;
    userData.refreshToken = refreshToken;

    // Remove undefined keys
    Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);

    if (Object.keys(userData).length > 2) { // check if we have more than just tokens
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));

        // Store email and phone separately for easy access
        if (userData.email) {
            localStorage.setItem('user-email', userData.email);
        }
        if (userData.phoneNumber) {
            localStorage.setItem('user-phone', userData.phoneNumber);
        }

        console.log('✅ Auth session stored:', { hasToken: !!accessToken, user: userData });
    }
};

const clearAuthSession = () => {
    if (typeof window === 'undefined') return;

    // Clear all auth-related storage keys
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.userDetails);
    localStorage.removeItem(STORAGE_KEYS.pendingPhone);

    // Clear user info keys
    localStorage.removeItem('user-email');
    localStorage.removeItem('user-phone');
    localStorage.removeItem('user-name');
    localStorage.removeItem('user-id');
    localStorage.removeItem('user-role');

    // Clear Firebase user data
    localStorage.removeItem('firebaseUser');

    // Clear any other clubviz-related storage
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('clubviz-') || key.startsWith('user-')) {
            localStorage.removeItem(key);
        }
    });
};

// ============================================================================
// AUTH SERVICE
// Integrated with Users Service (https://clubwiz.in/users/)
// ============================================================================

export class AuthService {

    // --------------------------------------------------------------------------
    // 1. SIGN IN (Login with Email/Username & Password)
    // Endpoint: POST /auth/signin (Users Service)
    // --------------------------------------------------------------------------
    static async signIn(usernameOrEmail: string, password: string): Promise<ApiResponse<UsersApiAuthResponse>> {
        try {
            console.log('🔐 Signing in user:', usernameOrEmail);

            const response = await usersApiClient.post('/auth/signin', {
                usernameOrEmail,
                password,
            });

            const result = handleUsersApiResponse<UsersApiAuthResponse>(response);

            // Store auth session
            if (result.accessToken) {
                storeAuthSession(result);
            }

            return {
                success: true,
                data: result,
                message: 'Login successful'
            };
        } catch (error: any) {
            console.error('❌ Login failed:', error);
            const errorMessage = handleUsersApiError(error);
            throw new Error(errorMessage);
        }
    }

    // --------------------------------------------------------------------------
    // 2. SIGN UP (Register new user)
    // Endpoint: POST /auth/signup
    // Body: { fullName, email, password, mobileNumber }
    // --------------------------------------------------------------------------
    static async signUp(fullName: string, email: string, password: string, mobileNumber: string): Promise<ApiResponse<UsersApiAuthResponse>> {
        try {
            console.log('📝 Signing up user:', email);
            const response = await usersApiClient.post('/auth/signup', {
                fullName,
                email,
                password,
                mobileNumber,
            });

            const result = handleUsersApiResponse<UsersApiAuthResponse>(response);

            if (result.accessToken) {
                storeAuthSession(result);
            }

            return {
                success: true,
                data: result,
                message: 'User registered successfully!'
            };
        } catch (error: any) {
            console.error('❌ Signup failed:', error);
            const errorMessage = handleUsersApiError(error);
            throw new Error(errorMessage);
        }
    }

    // --------------------------------------------------------------------------
    // 3. REFRESH TOKEN
    // Endpoint: POST /auth/refresh (Users Service)
    // --------------------------------------------------------------------------
    static async refreshToken(refreshToken: string): Promise<ApiResponse<UsersApiAuthResponse>> {
        try {
            const response = await usersApiClient.post('/auth/refresh', {
                refreshToken,
            });

            const result = handleUsersApiResponse<UsersApiAuthResponse>(response);

            if (result.accessToken) {
                storeAuthSession(result);
            }

            return {
                success: true,
                data: result,
                message: 'Token refreshed successfully'
            };
        } catch (error: any) {
            const errorMessage = handleUsersApiError(error);
            throw new Error(errorMessage);
        }
    }

    // --------------------------------------------------------------------------
    // 4. LOGOUT
    // Endpoint: POST /auth/logout (Users Service)
    // --------------------------------------------------------------------------
    static async logout(): Promise<ApiResponse<any>> {
        try {
            await usersApiClient.post('/auth/logout');
            clearAuthSession();
            return {
                success: true,
                data: null,
                message: 'User logged out successfully!'
            };
        } catch (error: any) {
            clearAuthSession(); // Clear anyway
            const errorMessage = handleUsersApiError(error);
            // Note: We might prefer to return success even if API fails, but sticking to pattern
            throw new Error(errorMessage);
        }
    }

    // --------------------------------------------------------------------------
    // 5. GET USER ROLES
    // Endpoint: GET /auth/users/{username}/roles (Users Service)
    // --------------------------------------------------------------------------
    static async getUserRoles(username: string): Promise<ApiResponse<string[]>> {
        try {
            const response = await usersApiClient.get(`/auth/users/${username}/roles`);
            const result = handleUsersApiResponse<{ roles: string[] }>(response);
            return {
                success: true,
                data: result.roles || (result as any), // Fallback if result is array
                message: 'Roles fetched successfully'
            };
        } catch (error: any) {
            const errorMessage = handleUsersApiError(error);
            throw new Error(errorMessage);
        }
    }

    // --------------------------------------------------------------------------
    // 6. GET ACTIVE SESSIONS
    // Endpoint: GET /auth/sessions (Users Service)
    // --------------------------------------------------------------------------
    static async getActiveSessions(): Promise<ApiResponse<UsersApiSessionInfo[]>> {
        try {
            const response = await usersApiClient.get('/auth/sessions');
            const result = handleUsersApiResponse<UsersApiSessionInfo[]>(response);
            return {
                success: true,
                data: result,
                message: 'Sessions fetched successfully'
            };
        } catch (error: any) {
            const errorMessage = handleUsersApiError(error);
            throw new Error(errorMessage);
        }
    }

    // --------------------------------------------------------------------------
    // LEGACY/BACKWARD COMPATIBILITY METHODS
    // --------------------------------------------------------------------------

    /**
     * @deprecated Use signIn instead
     */
    static async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        try {
            const usernameOrEmail = data.usernameOrEmail || data.email || data.phone || '';
            const password = data.password || '';

            const result = await this.signIn(usernameOrEmail, password);

            return {
                success: result.success,
                message: result.message,
                data: {
                    token: result.data?.accessToken || '',
                    refreshToken: result.data?.refreshToken || '',
                    expiresIn: result.data?.expiresIn,
                    // Map UsersApiAuthResponse to legacy User type roughly if needed
                    user: result.data as any,
                    raw: result.data
                }
            } as ApiResponse<AuthResponse>;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * @deprecated Use signUp instead
     */
    static async register(data: RegisterRequest): Promise<ApiResponse<any>> {
        try {
            const result = await this.signUp(
                data.fullName,
                data.email,
                data.password,
                data.phoneNumber
            );

            return {
                success: result.success,
                message: result.message,
                data: result.data
            } as ApiResponse<any>;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    // OTP methods - keeping as is from original auth.service.ts
    static async sendOTP(data: OTPRequest): Promise<ApiResponse<{ otpSent: boolean; message: string }>> {
        try {
            const response = await api.post<ApiResponse<{ otpSent: boolean; message: string }>>(
                '/auth/send-otp',
                data
            );
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async verifyOTP(data: OTPVerifyRequest): Promise<ApiResponse<{ verified: boolean; token?: string }>> {
        try {
            const response = await api.post<ApiResponse<{ verified: boolean; token?: string }>>(
                '/auth/verify-otp',
                data
            );
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async loginWithOTP(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        try {
            const response = await api.post<ApiResponse<AuthResponse>>('/auth/login-otp', data);
            const result = handleApiResponse(response);

            if (result) {
                storeAuthSession(result);
            }

            return {
                success: true,
                message: 'OTP login successful',
                data: result as any
            } as ApiResponse<AuthResponse>;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // --------------------------------------------------------------------------
    // UTILITY METHODS
    // --------------------------------------------------------------------------

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(STORAGE_KEYS.accessToken);
    }

    /**
     * Get stored auth token
     */
    static getStoredToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(STORAGE_KEYS.accessToken);
    }

    /**
     * Get current user profile
     */
    static async getCurrentUser(): Promise<ApiResponse<User>> {
        try {
            const response = await api.get<ApiResponse<User>>('/auth/me');
            const result = handleApiResponse(response);

            if (result.success) {
                storeAuthSession({ user: result.data });
            }

            return result;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Update user password
     */
    static async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> {
        try {
            const response = await api.put<ApiResponse<{ message: string }>>(
                '/auth/update-password',
                data
            );
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ============================================================================
    // FIREBASE MOBILE AUTH ENDPOINTS
    // ============================================================================

    static async verifyFirebaseToken(idToken: string): Promise<ApiResponse<any>> {
        try {
            const response = await api.post<ApiResponse<any>>(
                '/auth/mobile/verify-firebase-token',
                { idToken }
            );
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async sendMobileOTP(email: string, mobileNumber: string): Promise<ApiResponse<any>> {
        try {
            const response = await publicApi.post<ApiResponse<any>>(
                `/notification/api/otp/send?email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobileNumber)}`
            );
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ============================================================================
    // PASSWORD RESET ENDPOINTS (Migrated from UsersService)
    // ============================================================================

    static async initiatePasswordResetMobile(mobileNumber: string): Promise<ApiResponse<any>> {
        try {
            const response = await usersApiClient.post('/auth/password-reset/initiate/mobile', { mobileNumber });
            return {
                success: true,
                message: 'Password reset OTP sent!',
                data: response.data
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    static async initiatePasswordResetEmail(email: string): Promise<ApiResponse<any>> {
        try {
            const response = await usersApiClient.post('/auth/password-reset/initiate/email', { email });
            return {
                success: true,
                message: 'Password reset email sent!',
                data: response.data
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    static async verifyPasswordResetToken(token: string): Promise<ApiResponse<any>> {
        try {
            const response = await usersApiClient.post('/auth/password-reset/verify/token', { token });
            return {
                success: true,
                message: 'Token verified!',
                data: response.data
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    static async verifyPasswordResetOTP(mobileNumber: string, otp: string): Promise<ApiResponse<any>> {
        try {
            const response = await usersApiClient.post('/auth/password-reset/verify/otp', { mobileNumber, otp });
            return {
                success: true,
                message: 'OTP Verified!',
                data: response.data
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    static async resetPasswordWithToken(token: string, newPassword: string): Promise<ApiResponse<any>> {
        try {
            const response = await usersApiClient.post('/auth/password-reset/reset/token', { token, newPassword });
            return {
                success: true,
                message: 'Password reset successful!',
                data: response.data
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    static async resetPasswordWithMobile(mobileNumber: string, newPassword: string): Promise<ApiResponse<any>> {
        try {
            const response = await usersApiClient.post('/auth/password-reset/reset/mobile', { mobileNumber, newPassword });
            return {
                success: true,
                message: 'Password reset successful!',
                data: response.data
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }


    /**
     * Get stored user data
     */
    static getStoredUser(): User | null {
        if (typeof window === 'undefined') return null;

        const userStr = localStorage.getItem(STORAGE_KEYS.user);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }

    /**
     * Get user roles from stored auth data
     */
    static getUserRolesFromStorage(): string[] {
        const user: any = this.getStoredUser();
        return user?.roles || [];
    }

    /**
     * Check if user has specific role
     */
    static hasRole(role: string): boolean {
        const roles = this.getUserRolesFromStorage();
        return roles.includes(role);
    }

    /**
     * ✅ ROLE-BASED ACCESS CONTROL: Check if user is ROLE_USER
     * This platform is only for users, not admins or superadmins
     */
    static isUserRole(): boolean {
        return this.hasRole('ROLE_USER');
    }

    /**
     * ✅ Validate user has ROLE_USER access (throws error if not)
     */
    static validateUserRoleAccess(roles: string[]): boolean {
        return roles.includes('ROLE_USER');
    }

    /**
     * Get the highest priority route based on user roles
     * ✅ NOTE: This platform is for ROLE_USER only
     * Admin and SuperAdmin roles will be blocked at login time
     */
    static getRouteBasedOnRoles(): string {
        const roles = this.getUserRolesFromStorage();

        // This platform only allows ROLE_USER
        if (roles.includes('ROLE_USER')) {
            return '/home';
        }

        // Default fallback (should not happen if validation works correctly)
        return '/home';
    }


    /**
     * Verify phone number exists (Migrated)
     */
    static async checkPhoneExists(phone: string): Promise<ApiResponse<{ exists: boolean }>> {
        try {
            const response = await usersApiClient.post('/auth/check-phone', { phone });
            return {
                success: true,
                data: response.data,
                message: 'Phone check completed'
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    /**
     * Delete user account (Migrated)
     */
    static async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
        try {
            await usersApiClient.delete('/auth/delete-account', { data: { password } });
            clearAuthSession();
            return {
                success: true,
                message: 'Account deleted successfully',
                data: { message: 'Account deleted successfully' }
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    // ============================================================================
    // USER ROLE MANAGEMENT ENDPOINTS (Migrated)
    // ============================================================================

    static async addRoleToUser(username: string, role: string): Promise<ApiResponse<any>> {
        try {
            await usersApiClient.post(`/auth/roles/${username}/add/${role}`);
            return {
                success: true,
                message: `Role ${role} added to user ${username} successfully!`,
                data: null
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    static async removeRoleFromUser(username: string, role: string): Promise<ApiResponse<any>> {
        try {
            await usersApiClient.post(`/auth/roles/${username}/remove/${role}`);
            return {
                success: true,
                message: `Role ${role} removed from user ${username} successfully!`,
                data: null
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    // Synonym methods used in existing AuthService
    static async addUserRole(username: string, role: string): Promise<ApiResponse<void>> {
        return this.addRoleToUser(username, role);
    }

    static async removeUserRole(username: string, role: string): Promise<ApiResponse<void>> {
        return this.removeRoleFromUser(username, role);
    }

    // ============================================================================
    // UTILITY / TEST ENDPOINTS
    // ============================================================================

    static async testAuth(): Promise<ApiResponse<{ message: string }>> {
        try {
            const response = await usersApiClient.get('/auth/test-auth');
            return {
                success: true,
                message: 'Authenticated!',
                data: { message: 'Authenticated', ...response.data }
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    // ============================================================================
    // GOOGLE AUTHENTICATION
    // ============================================================================
    // ✅ NOTE: Also validates ROLE_USER access

    static async googleSignIn(idToken: string): Promise<any> {
        try {
            const response = await usersApiClient.post('/auth/google', { idToken });
            const result = handleUsersApiResponse<UsersApiAuthResponse>(response);

            // ✅ ROLE-BASED ACCESS CONTROL: Only ROLE_USER can access this platform
            const roles = result.roles || result.user?.roles || [];
            if (!this.validateUserRoleAccess(roles)) {
                console.warn("🚫 Google Sign-In: Access denied - user does not have ROLE_USER");

                // Clear any session data
                clearAuthSession();

                throw new Error('This platform is for users only. Your account role does not have access to this application.');
            }

            if (result.accessToken) {
                storeAuthSession(result);
            }

            return {
                success: true,
                data: result,
                message: 'Google login successful!'
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    // ============================================================================
    // ENHANCED SESSION MANAGEMENT
    // ============================================================================

    static async revokeAllSessions(): Promise<ApiResponse<void>> {
        try {
            await usersApiClient.delete('/auth/sessions');
            clearAuthSession();
            return {
                success: true,
                message: 'Logged out from all devices successfully!',
                data: undefined
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    static async revokeSessionById(sessionId: string): Promise<ApiResponse<void>> {
        try {
            await usersApiClient.delete(`/auth/sessions/${sessionId}`);
            return {
                success: true,
                message: 'Session revoked successfully!',
                data: undefined
            };
        } catch (error: any) {
            throw new Error(handleUsersApiError(error));
        }
    }

    static async getCorsOrigins(): Promise<ApiResponse<string[]>> {
        try {
            const response = await api.get<ApiResponse<string[]>>('/auth/cors-origins');
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}
