"use client";

import { useState, useEffect } from "react";
import { ClubVizLogo } from "@/components/auth/logo";
import { AuthLink } from "@/components/auth/auth-link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { MobileAuthService } from '@/lib/services/mobile-auth.service';
import { AuthService } from "@/lib/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants/storage";

export default function MobileVerificationScreen() {
    const router = useRouter();
    const { toast } = useToast();
    // Initialize with exactly 10 placeholder X's: +91 XXXXXXXXXX
    const [phoneNumber, setPhoneNumber] = useState(() => {
        const initialPhone = "+91 XXXXXXXXXX";
        console.log("Initial phone state:", initialPhone, "Length:", initialPhone.length);
        return initialPhone;
    });
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle guest login
    const handleGuestLogin = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.accessToken);
            localStorage.removeItem(STORAGE_KEYS.user);
            localStorage.removeItem(STORAGE_KEYS.refreshToken);
        }

        // Show success message
        toast({
            title: "Welcome, Guest!",
            description: "You can browse clubs and events without logging in",
        });

        // Navigate to home page as guest
        router.push('/bz/business');
    };

    // No client-side reCAPTCHA when using backend OTP endpoints

    const handleNumberPress = (num: string) => {
        console.log("Number pressed:", num, "Current phone:", phoneNumber, "Has X?", phoneNumber.includes('X'));
        if (phoneNumber.includes('X')) {
            const newPhone = phoneNumber.replace('X', num);
            console.log("New phone after replace:", newPhone);
            setPhoneNumber(newPhone);
        }
    };

    const handleDelete = () => {
        const lastDigitIndex = phoneNumber.lastIndexOf(/[0-9]/.exec(phoneNumber.split('').reverse().join(''))?.[0] || '');
        if (lastDigitIndex > 3) { // Keep "+91 " format (4 characters)
            setPhoneNumber(prev => {
                const chars = prev.split('');
                for (let i = chars.length - 1; i >= 0; i--) {
                    if (/[0-9]/.test(chars[i]) && i > 3) {
                        chars[i] = 'X';
                        break;
                    }
                }
                return chars.join('');
            });
        }
    };

    const handleSubmit = async () => {
        console.log("=== Mobile Login: handleSubmit called ===");
        console.log("Current phone number:", phoneNumber);
        console.log("Current email:", email);

        setIsLoading(true);
        setError(null);

        try {
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.trim()) {
                setError('Please enter email address');
                setIsLoading(false);
                return;
            }
            if (!emailRegex.test(email.trim())) {
                setError('Please enter a valid email address');
                setIsLoading(false);
                return;
            }

            // Clean phone number and format (remove + and any non-digits)
            let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

            // For this specific API, we want the 10-digit number without the '91' prefix
            // If it's 12 digits and starts with 91, take only the last 10
            if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
                cleanPhone = cleanPhone.substring(2);
            }

            if (cleanPhone.length !== 10) {
                setError('Please enter a valid 10-digit mobile number');
                setIsLoading(false);
                return;
            }

            console.log("Cleaned 10-digit phone for API:", cleanPhone);

            // Send OTP using backend endpoint with both email and mobile
            const sendResult = await MobileAuthService.sendOtp(email.trim(), cleanPhone);
            console.log("OTP Send Result:", sendResult);

            // Check if response indicates success (various possible formats)
            const isSuccess = sendResult && (
                sendResult.success === true ||
                sendResult.success === 'true' ||
                sendResult.data ||
                sendResult.message?.toLowerCase().includes('sent') ||
                sendResult.message?.toLowerCase().includes('success') ||
                !sendResult.error
            );

            if (isSuccess) {
                // Store email and phone number for OTP verification
                localStorage.setItem(STORAGE_KEYS.pendingPhone, cleanPhone);
                localStorage.setItem('pendingEmail', email.trim());

                // If server returned session or id, persist it for later validate call
                try {
                    if (sendResult.data?.sessionId) {
                        localStorage.setItem('otpSessionId', sendResult.data.sessionId);
                    }
                } catch { }

                toast({
                    title: "OTP sent successfully",
                    description: `OTP sent to ${email.trim()}`,
                });

                // Navigate to OTP verification page
                setTimeout(() => router.push('/bz/auth/otp'), 600);
            } else {
                throw new Error(sendResult?.message || 'Failed to send OTP');
            }
        } catch (error: any) {
            console.error("Error sending OTP:", error);

            // Check if this is actually a success despite the error (API inconsistency)
            if (error.response?.status === 200 || error.message?.includes('OTP') || error.message?.includes('sent')) {
                // Treat as success even though it threw
                localStorage.setItem(STORAGE_KEYS.pendingPhone, cleanPhone);
                localStorage.setItem('pendingEmail', email.trim());

                toast({
                    title: "OTP sent successfully",
                    description: `OTP sent to ${email.trim()}`,
                });

                setTimeout(() => router.push('/bz/auth/otp'), 600);
            } else {
                setError(error.message || 'Failed to send OTP. Please try again.');

                toast({
                    title: "Failed to send OTP",
                    description: error.message || 'Please check your number and try again',
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const canSubmit = !phoneNumber.includes('X') && email.trim().length > 0 && !isLoading;

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
                        href="/auth/intro"
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

                {/* White Card Container - Sticks to bottom and takes remaining space */}
                <div className="flex-1 flex flex-col">
                    {/* Logo Area - Now positioned just above the form with increased spacing */}
                    <div className="flex-1 flex flex-col items-center justify-end px-6 pb-8">
                        <ClubVizLogo size="lg" variant="full" />
                    </div>

                    <div className="bg-white rounded-t-3xl w-full px-[1.5rem] pt-[2rem] pb-[2rem] overflow-y-auto flex flex-col">
                        {/* Header */}
                        <div className="mb-[1.5rem]">
                            <h1 className="text-[1.5rem] font-semibold text-[#2C1945] mb-[0.5rem] text-center">Enter Your Details</h1>
                        </div>

                        {/* Email input field */}
                        <div className="mb-[1.5rem]">
                            <label className="block text-[#2C1945] text-[0.9375rem] font-medium mb-[0.5rem]">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full px-[1rem] py-[0.875rem] border-2 border-[#0C898B] rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] placeholder:text-[#999999] focus:outline-none focus:border-[#0A5A5D]"
                            />
                        </div>

                        {/* Phone number display */}
                        <div className="mb-[1.5rem]">
                            <label className="block text-[#2C1945] text-[0.9375rem] font-medium mb-[0.5rem]">
                                Mobile Number
                            </label>
                            <input
                                type="text"
                                value={phoneNumber}
                                readOnly
                                onClick={() => setShowKeypad(true)}
                                className="w-full px-[1rem] py-[0.875rem] border-2 border-[#0C898B] rounded-[3.25rem] bg-[#EFEFEF] text-[#2C1945] font-mono text-center placeholder:text-[#999999] focus:outline-none focus:border-[#0A5A5D] cursor-pointer"
                            />
                        </div>

                        {/* Confirmation text */}
                        <div className="mb-[2rem] text-center">
                            <p className="text-[#2C1945] text-[0.9375rem] font-medium">We will send you a confirmation code</p>
                        </div>

                        {/* Number Keypad */}
                        {showKeypad && (
                            <div className="mx-auto w-[17.5rem] space-y-[1rem] mb-[1.5rem] animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {/* Keypad Grid */}
                                <div className="grid grid-cols-3 gap-[1rem]">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => handleNumberPress(num.toString())}
                                            className="w-[4.375rem] h-[4.375rem] rounded-full border border-[#0C898B] 
                                                 bg-white text-[#42353B] text-[1.875rem] font-semibold
                                                 hover:bg-gray-50 active:bg-gray-100 
                                                 flex items-center justify-center transition-colors"
                                        >
                                            {num}
                                        </button>
                                    ))}

                                    {/* Bottom Row */}
                                    <button
                                        onClick={handleDelete}
                                        className="w-[4.375rem] h-[4.375rem] rounded-full bg-[#EFEFEF] 
                                            text-gray-900 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                        <X className="w-[1.25rem] h-[1.25rem]" />
                                    </button>

                                    <button
                                        onClick={() => handleNumberPress('0')}
                                        className="w-[4.375rem] h-[4.375rem] rounded-full border border-[#0C898B] 
                                            bg-white text-[#42353B] text-[1.875rem] font-semibold
                                            hover:bg-gray-50 active:bg-gray-100
                                            flex items-center justify-center transition-colors"
                                    >
                                        0
                                    </button>

                                    <button
                                        onClick={() => setShowKeypad(false)}
                                        className="w-[4.375rem] h-[4.375rem] rounded-full bg-[#0D7377] 
                                            text-white flex items-center justify-center hover:bg-[#0A5A5D] transition-colors"
                                    >
                                        <span className="text-sm font-bold">DONE</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Get Verification Code Button */}
                        <div className="mb-[1.5rem]">
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="w-full py-[1rem] bg-[#0D7377] text-white rounded-[3.25rem] font-semibold text-[1.125rem] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0A5A5D] transition-colors shadow-lg shadow-[#0D7377]/20"
                            >
                                Get Verification Code
                            </button>
                        </div>

                        {/* reCAPTCHA Container - Visible for user interaction */}
                        <div className="flex justify-center mb-[1.5rem]">
                            <div id="recaptcha-container"></div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="text-center mb-4">
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Display the phone number status somewhere */}
                        <div className="hidden">
                            Current number: {phoneNumber}
                        </div>

                        {/* Login with Password Option */}
                        <div className="text-center py-2">
                            <p className="text-[#6A6A6A] text-[0.875rem] mb-2">
                                Already have an account?
                            </p>
                            <Link
                                href="/auth/login"
                                className="text-[#0D7377] font-semibold text-[0.9375rem] hover:underline"
                            >
                                Login with Password
                            </Link>
                        </div>

                        {/* Sign Up Option */}
                        <div className="text-center py-2">
                            <p className="text-[#6A6A6A] text-[0.875rem] mb-2">
                                Don't have an account?
                            </p>
                            <Link
                                href="/auth/signup"
                                className="text-[#0D7377] font-semibold text-[0.9375rem] hover:underline"
                            >
                                Sign Up
                            </Link>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-center py-2">
                            <AuthLink
                                href="/auth/forgot-password"
                                className="text-[#0095FF] font-medium text-[14px] underline"
                            >
                                Forgot Password?
                            </AuthLink>
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



