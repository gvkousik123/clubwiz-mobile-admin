/**
 * Centralized Route Configuration for ClubWiz Admin (Business) App
 * 
 * Example routes:
 * - /business
 * - /business/club/new
 * - /business/event/new
 */

export const ROUTES = {
    // Business routes
    BUSINESS: '/business',
    
    // Club management
    CLUBS: '/business/clubs',
    CLUB_NEW: '/business/club/new',
    CLUB_EDIT: (id: string) => `/business/club/${id}/edit`,
    CLUB_DETAIL: (id: string) => `/business/club/${id}`,
    CLUB_EVENTS: (id: string) => `/business/club/${id}/events`,

    // Event management
    EVENTS: '/business/events',
    ALL_EVENTS: '/business/all-organized-events',
    NEW_EVENT: '/business/new-event',
    EDIT_EVENT: (id: string) => `/business/edit-event/${id}`,
    EVENT_ANALYTICS: '/business/event-analytics',

    // Auth routes
    AUTH: {
        LOGIN: '/login',
        SIGNUP: '/signup',
        REGISTER: '/register',
        FORGOT_PASSWORD: '/forgot-password',
        MOBILE: '/mobile',
        OTP: '/otp',
    },

    // Profile routes
    PROFILE: '/profile',
    ACCOUNT: '/account',

    // Ticket management (if applicable)
    TICKETS: '/business/tickets',

    // Dashboard
    DASHBOARD: '/business/dashboard',
};

/**
 * Get full path - returns path as-is
 */
export function getFullPath(path: string): string {
    if (!path.startsWith('/')) path = '/' + path;
    return path;
}

/**
 * Get all routes
 */
export function getAllRoutesWithBasePath(): Record<string, string> {
    const routes: Record<string, string> = {};

    const addRoutes = (obj: any, prefix = '') => {
        for (const key in obj) {
            const value = obj[key];
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'string') {
                routes[fullKey] = value;
            } else if (typeof value === 'function') {
                routes[fullKey] = `${value('ID').substring(0, value('ID').lastIndexOf('/'))}/:id`;
            } else if (typeof value === 'object') {
                addRoutes(value, fullKey);
            }
        }
    };

    addRoutes(ROUTES);
    return routes;
}
