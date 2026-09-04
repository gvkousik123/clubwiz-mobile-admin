'use client';

import { ReactNode } from 'react';
import { useAdminAuth, useSuperAdminAuth } from '@/hooks/use-auth-guard';
import { AccessDenied } from '@/components/common/access-denied';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole: 'admin' | 'superadmin' | 'user';
}

/**
 * Component to protect routes based on user role
 * Automatically redirects unauthorized users to their appropriate dashboard
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole
}) => {
    let { isLoading, accessDenied, denialReason } = {
        isLoading: false,
        accessDenied: false,
        denialReason: null as any
    };

    if (requiredRole === 'admin' || requiredRole === 'superadmin') {
        const adminAuth = useAdminAuth();
        isLoading = adminAuth.isLoading;
        accessDenied = adminAuth.accessDenied;
        denialReason = adminAuth.denialReason;
    }

    if (requiredRole === 'superadmin') {
        const superAdminAuth = useSuperAdminAuth();
        isLoading = superAdminAuth.isLoading;
        accessDenied = superAdminAuth.accessDenied;
        denialReason = superAdminAuth.denialReason;
    }

    // Show loading state while checking permissions
    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 animate-pulse"></div>
                    <p className="text-white">Checking access permissions...</p>
                </div>
            </div>
        );
    }

    // Show access denied if user doesn't have required role
    if (accessDenied) {
        if (denialReason === 'not-authenticated') {
            return (
                <AccessDenied
                    title="Login Required"
                    message={`Please log in to access the ${requiredRole} area.`}
                    redirectTo="/bz/auth/intro"
                />
            );
        }

        return (
            <AccessDenied
                title="Access Denied"
                message={`You don't have permission to access the ${requiredRole} area. You will be redirected to your dashboard.`}
                redirectTo={
                    requiredRole === 'admin' || requiredRole === 'superadmin'
                        ? '/bz/admin'
                        : '/bz/auth/intro'
                }
            />
        );
    }

    // User has access - render children
    return <>{children}</>;
};

export default ProtectedRoute;
