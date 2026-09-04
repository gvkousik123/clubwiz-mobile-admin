'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, User } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';
import { AuthService } from '@/lib/services/auth.service';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/services/profile.service';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    profile?: UserProfile | null;
    currentUser?: Partial<UserProfile> | null;
    isProfileLoading?: boolean;
}

export default function Sidebar({
    isOpen,
    onClose,
    profile: passedProfile,
    currentUser: passedCurrentUser,
    isProfileLoading: passedIsLoading
}: SidebarProps) {
    const { profile: hookProfile, currentUser: hookCurrentUser, isProfileLoading: hookIsLoading } = useProfile();
    const router = useRouter();
    const { toast } = useToast();

    // Use passed props first, then hook data as fallback
    const profile = passedProfile || hookProfile;
    const currentUser = passedCurrentUser || hookCurrentUser;
    const isProfileLoading = passedIsLoading || hookIsLoading;

    // Use real user data or fallback
    const displayName = isProfileLoading ? 'Loading...' : (profile?.fullName || currentUser?.fullName || 'User');
    const displayLocation = profile?.phoneNumber ?
        (profile.phoneNumber.startsWith('+91') ? 'INDIA' : 'LOCATION') :
        (currentUser?.phoneNumber ?
            (currentUser.phoneNumber.startsWith('+91') ? 'INDIA' : 'LOCATION') :
            'LOCATION'); // Remove hardcoded NAGPUR
    const profilePicture = profile?.profilePicture || currentUser?.profilePicture;

    const handleLogout = async () => {
        try {
            // Call the logout API and clear local storage
            await AuthService.logout();

            toast({
                title: "Logged out successfully",
                description: "You have been logged out of your account",
            });

            // Close sidebar and redirect to login
            onClose();
            router.push('/bz/auth/intro');
        } catch (error: any) {
            console.error('Logout error:', error);

            // On API error, only clear auth-related keys (preserve favorites, theme, etc.)
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEYS.accessToken);
                localStorage.removeItem(STORAGE_KEYS.refreshToken);
                localStorage.removeItem(STORAGE_KEYS.user);
                localStorage.removeItem(STORAGE_KEYS.userDetails);
                localStorage.removeItem(STORAGE_KEYS.pendingPhone);
            }

            toast({
                title: "Logged out",
                description: "Session cleared successfully",
            });

            onClose();
            router.push('/bz/auth/intro');
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={onClose}
                />
            )}

            {/* Sidebar - 75% width from right */}
            <div
                className={`fixed top-0 right-0 w-[75%] h-full z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{
                    background: '#021313',
                    borderTopLeftRadius: '25px',
                    borderBottomLeftRadius: '25px'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 w-8 h-8 bg-[#1a2332] rounded-full flex items-center justify-center z-10 cursor-pointer hover:bg-[#243040] transition-colors"
                >
                    <X size={16} className="text-white" />
                </button>

                {/* Profile Section */}
                <div className="flex flex-col items-center px-6 pt-16">
                    {/* Profile Picture with Border */}
                    <div className="relative mb-6">
                        <div className="w-[120px] h-[120px] rounded-full border-2 border-[#14FFEC] flex items-center justify-center mb-4">
                            {profilePicture ? (
                                <img
                                    src={profilePicture}
                                    alt="Profile"
                                    className="w-[110px] h-[110px] rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-12 h-12 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="text-center mb-12">
                        <h2 className="text-white text-lg font-['Manrope'] font-semibold leading-tight tracking-wide mb-2 truncate px-2">
                            {displayName.toUpperCase()}
                        </h2>
                        <p className="text-white text-sm font-['Manrope'] font-normal leading-tight tracking-wide">
                            {displayLocation}
                        </p>
                    </div>

                    {/* Menu Items */}
                    <div className="flex flex-col items-center gap-8 mb-16 w-full">
                        <Link
                            href="/account"
                            onClick={onClose}
                            className="text-white text-sm font-['Manrope'] font-medium leading-tight tracking-wide hover:text-[#14FFEC] transition-colors text-center cursor-pointer"
                        >
                            MY ACCOUNT
                        </Link>
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#14FFEC] to-transparent"></div>
                        <Link
                            href="/favorites/events"
                            onClick={onClose}
                            className="text-white text-sm font-['Manrope'] font-medium leading-tight tracking-wide hover:text-[#14FFEC] transition-colors text-center cursor-pointer"
                        >
                            FAVOURITE EVENTS
                        </Link>
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#14FFEC] to-transparent"></div>
                        <Link
                            href="/favorites/clubs"
                            onClick={onClose}
                            className="text-white text-sm font-['Manrope'] font-medium leading-tight tracking-wide hover:text-[#14FFEC] transition-colors text-center cursor-pointer"
                        >
                            FAVOURITE CLUBS
                        </Link>
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#14FFEC] to-transparent"></div>
                        <Link
                            href="/contact"
                            onClick={onClose}
                            className="text-white text-sm font-['Manrope'] font-medium leading-tight tracking-wide hover:text-[#14FFEC] transition-colors text-center cursor-pointer"
                        >
                            CONTACT
                        </Link>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="px-8 py-3 bg-[#129C91] rounded-full mb-12 hover:bg-[#108a7f] transition-colors cursor-pointer"
                    >
                        <span className="text-white text-base font-['Manrope'] font-semibold leading-tight tracking-wide">
                            Log Out
                        </span>
                    </button>

                    {/* Social Media Icons */}
                    <div className="flex items-center justify-center gap-6 mb-12">
                        <button className="w-8 h-8 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                            <img
                                src="/footer-logos/Phone.svg"
                                alt="Phone"
                                className="w-5 h-5"
                                style={{ filter: 'brightness(0) saturate(100%) invert(87%) sepia(96%) saturate(6444%) hue-rotate(149deg) brightness(103%) contrast(101%)' }}
                            />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                            <img
                                src="/footer-logos/whatsapp-logo-fill.svg"
                                alt="WhatsApp"
                                className="w-5 h-5"
                                style={{ filter: 'brightness(0) saturate(100%) invert(87%) sepia(96%) saturate(6444%) hue-rotate(149deg) brightness(103%) contrast(101%)' }}
                            />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                            <img
                                src="/footer-logos/x-logo-fill.svg"
                                alt="X"
                                className="w-5 h-5"
                                style={{ filter: 'brightness(0) saturate(100%) invert(87%) sepia(96%) saturate(6444%) hue-rotate(149deg) brightness(103%) contrast(101%)' }}
                            />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                            <img
                                src="/footer-logos/Envelope.svg"
                                alt="Email"
                                className="w-5 h-5"
                                style={{ filter: 'brightness(0) saturate(100%) invert(87%) sepia(96%) saturate(6444%) hue-rotate(149deg) brightness(103%) contrast(101%)' }}
                            />
                        </button>
                    </div>

                    {/* Brand Name */}
                    <img src="/logo/clubwizlogo.png" alt="ClubWiz" className="w-44 h-auto mb-6" />
                </div>
            </div>
        </>
    );
}