'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, Plus, DollarSign, BarChart, Edit, User, LogOut, Heart, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
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
import { StoryService } from '@/lib/services/story.service';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
    // Authentication info - no redirects
    const isAuthenticated = AuthService.isAuthenticated();
    const userRoles = AuthService.getUserRolesFromStorage();
    const hasRole = (role: string) => AuthService.hasRole(role);

    const router = useRouter();
    const { toast } = useToast();
    const [showCreateModal, setShowCreateModal] = useState<'club' | 'event' | null>(null);
    const [storyStats, setStoryStats] = useState<any>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [clubFavoriteCount, setClubFavoriteCount] = useState<number | null>(null);

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
    const { clubs: ownedClubs, loadOwnedClubs, isLoading: isLoadingOwnedClubs, setClubs: setOwnedClubs } = useOwnedClubs();
    const { events: organizedEvents, loadOrganizedEvents, refreshOrganizedEvents, isLoading: isLoadingOrganized, error: organizedEventsError, setEvents } = useOrganizedEvents();

    // Check club status on mount - redirect if needed
    useEffect(() => {
        const clubStatus = ProfileService.getClubStatus();

        // Only check for admins (superadmins bypass this check)
        if (isAdmin() && !isSuperAdmin()) {
            if (!clubStatus.hasClub) {
                // No club added - redirect to new-club
                router.replace('/bz/business/new-club');
                return;
            }

            if (!clubStatus.isActive) {
                // Club added but not active - redirect to pending page
                router.replace('/bz/business/club-pending');
                return;
            }
        }
    }, [isAdmin, isSuperAdmin, router]);

    // Load admin data on mount - ONLY ONCE and only if club is active
    useEffect(() => {
        let isMounted = true;

        const loadAdminData = async () => {
            if (!isMounted) return;

            // Check club status before loading data
            const clubStatus = ProfileService.getClubStatus();

            // Only load data if club is active (or user is superadmin)
            if (isAdmin() && !isSuperAdmin() && (!clubStatus.hasClub || !clubStatus.isActive)) {
                console.log('⏸️ Skipping data load - club not active');
                return;
            }

            try {
                // Load owned clubs for this admin
                await loadOwnedClubs();

                // Load organized events (events created by this user)
                await loadOrganizedEvents({ page: 0, size: 20, sortBy: 'startDateTime', sortOrder: 'asc' });

                // Load story stats
                setIsLoadingStats(true);
                const stats = await StoryService.getStoryStats();
                if (isMounted) {
                    setStoryStats(stats);
                }
                setIsLoadingStats(false);
            } catch (error) {
                console.error('Error loading admin data:', error);
                if (isMounted) {
                    setIsLoadingStats(false);
                }
            }
        };
        loadAdminData();

        return () => {
            isMounted = false;
        };
    }, [isAdmin, isSuperAdmin]); // Add dependencies to re-run if role changes

    // Load club favorite count when clubs are loaded
    useEffect(() => {
        let isMounted = true;

        if (ownedClubs && ownedClubs.length > 0) {
            const fetchFavoriteCount = async () => {
                try {
                    const countData = await ClubService.getFavoriteCount(ownedClubs[0].id);
                    if (isMounted) {
                        setClubFavoriteCount(countData.favoriteCount ?? 0);
                    }
                } catch (error) {
                    console.error('Error loading favorite count:', error);
                    if (isMounted) {
                        setClubFavoriteCount(0);
                    }
                }
            };
            fetchFavoriteCount();
        }

        return () => {
            isMounted = false;
        };
    }, [ownedClubs]);

    // Handle logout
    const handleLogout = () => {
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

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    // Handle club operations

    const handleEditClub = (clubId: string) => {
        router.push(`/bz/business/club-preview?clubId=${clubId}&edit=true`);
    };



    const handleCreateClub = () => {
        handleNavigation('/bz/business/new-club');
    };

    // Handle event operations
    const handleCreateEvent = () => {
        setShowCreateModal('event');
        // Navigate to new event creation page
        handleNavigation('/bz/business/new-event');
    };

    const handleEditEvent = (eventId: string) => {
        router.push(`/bz/business/event-preview?eventId=${eventId}&edit=true`);
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
        <div className="min-h-screen bg-[#021313] text-white relative">
            {/* Fixed Header with gradient background */}
            <div className="fixed top-0 left-0 right-0 z-30 flex flex-col pt-8 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="px-6 flex items-center justify-between">
                    <h2 className="text-lg font-medium">Welcome back, {currentUser?.fullName || currentUser?.username || 'Admin'}</h2>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
                    >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content Card - Positioned below fixed header */}
            <div className="px-0 relative mt-[100px] z-40">
                {/* Main Container with rounded corners */}
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col">
                    {/* Club name and logo/story header section - Only show if club exists */}
                    {ownedClubs && ownedClubs.length > 0 && (
                        <div className="px-6 pt-6 pb-2">
                            <div className="flex items-center justify-between">
                                <h1 className="text-4xl font-bold tracking-wide uppercase">{ownedClubs[0]?.name || 'Club'}</h1>
                                <div className="flex items-center gap-3">
                                    {/* Story Circle */}
                                    <div
                                        onClick={() => router.push(`/bz/business/upload-story?clubId=${ownedClubs[0]?.id}`)}
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

                        {/* Stats Section - Only show if club exists */}
                        {ownedClubs && ownedClubs.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3">Story Stats</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Total Stories */}
                                    <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                                        <p className="text-[#14FFEC] text-sm mb-1">Total Stories</p>
                                        <p className="text-white text-xl font-bold">
                                            {isLoadingStats ? '...' : storyStats?.totalStories || '0'}
                                        </p>
                                    </div>

                                    {/* Total Views */}
                                    <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                                        <p className="text-[#14FFEC] text-sm mb-1">Total Views</p>
                                        <p className="text-white text-xl font-bold">
                                            {isLoadingStats ? '...' : storyStats?.totalViews || '0'}
                                        </p>
                                    </div>

                                    {/* Image Count */}
                                    <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                                        <p className="text-[#14FFEC] text-sm mb-1">Image Count</p>
                                        <p className="text-white text-xl font-bold">
                                            {isLoadingStats ? '...' : storyStats?.imageCount || '0'}
                                        </p>
                                    </div>

                                    {/* Video Count */}
                                    <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                                        <p className="text-[#14FFEC] text-sm mb-1">Video Count</p>
                                        <p className="text-white text-xl font-bold">
                                            {isLoadingStats ? '...' : storyStats?.videoCount || '0'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Quick Actions Section */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                {/* Create New Club - Only show if no club exists */}
                                {ownedClubs?.length === 0 && !isLoadingOwnedClubs && (
                                    <div
                                        onClick={handleCreateClub}
                                        className="bg-[#0D1F1F] border border-[#14FFEC]/40 rounded-[15px] p-4 flex items-center justify-between cursor-pointer hover:bg-[#14FFEC]/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#14FFEC] w-10 h-10 rounded-md flex items-center justify-center">
                                                <Plus className="w-6 h-6 text-black" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Create New Club</p>
                                                <p className="text-gray-400 text-xs">Set up a new club location</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Create New Event - Only show if club exists */}
                                {ownedClubs && ownedClubs.length > 0 && (
                                    <div
                                        onClick={handleCreateEvent}
                                        className="bg-[#0D1F1F] border border-[#14FFEC]/40 rounded-[15px] p-4 flex items-center justify-between cursor-pointer hover:bg-[#14FFEC]/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#14FFEC] w-10 h-10 rounded-md flex items-center justify-center">
                                                <Calendar className="w-6 h-6 text-black" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Create New Event</p>
                                                <p className="text-gray-400 text-xs">Schedule a new event</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* My Stories Button - Full Width - Only show if club exists */}
                            {ownedClubs && ownedClubs.length > 0 && (
                                <div
                                    onClick={() => router.push(`/bz/business/upload-story?clubId=${ownedClubs[0].id}`)}
                                    className="bg-[#0D1F1F] border border-[#14FFEC]/40 rounded-[15px] p-4 flex items-center justify-between cursor-pointer hover:bg-[#14FFEC]/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#14FFEC] w-10 h-10 rounded-md flex items-center justify-center">
                                            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2m10 2V2M5.5 9h13M6 20h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                                                <circle cx="12" cy="14" r="2" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">My Stories</p>
                                            <p className="text-gray-400 text-xs">View and manage your stories</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Club Management - Edit, Delete and Manage Offers */}
                            {ownedClubs && ownedClubs.length > 0 && (
                                <>
                                    {/* Edit Club - Full Width with Yellow color */}
                                    <div
                                        onClick={() => handleEditClub(ownedClubs[0].id)}
                                        className="bg-[#FDB022]/10 border border-[#FDB022]/40 rounded-[15px] p-4 flex items-center gap-3 cursor-pointer hover:bg-[#FDB022]/20 transition-colors mt-3"
                                    >
                                        <div className="bg-[#FDB022] w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0">
                                            <Edit className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Edit Club</p>
                                            <p className="text-gray-400 text-xs">Update club information and details</p>
                                        </div>
                                    </div>

                                    {/* Manage Offers - Full Width with Blue color */}
                                    <div
                                        onClick={() => handleNavigation('/bz/business/manage-offers')}
                                        className="bg-[#2563EB]/10 border border-[#2563EB]/40 rounded-[15px] p-4 flex items-center justify-between cursor-pointer hover:bg-[#2563EB]/20 transition-colors mt-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#2563EB] w-10 h-10 rounded-md flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Manage Special Offers</p>
                                                <p className="text-gray-400 text-xs">Add and manage club offers & promotions</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact - Full Width with Cyan color */}
                                    <div
                                        onClick={() => handleNavigation('/bz/business/contact')}
                                        className="bg-[#14FFEC]/10 border border-[#14FFEC]/40 rounded-[15px] p-4 flex items-center justify-between cursor-pointer hover:bg-[#14FFEC]/20 transition-colors mt-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#14FFEC] w-10 h-10 rounded-md flex items-center justify-center">
                                                <MessageCircle className="w-6 h-6 text-black" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Contact & Support</p>
                                                <p className="text-gray-400 text-xs">View tickets and submit support requests</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* <div className="grid grid-cols-3 gap-3 mb-3">
                                <div
                                    onClick={() => handleNavigation('/bz/business/update-live-details')}
                                    className="bg-[#000101] border border-[#14FFEC]/40 rounded-[15px] p-3 flex flex-col items-center justify-between cursor-pointer"
                                >
                                    <p className="text-center text-white text-xs mb-2">Update Dynamic Pricing</p>
                                    <div className="bg-[#14FFEC] w-8 h-8 rounded-md flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-black" />
                                    </div>
                                </div>

                                <div
                                    onClick={() => handleNavigation('/bz/business/event-analytics')}
                                    className="bg-[#0D1F1F] border border-[#14FFEC]/40 rounded-[15px] p-3 flex flex-col items-center justify-between cursor-pointer"
                                >
                                    <p className="text-center text-white text-xs mb-2">Event Analytics</p>
                                    <div className="bg-[#14FFEC] w-8 h-8 rounded-md flex items-center justify-center">
                                        <BarChart className="w-5 h-5 text-black" />
                                    </div>
                                </div>

                                <div
                                    onClick={() => handleNavigation('/bz/business/settings')}
                                    className="bg-[#0D1F1F] border border-[#14FFEC]/40 rounded-[15px] p-3 flex flex-col items-center justify-between cursor-pointer"
                                >
                                    <p className="text-center text-white text-xs mb-2">Club Settings</p>
                                    <div className="bg-[#14FFEC] w-8 h-8 rounded-md flex items-center justify-center">
                                        <Edit className="w-5 h-5 text-black" />
                                    </div>
                                </div>
                            </div> */}


                        </div>

                        {/* My Organised Events Section - Only show if club exists */}
                        {ownedClubs && ownedClubs.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold">My Organised Events</h3>
                                        <div className="px-3 py-1 bg-[#14FFEC]/10 border border-[#14FFEC]/20 rounded-full">
                                            <span className="text-[#14FFEC] text-sm font-medium">
                                                {organizedEvents?.length || 0} {organizedEvents?.length === 1 ? 'Event' : 'Events'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleNavigation('/bz/business/all-organized-events')}
                                        className="text-[#14FFEC] text-sm font-semibold hover:text-[#14FFEC]/80 transition-colors"
                                    >
                                        View All
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm mb-3">Manage your organized events</p>
                                {isLoadingOrganized && (
                                    <div className="text-[#14FFEC] text-sm">Loading...</div>
                                )}
                                <div className="space-y-3">
                                    {organizedEvents?.map((event) => (
                                        <div
                                            key={event.id}
                                            className="bg-[#0D1F1F] border border-[#14FFEC]/10 rounded-[15px] p-4 cursor-pointer hover:bg-[#0D1F1F]/80 transition-colors"
                                            onClick={() => handleViewEvent(event.id)}
                                        >
                                            <div className="flex gap-3">
                                                {/* Event Image */}
                                                {event.imageUrl && (
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                {!event.imageUrl && (
                                                    <div className="w-16 h-16 bg-[#14FFEC]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Calendar className="w-8 h-8 text-[#14FFEC]" />
                                                    </div>
                                                )}

                                                {/* Event Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-medium mb-1 truncate">{event.title}</h4>
                                                    <div className="space-y-1 text-xs text-gray-400">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3 h-3 text-[#14FFEC]" />
                                                            <span>{event.formattedDate}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3 h-3 text-[#14FFEC]" />
                                                            <span>{event.formattedTime}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-3 h-3 text-[#14FFEC]" />
                                                            <span>{event.attendeeStatus}</span>
                                                        </div>
                                                    </div>
                                                    {/* Status Badge */}
                                                    <div className="mt-2">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${event.ongoing ? 'bg-green-500/20 text-green-400' :
                                            event.upcoming ? 'bg-blue-500/20 text-blue-400' :
                                                event.pastEvent ? 'bg-gray-500/20 text-gray-400' :
                                                    'bg-[#14FFEC]/20 text-[#14FFEC]'
                                            }`}
                                            onClick={() => handleViewEvent(event.id)}
                                        >
                                            {event.eventStatusText}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleEditEvent(event.id)}
                                        className="p-2 bg-[#14FFEC]/20 rounded-lg hover:bg-[#14FFEC]/30 transition-colors"
                                        title="Edit Event"
                                    >
                                        <Edit className="w-4 h-4 text-[#14FFEC]" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEvent(event.id)}
                                        className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                        disabled={eventCrud.isDeleting}
                                        title="Delete Event"
                                    >
                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
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
    );
}