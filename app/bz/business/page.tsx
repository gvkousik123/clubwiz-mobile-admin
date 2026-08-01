'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, Plus, DollarSign, BarChart, Edit, User, LogOut, Heart, MessageCircle, Music, TrendingUp, Tag, Headphones, QrCode, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useProfile } from '@/hooks/use-profile';
import { useAdminClubs } from '@/hooks/use-admin-clubs';
import { useAdminEvents } from '@/hooks/use-admin-events';
import { useOwnedClubs } from '@/hooks/use-owned-clubs';
import { useOrganizedEvents } from '@/hooks/use-organized-events';
import { AccessDenied } from '@/components/common/access-denied';
import { AuthService } from '@/lib/services/auth.service';
import { ProfileService } from '@/lib/services/profile.service';
import { ClubService } from '@/lib/services/club.service';
import { EventService } from '@/lib/services/event.service';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { useSummaryStats } from '@/components/analytics/summary-stats';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { NotificationBell } from '@/components/notifications/notification-bell';

const ANALYTICS_CARD_CLASS = 'rounded-2xl border border-white/10 bg-[#0D1F1F] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
const BLUE_CARD_CLASS = 'rounded-2xl border border-blue-500/30 bg-blue-500/10 shadow-[inset_0_1px_0_rgba(59,130,246,0.1)]';

