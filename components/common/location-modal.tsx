'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader2, MapPin, Navigation, ChevronDown, LocateFixed } from 'lucide-react';
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
        .filter((part): part is string => Boolean(part) && !address1.includes(part));
    const address2 = districtParts.join(', ');

    // City: Extract & clean up (e.g. "Nagpur City" -> "Nagpur", "Mumbai City" -> "Mumbai")
    let rawCity = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || addr.county || addr.state_district || displayParts[3] || '';
    if (rawCity.toLowerCase().endsWith(' city')) {
        rawCity = rawCity.slice(0, -5).trim();
    }

    // State
    const state = addr.state || '';

    // Pincode: Keep only 6 digits
    const rawPincode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);

    // Country
    const country = addr.country || 'India';

    return {
        id: result.place_id,
        address1,
        address2,
        city: rawCity,
        state,
        country,
        pincode: rawPincode,
        lat: parseFloat(result.lat || '0'),
        lng: parseFloat(result.lon || result.lng || '0'),
        displayName: result.display_name || `${address1}, ${rawCity}`,
    };
};

export default function LocationModal({ isOpen, title = 'Club Location', onClose, onSelectLocation, initialAddress }: LocationModalProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
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
    const [locationSource, setLocationSource] = useState<'none' | 'gps' | 'search' | 'manual'>('none');
    const [currentLocation, setCurrentLocation] = useState('');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [pincodeError, setPincodeError] = useState('');

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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
                setLocationSource('search');
            }
        }
    }, [initialAddress, isOpen]);

    // Focus search input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 300);
        } else {
            // Reset on close
            setSearchQuery('');
            setSearchResults([]);
            setShowResults(false);
            setPincodeError('');
        }
    }, [isOpen]);

    // Reverse geocode lat/lng to address using Nominatim
    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        setIsReverseGeocoding(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
            );
            const data = await response.json();

            if (data) {
                const parsed = parseNominatimAddress(data);
                setAddress({
                    address1: parsed.address1,
                    address2: parsed.address2,
                    city: parsed.city,
                    state: parsed.state,
                    country: parsed.country,
                    pincode: parsed.pincode,
                });
                console.log('✅ Reverse geocoded:', parsed);
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
            toast({
                title: "Partial Location",
                description: "Got coordinates but couldn't resolve address. Please fill in details manually.",
                variant: "default"
            });
        } finally {
            setIsReverseGeocoding(false);
        }
    }, [toast]);

    if (!isOpen) return null;

    const reverseGeocodeCoordinates = async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();
            const addressInfo = data.address || {};

            return {
                address1: data.display_name || addressInfo.road || addressInfo.neighbourhood || addressInfo.suburb || '',
                address2: addressInfo.suburb || addressInfo.city_district || '',
                city: addressInfo.city || addressInfo.town || addressInfo.village || addressInfo.county || '',
                state: addressInfo.state || addressInfo.region || '',
                country: addressInfo.country || '',
                pincode: addressInfo.postcode || '',
                displayName: data.display_name || ''
            };
        } catch (error) {
            console.error('Error reverse geocoding coordinates:', error);
            return {
                address1: '',
                address2: '',
                city: '',
                state: '',
                country: '',
                pincode: '',
                displayName: ''
            };
        }
    };

    const handleSearchLocation = (query: string) => {
        setSearchQuery(query);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoadingSearch(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&countrycodes=in`
                );
                const results = await response.json();

                const formattedResults = results.map((result: any) => parseNominatimAddress(result));

                setSearchResults(formattedResults);
                setShowResults(true);
            } catch (error) {
                console.error('Error searching location:', error);
                toast({ title: "Error", description: "Failed to search location. Try again.", variant: "destructive" });
            } finally {
                setLoadingSearch(false);
            }
        }, 350);
    };

    const handleSelectSearchResult = async (result: any) => {
        setCurrentCoordinates({ lat: result.lat, lng: result.lng });
        setMapCenter({ lat: result.lat, lng: result.lng });
        setCurrentLocation(result.name || result.displayName || '');

        const reverseInfo = await reverseGeocodeCoordinates(result.lat, result.lng);
        setAddress({
            address1: result.address?.road || result.address?.house_number || reverseInfo.address1 || result.name || result.displayName || '',
            address2: result.address?.suburb || result.address?.neighbourhood || reverseInfo.address2 || '',
            city: result.address?.city || result.address?.town || result.address?.village || reverseInfo.city || '',
            state: result.address?.state || result.address?.region || reverseInfo.state || '',
            country: result.address?.country || reverseInfo.country || 'India',
            pincode: result.address?.postcode || reverseInfo.pincode || '',
        });
        setLocationSource('search');
        setSearchResults([]);
        setShowResults(false);
        setSearchQuery('');
    };

    const handleMapSelect = async ({ lat, lng }: { lat: number; lng: number }) => {
        setCurrentCoordinates({ lat, lng });
        setMapCenter({ lat, lng });

        const reverseInfo = await reverseGeocodeCoordinates(lat, lng);
        setAddress({
            address1: reverseInfo.address1,
            address2: reverseInfo.address2,
            city: reverseInfo.city,
            state: reverseInfo.state,
            country: reverseInfo.country,
            pincode: reverseInfo.pincode,
        });
        setCurrentLocation(reverseInfo.displayName || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        setShowAddressForm(false);
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentCoordinates({ lat: latitude, lng: longitude });
                setLocationSource('gps');
                setMapCenter({ lat: latitude, lng: longitude });

                const geocoded = await reverseGeocodeCoordinates(latitude, longitude);
                if (geocoded.displayName) {
                    setAddress({
                        address1: geocoded.address1,
                        address2: geocoded.address2,
                        city: geocoded.city,
                        state: geocoded.state,
                        country: geocoded.country,
                        pincode: geocoded.pincode,
                    });
                    setCurrentLocation(geocoded.displayName || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                } else {
                    setCurrentLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                }

                toast({
                    title: "Location Found",
                    description: "Your current position has been detected.",
                    variant: "default"
                });
                setIsLocating(false);

                // Reverse geocode to fill address
                await reverseGeocode(latitude, longitude);

                toast({ title: "Location Found", description: "GPS position detected & address resolved.", variant: "default" });
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast({ title: "Error", description: "Failed to get your location. Please search or enter manually.", variant: "destructive" });
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleAddressChange = (field: string, value: string) => {
        if (field === 'pincode') {
            const cleaned = value.replace(/\D/g, '').slice(0, 6);
            setAddress({ ...address, pincode: cleaned });
            setPincodeError(cleaned.length > 0 && cleaned.length !== 6 ? 'Pincode must be 6 digits' : '');
        } else {
            setAddress({ ...address, [field]: value });
        }
        if (locationSource === 'none') setLocationSource('manual');
    };

    const handleClearLocation = () => {
        setCurrentCoordinates({ lat: null, lng: null });
        setAddress({ address1: '', address2: '', city: '', state: '', country: 'India', pincode: '' });
        setLocationSource('none');
        setSearchQuery('');
        setPincodeError('');
    };

    const handleSaveDetails = () => {
        // Require at least city and state
        if (!address.city.trim() || !address.state.trim()) {
            toast({ title: "Missing Information", description: "City and State are required.", variant: "destructive" });
            return;
        }

        if (address.pincode && address.pincode.length !== 6) {
            toast({ title: "Invalid Pincode", description: "Pincode must be exactly 6 digits.", variant: "destructive" });
            return;
        }

        const savedLocation = {
            address1: address.address1.trim(),
            address2: address.address2.trim(),
            city: address.city.trim(),
            state: address.state.trim(),
            country: address.country.trim() || 'India',
            pincode: address.pincode.trim(),
            lat: currentCoordinates.lat || 0,
            lng: currentCoordinates.lng || 0,
        };

        onSelectLocation(savedLocation);
        onClose();
    };

    const hasLocation = locationSource !== 'none' || address.city || address.state;
    const hasCoordinates = currentCoordinates.lat && currentCoordinates.lng;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center md:justify-center" onClick={onClose}>
            <div
                className="w-full md:max-w-lg md:mx-4 max-h-[92vh] bg-[#021313] rounded-t-[30px] md:rounded-[24px] flex flex-col animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-3 border-b border-[#14FFEC]/15">
                    <div>
                        <h2 className="text-lg font-bold text-white">{title}</h2>
                        <p className="text-white/40 text-xs mt-0.5">Search, use GPS, or enter manually</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Search + GPS Row */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="flex items-center gap-2 bg-[#0D1F1F] rounded-2xl px-4 py-3 border border-[#14FFEC]/20 focus-within:border-[#14FFEC]/50 transition-colors">
                                <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchLocation(e.target.value)}
                                    placeholder="Search for a place..."
                                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
                                />
                                {loadingSearch && <Loader2 className="w-4 h-4 text-[#14FFEC] animate-spin flex-shrink-0" />}
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0D1F1F] rounded-2xl border border-[#14FFEC]/30 shadow-2xl z-50 max-h-52 overflow-y-auto">
                                    {searchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            onClick={() => handleSelectSearchResult(result)}
                                            className="px-4 py-3 border-b border-white/5 hover:bg-[#14FFEC]/10 cursor-pointer transition-colors last:border-b-0 group"
                                        >
                                            <p className="text-white text-sm font-medium truncate group-hover:text-[#14FFEC] transition-colors">
                                                {result.displayName.split(',').slice(0, 2).join(',')}
                                            </p>
                                            <p className="text-white/40 text-xs mt-0.5 truncate">
                                                {result.city && `${result.city}, `}{result.state}{result.pincode ? ` — ${result.pincode}` : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quick Actions - Side by Side */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Use Current Location */}
                                <div
                                    onClick={handleUseCurrentLocation}
                                    className={`flex items-center gap-2 p-4 rounded-[15px] border border-[#14FFEC]/20 hover:bg-[#14FFEC]/10 cursor-pointer transition-colors ${isLocating ? 'opacity-50' : ''}`}
                                >
                                    {isLocating ? (
                                        <Loader2 className="w-5 h-5 text-[#14FFEC] animate-spin" />
                                    ) : (
                                        <Navigation className="w-5 h-5 text-[#14FFEC] flex-shrink-0" />
                                    )}
                                    <span className="text-white font-medium text-sm">
                                        {isLocating ? 'Locating...' : 'Use Current'}
                                    </span>
                                </div>

                                {/* Add Address Manually */}
                                <div
                                    onClick={() => setShowAddressForm(true)}
                                    className="flex items-center gap-2 p-4 rounded-[15px] border border-[#14FFEC]/20 hover:bg-[#14FFEC]/10 cursor-pointer transition-colors"
                                >
                                    <MapPin className="w-5 h-5 text-[#14FFEC] flex-shrink-0" />
                                    <span className="text-white font-medium text-sm">Add Manually</span>
                                </div>
                            </div>

                            {/* Map Picker */}
                            <div className="mt-4 space-y-3">
                                <div className="rounded-[25px] border border-[#14FFEC]/20 overflow-hidden">
                                    <GoogleMapPicker
                                        center={mapCenter}
                                        onSelect={handleMapSelect}
                                        height={240}
                                    />
                                </div>
                                <div className="text-xs text-white/60 px-3">
                                    Tap anywhere on the map to pin the location. You can also search above or use your current location.
                                </div>
                            </div>

                            {/* Selected Location */}
                            {currentLocation && (
                                <div className="space-y-3 pt-2">
                                    <div className="p-4 bg-[#14FFEC]/10 border border-[#14FFEC]/30 rounded-[15px] flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-[#14FFEC] flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-white text-sm font-medium">{currentLocation}</p>
                                            <p className="text-[#14FFEC] text-xs uppercase font-bold mt-1">Confirmed Location</p>
                                            {currentCoordinates.lat && currentCoordinates.lng && (
                                                <p className="text-white/60 text-[11px] mt-1">
                                                    {currentCoordinates.lat.toFixed(5)}, {currentCoordinates.lng.toFixed(5)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* GPS Button */}
                        <button
                            onClick={handleUseCurrentLocation}
                            disabled={isLocating}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#14FFEC]/10 border border-[#14FFEC]/30 hover:bg-[#14FFEC]/20 transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
                            title="Use GPS"
                        >
                            {isLocating ? (
                                <Loader2 className="w-5 h-5 text-[#14FFEC] animate-spin" />
                            ) : (
                                <LocateFixed className="w-5 h-5 text-[#14FFEC]" />
                            )}
                        </button>
                    </div>

                    {/* GPS status */}
                    {isReverseGeocoding && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#14FFEC]/5 rounded-xl border border-[#14FFEC]/10">
                            <Loader2 className="w-3.5 h-3.5 text-[#14FFEC] animate-spin" />
                            <span className="text-[#14FFEC] text-xs font-medium">Resolving address from GPS...</span>
                        </div>
                    )}

                    {/* Map Preview (static tile) */}
                    {hasCoordinates && (
                        <div className="relative rounded-2xl overflow-hidden border border-[#14FFEC]/20">
                            <img
                                src={`https://static-maps.yandex.ru/v1?ll=${currentCoordinates.lng},${currentCoordinates.lat}&z=15&size=600,200&l=map&pt=${currentCoordinates.lng},${currentCoordinates.lat},pm2gnm`}
                                alt="Map preview"
                                className="w-full h-[140px] object-cover"
                                onError={(e) => {
                                    // Fallback: show OpenStreetMap tile
                                    (e.target as HTMLImageElement).src = `https://tile.openstreetmap.org/15/${Math.floor((currentCoordinates.lng! + 180) / 360 * Math.pow(2, 15))}/${Math.floor((1 - Math.log(Math.tan(currentCoordinates.lat! * Math.PI / 180) + 1 / Math.cos(currentCoordinates.lat! * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 15))}.png`;
                                    (e.target as HTMLImageElement).className = "w-full h-[140px] object-cover opacity-60";
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-6 h-6 bg-[#14FFEC] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-[#14FFEC] text-[10px] font-mono px-2 py-1 rounded-lg backdrop-blur-sm">
                                {currentCoordinates.lat?.toFixed(4)}, {currentCoordinates.lng?.toFixed(4)}
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Address Details</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Address Form — Always Visible */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-white/50 text-[11px] font-bold mb-1.5 block ml-1 uppercase tracking-wider">Address Line 1</label>
                            <input
                                type="text"
                                value={address.address1}
                                onChange={(e) => handleAddressChange('address1', e.target.value)}
                                placeholder="Street, building, area"
                                className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-[#14FFEC]/40 outline-none placeholder:text-white/25 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-white/50 text-[11px] font-bold mb-1.5 block ml-1 uppercase tracking-wider">Address Line 2 <span className="text-white/20">(optional)</span></label>
                            <input
                                type="text"
                                value={address.address2}
                                onChange={(e) => handleAddressChange('address2', e.target.value)}
                                placeholder="Landmark, locality"
                                className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-[#14FFEC]/40 outline-none placeholder:text-white/25 transition-colors"
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
                                    className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-[#14FFEC]/40 outline-none placeholder:text-white/25 transition-colors"
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
                                        className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-[#14FFEC]/40 outline-none appearance-none transition-colors"
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
                                    className={`w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 py-3 border outline-none placeholder:text-white/25 transition-colors ${pincodeError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#14FFEC]/40'}`}
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
                                    className="w-full bg-[#0D1F1F] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-[#14FFEC]/40 outline-none placeholder:text-white/25 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-[#14FFEC]/15 p-5 space-y-2.5">
                    <button
                        onClick={handleSaveDetails}
                        disabled={!address.city.trim() || !address.state.trim() || !!pincodeError}
                        className="w-full bg-[#14FFEC] hover:bg-[#12E6D6] text-black font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transform"
                    >
                        Save Location
                    </button>
                    {hasLocation && (
                        <button
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
