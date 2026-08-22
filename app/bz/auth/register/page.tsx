"use client";

import { useState, useEffect } from "react";
import { ClubwizLogo } from "@/components/auth/logo";
import { AuthLink } from "@/components/auth/auth-link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { AuthService } from "@/lib/services/auth.service";
import { AuthBackground } from "@/components/auth/auth-background";

/* ── Input Helper ───────────────────────────────────── */
const InputField = ({ icon: Icon, label, value, onChange, placeholder, type = "text", error, passwordToggle }: any) => (
    <div className="mb-4">
        <label className="block text-white/50 text-[11px] font-bold mb-2 ml-2 uppercase tracking-widest">{label}</label>
        <div className="relative group">
            <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${error ? 'text-red-400' : 'text-white/40 group-focus-within:text-[#14FFEC]'}`} />
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-white/5 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#14FFEC]/50'} text-white rounded-2xl pl-12 ${passwordToggle ? 'pr-12' : 'pr-4'} py-3.5 outline-none focus:bg-white/10 transition-all font-medium placeholder:text-white/20`}
            />
            {passwordToggle}
        </div>
        {error && <p className="text-red-400 text-xs mt-1.5 ml-3">{error}</p>}
    </div>
);

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
                throw new Error(result!.error || result.message || "Registration failed");
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

    const clearFieldError = (field: string) => {
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const canSubmit = !!fullName.trim() && !!password && !!confirmPassword && !isLoading;

    return (
        <div className="min-h-screen bg-[#031313] relative flex flex-col font-sans items-center md:py-8">
            <div className="relative w-full max-w-md min-h-screen md:min-h-0 md:h-[850px] flex flex-col bg-[#031313] overflow-hidden md:rounded-[2.5rem] md:border border-white/10 shadow-2xl">
                <AuthBackground />

                <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
                    {/* Header Navigation */}
                    <div className="flex items-center justify-between px-6 pt-8 pb-2 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-700">
                        <Link href="/bz/auth/mobile" className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 text-white bg-black/20 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Link href="/bz/auth/login" className="px-5 py-2.5 rounded-full border border-white/10 text-sm font-semibold text-white bg-black/20 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all">
                            Sign In
                        </Link>
                    </div>

                    {/* Logo Zone */}
                    <div className="flex flex-col items-center justify-center px-6 py-4 animate-in fade-in zoom-in-95 duration-700 delay-150">
                        <div className="relative drop-shadow-[0_0_25px_rgba(20,255,236,0.4)]">
                            <ClubwizLogo size="md" variant="full" />
                        </div>
                    </div>

                    {/* Glass card */}
                    <div className="bg-[#031313]/70 backdrop-blur-2xl border-t border-x border-[#14FFEC]/10 rounded-t-[2.5rem] w-full px-7 pt-8 pb-8 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative overflow-y-auto flex-1 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">

                        {/* Inner glowing accent */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#14FFEC]/50 to-transparent"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#14FFEC]/10 rounded-full blur-3xl pointer-events-none"></div>

                        <h1
                            className="text-center font-['Anton_SC',system-ui] text-[1.75rem] leading-none tracking-wide mb-1"
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
                            COMPLETE REGISTRATION
                        </h1>
                        <p className="text-[#14FFEC]/60 text-[12px] font-medium text-center uppercase tracking-widest mb-6">
                            Already have an account?{' '}
                            <Link href="/bz/auth/login" className="text-[#14FFEC] font-bold hover:underline">Login</Link>
                        </p>

                        <InputField icon={User} label="Full Name" value={fullName} onChange={(e: any) => { setFullName(e.target.value); clearFieldError('fullName'); }} placeholder="Your full name" error={errors.fullName} />
                        <InputField icon={Mail} label="Email Address" value={email} onChange={(e: any) => { setEmail(e.target.value); clearFieldError('email'); }} placeholder="Your email" type="email" error={errors.email} />
                        <InputField icon={Phone} label="Mobile Number" value={mobileNumber} onChange={(e: any) => { setMobileNumber(e.target.value); clearFieldError('mobileNumber'); }} placeholder="Mobile number" type="tel" error={errors.mobileNumber} />

                        <InputField
                            icon={Lock} label="Password" value={password}
                            onChange={(e: any) => { setPassword(e.target.value); clearFieldError('password'); }}
                            placeholder="Create a password" type={showPassword ? "text" : "password"} error={errors.password}
                            passwordToggle={
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            }
                        />
                        <InputField
                            icon={Lock} label="Confirm Password" value={confirmPassword}
                            onChange={(e: any) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                            placeholder="Re-enter password" type={showConfirmPassword ? "text" : "password"} error={errors.confirmPassword}
                            passwordToggle={
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            }
                        />

                        {/* CTA */}
                        <button onClick={handleSubmit} disabled={!canSubmit} className="w-full mt-4 bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-4 shadow-[0_0_20px_rgba(20,255,236,0.2)] hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 disabled:cursor-not-allowed">
                            {isLoading ? 'Registering...' : 'Join Clubwiz'}
                        </button>

                        <div className="mt-6 text-center">
                            <p className="text-white/60 text-sm font-medium">
                                Need to switch?{' '}
                                <Link href="/bz/auth/mobile" className="text-[#14FFEC] font-bold hover:underline transition-all">Restart verification</Link>
                            </p>
                        </div>

                        <div className="mt-6 text-center pb-2">
                            <p className="text-white/30 text-[10px] font-medium tracking-wide">
                                By signing up you agree to our{' '}
                                <AuthLink href="/terms" className="text-white/50 hover:text-white underline">Terms</AuthLink>
                                {' & '}
                                <AuthLink href="/privacy" className="text-white/50 hover:text-white underline">Privacy Policy</AuthLink>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
