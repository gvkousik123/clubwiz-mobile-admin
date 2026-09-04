'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Upload, Calendar, Clock, Music, User, Building2, Instagram, Music2, ImageIcon, VideoIcon, ChevronDown, Plus, Trash2, AlertCircle, Edit, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { EventService } from '@/lib/services/event.service';
import { ClubService } from '@/lib/services/club.service'; // FIXED: #2 — Using getMyClubs instead of getAllClubsAdmin
import { useToast } from '@/hooks/use-toast';
import LocationModal from '@/components/common/location-modal';
import DatePicker from '@/components/common/date-picker';
import TimePicker from '@/components/common/time-picker';
import { formatDateTimeForAPI } from '@/lib/date-utils';
import { MusicGenreAutocomplete, MusicGenre } from '@/components/ui/music-genre-autocomplete';

interface Club {
    id: string;
    name: string;
    logo?: string;
}

function NewEventPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const posterInputRef = useRef<HTMLInputElement>(null);
    const reelInputRef = useRef<HTMLInputElement>(null);

    // Edit mode detection
    const eventId = searchParams.get('eventId');
    const isEditMode = !!eventId;
    const [isLoadingEvent, setIsLoadingEvent] = useState(isEditMode);

    // Club management state
    const [clubs, setClubs] = useState<Club[]>([]);
    const [selectedClubId, setSelectedClubId] = useState<string>('');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [eventLocation, setEventLocation] = useState<any>(null);

    // The event API takes location and locationText as plain strings (unlike clubs,
    // where locationText is an object), so the picked address is flattened here.
    const eventLocationLabel = eventLocation
        ? [eventLocation.address1, eventLocation.address2, eventLocation.city, eventLocation.state, eventLocation.pincode]
            .filter(Boolean).join(', ')
        : '';
    const [showClubDropdown, setShowClubDropdown] = useState(false);
    const [loadingClubs, setLoadingClubs] = useState(true);

    // Image preview states
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [posterPreview, setPosterPreview] = useState<string | null>(null);
    const [reelPreview, setReelPreview] = useState<string | null>(null);

    const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null);
    const [existingReelUrl, setExistingReelUrl] = useState<string | null>(null);
    const [existingOrganizerLogoUrl, setExistingOrganizerLogoUrl] = useState<string | null>(null);

    const [selectedGenres, setSelectedGenres] = useState<MusicGenre[]>([]);
    const [activeTab, setActiveTab] = useState('details');
    const [selectedRestriction, setSelectedRestriction] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [dialogStage, setDialogStage] = useState<'confirm' | 'creating'>('confirm');

    const normalizeTimeForInput = (time?: string | null): string => {
        if (!time) return '';
        const trimmed = time.trim();
        if (!trimmed) return '';

        if (trimmed.includes('T')) {
            const date = new Date(trimmed);
            if (!Number.isNaN(date.getTime())) {
                return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            }
        }

        const [hours, minutes] = trimmed.split(':');
        if (hours !== undefined && minutes !== undefined) {
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }

        return '';
    };

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
        // General Pricing
        maleStagPrice: '',
        maleStagFee: '',
        maleStagDesc: '',
        maleStagEnabled: true,
        femaleStagPrice: '',
        femaleStagFee: '',
        femaleStagDesc: '',
        femaleStagEnabled: true,
        couplePrice: '',
        coupleFee: '',
        coupleDesc: '',
        coupleEnabled: true,
        // Early Bird Pricing
        earlyBirdEnabled: false,
        earlyBirdEndTime: '',
        earlyBirdMaleStagEnabled: true,
        earlyBirdMaleStagPrice: '',
        earlyBirdMaleStagFee: '',
        earlyBirdMaleStagDesc: '',
        earlyBirdFemaleStagEnabled: true,
        earlyBirdFemaleStagPrice: '',
        earlyBirdFemaleStagFee: '',
        earlyBirdFemaleStagDesc: '',
        earlyBirdCoupleEnabled: true,
        earlyBirdCouplePrice: '',
        earlyBirdCoupleFee: '',
        earlyBirdCoupleDesc: '',
        // Promo toggles
        freeMaleStagPerCoupleEnabled: false,
        earlyBirdFreeMaleStagPerCoupleEnabled: false,
    });

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

    // Load event data if in edit mode
    useEffect(() => {
        if (!isEditMode || !eventId) return;

        const loadEventData = async () => {
            try {
                setIsLoadingEvent(true);
                console.log('📡 Loading event data for edit:', eventId);
                
                const response = await EventService.getEventDetailsAdmin(eventId);
                console.log('✅ Event loaded:', response);

                // Extract event data from response
                const event = (response as any)?.data || response;

                if (event) {
                    // Parse date and time from startDateTime
                    let eventDate = '';
                    let eventTime = '';
                    if (event.startDateTime) {
                        const dateObj = new Date(event.startDateTime);
                        eventDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
                        eventTime = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                    }

                    // Resolve early bird pricing from explicit earlyBirdPricing, guestListPricing, or generalPricing.
                    const earlyBirdSource =
                        event.earlyBirdPricing ||
                        ((event.guestListPricing?.cutoffTime ||
                          event.guestListPricing?.maleStagEntry ||
                          event.guestListPricing?.femaleStagEntry ||
                          event.guestListPricing?.coupleEntry ||
                          event.guestListPricing?.freeMaleStagPerCoupleEnabled !== undefined)
                            ? event.guestListPricing
                            : null) ||
                        event.generalPricing;

                    // Set form data
                    const hasEarlyBirdData = Boolean(
                        event.earlyBirdEnabled ||
                        event.earlyBirdEndTime ||
                        event.earlyBirdMaleStagEntry ||
                        event.earlyBirdPricing?.maleStagEntry ||
                        event.earlyBirdPricing?.femaleStagEntry ||
                        event.earlyBirdPricing?.coupleEntry ||
                        event.guestListPricing?.cutoffTime ||
                        earlyBirdSource?.cutoffTime ||
                        earlyBirdSource?.maleStagEntry ||
                        earlyBirdSource?.femaleStagEntry ||
                        earlyBirdSource?.coupleEntry ||
                        event.earlyBirdFreeMaleStagPerCoupleEnabled ||
                        earlyBirdSource?.freeMaleStagPerCoupleEnabled
                    );

                    setFormData({
                        eventName: event.title || event.name || '',
                        artistName: event.eventArtistName || event.artistName || '',
                        aboutArtist: event.aboutEventArtist || event.aboutArtist || '',
                        instagramHandle: event.instagramHandle || '',
                        spotifyHandle: event.spotifyHandle || event.spotifyUrl || '',
                        eventDate: eventDate,
                        eventTime: eventTime,
                        musicGenre: event.musicGenre || '',
                        description: event.description || '',
                        organizer: event.eventOrganizer || event.organizer?.username || '',
                        organizerLogo: null,
                        poster: null,
                        reel: null,
                        // General Pricing from generalPricing or flat fields
                        maleStagPrice: event.maleStagEntry?.price?.toString() || event.generalPricing?.maleStagEntry?.price?.toString() || '',
                        maleStagFee: event.maleStagEntry?.fee?.toString() || event.generalPricing?.maleStagEntry?.fee?.toString() || '',
                        maleStagDesc: event.maleStagEntry?.description || event.generalPricing?.maleStagEntry?.description || '',
                        maleStagEnabled: !!(event.maleStagEntry || event.generalPricing?.maleStagEntry),
                        femaleStagPrice: event.femaleStagEntry?.price?.toString() || event.generalPricing?.femaleStagEntry?.price?.toString() || '',
                        femaleStagFee: event.femaleStagEntry?.fee?.toString() || event.generalPricing?.femaleStagEntry?.fee?.toString() || '',
                        femaleStagDesc: event.femaleStagEntry?.description || event.generalPricing?.femaleStagEntry?.description || '',
                        femaleStagEnabled: !!(event.femaleStagEntry || event.generalPricing?.femaleStagEntry),
                        couplePrice: event.coupleEntry?.price?.toString() || event.generalPricing?.coupleEntry?.price?.toString() || '',
                        coupleFee: event.coupleEntry?.fee?.toString() || event.generalPricing?.coupleEntry?.fee?.toString() || '',
                        coupleDesc: event.coupleEntry?.description || event.generalPricing?.coupleEntry?.description || '',
                        coupleEnabled: !!(event.coupleEntry || event.generalPricing?.coupleEntry),
                        // Early Bird Pricing
                        earlyBirdEnabled: hasEarlyBirdData,
                        earlyBirdEndTime: normalizeTimeForInput(event.earlyBirdEndTime || earlyBirdSource?.cutoffTime || ''),
                        earlyBirdMaleStagEnabled: !!(event.earlyBirdMaleStagEntry || earlyBirdSource?.maleStagEntry),
                        earlyBirdMaleStagPrice: event.earlyBirdMaleStagEntry?.price?.toString() || earlyBirdSource?.maleStagEntry?.price?.toString() || '',
                        earlyBirdMaleStagFee: event.earlyBirdMaleStagEntry?.fee?.toString() || earlyBirdSource?.maleStagEntry?.fee?.toString() || '',
                        earlyBirdMaleStagDesc: event.earlyBirdMaleStagEntry?.description || earlyBirdSource?.maleStagEntry?.description || '',
                        earlyBirdFemaleStagEnabled: !!(event.earlyBirdFemaleStagEntry || earlyBirdSource?.femaleStagEntry),
                        earlyBirdFemaleStagPrice: event.earlyBirdFemaleStagEntry?.price?.toString() || earlyBirdSource?.femaleStagEntry?.price?.toString() || '',
                        earlyBirdFemaleStagFee: event.earlyBirdFemaleStagEntry?.fee?.toString() || earlyBirdSource?.femaleStagEntry?.fee?.toString() || '',
                        earlyBirdFemaleStagDesc: event.earlyBirdFemaleStagEntry?.description || earlyBirdSource?.femaleStagEntry?.description || '',
                        earlyBirdCoupleEnabled: !!(event.earlyBirdCoupleEntry || earlyBirdSource?.coupleEntry),
                        earlyBirdCouplePrice: event.earlyBirdCoupleEntry?.price?.toString() || earlyBirdSource?.coupleEntry?.price?.toString() || '',
                        earlyBirdCoupleFee: event.earlyBirdCoupleEntry?.fee?.toString() || earlyBirdSource?.coupleEntry?.fee?.toString() || '',
                        earlyBirdCoupleDesc: event.earlyBirdCoupleEntry?.description || earlyBirdSource?.coupleEntry?.description || '',
                        // Promo toggles
                        freeMaleStagPerCoupleEnabled: event.freeMaleStagPerCoupleEnabled || event.generalPricing?.freeMaleStagPerCoupleEnabled || false,
                        earlyBirdFreeMaleStagPerCoupleEnabled: event.earlyBirdFreeMaleStagPerCoupleEnabled || earlyBirdSource?.freeMaleStagPerCoupleEnabled || false,
                    });

                    // Set club ID
                    if (event.clubId) {
                        setSelectedClubId(event.clubId);
                    }

                    // Set existing images as previews and retain URLs for edit payloads
                    if (event.imageUrl || event.eventImage) {
                        const posterUrl = event.imageUrl || event.eventImage;
                        setPosterPreview(posterUrl);
                        setExistingPosterUrl(posterUrl);
                    }

                    const reelUrl = event.reelUrl || event.eventReel || event.videoUrl;
                    if (reelUrl) {
                        setReelPreview(reelUrl);
                        setExistingReelUrl(reelUrl);
                    }

                    const organizerLogoUrl = event.eventOrganizerLogo || event.organizerLogo || event.organizerLogoUrl;
                    if (organizerLogoUrl) {
                        setLogoPreview(organizerLogoUrl);
                        setExistingOrganizerLogoUrl(organizerLogoUrl);
                    }


                    // Set music genres
                    if (event.musicGenre) {
                        const genres = event.musicGenre.split(',').map((g: string) => {
                            const trimmed = g.trim();
                            return {
                                id: `${trimmed.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random()}`,
                                label: trimmed,
                                active: true
                            };
                        }).filter(g => g.label);
                        setSelectedGenres(genres);
                    }

                    // Clear all field errors after loading data in edit mode
                    setFieldErrors({});
                }
            } catch (error) {
                console.error('❌ Error loading event:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load event data',
                    variant: 'destructive'
                });
            } finally {
                setIsLoadingEvent(false);
            }
        };

        loadEventData();
    }, [isEditMode, eventId, toast]);

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
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, organizerLogo: file }));
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
        setExistingOrganizerLogoUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, poster: file }));
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
        setExistingPosterUrl(null);
        if (posterInputRef.current) {
            posterInputRef.current.value = '';
        }
    };

    const handleReelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, reel: file }));
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
        setExistingReelUrl(null);
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
            if (!selectedGenres.length) errors.musicGenre = 'Music genre is required';
        }
        if (tabId === 'creatives') {
            // In edit mode, check if there's either a new file OR an existing preview
            if (!isEditMode && !formData.poster) {
                errors.poster = 'Event poster is required';
            } else if (isEditMode && !formData.poster && !posterPreview) {
                errors.poster = 'Event poster is required';
            }
        }
        if (tabId === 'tickets') {
            // Check if at least one ticket type is enabled
            if (!formData.maleStagEnabled && !formData.femaleStagEnabled && !formData.coupleEnabled) {
                errors.tickets = 'At least one ticket type must be enabled';
            }
            // Validate that enabled tickets have prices
            if (formData.maleStagEnabled && !formData.maleStagPrice) {
                errors.maleStagPrice = 'Male Stag price is required when enabled';
            }
            if (formData.femaleStagEnabled && !formData.femaleStagPrice) {
                errors.femaleStagPrice = 'Female Stag price is required when enabled';
            }
            if (formData.coupleEnabled && !formData.couplePrice) {
                errors.couplePrice = 'Couple price is required when enabled';
            }
            // Validate early bird pricing if enabled
            if (formData.earlyBirdEnabled) {
                if (!formData.earlyBirdEndTime) {
                    errors.earlyBirdEndTime = 'Early bird cutoff time is required';
                }
                if (formData.maleStagEnabled && formData.earlyBirdMaleStagEnabled && !formData.earlyBirdMaleStagPrice) {
                    errors.earlyBirdMaleStagPrice = 'Early bird Male Stag price is required';
                }
                if (formData.femaleStagEnabled && formData.earlyBirdFemaleStagEnabled && !formData.earlyBirdFemaleStagPrice) {
                    errors.earlyBirdFemaleStagPrice = 'Early bird Female Stag price is required';
                }
                if (formData.coupleEnabled && formData.earlyBirdCoupleEnabled && !formData.earlyBirdCouplePrice) {
                    errors.earlyBirdCouplePrice = 'Early bird Couple price is required';
                }
            }
        }
        return errors;
    }, [formData, isEditMode, posterPreview]);

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
            // Validate required fields per API spec
            if (!formData.eventName.trim()) {
                throw new Error('Event name is required');
            }

            if (!formData.artistName.trim()) {
                throw new Error('Artist name is required');
            }

            if (!formData.aboutArtist.trim()) {
                throw new Error('About artist is required');
            }

            if (!selectedClubId) {
                throw new Error('Please select a club for this event');
            }

            if (!selectedGenres.length) {
                throw new Error('Music genre is required');
            }

            // Prepare event data for API
            const startDateTime = formatDateTimeForAPI(formData.eventDate, formData.eventTime);

            if (!startDateTime) {
                throw new Error('Invalid date or time format');
            }

            // Check if we have files to upload
            const hasFiles = formData.poster || formData.reel || formData.organizerLogo;

            // Construct payload with metadata only (no base64 images)
            const eventData: any = {
                title: formData.eventName.trim(),
                description: formData.description.trim(),
                startDateTime: startDateTime,
                endDateTime: startDateTime, // Could be calculated based on duration
                // Previously hardcoded to "Club Location" / 0,0. Now taken from the
                // location overlay; falls back to the old placeholders only when the
                // organiser has not picked one.
                location: eventLocationLabel || "Club Location",
                locationText: eventLocationLabel || "Club Location Text",
                locationMap: {
                    lat: eventLocation?.lat || 0,
                    lng: eventLocation?.lng || 0
                },
                clubId: selectedClubId,
                maxAttendees: 500,
                isPublic: true,
                requiresApproval: false,
                eventArtistName: formData.artistName.trim(),
                aboutEventArtist: formData.aboutArtist.trim(),
                musicGenre: selectedGenres.map(g => g.label).join(', '),
                instagramHandle: formData.instagramHandle || "",
                spotifyHandle: formData.spotifyHandle || "",
                eventOrganizer: formData.organizer,
                galleryImages: [],
                performerImages: []
            };

            if (isEditMode) {
                if (!formData.poster && existingPosterUrl) {
                    eventData.imageUrl = existingPosterUrl;
                }
                if (!formData.reel && existingReelUrl) {
                    eventData.reelUrl = existingReelUrl;
                }
                if (!formData.organizerLogo && existingOrganizerLogoUrl) {
                    eventData.eventOrganizerLogo = existingOrganizerLogoUrl;
                }
            }

            // Flat general pricing fields (only include enabled + priced tickets)
            if (formData.maleStagEnabled && formData.maleStagPrice) {
                eventData.maleStagEntry = {
                    price: parseFloat(formData.maleStagPrice),
                    ...(formData.maleStagFee ? { fee: parseFloat(formData.maleStagFee) } : {}),
                    ...(formData.maleStagDesc ? { description: formData.maleStagDesc } : {})
                };
            }
            if (formData.femaleStagEnabled && formData.femaleStagPrice) {
                eventData.femaleStagEntry = {
                    price: parseFloat(formData.femaleStagPrice),
                    ...(formData.femaleStagFee ? { fee: parseFloat(formData.femaleStagFee) } : {}),
                    ...(formData.femaleStagDesc ? { description: formData.femaleStagDesc } : {})
                };
            }
            if (formData.coupleEnabled && formData.couplePrice) {
                eventData.coupleEntry = {
                    price: parseFloat(formData.couplePrice),
                    ...(formData.coupleFee ? { fee: parseFloat(formData.coupleFee) } : {}),
                    ...(formData.coupleDesc ? { description: formData.coupleDesc } : {})
                };
            }

            // Promo toggle (root level)
            eventData.freeMaleStagPerCoupleEnabled = !!formData.freeMaleStagPerCoupleEnabled;

            // Flat early bird fields (omit entirely when disabled)
            if (formData.earlyBirdEnabled) {
                eventData.earlyBirdEnabled = true;
                // Ensure HH:mm:ss format
                const rawTime = formData.earlyBirdEndTime;
                const formattedEarlyBirdTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
                eventData.earlyBirdEndTime = formattedEarlyBirdTime;
                eventData.earlyBirdFreeMaleStagPerCoupleEnabled = !!formData.earlyBirdFreeMaleStagPerCoupleEnabled;

                if (formData.maleStagEnabled && formData.earlyBirdMaleStagEnabled && formData.earlyBirdMaleStagPrice) {
                    eventData.earlyBirdMaleStagEntry = {
                        price: parseFloat(formData.earlyBirdMaleStagPrice),
                        ...(formData.earlyBirdMaleStagFee ? { fee: parseFloat(formData.earlyBirdMaleStagFee) } : {}),
                        ...(formData.earlyBirdMaleStagDesc ? { description: formData.earlyBirdMaleStagDesc } : {})
                    };
                }
                if (formData.femaleStagEnabled && formData.earlyBirdFemaleStagEnabled && formData.earlyBirdFemaleStagPrice) {
                    eventData.earlyBirdFemaleStagEntry = {
                        price: parseFloat(formData.earlyBirdFemaleStagPrice),
                        ...(formData.earlyBirdFemaleStagFee ? { fee: parseFloat(formData.earlyBirdFemaleStagFee) } : {}),
                        ...(formData.earlyBirdFemaleStagDesc ? { description: formData.earlyBirdFemaleStagDesc } : {})
                    };
                }
                if (formData.coupleEnabled && formData.earlyBirdCoupleEnabled && formData.earlyBirdCouplePrice) {
                    eventData.earlyBirdCoupleEntry = {
                        price: parseFloat(formData.earlyBirdCouplePrice),
                        ...(formData.earlyBirdCoupleFee ? { fee: parseFloat(formData.earlyBirdCoupleFee) } : {}),
                        ...(formData.earlyBirdCoupleDesc ? { description: formData.earlyBirdCoupleDesc } : {})
                    };
                }

                eventData.earlyBirdPricing = {
                    enabled: true,
                    cutoffTime: formattedEarlyBirdTime,
                    maleStagEntry: eventData.earlyBirdMaleStagEntry || null,
                    femaleStagEntry: eventData.earlyBirdFemaleStagEntry || null,
                    coupleEntry: eventData.earlyBirdCoupleEntry || null,
                    earlyBirdFreeMaleStagPerCoupleEnabled: !!formData.earlyBirdFreeMaleStagPerCoupleEnabled
                };
            }

            let response: any;

            if (isEditMode && eventId) {
                // UPDATE MODE
                console.log('🚀 Updating event - Payload:', eventData);
                console.log('📡 API Call: PUT /events/' + eventId);
                console.log('� Pricing Config:', {
                    generalPricing: {
                        maleStagEntry: eventData.maleStagEntry,
                        femaleStagEntry: eventData.femaleStagEntry,
                        coupleEntry: eventData.coupleEntry,
                        freeMaleStagPerCoupleEnabled: eventData.freeMaleStagPerCoupleEnabled
                    },
                    earlyBirdPricing: eventData.earlyBirdEnabled ? {
                        enabled: true,
                        cutoffTime: eventData.earlyBirdEndTime,
                        maleStagEntry: eventData.earlyBirdMaleStagEntry,
                        femaleStagEntry: eventData.earlyBirdFemaleStagEntry,
                        coupleEntry: eventData.earlyBirdCoupleEntry,
                        earlyBirdFreeMaleStagPerCoupleEnabled: eventData.earlyBirdFreeMaleStagPerCoupleEnabled
                    } : { enabled: false }
                });
                console.log('📸 Event Image:', formData.poster ? 'Updated' : 'Not changed');
                console.log('🎬 Event Reel:', formData.reel ? 'Updated' : 'Not changed');
                console.log('🏢 Organizer Logo:', formData.organizerLogo ? 'Updated' : 'Not changed');

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

                if (response && (response.id || response.success || response.data)) {
                    console.log('✅ Event updated successfully:', response);

                    toast({
                        title: 'Event Updated Successfully',
                        description: `Your event "${formData.eventName}" has been updated!`,
                        variant: 'default'
                    });

                    // Close the dialog and navigate back
                    setShowConfirmDialog(false);
                    setDialogStage('confirm');
                    router.push(`/bz/business`);
                } else {
                    throw new Error('Failed to update event - Invalid response');
                }
            } else {
                // CREATE MODE
                console.log('📡 API Call: POST /events/create-json-with-images');
                console.log('💰 Pricing Config:', {
                    generalPricing: {
                        maleStagEntry: eventData.maleStagEntry,
                        femaleStagEntry: eventData.femaleStagEntry,
                        coupleEntry: eventData.coupleEntry,
                        freeMaleStagPerCoupleEnabled: eventData.freeMaleStagPerCoupleEnabled
                    },
                    earlyBirdPricing: eventData.earlyBirdEnabled ? {
                        enabled: true,
                        cutoffTime: eventData.earlyBirdEndTime,
                        maleStagEntry: eventData.earlyBirdMaleStagEntry,
                        femaleStagEntry: eventData.earlyBirdFemaleStagEntry,
                        coupleEntry: eventData.earlyBirdCoupleEntry,
                        earlyBirdFreeMaleStagPerCoupleEnabled: eventData.earlyBirdFreeMaleStagPerCoupleEnabled
                    } : { enabled: false }
                });
                console.log('📸 Event Image:', formData.poster ? 'Yes' : 'No');
                console.log('🎬 Event Reel:', formData.reel ? 'Yes' : 'No');
                console.log('🏢 Organizer Logo:', formData.organizerLogo ? 'Yes' : 'No');

                if (hasFiles) {
                    response = await EventService.createEventMultipart(eventData, {
                        eventImage: formData.poster,
                        eventReel: formData.reel,
                        eventOrganizerLogo: formData.organizerLogo,
                        galleryImages: [],
                        performerImages: []
                    });
                } else {
                    response = await EventService.createEventWithImages(eventData);
                }

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
                    router.push(`/bz/business`);
                } else {
                    throw new Error('Failed to create event - Invalid response');
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create event. Please try again.';
            console.error('❌ Event creation error:', error);

            // Check for timeout error
            const isTimeout =
                (error as any)?.code === 'ECONNABORTED' ||
                (typeof errorMessage === 'string' && /timeout/i.test(errorMessage));

            if (isTimeout) {
                toast({
                    title: 'Browser timed out — check if save completed',
                    description: 'The server may still be processing your images (1–2 minutes). Refresh this page to verify.',
                    variant: 'destructive'
                });
            } else {
                toast({
                    title: 'Error',
                    description: errorMessage,
                    variant: 'destructive'
                });
            }

            setDialogStage('confirm');
            setIsCreating(false);
        }
    };


    const tabs = [
        { id: 'details', label: 'Event Details' },
        { id: 'creatives', label: 'Event Creatives' },
        { id: 'tickets', label: 'Event Tickets' }
    ];

    return (
        <div className="min-h-screen bg-[#021313] text-white relative flex justify-center items-center md:py-8">
            <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[850px] relative overflow-hidden md:rounded-[2.5rem] md:border border-white/10 shadow-2xl bg-[#021313] flex flex-col">
                {/* Fixed Header with gradient background */}
                <div className="w-full z-30 flex flex-col pt-10 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] md:rounded-t-[2.5rem] overflow-hidden relative">
                    <div className="absolute top-10 left-6">
                        <button
                            onClick={handleGoBack}
                            className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all duration-300"
                        >
                            <span className="text-white text-xl font-bold">&lt;</span>
                        </button>
                    </div>
                    <div className="mt-2 text-center">
                        <h1 className="text-xl font-bold text-white">{isEditMode ? 'Edit Event' : 'Create new event'}</h1>
                    </div>
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-0 relative">
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
                                            onBlur={() => { if (!isEditMode && !formData.eventName.trim()) setFieldErrors(prev => ({ ...prev, eventName: 'Event name is required' })); }}
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
                                            onBlur={() => { if (!isEditMode && !formData.artistName.trim()) setFieldErrors(prev => ({ ...prev, artistName: 'Artist name is required' })); }}
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
                                            onBlur={() => { if (!isEditMode && !formData.aboutArtist.trim()) setFieldErrors(prev => ({ ...prev, aboutArtist: 'About artist is required' })); }}
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
                                        <TimePicker
                                            value={formData.eventTime}
                                            onChange={(time) => { handleInputChange('eventTime', time); setFieldErrors(prev => { const next = { ...prev }; delete next.eventTime; return next; }); }}
                                            eventDate={formData.eventDate}
                                        />
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
                                            onBlur={() => { if (!isEditMode && !formData.description.trim()) setFieldErrors(prev => ({ ...prev, description: 'Event description is required' })); }}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none resize-none h-[80px] text-base font-semibold"
                                            placeholder="Write a description of the the event here..."
                                        />
                                    </div>
                                    {fieldErrors.description && <p className="text-[#FF6B6B] text-xs font-medium px-5 flex items-center gap-1"><AlertCircle size={12} />{fieldErrors.description}</p>}
                                </div>

                                {/* Event Organizer */}
                                {/* Event Location */}
                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Location</label>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowLocationModal(true)}
                                        className="w-full bg-[#0D1F1F] border border-[#0C898B]/30 rounded-[30px] p-[10px] px-5 text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MapPin size={20} className="text-[#14FFEC] flex-shrink-0" />
                                            <span className={`truncate ${eventLocationLabel ? 'text-white' : 'text-white/40'}`}>
                                                {eventLocationLabel || 'Set the event location'}
                                            </span>
                                        </div>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="px-5">
                                        <label className="text-[#14FFEC] font-semibold text-base">Event Organizer</label>
                                    </div>
                                    <div className={`bg-[#0D1F1F] border ${fieldErrors.organizer ? 'border-[#FF6B6B]' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5`}>
                                        <div className="flex items-center gap-3">
                                            <Building2 size={20} className="text-[#14FFEC]" />
                                            <input
                                                type="text"
                                                value={formData.organizer}
                                                onChange={(e) => { handleInputChange('organizer', e.target.value); setFieldErrors(prev => { const next = { ...prev }; delete next.organizer; return next; }); }}
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
                        )}

                        {activeTab === 'tickets' && (
                            <div className="space-y-8">
                                {/* General Pricing Section */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[#14FFEC] font-semibold text-base">General Pricing</label>
                                        <p className="text-xs text-gray-400 mt-0.5">Regular pricing after early bird cutoff</p>
                                    </div>

                                    {/* Male Stag Entry */}
                                    <div className={`bg-[#0D1F1F] border ${!formData.maleStagEnabled ? 'border-white/10' : 'border-[#0C898B]/50'} rounded-xl overflow-hidden transition-all`}>
                                        <div className={`flex items-center justify-between px-4 py-3 ${!formData.maleStagEnabled ? 'opacity-50' : ''}`}>
                                            <button
                                                type="button"
                                                className="flex items-center gap-3"
                                                onClick={() => setFormData(prev => ({ ...prev, maleStagEnabled: !prev.maleStagEnabled }))}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.maleStagEnabled ? 'bg-[#14FFEC] border-[#14FFEC]' : 'border-gray-500'}`}>
                                                    {formData.maleStagEnabled && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <span className="text-white font-semibold text-sm">Male Stag Entry</span>
                                            </button>
                                            {formData.maleStagEnabled && (
                                                <button onClick={() => setFormData(prev => ({ ...prev, maleStagEnabled: false }))} className="text-gray-500 hover:text-red-400 transition-colors">
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                        {formData.maleStagEnabled && (
                                            <div className="border-t border-[#0C898B]/20">
                                                <div className={`flex items-center border-b border-[#0C898B]/20 px-4 py-2.5 ${fieldErrors.maleStagPrice ? 'border-l-2 border-l-red-500' : ''}`}>
                                                    <input type="text" inputMode="numeric" placeholder="Price *" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                        value={formData.maleStagPrice}
                                                        onChange={(e) => { handleInputChange('maleStagPrice', e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.maleStagPrice; return n; }); }} />
                                                </div>
                                                {fieldErrors.maleStagPrice && <p className="text-red-400 text-xs px-4 py-1">{fieldErrors.maleStagPrice}</p>}
                                                <div className="flex items-center border-b border-[#0C898B]/20 px-4 py-2.5">
                                                    <input type="text" inputMode="numeric" placeholder="Cover / Redeem (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                        value={formData.maleStagFee} onChange={(e) => handleInputChange('maleStagFee', e.target.value)} />
                                                </div>
                                                <div className="flex items-center px-4 py-2.5">
                                                    <input type="text" placeholder="Description (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                        value={formData.maleStagDesc} onChange={(e) => handleInputChange('maleStagDesc', e.target.value)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Female Stag Entry */}
                                    <div className={`bg-[#0D1F1F] border ${!formData.femaleStagEnabled ? 'border-white/10' : 'border-[#0C898B]/50'} rounded-xl overflow-hidden transition-all`}>
                                        <div className={`flex items-center justify-between px-4 py-3 ${!formData.femaleStagEnabled ? 'opacity-50' : ''}`}>
                                            <button
                                                type="button"
                                                className="flex items-center gap-3"
                                                onClick={() => setFormData(prev => ({ ...prev, femaleStagEnabled: !prev.femaleStagEnabled }))}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.femaleStagEnabled ? 'bg-[#14FFEC] border-[#14FFEC]' : 'border-gray-500'}`}>
                                                    {formData.femaleStagEnabled && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <span className="text-white font-semibold text-sm">Female Stag Entry</span>
                                            </button>
                                            {formData.femaleStagEnabled && (
                                                <button onClick={() => setFormData(prev => ({ ...prev, femaleStagEnabled: false }))} className="text-gray-500 hover:text-red-400 transition-colors">
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                        {formData.femaleStagEnabled && (
                                            <div className="border-t border-[#0C898B]/20">
                                                <div className={`flex items-center border-b border-[#0C898B]/20 px-4 py-2.5 ${fieldErrors.femaleStagPrice ? 'border-l-2 border-l-red-500' : ''}`}>
                                                    <input type="text" inputMode="numeric" placeholder="Price *" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                        value={formData.femaleStagPrice}
                                                        onChange={(e) => { handleInputChange('femaleStagPrice', e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.femaleStagPrice; return n; }); }} />
                                                </div>
                                                {fieldErrors.femaleStagPrice && <p className="text-red-400 text-xs px-4 py-1">{fieldErrors.femaleStagPrice}</p>}
                                                <div className="flex items-center border-b border-[#0C898B]/20 px-4 py-2.5">
                                                    <input type="text" inputMode="numeric" placeholder="Cover / Redeem (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                        value={formData.femaleStagFee} onChange={(e) => handleInputChange('femaleStagFee', e.target.value)} />
                                                </div>
                                                <div className="flex items-center px-4 py-2.5">
                                                    <input type="text" placeholder="Description (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                        value={formData.femaleStagDesc} onChange={(e) => handleInputChange('femaleStagDesc', e.target.value)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Couple Entry */}
                                    <div className={`bg-[#0D1F1F] border ${!formData.coupleEnabled ? 'border-white/10' : 'border-[#0C898B]/50'} rounded-xl overflow-hidden transition-all`}>
                                        <div className={`flex items-center justify-between px-4 py-3 ${!formData.coupleEnabled ? 'opacity-50' : ''}`}>
                                            <button
                                                type="button"
                                                className="flex items-center gap-3"
                                                onClick={() => setFormData(prev => ({ ...prev, coupleEnabled: !prev.coupleEnabled }))}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.coupleEnabled ? 'bg-[#14FFEC] border-[#14FFEC]' : 'border-gray-500'}`}>
                                                    {formData.coupleEnabled && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <span className="text-white font-semibold text-sm">Couple Entry</span>
                                            </button>
                                            {formData.coupleEnabled && (
                                                <button onClick={() => setFormData(prev => ({ ...prev, coupleEnabled: false }))} className="text-gray-500 hover:text-red-400 transition-colors">
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                        {formData.coupleEnabled && (
                                            <div className="border-t border-[#0C898B]/20">
                                                <div className={`flex items-center border-b border-[#0C898B]/20 px-4 py-2.5 ${fieldErrors.couplePrice ? 'border-l-2 border-l-red-500' : ''}`}>
                                                    <input type="text" inputMode="numeric" placeholder="Price *" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                        value={formData.couplePrice}
                                                        onChange={(e) => { handleInputChange('couplePrice', e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.couplePrice; return n; }); }} />
                                                </div>
                                                {fieldErrors.couplePrice && <p className="text-red-400 text-xs px-4 py-1">{fieldErrors.couplePrice}</p>}
                                                <div className="flex items-center border-b border-[#0C898B]/20 px-4 py-2.5">
                                                    <input type="text" inputMode="numeric" placeholder="Cover / Redeem (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                        value={formData.coupleFee} onChange={(e) => handleInputChange('coupleFee', e.target.value)} />
                                                </div>
                                                <div className="flex items-center px-4 py-2.5">
                                                    <input type="text" placeholder="Description (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                        value={formData.coupleDesc} onChange={(e) => handleInputChange('coupleDesc', e.target.value)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {fieldErrors.tickets && (
                                        <div className="flex items-center gap-2 text-red-400 text-xs px-1">
                                            <AlertCircle size={14} /><span>{fieldErrors.tickets}</span>
                                        </div>
                                    )}

                                    {/* Free Male Stag per Couple promo - General Pricing */}
                                    <div className="bg-[#0D1F1F] border border-[#0C898B]/50 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-white font-semibold text-sm">Free Male Stag per Couple</span>
                                            <p className="text-xs text-gray-400 mt-0.5">1 complimentary male stag per couple</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, freeMaleStagPerCoupleEnabled: !prev.freeMaleStagPerCoupleEnabled }))}
                                            className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${formData.freeMaleStagPerCoupleEnabled ? 'bg-[#14FFEC]' : 'bg-gray-700'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${formData.freeMaleStagPerCoupleEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Early Bird Pricing Section */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[#14FFEC] font-semibold text-base">Early Bird Pricing</label>
                                        <p className="text-xs text-gray-400 mt-0.5">Discounted pricing before cutoff time</p>
                                    </div>

                                    {/* Enable Early Bird toggle */}
                                    <div className="bg-[#0D1F1F] border border-[#0C898B]/50 rounded-lg px-4 py-3 flex items-center justify-between">
                                        <span className="text-white font-semibold text-sm">Enable Early Bird</span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, earlyBirdEnabled: !prev.earlyBirdEnabled }))}
                                            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 ${formData.earlyBirdEnabled ? 'bg-[#14FFEC]' : 'bg-gray-700'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${formData.earlyBirdEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    {formData.earlyBirdEnabled && (
                                        <div className="space-y-3">
                                            {/* Cutoff Time */}
                                            <div className="bg-[#0D1F1F] border border-[#0C898B]/50 rounded-xl overflow-hidden">
                                                <div className="px-4 py-2 border-b border-[#0C898B]/20">
                                                    <label className="text-[#14FFEC] text-xs font-semibold">Cutoff Time *</label>
                                                </div>
                                                <div className={`px-4 py-2.5 ${fieldErrors.earlyBirdEndTime ? 'border-l-2 border-l-red-500' : ''}`}>
                                                    <input type="time" value={formData.earlyBirdEndTime}
                                                        onChange={(e) => { handleInputChange('earlyBirdEndTime', e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.earlyBirdEndTime; return n; }); }}
                                                        className="w-full bg-transparent text-white outline-none text-sm" />
                                                </div>
                                                {fieldErrors.earlyBirdEndTime && <p className="text-red-400 text-xs px-4 pb-2">{fieldErrors.earlyBirdEndTime}</p>}
                                            </div>

                                            {/* Early Bird: Male Stag */}
                                            {formData.maleStagEnabled && (
                                                <div className={`bg-[#0D1F1F] border ${!formData.earlyBirdMaleStagEnabled ? 'border-white/10' : 'border-[#0C898B]/50'} rounded-xl overflow-hidden transition-all`}>
                                                    <div className={`flex items-center justify-between px-4 py-3 ${!formData.earlyBirdMaleStagEnabled ? 'opacity-50' : ''}`}>
                                                        <button type="button" className="flex items-center gap-3"
                                                            onClick={() => setFormData(prev => ({ ...prev, earlyBirdMaleStagEnabled: !prev.earlyBirdMaleStagEnabled }))}>
                                                            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.earlyBirdMaleStagEnabled ? 'bg-[#14FFEC] border-[#14FFEC]' : 'border-gray-500'}`}>
                                                                {formData.earlyBirdMaleStagEnabled && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                            </div>
                                                            <span className="text-white font-semibold text-sm">Male Stag <span className="text-gray-400 font-normal">(Early Bird)</span></span>
                                                        </button>
                                                        {formData.earlyBirdMaleStagEnabled && (
                                                            <button onClick={() => setFormData(prev => ({ ...prev, earlyBirdMaleStagEnabled: false }))} className="text-gray-500 hover:text-red-400 transition-colors">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {formData.earlyBirdMaleStagEnabled && (
                                                        <div className="border-t border-[#0C898B]/20">
                                                            <div className={`flex items-center border-b border-[#0C898B]/20 px-4 py-2.5 ${fieldErrors.earlyBirdMaleStagPrice ? 'border-l-2 border-l-red-500' : ''}`}>
                                                                <input type="text" inputMode="numeric" placeholder="Price *" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                                    value={formData.earlyBirdMaleStagPrice}
                                                                    onChange={(e) => { handleInputChange('earlyBirdMaleStagPrice', e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.earlyBirdMaleStagPrice; return n; }); }} />
                                                            </div>
                                                            {fieldErrors.earlyBirdMaleStagPrice && <p className="text-red-400 text-xs px-4 py-1">{fieldErrors.earlyBirdMaleStagPrice}</p>}
                                                            <div className="flex items-center border-b border-[#0C898B]/20 px-4 py-2.5">
                                                                <input type="text" inputMode="numeric" placeholder="Cover / Redeem (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                                    value={formData.earlyBirdMaleStagFee} onChange={(e) => handleInputChange('earlyBirdMaleStagFee', e.target.value)} />
                                                            </div>
                                                            <div className="flex items-center px-4 py-2.5">
                                                                <input type="text" placeholder="Description (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                                    value={formData.earlyBirdMaleStagDesc} onChange={(e) => handleInputChange('earlyBirdMaleStagDesc', e.target.value)} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Early Bird: Female Stag */}
                                            {formData.femaleStagEnabled && (
                                                <div className={`bg-[#0D1F1F] border ${!formData.earlyBirdFemaleStagEnabled ? 'border-white/10' : 'border-[#0C898B]/50'} rounded-xl overflow-hidden transition-all`}>
                                                    <div className={`flex items-center justify-between px-4 py-3 ${!formData.earlyBirdFemaleStagEnabled ? 'opacity-50' : ''}`}>
                                                        <button type="button" className="flex items-center gap-3"
                                                            onClick={() => setFormData(prev => ({ ...prev, earlyBirdFemaleStagEnabled: !prev.earlyBirdFemaleStagEnabled }))}>
                                                            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.earlyBirdFemaleStagEnabled ? 'bg-[#14FFEC] border-[#14FFEC]' : 'border-gray-500'}`}>
                                                                {formData.earlyBirdFemaleStagEnabled && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                            </div>
                                                            <span className="text-white font-semibold text-sm">Female Stag <span className="text-gray-400 font-normal">(Early Bird)</span></span>
                                                        </button>
                                                        {formData.earlyBirdFemaleStagEnabled && (
                                                            <button onClick={() => setFormData(prev => ({ ...prev, earlyBirdFemaleStagEnabled: false }))} className="text-gray-500 hover:text-red-400 transition-colors">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {formData.earlyBirdFemaleStagEnabled && (
                                                        <div className="border-t border-[#0C898B]/20">
                                                            <div className={`flex items-center border-b border-[#0C898B]/20 px-4 py-2.5 ${fieldErrors.earlyBirdFemaleStagPrice ? 'border-l-2 border-l-red-500' : ''}`}>
                                                                <input type="text" inputMode="numeric" placeholder="Price *" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                                    value={formData.earlyBirdFemaleStagPrice}
                                                                    onChange={(e) => { handleInputChange('earlyBirdFemaleStagPrice', e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.earlyBirdFemaleStagPrice; return n; }); }} />
                                                            </div>
                                                            {fieldErrors.earlyBirdFemaleStagPrice && <p className="text-red-400 text-xs px-4 py-1">{fieldErrors.earlyBirdFemaleStagPrice}</p>}
                                                            <div className="flex items-center border-b border-[#0C898B]/20 px-4 py-2.5">
                                                                <input type="text" inputMode="numeric" placeholder="Cover / Redeem (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                                    value={formData.earlyBirdFemaleStagFee} onChange={(e) => handleInputChange('earlyBirdFemaleStagFee', e.target.value)} />
                                                            </div>
                                                            <div className="flex items-center px-4 py-2.5">
                                                                <input type="text" placeholder="Description (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                                    value={formData.earlyBirdFemaleStagDesc} onChange={(e) => handleInputChange('earlyBirdFemaleStagDesc', e.target.value)} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Early Bird: Couple */}
                                            {formData.coupleEnabled && (
                                                <div className={`bg-[#0D1F1F] border ${!formData.earlyBirdCoupleEnabled ? 'border-white/10' : 'border-[#0C898B]/50'} rounded-xl overflow-hidden transition-all`}>
                                                    <div className={`flex items-center justify-between px-4 py-3 ${!formData.earlyBirdCoupleEnabled ? 'opacity-50' : ''}`}>
                                                        <button type="button" className="flex items-center gap-3"
                                                            onClick={() => setFormData(prev => ({ ...prev, earlyBirdCoupleEnabled: !prev.earlyBirdCoupleEnabled }))}>
                                                            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.earlyBirdCoupleEnabled ? 'bg-[#14FFEC] border-[#14FFEC]' : 'border-gray-500'}`}>
                                                                {formData.earlyBirdCoupleEnabled && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                            </div>
                                                            <span className="text-white font-semibold text-sm">Couple <span className="text-gray-400 font-normal">(Early Bird)</span></span>
                                                        </button>
                                                        {formData.earlyBirdCoupleEnabled && (
                                                            <button onClick={() => setFormData(prev => ({ ...prev, earlyBirdCoupleEnabled: false }))} className="text-gray-500 hover:text-red-400 transition-colors">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {formData.earlyBirdCoupleEnabled && (
                                                        <div className="border-t border-[#0C898B]/20">
                                                            <div className={`flex items-center border-b border-[#0C898B]/20 px-4 py-2.5 ${fieldErrors.earlyBirdCouplePrice ? 'border-l-2 border-l-red-500' : ''}`}>
                                                                <input type="text" inputMode="numeric" placeholder="Price *" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                                    value={formData.earlyBirdCouplePrice}
                                                                    onChange={(e) => { handleInputChange('earlyBirdCouplePrice', e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.earlyBirdCouplePrice; return n; }); }} />
                                                            </div>
                                                            {fieldErrors.earlyBirdCouplePrice && <p className="text-red-400 text-xs px-4 py-1">{fieldErrors.earlyBirdCouplePrice}</p>}
                                                            <div className="flex items-center border-b border-[#0C898B]/20 px-4 py-2.5">
                                                                <input type="text" inputMode="numeric" placeholder="Cover / Redeem (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                                    value={formData.earlyBirdCoupleFee} onChange={(e) => handleInputChange('earlyBirdCoupleFee', e.target.value)} />
                                                            </div>
                                                            <div className="flex items-center px-4 py-2.5">
                                                                <input type="text" placeholder="Description (optional)" className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                                                    value={formData.earlyBirdCoupleDesc} onChange={(e) => handleInputChange('earlyBirdCoupleDesc', e.target.value)} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Free Male Stag per Couple promo - Early Bird */}
                                            <div className="bg-[#0D1F1F] border border-[#0C898B]/50 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-white font-semibold text-sm">Free Male Stag per Couple</span>
                                                    <p className="text-xs text-gray-400 mt-0.5">1 complimentary male stag per couple (early bird)</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, earlyBirdFreeMaleStagPerCoupleEnabled: !prev.earlyBirdFreeMaleStagPerCoupleEnabled }))}
                                                    className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${formData.earlyBirdFreeMaleStagPerCoupleEnabled ? 'bg-[#14FFEC]' : 'bg-gray-700'}`}
                                                >
                                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${formData.earlyBirdFreeMaleStagPerCoupleEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        </>
                        )}
                    </div>
                </div>

                {/* Bottom Save Button */}
                <div className="fixed bottom-0 app-bar z-50">
                    <div className="w-full h-[80px] relative bg-[#0D1F1F] shadow-[0px_30px_30px_-40px_#00968A_inset] overflow-hidden rounded-t-[40px] border-t-2 border-[#14FFEC]">
                        <div className="flex justify-center items-center px-8 h-full">
                            <div className="w-[220px] h-[45px] bg-[#0F6861] rounded-[30px] flex justify-center items-center">
                                <button
                                    onClick={handleSaveEvent}
                                    className="w-full h-full flex justify-center items-center"
                                >
                                    <span className="text-center text-white text-[16px] font-['Manrope'] font-bold tracking-[0.05px]">
                                        {isEditMode ? 'Save Changes' : 'Save & Create Event'}
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
                                        {isEditMode ? 'Update event' : 'Proceed to create event'}
                                    </div>
                                    <div className="text-center text-[#9D9C9C] text-[16px] font-['Manrope'] leading-[19.20px]">
                                        {isEditMode ? 'You are about to update this event' : 'You are about to create a new event'}
                                    </div>
                                </div>

                                <div className="flex items-center gap-[14px]">
                                    <button
                                        onClick={handleConfirmCreate}
                                        className="w-[154px] h-[38px] bg-[#007877] rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-[#008c8c] transition-all duration-300"
                                    >
                                        <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">
                                            {isEditMode ? 'Update event' : 'Create event'}
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
                                        {isEditMode ? 'Updating your event' : 'Creating your event'}
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

            <LocationModal
                title="Event Location"
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSelectLocation={(loc: any) => { setEventLocation(loc); setShowLocationModal(false); }}
                initialAddress={eventLocation || undefined}
            />
                    </div>
                </div>
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



