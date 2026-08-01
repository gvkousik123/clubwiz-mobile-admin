'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Ticket, Users, Calendar, Clock, RefreshCcw } from 'lucide-react';
import { TicketService, ScannedTicketSummary } from '@/lib/services/ticket.service';
import { getClubId } from '@/lib/utils/get-club-id';
import { toast } from 'sonner';

function ScannedTicketsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [clubId, setClubId] = useState<string | null>(null);
    const [tickets, setTickets] = useState<ScannedTicketSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const cid = getClubId(searchParams);
        if (!cid) {
            toast.error('No club ID is configured. Please go back and try again.');
            router.replace('/bz/business');
            return;
        }
        setClubId(cid);
    }, [searchParams, router]);

    useEffect(() => {
        if (!clubId) return;
        loadScannedTickets();
    }, [clubId]);

    const loadScannedTickets = async () => {
        if (!clubId) return;
        setIsLoading(true);
        setError(null);

        try {
            const response = await TicketService.listScannedTickets(clubId);
            if (response.success) {
                setTickets(response.data || []);
            } else {
                const message = response.message || 'Failed to load scanned tickets';
                setError(message);
                toast.error(message);
            }
        } catch (err: any) {
            const message = err?.message || 'Failed to load scanned tickets';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px]">
                <div className="px-6 pt-10 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/bz/business')}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">Scanned Tickets</h1>
                    <button
                        onClick={loadScannedTickets}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="px-6 relative mt-[100px] z-40">
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col min-h-[calc(100vh-100px)] p-6">
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div>
                            <p className="text-sm text-white/60">Club ID</p>
                            <p className="font-bold text-white">{clubId || 'Unknown'}</p>
                        </div>
                        <div className="rounded-2xl bg-[#0D1F1F]/80 px-4 py-3 border border-[#14FFEC]/10">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Scanned</p>
                            <p className="text-2xl font-black text-[#14FFEC]">{tickets.length}</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-[#14FFEC] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-white/60">Loading scanned tickets...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl bg-[#0D1F1F] border border-red-500/20 p-6 text-center">
                            <p className="text-red-400 font-bold mb-2">Unable to load scanned tickets</p>
                            <p className="text-white/70 mb-4">{error}</p>
                            <button
                                onClick={loadScannedTickets}
                                className="bg-[#14FFEC] text-black font-bold px-5 py-3 rounded-2xl"
                            >
                                Retry
                            </button>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="rounded-3xl bg-[#0D1F1F] border border-white/10 p-10 text-center">
                            <Ticket className="w-16 h-16 text-[#14FFEC] mx-auto mb-4" />
                            <p className="text-white/60 mb-2">No scanned tickets found yet.</p>
                            <p className="text-white/40 text-sm">Scan tickets from the entry scanner to populate this list.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <button
                                    key={ticket.ticketId}
                                    onClick={() => router.push(`/bz/business/ticket-details/${ticket.ticketNumber}`)}
                                    className="w-full text-left bg-[#0D1F1F]/80 border border-white/10 rounded-[28px] p-5 transition-all hover:border-[#14FFEC]/30 hover:bg-[#122626]"
                                >
                                    <div className="flex items-center justify-between gap-4 mb-3">
                                        <div>
                                            <p className="text-white font-bold text-lg">{ticket.ticketNumber}</p>
                                            <p className="text-white/60 text-sm">{ticket.fullName || ticket.userEmail}</p>
                                        </div>
                                        <div className="rounded-full bg-[#14FFEC]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#14FFEC]">
                                            {ticket.arrivalStatus}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
                                        <div>
                                            <p className="uppercase text-[10px] tracking-[0.2em] mb-1">Event</p>
                                            <p>{ticket.eventTitle || 'No event'}</p>
                                        </div>
                                        <div>
                                            <p className="uppercase text-[10px] tracking-[0.2em] mb-1">Amount</p>
                                            <p>₹{ticket.totalAmount}</p>
                                        </div>
                                        <div>
                                            <p className="uppercase text-[10px] tracking-[0.2em] mb-1">Validated</p>
                                            <p>{new Date(ticket.validatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                        <div>
                                            <p className="uppercase text-[10px] tracking-[0.2em] mb-1">By</p>
                                            <p>{ticket.validatedBy || 'Unknown'}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ScannedTicketsLoadingFallback() {
    return (
        <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#14FFEC] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/60">Loading...</p>
            </div>
        </div>
    );
}

export default function ScannedTicketsPage() {
    return (
        <Suspense fallback={<ScannedTicketsLoadingFallback />}>
            <ScannedTicketsContent />
        </Suspense>
    );
}
