'use client';

import Image from 'next/image';

interface ClubWizLoaderProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    message?: string;
}

const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 120
};

export function ClubWizLoader({ size = 'md', message }: ClubWizLoaderProps) {
    const dimension = sizeMap[size];

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
                {/* Pulsing glow effect */}
                <div 
                    className="absolute inset-0 rounded-full bg-[#14FFEC]/20 blur-xl animate-pulse"
                    style={{ 
                        width: dimension * 1.5,
                        height: dimension * 1.5,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        animationDuration: '2s'
                    }}
                />
                
                {/* Logo with opacity animation */}
                <div 
                    className="relative animate-logo-pulse"
                    style={{ width: dimension, height: dimension }}
                >
                    <Image
                        src="/logo/clubwizlogo.png"
                        alt="ClubWiz Loading"
                        width={dimension}
                        height={dimension}
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {message && (
                <p className="text-[#14FFEC]/80 text-sm font-medium animate-pulse">
                    {message}
                </p>
            )}

            <style jsx>{`
                @keyframes logo-pulse {
                    0%, 100% {
                        opacity: 0.4;
                        transform: scale(0.95);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-logo-pulse {
                    animation: logo-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}

// Full screen loading overlay
export function ClubWizLoadingOverlay({ message }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#031313]/95 backdrop-blur-md flex items-center justify-center">
            <ClubWizLoader size="xl" message={message} />
        </div>
    );
}

// Inline loading state
export function ClubWizInlineLoader({ message }: { message?: string }) {
    return (
        <div className="flex items-center justify-center py-12">
            <ClubWizLoader size="lg" message={message} />
        </div>
    );
}
