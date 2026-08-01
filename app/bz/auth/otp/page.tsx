"use client";

import { useState, useEffect, useRef } from "react";
import { ClubwizLogo } from "@/components/auth/logo";
import { AuthLink } from "@/components/auth/auth-link";
import Link from "next/link";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { MobileAuthService } from '@/lib/services/mobile-auth.service';
import { JWTService } from '@/lib/services/jwt.service';
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { AuthBackground } from "@/components/auth/auth-background";

export default function OTPVerificationScreen() {
    const router = useRouter();
    const { toast } = useToast();
    // Initialize exactly 6 empty strings for OTP
    const [otp, setOtp] = useState<string[]>(Array(6).fill('')); // 6 digit OTP
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Get phone number and email from localStorage
        const savedPhone = localStorage.getItem(STORAGE_KEYS.pendingPhone);
        const savedEmail = localStorage.getItem('pendingEmail');
        if (!savedPhone) {
            router.push('/bz/auth/mobile');
            return;
        }
        setPhoneNumber(savedPhone);
        setEmail(savedEmail);

        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Auto focus first OTP input on mount
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 100);

        return () => clearInterval(interval);
    }, [router]);

    const handleOtpChange = (index: number, value: string) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        if (!cleanValue) {
            const newOtp = [...otp];
            newOtp[index] = '';
            setOtp(newOtp);
            return;
        }

        if (cleanValue.length > 1) {
            const digits = cleanValue.split('').slice(0, 6);
            const newOtp = [...otp];
            const startIdx = cleanValue.length >= 6 ? 0 : index;
            for (let i = 0; i < digits.length; i++) {
                if (startIdx + i < otp.length) {
                    newOtp[startIdx + i] = digits[i];
                }
            }
            setOtp(newOtp);
            if (error) setError(null);

            const nextFocusIdx = Math.min(startIdx + digits.length, otp.length - 1);
            inputRefs.current[nextFocusIdx]?.focus();

            const fullOtp = newOtp.join('');
            if (fullOtp.length === 6) {
                handleVerifyOTP(fullOtp);
            }
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = cleanValue;
        setOtp(newOtp);
        if (error) setError(null);

        if (index < otp.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        const fullOtp = newOtp.join('');
        if (fullOtp.length === 6) {
            handleVerifyOTP(fullOtp);
        }
    };

    const handleBackspace = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const handleVerifyOTP = async (otpCode?: string) => {
        if (isLoading || !email || !phoneNumber) return;

        const otpValue = otpCode || otp.join('');
        if (otpValue.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("🔍 Verifying OTP:", otpValue);
            console.log("📧 Using email:", email);

            // Call backend /validate with email and OTP
            const response: any = await MobileAuthService.validateOtp(email, otpValue);
            console.log('✅ /validate response:', response);

            // Check if validation was successful - check for returnCode 100 or success flag
            const returnCode = response.returnCode || response.code;
            const isSuccess = response.success || returnCode === 100;

            if (!isSuccess) {
                throw new Error(response.returnMessage || response.message || 'OTP validation failed');
            }

            // Store OTP validation data for signup
            localStorage.setItem('otpValidated', 'true');
            localStorage.setItem('validatedEmail', email);
            localStorage.setItem('validatedPhone', phoneNumber);

            // If JWT token is returned (existing user OR pre-auth token), store it
            if (response.jwtToken && response.jwtToken !== 'null' && response.jwtToken !== '') {
                console.log("✅ Token received from OTP validation");

                // Store this token
                localStorage.setItem(STORAGE_KEYS.accessToken, response.jwtToken);

                // Decode token to check for roles and isRegistered status
                const decodedToken = JWTService.decodeToken(response.jwtToken);
                console.log("👤 Decoded Token:", decodedToken);

                // Check roles and registration status from token or response
                // Backend typically includes user info in the token payload
                const roles = decodedToken?.roles || response.user?.roles || [];
                const isRegistered = response.isRegistered || response.user?.isRegistered || (roles && roles.length > 0);

                console.log("🔍 User Status - isRegistered:", isRegistered, "roles:", roles);

                // Also update other validation flags
                localStorage.setItem('otpValidated', 'true');
                localStorage.setItem('validatedEmail', email);
                localStorage.setItem('validatedPhone', phoneNumber);

                // If user is already registered and has roles, redirect to dashboard
                if (isRegistered || (roles && roles.length > 0)) {
                    console.log("✅ Existing registered user found. Redirecting to dashboard...");
                    
                    let redirectPath = '/bz/business';
                    if (roles.includes('ROLE_SUPERADMIN')) {
                        redirectPath = '/bz/superadmin';
                    } else if (roles.includes('ROLE_BUSINESS_ADMIN')) {
                        redirectPath = '/bz/business';
                    } else if (roles.includes('ROLE_ADMIN')) {
                        redirectPath = '/bz/admin';
                    }

                    toast({
                        title: "Welcome Back!",
                        description: "Login successful. Redirecting to dashboard...",
                        className: "bg-green-50 border-green-200 text-green-900",
                    });

                    setTimeout(() => {
                        console.log(`🔄 Redirecting to ${redirectPath}...`);
                        router.replace(redirectPath);
                    }, 1000);
                    return;
                }

                // If not registered or no roles, continue to signup/register
                toast({
                    title: "OTP Verified Successfully",
                    description: "Redirecting to complete registration...",
                    className: "bg-green-50 border-green-200 text-green-900",
                });

                setTimeout(() => {
                    console.log("🔄 Redirecting to /bz/auth/register...");
                    router.replace('/bz/auth/register');
                }, 1000);
                return;
            }
            else {
                // Should not happen if API is correct, but safe fallback
                console.log("ℹ️ No Token - Redirecting to register");
                router.replace('/bz/auth/register');
            }

        } catch (error: any) {
            console.error("❌ OTP verification failed:", error);
            setError(error.message || 'Invalid OTP. Please try again.');

            toast({
                title: "Verification failed",
                description: error.message || 'Invalid OTP code. Please try again.',
                variant: "destructive",
            });

            // Clear OTP inputs on error
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    }; const handleResendOTP = async () => {
        if (!email || !phoneNumber || !canResend) return;

        setIsLoading(true);
        setError(null);

        try {
            console.log("Resending OTP to:", email, phoneNumber);

            // Resend OTP using backend with email and phone
            const sendResult = await MobileAuthService.sendOtp(email, phoneNumber);

            if (sendResult && (sendResult.success || sendResult.data)) {
                // Show success toast
                toast({
                    title: "OTP sent",
                    description: "New verification code sent to your mobile",
                });

                // Reset timer and UI state
                setTimer(30);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']); // Clear current OTP

                // Start timer countdown
                const interval = setInterval(() => {
                    setTimer((prev) => {
                        if (prev <= 1) {
                            setCanResend(true);
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }

        } catch (error: any) {
            console.error("Failed to resend OTP:", error);
            setError(error.message || 'Failed to resend OTP. Please try again.');

            toast({
                title: "Failed to resend OTP",
                description: error.message || 'Please try again',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const canSubmit = otp.every(d => d !== '') && !isLoading;

    return (
        <div className="min-h-screen bg-[#031313] relative flex flex-col font-sans items-center md:py-8">
            <div className="relative w-full max-w-md min-h-screen md:min-h-0 md:h-[850px] flex flex-col bg-[#031313] overflow-hidden md:rounded-[2.5rem] md:border border-white/10 shadow-2xl">
                <AuthBackground />

                <div className="relative z-10 flex flex-col flex-1">
                    {/* Header Navigation */}
                    <div className="flex items-center justify-between px-6 pt-8 pb-4 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-700">
                        <Link href="/bz/auth/mobile" className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 text-white bg-black/20 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Link href="/bz/auth/details" className="px-5 py-2.5 rounded-full border border-white/10 text-sm font-semibold text-white bg-black/20 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all">
                            Skip
                        </Link>
                    </div>

                    {/* Logo Zone */}
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 animate-in fade-in zoom-in-95 duration-700 delay-150">
                        <div className="relative mb-4 drop-shadow-[0_0_25px_rgba(20,255,236,0.4)]">
                            <ClubwizLogo size="lg" variant="full" />
                        </div>
                    </div>

                    {/* Glass card */}
                    <div className="bg-[#031313]/70 backdrop-blur-2xl border-t border-x md:border-b border-[#14FFEC]/10 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full px-7 pt-10 pb-10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300 md:mb-8">
                        
                        {/* Inner glowing accent */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#14FFEC]/50 to-transparent"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#14FFEC]/10 rounded-full blur-3xl pointer-events-none"></div>

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
                            VERIFICATION CODE
                        </h1>
                        
                        <div className="text-center mt-2 mb-2">
                            <span className="text-white/50 text-[12px] font-medium uppercase tracking-widest">Enter code. </span>
                            <button onClick={handleResendOTP} disabled={!canResend}
                                className="text-[#14FFEC] text-[12px] font-bold uppercase tracking-widest hover:underline transition-colors disabled:opacity-40 disabled:no-underline ml-1">
                                Resend
                            </button>
                        </div>

                        {/* Sent-to badge */}
                        {(phoneNumber || email) && (
                            <div className="text-center mt-4 mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5">Code sent to</p>
                                {email && <p className="text-white font-medium text-[13px] break-all">{email}</p>}
                                {email && phoneNumber && <p className="text-[#14FFEC]/50 text-[10px] uppercase font-bold my-1">and</p>}
                                {phoneNumber && <p className="text-white font-medium text-[15px] tracking-wide">+91 {phoneNumber?.slice(0, 5)} {phoneNumber?.slice(5)}</p>}
                            </div>
                        )}

                        {/* OTP boxes */}
                        <div className="flex justify-center gap-2 mb-6">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleBackspace(index, e)}
                                    onFocus={(e) => e.target.select()}
                                    className={`w-11 h-[3.5rem] text-center rounded-xl border-2 transition-all duration-300 outline-none text-[22px] font-bold ${
                                        digit 
                                            ? 'bg-white/10 border-[#14FFEC]/50 text-[#14FFEC] shadow-[0_0_15px_rgba(20,255,236,0.2)] transform scale-105' 
                                            : 'bg-white/5 border-white/10 text-white focus:border-[#14FFEC]/50 focus:bg-white/10'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <div className="text-center mb-6">
                            {!canResend && (
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                                    Resend in <span className="text-[#14FFEC] font-mono text-sm ml-1">{timer}</span>s
                                </p>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="text-red-400 text-sm text-center mb-5 font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-pulse">
                                {error}
                            </div>
                        )}

                        {/* CTA */}
                        <button 
                            onClick={() => handleVerifyOTP()} 
                            disabled={!canSubmit} 
                            className="w-full mb-8 bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-4 shadow-[0_0_20px_rgba(20,255,236,0.2)] hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        {/* Legal */}
                        <div className="mt-auto pt-2 text-center">
                            <p className="text-white/30 text-[10px] font-medium tracking-wide">
                                By continuing you agree to our{' '}
                                <AuthLink href="/bz/terms" className="text-white/50 hover:text-white underline">Terms</AuthLink>
                                {' & '}
                                <AuthLink href="/bz/privacy" className="text-white/50 hover:text-white underline">Privacy Policy</AuthLink>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}