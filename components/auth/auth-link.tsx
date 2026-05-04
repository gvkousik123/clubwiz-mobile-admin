import React from 'react';
import Link from 'next/link';

interface AuthLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export function AuthLink({ href, children, className = '' }: AuthLinkProps) {
    return (
        <Link
            href={href}
            className={`text-primary-500 hover:text-primary-400 transition-colors ${className}`}
        >
            {children}
        </Link>
    );
}

export function AuthLegalText({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-center text-sm text-text-tertiary mt-4">
            {children}
        </p>
    );
}