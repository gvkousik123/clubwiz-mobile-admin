import React from 'react';
import Image from 'next/image';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'icon' | 'full';
}

export function ClubVizLogo({ size = 'md', variant = 'full' }: LogoProps) {
    // Size classes for logo icon (smaller size)
    const logoSizes = {
        sm: { width: 70, height: 70 },
        md: { width: 85, height: 85 },
        lg: { width: 100, height: 100 },
    };

    // Size classes for text logo (smaller size)
    const textSizes = {
        sm: { width: 160, fontSize: 'text-2xl' },
        md: { width: 200, fontSize: 'text-3xl' },
        lg: { width: 240, fontSize: 'text-4xl' },
    };

    return (
        <div className="flex flex-col items-center gap-4 relative z-50">
            {/* Logo Icon */}
            <div className="relative z-50">
                <Image
                    src="/logo/logo.png"
                    alt="ClubWiz Logo"
                    width={logoSizes[size].width}
                    height={logoSizes[size].height}
                    className="object-contain"
                    priority={true}
                />
            </div>

            {/* ClubWiz text with neon effect */}
            {variant === 'full' && (
                <div className="relative z-50 text-center mt-2">
                    <Image
                        src="/logo/CLUBWIZ.png"
                        alt="CLUBWIZ"
                        width={textSizes[size].width}
                        height={size === 'lg' ? 70 : size === 'md' ? 56 : 44}
                        className="object-contain"
                        priority={true}
                    />
                </div>
            )}
        </div>
    );
}