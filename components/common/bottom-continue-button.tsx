'use client';

import React from 'react';

interface BottomContinueButtonProps {
    text?: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

export default function BottomContinueButton({
    text = "Continue",
    onClick,
    disabled = false,
    className = ""
}: BottomContinueButtonProps) {
    return (
        <div className={`fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black to-transparent overflow-hidden ${className}`}>
            <div className="w-full h-12 absolute bottom-0 overflow-hidden rounded-t-[2.8125rem]"
                style={{
                    background: 'radial-gradient(ellipse 70.81% 149.79% at 50.00% 100.00%, #01655C 0%, #008076 100%)'
                }}>
                <button
                    onClick={onClick}
                    disabled={disabled}
                    className="w-full h-full relative transition-opacity duration-200"
                >
                    <div className={`absolute left-1/2 top-2 transform -translate-x-1/2 px-4 h-6 flex items-center justify-center text-lg font-['Manrope'] font-bold leading-5 whitespace-nowrap ${disabled ? 'text-white/50' : 'text-white'
                        }`}>
                        {text}
                    </div>
                </button>
            </div>
        </div>
    );
}