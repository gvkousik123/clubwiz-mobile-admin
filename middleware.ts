import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request and protects routes based on roles
export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Get user data from cookies/headers if available (from auth tokens)
    const accessToken = request.cookies.get('accessToken')?.value;
    const userDataCookie = request.cookies.get('user')?.value;

    // Parse user data to check roles
    let userRoles: string[] = [];
    if (userDataCookie) {
        try {
            const userData = JSON.parse(decodeURIComponent(userDataCookie));
            userRoles = userData.roles || [];
        } catch (error) {
            console.error('Error parsing user data from cookie:', error);
        }
    }

    // Define protected routes and their required roles
    const protectedRoutes: Record<string, string[]> = {
        '/superadmin': ['ROLE_SUPERADMIN'],
        '/admin': ['ROLE_ADMIN', 'ROLE_SUPERADMIN'],
        '/business': ['ROLE_BUSINESS', 'ROLE_ADMIN', 'ROLE_SUPERADMIN'],
    };

    return NextResponse.next();
}

// Configure which routes this middleware should run on
export const config = {
    matcher: [
        '/admin/:path*',
        '/superadmin/:path*',
        '/business/:path*',
    ],
};