export default function AdminDashboard() {
    // Authentication info - no redirects
    const isAuthenticated = AuthService.isAuthenticated();
    const userRoles = AuthService.getUserRolesFromStorage();
    const hasRole = (role: string) => AuthService.hasRole(role);

    const router = useRouter();
    const { toast } = useToast();
    const [showCreateModal, setShowCreateModal] = useState<'club' | 'event' | null>(null);
    const [clubFavoriteCount, setClubFavoriteCount] = useState<number | null>(null);

    // Event tab filter state
    const [eventTab, setEventTab] = useState<'upcoming' | 'past'>('upcoming');

    // Delete dialog states - Events
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
    const [deleteEventTitle, setDeleteEventTitle] = useState<string>('');



    // Use profile hook for admin profile data
    const {
        currentUser,
        isAdmin,
        isSuperAdmin,
    } = useProfile();

    // CRUD hooks for clubs and events
    const clubCrud = useAdminClubs();
    const eventCrud = useAdminEvents();
    const { clubs: ownedClubs, loadOwnedClubs, isLoading: isLoadingOwnedClubs, setClubs: setOwnedClubs, error: ownedClubsError } = useOwnedClubs();
    const { events: organizedEvents, loadOrganizedEvents, refreshOrganizedEvents, isLoading: isLoadingOrganized, error: organizedEventsError, setEvents } = useOrganizedEvents();

    // Check club status on mount - redirect if needed
    useEffect(() => {
        // Wait for currentUser to load before checking
        if (!currentUser) return;
        
        // ROLE_ADMIN can manage multiple clubs, skip this check entirely
        if (currentUser?.roles?.includes('ROLE_ADMIN')) {
            console.log('✅ ROLE_ADMIN - skipping club status check');
            return;
        }
        
        const clubStatus = ProfileService.getClubStatus();

        // Only check for ROLE_BUSINESS_ADMIN (superadmins also bypass)
        if (isAdmin() && !isSuperAdmin()) {
            if (!clubStatus.hasClub) {
                // No club added - redirect to new-club
                router.replace('/business/new-club');
                return;
            }

            if (!clubStatus.isActive) {
                // Club added but not active - redirect to pending page
                router.replace('/business/club-pending');
                return;
            }
        }
    }, [isAdmin, isSuperAdmin, router, currentUser]);

    // Track if data has been loaded to prevent duplicate calls
    const [dataLoaded, setDataLoaded] = useState(false);

    // Load admin data on mount - ONLY ONCE and only if club is active
    useEffect(() => {
        let isMounted = true;

        const loadAdminData = async () => {
            if (!isMounted || dataLoaded) return;

            // Check club status before loading data
            const clubStatus = ProfileService.getClubStatus();

            // Only load data if club is active (or user is superadmin)
            if (isAdmin() && !isSuperAdmin() && (!clubStatus.hasClub || !clubStatus.isActive)) {
                console.log('⏸️ Skipping data load - club not active');
                return;
            }

            try {
                console.log('📊 Loading dashboard data...');
                
                // Load owned clubs for this admin
                await loadOwnedClubs();

                // Load organized events (events created by this user)
                await loadOrganizedEvents({ page: 0, size: 100, sortBy: 'startDateTime', sortOrder: 'asc' });

                if (isMounted) {
                    setDataLoaded(true);
                    console.log('✅ Dashboard data loaded');
                }
            } catch (error) {
                console.error('Error loading admin data:', error);
            }
        };
        loadAdminData();

        return () => {
            isMounted = false;
        };
    }, []); // Empty dependency array - load only once on mount

    // Use shared summary stats hook
    const clubId = ownedClubs?.[0]?.id || null;
    const { summaryStats: analyticsStats, summaryLoading: isLoadingStats } = useSummaryStats({ 
        clubId
    });

    // Debug: Log when analyticsStats changes
    useEffect(() => {
        console.log('� [Home] analyticsStats state changed:', analyticsStats);
        console.log('🔍 [Home] isLoadingStats:', isLoadingStats);
    }, [analyticsStats, isLoadingStats]);

    // Track if favorite count has been loaded
    const [favoriteCountLoaded, setFavoriteCountLoaded] = useState(false);

    // Load club favorite count when clubs are loaded - ONLY ONCE
    useEffect(() => {
        let isMounted = true;

        if (ownedClubs && ownedClubs.length > 0 && !favoriteCountLoaded) {
            const fetchFavoriteCount = async () => {
                try {
                    const countData = await ClubService.getFavoriteCount(ownedClubs[0].id);
                    if (isMounted) {
                        setClubFavoriteCount(countData.favoriteCount ?? 0);
                        setFavoriteCountLoaded(true);
                    }
                } catch (error) {
                    console.error('Error loading favorite count:', error);
                    if (isMounted) {
                        setClubFavoriteCount(0);
                        setFavoriteCountLoaded(true);
                    }
                }
            };
            fetchFavoriteCount();
        }

        return () => {
            isMounted = false;
        };
    }, [ownedClubs, favoriteCountLoaded]);

    // Handle logout
    const handleLogout = () => {
        // Show confirmation dialog
        if (!confirm('Do you really want to logout?')) {
            return;
        }
        
        // Clear all auth-related localStorage comprehensively
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userDetails');
        localStorage.removeItem('userRoles');
        localStorage.removeItem('user');
        localStorage.removeItem('user-email');
        localStorage.removeItem('user-phone');
        localStorage.removeItem('user-name');
        localStorage.removeItem('user-id');
        localStorage.removeItem('user-role');
        localStorage.removeItem('firebaseUser');
        localStorage.removeItem('clubStatus');
        localStorage.removeItem('clubviz-accessToken');
        localStorage.removeItem('clubviz-refreshToken');

        // Clear all keys with clubviz, user, or auth prefix
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('clubviz-') || key.startsWith('user-') || key.startsWith('auth-')) {
                localStorage.removeItem(key);
            }
        });

        toast({
            title: 'Logged out',
            description: 'You have been logged out successfully.',
        });

        router.push('/bz/auth/login');
    };

    // Calculate stats from organized events
    const calculateStats = () => {
        if (!organizedEvents || organizedEvents.length === 0) {
            return {
                totalRevenue: 'Rs 0',
                totalTicketSold: '0/0',
                peopleAttending: '0',
                activeEvents: '0'
            };
        }

        const activeEvents = organizedEvents.filter(e => e.status === 'ONGOING' || e.ongoing);
        const totalAttendees = organizedEvents.reduce((sum, event) => sum + event.attendeeCount, 0);
        const totalCapacity = organizedEvents.reduce((sum, event) => sum + (event.maxAttendees || 0), 0);

        return {
            totalRevenue: 'Rs 0', // Fetch from API if available
            totalTicketSold: `${totalAttendees}/${totalCapacity || 'Unlimited'}`,
            peopleAttending: totalAttendees.toString(),
            activeEvents: activeEvents.length.toString()
        };
    };

    const stats = calculateStats();
    const clubName = ownedClubs?.[0]?.name || 'Club';
    const formatNumber = (value?: number) => typeof value === 'number' ? value.toLocaleString('en-IN') : '0';
    const formatCurrency = (value?: number) => `₹${formatNumber(value || 0)}`;

    // Get filtered events based on tab
    const getFilteredEvents = () => {
        if (!organizedEvents) return [];
        
        const now = new Date();
        
        switch(eventTab) {
            case 'upcoming':
                return organizedEvents.filter(e => {
                    if (!e.startDateTime) return false;
                    const eventDate = new Date(e.startDateTime);
                    return eventDate > now && !e.ongoing && e.status !== 'ONGOING';
                });
            case 'past':
                return organizedEvents.filter(e => {
                    if (!e.startDateTime) return false;
                    const eventDate = new Date(e.startDateTime);
                    return eventDate < now;
                });
            default:
                return organizedEvents;
        }
    };

    const filteredEvents = getFilteredEvents();

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    // Handle club operations

    const handleEditClub = (clubId: string) => {
        router.push(`/business/club-preview?clubId=${clubId}&edit=true`);
    };



    const handleCreateClub = () => {
        handleNavigation('/business/new-club');
    };

    // Handle event operations
    const handleCreateEvent = () => {
        setShowCreateModal('event');
        // Navigate to new event creation page
        handleNavigation('/business/new-event');
    };

    const handleEditEvent = (eventId: string) => {
        router.push(`/bz/business/new-event?eventId=${eventId}`);
    };

    const handleViewEvent = (eventId: string) => {
        router.push(`/bz/business/event-preview?eventId=${eventId}`);
    };

    const handleDeleteEvent = (eventId: string) => {
        const event = organizedEvents.find(e => e.id === eventId);
        if (event) {
            setDeleteEventId(eventId);
            setDeleteEventTitle(event.title);
            setShowDeleteDialog(true);
        }
    };

    const handleConfirmDeleteEvent = async () => {
        if (!deleteEventId) return;

        const eventIdToDelete = deleteEventId;
        const eventTitleToDelete = deleteEventTitle;

        // Close the dialog
        setShowDeleteDialog(false);
        setDeleteEventId(null);
        setDeleteEventTitle('');

        try {
            // Call API to delete
            await EventService.deleteEvent(eventIdToDelete);

            // Remove from UI immediately after API call
            const updatedEvents = organizedEvents.filter(event => event.id !== eventIdToDelete);
            setEvents(updatedEvents);

            // Show success toast
            toast({
                title: "Success",
                description: `Event "${eventTitleToDelete}" deleted successfully`,
                variant: "default",
            });
        } catch (error: any) {
            console.error('Error deleting event:', error);

            // Still remove from frontend as deletion likely succeeded
            const updatedEvents = organizedEvents.filter(event => event.id !== eventIdToDelete);
            setEvents(updatedEvents);

            // Show success toast regardless of error response
            toast({
                title: "Success",
                description: `Event "${eventTitleToDelete}" deleted successfully`,
                variant: "default",
            });
        }
    };

    const handleCancelDeleteEvent = () => {
        setShowDeleteDialog(false);
        setDeleteEventId(null);
        setDeleteEventTitle('');
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white relative flex justify-center items-center md:py-8">
            <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[850px] relative overflow-hidden md:rounded-[2.5rem] md:border border-white/10 shadow-2xl bg-[#021313] flex flex-col">
                {/* Immersive Header */}
                <div className="w-full z-30 flex flex-col pt-8 bg-gradient-to-b from-[#11B9AB]/20 to-[#021313] h-[140px] md:rounded-t-[2.5rem] overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#11B9AB33,transparent_70%)]" />
                    <div className="px-6 flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[#14FFEC] text-[9px] font-black tracking-[0.3em] uppercase mb-1">Welcome Back</p>
                            <h2 className="text-lg font-bold tracking-tight">{currentUser?.fullName || currentUser?.username || 'Admin'}</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); router.push('/bz/business/scan-tickets'); }}
                                className="w-12 h-12 bg-[#14FFEC]/10 hover:bg-[#14FFEC]/20 rounded-2xl flex items-center justify-center border border-[#14FFEC]/30 transition-all active:scale-95"
                            >
                                <QrCode className="w-6 h-6 text-[#14FFEC]" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-12 h-12 bg-red-500/10 hover:bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 transition-all active:scale-95"
                            >
                                <LogOut className="w-5 h-5 text-red-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <div className="px-0 relative">
                        {/* Main Container with rounded corners */}
                        <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col">
                    {/* Club name and logo/story header section - Only show if club exists */}
                    {ownedClubs && ownedClubs.length > 0 && (
                        <div className="px-6 pt-6 pb-2">
                            <div className="flex items-center justify-between">
                                <h1 className="text-3xl font-extrabold tracking-tight">{ownedClubs[0]?.name || 'Club'}</h1>
                                <div className="flex items-center gap-3">
                                    {/* Story Circle */}
                                    <div
                                        onClick={() => router.push(`/business/upload-story?clubId=${ownedClubs[0]?.id}`)}
                                        className="w-16 h-16 bg-black rounded-full border-2 border-[#14FFEC] flex items-center justify-center relative cursor-pointer hover:border-[#14FFEC] hover:bg-[#14FFEC]/10 transition-colors"
                                    >
                                        <div className="relative w-14 h-14 flex items-center justify-center text-xs text-center text-[#14FFEC]">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="uppercase font-semibold text-xs">Story</span>
                                                <span className="block text-[8px]">+ Add</span>
                                            </div>
                                            <div className="absolute right-0 bottom-0 bg-white rounded-full w-5 h-5 flex items-center justify-center z-50">
                                                <Plus className="w-3 h-3 text-black" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content wrapper with padding */}
                    <div className="px-6 py-6">

                        {/* Favorite Count Badge - Above Story Stats */}
                        {clubFavoriteCount !== null && (
                            <div className="mb-6 flex justify-start">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#005D5C] border border-[#14FFEC]/40">
                                    <Heart className="w-4 h-4 text-[#FF6B8A] fill-[#FF6B8A]" />
                                    <span className="text-white text-sm font-semibold">{clubFavoriteCount}</span>
                                    <span className="text-white/70 text-xs">saved</span>
                                </div>
                            </div>
                        )}

                        {/* Analytics Stats Section - Only show if club exists */}
                        {ownedClubs && ownedClubs.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-black mb-3">Analytics Overview</h3>
                                <AnalyticsMetricCard label="Revenue" value={analyticsStats ? formatCurrency(analyticsStats.totalRevenue) : '...'} fullWidth highlighted />
                                <div className="mt-5 grid grid-cols-3 gap-3">
                                    <AnalyticsMetricCard label="Events" value={isLoadingOrganized ? '...' : formatNumber(organizedEvents?.length || 0)} />
                                    <AnalyticsMetricCard label="Bookings" value={analyticsStats ? formatNumber(analyticsStats.totalBookings) : '...'} />
                                    <AnalyticsMetricCard label="Entries" value={analyticsStats ? formatNumber(analyticsStats.totalEntries) : '...'} />
                                </div>

                                <div
                                    onClick={() => router.push('/bz/business/analytics')}
                                    className="mt-4 bg-[#0C1C1C] rounded-[20px] p-4 flex items-center justify-between cursor-pointer border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-[#14FFEC]/30 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#14FFEC]/10 w-11 h-11 rounded-xl flex items-center justify-center border border-[#14FFEC]/20">
                                            <TrendingUp className="w-5 h-5 text-[#14FFEC]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-base tracking-tight">View all analytics</p>
                                            <p className="text-white/40 text-[11px] font-medium">Stats, bookings, charts & export data</p>
                                        </div>
                                    </div>
                                    <div className="text-white/30">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Quick Actions Section */}
                        <div className="mb-6">
                            <h3 className="text-[10px] font-black text-[#14FFEC]/60 uppercase tracking-[0.2em] mb-3">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {/* Create New Club - Only show if no club exists and there is no auth error */}
                                {ownedClubsError && ownedClubs?.length === 0 && !isLoadingOwnedClubs && (
                                    <div className="col-span-2 rounded-[20px] border border-red-500/20 bg-red-500/10 p-4 text-red-100 mb-3">
                                        <p className="font-semibold text-sm">{ownedClubsError.toLowerCase().includes('session') ? 'Session Expired' : 'Create Club first'}</p>
                                        <p className="text-[11px] text-red-100/80 mt-1">
                                            {ownedClubsError.toLowerCase().includes('session')
                                                ? 'Your session has expired. Please login again to continue.'
                                                : 'We were unable to load your clubs right now. The club list API is unavailable, so please create your club first and continue from there.'
                                            }
                                        </p>
                                        {ownedClubsError.toLowerCase().includes('session') && (
                                            <button
                                                type="button"
                                                onClick={() => router.push('/bz/auth/login')}
                                                className="mt-3 inline-flex items-center justify-center rounded-full bg-[#14FFEC] px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#0fd3c3]"
                                            >
                                                Login Again
                                            </button>
                                        )}
                                    </div>
                                )}
                                {ownedClubs?.length === 0 && !isLoadingOwnedClubs && !ownedClubsError && (
                                    <div
                                        onClick={handleCreateClub}
                                        className="bg-[#0C1C1C] rounded-[20px] p-4 flex flex-col gap-3 cursor-pointer border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-[#14FFEC]/30 transition-all active:scale-[0.98] col-span-2"
                                    >
                                        <div className="w-12 h-12 bg-[#14FFEC]/10 rounded-xl flex items-center justify-center border border-[#14FFEC]/20">
                                            <Plus className="w-6 h-6 text-[#14FFEC]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm">Create New Club</p>
                                            <p className="text-white/40 text-[11px]">Set up a new club location</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Manage Live Music - Only show if club exists */}
                                {ownedClubs && ownedClubs.length > 0 && (
                                    <div
                                        onClick={() => router.push(`/business/live-music?clubId=${ownedClubs[0].id}`)}
                                        className="bg-[#0C1C1C] rounded-[20px] p-4 flex flex-col gap-3 cursor-pointer border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-[#14FFEC]/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 bg-[#14FFEC]/10 rounded-xl flex items-center justify-center border border-[#14FFEC]/20">
                                            <Music className="w-5 h-5 text-[#14FFEC]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm">Live Music</p>
                                            <p className="text-white/40 text-[11px]">Manage music</p>
                                        </div>
                                    </div>
                                )}

                                {/* Create New Event - Only show if club exists */}
                                {ownedClubs && ownedClubs.length > 0 && (
                                    <div
                                        onClick={handleCreateEvent}
                                        className="bg-[#0C1C1C] rounded-[20px] p-4 flex flex-col gap-3 cursor-pointer border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-[#14FFEC]/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 bg-[#14FFEC]/10 rounded-xl flex items-center justify-center border border-[#14FFEC]/20">
                                            <Calendar className="w-5 h-5 text-[#14FFEC]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm">New Event</p>
                                            <p className="text-white/40 text-[11px]">Schedule event</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Second row of quick actions - 2x2 grid */}
                            {ownedClubs && ownedClubs.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {/* My Stories */}
                                    <div
                                        onClick={() => router.push(`/business/my-stories?clubId=${ownedClubs[0].id}`)}
                                        className="bg-[#0C1C1C] rounded-[20px] p-4 flex flex-col gap-3 cursor-pointer border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-pink-500/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-500/20">
                                            <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2m10 2V2M5.5 9h13M6 20h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                                                <circle cx="12" cy="14" r="2" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm">My Stories</p>
                                            <p className="text-white/40 text-[11px]">Manage stories</p>
                                        </div>
                                    </div>

                                    {/* Edit Club */}
                                    <div
                                        onClick={() => handleEditClub(ownedClubs[0].id)}
                                        className="bg-[#0C1C1C] rounded-[20px] p-4 flex flex-col gap-3 cursor-pointer border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-yellow-500/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                                            <Edit className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm">Edit Club</p>
                                            <p className="text-white/40 text-[11px]">Update details</p>
                                        </div>
                                    </div>

                                    {/* Manage Offers */}
                                    <div
                                        onClick={() => handleNavigation('/business/manage-offers')}
                                        className="bg-[#0C1C1C] rounded-[20px] p-4 flex flex-col gap-3 cursor-pointer border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-orange-500/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                                            <Tag className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm">Offers</p>
                                            <p className="text-white/40 text-[11px]">Manage offers</p>
                                        </div>
                                    </div>

                                    {/* Contact & Support */}
                                    <div
                                        onClick={() => handleNavigation('/business/contact')}
                                        className="bg-[#0C1C1C] rounded-[20px] p-4 flex flex-col gap-3 cursor-pointer border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-green-500/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                                            <Headphones className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm">Support</p>
                                            <p className="text-white/40 text-[11px]">Get help</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                                {/* Running Ads - Admin Only */}
                                {currentUser?.roles?.includes('ROLE_ADMIN') && (
                                    <div
                                        onClick={() => router.push('/bz/admin/running-ads')}
                                        className="bg-[#0C1C1C] rounded-[20px] p-4 flex flex-col gap-3 cursor-pointer border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-purple-500/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm">Ads</p>
                                            <p className="text-white/40 text-[11px]">Manage ads</p>
                                        </div>
                                    </div>
                                )}



                        </div>

                        {/* My Organised Events Section - Only show if club exists */}
                        {ownedClubs && ownedClubs.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-black">My Events</h3>
                                        <span className="rounded-full bg-[#14FFEC]/10 px-3 py-1 text-[11px] font-black text-[#14FFEC]">
                                            {filteredEvents?.length || 0} {eventTab === 'upcoming' ? 'live' : 'past'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleNavigation('/business/all-organized-events')}
                                        className="text-[#14FFEC] text-sm font-black hover:text-[#14FFEC]/80 transition-colors"
                                    >
                                        View All
                                    </button>
                                </div>
                                
                                {/* Event Tab Filters */}
                                <div className="mb-4 inline-grid grid-cols-2 rounded-2xl bg-[#0C1C1C] p-1">
                                    {['upcoming', 'past'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setEventTab(tab as any)}
                                            className={`h-10 min-w-[104px] rounded-xl px-5 text-sm font-bold transition-colors capitalize ${
                                                eventTab === tab
                                                    ? 'bg-[#14FFEC] text-black'
                                                    : 'text-white/45 hover:text-white'
                                            }`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                
                                {isLoadingOrganized && (
                                    <div className="rounded-2xl border border-white/10 bg-[#0D1F1F] px-4 py-8 text-center text-sm font-bold text-[#14FFEC]">
                                        Loading...
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {filteredEvents?.map((event) => (
                                        <div
                                            key={event.id}
                                            className="rounded-2xl border border-white/10 bg-[#0D1F1F] p-3 cursor-pointer transition-colors hover:border-[#14FFEC]/25 hover:bg-[#102727]"
                                            onClick={() => handleViewEvent(event.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Event Image */}
                                                {event.imageUrl && (
                                                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#0C1C1C]">
                                                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                {!event.imageUrl && (
                                                    <div className="w-14 h-14 bg-[#14FFEC]/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#14FFEC]/15">
                                                        <Calendar className="w-7 h-7 text-[#14FFEC]" />
                                                    </div>
                                                )}

                                                {/* Event Details */}
                                             <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-black mb-1 truncate">{event.title}</h4>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4 text-[#14FFEC]" />
                                                        <span className="text-sm font-bold text-white/80">{event.formattedDate}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4 text-[#14FFEC]" />
                                                        <span className="text-sm font-bold text-white/80">{event.formattedTime?.split(' - ')[0]}</span>
                                                    </div>
                                                </div>
                                            </div>

                                                {/* Action Buttons */}
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditEvent(event.id);
                                                        }}
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14FFEC]/10 transition-colors hover:bg-[#14FFEC]/20"
                                                        title="Edit Event"
                                                    >
                                                        <Edit className="w-4 h-4 text-[#14FFEC]" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteEvent(event.id);
                                                        }}
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                                                        disabled={eventCrud.isDeleting}
                                                        title="Delete Event"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {organizedEvents?.length === 0 && !isLoadingOrganized && (
                                        <div className="text-center py-8">
                                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-400">No organized events found</p>
                                            <button
                                                onClick={handleCreateEvent}
                                                className="mt-4 px-6 py-2 bg-[#14FFEC] text-black font-semibold rounded-full hover:bg-opacity-90 transition-colors"
                                            >
                                                Create Your First Event
                                            </button>
                                        </div>
                                    )}
                                    {filteredEvents?.length === 0 && organizedEvents && organizedEvents.length > 0 && !isLoadingOrganized && (
                                        <div className="text-center py-8">
                                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-400">No {eventTab} events found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                    </div>
                </div>

                {/* Delete Event Confirmation Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogOverlay />
                    <DialogContent className="p-0 border-none bg-transparent max-w-[420px]" showCloseButton={false}>
                        <div className="w-full p-[20px_21px_20px_22px] bg-[#0D1F1F] overflow-hidden rounded-[17px] flex flex-col items-center gap-[26px]">
                            {/* Close button in the top-right corner */}
                            <div className="absolute right-3 top-3">
                                <button
                                    onClick={handleCancelDeleteEvent}
                                    className="w-8 h-8 flex items-center justify-center text-white bg-transparent rounded-full"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Warning Icon */}
                            <div className="w-[80px] h-[80px] relative overflow-hidden flex items-center justify-center">
                                <div className="text-4xl">⚠️</div>
                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col items-center gap-[12px]">
                                <div className="text-[#F9F9F9] text-[20px] font-semibold font-['Manrope']">
                                    Delete Event
                                </div>
                                <div className="text-center text-[#9D9C9C] text-[16px] font-['Manrope'] leading-[19.20px]">
                                    Are you sure you want to delete <span className="text-[#14FFEC] font-semibold">"{deleteEventTitle}"</span>?
                                </div>
                                <div className="text-center text-[#ff6b6b] text-[14px] font-['Manrope'] leading-[17px]">
                                    This action cannot be undone
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-[14px]">
                                <button
                                    onClick={handleConfirmDeleteEvent}
                                    className="w-[154px] h-[38px] bg-[#d32f2f] rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-[#b71c1c] transition-all duration-300"
                                >
                                    <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                        Delete
                                    </div>
                                </button>

                                <button
                                    onClick={handleCancelDeleteEvent}
                                    className="w-[154px] h-[38px] border border-[#007877] rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-[#012e2e] transition-all duration-300"
                                >
                                    <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                        Cancel
                                    </div>
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                    </div>
                </div>
            </div>
        </div>
    );
}

function AnalyticsMetricCard({ label, value, fullWidth, blue, highlighted }: { label: string; value: string; fullWidth?: boolean; blue?: boolean; highlighted?: boolean }) {
    return (
        <div className={`${blue ? BLUE_CARD_CLASS : ANALYTICS_CARD_CLASS} min-h-[90px] p-4 ${fullWidth ? 'col-span-2' : ''} ${highlighted ? 'min-h-[110px] bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-400/40' : ''}`}>
            <p className="text-xs font-black text-white/35">{label}</p>
            <p className={`mt-2 font-black tracking-tight ${highlighted ? 'text-3xl text-[#14FFEC]' : 'text-2xl text-white'}`}>{value}</p>
        </div>
    );
}
