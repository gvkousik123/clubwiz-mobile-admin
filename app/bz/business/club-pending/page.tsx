'use client';

import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { useEffect } from 'react';
import { ProfileService } from '@/lib/services/profile.service';

export default function ClubPendingPage() {
    const router = useRouter();

    useEffect(() => {
        // Check if user has club status
        const clubStatus = ProfileService.getClubStatus();

        // If no club added, redirect to new-club
        if (!clubStatus.hasClub) {
            router.replace('/bz/business/new-club');
            return;
        }

        // If club is active, redirect to business dashboard
        if (clubStatus.isActive) {
            router.replace('/business');
            return;
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center p-6">
            <div className="relative z-10 max-w-2xl w-full">
                {/* Card */}
                <div className="p-8 md:p-12">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-[#FFA500] to-[#FF8C00] rounded-full flex items-center justify-center">
                                <Clock className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#14FFEC] rounded-full flex items-center justify-center border-4 border-[#0D1F1F]">
                                <AlertCircle className="w-6 h-6 text-[#021313]" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                        Club Under Review
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-white/80 text-center mb-8 leading-relaxed">
                        Your club has been submitted and is currently under approval by the Clubwiz team.
                        We&apos;ll notify you once your club is approved and ready to go live!
                    </p>

                    {/* Status Steps */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4 p-4 bg-[#021313] rounded-xl">
                            <div className="flex-shrink-0 mt-1">
                                <CheckCircle2 className="w-6 h-6 text-[#14FFEC]" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1">Club Submitted</h3>
                                <p className="text-white/70 text-sm">Your club information has been received successfully</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-[#021313] rounded-xl">
                            <div className="flex-shrink-0 mt-1">
                                <Clock className="w-6 h-6 text-[#FFA500] animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1">Under Review</h3>
                                <p className="text-white/70 text-sm">Clubwiz team is reviewing your club details</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-[#021313] rounded-xl opacity-50">
                            <div className="flex-shrink-0 mt-1">
                                <CheckCircle2 className="w-6 h-6 text-white/50" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-1">Approval & Activation</h3>
                                <p className="text-white/70 text-sm">Your club will be activated and you can start managing it</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-[#0C898B]/20 rounded-xl p-4 mb-8">
                        <p className="text-[#14FFEC] text-sm text-center flex items-center justify-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            <strong>Typical review time:</strong> 24-48 hours
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
