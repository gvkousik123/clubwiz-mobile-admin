'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader2, MapPin, Navigation, ChevronDown, PencilLine, AlertTriangle, SearchX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleMapPicker } from '@/components/common/google-map-picker';

// Full Indian states list
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
    'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Lakshadweep', 'Andaman and Nicobar Islands',
];

// Remembered for the tab session so a denied prompt is never re-triggered on every tap.
const GEO_DENIED_KEY = 'clubwiz:geo-permission-denied';

type GeoPermission = 'unknown' | 'prompt' | 'granted' | 'denied';

interface LocationModalProps {
    isOpen: boolean;
    /** Heading shown in the sheet. Defaults to the club wording. */
    title?: string;
    onClose: () => void;
    onSelectLocation: (location: any) => void;
    initialAddress?: {
        address1: string;
        address2: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
        lat?: number;
        lng?: number;
    };
}

// Intelligent Nominatim Address Parser
const parseNominatimAddress = (result: any) => {
    const addr = result.address || {};

    // Primary venue/place name (e.g. "Dr. Babasaheb Ambedkar International Airport", "DABO Club", etc.)
    const placeName = result.name ||
                      addr.aeroway ||
                      addr.amenity ||
                      addr.building ||
                      addr.shop ||
                      addr.tourism ||
                      addr.railway ||
                      addr.leisure ||
                      '';

    const displayParts = (result.display_name || '').split(',').map((s: string) => s.trim());
    const primaryTitle = placeName || displayParts[0] || '';

    // Area / Road / Suburb components
    const roadAreaParts = [addr.road, addr.neighbourhood, addr.suburb, addr.residential]
        .filter((part): part is string => Boolean(part) && part !== primaryTitle);
    const roadAreaString = roadAreaParts.join(', ');

    // Address Line 1: Combine venue name with road/neighbourhood if available
    let address1 = '';
    if (primaryTitle) {
        address1 = roadAreaString ? `${primaryTitle}, ${roadAreaString}` : primaryTitle;
    } else {
        address1 = displayParts.slice(0, 2).join(', ');
    }

    // Address Line 2: Landmark / District / Sub-locality
    const districtParts = [addr.county, addr.state_district, addr.city_district]
        .filter((part): part is string => Boolean(part) && !address1.includes(part))
        // administrative wards ("Mumbai Zone 3") are noise in a postal address
        .filter((part) => !/\s+Zone\s+\d+$/i.test(part));
    const address2 = districtParts.join(', ');

    // City: prefer a real settlement, then the district. Administrative wards such as
    // "Mumbai Zone 2" are a last resort because they are not a city anyone would type.
    let rawCity = addr.city || addr.town || addr.village || addr.municipality
        || addr.state_district || addr.county || addr.city_district || displayParts[3] || '';
    // "Mumbai City" -> "Mumbai", "Nagpur District" -> "Nagpur", "Mumbai Zone 2" -> "Mumbai"
    rawCity = rawCity
        .replace(/\s+Zone\s+\d+$/i, '')
        .replace(/\s+(City|District)$/i, '')
        .trim();

    // State
    const state = addr.state || '';

    // Pincode: Keep only 6 digits
    const rawPincode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);

    // Country
    const country = addr.country || 'India';

    // Short label for the results list / confirmation card
    const shortLabel = [primaryTitle, roadAreaParts[0]].filter(Boolean).join(', ') || displayParts.slice(0, 2).join(', ');

    return {
        id: result.place_id ?? `${result.lat},${result.lon ?? result.lng}`,
        address1,
        address2,
        city: rawCity,
        state,
        country,
        pincode: rawPincode,
        lat: parseFloat(result.lat || '0'),
        lng: parseFloat(result.lon || result.lng || '0'),
        shortLabel,
        displayName: result.display_name || `${address1}, ${rawCity}`,
    };
};

