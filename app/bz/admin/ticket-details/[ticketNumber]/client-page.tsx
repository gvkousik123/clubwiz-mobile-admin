'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, Users, Ticket, CheckCircle2, XCircle, MapPin, DollarSign, Tag, Download } from 'lucide-react';
import { TicketScanService, TicketScanResponse } from '@/lib/services/ticket-scan.service';
import { TicketService } from '@/lib/services/ticket.service';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';



export default function TicketDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const ticketNumber = params.ticketNumber === '_'
        ? (searchParams.get('id') || '')
        : (params.ticketNumber as string);
    
    const [ticket, setTicket] = useState<TicketScanResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (ticketNumber) {
            loadTicketDetails();
        }
    }, [ticketNumber]);

    const handleConfirmEntry = async () => {
        if (!ticket) return;
        setIsConfirming(true);
        
        // Note: Retrieve actual staff/admin ID from your auth context if needed
        const staffId = "Admin/Staff"; 
        
        const result = await TicketScanService.confirmTicketEntry(ticket.ticketId, staffId);
        
        if (result.success) {
            toast({
                title: 'Success',
                description: 'Ticket marked as arrived!',
                className: 'bg-green-500 text-white border-none'
            });
            // Reload the ticket to get the updated status (isValidated: true, status: USED)
            loadTicketDetails();
        } else {
            toast({
                title: 'Validation Failed',
                description: result.message,
                variant: 'destructive'
            });
        }
        setIsConfirming(false);
    };

    const loadTicketDetails = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await TicketScanService.scanTicket(ticketNumber);
            
            if (result.success && result.data) {
                setTicket(result.data);
            } else {
                setError(result.message || 'Failed to load ticket details');
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive'
                });
            }
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to load ticket details';
            setError(errorMsg);
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!ticket) return;

        setIsDownloading(true);
        try {
            await TicketService.downloadTicket(ticket.ticketNumber || ticket.ticketId);
            toast({
                title: 'Success',
                description: 'PDF download started',
                className: 'bg-[#14FFEC] text-black border-none'
            });
        } catch (err: any) {
            toast({
                title: 'Download Failed',
                description: err?.message || 'Failed to download ticket PDF',
                variant: 'destructive'
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return 'N/A';
        return timeString;
    };

    const formatDateTime = (dateTimeString: string) => {
        return new Date(dateTimeString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#14FFEC] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/60">Loading ticket details...</p>
                </div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="min-h-screen bg-[#021313] flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-white text-xl font-bold mb-2">Error Loading Ticket</h2>
                    <p className="text-white/60 mb-6">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-bold px-6 py-3 rounded-xl"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] text-white">
            {/* Fixed Header */}
            <div className="fixed top-0 app-bar z-30 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px]">
                <div className="px-6 pt-10 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/bz/admin')}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">Ticket Details</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-0 relative mt-[100px] z-40">
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col min-h-[calc(100vh-100px)] p-6 space-y-6">
                    
                    {/* Status Badge */}
                    <div className="flex items-center justify-center gap-4">
                        <div className={`px-4 py-2 rounded-full font-bold ${
                            ticket.isValidated 
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                : ticket.status === 'ACTIVE' && ticket.paymentStatus === 'SUCCESS'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {ticket.isValidated ? 'Already Scanned' : ticket.status === 'ACTIVE' ? 'Valid Ticket' : ticket.status}
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold ${
                            ticket.paymentStatus === 'SUCCESS'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {ticket.paymentStatus}
                        </div>
                    </div>

                    {/* Ticket Number */}
                    <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/20 rounded-2xl p-6 text-center">
                        <Ticket className="w-12 h-12 text-[#14FFEC] mx-auto mb-3" />
                        <p className="text-white/60 text-sm mb-1">Ticket Number</p>
                        <p className="text-3xl font-black text-white tracking-wider">{ticket.ticketNumber}</p>
                    </div>

                    {/* QR Code */}
                    {ticket.qrCode && (
                        <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/20 rounded-2xl p-6">
                            <h3 className="text-white font-bold mb-4 text-center">QR Code</h3>
                            <div className="bg-white p-4 rounded-xl mx-auto w-fit">
                                <img 
                                    src={`data:image/png;base64,${ticket.qrCode}`} 
                                    alt="Ticket QR Code"
                                    className="w-48 h-48"
                                />
                            </div>
                        </div>
                    )}

                    {/* Event Details */}
                    {ticket.hasEvent && (
                        <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/20 rounded-2xl p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#14FFEC]" />
                                Event Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-white/60 text-sm">Event Name</p>
                                    <p className="text-white font-bold text-lg">{ticket.eventTitle}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-white/60 text-sm">Time</p>
                                        <p className="text-white font-medium">{formatDateTime(ticket.eventStartDateTime)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customer Details */}
                    <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/20 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-[#14FFEC]" />
                            Customer Details
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-white/40" />
                                <div className="flex-1">
                                    <p className="text-white/60 text-sm">Name</p>
                                    <p className="text-white font-medium">{ticket.userName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-white/40" />
                                <div className="flex-1">
                                    <p className="text-white/60 text-sm">Email</p>
                                    <p className="text-white font-medium">{ticket.userEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-white/40" />
                                <div className="flex-1">
                                    <p className="text-white/60 text-sm">Phone</p>
                                    <p className="text-white font-medium">{ticket.userPhone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/20 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[#14FFEC]" />
                            Booking Details
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-white/60 text-sm">Booking Date</p>
                                    <p className="text-white font-medium">{formatDate(ticket.bookingDate)}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Arrival Time</p>
                                    <p className="text-white font-medium">{formatTime(ticket.arrivalTime)}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-white/60 text-sm">Number of Guests</p>
                                <p className="text-white font-medium flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {ticket.numberOfGuests} guests
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Entry Breakdown */}
                    <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/20 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#14FFEC]" />
                            Entry Breakdown
                        </h3>
                        <div className="space-y-2">
                            {ticket.maleStagEntry > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60">Male Stag</span>
                                    <span className="text-white font-bold">{ticket.maleStagEntry}</span>
                                </div>
                            )}
                            {ticket.femaleStagEntry > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60">Female Stag</span>
                                    <span className="text-white font-bold">{ticket.femaleStagEntry}</span>
                                </div>
                            )}
                            {ticket.coupleEntry > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60">Couple</span>
                                    <span className="text-white font-bold">{ticket.coupleEntry}</span>
                                </div>
                            )}
                            {ticket.complimentaryMaleStagCount && ticket.complimentaryMaleStagCount > 0 && (
                                <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
                                    <span className="text-green-400">Complimentary</span>
                                    <span className="text-green-400 font-bold">{ticket.complimentaryMaleStagCount}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/20 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-[#14FFEC]" />
                            Payment Details
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-white/60">Entry Fee</span>
                                <span className="text-white font-medium">{ticket.currency} {ticket.entryFee}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/60">Cover Charge</span>
                                <span className="text-white font-medium">{ticket.currency} {ticket.totalCover}</span>
                            </div>
                            {ticket.offerDiscount > 0 && (
                                <div className="flex justify-between items-center text-green-400">
                                    <span>Discount</span>
                                    <span className="font-medium">- {ticket.currency} {ticket.offerDiscount}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
                                <span className="text-white font-bold">Total Amount</span>
                                <span className="text-[#14FFEC] font-black text-xl">{ticket.currency} {ticket.totalAmount}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white/60">Order ID</span>
                                <span className="text-white/80 font-mono text-xs">{ticket.orderId}</span>
                            </div>
                        </div>
                    </div>

                    {/* Venue Details */}
                    <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/20 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#14FFEC]" />
                            Venue Details
                        </h3>
                        <div className="flex items-center gap-4">
                            {ticket.venueLogo && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10">
                                    <img 
                                        src={ticket.venueLogo} 
                                        alt={ticket.clubName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div>
                                <p className="text-white/60 text-sm">Club Name</p>
                                <p className="text-white font-bold text-lg">{ticket.clubName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Validation Status */}
                    {ticket.isValidated && ticket.validatedAt && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle2 className="w-6 h-6 text-yellow-400" />
                                <h3 className="text-yellow-400 font-bold">Already Validated</h3>
                            </div>
                            <p className="text-white/80 text-sm">
                                This ticket was scanned on {formatDateTime(ticket.validatedAt)}
                            </p>
                        </div>
                    )}

                    {/* Additional Info */}
                    {(ticket.occasion || ticket.floorPreference || ticket.ticketDescription) && (
                        <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/20 rounded-2xl p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-[#14FFEC]" />
                                Additional Information
                            </h3>
                            <div className="space-y-3">
                                {ticket.occasion && (
                                    <div>
                                        <p className="text-white/60 text-sm">Occasion</p>
                                        <p className="text-white font-medium">{ticket.occasion}</p>
                                    </div>
                                )}
                                {ticket.floorPreference && (
                                    <div>
                                        <p className="text-white/60 text-sm">Floor Preference</p>
                                        <p className="text-white font-medium">{ticket.floorPreference}</p>
                                    </div>
                                )}
                                {ticket.ticketDescription && (
                                    <div>
                                        <p className="text-white/60 text-sm">Description</p>
                                        <p className="text-white font-medium">{ticket.ticketDescription}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="sticky bottom-6 pt-4 space-y-3">
                        {ticket.status === 'ACTIVE' && (ticket.paymentStatus === 'SUCCESS' || ticket.paymentStatus === 'PENDING') && !ticket.isValidated && (
                            <>
                                {ticket.paymentStatus === 'PENDING' && (
                                    <div className="bg-yellow-500/20 text-yellow-400 font-bold px-4 py-3 rounded-xl text-center text-sm border border-yellow-500/30 mb-2 animate-pulse">
                                        ⚠️ Payment Pending (Collect at Exit)
                                    </div>
                                )}
                                <button
                                    onClick={handleConfirmEntry}
                                    disabled={isConfirming}
                                    className="w-full bg-gradient-to-r from-green-400 to-green-600 text-black font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-4 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] transition-all flex items-center justify-center gap-2"
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
                        {ticket.status === 'ACTIVE' && (ticket.paymentStatus === 'SUCCESS' || ticket.paymentStatus === 'PENDING') && !ticket.isValidated && (
                            <>
                                {ticket.paymentStatus === 'PENDING' && (
                                    <div className="bg-yellow-500/20 text-yellow-400 font-bold px-4 py-3 rounded-xl text-center text-sm border border-yellow-500/30 mb-2 animate-pulse">
                                        ⚠️ Payment Pending (Collect at Exit)
                                    </div>
                                )}
                                <button
                                    onClick={handleConfirmEntry}
                                    disabled={isConfirming}
                                    className="w-full bg-gradient-to-r from-green-400 to-green-600 text-black font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-4 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] transition-all flex items-center justify-center gap-2"
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
                        {ticket.paymentStatus === 'SUCCESS' && (
                            <button
                                onClick={handleDownloadPdf}
                                disabled={isDownloading}
                                className="w-full bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-4 shadow-[0_0_20px_rgba(20,255,236,0.2)] hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] transition-all flex items-center justify-center gap-2"
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
                        <button
                            onClick={() => router.push('/bz/admin/scan-tickets')}
                            className="w-full bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-4 shadow-[0_0_20px_rgba(20,255,236,0.2)] hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] transition-all"
                        >
                            Scan Another Ticket
                        </button>
                        <button
                            onClick={() => router.push('/bz/admin')}
                            className="w-full bg-white/5 border border-white/10 text-white font-bold rounded-2xl py-4 hover:bg-white/10 transition-all"
                        >
                            Back to Admin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
