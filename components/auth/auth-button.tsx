import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthButtonProps {
    href?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    children: React.ReactNode;
    onClick?: () => void;
    fullWidth?: boolean;
    className?: string;
    icon?: LucideIcon;
    disabled?: boolean;
    type?: 'button' | 'submit';
}

export function AuthButton({
    href,
    variant = 'primary',
    children,
    onClick,
    fullWidth = true,
    className = '',
    icon: Icon,
    disabled = false,
    type = 'button',
}: AuthButtonProps) {
    const baseClasses = "flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-[15px] uppercase tracking-[0.2em] transition-all transform active:translate-y-0";

    const variantClasses = {
        primary: `
            bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313]
            shadow-[0_0_20px_rgba(20,255,236,0.2)] 
            hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] 
            hover:-translate-y-0.5
            disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 disabled:cursor-not-allowed
        `,
        secondary: `
            bg-transparent border border-white/10 text-white
            hover:bg-white/5 hover:border-[#14FFEC]/40 hover:text-[#14FFEC]
        `,
        outline: `
            bg-black/20 backdrop-blur-md border border-white/10 text-white
            hover:bg-white/10 hover:border-white/30
        `,
    };

    const widthClass = fullWidth ? "w-full" : "";
    // cn() so a caller's className actually wins over the base/variant classes.
    const buttonClasses = cn(baseClasses, variantClasses[variant], widthClass, className);

    if (href && !disabled) {
        return (
            <Link href={href} className={buttonClasses} onClick={onClick}>
                {Icon && <Icon className="w-5 h-5" />}
                {children}
            </Link>
        );
    }

    return (
        <button 
            type={type}
            className={buttonClasses} 
            onClick={onClick}
            disabled={disabled}
        >
            {Icon && <Icon className="w-5 h-5" />}
            {children}
        </button>
    );
}

export function AuthIconButton({
    href,
    icon: Icon,
    onClick,
    variant = 'outline',
    className = '',
}: Omit<AuthButtonProps, 'children'> & { icon: LucideIcon }) {
    const baseClasses = "w-11 h-11 flex items-center justify-center rounded-full transition-all";

    const variantClasses = {
        primary: "bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] shadow-[0_0_20px_rgba(20,255,236,0.2)] hover:shadow-[0_0_30px_rgba(20,255,236,0.4)]",
        secondary: "bg-transparent border border-white/10 text-white hover:bg-white/5 hover:border-[#14FFEC]/40",
        outline: "border border-white/10 text-white bg-black/20 backdrop-blur-md hover:bg-white/10 hover:border-white/30",
    };

    const buttonClasses = cn(baseClasses, variantClasses[variant], className);

    return (
        <Link href={href} className={buttonClasses} onClick={onClick}>
            <Icon className="w-5 h-5" />
        </Link>
    );
}