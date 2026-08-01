'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, XCircle, Users, Calendar, Clock, MapPin, User, Ticket, Download } from 'lucide-react';
import { TicketScanService } from '@/lib/services/ticket-scan.service';
import { TicketService } from '@/lib/services/ticket.service';
import { formatDateToDDMMYYYY } from '@/lib/date-utils';
import { toast } from 'sonner';



interface TicketDetails {
    bookingId: string;
    eventTitle: string;
    clubName: string;
    userName: string;
    userEmail?: string;
    userPhone?: string;
    customerName?: string;
    customerPhone?: string;
    arrivalTime: string;
    eventStartDateTime: string;
    eventEndDateTime?: string;
    maleCount?: number;
    femaleCount?: number;
    coupleCount?: number;
    totalAmount: number;
    status: string;
    qrCode?: string;
    eventLogo?: string;
    ticketId: string;
    isValidated: boolean;
    paymentStatus: string;
    validatedAt?: string;
    validatedBy?: string;
}

export default function TicketDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const bookingId = params.bookingId as string;
    
    const [loading, setLoading] = useState(true);
    const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
    const [scanStatus, setScanStatus] = useState<'success' | 'error' | null>(null);
    const [scanMessage, setScanMessage] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (bookingId) {
            fetchTicketDetails();
        }
    }, [bookingId]);

    const handleConfirmEntry = async () => {
        if (!ticketDetails) return;
        setIsConfirming(true);
        
        // Note: Retrieve actual staff/admin ID from your auth context if needed
        const staffId = "Business/Staff"; 
        
        const result = await TicketScanService.confirmTicketEntry(ticketDetails.ticketId, staffId);
        
        if (result.success) {
            toast.success('Ticket marked as arrived!');
            // Reload the ticket to get the updated status (isValidated: true, status: USED)
            fetchTicketDetails();
        } else {
            toast.error(result.message || 'Validation Failed');
        }
        setIsConfirming(false);
    };

    const normalizeTicketDetails = (ticket: any): TicketDetails => {
        return {
            bookingId: ticket.bookingId || ticket.ticketNumber || '',
            eventTitle: ticket.eventTitle || ticket.eventName || '',
            clubName: ticket.clubName || ticket.venueName || '',
            userName: ticket.userName || ticket.customerName || ticket.name || 'Unknown',
            userEmail: ticket.userEmail || ticket.email || undefined,
            userPhone: ticket.userPhone || ticket.customerPhone || ticket.phone || undefined,
            customerName: ticket.customerName || ticket.userName || ticket.name || 'Unknown',
            customerPhone: ticket.customerPhone || ticket.userPhone || ticket.phone || undefined,
            arrivalTime: ticket.arrivalTime || '',
            eventStartDateTime: ticket.eventStartDateTime || ticket.eventDateTime || '',
            eventEndDateTime: ticket.eventEndDateTime || undefined,
            maleCount: ticket.maleStagEntry ?? ticket.maleCount ?? 0,
            femaleCount: ticket.femaleStagEntry ?? ticket.femaleCount ?? 0,
            coupleCount: ticket.coupleEntry ?? ticket.coupleCount ?? 0,
            totalAmount: ticket.totalAmount ?? ticket.entryFee ?? 0,
            status: ticket.status || '',
            qrCode: ticket.qrCode || undefined,
            eventLogo: ticket.venueLogo || ticket.eventLogo || undefined,
            ticketId: ticket.ticketId || ticket.id || '',
            isValidated: ticket.isValidated ?? false,
            paymentStatus: ticket.paymentStatus || '',
            validatedAt: ticket.validatedAt || undefined,
            validatedBy: ticket.validatedBy || undefined,
        };
    };

    const getCustomerName = (ticket: TicketDetails) => ticket.userName || ticket.customerName || 'Unknown';

    const fetchTicketDetails = async () => {
        try {
            setLoading(true);
            const response = await TicketScanService.scanTicket(bookingId);
            
            if (response.success && response.data) {
                setTicketDetails(normalizeTicketDetails(response.data));
                setScanStatus('success');
                setScanMessage(response.message || 'Ticket validated successfully!');
            } else {
                setScanStatus('error');
                setScanMessage(response.message || 'Failed to validate ticket');
                toast.error(response.message || 'Failed to validate ticket');
            }
        } catch (error: any) {
            console.error('Error fetching ticket details:', error);
            setScanStatus('error');
            setScanMessage(error.message || 'Failed to load ticket details');
            toast.error('Failed to load ticket details');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!ticketDetails) return;

        setIsDownloading(true);
        try {
            await TicketService.downloadTicket(ticketDetails.bookingId || ticketDetails.ticketId);
            toast.success('PDF download started');
        } catch (error: any) {
            console.error('Error downloading PDF:', error);
            toast.error(error?.message || 'Failed to download ticket PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <div className="relative w-32 h-32">
                    <Image
                        src="/logo/clubwizlogo.png"
                        alt="ClubWiz Logo"
                        width={128}
                        height={128}
                        className="animate-pulse"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] text-white relative flex justify-center items-center md:py-8">
            <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[850px] relative overflow-hidden md:rounded-[2.5rem] md:border border-white/10 shadow-2xl bg-[#021313] flex flex-col font-manrope">
                {/* Header */}
                <div className="relative h-[160px] w-full overflow-hidden md:rounded-t-[2.5rem]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#11B9AB]/20 to-[#021313] z-0" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#11B9AB33,transparent_70%)]" />
                    
                    <div className="relative z-10 px-6 pt-8 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <button 
                                onClick={() => router.push('/bz/business/scan-tickets')}
                                className="group w-11 h-11 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 transition-all duration-300 cursor-pointer"
                            >
                                <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                            <h1 className="font-['Anton_SC'] text-xl tracking-[0.2em] text-white/90">
                                <span className="text-[#14FFEC]">T</span>ICKET <span className="text-[#14FFEC]">D</span>ETAILS
                            </h1>
                            <div className="w-11" />
                        </div>

                        <div className="mt-auto pb-0 text-center">
                            {scanStatus === 'success' ? (
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircle2 className="w-16 h-16 text-emerald-300 animate-pulse" />
                                    <p className="text-emerald-100 text-sm font-bold leading-6 text-center max-w-[24rem] whitespace-pre-wrap break-words">
                                        {scanMessage || 'Ticket validated successfully!'}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <XCircle className="w-16 h-16 text-red-400" />
                                    <p className="text-red-400 text-sm font-bold text-center max-w-[24rem] whitespace-pre-wrap break-words">
                                        {scanMessage || 'Validation failed'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6">
                    {ticketDetails && scanStatus === 'success' ? (
                        <div className="space-y-4">
                            {scanMessage ? (
                                <div className="bg-[#0C1C1C] rounded-[20px] p-4 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
                                    <p className="text-sm text-white/80 text-center whitespace-pre-wrap break-words">
                                        {scanMessage}
                                    </p>
                                </div>
                            ) : null}
                            {/* Event Info Card */}
                            <div className="bg-[#0C1C1C] rounded-[20px] p-5 border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                <div className="flex items-center gap-4 mb-4">
                                    {ticketDetails.eventLogo && (
                                        <div className="w-16 h-16 rounded-xl overflow-hidden">
                                            <Image
                                                src={ticketDetails.eventLogo}
                                                alt={ticketDetails.eventTitle}
                                                width={64}
                                                height={64}
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h2 className="text-lg font-black text-white mb-1">{ticketDetails.eventTitle}</h2>
                                        <p className="text-sm text-white/60 flex items-center gap-1">
                                            <MapPin size={14} />
                                            {ticketDetails.clubName}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] font-black text-[#14FFEC]/80 uppercase tracking-[0.15em] mb-1">Date</p>
                                        <p className="text-sm font-bold text-white flex items-center gap-1">
                                            <Calendar size={14} />
                                            {formatDateToDDMMYYYY(ticketDetails.eventStartDateTime)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#14FFEC]/80 uppercase tracking-[0.15em] mb-1">Time</p>
                                        <p className="text-sm font-bold text-white flex items-center gap-1">
                                            <Clock size={14} />
                                            {ticketDetails.arrivalTime?.split(' - ')[0] || ticketDetails.arrivalTime}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info Card */}
                            <div className="bg-[#0C1C1C] rounded-[20px] p-5 border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                <h3 className="text-[10px] font-black text-[#14FFEC]/80 uppercase tracking-[0.2em] mb-3">Customer Details</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <User size={18} className="text-[#14FFEC]" />
                                        <div>
                                            <p className="text-xs text-white/40">Name</p>
                                            <p className="text-sm font-bold text-white">{getCustomerName(ticketDetails)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Ticket size={18} className="text-[#14FFEC]" />
                                        <div>
                                            <p className="text-xs text-white/40">Booking ID</p>
                                            <p className="text-sm font-mono font-bold text-white">{ticketDetails.bookingId}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Entry Details Card */}
                            {(ticketDetails.maleCount || ticketDetails.femaleCount || ticketDetails.coupleCount) && (
                                <div className="bg-[#0C1C1C] rounded-[20px] p-5 border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                    <h3 className="text-[10px] font-black text-[#14FFEC]/80 uppercase tracking-[0.2em] mb-3">Entry Breakdown</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {ticketDetails.maleCount !== undefined && (
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] mb-1">Male</p>
                                                <p className="text-2xl font-black text-white">{ticketDetails.maleCount}</p>
                                            </div>
                                        )}
                                        {ticketDetails.femaleCount !== undefined && (
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] mb-1">Female</p>
                                                <p className="text-2xl font-black text-white">{ticketDetails.femaleCount}</p>
                                            </div>
                                        )}
                                        {ticketDetails.coupleCount !== undefined && (
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] mb-1">Couple</p>
                                                <p className="text-2xl font-black text-white">{ticketDetails.coupleCount}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Info Card */}
                            <div className="bg-[#0C1C1C] rounded-[20px] p-5 border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                <h3 className="text-[10px] font-black text-[#14FFEC]/80 uppercase tracking-[0.2em] mb-3">Payment</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60 text-sm">Total Amount</span>
                                    <span className="text-2xl font-black text-[#14FFEC]">₹{ticketDetails.totalAmount}</span>
                                </div>
                            </div>

                            {ticketDetails.isValidated && (ticketDetails.validatedAt || ticketDetails.validatedBy) && (
                                <div className="bg-emerald-500/10 rounded-[20px] p-5 border border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.1)]">
                                    <h3 className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-3">Scanned</h3>
                                    <div className="space-y-2 text-sm text-white/80">
                                        {ticketDetails.validatedAt && (
                                            <div className="flex justify-between gap-4">
                                                <span>Validated At</span>
                                                <span>{new Date(ticketDetails.validatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                            </div>
                                        )}
                                        {ticketDetails.validatedBy && (
                                            <div className="flex justify-between gap-4">
                                                <span>Validated By</span>
                                                <span>{ticketDetails.validatedBy}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* QR Code */}
                            {ticketDetails.qrCode && (
                                <div className="bg-[#0C1C1C] rounded-[20px] p-5 border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center">
                                    <h3 className="text-[10px] font-black text-[#14FFEC]/80 uppercase tracking-[0.2em] mb-4">QR Code</h3>
                                    <div className="p-4 bg-white rounded-2xl">
                                        <Image
                                            src={ticketDetails.qrCode.startsWith('data:') ? ticketDetails.qrCode : `data:image/png;base64,${ticketDetails.qrCode}`}
                                            alt="Ticket QR Code"
                                            width={200}
                                            height={200}
                                        />
                                    </div>
                                </div>
                            )}
                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 mt-4">
                                {ticketDetails.status === 'ACTIVE' && (ticketDetails.paymentStatus === 'SUCCESS' || ticketDetails.paymentStatus === 'PENDING') && !ticketDetails.isValidated && (
                                    <>
                                        {ticketDetails.paymentStatus === 'PENDING' && (
                                            <div className="bg-yellow-500/20 text-yellow-400 font-bold px-4 py-3 rounded-xl text-center text-sm border border-yellow-500/30 mb-2 animate-pulse">
                                                ⚠️ Payment Pending (Collect at Exit)
                                            </div>
                                        )}
                                        <button
                                            onClick={handleConfirmEntry}
                                            disabled={isConfirming}
                                            className="w-full px-6 py-4 bg-gradient-to-r from-green-400 to-green-600 text-black font-black uppercase tracking-wider rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                                        >
                                            {isConfirming ? (
                                                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Confirm Entry
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}

                                {ticketDetails.paymentStatus === 'SUCCESS' && (
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={isDownloading}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black uppercase tracking-wider rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,255,236,0.3)]"
                                    >
                                        {isDownloading ? (
                                            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                Download Ticket PDF
                                            </>
                                        )}
                                    </button>
                                )}

                                {ticketDetails.isValidated && (
                                    <div className="w-full px-6 py-4 bg-yellow-500/20 text-yellow-400 font-bold uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 border border-yellow-500/30">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Already Scanned
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <XCircle className="w-20 h-20 text-red-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Ticket Not Found</h3>
                            <p className="text-white/60 text-sm mb-6">{scanMessage}</p>
                            <button
                                onClick={() => router.push('/bz/business/scan-tickets')}
                                className="px-6 py-3 bg-[#14FFEC] text-black font-black rounded-2xl hover:bg-[#12E6D6] transition-all active:scale-95"
                            >
                                Scan Another Ticket
                            </button>
                        </div>
                    )}
                    
                    {/* Floating Scan Another Button for Success Case */}
                    {scanStatus === 'success' && (
                        <div className="p-6 sticky bottom-0 bg-[#021313]/80 backdrop-blur-md flex flex-col gap-3">
                            <button
                                onClick={() => router.push('/bz/business/scan-tickets')}
                                className="w-full px-6 py-4 bg-[#14FFEC] text-black font-black uppercase tracking-wider rounded-2xl hover:scale-[1.02] transition-all active:scale-95 shadow-[0_0_20px_rgba(20,255,236,0.3)]"
                            >
                                Scan Another Ticket
                            </button>
                            <button
                                onClick={() => router.push('/bz/business')}
                                className="w-full bg-white/5 border border-white/10 text-white font-bold rounded-2xl py-4 hover:bg-white/10 transition-all"
                            >
                                Back to Business
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
