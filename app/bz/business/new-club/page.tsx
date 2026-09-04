'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, MapPin, ChevronRight, Plus, Trash2, Eye, Edit3, Heart, Share2, Loader2, Star } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LookupService, AllLookupData } from '@/lib/services/lookup.service';
import { ClubService } from '@/lib/services/club.service';
import { ProfileService } from '@/lib/services/profile.service';
import { AuthService } from '@/lib/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64 } from '@/lib/image-utils';
import { getDetailedErrorMessage, logDetailedError } from '@/lib/error-utils';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import LocationModal from '@/components/common/location-modal';
import '../new-event/styles.css';

// Tag Component for reusability
const TagComponent = ({ icon, label, iconPath }: { icon?: React.ReactNode, label: string, iconPath?: string }) => (
    <div className="px-3 py-2 bg-[rgba(40,60,61,0.30)] rounded-full flex items-center gap-2">
        {iconPath && <img src={iconPath} alt={label} className="w-4 h-4" />}
        {icon && icon}
        <span className="text-white text-xs">{label}</span>
    </div>
);

export default function NewClubPage() {
    const router = useRouter();
    const { toast } = useToast();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingClubs, setIsCheckingClubs] = useState(true);
    const [adminDetails, setAdminDetails] = useState({ email: '', phone: '' });
    const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0, city: '', state: '', pincode: '', address1: '', address2: '', country: '' });
    const [showLocationModal, setShowLocationModal] = useState(false);

    const [formData, setFormData] = useState({
        clubName: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        address1: '',
        address2: '',
        location: '',
        logo: null as File | null,
        foodCuisines: '',
        facilities: '',
        music: '',
        barOptions: '',
        hasTimeRestriction: false,
        timeRestriction: '',
        inclusions: '',
        exclusions: '',
        coupleEntryPrice: '',
        maleStagEntryPrice: '',
        femaleStagEntryPrice: '',
        groupEntryPrice: '',
        coverCharge: '',
        redeemDetails: ''
    });
    const [foodDrinksImages, setFoodDrinksImages] = useState<File[]>([]);
    const [ambienceImages, setAmbienceImages] = useState<File[]>([]);
    const [menuImages, setMenuImages] = useState<File[]>([]);
    const [foodDrinksPreview, setFoodDrinksPreview] = useState<string[]>(['', '', '']);
    const [ambiencePreview, setAmbiencePreview] = useState<string[]>(['', '', '']);
    const [menuPreview, setMenuPreview] = useState<string[]>(['', '', '']);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [lookupData, setLookupData] = useState<AllLookupData>({});
    const [isLoadingLookup, setIsLoadingLookup] = useState(true);
    const [selectedMusicGenres, setSelectedMusicGenres] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'form' | 'preview'>('form'); // Toggle between form and preview

    // References for image upload sections
    const foodDrinksRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
    const ambienceRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
    const menuRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    // Check club status on mount - redirect if club already added
    useEffect(() => {
        const checkClubStatus = () => {
            console.log('🔍 Checking club status...');
            
            // ROLE_ADMIN can create multiple clubs, skip this check
            const isAdmin = AuthService.hasRole('ADMIN') || AuthService.hasRole('ROLE_ADMIN');
            if (isAdmin) {
                console.log('✅ ROLE_ADMIN detected - can create multiple clubs');
                setIsCheckingClubs(false);
                return;
            }
            
            const clubStatus = ProfileService.getClubStatus();

            if (clubStatus.hasClub) {
                // Club already added - check if active or pending
                if (clubStatus.isActive) {
                    console.log('⚠️ Club already active! Redirecting to dashboard.');
                    toast({
                        title: "Club Already Active",
                        description: "Your club is already active. Redirecting to dashboard.",
                        variant: "default",
                    });
                    router.push('/bz/business');
                } else {
                    console.log('⚠️ Club pending approval! Redirecting to pending page.');
                    toast({
                        title: "Club Pending Approval",
                        description: "Your club is under review. Please wait for approval.",
                        variant: "default",
                    });
                    router.push('/business/club-pending');
                }
                return;
            }

            console.log('✅ No club added yet. User can create one.');
            setIsCheckingClubs(false);
        };

        checkClubStatus();
    }, [router, toast]);

    // Load pricing data from localStorage
    useEffect(() => {
        // Load ALL form data immediately on mount
        try {
            const savedFormData = localStorage.getItem('clubviz-form-data');
            if (savedFormData) {
                const formDataFromStorage = JSON.parse(savedFormData);
                setFormData(prevData => {
                    const merged = { ...prevData, ...formDataFromStorage };
                    // Preserve contact details if saved data is empty
                    if (!formDataFromStorage.contactEmail && prevData.contactEmail) {
                        merged.contactEmail = prevData.contactEmail;
                    }
                    if (!formDataFromStorage.contactPhone && prevData.contactPhone) {
                        merged.contactPhone = prevData.contactPhone;
                    }
                    return merged;
                });
                console.log('📝 Immediate Load - Saved Form Data:', formDataFromStorage);
            }
        } catch (error) {
            console.error('Failed to load saved form data on mount:', error);
        }

        const coupleEntryPrice = localStorage.getItem('coupleEntryPrice');
        const coverCharge = localStorage.getItem('coverCharge');
        const redeemDetails = localStorage.getItem('redeemDetails');
        const maleStagEntryPrice = localStorage.getItem('maleStagEntryPrice');
        const femaleStagEntryPrice = localStorage.getItem('femaleStagEntryPrice');
        const groupEntryPrice = localStorage.getItem('groupEntryPrice');

        if (coupleEntryPrice || coverCharge || redeemDetails) {
            setFormData(prev => ({
                ...prev,
                coupleEntryPrice: coupleEntryPrice || '',
                coverCharge: coverCharge || '',
                redeemDetails: redeemDetails || '',
                maleStagEntryPrice: maleStagEntryPrice || '',
                femaleStagEntryPrice: femaleStagEntryPrice || '',
                groupEntryPrice: groupEntryPrice || ''
            }));
        }
    }, []);

    // Load contact details from user data on mount
    useEffect(() => {
        const loadUserContactDetails = async () => {
            try {
                // Load location data first
                const locationData = localStorage.getItem(STORAGE_KEYS.clubSelectedLocation);
                if (locationData) {
                    const location = JSON.parse(locationData);
                    setSelectedLocation(location);
                    const locationString = buildLocationString(location);
                    setFormData(prev => ({
                        ...prev,
                        address1: location.address1 || prev.address1,
                        address2: location.address2 || prev.address2,
                        location: locationString,
                    }));
                    console.log('📍 Location Loaded on Mount:', location);
                }

                // Check multiple sources for user email and phone
                let email = localStorage.getItem('user-email') || 
                            localStorage.getItem('validatedEmail') || 
                            localStorage.getItem('pendingEmail') || '';
                let phone = localStorage.getItem('user-phone') || 
                            localStorage.getItem('validatedPhone') || 
                            localStorage.getItem(STORAGE_KEYS.pendingPhone) || '';

                // Fallback to STORAGE_KEYS.user ('clubviz-user')
                if (!email || !phone) {
                    const userDataStr = localStorage.getItem(STORAGE_KEYS.user);
                    if (userDataStr) {
                        try {
                            const user = JSON.parse(userDataStr);
                            email = email || user.email || user.contactEmail || '';
                            phone = phone || user.phoneNumber || user.mobileNumber || user.phone || user.contactPhone || '';
                        } catch (e) {
                            console.error('Error parsing stored user data:', e);
                        }
                    }
                }

                // Fallback to ProfileService or AuthService stored data
                if (!email || !phone) {
                    const currentUser = ProfileService.getCurrentUser();
                    if (currentUser) {
                        email = email || currentUser.email || '';
                        phone = phone || currentUser.phoneNumber || currentUser.mobileNumber || '';
                    }
                }

                // If still missing, fetch user profile directly from API endpoint
                if (!email || !phone) {
                    try {
                        console.log('📡 Fetching profile from API for user contact details...');
                        const profile = await ProfileService.getProfile();
                        if (profile) {
                            email = email || profile.email || '';
                            phone = phone || profile.phoneNumber || profile.mobileNumber || '';

                            // Cache for fast subsequent loads
                            if (profile.email) localStorage.setItem('user-email', profile.email);
                            if (profile.phoneNumber || profile.mobileNumber) {
                                localStorage.setItem('user-phone', profile.phoneNumber || profile.mobileNumber || '');
                            }
                            ProfileService.updateStoredProfileData(profile);
                        }
                    } catch (apiErr) {
                        console.warn('Could not fetch user profile API:', apiErr);
                    }
                }

                if (email || phone) {
                    const finalEmail = email || '';
                    const finalPhone = phone || '';
                    setAdminDetails({
                        email: finalEmail,
                        phone: finalPhone
                    });

                    // Pre-populate form with user account details
                    setFormData(prev => ({
                        ...prev,
                        contactEmail: finalEmail || prev.contactEmail,
                        contactPhone: finalPhone || prev.contactPhone
                    }));

                    console.log('✅ Contact details successfully loaded & set:', { email: finalEmail, phone: finalPhone });
                }
            } catch (error) {
                console.error('Failed to load admin contact details:', error);
            }
        };

        loadUserContactDetails();
    }, []);

    // Ensure formData contact details are synchronized with adminDetails whenever available
    useEffect(() => {
        if (adminDetails.email || adminDetails.phone) {
            setFormData(prev => ({
                ...prev,
                contactEmail: adminDetails.email || prev.contactEmail,
                contactPhone: adminDetails.phone || prev.contactPhone
            }));
        }
    }, [adminDetails]);

    useEffect(() => {
        if (isCheckingClubs) return; // Don't load anything until we verify club count

        const fetchLookupData = async () => {
            try {
                setIsLoadingLookup(true);
                const response = await LookupService.getAllLookupData();
                if (response.success) {
                    setLookupData(response.data);
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to load club categories",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error('Failed to fetch lookup data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load club categories",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingLookup(false);
            }
        };

        // Load selected location from localStorage
        const loadSelectedLocation = () => {
            try {
                const locationData = localStorage.getItem(STORAGE_KEYS.clubSelectedLocation);
                if (locationData) {
                    const location = JSON.parse(locationData);
                    setSelectedLocation(location);
                    setFormData(prev => ({
                        ...prev,
                        address1: location.address1 || prev.address1,
                        address2: location.address2 || prev.address2,
                    }));
                    console.log('📍 Loaded Selected Location:', location);
                }
            } catch (error) {
                console.error('Failed to load location:', error);
            }
        };

        // Load selected music genres from localStorage
        const loadSelectedMusicGenres = () => {
            try {
                const musicGenresData = localStorage.getItem('clubviz-selected-music-genres');
                if (musicGenresData) {
                    const genres = JSON.parse(musicGenresData);
                    setSelectedMusicGenres(genres);
                    console.log('🎵 Loaded Selected Music Genres:', genres);
                }
            } catch (error) {
                console.error('Failed to load music genres:', error);
            }
        };

        // Load saved form data from localStorage
        const loadSavedFormData = () => {
            try {
                const savedFormData = localStorage.getItem('clubviz-form-data');
                if (savedFormData) {
                    const formDataFromStorage = JSON.parse(savedFormData);
                    setFormData(prevData => ({
                        ...prevData,
                        ...formDataFromStorage,
                        contactEmail: prevData.contactEmail || formDataFromStorage.contactEmail || adminDetails.email || '',
                        contactPhone: prevData.contactPhone || formDataFromStorage.contactPhone || adminDetails.phone || ''
                    }));
                    console.log('📝 Loaded Saved Form Data:', formDataFromStorage);
                }
            } catch (error) {
                console.error('Failed to load saved form data:', error);
            }
        };

        // Load saved image previews from localStorage
        const loadSavedImagePreviews = () => {
            try {
                // Load logo preview
                const savedLogoPreview = localStorage.getItem('clubviz-logo-preview');
                if (savedLogoPreview) {
                    setLogoPreview(savedLogoPreview);
                    console.log('🖼️ Loaded Saved Logo Preview');
                }

                // Load food/drinks previews
                const savedFoodDrinksPreview = localStorage.getItem('clubviz-food-drinks-preview');
                if (savedFoodDrinksPreview) {
                    const previews = JSON.parse(savedFoodDrinksPreview);
                    setFoodDrinksPreview(previews);
                    console.log('🖼️ Loaded Saved Food/Drinks Previews');
                }

                // Load ambience previews
                const savedAmbiencePreview = localStorage.getItem('clubviz-ambience-preview');
                if (savedAmbiencePreview) {
                    const previews = JSON.parse(savedAmbiencePreview);
                    setAmbiencePreview(previews);
                    console.log('🖼️ Loaded Saved Ambience Previews');
                }

                // Load menu previews
                const savedMenuPreview = localStorage.getItem('clubviz-menu-preview');
                if (savedMenuPreview) {
                    const previews = JSON.parse(savedMenuPreview);
                    setMenuPreview(previews);
                    console.log('🖼️ Loaded Saved Menu Previews');
                }
            } catch (error) {
                console.error('Failed to load saved image previews:', error);
            }
        };

        fetchLookupData();
        loadSelectedLocation();
        loadSelectedMusicGenres();
        loadSavedFormData();
        loadSavedImagePreviews();

        // Listen for location updates from the location page
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEYS.clubSelectedLocation && e.newValue) {
                const location = JSON.parse(e.newValue);
                setSelectedLocation(location);
                setFormData(prev => ({
                    ...prev,
                    address1: location.address1 || prev.address1,
                    address2: location.address2 || prev.address2,
                }));
                console.log('📍 Location Updated:', location);
            } else if (e.key === STORAGE_KEYS.clubSelectedMusicGenres && e.newValue) {
                const genres = JSON.parse(e.newValue);
                setSelectedMusicGenres(genres);
                console.log('🎵 Music Genres Updated:', genres);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [toast, isCheckingClubs]);

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('clubviz-form-data', JSON.stringify(formData));
            console.log('💾 Saved Form Data to localStorage');
        } catch (error) {
            console.error('Failed to save form data to localStorage:', error);
        }
    }, [formData]);

    // Helper for safe localStorage persistence with quota handling
    const safeSetLocalStorage = (key: string, value: string) => {
        try {
            // Skip storing massive base64 strings (> 1.5MB) to preserve localStorage quota
            if (value && value.length > 1500000) {
                console.warn(`⚠️ Skipping localStorage cache for ${key} (file size > 1.5MB)`);
                return;
            }
            localStorage.setItem(key, value);
        } catch (error: any) {
            if (error?.name === 'QuotaExceededError' || error?.code === 22) {
                console.warn(`⚠️ Storage quota exceeded while saving ${key}. Preview retained in active memory.`);
            } else {
                console.warn(`Could not save ${key} to localStorage:`, error);
            }
        }
    };

    // Save logo preview to localStorage whenever it changes
    useEffect(() => {
        if (logoPreview) {
            safeSetLocalStorage('clubviz-logo-preview', logoPreview);
            console.log('💾 Saved Logo Preview to localStorage');
        } else {
            try { localStorage.removeItem('clubviz-logo-preview'); } catch (e) {}
        }
    }, [logoPreview]);

    // Save food/drinks previews to localStorage whenever they change
    useEffect(() => {
        if (foodDrinksPreview.some(p => p)) {
            safeSetLocalStorage('clubviz-food-drinks-preview', JSON.stringify(foodDrinksPreview));
            console.log('💾 Saved Food/Drinks Previews to localStorage');
        } else {
            try { localStorage.removeItem('clubviz-food-drinks-preview'); } catch (e) {}
        }
    }, [foodDrinksPreview]);

    // Save ambience previews to localStorage whenever they change
    useEffect(() => {
        if (ambiencePreview.some(p => p)) {
            safeSetLocalStorage('clubviz-ambience-preview', JSON.stringify(ambiencePreview));
            console.log('💾 Saved Ambience Previews to localStorage');
        } else {
            try { localStorage.removeItem('clubviz-ambience-preview'); } catch (e) {}
        }
    }, [ambiencePreview]);

    // Save menu previews to localStorage whenever they change
    useEffect(() => {
        if (menuPreview.some(p => p)) {
            safeSetLocalStorage('clubviz-menu-preview', JSON.stringify(menuPreview));
            console.log('💾 Saved Menu Previews to localStorage');
        } else {
            try { localStorage.removeItem('clubviz-menu-preview'); } catch (e) {}
        }
    }, [menuPreview]);

    // Helper function to get club tags from lookup data
    const getClubTags = () => {
        const tags = [];
        if (lookupData.facilities && lookupData.facilities.length > 0) {
            tags.push({ label: 'Facilities', key: 'facilities' });
        }
        if (lookupData.foodCuisines && lookupData.foodCuisines.length > 0) {
            tags.push({ label: 'Food', key: 'foodCuisines' });
        }
        if (lookupData.music && lookupData.music.length > 0) {
            tags.push({ label: 'Music', key: 'music' });
        }
        if (lookupData.barOptions && lookupData.barOptions.length > 0) {
            tags.push({ label: 'Bar', key: 'barOptions' });
        }
        return tags;
    };

    const handleGoBack = () => {
        router.push('/business');
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleLogoUpload = () => {
        logoInputRef.current?.click();
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, logo: file });
            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogoPreview(event.target?.result as string);
                console.log('✅ Logo preview generated');
            };
            reader.readAsDataURL(file);
            console.log('📸 Logo file stored:', file.name, file.size, 'bytes');
        }
    };

    const handleDeleteLogo = () => {
        setFormData({ ...formData, logo: null });
        setLogoPreview('');
        if (logoInputRef.current) {
            logoInputRef.current.value = '';
        }
        console.log('🗑️ Logo deleted');
    };

    const handleFoodDrinksImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const newImages = [...foodDrinksImages];
            newImages[index] = file;
            setFoodDrinksImages(newImages);

            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                const newPreviews = [...foodDrinksPreview];
                newPreviews[index] = event.target?.result as string;
                setFoodDrinksPreview(newPreviews);
                console.log(`✅ Food/Drinks image ${index} preview generated`);
            };
            reader.readAsDataURL(file);
            console.log(`📸 Food/Drinks image ${index} uploaded:`, file.name, file.size, 'bytes');
        }
    };

    const handleAmbienceImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const newImages = [...ambienceImages];
            newImages[index] = file;
            setAmbienceImages(newImages);

            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                const newPreviews = [...ambiencePreview];
                newPreviews[index] = event.target?.result as string;
                setAmbiencePreview(newPreviews);
                console.log(`✅ Ambience image ${index} preview generated`);
            };
            reader.readAsDataURL(file);
            console.log(`📸 Ambience image ${index} uploaded:`, file.name, file.size, 'bytes');
        }
    };

    const handleMenuImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const newImages = [...menuImages];
            newImages[index] = file;
            setMenuImages(newImages);

            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                const newPreviews = [...menuPreview];
                newPreviews[index] = event.target?.result as string;
                setMenuPreview(newPreviews);
                console.log(`✅ Menu image ${index} preview generated`);
            };
            reader.readAsDataURL(file);
            console.log(`📸 Menu image ${index} uploaded:`, file.name, file.size, 'bytes');
        }
    };

    const handleDeleteFoodDrinksImage = (index: number) => {
        const newImages = [...foodDrinksImages];
        newImages.splice(index, 1);
        setFoodDrinksImages(newImages);
        const newPreviews = [...foodDrinksPreview];
        newPreviews[index] = '';
        setFoodDrinksPreview(newPreviews);
        if (foodDrinksRefs[index]?.current) {
            foodDrinksRefs[index].current.value = '';
        }
        console.log(`🗑️ Food/Drinks image ${index} deleted`);
    };

    const handleDeleteAmbienceImage = (index: number) => {
        const newImages = [...ambienceImages];
        newImages.splice(index, 1);
        setAmbienceImages(newImages);
        const newPreviews = [...ambiencePreview];
        newPreviews[index] = '';
        setAmbiencePreview(newPreviews);
        if (ambienceRefs[index]?.current) {
            ambienceRefs[index].current.value = '';
        }
        console.log(`🗑️ Ambience image ${index} deleted`);
    };

    const handleDeleteMenuImage = (index: number) => {
        const newImages = [...menuImages];
        newImages.splice(index, 1);
        setMenuImages(newImages);
        const newPreviews = [...menuPreview];
        newPreviews[index] = '';
        setMenuPreview(newPreviews);
        if (menuRefs[index]?.current) {
            menuRefs[index].current.value = '';
        }
        console.log(`🗑️ Menu image ${index} deleted`);
    };

    const handleImageUpload = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleNavigate = (path: string) => {
        // Navigate to specific sections
        if (path === '/location') {
            setShowLocationModal(true);
        } else if (path === '/tags/music') {
            router.push('/bz/business/tags/music');
        } else if (path === '/entry-pricing') {
            router.push('/bz/business/add-entry-pricing');
        } else {
            console.log(`Navigating to ${path}`);
        }
    };

    const buildLocationString = (location: any) => {
        const parts = [location.address1, location.address2, location.city, location.state, location.pincode].filter(Boolean);
        const coordinates = location.lat && location.lng ? ` (${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})` : '';
        return parts.length > 0 ? `${parts.join(', ')}${coordinates}` : `Current Location${coordinates}`;
    };

    const handleLocationSelect = (location: any) => {
        console.log('📍 Location selected:', location);
        setSelectedLocation(location);
        const locationString = buildLocationString(location);

        setFormData(prev => ({
            ...prev,
            address1: location.address1 || prev.address1,
            address2: location.address2 || prev.address2,
            location: locationString,
        }));
        
        // Save to localStorage for persistence
        localStorage.setItem(STORAGE_KEYS.clubSelectedLocation, JSON.stringify(location));
        
        toast({
            title: "Success",
            description: "Location saved successfully",
            variant: "default"
        });
    };

    const handleCreateClub = async () => {
        // Validate required fields
        if (!formData.clubName.trim()) {
            toast({
                title: "Error",
                description: "Club name is required",
                variant: "destructive",
            });
            return;
        }

        // Resolve contact details from form data, admin details, or local storage fallbacks
        const contactEmailToUse = (
            formData.contactEmail || 
            adminDetails.email || 
            (typeof window !== 'undefined' ? (localStorage.getItem('user-email') || localStorage.getItem('validatedEmail') || '') : '')
        ).trim();

        const contactPhoneToUse = (
            formData.contactPhone || 
            adminDetails.phone || 
            (typeof window !== 'undefined' ? (localStorage.getItem('user-phone') || localStorage.getItem('validatedPhone') || '') : '')
        ).trim();

        // Validate contact email
        if (!contactEmailToUse) {
            toast({
                title: "Error",
                description: "Contact email is required",
                variant: "destructive",
            });
            return;
        }

        // Validate contact phone
        if (!contactPhoneToUse) {
            toast({
                title: "Error",
                description: "Contact phone is required",
                variant: "destructive",
            });
            return;
        }

        // Check if user is logged in and has admin role
        const token = typeof window !== 'undefined' ? localStorage.getItem('clubviz-accessToken') : null;

        if (!token) {
            toast({
                title: "Authentication Required",
                description: "Please log in as an admin to create clubs",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if we have files to upload
            const hasFiles = formData.logo || 
                           foodDrinksImages.some(img => img) || 
                           ambienceImages.some(img => img) || 
                           menuImages.some(img => img);

            // Construct payload with metadata only (no base64 images)
            const clubData: any = {
                "name": formData.clubName.trim(),
                "description": formData.description.trim() || "",
                "contactEmail": contactEmailToUse,
                "contactPhone": contactPhoneToUse,
                locationText: {
                    address1: selectedLocation.address1 || formData.address1 || "",
                    address2: selectedLocation.address2 || formData.address2 || "",
                    city: selectedLocation.city || undefined,
                    state: selectedLocation.state || undefined,
                    country: selectedLocation.country || undefined,
                    pincode: selectedLocation.pincode || undefined,
                    latitude: selectedLocation.lat || undefined,
                    longitude: selectedLocation.lng || undefined,
                    lat: selectedLocation.lat || undefined,
                    lng: selectedLocation.lng || undefined,
                    fullAddress: [
                        selectedLocation.address1 || formData.address1,
                        selectedLocation.address2 || formData.address2,
                        selectedLocation.city,
                        selectedLocation.state,
                        selectedLocation.pincode,
                        selectedLocation.country
                    ]
                        .filter(Boolean)
                        .join(', '),
                },
            };

            console.log('🚀 Creating Club with Images - Payload:', clubData);
            console.log('📡 API Call: POST /clubs/create-json-with-images');
            console.log('📸 Has Files:', hasFiles);

            let response;
            if (hasFiles) {
                response = await ClubService.createClubMultipart(clubData, {
                    logo: formData.logo,
                    mainImage: null,
                    galleryImages: [],
                    foodImages: foodDrinksImages.filter(img => img),
                    ambianceImages: ambienceImages.filter(img => img),
                    menuImages: menuImages.filter(img => img)
                });
            } else {
                response = await ClubService.createClub(clubData);
            }

            console.log('✅ Club created successfully:', response);

            // Update stored profile data with club status
            ProfileService.updateStoredProfileData({
                isClubAdded: true,
                isActive: false // Club is pending approval
            });

            // Clear saved form data from localStorage
            try {
                localStorage.removeItem('clubviz-form-data');
                localStorage.removeItem('clubviz-logo-preview');
                localStorage.removeItem('clubviz-food-drinks-preview');
                localStorage.removeItem('clubviz-ambience-preview');
                localStorage.removeItem('clubviz-menu-preview');
                console.log('🧹 Cleared all saved form data and image previews');
            } catch (error) {
                console.error('Failed to clear saved form data:', error);
            }

            toast({
                title: "Success",
                description: `Club "${formData.clubName}" created successfully! Your club is now under review.`,
                variant: "default",
            });

            // Redirect to club pending page
            setTimeout(() => {
                router.push('/business/club-pending');
            }, 1000);

        } catch (error: any) {
            logDetailedError('Club creation error', error);

            const errorMessage = getDetailedErrorMessage(error, 'Failed to create club. Please try again.');

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            {/* Location Modal */}
            <LocationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSelectLocation={handleLocationSelect}
                initialAddress={{
                    address1: selectedLocation.address1 || '',
                    address2: selectedLocation.address2 || '',
                    city: selectedLocation.city || '',
                    state: selectedLocation.state || '',
                    country: selectedLocation.country || '',
                    pincode: selectedLocation.pincode || '',
                    lat: selectedLocation.lat || undefined,
                    lng: selectedLocation.lng || undefined
                }}
            />

            {/* Show loading state while checking for existing clubs */}
            {isCheckingClubs && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#14FFEC] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[#14FFEC]">Checking club status...</p>
                    </div>
                </div>
            )}

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
                <div className="absolute top-10 right-6">
                    <button
                        onClick={() => setViewMode(viewMode === 'form' ? 'preview' : 'form')}
                        className="px-4 py-2 bg-[#14FFEC] text-black rounded-full flex items-center gap-2 font-semibold hover:bg-[#14FFEC]/90 transition-all"
                    >
                        {viewMode === 'form' ? (
                            <>
                                <Eye className="w-4 h-4" />
                                Preview
                            </>
                        ) : (
                            <>
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </>
                        )}
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <h1 className="text-xl font-bold text-white">Create Club</h1>
                </div>
            </div>

            {/* Main Content - Scrollable container */}
            <div className="px-0 pt-[100px] pb-20 relative z-40" style={{ opacity: isCheckingClubs ? 0.5 : 1, pointerEvents: isCheckingClubs ? 'none' : 'auto' }}>
                {viewMode === 'preview' ? (
                    /* Preview Mode - Club Display Template */
                    <div className="min-h-screen bg-[#021313] relative w-full max-w-[430px] mx-auto">
                        {/* Hero Image Carousel */}
                        <div className="relative w-full h-[40vh] overflow-hidden">
                            <div className="absolute inset-0 flex">
                                {[logoPreview || '/venue/Screenshot 2024-12-10 195651.png'].map((image, index) => (
                                    <img
                                        key={index}
                                        className="min-w-full h-full object-cover"
                                        src={image}
                                        alt={`Hero ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Profile picture - positioned exactly at the border */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 z-20" style={{ top: 'calc(35vh - 42.5px)' }}>
                            <div className="w-[85px] h-[85px] rounded-full border-4 border-[#08C2B3] overflow-hidden shadow-xl">
                                <img
                                    src={logoPreview || '/dabo ambience main dabo page/Media.jpg'}
                                    alt="Club Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Rating Circle - positioned independently */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 z-20" style={{ top: 'calc(35vh + 15px)' }}>
                            <div className="w-[40px] h-[40px] relative">
                                <div style={{ width: "100%", height: "100%", left: "0px", top: "0px", position: "absolute", background: "#005D5C", borderRadius: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <div style={{ color: "#FFF4F4", fontSize: "16px", fontFamily: "Manrope", fontWeight: "700", lineHeight: "21px", wordWrap: "break-word" }}>4.2</div>
                                </div>
                            </div>
                        </div>

                        {/* Main content */}
                        <div className="bg-gradient-to-b from-[#021313] to-[rgba(2,19,19,0)] mt-[-5vh] rounded-t-[40px] relative z-0 px-4 pb-[18px] w-full">
                            <div className="flex flex-col items-center w-full" style={{ paddingTop: 'calc(6vh + 30px)' }}>
                                {/* Title */}
                                <h1 className="text-white text-[36px] tracking-[0.36px] text-center font-normal leading-[35px] mb-3" style={{ fontFamily: "'Anton', sans-serif" }}>
                                    {formData.clubName || 'Club Name'}
                                </h1>

                                {/* Main Content Container */}
                                <div className="w-full px-4 py-3 bg-[rgba(40,60,61,0.30)] rounded-[15px] flex flex-col gap-[8px]">
                                    {/* Now Playing Section */}
                                    <div className="flex flex-col gap-[8px] mt-2">
                                        <h3 className="text-[#FFFEFF] text-lg font-semibold mb-1 px-1">Now Playing</h3>
                                        <div className="relative w-full h-[110px] bg-[rgba(31.93,42.75,43.32,0.60)] rounded-[15px] overflow-hidden">
                                            <div className="absolute left-4 top-[25px] w-[50px] h-[50px] rounded-full flex items-center justify-center bg-white/10 backdrop-blur-[10px] border border-white/20">
                                                <img src="/club/dj.gif" alt="Music Visualization" className="w-[48px] h-[48px] object-cover rounded-full" />
                                            </div>
                                            <div className="absolute left-[75px] right-[15px]">
                                                <div className="mt-[15px] text-white text-[14px] font-medium">Club Music</div>
                                                <div className="mt-[5px] text-white text-[12px] font-normal opacity-80">Now playing</div>
                                                <div className="flex mt-[12px] gap-3">
                                                    {formData.music ? (
                                                        formData.music.split(',').slice(0, 2).map((genre, idx) => (
                                                            <div key={idx} className="px-[8px] py-[2px] bg-[#202B2B99] rounded-full border border-[#28D2DB] flex items-center gap-[3px]">
                                                                <span className="text-white text-[10px]">{genre.trim()}</span>
                                                                <div className="w-[4px] h-[4px] bg-[#C50000] rounded-full"></div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-white/50 text-xs">No music genres</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Entry/Booking */}
                                    <div className="flex flex-col gap-[8px] mt-3">
                                        <h3 className="text-[#FFFEFF] text-lg font-semibold mb-1 px-1">Entry/Booking</h3>
                                        <div 
                                            onClick={() => handleNavigate('/entry-pricing')}
                                            className="relative bg-[rgba(31.93,42.75,43.32,0.60)] rounded-[15px] overflow-hidden cursor-pointer"
                                        >
                                            <div className="bg-[#263438] rounded-[15px] p-3 pb-5">
                                                <div className="flex w-full border-b border-gray-700">
                                                    <div className="flex-1 text-center pb-2 relative">
                                                        <div className="text-white text-[12px] font-[600]">
                                                            Couple & Group<br />Entry
                                                        </div>
                                                        <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-[#14FFEC] rounded-t-[4px]"></div>
                                                    </div>
                                                    <div className="flex-1 text-center pb-2">
                                                        <div className="text-white text-[12px] font-[600] opacity-70">
                                                            Male stag<br />Entry
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 text-center pb-2">
                                                        <div className="text-white text-[12px] font-[600] opacity-70">
                                                            Female stag<br />Entry
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="pt-4 pb-2 relative">
                                                    <div className="text-center">
                                                        <div className="text-[#14FFEC] text-[15px] font-[500] mb-1">
                                                            Rs {formData.coupleEntryPrice || '0'} (Cover - {formData.coverCharge || '0'})
                                                        </div>
                                                        <div className="text-[#D9D9D9] text-[12px] font-[500]">
                                                            {formData.redeemDetails || 'Redeem details'}
                                                        </div>
                                                    </div>
                                                    <div className="absolute right-[8px] bottom-0 w-[30px] h-[30px] bg-[#0D7377] rounded-full flex items-center justify-center">
                                                        <ChevronRight className="w-5 h-5 text-[#14FFEC]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Photos Section */}
                                <div className="w-full mt-5 mb-5">
                                    <h3 className="text-white text-base font-semibold mb-4">Photos</h3>
                                    <div className="w-full bg-[rgba(40,60,61,0.30)] rounded-[15px] p-4 flex flex-wrap gap-2 justify-center">
                                        {(foodDrinksPreview.filter(Boolean).length > 0 || ambiencePreview.filter(Boolean).length > 0) ? (
                                            [...foodDrinksPreview, ...ambiencePreview].filter(Boolean).slice(0, 5).map((img: string, idx: number) => (
                                                <div key={idx} className={`${idx < 2 ? 'w-[48%] h-44' : 'w-[31%] h-28'} bg-gray-700 rounded-[15px]`}>
                                                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover rounded-[15px]" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-white/50 text-sm text-center py-8 w-full">No photos available</div>
                                        )}
                                    </div>
                                </div>

                                {/* Facilities Section - Always show header */}
                                <div className="w-full mt-5 mb-5">
                                    <h3 className="text-white text-xl font-semibold mb-4">Facilities</h3>
                                    <div className="grid grid-cols-2 gap-2 bg-[rgba(40,60,61,0.30)] rounded-[15px] p-3">
                                        {formData.facilities ? (
                                            formData.facilities.split(',').map((facility: string, idx: number) => (
                                                <TagComponent
                                                    key={idx}
                                                    iconPath="/club/facilities/Clock (1).svg"
                                                    label={facility.trim()}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-white/50 text-xs col-span-2 text-center py-3">No facilities available</div>
                                        )}
                                    </div>
                                </div>

                                {/* Food Section - Always show header */}
                                <div className="w-full mt-5 mb-5">
                                    <h3 className="text-white text-xl font-semibold mb-4">Food</h3>
                                    <div className="flex flex-wrap gap-2 bg-[rgba(40,60,61,0.30)] rounded-[15px] p-3">
                                        {formData.foodCuisines ? (
                                            formData.foodCuisines.split(',').map((cuisine: string, idx: number) => (
                                                <TagComponent
                                                    key={idx}
                                                    iconPath="/club/food/BowlFood (1).svg"
                                                    label={cuisine.trim()}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-white/50 text-xs w-full text-center py-3">No food options available</div>
                                        )}
                                    </div>
                                </div>

                                {/* Music Section - Always show header */}
                                <div className="w-full mt-5 mb-5">
                                    <h3 className="text-white text-xl font-semibold mb-4">Music</h3>
                                    <div className="flex flex-wrap gap-2 bg-[rgba(40,60,61,0.30)] rounded-[15px] p-3">
                                        {formData.music ? (
                                            formData.music.split(',').map((genre: string, idx: number) => (
                                                <TagComponent
                                                    key={idx}
                                                    iconPath="/club/music/Equalizer.svg"
                                                    label={genre.trim()}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-white/50 text-xs w-full text-center py-3">No music genres available</div>
                                        )}
                                    </div>
                                </div>

                                {/* Bar Section - Always show header */}
                                <div className="w-full mt-5 mb-5">
                                    <h3 className="text-white text-xl font-semibold mb-4">Bar</h3>
                                    <div className="flex flex-wrap gap-2 bg-[rgba(40,60,61,0.30)] rounded-[15px] p-3">
                                        {formData.barOptions ? (
                                            formData.barOptions.split(',').map((option: string, idx: number) => (
                                                <TagComponent
                                                    key={idx}
                                                    iconPath="/club/bar/Martini (1).svg"
                                                    label={option.trim()}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-white/50 text-xs w-full text-center py-3">No bar options available</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Form Mode */
                    <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col items-center gap-[20px] p-[20px_14px_30px]">
                        {/* Logo Upload */}
                        <div
                            onClick={handleLogoUpload}
                            className="w-[160px] h-[160px] bg-[#0D1F1F] rounded-[15px] border border-[#14FFEC] flex flex-col items-center justify-center p-2 cursor-pointer overflow-hidden group hover:bg-[#0D1F1F]/70 transition-all"
                        >
                            {logoPreview ? (
                                <div className="relative w-full h-full">
                                    <img
                                        src={logoPreview}
                                        alt="Logo Preview"
                                        className="w-full h-full object-cover rounded-[13px]"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteLogo();
                                        }}
                                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                                    >
                                        <Trash2 size={16} className="text-white" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-[32px] h-[32px] text-[#14FFEC] mb-2 stroke-[1.5]" />
                                    <p className="text-white text-center text-[12px] font-semibold leading-[12px] tracking-[0.5px]">Upload logo</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                        />

                        {/* Club Name */}
                        <div className="w-full flex flex-col gap-[11px]">
                            <div className="px-5">
                                <label className="text-[#14FFEC] font-semibold text-base">
                                    Club Name <span className="text-red-500 text-lg">*</span>
                                </label>
                            </div>
                            <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                <input
                                    type="text"
                                    value={formData.clubName}
                                    onChange={(e) => handleInputChange('clubName', e.target.value)}
                                    className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                    placeholder="Enter Club Name Here"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="w-full flex flex-col gap-[11px]">
                            <div className="px-5">
                                <label className="text-[#14FFEC] font-semibold text-base">Description</label>
                            </div>
                            <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold min-h-[80px]"
                                    placeholder="Enter club description"
                                />
                            </div>
                        </div>

                        {/* Contact Info - Auto-filled from user account (Disabled) */}
                        <div className="w-full flex flex-col gap-4">
                            <div className="flex flex-col gap-[11px]">
                                <div className="px-5 flex items-center justify-between">
                                    <label className="text-[#14FFEC] font-semibold text-base">Contact Email <span className="text-red-500">*</span></label>
                                    <span className="text-[#9D9C9C] text-xs font-medium">From your account</span>
                                </div>
                                <div className="w-full bg-[#0D1F1F]/60 border border-[#0C898B]/50 rounded-[30px] p-[10px] px-5 opacity-80 cursor-not-allowed">
                                    <input
                                        type="email"
                                        value={formData.contactEmail || adminDetails.email || ''}
                                        disabled={true}
                                        readOnly={true}
                                        className="w-full bg-transparent text-[#14FFEC] placeholder-[#9D9C9C] outline-none text-base font-semibold cursor-not-allowed select-none"
                                        placeholder="From your account"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-[11px]">
                                <div className="px-5 flex items-center justify-between">
                                    <label className="text-[#14FFEC] font-semibold text-base">Contact Phone <span className="text-red-500">*</span></label>
                                    <span className="text-[#9D9C9C] text-xs font-medium">From your account</span>
                                </div>
                                <div className="w-full bg-[#0D1F1F]/60 border border-[#0C898B]/50 rounded-[30px] p-[10px] px-5 opacity-80 cursor-not-allowed">
                                    <input
                                        type="text"
                                        value={formData.contactPhone || adminDetails.phone || ''}
                                        disabled={true}
                                        readOnly={true}
                                        className="w-full bg-transparent text-[#14FFEC] placeholder-[#9D9C9C] outline-none text-base font-semibold cursor-not-allowed select-none"
                                        placeholder="From your account"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Photos Section - Hidden */}
                        <div className="w-full hidden">
                            <div className="px-5 mb-2">
                                <h3 className="text-white font-semibold text-base">Photos</h3>
                            </div>

                            {/* Food/Drinks Section */}
                            <div className="w-full bg-[#0D1F1F] rounded-[15px] p-[8px_0_12px] flex flex-col items-center gap-[6px] mb-2">
                                <div className="w-full flex flex-col items-center gap-[9px]">
                                    <div className="w-full px-4">
                                        <p className="text-[#14FFEC] text-base font-medium tracking-[0.5px]">Food/Drinks</p>
                                    </div>
                                    <div className="flex items-center gap-[9px]">
                                        {[0, 1, 2].map((index) => (
                                            <div
                                                key={`food-drink-${index}`}
                                                onClick={() => handleImageUpload(foodDrinksRefs[index])}
                                                className="w-[130px] h-[130px] bg-[#0D1F1F] rounded-[15px] border border-[#14FFEC] flex items-center justify-center cursor-pointer overflow-hidden group hover:bg-[#0D1F1F]/70 transition-all"
                                            >
                                                {foodDrinksPreview[index] ? (
                                                    <div className="relative w-full h-full">
                                                        <img
                                                            src={foodDrinksPreview[index]}
                                                            alt={`Food/Drinks ${index + 1}`}
                                                            className="w-full h-full object-cover rounded-[13px]"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteFoodDrinksImage(index);
                                                            }}
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                                                        >
                                                            <Trash2 size={14} className="text-white" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-[25px] h-[25px] bg-[#14FFEC] rounded-full flex items-center justify-center">
                                                        <Plus className="w-[12px] h-[12px] text-[#004342]" />
                                                    </div>
                                                )}
                                                <input
                                                    ref={foodDrinksRefs[index]}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFoodDrinksImageChange(e, index)}
                                                    className="hidden"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Ambience Section */}
                            <div className="w-full bg-[#0D1F1F] rounded-[15px] p-[8px_0_12px] flex flex-col items-center gap-[6px] mb-2">
                                <div className="w-full flex flex-col items-center gap-[9px]">
                                    <div className="w-full px-4">
                                        <p className="text-[#14FFEC] text-base font-medium tracking-[0.5px]">Ambience</p>
                                    </div>
                                    <div className="flex items-center gap-[9px]">
                                        {[0, 1, 2].map((index) => (
                                            <div
                                                key={`ambience-${index}`}
                                                onClick={() => handleImageUpload(ambienceRefs[index])}
                                                className="w-[130px] h-[130px] bg-[#0D1F1F] rounded-[15px] border border-[#14FFEC] flex items-center justify-center cursor-pointer overflow-hidden group hover:bg-[#0D1F1F]/70 transition-all"
                                            >
                                                {ambiencePreview[index] ? (
                                                    <div className="relative w-full h-full">
                                                        <img
                                                            src={ambiencePreview[index]}
                                                            alt={`Ambience ${index + 1}`}
                                                            className="w-full h-full object-cover rounded-[13px]"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteAmbienceImage(index);
                                                            }}
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                                                        >
                                                            <Trash2 size={14} className="text-white" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-[25px] h-[25px] bg-[#14FFEC] rounded-full flex items-center justify-center">
                                                        <Plus className="w-[12px] h-[12px] text-[#004342]" />
                                                    </div>
                                                )}
                                                <input
                                                    ref={ambienceRefs[index]}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleAmbienceImageChange(e, index)}
                                                    className="hidden"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Menu Section */}
                            <div className="w-full bg-[#0D1F1F] rounded-[15px] p-[8px_0_12px] flex flex-col items-center gap-[6px]">
                                <div className="w-full flex flex-col items-center gap-[9px]">
                                    <div className="w-full px-4">
                                        <p className="text-[#14FFEC] text-base font-medium tracking-[0.5px]">Menu</p>
                                    </div>
                                    <div className="flex items-center gap-[9px]">
                                        {[0, 1, 2].map((index) => (
                                            <div
                                                key={`menu-${index}`}
                                                onClick={() => handleImageUpload(menuRefs[index])}
                                                className="w-[130px] h-[130px] bg-[#0D1F1F] rounded-[15px] border border-[#14FFEC] flex items-center justify-center cursor-pointer overflow-hidden group hover:bg-[#0D1F1F]/70 transition-all"
                                            >
                                                {menuPreview[index] ? (
                                                    <div className="relative w-full h-full">
                                                        <img
                                                            src={menuPreview[index]}
                                                            alt={`Menu ${index + 1}`}
                                                            className="w-full h-full object-cover rounded-[13px]"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteMenuImage(index);
                                                            }}
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                                                        >
                                                            <Trash2 size={14} className="text-white" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-[25px] h-[25px] bg-[#14FFEC] rounded-full flex items-center justify-center">
                                                        <Plus className="w-[12px] h-[12px] text-[#004342]" />
                                                    </div>
                                                )}
                                                <input
                                                    ref={menuRefs[index]}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleMenuImageChange(e, index)}
                                                    className="hidden"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="w-full flex flex-col gap-[11px]">
                            <div className="px-5 flex items-center justify-between">
                                <label className="text-[#14FFEC] font-semibold text-base">Club Location <span className="text-red-500">*</span></label>
                                {selectedLocation.city && (
                                    <button
                                        type="button"
                                        onClick={() => setShowLocationModal(true)}
                                        className="text-[#14FFEC] text-xs font-semibold hover:underline flex items-center gap-1"
                                    >
                                        <Edit3 size={13} /> Edit Location
                                    </button>
                                )}
                            </div>

                            {/* Location Display Card or Selector */}
                            {selectedLocation.city && selectedLocation.state ? (
                                <div
                                    onClick={() => setShowLocationModal(true)}
                                    className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[24px] p-5 cursor-pointer hover:border-[#14FFEC] transition-all relative overflow-hidden group"
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-10 h-10 bg-[#14FFEC]/10 border border-[#14FFEC]/30 rounded-2xl flex items-center justify-center text-[#14FFEC] flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-white font-bold text-base truncate">
                                                    {selectedLocation.city}, {selectedLocation.state}
                                                </h4>
                                                {selectedLocation.lat && selectedLocation.lng ? (
                                                    <span className="text-[10px] bg-[#14FFEC]/15 text-[#14FFEC] font-mono px-2 py-0.5 rounded-full border border-[#14FFEC]/30">
                                                        GPS PIN
                                                    </span>
                                                ) : null}
                                            </div>
                                            {(selectedLocation.address1 || formData.address1) && (
                                                <p className="text-white/80 text-sm mt-1 truncate">
                                                    {selectedLocation.address1 || formData.address1}
                                                    {selectedLocation.address2 || formData.address2 ? `, ${selectedLocation.address2 || formData.address2}` : ''}
                                                </p>
                                            )}
                                            <p className="text-[#14FFEC]/70 text-xs mt-1.5 font-medium">
                                                {selectedLocation.pincode ? `Pincode: ${selectedLocation.pincode} · ` : ''}
                                                {selectedLocation.country || 'India'}
                                            </p>
                                        </div>
                                        <ChevronRight className="text-[#14FFEC]/60 group-hover:text-[#14FFEC] group-hover:translate-x-0.5 transition-all self-center ml-1" size={20} />
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setShowLocationModal(true)}
                                    className="w-full h-[60px] bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5 flex items-center justify-between cursor-pointer hover:border-[#14FFEC] transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin className="text-[#14FFEC]" size={20} />
                                        <span className="text-white/70 text-base font-medium group-hover:text-white transition-colors">
                                            Set Club Location (GPS / Search / Manual)
                                        </span>
                                    </div>
                                    <ChevronRight className="text-[#14FFEC]" size={18} />
                                </div>
                            )}

                            {/* Address Line inputs for fine tuning */}
                            <div className="w-full flex flex-col gap-3 mt-1">
                                <div className="w-full bg-[#0D1F1F] border border-[#0C898B]/60 rounded-[30px] p-[10px] px-5 focus-within:border-[#14FFEC]/60 transition-colors">
                                    <input
                                        type="text"
                                        value={formData.address1}
                                        onChange={(e) => {
                                            handleInputChange('address1', e.target.value);
                                            setSelectedLocation(prev => ({ ...prev, address1: e.target.value }));
                                        }}
                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-sm font-semibold"
                                        placeholder="Street Address / Line 1"
                                    />
                                </div>
                                <div className="w-full bg-[#0D1F1F] border border-[#0C898B]/60 rounded-[30px] p-[10px] px-5 focus-within:border-[#14FFEC]/60 transition-colors">
                                    <input
                                        type="text"
                                        value={formData.address2}
                                        onChange={(e) => {
                                            handleInputChange('address2', e.target.value);
                                            setSelectedLocation(prev => ({ ...prev, address2: e.target.value }));
                                        }}
                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-sm font-semibold"
                                        placeholder="Landmark / Locality / Line 2 (Optional)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Details & Rules */}
                        <div className="w-full flex flex-col gap-[11px]">
                            <div className="px-5">
                                <label className="text-[#14FFEC] font-semibold text-base">Details & Rules</label>
                            </div>

                            <div className="space-y-3">
                                {/* Time Restriction Toggle */}
                                <div className="px-5 flex items-center justify-between">
                                    <span className="text-white">Has Time Restriction?</span>
                                    <input
                                        type="checkbox"
                                        checked={formData.hasTimeRestriction}
                                        onChange={(e) => setFormData({ ...formData, hasTimeRestriction: e.target.checked })}
                                        className="w-5 h-5 accent-[#14FFEC]"
                                    />
                                </div>

                                {formData.hasTimeRestriction && (
                                    <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                        <input
                                            type="text"
                                            value={formData.timeRestriction}
                                            onChange={(e) => handleInputChange('timeRestriction', e.target.value)}
                                            className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                            placeholder="Time Restriction (e.g. 10 PM)"
                                        />
                                    </div>
                                )}

                                <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                    <textarea
                                        value={formData.inclusions}
                                        onChange={(e) => handleInputChange('inclusions', e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold min-h-[60px]"
                                        placeholder="Inclusions (comma separated)"
                                    />
                                </div>

                                <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                    <textarea
                                        value={formData.exclusions}
                                        onChange={(e) => handleInputChange('exclusions', e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold min-h-[60px]"
                                        placeholder="Exclusions (comma separated)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Manual Tags Entry */}
                        <div className="w-full flex flex-col gap-[11px]">
                            <div className="px-5">
                                <label className="text-[#14FFEC] font-semibold text-base">Tags (Manual Entry)</label>
                            </div>
                            <div className="space-y-3">
                                <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                    <input
                                        type="text"
                                        value={formData.foodCuisines}
                                        onChange={(e) => handleInputChange('foodCuisines', e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                        placeholder="Food Cuisines (comma separated)"
                                    />
                                </div>
                                <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                    <input
                                        type="text"
                                        value={formData.facilities}
                                        onChange={(e) => handleInputChange('facilities', e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                        placeholder="Facilities (comma separated)"
                                    />
                                </div>
                                <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                    <input
                                        type="text"
                                        value={formData.music}
                                        onChange={(e) => handleInputChange('music', e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                        placeholder="Music (comma separated)"
                                    />
                                </div>
                                <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                    <input
                                        type="text"
                                        value={formData.barOptions}
                                        onChange={(e) => handleInputChange('barOptions', e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                        placeholder="Bar Options (comma separated)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Club Tags - Create Random Tags */}
                        <div className="w-full flex flex-col gap-[11px]">
                            <div className="px-5">
                                <label className="text-[#14FFEC] font-semibold text-base">Club Tags</label>
                            </div>
                            <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[15px] p-5 flex flex-col gap-3">
                                <p className="text-white text-sm">Create tags for your club to help members discover you</p>
                                <button
                                    onClick={() => {
                                        const tags = ['Music', 'Lounge', 'Cocktails', 'Dance', 'VIP', 'Live Band', 'DJ', 'Happy Hour'];
                                        const randomTags = tags.sort(() => Math.random() - 0.5).slice(0, 3).join(', ');
                                        handleInputChange('music', randomTags);
                                        toast({
                                            title: 'Random Tags Generated',
                                            description: `Tags: ${randomTags}`,
                                        });
                                    }}
                                    className="w-full py-2 px-4 bg-[#14FFEC] text-[#004342] font-semibold rounded-lg hover:bg-[#14FFEC]/80 transition-colors"
                                >
                                    Generate Random Tags
                                </button>
                                <div className="flex items-center gap-3 flex-wrap mt-2">
                                    {formData.music && formData.music.split(',').map((tag, idx) => (
                                        <div key={idx} className="bg-[#14FFEC]/20 border border-[#14FFEC] text-[#14FFEC] px-3 py-1 rounded-full text-xs font-semibold">
                                            {tag.trim()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Save Button */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <div className="w-full h-[80px] relative bg-[#0D1F1F] shadow-[0px_30px_30px_-40px_#00968A_inset] overflow-hidden rounded-t-[40px] border-t-2 border-[#14FFEC]">
                    <div className="flex justify-center items-center px-8 h-full">
                        <div className="w-[220px] h-[45px] bg-[#0F6861] rounded-[30px] flex justify-center items-center hover:bg-[#0D5451] transition-colors disabled:opacity-50">
                            <button
                                onClick={handleCreateClub}
                                disabled={isSubmitting || !formData.clubName.trim()}
                                className="w-full h-full flex justify-center items-center cursor-pointer disabled:cursor-not-allowed"
                            >
                                <span className="text-center text-white text-[16px] font-['Manrope'] font-bold tracking-[0.05px]">
                                    {isSubmitting ? 'Creating...' : 'Save & Create Club'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



