'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Ticket, User, Mail, Phone, Calendar, Clock, CheckCircle2, XCircle, Download } from 'lucide-react';
import { TicketService, TicketResponse } from '@/lib/services/ticket.service';
import { toast } from 'sonner';
import Image from 'next/image';

export default function TicketLookupPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const formatDateTime = (value?: string) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    const handleLookup = async (event: React.FormEvent) => {
        event.preventDefault();
        const bookingId = searchQuery.trim().toUpperCase();
        if (!bookingId) {
            setError('Please enter a booking ID or ticket number.');
            return;
        }

        setError(null);
        setTicket(null);
        setIsLoading(true);

        try {
            const response = await TicketService.lookupTicket(bookingId);
            if (response.success && response.data) {
                setTicket(response.data);
            } else {
                const message = response.message || 'Ticket lookup failed.';
                setError(message);
                toast.error(message);
            }
        } catch (err: any) {
            const message = err?.message || 'Ticket lookup failed.';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!ticket) return;
        setIsDownloading(true);
        try {
            await TicketService.downloadTicket(ticket.ticketNumber || ticket.ticketId!);
            toast.success('Ticket PDF download has started.');
        } catch (err: any) {
            toast.error(err?.message || 'Could not download ticket PDF.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px]">
                <div className="px-6 pt-10 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/bz/business/scan-tickets')}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">Ticket Lookup</h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="px-6 relative mt-[100px] z-40">
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col min-h-[calc(100vh-100px)] p-6">
                    <div className="mb-6 space-y-4">
                        <form onSubmit={handleLookup} className="grid gap-4">
                            <label className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Booking ID</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                                    placeholder="BQ-AB68CE"
                                    className="flex-1 rounded-2xl border border-white/10 bg-[#0D1F1F] px-4 py-4 text-white outline-none focus:border-[#14FFEC]/50 focus:bg-[#122626]"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="rounded-2xl bg-gradient-to-r from-[#14FFEC] to-[#00867D] px-6 py-4 font-black text-[#031313] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] disabled:opacity-60"
                                >
                                    {isLoading ? 'Searching...' : 'Lookup'}
                                </button>
                            </div>
                        </form>

                        {error && (
                            <div className="rounded-3xl bg-[#0D1F1F] border border-red-500/20 p-4 text-sm text-red-300">
                                {error}
                            </div>
                        )}
                    </div>

                    {ticket ? (
                        <div className="space-y-4">
                            <div className="bg-[#0D1F1F]/80 rounded-[28px] border border-white/10 p-5">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Ticket Number</p>
                                        <p className="text-2xl font-black text-white">{ticket.ticketNumber}</p>
                                    </div>
                                    <div className="rounded-full bg-[#14FFEC]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#14FFEC]">
                                        {ticket.isValidated ? 'Already Scanned' : ticket.status || 'Unknown' }
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
                                    <div>
                                        <p className="text-white/40">Name</p>
                                        <p className="text-white font-medium">{ticket.userName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40">Email</p>
                                        <p className="text-white font-medium">{ticket.userEmail || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40">Phone</p>
                                        <p className="text-white font-medium">{ticket.userPhone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40">Booking Date</p>
                                        <p className="text-white font-medium">{ticket.bookingDate || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {ticket.qrCode && (
                                <div className="bg-[#0D1F1F]/80 rounded-[28px] border border-white/10 p-5 text-center">
                                    <p className="text-white/40 mb-3">QR Code</p>
                                    <div className="mx-auto w-fit rounded-3xl bg-white p-4">
                                        <Image
                                            src={ticket.qrCode.startsWith('data:') ? ticket.qrCode : `data:image/png;base64,${ticket.qrCode}`}
                                            alt="Ticket QR Code"
                                            width={220}
                                            height={220}
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0D1F1F]/80 rounded-[28px] border border-white/10 p-5">
                                    <p className="text-white/40 mb-3">Event</p>
                                    <p className="text-white font-medium">{ticket.eventTitle || 'No event'}</p>
                                </div>
                                <div className="bg-[#0D1F1F]/80 rounded-[28px] border border-white/10 p-5">
                                    <p className="text-white/40 mb-3">Amount</p>
                                    <p className="text-white font-medium">₹{ticket.totalAmount ?? '0'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0D1F1F]/80 rounded-[28px] border border-white/10 p-5">
                                    <p className="text-white/40 mb-3">Validated At</p>
                                    <p className="text-white font-medium">{formatDateTime(ticket.validatedAt)}</p>
                                </div>
                                <div className="bg-[#0D1F1F]/80 rounded-[28px] border border-white/10 p-5">
                                    <p className="text-white/40 mb-3">Validated By</p>
                                    <p className="text-white font-medium">{ticket.validatedBy || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {ticket.paymentStatus === 'SUCCESS' && (
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className="w-full bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black uppercase tracking-[0.2em] rounded-2xl py-4 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isDownloading ? (
                                            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                Download PDF
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={() => router.push('/bz/business/scan-tickets')}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 hover:bg-white/10 transition-all"
                                >
                                    Back to Scanner
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-[28px] border border-white/10 bg-[#0D1F1F]/80 p-8 text-center">
                            <Search className="w-14 h-14 text-[#14FFEC] mx-auto mb-4" />
                            <p className="text-white/60">Enter a booking ID or ticket number to view details without scanning.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
