'use client';

import { useCallback } from 'react';
import { ProfileService } from '@/lib/services/profile.service';

interface UseRoleRoutingReturn {
    getRedirectPath: () => string;
    isSuperAdmin: () => boolean;
    isAdmin: () => boolean;
    isBusinessAdmin: () => boolean;
    isUser: () => boolean;
    getUserRoles: () => string[];
}

/**
 * Hook to handle role-based routing logic
 * Returns the appropriate redirect path based on user role
 * 
 * Usage:
 * const { getRedirectPath, isSuperAdmin, isAdmin } = useRoleRouting();
 * const path = getRedirectPath(); // Returns /superadmin or /business
 */
export const useRoleRouting = (): UseRoleRoutingReturn => {

    const getUserRoles = useCallback((): string[] => {
        const authData = ProfileService.getStoredAuthData();
        return authData?.roles || [];
    }, []);

    const isSuperAdmin = useCallback((): boolean => {
        return ProfileService.isSuperAdmin();
    }, []);

    const isAdmin = useCallback((): boolean => {
        return ProfileService.isAdmin();
    }, []);

    const isUser = useCallback((): boolean => {
        const roles = getUserRoles();
        return false; // No regular users allowed
    }, [getUserRoles]);

    const isBusinessAdmin = useCallback((): boolean => {
        return ProfileService.isBusinessAdmin();
    }, []);

    const getRedirectPath = useCallback((): string => {
        if (isSuperAdmin()) {
            return '/superadmin';
        }
        if (isBusinessAdmin()) {
            return '/business';
        }
        if (isAdmin()) {
            return '/admin';
        }
        return '/auth/intro'; // Default to login
    }, [isSuperAdmin, isBusinessAdmin, isAdmin]);

    return {
        getRedirectPath,
        isSuperAdmin,
        isAdmin,
        isBusinessAdmin,
        isUser,
        getUserRoles,
    };
};

export default useRoleRouting;
