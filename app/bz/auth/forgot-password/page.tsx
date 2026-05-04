'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Smartphone, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { ClubVizLogo } from '@/components/auth/logo';
import { usePassword } from '@/hooks/use-password';

type Step = 'initiate' | 'reset' | 'success';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const {
        isLoading,
        isInitiatingReset,
        isResettingPassword,
        initiatePasswordReset,
        resetPasswordWithMobile,
        validatePassword,
        getPasswordStrength,
        getPasswordStrengthColor,
        getContactType,
    } = usePassword();

    // State
    const [step, setStep] = useState<Step>('initiate');
    const [contact, setContact] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handle back navigation
    const handleGoBack = () => {
        if (step === 'initiate') {
            router.back();
        } else if (step === 'reset') {
            setStep('initiate');
        } else {
            router.push('/bz/auth/intro');
        }
    };

    // Handle password reset initiation
    const handleInitiate = async (e: React.FormEvent) => {
        e.preventDefault();

        const success = await initiatePasswordReset(contact);
        if (success) {
            const contactType = getContactType(contact);
            if (contactType === 'mobile') {
                setMobileNumber(contact);
                setStep('reset');
            } else {
                setStep('success');
            }
        }
    };

    // Handle password reset
    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return;
        }

        const success = await resetPasswordWithMobile(mobileNumber, newPassword);
        if (success) {
            setStep('success');
        }
    };

    // Password validation
    const passwordValidation = validatePassword(newPassword);
    const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;
    const strengthColor = passwordStrength ? getPasswordStrengthColor(passwordStrength) : '';

    return (
        <div className="min-h-screen bg-[#021313] text-white flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <button
                    onClick={handleGoBack}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <ClubVizLogo />
                <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-8">
                {step === 'initiate' && (
                    <div className="space-y-8">
                        <div className="text-center space-y-4">
                            <h1 className="text-2xl font-bold">Forgot Password?</h1>
                            <p className="text-gray-400">
                                Enter your email or mobile number and we'll help you reset your password
                            </p>
                        </div>

                        <form onSubmit={handleInitiate} className="space-y-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        {getContactType(contact) === 'email' ? (
                                            <Mail className="w-5 h-5 text-[#14FFEC]" />
                                        ) : (
                                            <Smartphone className="w-5 h-5 text-[#14FFEC]" />
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Email or Mobile Number"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-[#0D1F1F] border border-[#14FFEC]/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#14FFEC]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isInitiatingReset || !contact.trim()}
                                className="w-full bg-[#14FFEC] text-black font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isInitiatingReset ? 'Sending...' : 'Send Reset Instructions'}
                            </button>
                        </form>

                        <div className="text-center">
                            <button
                                onClick={() => router.push('/bz/auth/intro')}
                                className="text-[#14FFEC] text-sm"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                )}

                {step === 'reset' && (
                    <div className="space-y-8">
                        <div className="text-center space-y-4">
                            <h1 className="text-2xl font-bold">Reset Password</h1>
                            <p className="text-gray-400">
                                Enter your new password for {mobileNumber}
                            </p>
                        </div>

                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-4">
                                {/* New Password */}
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-4 bg-[#0D1F1F] border border-[#14FFEC]/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#14FFEC] pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {newPassword && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Password Strength</span>
                                            <span className={`font-semibold ${strengthColor}`}>
                                                {passwordStrength?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength === 'weak'
                                                    ? 'bg-red-500 w-1/3'
                                                    : passwordStrength === 'medium'
                                                        ? 'bg-yellow-500 w-2/3'
                                                        : 'bg-green-500 w-full'
                                                    }`}
                                            />
                                        </div>
                                        {!passwordValidation.isValid && (
                                            <div className="text-red-400 text-xs space-y-1">
                                                {passwordValidation.errors.map((error, index) => (
                                                    <div key={index}>• {error}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Confirm Password */}
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-4 bg-[#0D1F1F] border border-[#14FFEC]/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#14FFEC] pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>

                                {/* Password Match Indicator */}
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <div className="text-red-400 text-sm">
                                        Passwords do not match
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    isResettingPassword ||
                                    !newPassword ||
                                    !confirmPassword ||
                                    newPassword !== confirmPassword ||
                                    !passwordValidation.isValid
                                }
                                className="w-full bg-[#14FFEC] text-black font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'success' && (
                    <div className="space-y-8 text-center">
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-bold">Password Reset Successful!</h1>
                            <p className="text-gray-400">
                                Your password has been reset successfully. You can now login with your new password.
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/bz/auth/intro')}
                            className="w-full bg-[#14FFEC] text-black font-bold py-4 rounded-2xl"
                        >
                            Continue to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}