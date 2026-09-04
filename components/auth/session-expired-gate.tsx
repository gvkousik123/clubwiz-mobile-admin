'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { SESSION_EXPIRED_EVENT, SESSION_GATE_FLAG } from '@/lib/auth/session-expiry';

/**
 * Full-screen "session expired" panel.
 *
 * The API client cannot navigate on its own (it lives outside React), and a hard
 * window.location redirect is unreliable in the Capacitor build - WebViewLocalServer
 * serves index.html for any extensionless path. So the interceptor clears the session
 * and emits an event; this gate renders the panel and does an in-app route change,
 * which the Next router handles without a document load.
 */
export function SessionExpiredGate() {
    const router = useRouter();
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        // Tells the API client a gate is mounted, so it does not fall back to a hard redirect.
        (window as any)[SESSION_GATE_FLAG] = true;

        const onExpired = () => setExpired(true);
        window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

        return () => {
            (window as any)[SESSION_GATE_FLAG] = false;
            window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
        };
    }, []);

    if (!expired) return null;

    const goToLogin = () => {
        setExpired(false);
        router.replace('/bz/auth/login');
    };

    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-expired-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#021313]/95 px-6 backdrop-blur-sm"
        >
            <div className="w-full max-w-md rounded-[20px] border border-[#14FFEC]/20 bg-[#0D1F1F] p-7 text-center">
                <div className="mb-5 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#14FFEC]/15">
                        <Clock className="h-8 w-8 text-[#14FFEC]" />
                    </div>
                </div>

                <h1 id="session-expired-title" className="mb-2 text-xl font-bold text-white">
                    Session expired
                </h1>

                <p className="mb-6 text-sm text-white/60">
                    You&apos;ve been signed out for security. Log in again to pick up where you left off.
                </p>

                <button
                    type="button"
                    onClick={goToLogin}
                    autoFocus
                    className="w-full rounded-full bg-[#14FFEC] px-6 py-3 font-bold text-black transition-colors hover:bg-[#00D9E1]"
                >
                    Login again
                </button>
            </div>
        </div>
    );
}

export default SessionExpiredGate;
