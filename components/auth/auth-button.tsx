import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface AuthButtonProps {
    href: string;
    variant?: 'primary' | 'secondary' | 'outline';
    children: React.ReactNode;
    onClick?: () => void;
    fullWidth?: boolean;
    className?: string;
    icon?: LucideIcon;
}

export function AuthButton({
    href,
    variant = 'primary',
    children,
    onClick,
    fullWidth = true,
    className = '',
    icon: Icon,
}: AuthButtonProps) {
    const baseClasses = "flex items-center justify-center gap-2 rounded-full py-4 font-medium transition-all duration-300";

    const variantClasses = {
        primary: "bg-gradient-button text-text-primary shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40",
        secondary: "bg-background-glass backdrop-blur-md border border-white/10 text-text-primary shadow-lg hover:bg-background-tertiary",
        outline: "bg-transparent border border-white/20 text-text-primary hover:bg-white/5",
    };

    const widthClass = fullWidth ? "w-full" : "";

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`;

    return (
        <Link href={href} className={buttonClasses} onClick={onClick}>
            {Icon && <Icon className="w-5 h-5" />}
            {children}
        </Link>
    );
}

export function AuthIconButton({
    href,
    icon: Icon,
    onClick,
    variant = 'outline',
    className = '',
}: Omit<AuthButtonProps, 'children'> & { icon: LucideIcon }) {
    const baseClasses = "flex items-center justify-center rounded-full p-3 transition-all duration-300";

    const variantClasses = {
        primary: "bg-gradient-button text-text-primary shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40",
        secondary: "bg-background-glass backdrop-blur-md border border-white/10 text-text-primary shadow-lg hover:bg-background-tertiary",
        outline: "bg-transparent border border-white/20 text-text-primary hover:bg-white/5",
    };

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

    return (
        <Link href={href} className={buttonClasses} onClick={onClick}>
            <Icon className="w-5 h-5" />
        </Link>
    );
}