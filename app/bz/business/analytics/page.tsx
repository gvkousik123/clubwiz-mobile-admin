'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CalendarDays, RefreshCw, TrendingUp } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { AnalyticsService, EventAnalytics } from '@/lib/services/analytics.service';
import { useSummaryStats } from '@/components/analytics/summary-stats';
import { EventService } from '@/lib/services/event.service';
import { ClubService } from '@/lib/services/club.service';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import EventBookings from '@/components/analytics/event-bookings';

type EventFilter = 'today' | 'all';

const CARD_CLASS = 'rounded-2xl border border-white/10 bg-[#0D1F1F] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
const BLUE_CARD_CLASS = 'rounded-2xl border border-blue-500/30 bg-blue-500/10 shadow-[inset_0_1px_0_rgba(59,130,246,0.1)]';

export default function AnalyticsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [clubId, setClubId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [eventAnalytics, setEventAnalytics] = useState<EventAnalytics | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [eventFilter, setEventFilter] = useState<EventFilter>('today');
    const [showOverview, setShowOverview] = useState(false);
    const [contentLoading, setContentLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const didInitializeRef = useRef(false);
    const analyticsCacheRef = useRef<Record<string, EventAnalytics>>({});

    // Use shared summary stats hook
    const { summaryStats, summaryLoading } = useSummaryStats({ 
        clubId,
    });

    useEffect(() => {
        const initializeAnalytics = async () => {
            if (didInitializeRef.current) return;
            didInitializeRef.current = true;

            const storedClubId = localStorage.getItem(STORAGE_KEYS.ownedClubId);

            if (storedClubId) {
                setClubId(storedClubId);
                loadData(storedClubId);
                return;
            }

            try {
                const response = await ClubService.getMyClubs();
                if (response.data && response.data.length > 0) {
                    const ownedClubId = response.data[0].id;
                    localStorage.setItem(STORAGE_KEYS.ownedClubId, ownedClubId);
                    setClubId(ownedClubId);
                    loadData(ownedClubId);
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

        initializeAnalytics();
    }, []);

    const parseEventsFromResponse = (eventsResponse: any) => {
        if (eventsResponse.data?.content && Array.isArray(eventsResponse.data.content)) {
            return eventsResponse.data.content;
        }
        if (Array.isArray(eventsResponse.data)) {
            return eventsResponse.data;
        }
        if (eventsResponse?.content && Array.isArray(eventsResponse?.content)) {
            return eventsResponse.content;
        }
        return [];
    };

    const getDayBounds = () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
    };

    const isTodayEvent = (event: any) => {
        if (!event?.startDateTime) return false;
        const eventDate = new Date(event.startDateTime);
        if (Number.isNaN(eventDate.getTime())) return false;
        const { start, end } = getDayBounds();
        return eventDate >= start && eventDate < end;
    };

    const filterEvents = useCallback((eventsArray: any[], filter: EventFilter = eventFilter) => {
        const filtered = filter === 'today'
            ? eventsArray.filter(isTodayEvent)
            : eventsArray;

        return [...filtered].sort((a, b) => {
            const aTime = new Date(a.startDateTime || 0).getTime();
            const bTime = new Date(b.startDateTime || 0).getTime();
            return filter === 'today' ? aTime - bTime : bTime - aTime;
        });
    }, [eventFilter]);

    const fetchEventAnalytics = async (eventId: string, activeClubId: string, force = false) => {
        if (!force && analyticsCacheRef.current[eventId]) {
            setEventAnalytics(analyticsCacheRef.current[eventId]);
            return;
        }

        setRefreshing(true);
        setError(null);
        try {
            const response = await AnalyticsService.getEventAnalytics(eventId, activeClubId);
            analyticsCacheRef.current[eventId] = response.data;
            setEventAnalytics(response.data);
        } catch (error: any) {
            console.error('Error loading event analytics:', error);
            const errorMessage = error.response?.status === 403
                ? 'Access denied. You may not have permission to view this event analytics.'
                : error.response?.status === 401
                    ? 'Authentication required. Please log in again.'
                    : 'Failed to load event analytics';

            setError(errorMessage);
        } finally {
            setRefreshing(false);
        }
    };

    const loadEvents = async (id: string, force = false) => {
        setContentLoading(true);
        try {
            const eventsResponse = await EventService.getMyOrganizedEvents({ page: 0, size: 100 });
            const parsedEvents = parseEventsFromResponse(eventsResponse);
            const filteredEvents = filterEvents(parsedEvents);

            setAllEvents(parsedEvents);
            setEvents(filteredEvents);

            if (filteredEvents.length > 0) {
                const nextEventId = filteredEvents.some((event: any) => event.id === selectedEventId)
                    ? selectedEventId
                    : filteredEvents[0].id;
                setSelectedEventId(nextEventId);
                await fetchEventAnalytics(nextEventId, id, force);
            } else {
                setSelectedEventId('');
                setEventAnalytics(null);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            setAllEvents([]);
            setEvents([]);
            setSelectedEventId('');
            setEventAnalytics(null);
        } finally {
            setContentLoading(false);
        }
    };

    const loadData = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await loadEvents(id, true);
        } catch (error: any) {
            console.error('Error loading analytics:', error);
            const errorMessage = error.response?.status === 403
                ? 'Access denied. You may not have permission to view analytics.'
                : error.response?.status === 401
                    ? 'Authentication required. Please log in again.'
                    : 'Failed to load analytics data';

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleEventSelect = async (eventId: string) => {
        if (!clubId || !eventId) return;
        setSelectedEventId(eventId);
        await fetchEventAnalytics(eventId, clubId);
    };

    const handleRefresh = () => {
        if (clubId) {
            analyticsCacheRef.current = {};
            setRefreshKey((value) => value + 1);
            loadData(clubId);
        }
    };

    useEffect(() => {
        const nextEvents = filterEvents(allEvents);
        setEvents(nextEvents);

        if (!clubId || allEvents.length === 0) return;

        const nextEventId = nextEvents.some((event: any) => event.id === selectedEventId)
            ? selectedEventId
            : nextEvents[0]?.id || '';

        setSelectedEventId(nextEventId);
        if (nextEventId) {
            fetchEventAnalytics(nextEventId, clubId);
        } else {
            setEventAnalytics(null);
        }
    }, [eventFilter]);

    const selectedEvent = useMemo(
        () => events.find((event) => event.id === selectedEventId) || allEvents.find((event) => event.id === selectedEventId),
        [events, allEvents, selectedEventId]
    );

    const genderData = eventAnalytics ? [
        { name: 'Male', value: eventAnalytics.maleCount || 0, color: '#14FFEC' },
        { name: 'Female', value: eventAnalytics.femaleCount || 0, color: '#E46AF0' },
        { name: 'Couple', value: eventAnalytics.coupleCount || 0, color: '#37BDF5' }
    ] : [];

    const arrivalData = eventAnalytics ? [
        { name: 'Arrived', value: eventAnalytics.arrivals || 0, color: '#14FFEC' },
        { name: 'Pending', value: eventAnalytics.pendingArrivals || 0, color: '#F8BD2B' }
    ] : [];

    const totalGuests = genderData.reduce((sum, item) => sum + item.value, 0);
    const totalArrivalEntries = arrivalData.reduce((sum, item) => sum + item.value, 0);
    const arrivedPercent = totalArrivalEntries > 0
        ? Math.round(((eventAnalytics?.arrivals || 0) / totalArrivalEntries) * 100)
        : 0;
    const avgEntry = eventAnalytics?.totalEntries
        ? Math.round((eventAnalytics.totalRevenue || 0) / eventAnalytics.totalEntries)
        : 0;

    const formatCurrency = (value?: number) => `₹${(value || 0).toLocaleString('en-IN')}`;

    const formatEventDate = (date?: string) => {
        if (!date) return '';
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return '';
        return parsed.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <Image
                    src="/logo/logo.png"
                    alt="ClubWiz Logo"
                    width={112}
                    height={112}
                    className="animate-pulse"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] flex justify-center md:items-center md:py-8">
            <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[850px] overflow-hidden md:rounded-[2.5rem] md:border border-white/10 bg-[#021313] text-white shadow-2xl font-manrope flex flex-col">
                <header className="shrink-0 px-7 pt-7 pb-4">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => router.push('/bz/business')}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
                            aria-label="Back"
                        >
                            <ArrowLeft size={21} />
                        </button>
                        <h1 className="text-xl font-black tracking-tight">Analytics</h1>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08] disabled:opacity-50"
                            aria-label="Refresh analytics"
                        >
                            <RefreshCw size={19} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto scrollbar-hide px-7 pb-8">
                    <button
                        type="button"
                        onClick={() => setShowOverview((value) => !value)}
                        className="mb-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0D1F1F] px-4 py-3 text-left"
                    >
                        <div>
                            <p className="text-sm font-black">Analytics overview</p>
                            <p className="text-xs font-bold text-white/40">Club-wide summary cards</p>
                        </div>
                        <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${showOverview ? 'bg-[#14FFEC]' : 'bg-white/10'}`}>
                            <span className={`h-5 w-5 rounded-full bg-white transition ${showOverview ? 'translate-x-5' : 'translate-x-0'}`} />
                        </span>
                    </button>

                    {showOverview && (
                        <>
                            <MetricCard label="Revenue" value={summaryLoading && !summaryStats ? '...' : formatCurrency(summaryStats?.totalRevenue || 0)} fullWidth highlighted />
                            <div className="mt-5 grid grid-cols-3 gap-3">
                                <MetricCard label="Events" value={summaryLoading && !summaryStats ? '...' : (allEvents.length || 0).toLocaleString('en-IN')} />
                                <MetricCard label="Bookings" value={summaryLoading && !summaryStats ? '...' : (summaryStats?.totalBookings || 0).toLocaleString('en-IN')} />
                                <MetricCard label="Entries" value={summaryLoading && !summaryStats ? '...' : (summaryStats?.totalEntries || 0).toLocaleString('en-IN')} />
                            </div>
                        </>
                    )}

                    <div className="mt-6 grid grid-cols-2 rounded-2xl bg-[#0C1C1C] p-1.5">
                        {(['today', 'all'] as EventFilter[]).map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setEventFilter(filter)}
                                className={`h-12 rounded-xl text-sm font-extrabold transition ${
                                    eventFilter === filter
                                        ? 'bg-[#14FFEC] text-[#021313] shadow-lg shadow-[#14FFEC]/15'
                                        : 'text-white/50 hover:text-white'
                                }`}
                            >
                                {filter === 'today' ? "Today's event" : 'All events'}
                            </button>
                        ))}
                    </div>

                    {events.length > 1 && (
                        <select
                            value={selectedEventId}
                            onChange={(event) => handleEventSelect(event.target.value)}
                            disabled={refreshing}
                            className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0D1F1F] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#14FFEC]/60 disabled:opacity-50"
                        >
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.title}
                                </option>
                            ))}
                        </select>
                    )}

                    {error && (
                        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                            {error}
                        </div>
                    )}

                    {(contentLoading || (refreshing && !eventAnalytics)) ? (
                        <div className="mt-24 flex flex-col items-center justify-center text-center">
                            <RefreshCw className="mb-4 h-10 w-10 animate-spin text-[#14FFEC]" />
                            <p className="font-bold text-white/55">Loading analytics...</p>
                        </div>
                    ) : eventAnalytics ? (
                        <section className="mt-6 space-y-5">
                            <div>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-xl font-black tracking-tight">
                                            {eventAnalytics.eventTitle || selectedEvent?.title || 'Selected event'}
                                        </h2>
                                        <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white/45">
                                            <CalendarDays size={14} />
                                            <span>{formatEventDate(selectedEvent?.startDateTime)}</span>
                                        </div>
                                    </div>
                                    {eventFilter === 'today' && (
                                        <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#005D5C] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#14FFEC]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#14FFEC]" />
                                            Live today
                                        </span>
                                    )}
                                </div>
                            </div>

                            <MetricCard label="Revenue" value={formatCurrency(eventAnalytics.totalRevenue)} fullWidth highlighted />
                            <div className="mt-5 grid grid-cols-3 gap-3">
                                <MetricCard label="Entries" value={(eventAnalytics.totalEntries || 0).toLocaleString('en-IN')} />
                                <MetricCard label="Bookings" value={(eventAnalytics.totalBookings || 0).toLocaleString('en-IN')} />
                                <MetricCard label="Avg / entry" value={formatCurrency(avgEntry)} />
                            </div>

                            <div className={`${CARD_CLASS} p-5`}>
                                <h3 className="text-sm font-black">Guest composition</h3>
                                <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-white/10">
                                    {genderData.map((item) => (
                                        <div
                                            key={item.name}
                                            className="h-full"
                                            style={{
                                                width: `${totalGuests > 0 ? (item.value / totalGuests) * 100 : 0}%`,
                                                backgroundColor: item.color
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="mt-5 space-y-3">
                                    {genderData.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm font-extrabold">
                                            <div className="flex items-center gap-2.5 text-white/65">
                                                <span className="h-3 w-3 rounded-[4px]" style={{ backgroundColor: item.color }} />
                                                {item.name}
                                            </div>
                                            <span>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={`${CARD_CLASS} p-5`}>
                                <h3 className="text-sm font-black">Arrival status</h3>
                                <div className="mt-4 grid grid-cols-[44%_1fr] items-center gap-5">
                                    <div className="relative h-36">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={arrivalData}
                                                    dataKey="value"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={43}
                                                    outerRadius={60}
                                                    startAngle={110}
                                                    endAngle={-250}
                                                    paddingAngle={arrivalData.length > 1 ? 3 : 0}
                                                    stroke="none"
                                                >
                                                    {arrivalData.map((entry) => (
                                                        <Cell key={entry.name} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-[#14FFEC]">{arrivedPercent}%</span>
                                            <span className="text-[11px] font-extrabold text-white/50">arrived</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <ArrivalRow color="#14FFEC" value={eventAnalytics.arrivals || 0} label="Arrived" />
                                        <ArrivalRow color="#F8BD2B" value={eventAnalytics.pendingArrivals || 0} label="Pending" />
                                        <div className="border-t border-white/10 pt-4">
                                            <p className="text-lg font-black">{eventAnalytics.totalEntries || 0}</p>
                                            <p className="text-xs font-bold text-white/45">Total entries</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedEventId && (
                                <EventBookings eventId={selectedEventId} clubId={clubId} refreshKey={refreshKey} />
                            )}
                        </section>
                    ) : (
                        <div className="mt-24 text-center">
                            <TrendingUp className="mx-auto mb-4 h-14 w-14 text-white/15" />
                            <p className="font-bold text-white/55">
                                No {eventFilter === 'today' ? 'today' : 'events'} found
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function MetricCard({ label, value, fullWidth, blue, highlighted }: { label: string; value: string; fullWidth?: boolean; blue?: boolean; highlighted?: boolean }) {
    return (
        <div className={`${blue ? BLUE_CARD_CLASS : CARD_CLASS} min-h-[90px] p-4 ${fullWidth ? 'col-span-2' : ''} ${highlighted ? 'min-h-[110px] bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-400/40' : ''}`}>
            <p className="text-xs font-black text-white/35">{label}</p>
            <p className={`mt-2 font-black tracking-tight ${highlighted ? 'text-3xl text-[#14FFEC]' : 'text-2xl'}`}>{value}</p>
        </div>
    );
}

function ArrivalRow({ color, value, label }: { color: string; value: number; label: string }) {
    return (
        <div className="flex items-start gap-2.5">
            <span className="mt-1.5 h-3 w-3 rounded-[4px]" style={{ backgroundColor: color }} />
            <div>
                <p className="text-lg font-black leading-none">{value}</p>
                <p className="mt-1 text-xs font-bold text-white/45">{label}</p>
            </div>
        </div>
    );
}
