import { STORAGE_KEYS } from '../constants/storage';

/**
 * Get the current club ID from multiple sources
 * Priority: URL params > localStorage > undefined
 */
export function getClubIdFromStorage(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        // Try the dedicated ownedClubId key first
        const ownedClubId = localStorage.getItem(STORAGE_KEYS.ownedClubId);
        if (ownedClubId) return ownedClubId;

        // Try to get from user data as fallback
        const userStr = localStorage.getItem(STORAGE_KEYS.user);
        if (userStr) {
            const user = JSON.parse(userStr);
            // Check multiple possible keys for clubId
            return user.clubId || user.activeClubId || user.id || null;
        }
    } catch (error) {
        console.error('Error reading clubId from localStorage:', error);
    }

    return null;
}

/**
 * Get club ID from URL search params
 */
export function getClubIdFromUrl(searchParams: URLSearchParams | null): string | null {
    if (!searchParams) return null;
    return searchParams.get('clubId');
}

/**
 * Get club ID from any available source
 */
export function getClubId(searchParams?: URLSearchParams | null): string | null {
    // First try URL params
    const urlClubId = getClubIdFromUrl(searchParams || null);
    if (urlClubId) return urlClubId;

    // Fall back to localStorage
    return getClubIdFromStorage();
}
