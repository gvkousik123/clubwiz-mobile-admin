'use client';

import { useEffect, useState } from 'react';
import { AuthService } from '@/lib/services/auth.service';
import { STORAGE_KEYS } from '@/lib/constants/storage';

interface UseDirectLoginResult {
    isLoading: boolean;
    isAuthenticated: boolean;
    userRole: string | null;
}

/**
 * Clear auth session from localStorage
 */
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
    localStorage.removeItem('userRoles');
    localStorage.removeItem('firebaseUser');
    localStorage.removeItem('clubStatus');
    localStorage.removeItem('clubviz-accessToken');
    localStorage.removeItem('clubviz-refreshToken');

    // Clear all keys with clubviz, user, or auth prefix
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('clubviz-') || key.startsWith('user-') || key.startsWith('auth-')) {
            localStorage.removeItem(key);
        }
    });
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

/**
 * Hook to handle direct login based on localStorage
 * No longer redirects automatically - user can navigate manually after login
 */
export const useDirectLogin = (): UseDirectLoginResult => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const handleDirectLogin = async () => {
            try {
                // Check if user is already authenticated
                const isAuth = AuthService.isAuthenticated();

                if (isAuth) {
                    setIsAuthenticated(true);

                    // Get user role for display purposes only
                    const roles = AuthService.getUserRolesFromStorage();

                    if (roles.includes('ROLE_SUPERADMIN')) {
                        setUserRole('ROLE_SUPERADMIN');
                    } else if (roles.includes('ROLE_ADMIN')) {
                        setUserRole('ROLE_ADMIN');
                    } else {
                        // No regular users allowed
                        setUserRole(null);
                    }

                    console.log('✅ Direct login check passed - user authenticated');
                }
            } catch (error) {
                console.error('Direct login error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        handleDirectLogin();
    }, []);

    return {
        isLoading,
        isAuthenticated,
        userRole
    };
};

/**
 * Hook to handle logout and clear session
 * No longer redirects automatically
 */
export const useLogoutHandler = () => {
    const handleLogout = async () => {
        try {
            // Call logout API
            await AuthService.logout();
            console.log('✅ Logout successful');
        } catch (error) {
            console.error('Logout error:', error);

            // Fallback: clear session manually on API error
            clearAuthSession();
        }
    };

    return { handleLogout };
};
