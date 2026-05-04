"use client";

import { useState } from "react";
import { ClubVizLogo } from "@/components/auth/logo";
import { AuthLink } from "@/components/auth/auth-link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { AuthService } from "@/lib/services/auth.service";
import { getDetailedErrorMessage, logDetailedError } from "@/lib/error-utils";

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();

    // Login form state - two fields as per API: usernameOrEmail and password
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
                    description: "Welcome back to ClubViz!",
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
                    redirectPath = '/superadmin';
                } else if (roles.includes('ROLE_BUSINESS_ADMIN')) {
                    redirectPath = '/business';
                } else if (roles.includes('ROLE_ADMIN')) {
                    redirectPath = '/admin';
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

            const errorMessage = getDetailedErrorMessage(error, 'Invalid credentials. Please try again.');

            toast({
                title: "Login failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = () => {
        toast({
            title: "Access Denied",
            description: "Guest access not available. Please login with admin credentials.",
            variant: "destructive",
        });
    };

    const handleForgotPassword = () => {
        router.push('/bz/auth/forgot-password');
    };

    const canSubmit = usernameOrEmail.trim() && password && !isLoading;

    return (
        <div className="min-h-screen bg-[#031313] relative">
            {/* Background blur effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[12vh] left-1/2 -translate-x-1/2 w-[20rem] h-[20rem] bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[12vh] left-1/3 w-[15rem] h-[15rem] bg-cyan-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 right-1/4 w-[10rem] h-[10rem] bg-teal-500/10 rounded-full blur-2xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-[1rem] pt-[1.5rem] flex-shrink-0">
                    <Link
                        href="/bz/auth/intro"
                        className="w-[2.5rem] h-[2.5rem] flex items-center justify-center rounded-full border border-teal-400/30 text-teal-300 hover:bg-teal-500/10 transition-colors"
                    >
                        <ArrowLeft className="w-[1.25rem] h-[1.25rem]" />
                    </Link>

                    <button
                        onClick={handleGuestLogin}
                        className="px-[1rem] py-[0.375rem] rounded-full border border-teal-400/30 text-[0.875rem] text-teal-300 hover:bg-teal-500/10 transition"
                    >
                        Guest Login
                    </button>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex flex-col">
                    {/* Logo */}
                    <div className="flex-1 flex flex-col items-center justify-end px-6 pb-8">
                        <ClubVizLogo size="lg" variant="full" />
                    </div>

                    <div className="bg-white rounded-t-3xl w-full px-[1.5rem] pt-[2rem] pb-[2rem] overflow-y-auto flex flex-col">
                        <h1 className="text-[1.5rem] font-semibold text-[#2C1945] mb-[0.5rem] text-center">
                            Welcome Back
                        </h1>
                        <p className="text-[#6A6A6A] text-[0.875rem] text-center mb-[1.5rem]">
                            Login to continue to ClubViz
                        </p>

                        {/* Username or Email Field */}
                        <div className="mb-[1rem]">
                            <label className="block text-[#2C1945] text-[0.9375rem] font-medium mb-[0.5rem]">
                                Username or Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0C898B]" />
                                <input
                                    type="text"
                                    value={usernameOrEmail}
                                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    placeholder="Enter username or email"
                                    className={`w-full pl-12 pr-4 py-[0.875rem] border-2 ${errors.usernameOrEmail ? 'border-red-500' : 'border-[#0C898B]'} rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] focus:outline-none focus:border-[#0A5A5D]`}
                                />
                            </div>
                            {errors.usernameOrEmail && (
                                <p className="text-red-500 text-xs mt-1 ml-4">{errors.usernameOrEmail}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="mb-[1rem]">
                            <label className="block text-[#2C1945] text-[0.9375rem] font-medium mb-[0.5rem]">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0C898B]" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    placeholder="Enter your password"
                                    className={`w-full pl-12 pr-12 py-[0.875rem] border-2 ${errors.password ? 'border-red-500' : 'border-[#0C898B]'} rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] focus:outline-none focus:border-[#0A5A5D]`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0C898B] hover:text-[#0A5A5D]"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1 ml-4">{errors.password}</p>
                            )}
                        </div>

                        {/* Forgot Password */}
                        <div className="text-right mb-[1.5rem]">
                            <button
                                onClick={handleForgotPassword}
                                className="text-[#0D7377] text-[0.875rem] font-medium hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`w-full py-[0.875rem] rounded-[3.25rem] font-semibold text-white transition-colors ${canSubmit
                                ? 'bg-[#0D7377] hover:bg-[#0A5A5D]'
                                : 'bg-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center my-[1.5rem]">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-4 text-[#6A6A6A] text-[0.875rem]">or</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        {/* Sign Up with OTP */}
                        <button
                            onClick={() => router.push('/bz/auth/mobile')}
                            className="w-full py-[0.875rem] rounded-[3.25rem] font-semibold text-[#0D7377] border-2 border-[#0D7377] bg-white hover:bg-[#0D7377]/5 transition-colors"
                        >
                            Continue with OTP
                        </button>

                        {/* Sign Up Link */}
                        <div className="mt-[1.5rem] text-center">
                            <p className="text-[#6A6A6A] text-[0.875rem]">
                                Don&apos;t have an account?{' '}
                                <Link href="/bz/auth/register" className="text-[#0D7377] font-semibold hover:underline">
                                    Sign Up
                                </Link>
                            </p>
                        </div>

                        {/* Terms */}
                        <div className="mt-4 text-center">
                            <p className="text-black font-semibold text-[14px]">
                                By login you are agreeing to
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
    );
}
