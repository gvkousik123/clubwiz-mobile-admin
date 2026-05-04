"use client";

import { useState, useEffect } from "react";
import { ClubVizLogo } from "@/components/auth/logo";
import { AuthLink } from "@/components/auth/auth-link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { AuthService } from "@/lib/services/auth.service";

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (typeof window === "undefined") return;

        const isOtpValidated = localStorage.getItem("otpValidated") === "true";
        const validatedEmail = localStorage.getItem("validatedEmail");
        const validatedPhone = localStorage.getItem("validatedPhone");

        if (isOtpValidated && validatedEmail && validatedPhone) {
            setEmail(validatedEmail);
            setMobileNumber(validatedPhone);
        }
    }, [router]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (!email) {
            newErrors.email = "Email missing from OTP validation";
        }

        if (!mobileNumber) {
            newErrors.mobileNumber = "Mobile number missing from OTP validation";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            console.log("📝 Submitting registration from OTP flow");

            // Extract 10 digits
            let cleanMobile = mobileNumber.replace(/[^0-9]/g, "");
            if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
                cleanMobile = cleanMobile.substring(2);
            }

            const result = await AuthService.signUp(
                fullName.trim(),
                email.trim(),
                password,
                cleanMobile
            );

            if (result.success) {
                localStorage.removeItem("otpValidated");
                localStorage.removeItem("validatedEmail");
                localStorage.removeItem("validatedPhone");
                localStorage.removeItem(STORAGE_KEYS.pendingPhone);
                localStorage.removeItem("pendingEmail");

                toast({
                    title: "Registration complete!",
                    description: "Please log in to continue",
                });

                router.replace("/bz/auth/login");
            } else {
                throw new Error(result.error || result.message || "Registration failed");
            }
        } catch (error: any) {
            console.error("❌ Register error:", error);
            toast({
                title: "Registration failed",
                description: error.message || "Please try again",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginRedirect = () => {
        router.push("/bz/auth/login");
    };

    const canSubmit = !!fullName.trim() && !!password && !!confirmPassword && !isLoading;

    return (
        <div className="min-h-screen bg-[#031313] relative">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[12vh] left-1/2 -translate-x-1/2 w-[20rem] h-[20rem] bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[12vh] left-1/3 w-[15rem] h-[15rem] bg-cyan-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                <div className="flex items-center justify-between p-[1rem] pt-[1.5rem] flex-shrink-0">
                    <Link
                        href="/bz/auth/mobile"
                        className="w-[2.5rem] h-[2.5rem] flex items-center justify-center rounded-full border border-teal-400/30 text-teal-300 hover:bg-teal-500/10 transition-colors"
                    >
                        <ArrowLeft className="w-[1.25rem] h-[1.25rem]" />
                    </Link>

                    <button
                        onClick={handleLoginRedirect}
                        className="px-[1rem] py-[0.375rem] rounded-full border border-teal-400/30 text-[0.875rem] text-teal-300 hover:bg-teal-500/10 transition"
                    >
                        Login
                    </button>
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="flex flex-col items-center justify-end px-6 pb-6">
                        <ClubVizLogo size="lg" variant="full" />
                    </div>

                    <div className="bg-white rounded-t-3xl w-full px-[1.5rem] pt-[1.5rem] pb-[2rem] overflow-y-auto flex flex-col">
                        <h1 className="text-[1.5rem] font-semibold text-[#2C1945] mb-[1.5rem] text-center">
                            Complete Your Registration
                        </h1>

                        <p className="text-center text-[#6A6A6A] text-[0.875rem] mb-[1.5rem]">
                            Email and mobile were verified via OTP. Just add your name and password.
                        </p>

                        <div className="mb-[1rem]">
                            <label className="block text-[#2C1945] text-[0.875rem] font-medium mb-[0.5rem]">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0C898B]" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className={`w-full pl-12 pr-4 py-[0.75rem] border-2 ${errors.fullName ? "border-red-500" : "border-[#0C898B]"} rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] focus:outline-none focus:border-[#0A5A5D]`}
                                />
                            </div>
                            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                        </div>

                        <div className="mb-[1rem]">
                            <label className="block text-[#2C1945] text-[0.875rem] font-medium mb-[0.5rem]">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0C898B]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className={`w-full pl-12 pr-4 py-[0.75rem] border-2 ${errors.email ? "border-red-500" : "border-[#0C898B]"} rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] focus:outline-none focus:border-[#0A5A5D]`}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div className="mb-[1rem]">
                            <label className="block text-[#2C1945] text-[0.875rem] font-medium mb-[0.5rem]">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0C898B]" />
                                <input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    className={`w-full pl-12 pr-4 py-[0.75rem] border-2 ${errors.mobileNumber ? "border-red-500" : "border-[#0C898B]"} rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] focus:outline-none focus:border-[#0A5A5D]`}
                                />
                            </div>
                            {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
                        </div>

                        <div className="mb-[1rem]">
                            <label className="block text-[#2C1945] text-[0.875rem] font-medium mb-[0.5rem]">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0C898B]" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className={`w-full pl-12 pr-12 py-[0.75rem] border-2 ${errors.password ? "border-red-500" : "border-[#0C898B]"} rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] focus:outline-none focus:border-[#0A5A5D]`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0C898B]"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div className="mb-[1.5rem]">
                            <label className="block text-[#2C1945] text-[0.875rem] font-medium mb-[0.5rem]">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0C898B]" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className={`w-full pl-12 pr-12 py-[0.75rem] border-2 ${errors.confirmPassword ? "border-red-500" : "border-[#0C898B]"} rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] focus:outline-none focus:border-[#0A5A5D]`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0C898B]"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`w-full py-[0.875rem] rounded-[3.25rem] font-semibold text-white transition-colors ${canSubmit ? "bg-[#0D7377] hover:bg-[#0A5A5D]" : "bg-gray-400 cursor-not-allowed"}`}
                        >
                            {isLoading ? "Submitting..." : "Complete Registration"}
                        </button>

                        <div className="mt-4 text-center">
                            <p className="text-[#6A6A6A] text-[0.875rem]">
                                Need to switch account?{" "}
                                <Link href="/bz/auth/mobile" className="text-[#0D7377] font-semibold hover:underline">
                                    Restart verification
                                </Link>
                            </p>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-[#6A6A6A] text-[0.75rem]">
                                By signing up, you agree to our{" "}
                                <AuthLink href="/terms" className="text-[#0095FF] underline">Terms & Conditions</AuthLink>
                                {" "}and{" "}
                                <AuthLink href="/privacy" className="text-[#0095FF] underline">Privacy Policy</AuthLink>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
