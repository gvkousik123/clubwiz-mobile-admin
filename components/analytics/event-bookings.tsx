'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnalyticsService, Booking } from '@/lib/services/analytics.service';
import { Download, Loader2, Phone, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EventBookingsProps {
    eventId: string;
    clubId: string | null;
    refreshKey?: number;
}

const bookingsCache = new Map<string, Booking[]>();

export default function EventBookings({ eventId, clubId, refreshKey = 0 }: EventBookingsProps) {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (clubId && eventId) {
            loadBookings();
        }
    }, [clubId, eventId, refreshKey]);

    const loadBookings = async () => {
        if (!clubId || !eventId) return;
        const cacheKey = `${clubId}:${eventId}:${refreshKey}`;

        if (bookingsCache.has(cacheKey)) {
            setBookings(bookingsCache.get(cacheKey) || []);
            return;
        }

        setLoading(true);
        try {
            const response = await AnalyticsService.getBookings({
                clubId,
                eventId,
                page: 0,
                size: 50,
                sortBy: 'bookingDate',
                sortOrder: 'desc'
            });

            const nextBookings = response.data?.content || [];
            bookingsCache.set(cacheKey, nextBookings);
            setBookings(nextBookings);
        } catch (error) {
            console.error('Error loading bookings:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!clubId || !eventId) return;

        setExporting(true);
        try {
            const response = await AnalyticsService.exportBookings(clubId, eventId);
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
        } catch (error) {
            console.error('Error exporting bookings:', error);
            toast({
                title: 'Error',
                description: 'Failed to export bookings',
                variant: 'destructive'
            });
        } finally {
            setExporting(false);
        }
    };

    const filteredBookings = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return bookings;

        return bookings.filter((booking) => {
            return [
                booking.ticketNumber,
                booking.fullName,
                booking.userEmail,
                booking.userPhone
            ].some((value) => String(value || '').toLowerCase().includes(query));
        });
    }, [bookings, searchTerm]);

    return (
        <section className="pt-2">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-black">Bookings</h3>
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#005D5C] px-2 text-xs font-black text-[#14FFEC]">
                        {filteredBookings.length}
                    </span>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting || !bookings.length}
                        className="inline-flex h-9 items-center gap-2 rounded-full bg-[#14FFEC] px-3 text-xs font-black text-[#021313] transition hover:bg-[#12E6D6] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download size={14} />
                        {exporting ? 'Exporting' : 'Download'}
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search ticket ID, email, phone"
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#0D1F1F] pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-[#14FFEC]/60"
                />
            </div>

            <div className="mt-3 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#0D1F1F] py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-[#14FFEC]" />
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#0D1F1F] px-4 py-8 text-center text-sm font-bold text-white/45">
                        No bookings found for this event
                    </div>
                ) : (
                    filteredBookings.map((booking, index) => (
                        <BookingCard key={`${booking.ticketNumber}-${index}`} booking={booking} />
                    ))
                )}
            </div>
        </section>
    );
}

function BookingCard({ booking }: { booking: Booking }) {
    const status = getStatusMeta(booking.arrivalStatus);
    const maleCount = booking.maleCount || 0;
    const femaleCount = booking.femaleCount || 0;
    const coupleCount = booking.coupleCount || 0;
    const totalGuests = booking.guestCount || maleCount + femaleCount + coupleCount;
    const arrivalTime = (booking as any).arrivalTime || (booking as any).arrivedAt;

    return (
        <article className="rounded-2xl border border-white/10 bg-[#0D1F1F] p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h4 className="truncate text-base font-black">{booking.fullName || 'Guest'}</h4>
                    <p className="mt-1 text-[11px] font-extrabold text-white/45">{booking.ticketNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-base font-black">₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</p>
                    <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${status.className}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {status.label}
                    </span>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-xs font-extrabold text-white/60">
                <div className="flex min-w-0 items-center gap-1.5">
                    <Phone size={13} className="shrink-0 text-white/35" />
                    <span className="truncate">{booking.userPhone || '-'}</span>
                </div>
                <div className="shrink-0 text-right">
                    M {maleCount} <span className="mx-1.5">F {femaleCount}</span> C {coupleCount}
                    <span className="ml-2 text-white">Total {totalGuests || 0}</span>
                </div>
            </div>

            {(booking.userEmail || arrivalTime || totalGuests > 0) && (
                <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs font-bold">
                    {totalGuests > 0 && (
                        <DetailRow label="Guests" value={`${totalGuests} guest${totalGuests === 1 ? '' : 's'}`} />
                    )}
                    {arrivalTime && (
                        <DetailRow label="Arrival time" value={formatTime(arrivalTime)} />
                    )}
                    <DetailRow label="Payment" value="UPI" />
                    {booking.userEmail && (
                        <DetailRow label="Email" value={booking.userEmail} />
                    )}
                    {booking.userPhone && (
                        <DetailRow label="Phone" value={booking.userPhone} />
                    )}
                </dl>
            )}
        </article>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[92px_1fr] gap-3">
            <dt className="text-white/35">{label}</dt>
            <dd className="min-w-0 truncate text-right text-white/80">{value}</dd>
        </div>
    );
}

function getStatusMeta(status: string) {
    switch (status) {
        case 'ARRIVED':
            return {
                label: 'Arrived',
                className: 'bg-[#005D5C] text-[#14FFEC]'
            };
        case 'CANCELLED':
            return {
                label: 'Cancelled',
                className: 'bg-red-500/15 text-red-300'
            };
        case 'ACTIVE':
            return {
                label: 'Pending',
                className: 'bg-[#BD8C16]/25 text-[#F8BD2B]'
            };
        default:
            return {
                label: status || 'Pending',
                className: 'bg-white/10 text-white/60'
            };
    }
}

function formatTime(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
