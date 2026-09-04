"use client";

import { useState, useEffect } from "react";
import { ClubwizLogo } from "@/components/auth/logo";
import { AuthLink } from "@/components/auth/auth-link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants/storage";

export default function DetailsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({ fullName: "", email: "" });

    // Check if user should be on this page
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const phoneNumber = localStorage.getItem('tempPhoneNumber');
        const firebaseToken = localStorage.getItem('tempFirebaseToken');

        // If no temporary data, redirect back to mobile auth
        if (!phoneNumber || !firebaseToken) {
            console.log("⚠️ No registration session found, redirecting to mobile auth");
            router.push('/bz/auth/mobile');
        }
    }, [router]);

    const validateForm = () => {
        const newErrors = { fullName: "", email: "" };
        let isValid = true;

        // Validate full name
        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required";
            isValid = false;
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
            isValid = false;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!emailRegex.test(email.trim())) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            if (typeof window === 'undefined') {
                throw new Error('This operation requires client-side rendering');
            }

            console.log("🔄 Starting registration flow...");

            // Get stored data from Firebase verification
            const phoneNumber = localStorage.getItem('tempPhoneNumber');
            const firebaseToken = localStorage.getItem('tempFirebaseToken');

            if (!phoneNumber || !firebaseToken) {
                throw new Error('Registration session expired. Please restart the verification process.');
            }

            const { MobileAuthService } = await import('@/lib/services/mobile-auth.service');

            // ========== NEW FLOW: VERIFY FIREBASE TOKEN FIRST ==========

            // Step 1: Verify Firebase Token (Check if user already exists)
            console.log("🔐 Step 1: Calling verify-firebase-token API to check user status...");
            let tokenVerificationResult;
            try {
                tokenVerificationResult = await MobileAuthService.verifyFirebaseToken(firebaseToken);
                console.log("✅ Step 1 Response:", tokenVerificationResult);
            } catch (error: any) {
                console.error("❌ Step 1 Error:", error.message);
                throw new Error(`Token verification failed: ${error.message}`);
            }

            // Check if user already exists
            const isExistingUser = tokenVerificationResult?.data?.existingUser === true;
            console.log("👤 User status:", isExistingUser ? "EXISTING USER" : "NEW USER");

            let registrationResult = null;

            // Step 2: If NEW USER, call complete registration API
            if (!isExistingUser) {
                console.log("📝 Step 2: Calling complete-registration API for new user...");
                try {
                    registrationResult = await MobileAuthService.completeRegistration({
                        mobileNumber: phoneNumber,
                        fullName: fullName.trim(),
                        email: email.trim()
                    });
                    console.log("✅ Step 2 Response:", registrationResult);
                } catch (error: any) {
                    console.error("❌ Step 2 Error:", error.message);
                    throw new Error(`Registration failed: ${error.message}`);
                }
            } else {
                console.log("✨ User already registered, skipping complete-registration step");
            }

            // Step 3: Store authentication data
            console.log("💾 Step 3: Storing authentication data...");

            // Extract tokens - prefer from complete-registration (new users), fallback to verify-token (existing users)
            let finalTokens: any = null;

            if (registrationResult?.data?.accessToken) {
                console.log("✅ Using tokens from Step 2 (complete-registration)");
                finalTokens = {
                    accessToken: registrationResult.data.accessToken,
                    refreshToken: registrationResult.data.refreshToken
                };
            } else if (tokenVerificationResult?.data?.accessToken) {
                console.log("✅ Using tokens from Step 1 (verify-firebase-token)");
                finalTokens = {
                    accessToken: tokenVerificationResult.data.accessToken,
                    refreshToken: tokenVerificationResult.data.refreshToken
                };
            }

            if (!finalTokens?.accessToken) {
                console.error("❌ No tokens found in responses");
                console.log("Registration result:", registrationResult);
                console.log("Verification result:", tokenVerificationResult);
                throw new Error('No authentication token received from server');
            }

            // Store tokens
            localStorage.setItem(STORAGE_KEYS.accessToken, finalTokens.accessToken);
            if (finalTokens.refreshToken) {
                localStorage.setItem(STORAGE_KEYS.refreshToken, finalTokens.refreshToken);
            }

            // Store user data
            let userData: any;
            if (registrationResult?.data?.user) {
                // New user registration response
                userData = registrationResult.data.user;
            } else if (isExistingUser && tokenVerificationResult?.data?.user) {
                // Existing user - build from verify-firebase-token response
                userData = {
                    id: tokenVerificationResult.data.user.id,
                    phoneNumber: tokenVerificationResult.data.user.phoneNumber,
                    isVerified: tokenVerificationResult.data.user.isVerified,
                };
            }

            if (userData) {
                console.log("📝 Storing user data:", userData);
                localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
            } else {
                console.warn("⚠️ No user data found in responses");
            }

            // Clean up temporary data
            localStorage.removeItem('tempFirebaseToken');
            localStorage.removeItem('tempPhoneNumber');
            localStorage.removeItem('verificationResult');

            console.log("✅ All steps completed successfully!");
            console.log("📊 Stored tokens and user data");

            toast({
                title: isExistingUser ? "Welcome back!" : "Registration completed!",
                description: isExistingUser ? "You're all set!" : "Welcome to Clubwiz!",
            });

            // Determine redirect route based on role
            let redirectRoute = '/bz/auth/intro'; // Default for ROLE_USER

            try {
                // Get user data from localStorage to check roles
                const storedUserData = localStorage.getItem(STORAGE_KEYS.user);
                if (storedUserData) {
                    const userData = JSON.parse(storedUserData);
                    const userRoles = userData.roles || [];

                    if (userRoles.includes('ROLE_SUPERADMIN')) {
                        redirectRoute = '/bz/superadmin';
                    } else if (userRoles.includes('ROLE_ADMIN')) {
                        redirectRoute = '/bz/admin';
                    } else if (userRoles.includes('ROLE_USER')) {
                        redirectRoute = '/bz/auth/intro';
                    } else {
                        console.log("ℹ️ No specific role found, defaulting to /auth/intro");
                    }
                }
            } catch (error) {
                console.error("Error getting user roles:", error);
                // Default to auth intro if error
                redirectRoute = '/bz/auth/intro';
            }

            // Navigate to appropriate dashboard based on role
            setTimeout(() => {
                if (redirectRoute === '/bz/auth/intro') {
                    router.push('/bz/auth/intro');
                } else {
                    router.push(redirectRoute);
                }
            }, 800);

        } catch (error: any) {
            console.error("❌ Error during authentication process:", error);
            toast({
                title: "Authentication failed",
                description: error.message || 'Please try again',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const canSubmit = fullName.trim() && email.trim() && !isLoading;

    return (
        <div className="min-h-screen bg-[#031313] relative">
            {/* Background blur effects - subtle accents */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[12vh] left-1/2 -translate-x-1/2 w-[20rem] h-[20rem] bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[12vh] left-1/3 w-[15rem] h-[15rem] bg-cyan-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 right-1/4 w-[10rem] h-[10rem] bg-teal-500/10 rounded-full blur-2xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header with Back and Skip */}
                <div className="flex items-center justify-between p-[1rem] pt-[1.5rem] flex-shrink-0">
                    <Link
                        href="/bz/auth/otp"
                        className="w-[2.5rem] h-[2.5rem] flex items-center justify-center rounded-full border border-teal-400/30 text-teal-300 hover:bg-teal-500/10 transition-colors"
                    >
                        <ArrowLeft className="w-[1.25rem] h-[1.25rem]" />
                    </Link>

                    <button
                        onClick={() => router.push('/bz/auth/intro')}
                        className="px-[1rem] py-[0.375rem] rounded-full border border-teal-400/30 text-[0.875rem] text-teal-300 hover:bg-teal-500/10 transition"
                    >
                        Skip
                    </button>
                </div>

                {/* White Card Container - Sticks to bottom and takes remaining space */}
                <div className="flex-1 flex flex-col">
                    {/* Logo Area - Now positioned just above the form with increased spacing */}
                    <div className="flex-1 flex flex-col items-center justify-end px-6 pb-8">
                        <ClubwizLogo size="lg" variant="full" />
                    </div>

                    <div className="bg-white rounded-t-3xl w-full px-[1.5rem] pt-[2rem] pb-[2rem] overflow-y-auto flex flex-col">
                        {/* Header */}
                        <div className="mb-[1.5rem]">
                            <h1 className="text-[1.5rem] font-semibold text-[#2C1945] mb-[1.25rem] text-center">Enter Your Details</h1>
                        </div>

                        {/* Confirmation text */}
                        <div className="mb-[2rem] text-center">
                            <p className="text-[#2C1945] text-[0.9375rem] font-medium">Enter your required information</p>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-[1.5rem] mb-[2rem]">
                            {/* Full Name Field */}
                            <div>
                                <label className="block text-[#2C1945] text-[0.9375rem] font-medium mb-[0.5rem]">
                                    Full name
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => {
                                        setFullName(e.target.value);
                                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }));
                                    }}
                                    placeholder="Enter your full name"
                                    className={`w-full px-[1rem] py-[0.875rem] border-2 rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] transition-colors ${errors.fullName
                                        ? 'border-red-300 focus:border-red-500'
                                        : 'border-[#0C898B] focus:border-[#0C898B]'
                                        } focus:outline-none`}
                                />
                                {errors.fullName && (
                                    <p className="mt-1 text-[0.875rem] text-red-500">{errors.fullName}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="block text-[#2C1945] text-[0.9375rem] font-medium mb-[0.5rem]">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                                    }}
                                    placeholder="Enter your email"
                                    className={`w-full px-[1rem] py-[0.875rem] border-2 rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] transition-colors ${errors.email
                                        ? 'border-red-300 focus:border-red-500'
                                        : 'border-[#0C898B] focus:border-[#0C898B]'
                                        } focus:outline-none`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-[0.875rem] text-red-500">{errors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`w-full py-[0.875rem] rounded-[3.25rem] text-[1rem] font-semibold transition-all duration-200 ${canSubmit
                                ? 'bg-[#0D7377] hover:bg-[#0A5A5D] text-white'
                                : 'bg-[#EFEFEF] text-[#999999] cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? 'Saving...' : 'Submit details'}
                        </button>

                        {/* Terms and Conditions */}
                        <div className="mt-auto pt-4">
                            <div className="text-center">
                                <p className="text-black font-semibold text-[14px]">
                                    By proceeding you are agreeing to
                                </p>
                                <p className="text-[14px] font-semibold mt-1">
                                    <AuthLink href="/terms" className="text-[#0095FF] font-semibold underline">Terms & Condition</AuthLink>
                                    <span className="text-black"> and </span>
                                    <AuthLink href="/privacy" className="text-[#0095FF] font-semibold underline">Privacy Policy</AuthLink>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}