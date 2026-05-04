import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
    variant?: 'default' | 'card';
    fullHeight?: boolean;
    withGradient?: boolean;
}

export function AuthLayout({
    children,
    variant = 'default',
    fullHeight = true,
    withGradient = true
}: AuthLayoutProps) {
    return (
        <div
            className={`relative flex flex-col items-center justify-center w-full ${fullHeight ? 'min-h-screen' : ''} py-6 bg-[#031313]`}
        >
            {/* Background blur effects - subtle accents only */}
            {withGradient && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 left-1/3 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl"></div>
                </div>
            )}

            {/* Content */}
            <div className={`relative z-10 w-full ${variant === 'card' ? 'max-w-md bg-background-glass backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-lg' : 'max-w-none'}`}>
                {children}
            </div>
        </div>
    );
}