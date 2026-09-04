'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

interface AccessDeniedProps {
    title?: string;
    message?: string;
    requiredRole?: string;
    redirectTo?: string;
    redirectDelay?: number;
}

export const AccessDenied = ({
    title = "Access Denied",
    message = "You don't have permission to access this page.",
    requiredRole,
    redirectTo = '/bz/auth/intro',
    redirectDelay = 3000
}: AccessDeniedProps) => {
    const router = useRouter();
    const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push(redirectTo);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router, redirectTo]);

    return (
        <div className="min-h-screen bg-[#021313] flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                        <Lock className="w-10 h-10 text-red-500" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-3">
                    {title}
                </h1>

                {/* Message */}
                <p className="text-gray-400 text-base mb-4">
                    {message}
                </p>

                {/* Required Role Info */}
                {requiredRole && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                        <p className="text-blue-300 text-sm">
                            Required role: <span className="font-semibold">{requiredRole}</span>
                        </p>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={() => router.push(redirectTo)}
                    className="w-full px-6 py-3 bg-[#14FFEC] text-black font-semibold rounded-lg hover:bg-[#00D9E1] transition-colors mb-4"
                >
                    Go Back
                </button>

                {/* Auto Redirect Info */}
                <p className="text-gray-500 text-sm">
                    Redirecting in {countdown}s...
                </p>
            </div>
        </div>
    );
};
