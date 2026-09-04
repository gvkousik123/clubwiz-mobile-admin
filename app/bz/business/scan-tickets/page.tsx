'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, QrCode, ListChecks, Search, Ticket, RefreshCcw } from 'lucide-react';
import { QRScanner } from '@/components/qr-scanner/qr-scanner';
import { TicketService, ScannedTicketSummary } from '@/lib/services/ticket.service';
import { getClubId } from '@/lib/utils/get-club-id';

function ScanTicketsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showScanner, setShowScanner] = useState(false);
    const [clubId, setClubId] = useState<string | null>(null);
    const [tickets, setTickets] = useState<ScannedTicketSummary[]>([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [ticketError, setTicketError] = useState<string | null>(null);

    const handleScanSuccess = (bookingId: string, data: any) => {
        setTicketError(null);
        setShowScanner(false);
        router.push(`/bz/business/ticket-details/_?id=${bookingId}`);
    };

    const handleScanError = (error: string) => {
        setTicketError(error);
    };

    const loadScannedTickets = async () => {
        if (!clubId) return;

        setIsLoadingTickets(true);
        setTicketError(null);

        try {
            const response = await TicketService.listScannedTickets(clubId);
            if (response.success ?? true) {
                setTickets(response.data || []);
            } else {
                setTicketError(response.message || 'Failed to load scanned tickets');
            }
        } catch (error: any) {
            setTicketError(error?.message || 'Failed to load scanned tickets');
        } finally {
            setIsLoadingTickets(false);
        }
    };

    useEffect(() => {
        const cid = getClubId(searchParams);
        setClubId(cid);
    }, [searchParams]);

    useEffect(() => {
        if (clubId) {
            loadScannedTickets();
        }
    }, [clubId]);

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            {/* Fixed Header */}
            <div className="fixed top-0 app-bar z-30 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px]">
                <div className="px-6 pt-10 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/bz/business')}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">Scan Tickets</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-0 relative mt-[100px] z-40">
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col min-h-[calc(100vh-100px)] p-6">
                    
                    {/* Scan Button */}
                    <div className="space-y-4 mb-8">
                        <button
                            onClick={() => setShowScanner(true)}
                            className="w-full bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-6 shadow-[0_0_20px_rgba(20,255,236,0.2)] hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
                        >
                            <QrCode size={24} />
                            Start Scanning
                        </button>
                        <button
                            onClick={() => router.push('/bz/business/ticket-lookup')}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 flex items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer"
                        >
                            <Search className="w-5 h-5 text-[#14FFEC]" />
                            Lookup Ticket
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div>
                            <p className="text-sm text-white/60">Club ID</p>
                            <p className="font-bold text-white">{clubId || 'Unknown'}</p>
                        </div>
                        <button
                            onClick={loadScannedTickets}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition-all"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isLoadingTickets ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-[#14FFEC] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-white/60">Loading scanned tickets...</p>
                                </div>
                            </div>
                        ) : ticketError ? (
                            <div className="rounded-3xl bg-[#0D1F1F] border border-red-500/20 p-6 text-center">
                                <p className="text-red-400 font-bold mb-2">Unable to load scanned tickets</p>
                                <p className="text-white/70 mb-4">{ticketError}</p>
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
                                <p className="text-white/60 mb-2">No scanned tickets yet.</p>
                                <p className="text-white/40 text-sm">Scan a ticket to see it listed here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {tickets.map((ticket) => (
                                    <button
                                        key={ticket.ticketId}
                                        onClick={() => router.push(`/bz/business/ticket-details/_?id=${ticket.ticketNumber}`)}
                                        className="w-full text-left bg-[#0D1F1F]/80 border border-white/10 rounded-3xl p-5 transition-all hover:border-[#14FFEC]/30 hover:bg-[#122626] cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div>
                                                <p className="text-sm text-white/60">Booking ID</p>
                                                <p className="text-lg font-bold text-white">{ticket.ticketNumber}</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${ticket.isValidated || ticket.arrivalStatus?.toUpperCase() === 'USED' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-300/20' : 'bg-[#14FFEC]/10 text-[#14FFEC]'}`}>
                                                {ticket.isValidated || ticket.arrivalStatus?.toUpperCase() === 'USED' ? 'SCANNED' : ticket.arrivalStatus || 'ACTIVE'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Name</p>
                                                <p>{ticket.fullName || ticket.userEmail || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Amount</p>
                                                <p>₹{ticket.totalAmount?.toFixed?.(2) ?? ticket.totalAmount}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Validated</p>
                                                <p>{ticket.validatedAt ? new Date(ticket.validatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not yet'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Event</p>
                                                <p>{ticket.eventTitle || 'No event'}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScanner
                    onClose={() => setShowScanner(false)}
                    onScanSuccess={handleScanSuccess}
                    onScanError={handleScanError}
                />
            )}
        </div>
    );
}

function ScanTicketsLoadingFallback() {
    return (
        <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#14FFEC] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/60">Loading...</p>
            </div>
        </div>
    );
}

export default function ScanTicketsPage() {
    return (
        <Suspense fallback={<ScanTicketsLoadingFallback />}>
            <ScanTicketsContent />
        </Suspense>
    );
}
