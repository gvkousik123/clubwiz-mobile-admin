"use client";

import { useState } from "react";
import { AuthBackground } from "@/components/auth/auth-background";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthLink } from "@/components/auth/auth-link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { AuthService } from "@/lib/services/auth.service";
import { getDetailedErrorMessage, logDetailedError } from "@/lib/error-utils";

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();

    // Login form state - two fields as per API: usernameOrEmail and password
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate username/email
        if (!usernameOrEmail.trim()) {
            newErrors.usernameOrEmail = "Username or email is required";
        }

        // Validate password
        if (!password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        setErrors({});

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            console.log("🔐 Attempting login...");

            const result = await AuthService.signIn(
                usernameOrEmail.trim(),
                password
            );

            if (result.success) {
                toast({
                    title: "Login successful!",
                    description: "Welcome back to Clubwiz!",
                });

                // Check roles from both direct response and nested user object
                const roles = result.data?.roles || result.data?.user?.roles || [];
                const isClubAdded = result.data?.isClubAdded || result.data?.user?.isClubAdded || false;
                const isActive = result.data?.isActive || result.data?.user?.isActive || false;

                console.log("👤 User roles:", roles);
                console.log("🏢 isClubAdded:", isClubAdded);
                console.log("✅ isActive:", isActive);

                // Check if user has admin/superadmin/business admin role
                let redirectPath = '/auth/intro';
                if (roles.includes('ROLE_SUPERADMIN')) {
                    redirectPath = '/bz/superadmin';
                } else if (roles.includes('ROLE_ADMIN')) {
                    redirectPath = '/bz/admin';
                } else if (roles.includes('ROLE_BUSINESS_ADMIN')) {
                    redirectPath = '/bz/business';
                } else {
                    // Regular users not allowed
                    throw new Error('Access denied. Admin, Business Admin or SuperAdmin role required.');
                }

                console.log("🔄 Final redirect path:", redirectPath);
                router.replace(redirectPath);
            } else {
                const errorMsg = Array.isArray(result.errors)
                    ? result.errors.join(', ')
                    : (result.errors || result.message || 'Login failed');
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            logDetailedError('Login error', error);

            const backendMessage =
                error?.response?.data?.details ||
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                '';

            if (/bad credentials|invalid credentials|wrong credentials|incorrect password|incorrect username/i.test(backendMessage)) {
                setErrors({
                    usernameOrEmail: '',
                    password: 'Password is not correct',
                });
            } else {
                const errorMessage = getDetailedErrorMessage(error, 'Invalid credentials. Please try again.');
                toast({
                    title: "Login failed",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        router.push('/bz/auth/forgot-password');
    };

    const canSubmit = usernameOrEmail.trim() && password && !isLoading;

    return (
        <div className="min-h-screen bg-[#031313] relative flex flex-col font-sans items-center md:py-8">
            <div className="relative w-full max-w-md min-h-screen md:min-h-0 md:h-[850px] flex flex-col bg-[#031313] overflow-hidden md:rounded-[2.5rem] md:border border-white/10 shadow-2xl">
                
                <AuthBackground />
                
                <div className="relative z-10 flex flex-col flex-1">
                    {/* Header */}
                    <div className="px-6 pt-8 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
                        <Link
                            href="/auth/intro"
                            className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 text-white bg-black/20 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </div>

                    {/* Logo */}
                    <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in-95 duration-700 delay-150">
                        <Image
                            src="/logo/clubwizlogo.png"
                            alt="ClubWiz"
                            width={120}
                            height={120}
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Glass Card */}
                    <div className="bg-[#031313]/70 backdrop-blur-2xl border-t border-x border-[#14FFEC]/10 rounded-t-[2.5rem] w-full px-7 pt-10 pb-10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
                        
                        {/* Top accent line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#14FFEC]/50 to-transparent"></div>
                        
                        {/* Corner glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#14FFEC]/10 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Title */}
                        <h1 
                            className="text-center font-['Anton_SC',system-ui] text-[2rem] leading-none tracking-wide mb-1"
                            style={{
                                background: "linear-gradient(180deg, #7FF9FF 0%, #FFF 102.94%)",
                                WebkitBackgroundClip: "text",
                                backgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                WebkitTextStrokeWidth: "0.5px",
                                WebkitTextStrokeColor: "#029694",
                                textShadow: "0 0 10px rgba(127, 249, 255, 0.3)"
                            }}
                        >
                            WELCOME BACK
                        </h1>

                        <p className="text-[#14FFEC]/60 text-[13px] font-medium text-center uppercase tracking-widest mb-8">
                            Sign in to the club
                        </p>

                        {/* Form */}
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                            {/* Username/Email Input */}
                            <div>
                                <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2 block">
                                    Username or Email
                                </label>
                                <AuthInput
                                    type="text"
                                    placeholder="Enter username or email"
                                    icon={<Mail />}
                                    value={usernameOrEmail}
                                    onChange={(e) => {
                                        setUsernameOrEmail(e.target.value);
                                        if (errors.usernameOrEmail) {
                                            setErrors((prev) => ({ ...prev, usernameOrEmail: '' }));
                                        }
                                    }}
                                    required
                                    error={!!errors.usernameOrEmail}
                                />
                                {errors.usernameOrEmail && (
                                    <p className="text-red-400 text-xs mt-2">{errors.usernameOrEmail}</p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2 block">
                                    Password
                                </label>
                                <AuthInput
                                    type="password"
                                    placeholder="Enter your password"
                                    icon={<Lock />}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) {
                                            setErrors((prev) => ({ ...prev, password: '' }));
                                        }
                                    }}
                                    required
                                    error={!!errors.password}
                                />
                                {errors.password && (
                                    <p className="text-red-400 text-xs mt-2">{errors.password}</p>
                                )}
                            </div>

                            {/* Forgot Password */}
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-[#14FFEC] text-sm font-medium hover:text-[#14FFEC]/80 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <AuthButton
                                variant="primary"
                                type="submit"
                                disabled={isLoading || !canSubmit}
                            >
                                {isLoading ? 'Logging in...' : 'Enter ClubWiz'}
                            </AuthButton>

                            {/* Divider */}
                            <div className="flex items-center my-6">
                                <div className="flex-1 border-t border-white/10"></div>
                                <span className="px-4 text-white/40 text-sm uppercase tracking-wider">or</span>
                                <div className="flex-1 border-t border-white/10"></div>
                            </div>

                            {/* OTP Button */}
                            <AuthButton
                                variant="secondary"
                                onClick={() => router.push('/bz/auth/mobile')}
                            >
                                Continue with OTP
                            </AuthButton>
                        </form>

                        {/* Sign Up Link */}
                        <div className="mt-8 text-center">
                            <p className="text-white/60 text-sm">
                                Don&apos;t have an account?{' '}
                                <Link href="/auth/register" className="text-[#14FFEC] font-semibold hover:underline">
                                    Sign Up
                                </Link>
                            </p>
                        </div>

                        {/* Terms */}
                        <div className="mt-6 text-center">
                            <p className="text-white/40 text-xs">
                                By logging in you agree to our{' '}
                                <AuthLink href="/terms" className="text-[#14FFEC] underline">Terms</AuthLink>
                                {' '}and{' '}
                                <AuthLink href="/privacy" className="text-[#14FFEC] underline">Privacy Policy</AuthLink>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
