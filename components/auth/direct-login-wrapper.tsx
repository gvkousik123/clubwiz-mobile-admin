'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthService } from '@/lib/services/auth.service';

/**
 * Client-side wrapper component that handles direct login
 * and role-based routing on app initialization
 * 
 * IMPORTANT: This component should NOT interfere with auth page redirects.
 * Auth pages (OTP, details, etc.) handle their own redirects after successful login.
 */
export const DirectLoginWrapper = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Always skip redirect logic on auth pages - let them handle their own flow
        // Auth pages have complex logic for new vs existing users
        const isAuthPage = pathname?.startsWith('/bz/auth') || pathname?.startsWith('/auth');

        if (isAuthPage) {
            console.log("🔒 DirectLoginWrapper: On auth page, skipping redirect (auth page handles its own flow):", pathname);
            return;
        }

        const isAdminPage = pathname?.startsWith('/bz/business') || pathname?.startsWith('/business');
        const isSuperAdminPage = pathname?.startsWith('/bz/superadmin') || pathname?.startsWith('/superadmin');

        // List of user pages that should NOT be redirected
        const userPages = [
            '/bz/account',
            '/bz/booking',
            '/bz/club',
            '/bz/clubs',
            '/bz/contact',
            '/bz/event',
            '/bz/events',
            '/bz/example-story-usage',
            '/bz/favourites',
            '/bz/filter',
            '/bz/gallery',
            '/bz/business',
            '/bz/location',
            '/bz/payment',
            '/bz/review',
            '/bz/story',
            '/bz/ticket',
            '/bz/admin/running-ads',
            '/bz/admin/scan-tickets',
            '/bz/admin/ticket-details'
        ];

        // Check if current path is a user-allowed page
        const isUserPage = userPages.some(page => pathname === page || pathname?.startsWith(page + '/'));

        // Skip redirect logic for user pages - they handle their own auth
        if (isUserPage) {
            console.log("🏠 DirectLoginWrapper: On user page, skipping redirect:", pathname);
            return;
        }

        // Check if user is authenticated
        const isAuthenticated = AuthService.isAuthenticated();
        console.log("🔍 DirectLoginWrapper: Authentication check on protected route:", { isAuthenticated, pathname });

        if (isAuthenticated) {
            // Get user roles
            const roles = AuthService.getUserRolesFromStorage();
            console.log("👤 DirectLoginWrapper: User roles:", roles);

            // Determine correct route based on role
            let correctRoute = '/bz/auth/intro';

            if (roles.includes('ROLE_SUPERADMIN')) {
                correctRoute = '/bz/superadmin';
            } else if (roles.includes('ROLE_ADMIN')) {
                correctRoute = '/bz/admin';
            } else if (roles.includes('ROLE_USER')) {
                correctRoute = '/bz/auth/intro';
            }


            if (pathname !== correctRoute) {
                // Allow admin/superadmin to access other admin pages
                if (isAdminPage || isSuperAdminPage) {
                    return; // Stay on admin pages
                }

                setTimeout(() => {
                    router.push(correctRoute);
                }, 200);
            }
        } else {
            console.log("❌ DirectLoginWrapper: User not authenticated on protected route");
        }
    }, [pathname, router]);

    return <>{children}</>;
};
