'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { User as FirebaseUser } from 'firebase/auth';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { AuthService } from '@/lib/services/auth.service';

// Unified user type
export type AuthUser = FirebaseUser | any;

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    signOut: () => Promise<void>;
    getCurrentUser: () => AuthUser | null;
    getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const firebaseAuth = useFirebaseAuth();
    const [customUser, setCustomUser] = useState<any | null>(null);
    const [isCustomAuthLoading, setIsCustomAuthLoading] = useState(true);

    // Check for custom auth session (localStorage) on mount
    useEffect(() => {
        const checkCustomAuth = () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem(STORAGE_KEYS.accessToken);
                const userStr = localStorage.getItem(STORAGE_KEYS.user);

                if (token && userStr) {
                    try {
                        const parsedUser = JSON.parse(userStr);
                        // Basic validation that it's an object
                        if (parsedUser && typeof parsedUser === 'object') {
                            setCustomUser(parsedUser);
                        }
                    } catch (e) {
                        console.error('Failed to parse stored user session:', e);
                    }
                } else if (!token) {
                    // Token missing, clear user if set
                    setCustomUser(null);
                }
            }
            setIsCustomAuthLoading(false);
        };

        checkCustomAuth();

        // Listen for storage events (e.g. login in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEYS.accessToken || e.key === STORAGE_KEYS.user) {
                checkCustomAuth();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Combine Authentication States
    // If either Firebase OR Custom Auth has a user, we are authenticated.
    // Priority: Firebase > Custom (arbitrary choice, but usually only one is active)
    const activeUser = firebaseAuth.user || customUser;

    // Loading is true only if both are potentially loading. 
    // Since useFirebaseAuth starts loading=true, and we start isCustomAuthLoading=true,
    // we should wait for both initial checks to complete.
    const isLoading = firebaseAuth.loading || isCustomAuthLoading;

    // Unified Sign Out
    const signOut = async () => {
        try {
            // 1. Sign out from Firebase
            await firebaseAuth.signOut();

            // 2. Sign out from Custom Auth (clears localStorage)
            await AuthService.logout();

            // 3. Clear local state
            setCustomUser(null);

            // 4. Force specific clear if AuthService didn't catch everything
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEYS.accessToken);
                localStorage.removeItem(STORAGE_KEYS.user);
            }
        } catch (error) {
            console.error('Error during sign out:', error);
        }
    };

    const getCurrentUser = () => activeUser;

    const getIdToken = async () => {
        if (firebaseAuth.user) {
            return firebaseAuth.getIdToken();
        }
        if (customUser) {
            // Return stored access token
            return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.accessToken) : null;
        }
        return null;
    };

    const value = {
        user: activeUser,
        loading: isLoading,
        error: firebaseAuth.error, // We could add custom auth error here too if we tracked it
        isAuthenticated: !!activeUser,
        signOut,
        getCurrentUser,
        getIdToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthProvider;