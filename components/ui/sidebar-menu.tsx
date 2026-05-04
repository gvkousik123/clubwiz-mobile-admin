'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Phone, MessageCircle, Instagram } from 'lucide-react';
import Link from 'next/link';
import { ClubVizLogo } from '@/components/auth/logo';

interface SidebarMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
    const router = useRouter();

    const handleLogOut = () => {
        // Handle logout logic here
        router.push('/auth/intro');
        onClose();
    };

    const handleSocialClick = (platform: string) => {
        switch (platform) {
            case 'phone':
                window.open('tel:+919XXXXXXXXX');
                break;
            case 'whatsapp':
                window.open('https://wa.me/message/XXXXXXXXXXXXX', '_blank');
                break;
            case 'twitter':
                window.open('https://twitter.com/Clubwiz_ngp', '_blank');
                break;
            case 'instagram':
                window.open('https://instagram.com/Clubwiz_ngp', '_blank');
                break;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="absolute right-0 top-0 h-full w-80 bg-gradient-to-b from-[#0d7377] to-[#222831] shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 pt-16">
                    <div className="w-6"></div> {/* Spacer */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
                    >
                        <X size={24} className="text-white" />
                    </button>
                </div>

                {/* Profile Section */}
                <div className="px-6 pb-8">
                    <div className="flex flex-col items-center text-center">
                        {/* Profile Avatar */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 border-4 border-teal-400/30 flex items-center justify-center mb-4">
                            <span className="text-3xl">🐻</span>
                        </div>

                        {/* Profile Info */}
                        <h2 className="text-white font-bold text-lg mb-1">DAVID SIMON</h2>
                        <p className="text-white/80 text-sm">NAGPUR</p>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="px-6 space-y-6">
                    {/* Menu Items */}
                    <div className="space-y-2">
                        <Link
                            href="/account"
                            className="flex items-center justify-center py-4 text-white font-medium text-base border-b border-white/20 hover:bg-white/5 transition-all duration-300"
                            onClick={onClose}
                        >
                            MY ACCOUNT
                        </Link>                        <Link
                            href="/events"
                            className="flex items-center justify-center py-4 text-white font-medium text-base border-b border-white/20 hover:bg-white/5 transition-all duration-300"
                            onClick={onClose}
                        >
                            FAVOURITE EVENTS
                        </Link>

                        <Link
                            href="/clubs"
                            className="flex items-center justify-center py-4 text-white font-medium text-base border-b border-white/20 hover:bg-white/5 transition-all duration-300"
                            onClick={onClose}
                        >
                            FAVOURITE CLUBS
                        </Link>

                        <Link
                            href="/contact"
                            className="flex items-center justify-center py-4 text-white font-medium text-base border-b border-white/20 hover:bg-white/5 transition-all duration-300"
                            onClick={onClose}
                        >
                            CONTACT
                        </Link>
                    </div>

                    {/* Logout Button */}
                    <div className="pt-8">
                        <button
                            onClick={handleLogOut}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-[25px] transition-all duration-300"
                        >
                            Log Out
                        </button>
                    </div>

                    {/* Social Media Icons */}
                    <div className="flex justify-center gap-4 pt-8">
                        <button
                            onClick={() => handleSocialClick('phone')}
                            className="w-12 h-12 bg-teal-600/20 border border-teal-400/40 rounded-full flex items-center justify-center hover:bg-teal-600/30 transition-all duration-300"
                        >
                            <Phone size={20} className="text-teal-400" />
                        </button>

                        <button
                            onClick={() => handleSocialClick('whatsapp')}
                            className="w-12 h-12 bg-green-500/20 border border-green-400/40 rounded-full flex items-center justify-center hover:bg-green-500/30 transition-all duration-300"
                        >
                            <MessageCircle size={20} className="text-green-400" />
                        </button>

                        <button
                            onClick={() => handleSocialClick('twitter')}
                            className="w-12 h-12 bg-black/40 border border-white/40 rounded-full flex items-center justify-center hover:bg-black/60 transition-all duration-300"
                        >
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </button>

                        <button
                            onClick={() => handleSocialClick('instagram')}
                            className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/40 rounded-full flex items-center justify-center hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300"
                        >
                            <Instagram size={20} className="text-purple-400" />
                        </button>
                    </div>

                    {/* CLUBWIZ Logo */}
                    <div className="pt-8 pb-8">
                        <div className="flex justify-center">
                            <ClubVizLogo size="sm" variant="full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}