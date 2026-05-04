'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook that provides Next.js router functionality
 * 
 * Usage:
 * const router = useRouting();
 * router.push('/home');
 */
export function useRouting() {
    const router = useRouter();

    const push = useCallback((path: string) => {
        router.push(path);
    }, [router]);

    const replace = useCallback((path: string) => {
        router.replace(path);
    }, [router]);

    const back = useCallback(() => {
        router.back();
    }, [router]);

    const forward = useCallback(() => {
        router.forward();
    }, [router]);

    return {
        push,
        replace,
        back,
        forward,
        // Expose basePath for any manual URL construction
        basePath,
        // Get full URL with basePath (useful for external links, API calls)
        getFullPath: (path: string) => {
            if (!path.startsWith('/')) path = '/' + path;
            return basePath + path;
        },
    };
}
