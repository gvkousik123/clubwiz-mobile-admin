'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Share2,
    Heart,
    Calendar,
    Clock,
    MapPin,
    Music,
    Users,
    ThumbsUp,
    Ticket,
    ChevronLeft,
    ChevronDown,
    Edit3,
    Save,
    X,
    Trash2,
    Instagram,
    Music2,
    Upload,
    Image as ImageIcon,
    Video,
    Plus,
    Minus,
    Loader2
} from 'lucide-react';
import PageHeader from '@/components/common/page-header';
import BottomContinueButton from '@/components/common/bottom-continue-button';
import { EventService } from '@/lib/services/event.service';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import DatePicker from '@/components/common/date-picker';
import { formatDateTimeForAPI } from '@/lib/date-utils';

function EventPreviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId');
    const editMode = searchParams.get('edit') === 'true';
    const { toast } = useToast();

    // Redirect to new-event page if edit mode is requested
    useEffect(() => {
        if (editMode && eventId) {
            router.replace(`/bz/business/new-event?eventId=${eventId}`);
        }
    }, [editMode, eventId, router]);

    const [isLiked, setIsLiked] = useState(false);
    const [eventData, setEventData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Editing states
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState<number | null>(null);
    const [isAddingTicket, setIsAddingTicket] = useState(false);
    const [newTicket, setNewTicket] = useState<any>({ name: '', price: 0, currency: 'INR', quantity: 0 });

    // File upload refs
    const posterInputRef = React.useRef<HTMLInputElement>(null);
    const reelInputRef = React.useRef<HTMLInputElement>(null);
    const logoInputRef = React.useRef<HTMLInputElement>(null);

    // Load event data on mount
    useEffect(() => {
        const loadEventData = async () => {
            try {
                if (!eventId) {
                    setError('No event ID provided');
                    setIsLoading(false);
                    return;
                }

                // Use getEventDetails for comprehensive event information
                const response = await EventService.getEventDetails(eventId);
                console.log('Event details response:', response);

                // Handle both wrapped and direct response formats
                let eventDetails = null;
                if (response && typeof response === 'object') {
                    if (response.data) {
                        eventDetails = response.data;
                    } else if (response.id) {
                        // Direct event object
                        eventDetails = response;
                    }
                }

                if (eventDetails) {
                    setEventData(eventDetails);
                    // Extract clubId - can be direct property or nested in club object
                    const clubId = eventDetails.clubId || (eventDetails.club?.id);
                    const clubName = eventDetails.club?.name || '';

                    console.log('📋 Club Info:', { clubId, clubName });

                    // Initialize edit data with ALL possible fields
                    setEditData({
                        title: eventDetails.title || '',
                        location: eventDetails.location || '',
                        startDateTime: eventDetails.startDateTime || '',
                        endDateTime: eventDetails.endDateTime || '',
                        description: eventDetails.description || '',
                        category: eventDetails.category || '',
                        maxAttendees: eventDetails.maxAttendees || '',
                        requiresApproval: eventDetails.requiresApproval || false,
                        clubId: clubId || '',
                        clubName: clubName || '',
                        // Artist details
                        artistName: eventDetails.artistName || eventDetails.eventArtistName || '',
                        aboutArtist: eventDetails.aboutArtist || eventDetails.aboutEventArtist || '',
                        instagramHandle: eventDetails.instagramHandle || '',
                        spotifyHandle: eventDetails.spotifyHandle || '',
                        // Music genre
                        musicGenre: eventDetails.musicGenre || '',
                        // Event organizer
                        organizer: eventDetails.organizer || eventDetails.eventOrganizer || '',
                        // Creatives
                        eventImage: eventDetails.eventImage || eventDetails.imageUrl || '',
                        eventReel: eventDetails.eventReel || '',
                        organizerLogo: eventDetails.organizerLogo || eventDetails.eventOrganizerLogo || '',
                        // Ticket information
                        ticketTypes: eventDetails.ticketTypes || [],
                        hasLimitedTickets: eventDetails.hasLimitedTickets || false,
                        totalTickets: eventDetails.totalTickets || 0
                    });
                    setError(null);

                    // Fetch favorite count
                    try {
                        const countData = await EventService.getEventFavoriteCount(eventId);
                        setFavoriteCount(countData.favoriteCount ?? 0);
                    } catch {
                        setFavoriteCount(0);
                    }
                } else {
                    setError('Failed to load event data');
                }
            } catch (err) {
                console.error('Error loading event:', err);
                // Check if it's a 401/403 error - API client will handle logout
                if (err instanceof Error) {
                    const errorStatus = (err as any).response?.status;
                    if (errorStatus === 401 || errorStatus === 403) {
                        // Silent logout handled by API interceptor
                        setIsLoading(false);
                        return;
                    }
                }
                setError('Error loading event details');
            } finally {
                setIsLoading(false);
            }
        };

        loadEventData();
    }, [eventId]);

    const toggleLike = () => {
        setIsLiked(!isLiked);
    };

    const handleBookNow = () => {
        router.push(`/booking/slot?eventId=${eventId}`);
    };

    // Edit handlers
    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel editing - reset to original data
            const clubId = eventData?.clubId || eventData?.club?.id;
            const clubName = eventData?.club?.name || '';
            setEditData({
                title: eventData.title || '',
                location: eventData.location || '',
                startDateTime: eventData.startDateTime || '',
                endDateTime: eventData.endDateTime || '',
                description: eventData.description || '',
                category: eventData.category || '',
                maxAttendees: eventData.maxAttendees || '',
                requiresApproval: eventData.requiresApproval || false,
                clubId: clubId || '',
                clubName: clubName || '',
                // Artist details
                artistName: eventData.artistName || eventData.eventArtistName || '',
                aboutArtist: eventData.aboutArtist || eventData.aboutEventArtist || '',
                instagramHandle: eventData.instagramHandle || '',
                spotifyHandle: eventData.spotifyHandle || '',
                // Music genre
                musicGenre: eventData.musicGenre || '',
                // Event organizer
                organizer: eventData.organizer || eventData.eventOrganizer || '',
                // Creatives
                eventImage: eventData.eventImage || eventData.imageUrl || '',
                eventReel: eventData.eventReel || '',
                organizerLogo: eventData.organizerLogo || eventData.eventOrganizerLogo || '',
                // Ticket information
                ticketTypes: eventData.ticketTypes || [],
                hasLimitedTickets: eventData.hasLimitedTickets || false,
                totalTickets: eventData.totalTickets && eventData.totalTickets !== 0 ? eventData.totalTickets : ''
            });
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (field: string, value: any) => {
        setEditData((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddTicket = () => {
        if (newTicket.name && newTicket.price >= 0 && newTicket.quantity > 0) {
            const updatedTickets = [...(editData.ticketTypes || []), newTicket];
            setEditData((prev: any) => ({
                ...prev,
                ticketTypes: updatedTickets
            }));
            setNewTicket({ name: '', price: 0, currency: 'INR', quantity: 0 });
            setIsAddingTicket(false);
            toast({
                title: "Success",
                description: "Ticket type added successfully",
                variant: "default"
            });
        } else {
            toast({
                title: "Error",
                description: "Please fill in all required fields (name, price, quantity)",
                variant: "destructive"
            });
        }
    };

    const handleDeleteTicket = (index: number) => {
        const updatedTickets = (editData.ticketTypes || []).filter((_: any, i: number) => i !== index);
        setEditData((prev: any) => ({
            ...prev,
            ticketTypes: updatedTickets
        }));
        toast({
            title: "Success",
            description: "Ticket type removed",
            variant: "default"
        });
    };

    // Image upload handlers
    const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setEditData((prev: any) => ({
                    ...prev,
                    eventImage: event.target?.result as string
                }));
                toast({
                    title: "Success",
                    description: "Event poster uploaded",
                    variant: "default"
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setEditData((prev: any) => ({
                    ...prev,
                    eventReel: event.target?.result as string
                }));
                toast({
                    title: "Success",
                    description: "Event reel uploaded",
                    variant: "default"
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setEditData((prev: any) => ({
                    ...prev,
                    organizerLogo: event.target?.result as string
                }));
                toast({
                    title: "Success",
                    description: "Organizer logo uploaded",
                    variant: "default"
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async () => {
        if (!eventId) return;

        // Validate required fields
        if (!editData.title && !eventData?.title) {
            toast({
                title: 'Error',
                description: 'Event title is required',
                variant: 'destructive'
            });
            return;
        }

        if (!editData.description && !eventData?.description) {
            toast({
                title: 'Error',
                description: 'Event description is required',
                variant: 'destructive'
            });
            return;
        }

        if (!editData.startDateTime && !eventData?.startDateTime) {
            toast({
                title: 'Error',
                description: 'Event start date and time are required',
                variant: 'destructive'
            });
            return;
        }

        setIsSaving(true);
        try {
            // Ensure clubId is properly passed - fallback from multiple sources
            const clubId = editData.clubId || eventData?.clubId || eventData?.club?.id;

            const updateData = {
                title: editData.title || eventData?.title,
                description: editData.description || eventData?.description,
                location: editData.location || eventData?.location || "Club Location",
                locationText: "Club Location Text",
                locationMap: {
                    lat: 0,
                    lng: 0
                },
                startDateTime: editData.startDateTime || eventData?.startDateTime,
                endDateTime: editData.endDateTime || eventData?.endDateTime,
                maxAttendees: editData.maxAttendees ? parseInt(editData.maxAttendees) : (eventData?.maxAttendees || 500),
                isPublic: true,
                requiresApproval: editData.requiresApproval ?? eventData?.requiresApproval ?? false,
                clubId: clubId,
                // Artist details
                eventArtistName: editData.artistName || eventData?.eventArtistName || "",
                aboutEventArtist: editData.aboutArtist || eventData?.aboutEventArtist || "",
                instagramHandle: editData.instagramHandle || eventData?.instagramHandle || "",
                spotifyHandle: editData.spotifyHandle || eventData?.spotifyHandle || "",
                // Music genre and category
                musicGenre: editData.musicGenre || eventData?.musicGenre || "",
                category: editData.category || eventData?.category || "",
                // Organizer
                eventOrganizer: editData.organizer || eventData?.eventOrganizer || eventData?.organizer,
                // Ticket information
                ticketTypes: editData.ticketTypes && editData.ticketTypes.length > 0 ? editData.ticketTypes : (eventData?.ticketTypes || []),
                hasLimitedTickets: editData.hasLimitedTickets ?? eventData?.hasLimitedTickets ?? false,
                totalTickets: editData.totalTickets ? parseInt(editData.totalTickets) : (eventData?.totalTickets || null),
                // Image data (fallback to existing if not changed)
                eventImage: editData.eventImage || eventData?.eventImage || eventData?.imageUrl || null,
                eventReel: editData.eventReel || eventData?.eventReel || null,
                eventOrganizerLogo: editData.organizerLogo || eventData?.organizerLogo || eventData?.eventOrganizerLogo || null
            };

            console.log('📡 Updating event with data:', updateData);
            console.log('🔗 Club ID being sent:', clubId);
            const response = await EventService.updateEvent(eventId, updateData);

            if (response) {
                // Update local event data
                setEventData((prev: any) => ({
                    ...prev,
                    ...editData
                }));
                setIsEditing(false);
                toast({
                    title: 'Success',
                    description: 'Event updated successfully!',
                });
                // Navigate to all organized events after a short delay
                setTimeout(() => {
                    router.push('/business/all-organized-events');
                }, 1000);
            }
        } catch (error) {
            console.error('Error updating event:', error);
            // Check if it's a 401/403 error - API client will handle logout
            if (error instanceof Error && error.message) {
                const errorStatus = (error as any).response?.status;
                if (errorStatus === 401 || errorStatus === 403) {
                    // Silent logout handled by API interceptor
                    return;
                }
            }
            // Only show toast for non-auth errors
            toast({
                title: 'Error',
                description: 'Failed to update event. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!eventId) return;

        setIsDeleting(true);
        try {
            await EventService.deleteEvent(eventId);
            toast({
                title: 'Success',
                description: 'Event deleted successfully!',
            });
            router.push('/bz/business');
        } catch (error) {
            console.error('Error deleting event:', error);
            // Check if it's a 401/403 error - API client will handle logout
            if (error instanceof Error && error.message) {
                const errorStatus = (error as any).response?.status;
                if (errorStatus === 401 || errorStatus === 403) {
                    // Silent logout handled by API interceptor
                    return;
                }
            }
            // Only show toast for non-auth errors
            toast({
                title: 'Error',
                description: 'Failed to delete event. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleBackClick = () => {
        if (isEditing) {
            handleEditToggle(); // Cancel editing first
        }
        router.push('/bz/business');
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-[#14FFEC] rounded-full mx-auto mb-4 animate-pulse"></div>
                    <p>Loading event details...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error || !eventData) {
        return (
            <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || 'Event not found'}</p>
                    <button
                        onClick={() => router.push('/bz/business')}
                        className="px-6 py-2 bg-[#14FFEC] text-black rounded-full font-bold"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] text-white">

            {/* Hero Section with Event Image */}
            <div className="relative w-full bg-gray-900 overflow-hidden" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', maxHeight: '600px' }}>
                <img
                    src={eventData?.imageUrl || eventData?.image || "/event list/Rectangle 1.jpg"}
                    alt={eventData?.title || "Event"}
                    className="object-contain w-full h-full"
                    style={{ maxHeight: '600px', maxWidth: '100%' }}
                />

                {/* Gradient Overlay - darker version */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-[#021313] pointer-events-none" />

                {/* Back Button */}
                <div className="fixed top-4 left-4 flex items-center z-50">
                    <button
                        onClick={handleBackClick}
                        className="p-2 bg-[#005D5C]/60 backdrop-blur-sm rounded-full hover:bg-[#005D5C]/80 transition-all duration-300"
                    >
                        <ChevronLeft
                            size={20}
                            className="text-[#14FFEC]"
                        />
                    </button>
                </div>

                {/* Action Buttons - Edit and Delete */}
                <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                                className="bg-[#14FFEC] text-black py-2 px-4 rounded-full font-bold text-sm cursor-pointer hover:bg-[#10d4c4] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={handleEditToggle}
                                className="p-2 bg-[#005D5C]/60 backdrop-blur-sm rounded-full hover:bg-[#005D5C]/80 transition-all duration-300"
                            >
                                <X size={16} className="text-[#14FFEC]" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => router.push(`/bz/business/new-event?eventId=${eventId}`)}
                                className="p-2 bg-[#005D5C]/60 backdrop-blur-sm rounded-full hover:bg-[#005D5C]/80 transition-all duration-300"
                            >
                                <Edit3 size={16} className="text-[#14FFEC]" />
                            </button>
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                className="p-2 bg-red-600/60 backdrop-blur-sm rounded-full hover:bg-red-600/80 transition-all duration-300"
                            >
                                <Trash2 size={16} className="text-red-300" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Event Details Section */}
            <div className="w-full bg-[#021313] rounded-t-[40px] mt-10 relative z-10">
                <div className="px-4 pt-8 ">
                    {/* Club Name - Show in edit mode */}
                    {isEditing && (eventData?.club?.name || eventData?.clubId) && (
                        <div className="flex justify-center items-center mb-4 gap-2">
                            <span className="text-[#14FFEC] text-xs font-semibold uppercase">Club:</span>
                            <span className="text-white text-sm font-semibold">
                                {eventData?.club?.name || `ID: ${eventData?.clubId}`}
                            </span>
                        </div>
                    )}

                    {/* Event Title */}
                    <div className="flex justify-center items-center mb-7">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="bg-[#0D1F1F] text-white text-center text-xl font-['Manrope'] leading-8 tracking-[0.24px] rounded-lg px-4 py-2 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none w-full max-w-md"
                                placeholder="Event Title"
                            />
                        ) : (
                            <h1 className="text-white text-center text-xl font-['Manrope'] leading-8 tracking-[0.24px]">
                                {eventData?.title || ''}
                            </h1>
                        )}
                    </div>

                    {/* Action Icons */}
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <div className="w-[39px] h-[39px] bg-[#005D5C] rounded-full flex justify-center items-center">
                            <ThumbsUp size={24} className="text-[#14FFEC]" />
                        </div>
                        <div className="w-[39px] h-[39px] bg-[#005D5C] rounded-full flex justify-center items-center">
                            <Share2 size={24} className="text-[#14FFEC]" />
                        </div>
                        <div className="w-[39px] h-[39px] bg-[#005D5C] rounded-full flex justify-center items-center">
                            <Ticket size={24} className="text-[#14FFEC]" />
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-[39px] h-[39px] bg-[#005D5C] rounded-full flex justify-center items-center">
                                <Heart size={24} className="text-[#FF6B8A] fill-[#FF6B8A]" />
                            </div>
                            {favoriteCount !== null && (
                                <span className="text-white/70 text-[10px] font-semibold leading-none">{favoriteCount}</span>
                            )}
                        </div>
                    </div>

                    {/* Location Info */}
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <MapPin size={24} className="text-[#14FFEC]" />
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className="bg-[#0D1F1F] text-white font-['Manrope'] rounded-lg px-3 py-1 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none flex-1"
                                placeholder="Location"
                            />
                        ) : (
                            <p className="text-white font-['Manrope']">
                                {eventData?.location || eventData?.club?.name || ''}
                            </p>
                        )}
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-2 px-2">
                        <Calendar size={24} className="text-[#14FFEC]" />
                        <div className="bg-white/10 px-6 py-2 rounded-full flex-1">
                            {isEditing ? (
                                <input
                                    type="datetime-local"
                                    value={editData.startDateTime}
                                    min={new Date().toISOString().slice(0, 16)}
                                    onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                                    className="bg-transparent text-white font-['Manrope'] outline-none w-full"
                                />
                            ) : (
                                <p className="text-white font-['Manrope']">
                                    {eventData?.formattedDate || eventData?.startDateTime || ''} |
                                    {eventData?.formattedTime || ''}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-6">
                    <div className="w-5/6 h-[1px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent opacity-80"></div>
                </div>

                {/* Music Categories */}
                <div className="flex flex-wrap gap-2 px-6 mb-6">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editData.category}
                            onChange={(e) => handleInputChange('category', e.target.value)}
                            className="bg-[#0D1F1F] text-white rounded-full px-4 py-1 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                            placeholder="Category"
                        />
                    ) : (
                        <>
                            {eventData?.category ? (
                                <span className="px-4 py-1 bg-[#0D7377] text-white rounded-full text-sm border border-[#14FFEC]">
                                    {eventData.category}
                                </span>
                            ) : (
                                <span className="text-gray-400 px-6">No categories specified</span>
                            )}
                        </>
                    )}
                </div>

                {/* Max Attendees - Only show in edit mode */}
                {isEditing && (
                    <div className="px-6 mb-6">
                        <label className="text-white text-sm font-['Manrope'] mb-2 block">Max Attendees</label>
                        <input
                            type="number"
                            min="0"
                            value={editData.maxAttendees}
                            onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                            className="bg-[#0D1F1F] text-white rounded-lg px-4 py-2 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none w-full [appearance-none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            placeholder="Maximum number of attendees"
                        />
                    </div>
                )}

                {/* Requires Approval - Only show in edit mode */}
                {isEditing && (
                    <div className="px-6 mb-6">
                        <label className="flex items-center gap-3 text-white font-['Manrope'] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editData.requiresApproval}
                                onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                                className="w-4 h-4 text-[#14FFEC] bg-[#0D1F1F] border-[#14FFEC]/30 rounded focus:ring-[#14FFEC] focus:ring-2"
                            />
                            Requires manual approval for attendance
                        </label>
                    </div>
                )}

                {/* People Attending - Hide during edit mode */}
                {!isEditing && (
                    <div className="px-6 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                <img
                                    src="/event page going people/Frame 3896.png"
                                    alt="People attending"
                                    className="w-32 h-8 rounded-full object-cover"
                                />
                            </div>
                            <span className="text-white text-sm font-['Manrope']">
                                {eventData?.attendeeCount || 0}+ going in this event
                            </span>
                        </div>
                    </div>
                )}

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Artist Section - Show only in edit mode OR if data exists */}             {(isEditing || editData?.artistName || eventData?.artistName || eventData?.eventArtistName || editData?.aboutArtist || eventData?.aboutArtist || editData?.instagramHandle || eventData?.instagramHandle || editData?.spotifyHandle || eventData?.spotifyHandle) && (
                    <div className="px-6 mb-6">
                        <h2 className="text-white text-xl font-['Manrope'] mb-3">Artist Details</h2>
                        <div className="bg-[#0D1F1F] rounded-lg p-4 space-y-4">
                            {/* Artist Name */}
                            {(isEditing || editData?.artistName || eventData?.artistName || eventData?.eventArtistName) && (
                                <div className="space-y-2">
                                    <label className="text-[#14FFEC] text-sm font-semibold">Artist Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.artistName}
                                            onChange={(e) => handleInputChange('artistName', e.target.value)}
                                            className="w-full bg-[#021313] text-white rounded-lg px-4 py-2 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                            placeholder="Artist name"
                                        />
                                    ) : (
                                        <p className="text-white font-['Manrope'] px-4 py-2">
                                            {editData.artistName || eventData?.artistName || eventData?.eventArtistName || 'Not specified'}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* About Artist */}
                            {(isEditing || editData?.aboutArtist || eventData?.aboutArtist || eventData?.aboutEventArtist) && (
                                <div className="space-y-2">
                                    <label className="text-[#14FFEC] text-sm font-semibold">About Artist</label>
                                    {isEditing ? (
                                        <textarea
                                            value={editData.aboutArtist}
                                            onChange={(e) => handleInputChange('aboutArtist', e.target.value)}
                                            className="w-full bg-[#021313] text-white rounded-lg px-4 py-2 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none min-h-[80px]"
                                            placeholder="About the artist..."
                                        />
                                    ) : (
                                        <p className="text-white/80 text-sm font-['Manrope'] px-4 py-2">
                                            {editData.aboutArtist || eventData?.aboutArtist || eventData?.aboutEventArtist || 'Not specified'}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Social Handles */}
                            {(isEditing || editData?.instagramHandle || eventData?.instagramHandle || editData?.spotifyHandle || eventData?.spotifyHandle) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Instagram */}
                                    {(isEditing || editData?.instagramHandle || eventData?.instagramHandle) && (
                                        <div className="space-y-2">
                                            <label className="text-[#14FFEC] text-xs font-semibold flex items-center gap-1">
                                                <Instagram size={14} /> Instagram
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editData.instagramHandle}
                                                    onChange={(e) => handleInputChange('instagramHandle', e.target.value)}
                                                    className="w-full bg-[#021313] text-white rounded-lg px-3 py-1.5 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                                    placeholder="@username"
                                                />
                                            ) : (
                                                <p className="text-white text-sm px-3 py-1.5">
                                                    {editData.instagramHandle || eventData?.instagramHandle || 'Not specified'}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Spotify */}
                                    {(isEditing || editData?.spotifyHandle || eventData?.spotifyHandle) && (
                                        <div className="space-y-2">
                                            <label className="text-[#14FFEC] text-xs font-semibold flex items-center gap-1">
                                                <Music2 size={14} /> Spotify
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editData.spotifyHandle}
                                                    onChange={(e) => handleInputChange('spotifyHandle', e.target.value)}
                                                    className="w-full bg-[#021313] text-white rounded-lg px-3 py-1.5 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                                    placeholder="Spotify handle"
                                                />
                                            ) : (
                                                <p className="text-white text-sm px-3 py-1.5">
                                                    {editData.spotifyHandle || eventData?.spotifyHandle || 'Not specified'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                <div className="px-6 mb-8">
                    <h2 className="text-white text-xl font-['Manrope'] mb-3">Music Genre</h2>
                    <div className="bg-[#0D1F1F] rounded-lg p-4">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.musicGenre}
                                onChange={(e) => handleInputChange('musicGenre', e.target.value)}
                                className="w-full bg-[#021313] text-white rounded-lg px-4 py-2 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                placeholder="e.g., Techno, Bollywood, EDM"
                            />
                        ) : (
                            <p className="text-white font-['Manrope']">
                                {editData.musicGenre || eventData?.musicGenre || 'Not specified'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Separator Line */}
                {(isEditing || editData?.musicGenre || eventData?.musicGenre || editData?.endDateTime || eventData?.endDateTime) && (
                    <div className="flex justify-center my-4">
                        <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                    </div>
                )}

                {/* End Date/Time - Show only in edit mode OR if data exists */}
                {(isEditing || editData?.endDateTime || eventData?.endDateTime) && (
                    <div className="px-6 mb-6">
                        <h2 className="text-white text-xl font-['Manrope'] mb-3">End Date & Time</h2>
                        <div className="bg-[#0D1F1F] rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Calendar size={20} className="text-[#14FFEC]" />
                                {isEditing ? (
                                    <input
                                        type="datetime-local"
                                        value={editData.endDateTime}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                                        className="flex-1 bg-transparent text-white font-['Manrope'] outline-none"
                                    />
                                ) : (
                                    <p className="text-white font-['Manrope']">
                                        {editData.endDateTime || eventData?.endDateTime || 'Not specified'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Separator Line */}
                {(isEditing || editData?.endDateTime || eventData?.endDateTime || editData?.eventImage || eventData?.eventImage || editData?.eventReel || eventData?.eventReel || editData?.organizerLogo || eventData?.organizerLogo) && (
                    <div className="flex justify-center my-4">
                        <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                    </div>
                )}

                {/* Event Creatives Section - Show only in edit mode OR if data exists */}
                {(isEditing || editData?.eventImage || eventData?.eventImage || editData?.eventReel || eventData?.eventReel || editData?.organizerLogo || eventData?.organizerLogo) && (
                    <div className="px-6 mb-8">
                        <h2 className="text-white text-xl font-['Manrope'] mb-3">Event Creatives</h2>
                        {/* Hidden file inputs */}
                        <input
                            ref={posterInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePosterUpload}
                            className="hidden"
                        />
                        <input
                            ref={reelInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleReelUpload}
                            className="hidden"
                        />
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                        <div className="bg-[#0D1F1F] rounded-lg p-4 space-y-4">
                            {/* Event Poster */}
                            <div className="space-y-2">
                                <label className="text-[#14FFEC] text-sm font-semibold flex items-center gap-2">
                                    <ImageIcon size={16} /> Event Poster
                                </label>
                                <div className="bg-[#021313] rounded-lg p-3 min-h-[100px] flex items-center justify-center">
                                    {editData.eventImage || eventData?.eventImage || eventData?.imageUrl ? (
                                        <div className="w-full">
                                            <img
                                                src={editData.eventImage || eventData?.eventImage || eventData?.imageUrl}
                                                alt="Event Poster"
                                                className="w-full h-auto object-contain rounded-lg"
                                            />
                                            {isEditing && (
                                                <button 
                                                    onClick={() => posterInputRef.current?.click()}
                                                    className="mt-2 w-full bg-[#14FFEC]/20 text-[#14FFEC] py-2 rounded-lg text-sm font-semibold hover:bg-[#14FFEC]/30 transition-all">
                                                    Replace Poster
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-white/50">
                                            {isEditing ? (
                                                <button 
                                                    onClick={() => posterInputRef.current?.click()}
                                                    className="bg-[#14FFEC]/20 text-[#14FFEC] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#14FFEC]/30 transition-all flex items-center gap-2 mx-auto">
                                                    <Upload size={16} /> Upload Poster
                                                </button>
                                            ) : (
                                                <p>No poster uploaded</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Event Reel */}
                            <div className="space-y-2">
                                <label className="text-[#14FFEC] text-sm font-semibold flex items-center gap-2">
                                    <Video size={16} /> Event Reel/Video
                                </label>
                                <div className="bg-[#021313] border border-[#14FFEC]/20 rounded-xl p-3 min-h-[120px] flex flex-col items-center justify-center overflow-hidden">
                                    {(editData.eventReel || eventData?.eventReel || eventData?.reelUrl || eventData?.videoUrl) ? (
                                        <div className="w-full">
                                            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
                                                <video 
                                                    src={editData.eventReel || eventData?.eventReel || eventData?.reelUrl || eventData?.videoUrl} 
                                                    className="w-full h-full object-contain"
                                                    controls
                                                />
                                            </div>
                                            {isEditing && (
                                                <button 
                                                    onClick={() => reelInputRef.current?.click()}
                                                    className="w-full bg-[#14FFEC]/20 text-[#14FFEC] py-2 rounded-lg text-sm font-semibold hover:bg-[#14FFEC]/30 transition-all">
                                                    Replace Video
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-white/50 py-4">
                                            {isEditing ? (
                                                <button 
                                                    onClick={() => reelInputRef.current?.click()}
                                                    className="bg-[#14FFEC]/20 text-[#14FFEC] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#14FFEC]/30 transition-all flex items-center gap-2 mx-auto">
                                                    <Upload size={16} /> Upload Video
                                                </button>
                                            ) : (
                                                <p className="text-xs">No video uploaded</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Organizer Logo */}
                            <div className="space-y-2">
                                <label className="text-[#14FFEC] text-sm font-semibold flex items-center gap-2">
                                    <ImageIcon size={16} /> Organizer Logo
                                </label>
                                <div className="bg-[#021313] rounded-lg p-3 min-h-[80px] flex items-center justify-center">
                                    {editData.organizerLogo || eventData?.organizerLogo || eventData?.eventOrganizerLogo ? (
                                        <div className="w-full flex flex-col items-center">
                                            <img
                                                src={editData.organizerLogo || eventData?.organizerLogo || eventData?.eventOrganizerLogo}
                                                alt="Organizer Logo"
                                                className="w-20 h-20 object-cover rounded-full"
                                            />
                                            {isEditing && (
                                                <button 
                                                    onClick={() => logoInputRef.current?.click()}
                                                    className="mt-2 bg-[#14FFEC]/20 text-[#14FFEC] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#14FFEC]/30 transition-all">
                                                    Replace Logo
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-white/50">
                                            {isEditing ? (
                                                <button 
                                                    onClick={() => logoInputRef.current?.click()}
                                                    className="bg-[#14FFEC]/20 text-[#14FFEC] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#14FFEC]/30 transition-all flex items-center gap-2 mx-auto">
                                                    <Upload size={16} /> Upload Logo
                                                </button>
                                            ) : (
                                                <p>No logo uploaded</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                )}

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Ticket Types Section - Always show */}
                <div className="px-6 mb-6">
                    <h2 className="text-white text-xl font-['Manrope'] mb-3">Ticket Information</h2>
                    <div className="bg-[#0D1F1F] rounded-lg p-4 space-y-4">
                        {/* Has Limited Tickets */}
                        <div className="flex items-center justify-between">
                            <label className="text-white font-['Manrope']">Has Limited Tickets</label>
                            {isEditing ? (
                                <input
                                    type="checkbox"
                                    checked={editData.hasLimitedTickets}
                                    onChange={(e) => handleInputChange('hasLimitedTickets', e.target.checked)}
                                    className="w-5 h-5 text-[#14FFEC] bg-[#021313] border-[#14FFEC]/30 rounded focus:ring-[#14FFEC] focus:ring-2"
                                />
                            ) : (
                                <span className="text-[#14FFEC]">{editData.hasLimitedTickets || eventData?.hasLimitedTickets ? 'Yes' : 'No'}</span>
                            )}
                        </div>

                        {/* Total Tickets */}
                        <div className="space-y-2">
                            <label className="text-[#14FFEC] text-sm font-semibold">Total Tickets Available</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={editData.totalTickets || ''}
                                    onChange={(e) => handleInputChange('totalTickets', e.target.value)}
                                    className="w-full bg-[#021313] text-white rounded-lg px-4 py-2 border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                    placeholder="Enter total tickets"
                                />
                            ) : (
                                <p className="text-white font-['Manrope'] px-4 py-2">
                                    {editData.totalTickets || eventData?.totalTickets || 'Not specified'}
                                </p>
                            )}
                        </div>

                        {/* Ticket Types List */}
                        <div className="space-y-2">
                            <label className="text-[#14FFEC] text-sm font-semibold">Ticket Types</label>
                            {(editData.ticketTypes && editData.ticketTypes.length > 0) || (eventData?.ticketTypes && eventData.ticketTypes.length > 0) ? (
                                <div className="space-y-2">
                                    {(editData.ticketTypes || eventData?.ticketTypes || []).map((ticket: any, index: number) => {
                                        const coverAmount = ticket.redeemCover || ticket.fee || ticket.coverCharge || 0;
                                        const isGeneral = ticket.name?.toLowerCase().includes('general');
                                        return (
                                            <div key={index} className="bg-[#021313] rounded-lg p-3 flex justify-between items-center">
                                                <div>
                                                    <p className="text-white font-semibold">{ticket.name}</p>
                                                    <p className="text-white/60 text-sm">
                                                        {ticket.currency} {ticket.price} • Qty: {ticket.quantity}
                                                        {coverAmount > 0 && !isGeneral ? (
                                                            <span> • Cover: {ticket.currency} {coverAmount}</span>
                                                        ) : null}
                                                    </p>
                                                </div>
                                                {isEditing && (
                                                    <button 
                                                        onClick={() => handleDeleteTicket(index)}
                                                        className="text-red-400 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {isEditing && (
                                        <button 
                                            onClick={() => setIsAddingTicket(true)}
                                            className="w-full bg-[#14FFEC]/20 text-[#14FFEC] py-2 rounded-lg text-sm font-semibold hover:bg-[#14FFEC]/30 transition-all flex items-center justify-center gap-2">
                                            <Plus size={16} /> Add Ticket Type
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-white/50 mb-2">No ticket types configured</p>
                                    {isEditing && (
                                        <button 
                                            onClick={() => setIsAddingTicket(true)}
                                            className="bg-[#14FFEC]/20 text-[#14FFEC] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#14FFEC]/30 transition-all flex items-center gap-2 mx-auto">
                                            <Plus size={16} /> Add Ticket Type
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Description */}
                <div className="px-6 mb-8">
                    <h2 className="text-white text-xl font-['Manrope'] mb-3">About this Event</h2>
                    <div className="bg-[#0D1F1F] rounded-lg p-4 mb-2">
                        {isEditing ? (
                            <textarea
                                value={editData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="w-full bg-transparent text-white/80 text-sm leading-relaxed font-['Manrope'] outline-none border border-[#14FFEC]/30 rounded-lg p-2 focus:border-[#14FFEC] min-h-[120px]"
                                placeholder="Event description..."
                            />
                        ) : (
                            <p className="text-white/80 text-sm leading-relaxed font-['Manrope']">
                                {eventData?.description || editData.description || ''}
                            </p>
                        )}
                    </div>
                    {!isEditing && (eventData?.description || editData.description) && (
                        <button className="text-[#14FFEC] flex items-center justify-center w-full">
                            <ChevronDown size={20} />
                        </button>
                    )}
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Event Organizers - Show organizer and/or club */}
                {(eventData?.organizer || eventData?.club) && (
                    <div className="px-6 mb-8">
                        <h2 className="text-white text-xl font-['Manrope'] mb-3">Event Organised & Presented by</h2>
                        <div className="w-full p-4 bg-[#0D1F1F] rounded-[20px]">
                            <div className="flex items-center justify-start gap-8 flex-wrap">
                                {/* Show Organizer */}
                                {eventData?.organizer && (
                                    <div className="flex items-center gap-2">
                                        {eventData.organizer.avatar && (
                                            <img
                                                className="w-[51px] h-[51px] rounded-full object-cover"
                                                src={eventData.organizer.avatar}
                                                alt={eventData.organizer.fullName || eventData.organizer.displayName}
                                            />
                                        )}
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium leading-5">
                                            {eventData.organizer.fullName || eventData.organizer.displayName}
                                        </div>
                                    </div>
                                )}

                                {/* Show Club */}
                                {eventData?.club && (
                                    <div className="flex items-center gap-2">
                                        {eventData.club.logo && (
                                            <img
                                                className="w-[51px] h-[51px] rounded-full object-cover"
                                                src={eventData.club.logo}
                                                alt={eventData.club.name}
                                            />
                                        )}
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium leading-5">
                                            {eventData.club.name}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Favorite Count Badge — fixed on screen */}
            {favoriteCount !== null && (
                <div className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#005D5C] shadow-lg border border-[#14FFEC]/40">
                    <Heart className="w-4 h-4 text-[#FF6B8A] fill-[#FF6B8A]" />
                    <span className="text-white text-sm font-semibold">{favoriteCount}</span>
                    <span className="text-white/60 text-xs">saved</span>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogOverlay />
                <DialogContent className="p-0 border-none bg-transparent max-w-[420px]" showCloseButton={false}>
                    <div className="w-full p-[20px_21px_20px_22px] bg-[#0D1F1F] overflow-hidden rounded-[17px] flex flex-col items-center gap-[26px] relative">
                        {/* Close button */}
                        <div className="absolute right-3 top-3">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="w-8 h-8 flex items-center justify-center text-white bg-transparent rounded-full hover:bg-white/10 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Warning Icon */}
                        <div className="w-[80px] h-[80px] relative overflow-hidden flex items-center justify-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                                <Trash2 size={32} className="text-red-400" />
                            </div>
                        </div>

                        {/* Title and Message */}
                        <div className="flex flex-col items-center gap-[12px]">
                            <div className="text-[#F9F9F9] text-[20px] font-semibold font-['Manrope']">
                                Delete Event
                            </div>
                            <div className="text-[#A3A3A3] text-[14px] font-['Manrope'] text-center leading-relaxed">
                                Are you sure you want to delete "{eventData?.title || 'this event'}"? This action cannot be undone.
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-[14px]">
                            <button
                                onClick={handleDeleteEvent}
                                disabled={isDeleting}
                                className="w-[154px] h-[38px] bg-red-600 rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
                            >
                                <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px] flex items-center gap-2">
                                    {isDeleting && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                </div>
                            </button>

                            <button
                                onClick={() => setShowDeleteDialog(false)}
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

            {/* Add Ticket Type Modal */}
            <Dialog open={isAddingTicket} onOpenChange={setIsAddingTicket}>
                <DialogOverlay />
                <DialogContent className="p-0 border-none bg-transparent max-w-[420px]" showCloseButton={false}>
                    <div className="w-full p-6 bg-[#0D1F1F] overflow-hidden rounded-[17px] flex flex-col gap-6">
                        <div className="text-center">
                            <h3 className="text-white text-xl font-semibold">Add Ticket Type</h3>
                        </div>

                        <div className="w-full space-y-5">
                            {/* Ticket Name */}
                            <div className="space-y-3">
                                <label className="text-[#14FFEC] font-semibold text-base block px-5">Ticket Name *</label>
                                <div className="bg-[#021313] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                    <input
                                        type="text"
                                        placeholder="e.g., General Entry, VIP, etc."
                                        value={newTicket.name}
                                        onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Price and Quantity */}
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-3">
                                    <label className="text-[#14FFEC] font-semibold text-base block px-5">Price (INR) *</label>
                                    <div className="bg-[#021313] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            min={0}
                                            value={newTicket.price}
                                            onChange={(e) => setNewTicket({ ...newTicket, price: Math.max(0, parseInt(e.target.value) || 0) })}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <label className="text-[#14FFEC] font-semibold text-base block px-5">Quantity *</label>
                                    <div className="bg-[#021313] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            min={1}
                                            value={newTicket.quantity}
                                            onChange={(e) => setNewTicket({ ...newTicket, quantity: Math.max(1, parseInt(e.target.value) || 0) })}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full pt-4">
                            <button
                                onClick={() => setIsAddingTicket(false)}
                                className="flex-1 bg-[#0F6861] hover:bg-[#10766F] text-white py-3 rounded-[30px] font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddTicket}
                                className="flex-1 bg-[#14FFEC] hover:bg-[#12E6D6] text-black py-3 rounded-[30px] font-semibold transition-colors"
                            >
                                Add Ticket
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}

// Loading fallback component
function LoadingFallback() {
    return (
        <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 bg-[#14FFEC] rounded-full mx-auto mb-4 animate-pulse"></div>
                <p>Loading event details...</p>
            </div>
        </div>
    );
}

// Main page component with Suspense wrapper
export default function EventPreviewPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <EventPreviewContent />
        </Suspense>
    );
}


