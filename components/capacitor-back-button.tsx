'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function CapacitorBackButton() {
    const router = useRouter();
    const navDepth = useRef(0);

    useEffect(() => {
        const origPushState = window.history.pushState.bind(window.history);
        window.history.pushState = (...args) => {
            navDepth.current++;
            origPushState(...args);
        };

        const handlePopState = () => {
            if (navDepth.current > 0) navDepth.current--;
        };
        window.addEventListener('popstate', handlePopState);

        let listenerHandle: { remove: () => void } | null = null;

        const setupAppListener = async () => {
            try {
                const { App } = await import('@capacitor/app');
                listenerHandle = await App.addListener('backButton', () => {
                    if (navDepth.current > 0) {
                        router.back();
                    }
                });
            } catch {
                const handleBackButton = (e: Event) => {
                    e.preventDefault();
                    if (navDepth.current > 0) router.back();
                };
                document.addEventListener('backbutton', handleBackButton, false);
                return () => document.removeEventListener('backbutton', handleBackButton, false);
            }
        };

        setupAppListener();

        return () => {
            window.history.pushState = origPushState;
            window.removeEventListener('popstate', handlePopState);
            listenerHandle?.remove();
        };
    }, [router]);

    return null;
}
