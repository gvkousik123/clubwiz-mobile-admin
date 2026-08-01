'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft,
    Download,
    RefreshCw,
    Search,
    Filter,
    Calendar,
    Users,
    CheckCircle,
    Clock,
    XCircle,
    QrCode,
    Loader2,
    ShieldCheck,
    ShieldAlert
} from 'lucide-react';
import { AnalyticsService, Booking } from '@/lib/services/analytics.service';
import { ClubService } from '@/lib/services/club.service';
import { TicketService } from '@/lib/services/ticket.service';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import DatePicker from '@/components/common/date-picker';
import { formatDateToDDMMYYYY, convertDDMMYYYYToISO } from '@/lib/date-utils';
import { QRScanner } from '@/components/bookings/qr-scanner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function BookingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [clubId, setClubId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    
    // Scanner state
    const [showScanner, setShowScanner] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [showResultDialog, setShowResultDialog] = useState(false);
    
    // Bookings data
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(20);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARRIVED' | 'CANCELLED'>('ALL');

    useEffect(() => {
        const initializeBookings = async () => {
            // First, try to get club ID from localStorage
            const storedClubId = localStorage.getItem(STORAGE_KEYS.ownedClubId);
            
            if (storedClubId) {
                console.log('✅ Using stored club ID for bookings:', storedClubId);
                setClubId(storedClubId);
                loadBookings(storedClubId);
                return;
            }

            // If not in localStorage, fetch from API
            try {
                const response = await ClubService.getMyClubs();
                console.log('📊 Fetched owned clubs for bookings:', response);
                
                if (response.data && response.data.length > 0) {
                    const ownedClubId = response.data[0].id;
                    console.log('✅ Using club ID for bookings:', ownedClubId);
                    
                    // Store for future use
                    localStorage.setItem(STORAGE_KEYS.ownedClubId, ownedClubId);
                    
                    setClubId(ownedClubId);
                    loadBookings(ownedClubId);
                } else {
                    toast({
                        title: 'Error',
                        description: 'No clubs found. Please create a club first.',
                        variant: 'destructive'
                    });
                    router.push('/bz/business');
                }
            } catch (error) {
                console.error('Error fetching owned clubs:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load club information',
                    variant: 'destructive'
                });
                router.push('/bz/business');
            }
        };

        initializeBookings();
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!clubId) return;
        
        const interval = setInterval(() => {
            loadBookings(clubId, true);
        }, 30000);
        
        return () => clearInterval(interval);
    }, [clubId, currentPage, startDate, endDate]);

    const loadBookings = async (id: string, silent = false) => {
        if (!silent) setLoading(true);
        setRefreshing(true);
        
        try {
            let response;
            
            if (startDate && endDate) {
                // Use date range endpoint
                response = await AnalyticsService.getBookingsByDateRange({
                    clubId: id,
                    startDate: convertDDMMYYYYToISO(startDate),
                    endDate: convertDDMMYYYYToISO(endDate),
                    page: currentPage,
                    size: pageSize,
                    sortBy: 'bookingDate',
                    sortOrder: 'desc'
                });
            } else {
                // Use regular bookings endpoint
                response = await AnalyticsService.getBookings({
                    clubId: id,
                    page: currentPage,
                    size: pageSize,
                    sortBy: 'bookingDate',
                    sortOrder: 'desc'
                });
            }
            
            if (response.data && response.data.content) {
                setBookings(response.data.content);
                setTotalElements(response.data.totalElements || 0);
            }
        } catch (error: any) {
            console.error('Error loading bookings:', error);
            if (!silent) {
                const errorMessage = error.response?.status === 403 
                    ? 'Access denied. You may not have permission to view bookings.'
                    : error.response?.status === 401
                    ? 'Authentication required. Please log in again.'
                    : 'Failed to load bookings';
                
                toast({
                    title: 'Error',
                    description: errorMessage,
                    variant: 'destructive'
                });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleScan = async (decodedText: string) => {
        console.log('🔍 Scanned QR Code:', decodedText);
        setShowScanner(false);
        setIsValidating(true);
        setValidationResult(null);
        
        try {
            // Decoded text should be the ticketId
            const response = await TicketService.validateTicket(decodedText);
            console.log('✅ Validation Response:', response);
            
            setValidationResult(response.data);
            setShowResultDialog(true);
            
            if (response.data.isValid) {
                toast({
                    title: 'Ticket Validated!',
                    description: response.data.message || 'Guest entry has been recorded.',
                    variant: 'default'
                });
                
                // Refresh bookings to show arrival status change
                if (clubId) loadBookings(clubId, true);
            } else {
                toast({
                    title: 'Invalid Ticket',
                    description: response.data.message || 'This ticket could not be validated.',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            console.error('❌ Validation Error:', error);
            toast({
                title: 'Validation Failed',
                description: error.message || 'An error occurred while validating the ticket.',
                variant: 'destructive'
            });
            setValidationResult({
                isValid: false,
                message: error.message || 'Validation failed. Please try again.'
            });
            setShowResultDialog(true);
        } finally {
            setIsValidating(false);
        }
    };

    const handleExport = async () => {
        if (!clubId) return;
        
        setExporting(true);
        try {
            const response = await AnalyticsService.exportBookings(clubId);
            
            // Create and download CSV file
            const blob = new Blob([response.csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast({
                title: 'Success',
                description: `Exported ${response.count} bookings`,
                variant: 'default'
            });
        } catch (error: any) {
            console.error('Error exporting bookings:', error);
            const errorMessage = error.response?.status === 403 
                ? 'Access denied. You may not have permission to export bookings.'
                : error.response?.status === 401
                ? 'Authentication required. Please log in again.'
                : 'Failed to export bookings';
            
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setExporting(false);
        }
    };

    const handleApplyFilters = () => {
        setCurrentPage(0);
        if (clubId) {
            loadBookings(clubId);
        }
    };

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatusFilter('ALL');
        setSearchQuery('');
        setCurrentPage(0);
        if (clubId) {
            loadBookings(clubId);
        }
    };

    // Filter bookings by search and status
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = searchQuery === '' || 
            booking.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.userPhone?.includes(searchQuery) ||
            booking.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || booking.arrivalStatus === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                        <Clock size={12} />
                        Active
                    </span>
                );
            case 'ARRIVED':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                        <CheckCircle size={12} />
                        Arrived
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                        <XCircle size={12} />
                        Cancelled
                    </span>
                );
            default:
                return <span className="text-white/60 text-xs">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-[#14FFEC] animate-spin mx-auto mb-4" />
                    <p className="text-white">Loading bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] pb-20">
            {/* Scanner Component */}
            {showScanner && (
                <QRScanner 
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Validation Result Dialog */}
            <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                <DialogContent className="bg-[#0D1F1F] border-[#14FFEC]/30 text-white max-w-sm rounded-3xl">
                    <DialogHeader>
                        <div className="flex justify-center mb-4">
                            {validationResult?.isValid ? (
                                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                    <ShieldCheck size={48} />
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                                    <ShieldAlert size={48} />
                                </div>
                            )}
                        </div>
                        <DialogTitle className="text-center text-2xl font-bold">
                            {validationResult?.isValid ? 'Ticket Verified' : 'Invalid Ticket'}
                        </DialogTitle>
                        <DialogDescription className="text-center text-white/60">
                            {validationResult?.message}
                        </DialogDescription>
                    </DialogHeader>

                    {validationResult?.isValid && validationResult.ticket && (
                        <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-[#14FFEC]/10 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-white/40 text-xs">Guest</span>
                                <span className="text-white font-bold">{validationResult.ticket.userName || 'Guest'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-white/40 text-xs">Ticket</span>
                                <span className="text-[#14FFEC] font-bold">{validationResult.ticket.ticketNumber}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Guests Count</span>
                                <span className="text-white font-bold">{validationResult.ticket.guestCount || (validationResult.ticket.maleCount + validationResult.ticket.femaleCount + validationResult.ticket.coupleCount * 2) || 'N/A'}</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-6">
                        <button 
                            onClick={() => setShowResultDialog(false)}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${
                                validationResult?.isValid 
                                ? 'bg-[#14FFEC] text-black hover:bg-[#12E6D6]' 
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                        >
                            {validationResult?.isValid ? 'Check-in Guest' : 'Close'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="bg-gradient-to-b from-[#0D1F1F] to-[#021313] px-6 pt-6 pb-6 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => router.push('/bz/business/analytics')}
                        className="w-10 h-10 rounded-full bg-[#0D1F1F] border border-[#14FFEC]/30 flex items-center justify-center text-[#14FFEC] hover:bg-[#14FFEC]/10 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Bookings</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowScanner(true)}
                            className="w-10 h-10 rounded-full bg-[#14FFEC] flex items-center justify-center text-black hover:bg-[#12E6D6] transition shadow-[0_0_15px_rgba(20,255,236,0.3)]"
                            title="Scan QR Code"
                        >
                            <QrCode size={18} />
                        </button>
                        <button
                            onClick={() => clubId && loadBookings(clubId)}
                            disabled={refreshing}
                            className="w-10 h-10 rounded-full bg-[#0D1F1F] border border-[#14FFEC]/30 flex items-center justify-center text-[#14FFEC] hover:bg-[#14FFEC]/10 transition disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="w-10 h-10 rounded-full bg-[#0D1F1F] border border-[#14FFEC]/30 flex items-center justify-center text-[#14FFEC] hover:bg-[#14FFEC]/10 transition disabled:opacity-50"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by ticket, email, phone..."
                        className="w-full bg-[#0D1F1F] text-white rounded-lg pl-10 pr-4 py-3 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                    />
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-[#14FFEC] text-sm font-semibold"
                >
                    <Filter size={16} />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 space-y-3 bg-[#0D1F1F] rounded-lg p-4 border border-[#14FFEC]/20">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-white/60 text-xs mb-1 block">Start Date</label>
                                <DatePicker
                                    value={startDate}
                                    onChange={setStartDate}
                                    placeholder="DD/MM/YYYY"
                                />
                            </div>
                            <div>
                                <label className="text-white/60 text-xs mb-1 block">End Date</label>
                                <DatePicker
                                    value={endDate}
                                    onChange={setEndDate}
                                    placeholder="DD/MM/YYYY"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-white/60 text-xs mb-1 block">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none text-sm"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ARRIVED">Arrived</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleApplyFilters}
                                className="flex-1 bg-[#14FFEC] text-black font-semibold py-2 rounded-lg hover:bg-[#12E6D6] transition text-sm"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="flex-1 bg-[#021313] text-white font-semibold py-2 rounded-lg border border-[#14FFEC]/30 hover:bg-[#14FFEC]/10 transition text-sm"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-white/60">Total: {totalElements} bookings</span>
                    <span className="text-white/60">Showing: {filteredBookings.length}</span>
                </div>
            </div>

            {/* Bookings List/Table */}
            <div className="px-6">
                {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/60">No bookings found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto bg-[#0D1F1F] rounded-xl border border-[#14FFEC]/20">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#14FFEC]/10 text-white/60 text-xs uppercase tracking-wider">
                                        <th className="px-4 py-4 font-semibold">Ticket ID</th>
                                        <th className="px-4 py-4 font-semibold">Customer</th>
                                        <th className="px-4 py-4 font-semibold">Guests</th>
                                        <th className="px-4 py-4 font-semibold">M/F/C</th>
                                        <th className="px-4 py-4 font-semibold">Amount</th>
                                        <th className="px-4 py-4 font-semibold">Status</th>
                                        <th className="px-4 py-4 font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#14FFEC]/5">
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.ticketNumber} className="hover:bg-[#14FFEC]/5 transition-colors group">
                                            <td className="px-4 py-4 text-sm font-medium text-[#14FFEC]">
                                                {booking.ticketNumber}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white text-sm font-semibold">{booking.fullName || 'Anonymous'}</span>
                                                    <span className="text-white/40 text-xs">{booking.userEmail}</span>
                                                    <span className="text-white/40 text-xs">{booking.userPhone}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-white text-sm">
                                                {booking.guestCount}
                                            </td>
                                            <td className="px-4 py-4 text-white/60 text-sm">
                                                {booking.maleCount || 0}/{booking.femaleCount || 0}/{booking.coupleCount || 0}
                                            </td>
                                            <td className="px-4 py-4 text-[#14FFEC] text-sm font-bold">
                                                ₹{booking.totalAmount}
                                            </td>
                                            <td className="px-4 py-4">
                                                {getStatusBadge(booking.arrivalStatus)}
                                            </td>
                                            <td className="px-4 py-4 text-white/40 text-xs">
                                                {booking.bookingDate}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {filteredBookings.map((booking) => (
                                <div
                                    key={booking.ticketNumber}
                                    className="bg-[#0D1F1F] rounded-lg p-4 border border-[#14FFEC]/20"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-white font-semibold text-sm mb-1">
                                                {booking.ticketNumber}
                                            </p>
                                            {booking.fullName && (
                                                <p className="text-white/80 text-xs">{booking.fullName}</p>
                                            )}
                                        </div>
                                        {getStatusBadge(booking.arrivalStatus)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                        <div>
                                            <p className="text-white/40">Email</p>
                                            <p className="text-white/80 truncate">{booking.userEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40">Phone</p>
                                            <p className="text-white/80">{booking.userPhone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-3 border-t border-[#14FFEC]/10">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-white/40">Guests</p>
                                                <p className="text-white font-semibold">{booking.guestCount}</p>
                                            </div>
                                            {booking.maleCount !== undefined && (
                                                <div>
                                                    <p className="text-white/40">M/F/C</p>
                                                    <p className="text-white font-semibold">
                                                        {booking.maleCount}/{booking.femaleCount}/{booking.coupleCount}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white/40">Amount</p>
                                            <p className="text-[#14FFEC] font-semibold">₹{booking.totalAmount}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2 text-xs text-white/40">
                                        Booked: {booking.bookingDate}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalElements > pageSize && (
                <div className="px-6 mt-6 flex items-center justify-between">
                    <button
                        onClick={() => {
                            setCurrentPage(Math.max(0, currentPage - 1));
                            clubId && loadBookings(clubId);
                        }}
                        disabled={currentPage === 0}
                        className="px-4 py-2 bg-[#0D1F1F] text-white rounded-lg border border-[#14FFEC]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-white/60 text-sm">
                        Page {currentPage + 1} of {Math.ceil(totalElements / pageSize)}
                    </span>
                    <button
                        onClick={() => {
                            setCurrentPage(currentPage + 1);
                            clubId && loadBookings(clubId);
                        }}
                        disabled={currentPage >= Math.ceil(totalElements / pageSize) - 1}
                        className="px-4 py-2 bg-[#0D1F1F] text-white rounded-lg border border-[#14FFEC]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
