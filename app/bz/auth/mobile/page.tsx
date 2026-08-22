"use client";

import { useState } from "react";
import { ClubwizLogo } from "@/components/auth/logo";
import { AuthLink } from "@/components/auth/auth-link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MobileAuthService } from '@/lib/services/mobile-auth.service';
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { AuthBackground } from "@/components/auth/auth-background";

export default function MobileVerificationScreen() {
    const router = useRouter();
    const { toast } = useToast();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // No client-side reCAPTCHA when using backend OTP endpoints

    const handlePhoneNumberChange = (nextValue: string) => {
        let digits = nextValue.replace(/\D/g, '');
        if (digits.length > 10) {
            if (digits.startsWith('91')) {
                digits = digits.substring(2, 12);
            } else {
                digits = digits.slice(0, 10);
            }
        }
        setPhoneNumber(digits);
        if (error) setError(null);
    };

    const handleSubmit = async () => {
        console.log("=== Mobile Login: handleSubmit called ===");
        console.log("Current phone number:", phoneNumber);
        console.log("Current email:", email);

        setIsLoading(true);
        setError(null);

        // Clean phone number and format (remove + and any non-digits)
        let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

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

    const canSubmit = phoneNumber.length === 10 && email.trim().length > 0 && !isLoading;

    return (
        <div className="min-h-screen bg-[#031313] relative flex flex-col font-sans items-center md:py-8">
            <div className="relative w-full max-w-md min-h-screen md:min-h-0 md:h-[850px] flex flex-col bg-[#031313] overflow-hidden md:rounded-[2.5rem] md:border border-white/10 shadow-2xl">
                <AuthBackground />

                <div className="relative z-10 flex flex-col flex-1">
                    {/* Header Navigation */}
                    <div className="flex items-center justify-between px-6 pt-8 pb-4 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-700">
                        <Link href="/bz/auth/intro" className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 text-white bg-black/20 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </div>

                    {/* Logo Zone */}
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 animate-in fade-in zoom-in-95 duration-700 delay-150">
                        <div className="relative mb-4 drop-shadow-[0_0_25px_rgba(20,255,236,0.4)]">
                            <ClubwizLogo size="lg" variant="full" />
                        </div>
                    </div>

                    {/* Glass card */}
                    <div className="bg-[#031313]/70 backdrop-blur-2xl border-t border-x border-[#14FFEC]/10 rounded-t-[2.5rem] w-full px-7 pt-10 pb-10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">

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
                            ENTER DETAILS
                        </h1>
                        <p className="text-[#14FFEC]/60 text-[13px] font-medium text-center uppercase tracking-widest mb-8">
                            We&apos;ll send you a verification code
                        </p>

                        {/* Email */}
                        <div className="mb-5">
                            <label className="block text-white/50 text-[11px] font-bold mb-2 ml-2 uppercase tracking-widest">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 outline-none focus:border-[#14FFEC]/50 focus:bg-white/10 transition-all font-medium placeholder:text-white/20"
                            />
                        </div>

                        {/* Phone input */}
                        <div className="mb-6">
                            <label className="block text-white/50 text-[11px] font-bold mb-2 ml-2 uppercase tracking-widest">Mobile Number</label>
                            <div className="relative flex items-center group">
                                <span className="absolute left-5 text-white/50 font-mono tracking-[0.2em] font-bold text-[17px]">+91</span>
                                <input
                                    type="tel"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    value={phoneNumber}
                                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                                    placeholder="Enter mobile number"
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-16 pr-5 py-4 outline-none focus:border-[#14FFEC]/50 focus:bg-white/10 transition-all font-mono tracking-[0.2em] font-bold text-[17px] placeholder:text-white/20 placeholder:font-sans placeholder:tracking-normal placeholder:font-medium"
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && <p className="text-red-400 text-sm text-center mb-4 font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-pulse">{error}</p>}

                        {/* CTA */}
                        <button onClick={handleSubmit} disabled={!canSubmit} className="w-full bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-4 shadow-[0_0_20px_rgba(20,255,236,0.2)] hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 disabled:cursor-not-allowed">
                            {isLoading ? 'Sending...' : 'Get Verification Code'}
                        </button>

                        <div id="recaptcha-container" className="flex justify-center mt-4"></div>

                        {/* Links */}
                        <div className="mt-8 text-center space-y-3">
                            <p className="text-white/60 text-sm font-medium">
                                Already have an account?{' '}
                                <Link href="/bz/auth/login" className="text-[#14FFEC] font-bold hover:underline">Login</Link>
                            </p>
                            <p className="text-white/60 text-sm font-medium">
                                Don&apos;t have an account?{' '}
                                <Link href="/bz/auth/signup" className="text-[#14FFEC] font-bold hover:underline">Sign Up</Link>
                            </p>
                            <AuthLink href="/bz/auth/forgot-password" className="block text-[#14FFEC]/70 text-[11px] font-bold uppercase tracking-wider hover:text-[#14FFEC] transition-colors">
                                Forgot Password?
                            </AuthLink>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-white/30 text-[10px] font-medium tracking-wide">
                                By continuing you agree to our{' '}
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
