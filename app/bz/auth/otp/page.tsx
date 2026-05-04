"use client";

import { useState, useEffect, useRef } from "react";
import { ClubVizLogo } from "@/components/auth/logo";
import { AuthLink } from "@/components/auth/auth-link";
import Link from "next/link";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { MobileAuthService } from '@/lib/services/mobile-auth.service';
import { JWTService } from '@/lib/services/jwt.service';
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants/storage";

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

        return () => clearInterval(interval);
    }, [router]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length <= 1 && /^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Clear error when user types
            if (error) setError(null);

            // Auto-focus next input (only if not on last input)
            if (value && index < otp.length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleBackspace = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
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

                // Store this token as a temporary "pre-auth" token for the next step (Signin/Signup)
                // The backend requires this token in the Authorization header for signin/signup
                localStorage.setItem(STORAGE_KEYS.accessToken, response.jwtToken);

                // Also update other validation flags
                localStorage.setItem('otpValidated', 'true');
                localStorage.setItem('validatedEmail', email);
                localStorage.setItem('validatedPhone', phoneNumber);

                // Show success toast
                toast({
                    title: "OTP Verified Successfully",
                    description: "Redirecting to complete registration...",
                    className: "bg-green-50 border-green-200 text-green-900",
                });

                // IMPORTANT: Navigate to Signup by default as requested
                // User can switch to Signin from there if needed
                setTimeout(() => {
                    console.log("🔄 Redirecting to /auth/signup...");
                    router.replace('/bz/auth/signup');
                }, 1000); // Small delay to let user see toast
                return;
            }
            else {
                // Should not happen if API is correct, but safe fallback
                console.log("ℹ️ No Token - Redirecting to signup");
                router.replace('/bz/auth/signup');
            }

            // New user - redirect to signup page to complete registration
            toast({
                title: "OTP Verified!",
                description: "Please complete your registration",
            });

            console.log("🔄 New user - Redirecting to register page...");
            router.replace('/bz/auth/register');

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

    const canSubmit = otp.every(digit => digit !== '') && !isLoading;

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
                        href="/auth/mobile"
                        className="w-[2.5rem] h-[2.5rem] flex items-center justify-center rounded-full border border-teal-400/30 text-teal-300 hover:bg-teal-500/10 transition-colors"
                    >
                        <ArrowLeft className="w-[1.25rem] h-[1.25rem]" />
                    </Link>

                    <Link
                        href="/auth/details"
                        className="px-[1rem] py-[0.375rem] rounded-full border border-teal-400/30 text-[0.875rem] text-teal-300 hover:bg-teal-500/10 transition"
                    >
                        Skip
                    </Link>
                </div>

                {/* White Card Container - Sticks to bottom and takes remaining space */}
                <div className="flex-1 flex flex-col">
                    {/* Logo Area - Now positioned just above the form with increased spacing */}
                    <div className="flex-1 flex flex-col items-center justify-end px-6 pb-8">
                        <ClubVizLogo size="lg" variant="full" />
                    </div>

                    <div className="bg-white rounded-t-3xl w-full px-[1.5rem] pt-[2rem] pb-[2rem] overflow-y-auto flex flex-col">
                        {/* Header */}
                        <div className="mb-[2rem]">
                            <h1 className="text-[1.5rem] font-semibold text-[#2C1945] mb-[1.25rem] text-center">Verification Code</h1>
                            <div className="text-center mb-[0.5rem]">
                                <span className="text-[#2C1945] font-bold">Enter verification code. </span>
                                <button
                                    onClick={handleResendOTP}
                                    disabled={!canResend}
                                    className="text-[#417CFD] font-bold"
                                >
                                    Resend Code
                                </button>
                            </div>
                            {phoneNumber && (
                                <div className="text-center">
                                    <p className="text-[0.875rem] text-[#6A6A6A]">Code sent to</p>
                                    <p className="text-[#0D7377] font-semibold">{phoneNumber?.slice(0, 3)} {phoneNumber?.slice(3)}</p>
                                </div>
                            )}
                        </div>

                        {/* OTP Input Display */}
                        <div className="flex justify-center gap-[0.75rem] mb-[1.5rem]">
                            {otp.map((digit, index) => (
                                <div
                                    key={index}
                                    className={`w-[3rem] h-[3rem] flex items-center justify-center rounded-[0.75rem] 
                                        ${digit ? 'bg-[#EFEFEF] border border-[#0C898B]' : 'bg-[#F7F7F7] border border-[#E0E0E0]'}`}
                                >
                                    <span className="text-xl font-bold text-[#2C1945]">
                                        {digit || ''}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Countdown Timer */}
                        <div className="text-center mb-4">
                            {!canResend && (
                                <p className="text-[#6A6A6A] font-bold text-[15px]">
                                    Resend code in : {timer} sec
                                </p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-red-500 text-sm text-center mb-4 font-medium animate-pulse p-2 bg-red-50 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Number Keypad */}
                        <div className="mx-auto w-[280px] space-y-4 mb-6">
                            {/* Keypad Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => {
                                            const emptyIndex = otp.findIndex(digit => digit === '');
                                            if (emptyIndex !== -1) {
                                                handleOtpChange(emptyIndex, num.toString());
                                            }
                                        }}
                                        className="w-[70px] h-[70px] rounded-full border border-[#0C898B] 
                                             bg-white text-[#42353B] text-3xl font-semibold
                                             hover:bg-gray-50 active:bg-gray-100 
                                             flex items-center justify-center"
                                    >
                                        {num}
                                    </button>
                                ))}

                                {/* Bottom Row */}
                                <button
                                    onClick={() => {
                                        const lastFilledIndex = [...otp].reverse().findIndex(digit => digit !== '');
                                        if (lastFilledIndex !== -1) {
                                            const index = otp.length - 1 - lastFilledIndex;
                                            handleOtpChange(index, '');
                                            inputRefs.current[index]?.focus();
                                        }
                                    }}
                                    className="w-[70px] h-[70px] rounded-full bg-[#EFEFEF] 
                                        text-gray-900 flex items-center justify-center"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => {
                                        const emptyIndex = otp.findIndex(digit => digit === '');
                                        if (emptyIndex !== -1) {
                                            handleOtpChange(emptyIndex, '0');
                                        }
                                    }}
                                    className="w-[70px] h-[70px] rounded-full border border-[#0C898B] 
                                        bg-white text-[#42353B] text-3xl font-semibold
                                        hover:bg-gray-50 active:bg-gray-100
                                        flex items-center justify-center"
                                >
                                    0
                                </button>

                                <button
                                    onClick={() => handleVerifyOTP()}
                                    disabled={!canSubmit}
                                    className={`w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all duration-300 ${canSubmit
                                        ? "bg-[#0D7377] text-white shadow-lg active:scale-95 cursor-pointer opacity-100"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-0 pointer-events-none"
                                        }`}
                                >
                                    <ArrowRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Display OTP input fields (hidden) */}
                        <div className="hidden">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleBackspace(index, e)}
                                />
                            ))}
                        </div>

                        {/* Terms and Conditions */}
                        <div className="mt-auto pt-4">
                            <div className="text-center">
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
        </div>
    );
}