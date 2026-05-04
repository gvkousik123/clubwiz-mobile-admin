'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProfileService } from '@/lib/services/profile.service';

/**
 * Role-based redirect component
 * Redirects users to appropriate dashboards based on their role:
 * - ROLE_SUPERADMIN -> /superadmin
 * - ROLE_ADMIN -> /admin (dashboard)
 * - ROLE_BUSINESS_ADMIN -> /business (dashboard)
 * - No role or regular user -> /auth/intro (denied)
 */
export const RoleRedirect = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const performRedirect = () => {
            // Skip redirect if already on auth pages or admin/business/superadmin pages
            if (
                pathname?.startsWith('/auth/') ||
                pathname?.startsWith('/admin') ||
                pathname?.startsWith('/business') ||
                pathname?.startsWith('/superadmin')
            ) {
                setIsChecking(false);
                return;
            }

            // Check if user is logged in
            if (!ProfileService.isLoggedIn()) {
                // Not logged in, let them proceed (they'll be redirected to login by auth-guard)
                setIsChecking(false);
                return;
            }

            // User is logged in, redirect based on role (admin/business admin/superadmin only)
            if (ProfileService.isSuperAdmin()) {
                router.replace('/superadmin');
            } else if (ProfileService.isBusinessAdmin()) {
                router.replace('/business');
            } else if (ProfileService.isAdmin()) {
                router.replace('/admin');
            } else {
                // Regular users not allowed - redirect to login
                router.replace('/auth/intro');
            }

            setIsChecking(false);
        };

        performRedirect();
    }, [pathname, router]);

    // Return null while checking/redirecting
    if (isChecking) {
        return (
            <div className="bg-dark-900 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 animate-pulse"></div>
                    <p className="text-white">Checking access level...</p>
                </div>
            </div>
        );
    }

    return null;
};

export default RoleRedirect;
