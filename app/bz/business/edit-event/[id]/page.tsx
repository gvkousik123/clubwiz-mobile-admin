'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, Calendar, Clock, Music, User, Building2, Instagram, Music2, ImageIcon, VideoIcon, ChevronDown, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect, Suspense } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { EventService } from '@/lib/services/event.service';
import { ClubService } from '@/lib/services/club.service';
import { useToast } from '@/hooks/use-toast';
import DatePicker from '@/components/common/date-picker';
import TimePicker from '@/components/common/time-picker';
import { formatDateTimeForAPI, formatDateToDDMMYYYY, parseDDMMYYYYToDate } from '@/lib/date-utils';
import { buildGeneralPricingFromTickets, buildGuestListPricingFromTickets } from '@/lib/event-pricing-utils';
import { MusicGenreAutocomplete, MusicGenre } from '@/components/ui/music-genre-autocomplete';

interface Club {
    id: string;
    name: string;
    logo?: string;
}

interface TicketType {
    name: string;
    price: number;
    currency: string;
    quantity: number;
    isActive: boolean;
    redeemCover?: number;
    redeemBefore?: string;
    remark?: string;
}

function EditEventPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const eventId = params.id as string;
    const clubIdFromUrl = searchParams.get('clubId');
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const posterInputRef = useRef<HTMLInputElement>(null);
    const reelInputRef = useRef<HTMLInputElement>(null);

    // Image preview states
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [posterPreview, setPosterPreview] = useState<string | null>(null);
    const [reelPreview, setReelPreview] = useState<string | null>(null);

    const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null);
    const [existingReelUrl, setExistingReelUrl] = useState<string | null>(null);
    const [existingOrganizerLogoUrl, setExistingOrganizerLogoUrl] = useState<string | null>(null);

    // Loading state
    const [isLoadingEvent, setIsLoadingEvent] = useState(true);

    // Club management state
    const [clubs, setClubs] = useState<Club[]>([]);
    const [selectedClubId, setSelectedClubId] = useState<string>(clubIdFromUrl || '');
    const [showClubDropdown, setShowClubDropdown] = useState(false);
    const [loadingClubs, setLoadingClubs] = useState(true);

    const [selectedGenres, setSelectedGenres] = useState<MusicGenre[]>([]);
    const [activeTab, setActiveTab] = useState('details');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [dialogStage, setDialogStage] = useState<'confirm' | 'updating'>('confirm');
    const [formData, setFormData] = useState({
        eventName: '',
        artistName: '',
        aboutArtist: '',
        instagramHandle: '',
        spotifyHandle: '',
        eventDate: '',
        eventTime: '',
        musicGenre: '',
        description: '',
        organizer: '',
        organizerLogo: null as File | null,
        poster: null as File | null,
        reel: null as File | null,
        hasLimitedTickets: true,
        totalTickets: ''
    });

    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
        { name: 'General Entry', price: 999, currency: 'INR', quantity: 100, isActive: true }
    ]);
    const [newTicket, setNewTicket] = useState<TicketType>({ name: '', price: 0, currency: 'INR', quantity: 0, isActive: true });
    const [isAddingTicket, setIsAddingTicket] = useState(false);

    // Load event data on mount
    useEffect(() => {
        const loadEventData = async () => {
            try {
                setIsLoadingEvent(true);
                console.log('📡 Loading event data for ID:', eventId);

                const response = await EventService.getEventDetailsAdmin(eventId);

                if (response.success && response.data) {
                    const event = response.data as any;
                    console.log('✅ Event loaded:', event);

                    // Parse date and time from startDateTime
                    let eventDate = '';
                    let eventTime = '';
                    let endTime = '';
                    if (event.startDateTime) {
                        const dateObj = new Date(event.startDateTime);
                        eventDate = formatDateToDDMMYYYY(dateObj); // DD/MM/YYYY
                        eventTime = dateObj.toTimeString().slice(0, 5); // HH:MM
                    }
                    if (event.endDateTime) {
                        const endDateObj = new Date(event.endDateTime);
                        endTime = endDateObj.toTimeString().slice(0, 5); // HH:MM
                    }

                    // Set form data with proper null/undefined handling
                    setFormData({
                        eventName: event.title?.trim() || event.name?.trim() || '',
                        artistName: event.eventArtistName?.trim() || '',
                        aboutArtist: event.aboutEventArtist?.trim() || '',
                        instagramHandle: (event.instagramHandle?.trim() || event.igHandle?.trim()) || '',
                        spotifyHandle: (event.spotifyHandle?.trim() || event.spotifyUrl?.trim()) || '',
                        eventDate: eventDate,
                        eventTime: eventTime,
                        musicGenre: event.musicGenre || '',
                        description: event.description?.trim() || '',
                        organizer: (event.eventOrganizer?.trim() || event.location?.trim() || event.organizer?.trim()) || '',
                        organizerLogo: null,
                        poster: null,
                        reel: null,
                        hasLimitedTickets: event.hasLimitedTickets ?? (event.maxAttendees ? true : false),
                        totalTickets: event.totalTickets || event.maxAttendees || ''
                    });

                    // Load existing images for preview and retain original URLs for edit payloads
                    if (event.imageUrl) {
                        setPosterPreview(event.imageUrl);
                        setExistingPosterUrl(event.imageUrl);
                    }

                    const organizerLogoUrl = event.eventOrganizerLogo || event.organizerLogo || event.organizerLogoUrl;
                    if (organizerLogoUrl) {
                        setLogoPreview(organizerLogoUrl);
                        setExistingOrganizerLogoUrl(organizerLogoUrl);
                    }

                    const reelUrl = event.reelUrl || event.videoUrl;
                    if (reelUrl) {
                        setReelPreview(reelUrl);
                        setExistingReelUrl(reelUrl);
                    }

                    // Set club ID
                    if (event.clubId) {
                        setSelectedClubId(event.clubId);
                    } else if (event.club?.id) {
                        setSelectedClubId(event.club.id);
                    }

                    // Set ticket types if available
                    if (event.ticketTypes && event.ticketTypes.length > 0) {
                        const mappedTickets = event.ticketTypes.map((t: any) => ({
                            name: t.name || '',
                            price: t.price || 0,
                            currency: t.currency || 'INR',
                            quantity: t.quantity || 0,
                            isActive: t.isActive ?? true,
                            redeemCover: t.redeemCover || 0,
                            redeemBefore: t.redeemBefore || '',
                            remark: t.remark || ''
                        }));
                        setTicketTypes(mappedTickets);
                    }

                    // Set music genres
                    if (event.musicGenre) {
                        const genres = event.musicGenre.split(',').map((g: string) => ({
                            id: g.trim().toLowerCase().replace(/\s+/g, '-'),
                            label: g.trim()
                        }));
                        setSelectedGenres(genres);
                    }
                } else {
                    throw new Error('Failed to load event data');
                }
            } catch (error) {
                console.error('❌ Error loading event:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load event data. Please try again.',
                    variant: 'destructive'
                });
            } finally {
                setIsLoadingEvent(false);
            }
        };

        if (eventId) {
            loadEventData();
        }
    }, [eventId, toast]);

    // Load manageable clubs on component mount
    useEffect(() => {
        const loadClubs = async () => {
            try {
                setLoadingClubs(true);
                console.log('📡 Loading manageable clubs...');
                const response = await ClubService.getManageableClubs({ page: 0, size: 100 });

                let clubsList: Club[] = [];
                if (Array.isArray(response)) {
                    clubsList = response;
                } else if (response && typeof response === 'object') {
                    clubsList = Array.isArray((response as any).content) ? (response as any).content : Array.isArray(response) ? response : [];
                }

                console.log('✅ Clubs loaded:', clubsList);
                setClubs(clubsList);
            } catch (error) {
                console.error('❌ Error loading clubs:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load clubs. Please try again.',
                    variant: 'destructive'
                });
            } finally {
                setLoadingClubs(false);
            }
        };

        loadClubs();
    }, [toast]);

    const handleGoBack = () => {
        router.back();
    };

    const handleDeleteLogo = () => {
        setFormData({ ...formData, organizerLogo: null });
        setLogoPreview(null);
        setExistingOrganizerLogoUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDeletePoster = () => {
        setFormData({ ...formData, poster: null });
        setPosterPreview(null);
        setExistingPosterUrl(null);
        if (posterInputRef.current) {
            posterInputRef.current.value = '';
        }
    };

    const handleDeleteReel = () => {
        setFormData({ ...formData, reel: null });
        setReelPreview(null);
        setExistingReelUrl(null);
        if (reelInputRef.current) {
            reelInputRef.current.value = '';
        }
    };

    const handlePreviewEvent = () => {
        // Close dialog and go back to edit
        setShowConfirmDialog(false);
        setDialogStage('confirm');
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, organizerLogo: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, poster: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPosterPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, reel: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setReelPreview(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateEvent = () => {
        // Validate club selection
        if (!selectedClubId) {
            toast({
                title: 'Error',
                description: 'Please select a club before updating the event',
                variant: 'destructive'
            });
            return;
        }
        // Show confirmation dialog
        setShowConfirmDialog(true);
    };

    const handleConfirmUpdate = async () => {
        // Change to updating stage
        setDialogStage('updating');
        setIsUpdating(true);

        try {
            // Validate required fields
            if (!formData.eventName.trim()) {
                throw new Error('Event name is required');
            }

            if (!formData.description.trim()) {
                throw new Error('Event description is required');
            }

            if (!selectedClubId) {
                throw new Error('Please select a club for this event');
            }

            // Prepare event data for API with image support
            const startDateTime = formatDateTimeForAPI(formData.eventDate, formData.eventTime);

            if (!startDateTime) {
                throw new Error('Invalid date or time format');
            }

            const eventData: any = {
                title: formData.eventName.trim(),
                name: formData.eventName.trim(),
                description: formData.description.trim(),
                startDateTime: startDateTime,
                endDateTime: startDateTime,
                location: "Club Location",
                locationText: "Club Location Text",
                locationMap: {
                    lat: 0,
                    lng: 0
                },
                clubId: selectedClubId,
                maxAttendees: formData.totalTickets || 500,
                isPublic: true,
                requiresApproval: false,
                eventArtistName: formData.artistName,
                aboutEventArtist: formData.aboutArtist,
                instagramHandle: formData.instagramHandle,
                spotifyHandle: formData.spotifyHandle,
                musicGenre: selectedGenres.map(g => g.label).join(', '),
                eventOrganizer: formData.organizer,
                ticketTypes: ticketTypes,
                hasLimitedTickets: formData.hasLimitedTickets,
                totalTickets: formData.totalTickets
            };

            const { generalPricing } = buildGeneralPricingFromTickets(ticketTypes, true);
            const guestListPricing = buildGuestListPricingFromTickets(ticketTypes, undefined, true);

            if (generalPricing) {
                eventData.generalPricing = generalPricing;
            }
            if (guestListPricing) {
                eventData.guestListPricing = guestListPricing;
            }

            if (formData.poster) {
                // New poster file will be sent in multipart; omit imageUrl from JSON payload.
            } else if (existingPosterUrl) {
                eventData.imageUrl = existingPosterUrl;
            } else if (existingPosterUrl === null) {
                eventData.imageUrl = null;
            }

            if (formData.reel) {
                // New reel file will be sent in multipart; omit reelUrl from JSON payload.
            } else if (existingReelUrl) {
                eventData.reelUrl = existingReelUrl;
            } else if (existingReelUrl === null) {
                eventData.reelUrl = null;
            }

            if (formData.organizerLogo) {
                // New organizer logo file will be sent in multipart; omit eventOrganizerLogo from JSON payload.
            } else if (existingOrganizerLogoUrl) {
                eventData.eventOrganizerLogo = existingOrganizerLogoUrl;
            } else if (existingOrganizerLogoUrl === null) {
                eventData.eventOrganizerLogo = null;
            }

            const hasFiles = Boolean(formData.poster || formData.reel || formData.organizerLogo);
            console.log('🚀 Updating event with payload:', eventData);
            console.log('📸 Event Image:', formData.poster ? 'Updated' : 'Not changed');
            console.log('🎬 Event Reel:', formData.reel ? 'Updated' : 'Not changed');
            console.log('🏢 Organizer Logo:', formData.organizerLogo ? 'Updated' : 'Not changed');

            let response: any;
            if (hasFiles) {
                response = await EventService.updateEventMultipart(eventId, eventData, {
                    eventImage: formData.poster,
                    eventReel: formData.reel,
                    eventOrganizerLogo: formData.organizerLogo,
                    galleryImages: [],
                    performerImages: []
                }, true);
            } else {
                response = await EventService.updateEvent(eventId, eventData, true);
            }

            if (response && (response.success || response.data)) {
                console.log('✅ Event updated successfully:', response);

                toast({
                    title: 'Event Updated Successfully',
                    description: `Your event "${formData.eventName}" has been updated!`,
                    variant: 'default'
                });

                // Close the dialog and navigate back
                setShowConfirmDialog(false);
                setDialogStage('confirm');

                // Navigate back to the business dashboard
                router.replace('/bz/business');
            } else {
                throw new Error('Failed to update event - Invalid response');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update event. Please try again.';
            console.error('❌ Event update error:', error);

            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive'
            });

            setDialogStage('confirm');
            setIsUpdating(false);
        }
    };

    const handleAddTicket = () => {
        setIsAddingTicket(true);
    };

    const confirmAddTicket = () => {
        if (newTicket.name && newTicket.price >= 0) {
            setTicketTypes([...ticketTypes, newTicket]);
            setNewTicket({ name: '', price: 0, currency: 'INR', quantity: 0, isActive: true });
            setIsAddingTicket(false);
        } else {
            toast({
                title: "Error",
                description: "Enter valid ticket name and price",
                variant: 'destructive'
            });
        }
    };

    const handleDeleteTicket = (index: number) => {
        const updated = [...ticketTypes];
        updated.splice(index, 1);
        setTicketTypes(updated);
    };

    const tabs = [
        { id: 'details', label: 'Event Details' },
        { id: 'creatives', label: 'Event Creatives' },
        { id: 'tickets', label: 'Event Tickets' }
    ];

    if (isLoadingEvent) {
        return (
            <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#14FFEC] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#14FFEC]">Loading event...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            {/* Fixed Header with gradient background */}
            <div className="fixed top-0 left-0 right-0 z-30 flex flex-col pt-10 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="absolute top-10 left-6">
                    <button
                        onClick={handleGoBack}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all duration-300"
                    >
                        <span className="text-white text-xl font-bold">&lt;</span>
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <h1 className="text-xl font-bold text-white">Edit Event</h1>
                </div>
            </div>

            {/* Main Content Card - Positioned below fixed header */}
            <div className="px-0 relative mt-[100px] z-40">
                {/* Main Container with rounded corners */}
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col">
                    {/* Fixed header section that stays in place */}
                    <div className="w-full bg-[#021313] rounded-t-[40px]">
                        {/* Club Selector - Hidden in edit mode */}
                        {/* Editing events should not allow changing the club */}

                        {/* Heading container */}
                        <div className="w-full pb-2">
                            <div className="flex items-center justify-center pt-8 pb-4">
                                <h2 className="text-[28px] font-bold text-white text-center tracking-wider font-['Anton']">
                                    {selectedClubId ? clubs.find(c => c.id === selectedClubId)?.name || 'EDIT EVENT' : 'SELECT A CLUB'}
                                </h2>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="pl-6 pr-4 pt-1 pb-3 overflow-x-scroll scrollbar-hide bg-[#021313]">
                            <div className="flex items-center gap-4 min-w-max">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-6 py-[8px] rounded-[25px] text-[14px] font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? 'bg-[#14FFEC] text-black'
                                            : 'bg-[#004342] text-white hover:bg-[#005352]'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Form Content - Scrollable content area */}
                    <div className="px-6 pb-40 overflow-y-auto h-[calc(100vh-280px)] scrollbar-hide">
                        {activeTab === 'details' && (
                            <div className="space-y-5">
                                {/* Event Name */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Name *</label>
                                    </div>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                        <input
                                            type="text"
                                            value={formData.eventName}
                                            onChange={(e) => handleInputChange('eventName', e.target.value)}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                            placeholder="Event Name"
                                        />
                                    </div>
                                </div>

                                {/* Artist Name */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Artist Name</label>
                                    </div>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                        <input
                                            type="text"
                                            value={formData.artistName}
                                            onChange={(e) => handleInputChange('artistName', e.target.value)}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                            placeholder="Artist Name"
                                        />
                                    </div>
                                </div>

                                {/* About Artist */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">About Event Artist</label>
                                    </div>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-5">
                                        <textarea
                                            value={formData.aboutArtist}
                                            onChange={(e) => handleInputChange('aboutArtist', e.target.value)}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none resize-none h-[80px] text-base font-semibold"
                                            placeholder="About the artist"
                                        />
                                    </div>
                                </div>

                                {/* Social Handles */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Artist Social Handle</label>
                                    </div>
                                    <div className="flex gap-4 w-full">
                                        <div className="w-1/2 bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                            <input
                                                type="text"
                                                value={formData.instagramHandle}
                                                onChange={(e) => handleInputChange('instagramHandle', e.target.value)}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="Instagram Handle"
                                            />
                                        </div>
                                        <div className="w-1/2 bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                            <input
                                                type="text"
                                                value={formData.spotifyHandle}
                                                onChange={(e) => handleInputChange('spotifyHandle', e.target.value)}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="Spotify Handle"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Date and Time */}
                                <div className="flex gap-4 w-full">
                                    <div className="w-1/2 space-y-3">
                                        <DatePicker
                                            value={formData.eventDate}
                                            onChange={(date) => handleInputChange('eventDate', date)}
                                            placeholder="DD/MM/YYYY"
                                            label="Event Date *"
                                        />
                                    </div>
                                    <div className="w-1/2 space-y-3">
                                        <div className="px-5">
                                            <label className="text-[#14FFEC] font-semibold text-base">Start Time *</label>
                                        </div>
                                        <TimePicker
                                            value={formData.eventTime}
                                            onChange={(time) => handleInputChange('eventTime', time)}
                                            eventDate={formData.eventDate}
                                        />
                                    </div>
                                </div>

                                {/* Music Genre */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Music Genre</label>
                                    </div>
                                    <MusicGenreAutocomplete
                                        musicGenres={[]}
                                        selectedGenres={selectedGenres}
                                        onSelectionChange={setSelectedGenres}
                                        placeholder="Type to search music genres..."
                                    />
                                </div>

                                {/* Event Description */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Description *</label>
                                    </div>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[15px] px-5">
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none resize-none h-[80px] text-base font-semibold"
                                            placeholder="Write a description of the event..."
                                        />
                                    </div>
                                </div>

                                {/* Event Organizer */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Organizer</label>
                                    </div>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                        <div className="flex items-center gap-3">
                                            <Building2 size={20} className="text-[#14FFEC]" />
                                            <input
                                                type="text"
                                                value={formData.organizer}
                                                onChange={(e) => handleInputChange('organizer', e.target.value)}
                                                className="flex-1 bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="Event Organized by"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Event Organizer Logo */}
                                <div className="space-y-3 flex flex-col items-center">
                                    <div className="self-stretch px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Organizer logo</label>
                                    </div>
                                    {logoPreview ? (
                                        <div className="relative w-[180px] h-[180px] bg-[#0D1F1F] border border-[#14FFEC] rounded-[15px] flex flex-col items-center justify-center p-2 cursor-pointer overflow-hidden group">
                                            <img
                                                src={logoPreview}
                                                alt="Logo Preview"
                                                className="w-full h-full object-cover rounded-[13px]"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[13px] flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleFileUpload(fileInputRef)}
                                                    className="px-4 py-2 bg-[#14FFEC] text-black rounded-lg font-semibold hover:bg-[#14FFEC]/80 transition-all"
                                                >
                                                    Replace
                                                </button>
                                                <button
                                                    onClick={handleDeleteLogo}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => handleFileUpload(fileInputRef)}
                                            className="w-[180px] h-[180px] bg-[#0D1F1F] border border-[#14FFEC] rounded-[15px] flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-[#0D1F1F]/70 transition-all"
                                        >
                                            <img
                                                src="/admin/upload.svg"
                                                alt="Upload"
                                                width={40}
                                                height={40}
                                                className="mb-2"
                                            />
                                            <p className="text-white text-center text-sm font-semibold">Upload logo here</p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'creatives' && (
                            <div className="space-y-6 flex flex-col items-center">
                                {/* Event Poster */}
                                <div className="space-y-3 w-full">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Poster</label>
                                    </div>
                                    <div className="flex justify-center">
                                        {posterPreview ? (
                                            <div className="relative w-[280px] h-[380px] bg-[#0D1F1F] border border-[#14FFEC] rounded-[15px] flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden group">
                                                <img
                                                    src={posterPreview}
                                                    alt="Poster Preview"
                                                    className="w-full h-full object-cover rounded-[13px]"
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[13px] flex items-center justify-center gap-3 flex-col">
                                                    <button
                                                        onClick={() => handleFileUpload(posterInputRef)}
                                                        className="px-4 py-2 bg-[#14FFEC] text-black rounded-lg font-semibold hover:bg-[#14FFEC]/80 transition-all"
                                                    >
                                                        Replace
                                                    </button>
                                                    <button
                                                        onClick={handleDeletePoster}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => handleFileUpload(posterInputRef)}
                                                className="w-[280px] h-[380px] bg-[#0D1F1F] border border-[#14FFEC] rounded-[15px] flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-[#0D1F1F]/70 transition-all"
                                            >
                                                <ImageIcon size={50} className="text-[#14FFEC] mb-4" />
                                                <p className="text-white text-center font-semibold">Upload poster here</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={posterInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePosterChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Event Reel */}
                                <div className="space-y-3 w-full">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Reel</label>
                                    </div>
                                    <div className="flex justify-center">
                                        {reelPreview ? (
                                            <div className="relative w-[280px] h-[280px] bg-[#0D1F1F] border border-[#14FFEC] rounded-[15px] flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden group">
                                                <div className="w-full h-full flex flex-col items-center justify-center">
                                                    <VideoIcon size={50} className="text-[#14FFEC] mb-4" />
                                                    <p className="text-white text-center font-semibold text-sm break-words max-w-full">{reelPreview}</p>
                                                </div>
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[13px] flex items-center justify-center gap-3 flex-col">
                                                    <button
                                                        onClick={() => handleFileUpload(reelInputRef)}
                                                        className="px-4 py-2 bg-[#14FFEC] text-black rounded-lg font-semibold hover:bg-[#14FFEC]/80 transition-all"
                                                    >
                                                        Replace
                                                    </button>
                                                    <button
                                                        onClick={handleDeleteReel}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => handleFileUpload(reelInputRef)}
                                                className="w-[280px] h-[280px] bg-[#0D1F1F] border border-[#14FFEC] rounded-[15px] flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-[#0D1F1F]/70 transition-all"
                                            >
                                                <VideoIcon size={50} className="text-[#14FFEC] mb-4" />
                                                <p className="text-white text-center font-semibold">Upload reel here</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={reelInputRef}
                                        type="file"
                                        accept="video/*"
                                        onChange={handleReelChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'tickets' && (
                            <div className="space-y-6">
                                {/* Ticket Types */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Ticket Types</label>
                                    </div>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[15px] px-5">
                                        <div className="flex flex-col gap-4">
                                            {/* List Existing Tickets */}
                                            {ticketTypes.map((ticket, idx) => (
                                                <div key={idx} className="flex items-center justify-between border-b border-[#0C898B]/30 pb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 rounded-full border border-[#14FFEC] flex items-center justify-center">
                                                            <div className={`w-3 h-3 bg-[#14FFEC] rounded-full ${ticket.isActive ? '' : 'bg-gray-500'}`}></div>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-semibold">{ticket.name}</div>
                                                            <div className="text-xs text-gray-400">Qty: {ticket.quantity}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[#14FFEC] font-semibold">₹ {ticket.price}</span>
                                                        <button
                                                            onClick={() => handleDeleteTicket(idx)}
                                                            className="p-1 rounded-full text-red-500 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add New Ticket Form */}
                                            {isAddingTicket ? (
                                                <div className="bg-[#021313] p-4 rounded-xl space-y-3">
                                                    <input
                                                        placeholder="Ticket Name (e.g. VIP)"
                                                        className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-2 text-white"
                                                        value={newTicket.name}
                                                        onChange={e => setNewTicket({ ...newTicket, name: e.target.value })}
                                                    />
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Price"
                                                            min={0}
                                                            className="w-1/2 bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-2 text-white"
                                                            value={newTicket.price || ''}
                                                            onChange={e => setNewTicket({ ...newTicket, price: Math.max(0, parseInt(e.target.value) || 0) })}
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Qty"
                                                            min={1}
                                                            className="w-1/2 bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-2 text-white"
                                                            value={newTicket.quantity || ''}
                                                            onChange={e => setNewTicket({ ...newTicket, quantity: Math.max(1, parseInt(e.target.value) || 0) })}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Redeem Cover Amount (optional)"
                                                            min={0}
                                                            className="w-1/2 bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-2 text-white"
                                                            value={newTicket.redeemCover || ''}
                                                            onChange={e => setNewTicket({ ...newTicket, redeemCover: Math.max(0, parseInt(e.target.value) || 0) })}
                                                        />
                                                        <input
                                                            type="time"
                                                            placeholder="Redeem Before (optional)"
                                                            className="w-1/2 bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-2 text-white"
                                                            value={newTicket.redeemBefore || ''}
                                                            onChange={e => setNewTicket({ ...newTicket, redeemBefore: e.target.value })}
                                                        />
                                                    </div>
                                                    <input
                                                        placeholder="Remark (optional)"
                                                        className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-2 text-white"
                                                        value={newTicket.remark || ''}
                                                        onChange={e => setNewTicket({ ...newTicket, remark: e.target.value })}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={confirmAddTicket} className="flex-1 bg-[#14FFEC] text-black py-1 rounded-lg font-bold">Add</button>
                                                        <button onClick={() => setIsAddingTicket(false)} className="flex-1 bg-gray-700 text-white py-1 rounded-lg">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleAddTicket}
                                                    className="flex items-center justify-center gap-2 py-2 border border-dashed border-[#14FFEC] rounded-[15px] text-[#14FFEC] font-semibold"
                                                >
                                                    <span>+</span> Add New Ticket Type
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Availability */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Ticket Availability</label>
                                    </div>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[15px] px-5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-semibold">Limited Tickets</span>
                                            <div
                                                className="relative cursor-pointer"
                                                onClick={() => setFormData({ ...formData, hasLimitedTickets: !formData.hasLimitedTickets })}
                                            >
                                                <div className={`w-12 h-6 rounded-full transition-colors ${formData.hasLimitedTickets ? 'bg-[#14FFEC]' : 'bg-gray-600'}`}></div>
                                                <div className={`absolute top-0 w-6 h-6 bg-white rounded-full shadow transition-transform ${formData.hasLimitedTickets ? 'right-0' : 'left-0'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Number of Tickets */}
                                {formData.hasLimitedTickets && (
                                    <div className="space-y-3">
                                        <div className="px-5">
                                            <label className="text-[#14FFEC] font-semibold text-base">Total Tickets</label>
                                        </div>
                                        <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                            <input
                                                type="number"
                                                value={formData.totalTickets}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Keep empty string for placeholder, otherwise parse and remove leading zeros
                                                    if (value === '') {
                                                        setFormData({ ...formData, totalTickets: '' });
                                                    } else {
                                                        const numValue = parseInt(value.replace(/^0+/, '') || '0');
                                                        setFormData({ ...formData, totalTickets: numValue.toString() });
                                                    }
                                                }}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="100"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Save Button with Close Option */}
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <div className="w-full h-[80px] relative bg-[#0D1F1F] shadow-[0px_30px_30px_-40px_#00968A_inset] overflow-hidden rounded-t-[40px] border-t-2 border-[#14FFEC]">
                        <div className="flex justify-between items-center px-6 h-full gap-4">
                            {/* Close Button */}
                            <button
                                onClick={handleGoBack}
                                className="w-[45px] h-[45px] flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-[30px] transition-all"
                                title="Close and go back"
                            >
                                <span className="text-white text-xl font-bold">&lt;</span>
                            </button>
                            {/* Save Button */}
                            <button
                                onClick={handleUpdateEvent}
                                className="flex-1 h-[45px] max-w-[220px] bg-[#0F6861] hover:bg-[#10766F] rounded-[30px] flex justify-center items-center transition-all"
                                disabled={isUpdating}
                            >
                                <span className="text-center text-white text-[16px] font-['Manrope'] font-bold tracking-[0.05px]">
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogOverlay />
                <DialogContent className="p-0 border-none bg-transparent max-w-[420px]" showCloseButton={false}>
                    <div className="w-full p-[20px_21px_20px_22px] bg-[#0D1F1F] overflow-hidden rounded-[17px] flex flex-col items-center gap-[26px]">
                        {/* Close button in the top-right corner */}
                        <div className="absolute right-3 top-3">
                            <button
                                onClick={() => {
                                    setShowConfirmDialog(false);
                                    setDialogStage('confirm');
                                }}
                                className="w-8 h-8 flex items-center justify-center text-white bg-transparent rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        {dialogStage === 'confirm' ? (
                            <>
                                <div className="w-[133px] h-[102px] relative overflow-hidden flex items-center justify-center">
                                    <img
                                        src="/admin/confirm1.png"
                                        alt="Confirmation"
                                        width={133}
                                        height={102}
                                    />
                                </div>

                                <div className="flex flex-col items-center gap-[12px]">
                                    <div className="text-[#F9F9F9] text-[20px] font-semibold font-['Manrope']">
                                        Update Event
                                    </div>
                                    <div className="text-center text-[#9D9C9C] text-[16px] font-['Manrope'] leading-[19.20px]">
                                        You are about to update this event
                                    </div>
                                </div>

                                <div className="flex items-center gap-[14px]">
                                    <button
                                        onClick={handleConfirmUpdate}
                                        className="w-[154px] h-[38px] bg-[#007877] rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-[#008c8c] transition-all duration-300"
                                    >
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                            Update Event
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setShowConfirmDialog(false)}
                                        className="w-[154px] h-[38px] border border-[#007877] rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-[#012e2e] transition-all duration-300"
                                    >
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                            Cancel
                                        </div>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Loading animation */}
                                <div className="w-20 h-20 relative mb-2">
                                    <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-4 border-r-transparent animate-spin border-[#14FFEC]"></div>
                                </div>

                                <div className="flex flex-col items-center gap-[12px]">
                                    <div className="text-[#F9F9F9] text-[20px] font-semibold font-['Manrope']">
                                        Updating your event
                                    </div>
                                </div>

                                <div className="flex items-center gap-[14px]">
                                    <button
                                        onClick={() => {
                                            setShowConfirmDialog(false);
                                            setDialogStage('confirm');
                                        }}
                                        className="w-[154px] h-[38px] border border-[#007877] rounded-[30px] flex justify-center items-center"
                                    >
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                            Close
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function EditEventPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-r-transparent animate-spin border-[#14FFEC]"></div>
            </div>
        }>
            <EditEventPageContent />
        </Suspense>
    );
}
