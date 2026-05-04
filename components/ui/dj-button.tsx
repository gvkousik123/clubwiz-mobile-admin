'use client';

import React from 'react';
import { Music, Volume2 } from 'lucide-react';

interface DJButtonProps {
    onClick?: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    isPlaying?: boolean;
}

export const DJButton: React.FC<DJButtonProps> = ({
    onClick,
    className = '',
    size = 'md',
    isPlaying = true,
}) => {
    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-20 h-20',
    };

    const iconSizes = {
        sm: 20,
        md: 28,
        lg: 36,
    };

    return (
        <button
            onClick={onClick}
            className={`
        relative ${sizeClasses[size]} rounded-full
        header-gradient
        flex items-center justify-center
        hover:scale-110 active:scale-95
        transition-all duration-300
        shadow-lg hover:shadow-2xl
        ${className}
      `}
            aria-label="DJ Music Player"
        >
            {/* Animated beat rings */}
            {isPlaying && (
                <>
                    <div
                        className="absolute inset-0 rounded-full border-2 border-teal-400/50 animate-ping"
                        style={{
                            animationDuration: '1.5s',
                        }}
                    />
                    <div
                        className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping"
                        style={{
                            animationDuration: '2s',
                            animationDelay: '0.3s',
                        }}
                    />
                    <div
                        className="absolute inset-0 rounded-full border-2 border-teal-300/50 animate-ping"
                        style={{
                            animationDuration: '2.5s',
                            animationDelay: '0.6s',
                        }}
                    />
                </>
            )}

            {/* Music icon with beat animation */}
            <div className={isPlaying ? 'animate-pulse' : ''}>
                <Music size={iconSizes[size]} className="text-white relative z-10" />
            </div>

            {/* Soundwave bars */}
            {isPlaying && (
                <div className="absolute bottom-2 flex gap-0.5 z-10">
                    <div className="w-0.5 bg-white/80 rounded-full animate-soundwave" style={{ height: '4px', animationDelay: '0s' }} />
                    <div className="w-0.5 bg-white/80 rounded-full animate-soundwave" style={{ height: '6px', animationDelay: '0.1s' }} />
                    <div className="w-0.5 bg-white/80 rounded-full animate-soundwave" style={{ height: '8px', animationDelay: '0.2s' }} />
                    <div className="w-0.5 bg-white/80 rounded-full animate-soundwave" style={{ height: '6px', animationDelay: '0.3s' }} />
                    <div className="w-0.5 bg-white/80 rounded-full animate-soundwave" style={{ height: '4px', animationDelay: '0.4s' }} />
                </div>
            )}
        </button>
    );
};

interface DJBannerProps {
    djName: string;
    genre?: string;
    onClick?: () => void;
    className?: string;
}

export const DJBanner: React.FC<DJBannerProps> = ({
    djName,
    genre,
    onClick,
    className = '',
}) => {
    return (
        <button
            onClick={onClick}
            className={`
        relative px-6 py-3 rounded-2xl
        header-gradient
        flex items-center gap-3
        hover:scale-105 active:scale-95
        transition-all duration-300
        shadow-lg hover:shadow-2xl
        ${className}
      `}
        >
            {/* Animated beat pulse background */}
            <div className="absolute inset-0 rounded-2xl border-2 border-teal-400/30 animate-pulse" />

            {/* DJ Icon with beat animation */}
            <div className="relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                    <Music size={20} className="text-white" />
                </div>
            </div>

            {/* DJ Info */}
            <div className="relative z-10 text-left">
                <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-white animate-pulse" />
                    <span className="text-white font-semibold text-sm">NOW PLAYING</span>
                </div>
                <div className="text-white font-bold text-lg">{djName}</div>
                {genre && <div className="text-white/80 text-xs">{genre}</div>}
            </div>

            {/* Soundwave animation */}
            <div className="relative z-10 flex gap-1 ml-auto">
                <div className="w-1 bg-white/70 rounded-full animate-soundwave" style={{ height: '12px', animationDelay: '0s' }} />
                <div className="w-1 bg-white/70 rounded-full animate-soundwave" style={{ height: '18px', animationDelay: '0.1s' }} />
                <div className="w-1 bg-white/70 rounded-full animate-soundwave" style={{ height: '24px', animationDelay: '0.2s' }} />
                <div className="w-1 bg-white/70 rounded-full animate-soundwave" style={{ height: '18px', animationDelay: '0.3s' }} />
                <div className="w-1 bg-white/70 rounded-full animate-soundwave" style={{ height: '12px', animationDelay: '0.4s' }} />
            </div>
        </button>
    );
};