export default function LocationModal({ isOpen, title = 'Club Location', onClose, onSelectLocation, initialAddress }: LocationModalProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchAttempted, setSearchAttempted] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [geoPermission, setGeoPermission] = useState<GeoPermission>('unknown');
    const [currentCoordinates, setCurrentCoordinates] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
    const [mapCenter, setMapCenter] = useState({ lat: 19.0760, lng: 72.8777 });
    const [address, setAddress] = useState({
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
    });
    const [locationSource, setLocationSource] = useState<'none' | 'gps' | 'search' | 'map' | 'manual'>('none');
    const [currentLocation, setCurrentLocation] = useState('');
    const [pincodeError, setPincodeError] = useState('');

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const searchAbortRef = useRef<AbortController | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchBoxRef = useRef<HTMLDivElement>(null);
    const addressFormRef = useRef<HTMLDivElement>(null);
    const address1Ref = useRef<HTMLInputElement>(null);
    const locateInFlightRef = useRef(false);

    // Read the browser's geolocation permission up front so a previously blocked
    // user never gets the prompt re-triggered on every tap.
    useEffect(() => {
        if (!isOpen || typeof window === 'undefined') return;

        try {
            if (window.sessionStorage.getItem(GEO_DENIED_KEY) === '1') {
                setGeoPermission('denied');
            }
        } catch {
            /* storage blocked (private mode) — fall through to the Permissions API */
        }

        let status: PermissionStatus | null = null;
        let cancelled = false;

        if (navigator.permissions?.query) {
            navigator.permissions
                .query({ name: 'geolocation' as PermissionName })
                .then((result) => {
                    if (cancelled) return;
                    status = result;
                    setGeoPermission(result.state as GeoPermission);
                    if (result.state !== 'denied') {
                        try { window.sessionStorage.removeItem(GEO_DENIED_KEY); } catch { /* ignore */ }
                    }
                    result.onchange = () => {
                        setGeoPermission(result.state as GeoPermission);
                        try {
                            if (result.state === 'denied') window.sessionStorage.setItem(GEO_DENIED_KEY, '1');
                            else window.sessionStorage.removeItem(GEO_DENIED_KEY);
                        } catch { /* ignore */ }
                    };
                })
                .catch(() => { /* Permissions API unavailable — rely on the error code instead */ });
        }

        return () => {
            cancelled = true;
            if (status) status.onchange = null;
        };
    }, [isOpen]);

    // Initialize with existing address if provided
    useEffect(() => {
        if (isOpen && initialAddress) {
            setAddress({
                address1: initialAddress.address1 || '',
                address2: initialAddress.address2 || '',
                city: initialAddress.city || '',
                state: initialAddress.state || '',
                country: initialAddress.country || 'India',
                pincode: initialAddress.pincode || '',
            });
            if (initialAddress.lat && initialAddress.lng) {
                setCurrentCoordinates({ lat: initialAddress.lat, lng: initialAddress.lng });
                setMapCenter({ lat: initialAddress.lat, lng: initialAddress.lng });
                setLocationSource('search');
            }
        }
    }, [initialAddress, isOpen]);

    // Reset transient state on close
    useEffect(() => {
        if (isOpen) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        searchAbortRef.current?.abort();
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
        setSearchAttempted(false);
        setLoadingSearch(false);
        setPincodeError('');
    }, [isOpen]);

    // Close on Escape, and stop the page behind the sheet from scrolling
    useEffect(() => {
        if (!isOpen || typeof document === 'undefined') return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (showResults) setShowResults(false);
            else onClose();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen, showResults, onClose]);

    // Dismiss the suggestions when tapping anywhere outside the search box
    useEffect(() => {
        if (!isOpen || !showResults || typeof document === 'undefined') return;

        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            if (searchBoxRef.current?.contains(event.target as Node)) return;
            setShowResults(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [isOpen, showResults]);

    const reverseGeocodeCoordinates = useCallback(async (lat: number, lng: number) => {
        setIsReverseGeocoding(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                { headers: { Accept: 'application/json' } }
            );
            const data = await response.json();
            if (!data || data.error) return null;
            return parseNominatimAddress(data);
        } catch (error) {
            console.error('Error reverse geocoding coordinates:', error);
            return null;
        } finally {
            setIsReverseGeocoding(false);
        }
    }, []);

    const applyPlace = useCallback((parsed: ReturnType<typeof parseNominatimAddress> | null, lat: number, lng: number, source: 'gps' | 'search' | 'map') => {
        setCurrentCoordinates({ lat, lng });
        setMapCenter({ lat, lng });
        setLocationSource(source);

        if (parsed) {
            setAddress({
                address1: parsed.address1,
                address2: parsed.address2,
                city: parsed.city,
                state: parsed.state,
                country: parsed.country || 'India',
                pincode: parsed.pincode,
            });
            setCurrentLocation(parsed.shortLabel || parsed.displayName);
            setPincodeError('');
        } else {
            setCurrentLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
    }, []);

    const handleSearchLocation = (query: string) => {
        setSearchQuery(query);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        searchAbortRef.current?.abort();

        if (query.trim().length < 3) {
            setSearchResults([]);
            setShowResults(false);
            setSearchAttempted(false);
            setLoadingSearch(false);
            return;
        }

        setLoadingSearch(true);
        setShowResults(true);

        debounceRef.current = setTimeout(async () => {
            const controller = new AbortController();
            searchAbortRef.current = controller;
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&countrycodes=in`,
                    { signal: controller.signal, headers: { Accept: 'application/json' } }
                );
                const results = await response.json();
                setSearchResults(Array.isArray(results) ? results.map((result: any) => parseNominatimAddress(result)) : []);
                setSearchAttempted(true);
                setShowResults(true);
            } catch (error) {
                if ((error as any)?.name === 'AbortError') return;
                console.error('Error searching location:', error);
                setSearchResults([]);
                setSearchAttempted(true);
                toast({ title: 'Search failed', description: 'Could not reach the places service. Try again.', variant: 'destructive' });
            } finally {
                if (searchAbortRef.current === controller) {
                    searchAbortRef.current = null;
                    setLoadingSearch(false);
                }
            }
        }, 350);
    };

    const handleSelectSearchResult = (result: any) => {
        applyPlace(result, result.lat, result.lng, 'search');
        setSearchResults([]);
        setShowResults(false);
        setSearchAttempted(false);
        setSearchQuery(result.shortLabel || '');
        searchInputRef.current?.blur();
    };

    const handleMapSelect = async ({ lat, lng }: { lat: number; lng: number }) => {
        applyPlace(null, lat, lng, 'map');
        const parsed = await reverseGeocodeCoordinates(lat, lng);
        if (parsed) applyPlace(parsed, lat, lng, 'map');
    };

    const markGeoDenied = useCallback(() => {
        setGeoPermission('denied');
        try { window.sessionStorage.setItem(GEO_DENIED_KEY, '1'); } catch { /* ignore */ }
    }, []);

    const requestCurrentLocation = useCallback(() => {
        if (locateInFlightRef.current) return;

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            toast({ title: 'Not supported', description: 'This browser cannot share your location. Search or enter it manually.', variant: 'destructive' });
            return;
        }

        locateInFlightRef.current = true;
        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setGeoPermission('granted');
                try { window.sessionStorage.removeItem(GEO_DENIED_KEY); } catch { /* ignore */ }
                applyPlace(null, latitude, longitude, 'gps');
                locateInFlightRef.current = false;
                setIsLocating(false);

                const parsed = await reverseGeocodeCoordinates(latitude, longitude);
                if (parsed) applyPlace(parsed, latitude, longitude, 'gps');

                toast({
                    title: 'Location found',
                    description: parsed ? 'GPS position detected and address filled in.' : 'GPS position detected. Please complete the address below.',
                });
            },
            (error) => {
                locateInFlightRef.current = false;
                setIsLocating(false);

                if (error.code === error.PERMISSION_DENIED) {
                    markGeoDenied();
                    return; // the inline banner explains what to do — no toast spam
                }

                const description = error.code === error.TIMEOUT
                    ? 'Getting your position took too long. Try again, or search for the place.'
                    : 'Your position is unavailable right now. Search for the place or enter it manually.';
                toast({ title: 'Could not get location', description, variant: 'destructive' });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    }, [applyPlace, markGeoDenied, reverseGeocodeCoordinates, toast]);

    const handleUseCurrentLocation = () => {
        // Already blocked: showing the inline banner beats firing another prompt
        // that the browser will either suppress or re-ask on every single tap.
        if (geoPermission === 'denied') {
            setGeoPermission('denied');
            return;
        }
        requestCurrentLocation();
    };

    const handleRetryAfterDenial = () => {
        try { window.sessionStorage.removeItem(GEO_DENIED_KEY); } catch { /* ignore */ }
        setGeoPermission('prompt');
        requestCurrentLocation();
    };

    const handleEnterManually = () => {
        if (locationSource === 'none') setLocationSource('manual');
        setShowResults(false);
        addressFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => address1Ref.current?.focus(), 320);
    };

    const handleAddressChange = (field: string, value: string) => {
        if (field === 'pincode') {
            const cleaned = value.replace(/\D/g, '').slice(0, 6);
            setAddress((prev) => ({ ...prev, pincode: cleaned }));
            setPincodeError(cleaned.length > 0 && cleaned.length !== 6 ? 'Pincode must be 6 digits' : '');
        } else {
            setAddress((prev) => ({ ...prev, [field]: value }));
        }
        if (locationSource === 'none') setLocationSource('manual');
    };

    const handleClearLocation = () => {
        setCurrentCoordinates({ lat: null, lng: null });
        setAddress({ address1: '', address2: '', city: '', state: '', country: 'India', pincode: '' });
        setLocationSource('none');
        setCurrentLocation('');
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
        setPincodeError('');
    };

    const handleSaveDetails = () => {
        // Require at least city and state
        if (!address.city.trim() || !address.state.trim()) {
            toast({ title: 'Missing information', description: 'City and State are required.', variant: 'destructive' });
            addressFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        if (address.pincode && address.pincode.length !== 6) {
            toast({ title: 'Invalid pincode', description: 'Pincode must be exactly 6 digits.', variant: 'destructive' });
            return;
        }

        onSelectLocation({
            address1: address.address1.trim(),
            address2: address.address2.trim(),
            city: address.city.trim(),
            state: address.state.trim(),
            country: address.country.trim() || 'India',
            pincode: address.pincode.trim(),
            lat: currentCoordinates.lat || 0,
            lng: currentCoordinates.lng || 0,
        });
        onClose();
    };

    if (!isOpen) return null;

    const hasLocation = locationSource !== 'none' || Boolean(address.city) || Boolean(address.state);
    const hasCoordinates = currentCoordinates.lat !== null && currentCoordinates.lng !== null;
    const selectedCoords = hasCoordinates ? { lat: currentCoordinates.lat as number, lng: currentCoordinates.lng as number } : null;
    const summaryLine = [address.address1, address.address2, address.city, address.state, address.pincode]
        .filter(Boolean)
        .join(', ');
    const sourceLabel = locationSource === 'gps' ? 'From GPS'
        : locationSource === 'search' ? 'From search'
        : locationSource === 'map' ? 'Pinned on map'
        : 'Entered manually';

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center md:justify-center"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div
                className="w-full md:max-w-lg md:mx-4 h-[92vh] md:h-auto md:max-h-[88vh] bg-[#021313] rounded-t-[30px] md:rounded-[24px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Grabber */}
                <div className="md:hidden pt-2.5 pb-1 flex justify-center flex-shrink-0">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-3 border-b border-[#14FFEC]/15 flex-shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-white truncate">{title}</h2>
                        <p className="text-white/40 text-xs mt-0.5">Search, use GPS, or enter manually</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition flex-shrink-0"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
                    {/* Search — the dropdown is anchored to this box so results sit right under the field */}
                    <div ref={searchBoxRef} className="relative z-30">
                        <div className="flex items-center gap-2 bg-[#0D1F1F] rounded-2xl px-4 h-12 border border-[#14FFEC]/20 focus-within:border-[#14FFEC]/50 transition-colors">
                            <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchLocation(e.target.value)}
                                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                                placeholder="Search for a place..."
                                autoComplete="off"
                                className="flex-1 min-w-0 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
                            />
                            {loadingSearch && <Loader2 className="w-4 h-4 text-[#14FFEC] animate-spin flex-shrink-0" />}
                            {!loadingSearch && searchQuery.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => { handleSearchLocation(''); searchInputRef.current?.focus(); }}
                                    aria-label="Clear search"
                                    className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition flex-shrink-0"
                                >
                                    <X className="w-3 h-3 text-white/70" />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && (searchResults.length > 0 || (searchAttempted && !loadingSearch)) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D1F1F] rounded-2xl border border-[#14FFEC]/30 shadow-2xl shadow-black/60 z-40 max-h-64 overflow-y-auto overscroll-contain">
                                {searchResults.length === 0 ? (
                                    <div className="px-4 py-5 flex items-center gap-3">
                                        <SearchX className="w-4 h-4 text-white/30 flex-shrink-0" />
                                        <p className="text-white/50 text-sm">No places found. Try a different name, or pin it on the map.</p>
                                    </div>
                                ) : (
                                    searchResults.map((result) => (
                                        <button
                                            type="button"
                                            key={result.id}
                                            onClick={() => handleSelectSearchResult(result)}
                                            className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-[#14FFEC]/10 active:bg-[#14FFEC]/15 transition-colors last:border-b-0 group flex items-start gap-3"
                                        >
                                            <MapPin className="w-4 h-4 text-[#14FFEC]/70 flex-shrink-0 mt-0.5" />
                                            <span className="min-w-0">
                                                <span className="block text-white text-sm font-medium truncate group-hover:text-[#14FFEC] transition-colors">
                                                    {result.shortLabel || result.displayName.split(',').slice(0, 2).join(',')}
                                                </span>
                                                <span className="block text-white/40 text-xs mt-0.5 truncate">
                                                    {result.city && `${result.city}, `}{result.state}{result.pincode ? ` — ${result.pincode}` : ''}
                                                </span>
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Location permission blocked — explain instead of re-prompting */}
                    {geoPermission === 'denied' && (
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30">
                            <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-amber-200 text-xs font-semibold">Location access is blocked</p>
                                <p className="text-amber-100/70 text-[11px] mt-1 leading-relaxed">
                                    Allow location for this site in your browser settings (tap the lock or site icon in the address bar), then try again. You can also search above or pin the spot on the map.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleRetryAfterDenial}
                                    className="mt-2 text-[11px] font-bold text-amber-200 underline underline-offset-2 hover:text-amber-100"
                                >
                                    I&apos;ve allowed it — try again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={isLocating}
                            className={`flex items-center justify-center gap-2 h-[52px] px-3 rounded-2xl border transition-colors active:scale-[0.98] transform ${
                                locationSource === 'gps'
                                    ? 'bg-[#14FFEC]/15 border-[#14FFEC]/50'
                                    : 'border-[#14FFEC]/20 hover:bg-[#14FFEC]/10'
                            } ${geoPermission === 'denied' ? 'opacity-50' : ''} disabled:opacity-50`}
                        >
                            {isLocating
                                ? <Loader2 className="w-[18px] h-[18px] text-[#14FFEC] animate-spin flex-shrink-0" />
                                : <Navigation className="w-[18px] h-[18px] text-[#14FFEC] flex-shrink-0" />}
                            <span className="text-white font-medium text-sm whitespace-nowrap">
                                {isLocating ? 'Locating...' : 'Use Current'}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={handleEnterManually}
                            className="flex items-center justify-center gap-2 h-[52px] px-3 rounded-2xl border border-[#14FFEC]/20 hover:bg-[#14FFEC]/10 transition-colors active:scale-[0.98] transform"
                        >
                            <PencilLine className="w-[18px] h-[18px] text-[#14FFEC] flex-shrink-0" />
                            <span className="text-white font-medium text-sm whitespace-nowrap">Add Manually</span>
                        </button>
                    </div>

                    {/* Map Picker */}
                    <div className="space-y-2">
                        <GoogleMapPicker
                            center={mapCenter}
                            selectedLocation={selectedCoords}
                            onSelect={handleMapSelect}
                            radius={0}
                            height={220}
                        />
                        <p className="text-[11px] text-white/40 px-1 leading-relaxed">
                            Tap anywhere on the map to drop a pin, or drag to move around.
                        </p>
                    </div>

                    {/* Resolving status */}
                    {isReverseGeocoding && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-[#14FFEC]/5 rounded-xl border border-[#14FFEC]/10">
                            <Loader2 className="w-3.5 h-3.5 text-[#14FFEC] animate-spin flex-shrink-0" />
                            <span className="text-[#14FFEC] text-xs font-medium">Resolving address...</span>
                        </div>
                    )}

                    {/* Selected Location */}
                    {(currentLocation || hasCoordinates) && (
                        <div className="p-4 bg-[#14FFEC]/10 border border-[#14FFEC]/30 rounded-2xl flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[#14FFEC] flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-[#14FFEC] text-[10px] uppercase font-bold tracking-widest">{sourceLabel}</p>
                                <p className="text-white text-sm font-medium mt-1 break-words">{summaryLine || currentLocation}</p>
                                {hasCoordinates && (
                                    <p className="text-white/50 text-[11px] mt-1 font-mono">
                                        {(currentCoordinates.lat as number).toFixed(5)}, {(currentCoordinates.lng as number).toFixed(5)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Address Details</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Address Form */}
                    <div ref={addressFormRef} className="space-y-3 scroll-mt-4">
                        <div>
                            <label className="text-white/50 text-[11px] font-bold mb-1.5 block ml-1 uppercase tracking-wider">Address Line 1</label>
                            <input
                                ref={address1Ref}
                                type="text"
                                value={address.address1}
                                onChange={(e) => handleAddressChange('address1', e.target.value)}
                                placeholder="Street, building, area"
                                className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 h-12 border border-white/10 focus:border-[#14FFEC]/40 outline-none placeholder:text-white/25 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-white/50 text-[11px] font-bold mb-1.5 block ml-1 uppercase tracking-wider">Address Line 2 <span className="text-white/20">(optional)</span></label>
                            <input
                                type="text"
                                value={address.address2}
                                onChange={(e) => handleAddressChange('address2', e.target.value)}
                                placeholder="Landmark, locality"
                                className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 h-12 border border-white/10 focus:border-[#14FFEC]/40 outline-none placeholder:text-white/25 transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-white/50 text-[11px] font-bold mb-1.5 block ml-1 uppercase tracking-wider">
                                    City <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={address.city}
                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                    placeholder="City"
                                    className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 h-12 border border-white/10 focus:border-[#14FFEC]/40 outline-none placeholder:text-white/25 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-white/50 text-[11px] font-bold mb-1.5 block ml-1 uppercase tracking-wider">
                                    State <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={address.state}
                                        onChange={(e) => handleAddressChange('state', e.target.value)}
                                        className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl pl-4 pr-9 h-12 border border-white/10 focus:border-[#14FFEC]/40 outline-none appearance-none transition-colors truncate"
                                    >
                                        <option value="">Select</option>
                                        {INDIAN_STATES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-white/50 text-[11px] font-bold mb-1.5 block ml-1 uppercase tracking-wider">Pincode</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={address.pincode}
                                    onChange={(e) => handleAddressChange('pincode', e.target.value)}
                                    placeholder="6-digit"
                                    className={`w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 h-12 border outline-none placeholder:text-white/25 transition-colors ${pincodeError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#14FFEC]/40'}`}
                                />
                                {pincodeError && <p className="text-red-400 text-[10px] mt-1 ml-1">{pincodeError}</p>}
                            </div>
                            <div>
                                <label className="text-white/50 text-[11px] font-bold mb-1.5 block ml-1 uppercase tracking-wider">Country</label>
                                <input
                                    type="text"
                                    value={address.country}
                                    onChange={(e) => handleAddressChange('country', e.target.value)}
                                    placeholder="Country"
                                    className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 h-12 border border-white/10 focus:border-[#14FFEC]/40 outline-none placeholder:text-white/25 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-[#14FFEC]/15 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2 flex-shrink-0 bg-[#021313]">
                    <button
                        type="button"
                        onClick={handleSaveDetails}
                        disabled={!address.city.trim() || !address.state.trim() || !!pincodeError}
                        className="w-full bg-[#14FFEC] hover:bg-[#12E6D6] text-black font-bold h-[52px] rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transform"
                    >
                        Save Location
                    </button>
                    {hasLocation && (
                        <button
                            type="button"
                            onClick={handleClearLocation}
                            className="w-full bg-transparent hover:bg-red-500/10 text-red-400/70 hover:text-red-400 font-medium py-2.5 rounded-2xl transition-colors text-sm"
                        >
                            Clear Location
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
