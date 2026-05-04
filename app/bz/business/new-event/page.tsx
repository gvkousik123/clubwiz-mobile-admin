'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, Calendar, Clock, Music, User, Building2, Instagram, Music2, ImageIcon, VideoIcon, ChevronDown, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import './styles.css';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { EventService } from '@/lib/services/event.service';
import { ClubService } from '@/lib/services/club.service'; // FIXED: #2 — Using getMyClubs instead of getAllClubsAdmin
import { useToast } from '@/hooks/use-toast';
import DatePicker from '@/components/common/date-picker';
import { formatDateTimeForAPI } from '@/lib/date-utils';
import { MusicGenreAutocomplete, MusicGenre } from '@/components/ui/music-genre-autocomplete';
import { fileToBase64 } from '@/lib/image-utils';

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

function NewEventPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const posterInputRef = useRef<HTMLInputElement>(null);
    const reelInputRef = useRef<HTMLInputElement>(null);

    // Club management state
    const [clubs, setClubs] = useState<Club[]>([]);
    const [selectedClubId, setSelectedClubId] = useState<string>('');
    const [showClubDropdown, setShowClubDropdown] = useState(false);
    const [loadingClubs, setLoadingClubs] = useState(true);

    // Image preview states
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [posterPreview, setPosterPreview] = useState<string | null>(null);
    const [reelPreview, setReelPreview] = useState<string | null>(null);

    const [selectedGenres, setSelectedGenres] = useState<MusicGenre[]>([]);
    const [activeTab, setActiveTab] = useState('details');
    const [selectedRestriction, setSelectedRestriction] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [dialogStage, setDialogStage] = useState<'confirm' | 'creating'>('confirm');
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

    // FIXED: #5 — Form validation state for tab navigation
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [tabValidation, setTabValidation] = useState<Record<string, boolean>>({ details: false, creatives: false, tickets: false });

    // FIXED: #1 & #2 — Use getMyClubs (user-scoped) instead of getAllClubsAdmin (admin-only)
    useEffect(() => {
        const loadClubs = async () => {
            try {
                setLoadingClubs(true);
                console.log('📡 Loading my clubs via /clubs/my-clubs...');
                const response = await ClubService.getMyClubs();

                // FIXED: #1 — getMyClubs returns ApiResponse<MyClubItem[]>
                let clubsList: Club[] = [];
                if (Array.isArray(response)) {
                    clubsList = response;
                } else if (response && typeof response === 'object' && 'data' in response) {
                    clubsList = Array.isArray((response as any).data) ? (response as any).data : [];
                }

                console.log('✅ My clubs loaded:', clubsList);
                setClubs(clubsList);

                // FIXED: #1 — Auto-select the first club from my-clubs (no "please select" error)
                if (clubsList.length > 0) {
                    setSelectedClubId(clubsList[0].id);
                    console.log('✅ Auto-selected club:', clubsList[0].name, '(ID:', clubsList[0].id + ')');
                }
            } catch (error) {
                console.error('❌ Error loading clubs:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load club. Please try again.',
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

    const handlePreviewEvent = () => {
        // Close dialog and go back to edit
        setShowConfirmDialog(false);
        setDialogStage('confirm');
        // Could also navigate to a preview page if needed
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleFileUpload = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, organizerLogo: file });
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteLogo = () => {
        setFormData({ ...formData, organizerLogo: null });
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, poster: file });
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPosterPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeletePoster = () => {
        setFormData({ ...formData, poster: null });
        setPosterPreview(null);
        if (posterInputRef.current) {
            posterInputRef.current.value = '';
        }
    };

    const handleReelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, reel: file });
            // Create preview (for video, we'll show file name instead)
            const reader = new FileReader();
            reader.onloadend = () => {
                setReelPreview(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteReel = () => {
        setFormData({ ...formData, reel: null });
        setReelPreview(null);
        if (reelInputRef.current) {
            reelInputRef.current.value = '';
        }
    };

    // FIXED: #5 — Validate fields for a specific tab
    const validateTab = useCallback((tabId: string): Record<string, string> => {
        const errors: Record<string, string> = {};
        if (tabId === 'details') {
            if (!formData.eventName.trim()) errors.eventName = 'Event name is required';
            if (!formData.artistName.trim()) errors.artistName = 'Artist name is required';
            if (!formData.aboutArtist.trim()) errors.aboutArtist = 'About artist is required';
            if (!formData.eventDate.trim()) errors.eventDate = 'Event date is required';
            if (!formData.eventTime.trim()) errors.eventTime = 'Start time is required';
            if (!formData.description.trim()) errors.description = 'Event description is required';
            if (!formData.organizer.trim()) errors.organizer = 'Event organizer is required';
        }
        if (tabId === 'creatives') {
            if (!formData.poster) errors.poster = 'Event poster is required';
        }
        if (tabId === 'tickets') {
            if (ticketTypes.length === 0) errors.ticketTypes = 'At least one ticket type is required';
            if (formData.hasLimitedTickets) {
                const tickets = typeof formData.totalTickets === 'string' ? parseInt(formData.totalTickets) : formData.totalTickets;
                if (!tickets || tickets < 1) errors.totalTickets = 'Ticket count must be at least 1';
            }
        }
        return errors;
    }, [formData, ticketTypes]);

    // FIXED: #5 — Handle tab switch with validation
    const handleTabSwitch = useCallback((tabId: string) => {
        // Validate current tab before switching
        const currentErrors = validateTab(activeTab);
        setFieldErrors(prev => ({ ...prev, ...currentErrors }));

        if (Object.keys(currentErrors).length > 0) {
            // Show errors but still allow switching (soft approach)
            // Update tab validation status
            setTabValidation(prev => ({ ...prev, [activeTab]: false }));
        } else {
            setTabValidation(prev => ({ ...prev, [activeTab]: true }));
        }
        setActiveTab(tabId);
    }, [activeTab, validateTab]);

    // FIXED: #5 — Full form validation across all tabs on save
    const handleSaveEvent = () => {
        // FIXED: #1 — No more "please select a club" error gate when my-clubs returns a club
        if (!selectedClubId) {
            toast({
                title: 'Error',
                description: 'No club found. Please create a club first.',
                variant: 'destructive'
            });
            return;
        }

        // FIXED: #5 — Validate ALL tabs and jump to first tab with errors
        const allErrors: Record<string, string> = {};
        const tabOrder = ['details', 'creatives', 'tickets'];
        let firstErrorTab: string | null = null;

        for (const tab of tabOrder) {
            const tabErrors = validateTab(tab);
            Object.assign(allErrors, tabErrors);
            if (Object.keys(tabErrors).length > 0 && !firstErrorTab) {
                firstErrorTab = tab;
            }
            setTabValidation(prev => ({ ...prev, [tab]: Object.keys(tabErrors).length === 0 }));
        }

        setFieldErrors(allErrors);

        if (firstErrorTab) {
            setActiveTab(firstErrorTab);
            toast({
                title: 'Incomplete Form',
                description: 'Please fill in all required fields before creating an event.',
                variant: 'destructive'
            });
            return;
        }

        // Show confirmation dialog
        setShowConfirmDialog(true);
    };

    const handleConfirmCreate = async () => {
        // Change to creating stage
        setDialogStage('creating');
        setIsCreating(true);

        try {
            // 🔴 CRITICAL: Validate required fields
            if (!formData.eventName.trim()) {
                throw new Error('Event name is required');
            }

            if (!formData.description.trim()) {
                throw new Error('Event description is required');
            }

            if (!formData.organizer.trim()) {
                throw new Error('Event organizer is required');
            }

            if (!selectedClubId) {
                throw new Error('Please select a club for this event');
            }

            // Prepare event data for API
            const startDateTime = formatDateTimeForAPI(formData.eventDate, formData.eventTime);

            if (!startDateTime) {
                throw new Error('Invalid date or time format');
            }

            // Convert images to base64
            let eventImageData = null;
            if (formData.poster) {
                const base64 = await fileToBase64(formData.poster);
                eventImageData = {
                    name: formData.poster.name,
                    contentType: formData.poster.type,
                    data: base64,
                    url: "",
                    type: "EVENT_IMAGE"
                };
            }

            let eventReelData = null;
            if (formData.reel) {
                const base64 = await fileToBase64(formData.reel);
                eventReelData = {
                    name: formData.reel.name,
                    contentType: formData.reel.type,
                    data: base64,
                    url: "",
                    type: "EVENT_REEL"
                };
            }

            let eventOrganizerLogoData = null;
            if (formData.organizerLogo) {
                const base64 = await fileToBase64(formData.organizerLogo);
                eventOrganizerLogoData = {
                    name: formData.organizerLogo.name,
                    contentType: formData.organizerLogo.type,
                    data: base64,
                    url: "",
                    type: "ORGANIZER_LOGO"
                };
            }

            // Construct payload matching the event-create-with-image.json structure
            const eventData: any = {
                title: formData.eventName.trim(),
                description: formData.description.trim(),
                startDateTime: startDateTime,
                endDateTime: startDateTime, // Could be calculated based on duration
                location: formData.organizer || "Club Location",
                locationText: "Club Location Text",
                locationMap: {
                    lat: 0,
                    lng: 0
                },
                clubId: selectedClubId,
                maxAttendees: formData.totalTickets || 500,
                isPublic: true,
                requiresApproval: false,
                eventArtistName: formData.artistName || "",
                aboutEventArtist: formData.aboutArtist || "",
                instagramHandle: formData.instagramHandle || "",
                spotifyHandle: formData.spotifyHandle || "",
                musicGenre: selectedGenres.map(g => g.label).join(', ') || "",
                eventOrganizer: formData.organizer,
                ticketTypes: ticketTypes,
                hasLimitedTickets: formData.hasLimitedTickets,
                totalTickets: formData.totalTickets,
                eventImage: eventImageData,
                eventReel: eventReelData,
                eventOrganizerLogo: eventOrganizerLogoData,
                galleryImages: [],
                performerImages: []
            };

            console.log('🚀 Creating event with images - Payload:', eventData);
            console.log('📡 API Call: POST /events/create-json-with-images');
            console.log('📸 Event Image:', eventImageData ? 'Yes' : 'No');
            console.log('🎬 Event Reel:', eventReelData ? 'Yes' : 'No');
            console.log('🏢 Organizer Logo:', eventOrganizerLogoData ? 'Yes' : 'No');

            // Use the specific endpoint for JSON+Images
            const response: any = await EventService.createEventWithImages(eventData);

            if (response && (response.id || response.success || response.data)) {
                console.log('✅ Event created successfully:', response);

                toast({
                    title: 'Event Created Successfully',
                    description: `Your event "${formData.eventName}" has been created!`,
                    variant: 'default'
                });

                // Close the dialog and navigate to event preview
                setShowConfirmDialog(false);
                setDialogStage('confirm');
                router.push(`/bz/business/club/_/events?id=${selectedClubId}`); // Go back to club events list
            } else {
                throw new Error('Failed to create event - Invalid response');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create event. Please try again.';
            console.error('❌ Event creation error:', error);

            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive'
            });

            setDialogStage('confirm');
            setIsCreating(false);
        }
    };

    const handleAddTicket = () => {
        setIsAddingTicket(true);
    };

    const confirmAddTicket = () => {
        if (newTicket.name && newTicket.price > 0) {
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
                    <h1 className="text-xl font-bold text-white">Create new event</h1>
                </div>
            </div>

            {/* Main Content Card - Positioned below fixed header */}
            <div className="px-0 relative mt-[100px] z-40">
                {/* Main Container with rounded corners */}
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col">
                    {/* Fixed header section that stays in place */}
                    <div className="w-full bg-[#021313] rounded-t-[40px]">
                        {/* Heading container */}
                        <div className="w-full pb-2">
                            <div className="flex items-center justify-center pt-8 pb-4">
                                {/* FIXED: #6 — Skeleton loading instead of plain LOADING text */}
                                {loadingClubs ? (
                                    <div className="w-[200px] h-[36px] bg-[#0D1F1F] rounded-[10px] animate-pulse" />
                                ) : (
                                    <h2 className="text-[28px] font-bold text-white text-center tracking-wider font-['Anton']">
                                        {selectedClubId ? clubs.find(c => c.id === selectedClubId)?.name || 'CREATE EVENT' : 'CREATE EVENT'}
                                    </h2>
                                )}
                            </div>
                        </div>

                        {/* FIXED: #5 — Tab Navigation with validation indicators */}
                        <div className="pl-6 pr-4 pt-1 pb-3 overflow-x-scroll scrollbar-hide bg-[#021313]">
                            <div className="flex items-center gap-4 min-w-max">
                                {tabs.map((tab) => {
                                    const hasErrors = tabValidation[tab.id] === false && Object.keys(fieldErrors).length > 0;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleTabSwitch(tab.id)}
                                            className={`relative px-6 py-[8px] rounded-[25px] text-[14px] font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                                                ? 'bg-[#14FFEC] text-black'
                                                : hasErrors
                                                    ? 'bg-[#3D1111] text-[#FF6B6B] border border-[#FF6B6B]/40 hover:bg-[#4D1919]'
                                                    : 'bg-[#004342] text-white hover:bg-[#005352]'
                                                }`}
                                        >
                                            {tab.label}
                                            {/* FIXED: #5 — Red dot indicator for tabs with validation errors */}
                                            {hasErrors && activeTab !== tab.id && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF6B6B] rounded-full border border-[#021313]" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Form Content - Scrollable content area */}
                    <div className="px-6 pb-36 overflow-y-auto h-[calc(100vh-280px)]  scrollbar-hide">
                        {/* FIXED: #6 — Skeleton loading UI that mirrors form layout */}
                        {loadingClubs ? (
                            <div className="space-y-5 animate-pulse">
                                {/* Skeleton input fields */}
                                {[1, 2].map(i => (
                                    <div key={i} className="space-y-3">
                                        <div className="px-5"><div className="h-4 w-32 bg-[#0D1F1F] rounded" /></div>
                                        <div className="bg-[#0D1F1F] border border-[#0C898B]/30 rounded-[30px] p-[10px] px-5 h-12" />
                                    </div>
                                ))}
                                {/* Skeleton textarea */}
                                <div className="space-y-3">
                                    <div className="px-5"><div className="h-4 w-40 bg-[#0D1F1F] rounded" /></div>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B]/30 rounded-[30px] p-5 h-28" />
                                </div>
                                {/* Skeleton social handles row */}
                                <div className="space-y-3">
                                    <div className="px-5"><div className="h-4 w-48 bg-[#0D1F1F] rounded" /></div>
                                    <div className="flex gap-4 w-full">
                                        <div className="w-1/2 bg-[#0D1F1F] border border-[#0C898B]/30 rounded-[30px] p-[10px] px-5 h-12" />
                                        <div className="w-1/2 bg-[#0D1F1F] border border-[#0C898B]/30 rounded-[30px] p-[10px] px-5 h-12" />
                                    </div>
                                </div>
                                {/* Skeleton date and time row */}
                                <div className="flex gap-4 w-full">
                                    <div className="w-1/2 space-y-3">
                                        <div className="px-5"><div className="h-4 w-24 bg-[#0D1F1F] rounded" /></div>
                                        <div className="bg-[#0D1F1F] border border-[#0C898B]/30 rounded-[30px] p-[10px] px-5 h-12" />
                                    </div>
                                    <div className="w-1/2 space-y-3">
                                        <div className="px-5"><div className="h-4 w-20 bg-[#0D1F1F] rounded" /></div>
                                        <div className="bg-[#0D1F1F] border border-[#0C898B]/30 rounded-[30px] p-[10px] px-5 h-12" />
                                    </div>
                                </div>
                                {/* Skeleton textarea for description */}
                                <div className="space-y-3">
                                    <div className="px-5"><div className="h-4 w-36 bg-[#0D1F1F] rounded" /></div>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B]/30 rounded-[30px] p-[15px] px-5 h-28" />
                                </div>
                            </div>
                        ) : (
                        <>
                        {activeTab === 'details' && (
                            <div className="space-y-5">
                                {/* Event Name */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Name *</label>
                                    </div>
                                    <div className={`bg-[#0D1F1F] border ${fieldErrors.eventName ? 'border-[#FF6B6B]' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5`}>
                                        <input
                                            type="text"
                                            value={formData.eventName}
                                            onChange={(e) => { handleInputChange('eventName', e.target.value); setFieldErrors(prev => { const next = { ...prev }; delete next.eventName; return next; }); }}
                                            onBlur={() => { if (!formData.eventName.trim()) setFieldErrors(prev => ({ ...prev, eventName: 'Event name is required' })); }}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                            placeholder="Artist Name here"
                                        />
                                    </div>
                                    {/* FIXED: #5 — Inline field-level error */}
                                    {fieldErrors.eventName && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.eventName}</p>}
                                </div>

                                {/* Artist Name */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Artist Name *</label>
                                    </div>
                                    <div className={`bg-[#0D1F1F] border ${fieldErrors.artistName ? 'border-[#FF6B6B]' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5`}>
                                        <input
                                            type="text"
                                            value={formData.artistName}
                                            onChange={(e) => { handleInputChange('artistName', e.target.value); setFieldErrors(prev => { const next = { ...prev }; delete next.artistName; return next; }); }}
                                            onBlur={() => { if (!formData.artistName.trim()) setFieldErrors(prev => ({ ...prev, artistName: 'Artist name is required' })); }}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                            placeholder="Artist Name here"
                                        />
                                    </div>
                                    {fieldErrors.artistName && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.artistName}</p>}
                                </div>

                                {/* About Artist */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">About Event Artist *</label>
                                    </div>
                                    <div className={`bg-[#0D1F1F] border ${fieldErrors.aboutArtist ? 'border-[#FF6B6B]' : 'border-[#0C898B]'} rounded-[30px] p-5`}>
                                        <textarea
                                            value={formData.aboutArtist}
                                            onChange={(e) => { handleInputChange('aboutArtist', e.target.value); setFieldErrors(prev => { const next = { ...prev }; delete next.aboutArtist; return next; }); }}
                                            onBlur={() => { if (!formData.aboutArtist.trim()) setFieldErrors(prev => ({ ...prev, aboutArtist: 'About artist is required' })); }}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none resize-none h-[80px] text-base font-semibold"
                                            placeholder="Artist Name here"
                                        />
                                    </div>
                                    {fieldErrors.aboutArtist && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.aboutArtist}</p>}
                                </div>

                                {/* Social Handles - in one row */}
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

                                {/* Date and Time - in one row */}
                                <div className="flex gap-4 w-full">
                                    <div className="w-1/2 space-y-3">
                                        {/* FIXED: #4 — DatePicker already has minDate defaulting to today */}
                                        <DatePicker
                                            value={formData.eventDate}
                                            onChange={(date) => { handleInputChange('eventDate', date); setFieldErrors(prev => { const next = { ...prev }; delete next.eventDate; return next; }); }}
                                            placeholder="DD/MM/YYYY"
                                            label="Event Date *"
                                        />
                                        {fieldErrors.eventDate && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.eventDate}</p>}
                                    </div>

                                    <div className="w-1/2 space-y-3">
                                        <div className="px-5">
                                            <label className="text-[#14FFEC] font-semibold text-base">Start Time *</label>
                                        </div>
                                        <div className={`bg-[#0D1F1F] border ${fieldErrors.eventTime ? 'border-[#FF6B6B]' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5`}>
                                            <input
                                                type="time"
                                                value={formData.eventTime}
                                                onChange={(e) => { handleInputChange('eventTime', e.target.value); setFieldErrors(prev => { const next = { ...prev }; delete next.eventTime; return next; }); }}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                            />
                                        </div>
                                        {fieldErrors.eventTime && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.eventTime}</p>}
                                    </div>
                                </div>

                                {/* Music Genre */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Music Genre *</label>
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
                                    <div className={`bg-[#0D1F1F] border ${fieldErrors.description ? 'border-[#FF6B6B]' : 'border-[#0C898B]'} rounded-[30px] p-[15px] px-5`}>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => { handleInputChange('description', e.target.value); setFieldErrors(prev => { const next = { ...prev }; delete next.description; return next; }); }}
                                            onBlur={() => { if (!formData.description.trim()) setFieldErrors(prev => ({ ...prev, description: 'Event description is required' })); }}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none resize-none h-[80px] text-base font-semibold"
                                            placeholder="Write a description of the the event here..."
                                        />
                                    </div>
                                    {fieldErrors.description && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.description}</p>}
                                </div>

                                {/* Event Organizer */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Organizer *</label>
                                    </div>
                                    <div className={`bg-[#0D1F1F] border ${fieldErrors.organizer ? 'border-[#FF6B6B]' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5`}>
                                        <div className="flex items-center gap-3">
                                            <Building2 size={20} className="text-[#14FFEC]" />
                                            <input
                                                type="text"
                                                value={formData.organizer}
                                                onChange={(e) => { handleInputChange('organizer', e.target.value); setFieldErrors(prev => { const next = { ...prev }; delete next.organizer; return next; }); }}
                                                onBlur={() => { if (!formData.organizer.trim()) setFieldErrors(prev => ({ ...prev, organizer: 'Event organizer is required' })); }}
                                                className="flex-1 bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="Event Organized by"
                                            />
                                        </div>
                                    </div>
                                    {fieldErrors.organizer && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.organizer}</p>}
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
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Poster *</label>
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
                                                onClick={() => { handleFileUpload(posterInputRef); setFieldErrors(prev => { const next = { ...prev }; delete next.poster; return next; }); }}
                                                className={`w-[280px] h-[380px] bg-[#0D1F1F] border ${fieldErrors.poster ? 'border-[#FF6B6B]' : 'border-[#14FFEC]'} rounded-[15px] flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-[#0D1F1F]/70 transition-all`}
                                            >
                                                <ImageIcon size={50} className={`${fieldErrors.poster ? 'text-[#FF6B6B]' : 'text-[#14FFEC]'} mb-4`} />
                                                <p className="text-white text-center font-semibold">Upload poster here</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* FIXED: #5 — Inline error for poster */}
                                    {fieldErrors.poster && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1 justify-center"><AlertCircle size={12} />{fieldErrors.poster}</p>}
                                    <input
                                        ref={posterInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => { handlePosterChange(e); setFieldErrors(prev => { const next = { ...prev }; delete next.poster; return next; }); }}
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
                        )}                        {activeTab === 'tickets' && (
                            <div className="space-y-6">
                                {/* Ticket Types */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Ticket Types *</label>
                                    </div>
                                    <div className={`bg-[#0D1F1F] border ${fieldErrors.ticketTypes ? 'border-[#FF6B6B]' : 'border-[#0C898B]'} rounded-[30px] p-[15px] px-5`}>
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
                                                            onChange={e => {
                                                                // FIXED: #3 — Clamp ticket quantity to minimum of 1
                                                                const val = parseInt(e.target.value) || 0;
                                                                setNewTicket({ ...newTicket, quantity: Math.max(1, val) });
                                                            }}
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
                                    {/* FIXED: #5 — Inline error for ticket types */}
                                    {fieldErrors.ticketTypes && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.ticketTypes}</p>}
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

                                {/* FIXED: #3 — Ticket count with min=1, clamp on change, inline error */}
                                {formData.hasLimitedTickets && (
                                    <div className="space-y-3">
                                        <div className="px-5">
                                            <label className="text-[#14FFEC] font-semibold text-base">Total Tickets</label>
                                        </div>
                                        <div className={`bg-[#0D1F1F] border ${fieldErrors.totalTickets ? 'border-[#FF6B6B]' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5`}>
                                            <input
                                                type="number"
                                                min={1}
                                                value={formData.totalTickets}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // FIXED: #3 — Prevent negative values, clamp to minimum 1
                                                    if (value === '') {
                                                        setFormData({ ...formData, totalTickets: '' });
                                                        setFieldErrors(prev => ({ ...prev, totalTickets: 'Ticket count must be at least 1' }));
                                                    } else {
                                                        const numValue = parseInt(value.replace(/^0+/, '') || '0');
                                                        const clampedValue = Math.max(1, numValue); // FIXED: #3 — Clamp to min 1
                                                        setFormData({ ...formData, totalTickets: clampedValue });
                                                        setFieldErrors(prev => { const next = { ...prev }; delete next.totalTickets; return next; });
                                                    }
                                                }}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="100"
                                            />
                                        </div>
                                        {/* FIXED: #3 — Inline validation error for ticket count */}
                                        {fieldErrors.totalTickets && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.totalTickets}</p>}
                                    </div>
                                )}
                            </div>
                        )}
                        </>
                        )}
                    </div>
                </div>

                {/* Bottom Save Button */}
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <div className="w-full h-[80px] relative bg-[#0D1F1F] shadow-[0px_30px_30px_-40px_#00968A_inset] overflow-hidden rounded-t-[40px] border-t-2 border-[#14FFEC]">
                        <div className="flex justify-center items-center px-8 h-full">
                            <div className="w-[220px] h-[45px] bg-[#0F6861] rounded-[30px] flex justify-center items-center">
                                <button
                                    onClick={handleSaveEvent}
                                    className="w-full h-full flex justify-center items-center"
                                >
                                    <span className="text-center text-white text-[16px] font-['Manrope'] font-bold tracking-[0.05px]">
                                        Save & Create Event
                                    </span>
                                </button>
                            </div>
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
                                    setDialogStage('confirm'); // Reset to confirm stage when closing
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
                                        Proceed to create event
                                    </div>
                                    <div className="text-center text-[#9D9C9C] text-[16px] font-['Manrope'] leading-[19.20px]">
                                        You are about to create a new event
                                    </div>
                                </div>

                                <div className="flex items-center gap-[14px]">
                                    <button
                                        onClick={handleConfirmCreate}
                                        className="w-[154px] h-[38px] bg-[#007877] rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-[#008c8c] transition-all duration-300"
                                    >
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                            Create event
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setShowConfirmDialog(false)}
                                        className="w-[154px] h-[38px] border border-[#007877] rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-[#012e2e] transition-all duration-300"
                                    >
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                            Go back
                                        </div>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Loading animation from booking page */}
                                <div className="w-20 h-20 relative mb-2">
                                    <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-4 border-r-transparent animate-spin border-[#14FFEC]"></div>
                                </div>

                                <div className="flex flex-col items-center gap-[12px]">
                                    <div className="text-[#F9F9F9] text-[20px] font-semibold font-['Manrope']">
                                        Creating your event
                                    </div>
                                </div>

                                <div className="flex items-center gap-[14px]">
                                    <button
                                        onClick={handlePreviewEvent}
                                        className="w-[154px] h-[38px] bg-[#007877] rounded-[30px] flex justify-center items-center"
                                    >
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                            Preview event
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowConfirmDialog(false);
                                            setDialogStage('confirm');
                                        }}
                                        className="w-[154px] h-[38px] border border-[#007877] rounded-[30px] flex justify-center items-center"
                                    >
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                            Go back
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

export default function NewEventPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-r-transparent animate-spin border-[#14FFEC]"></div>
            </div>
        }>
            <NewEventPageContent />
        </Suspense>
    );
}



