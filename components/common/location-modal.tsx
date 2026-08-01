'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleMapPicker } from '@/components/common/google-map-picker';

interface LocationModalProps {
    isOpen: boolean;
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

export default function LocationModal({ isOpen, onClose, onSelectLocation, initialAddress }: LocationModalProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<string | null>(null);
    const [currentCoordinates, setCurrentCoordinates] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
    const [mapCenter, setMapCenter] = useState({ lat: 19.0760, lng: 72.8777 });
    const [address, setAddress] = useState({
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
    });

    // Initialize with existing address if provided
    useEffect(() => {
        if (initialAddress) {
            setAddress(initialAddress);
            if (initialAddress.lat && initialAddress.lng) {
                setCurrentCoordinates({ lat: initialAddress.lat, lng: initialAddress.lng });
                setCurrentLocation(`${initialAddress.address1}, ${initialAddress.city}`);
            }
        }
    }, [initialAddress, isOpen]);

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

    const handleSearchLocation = async (query: string) => {
        setSearchQuery(query);
        
        if (!query.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setLoadingSearch(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
            );
            const results = await response.json();
            
            const formattedResults = results.map((result: any) => ({
                id: result.place_id,
                name: result.display_name,
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                address: result.address,
                city: result.address?.city || result.address?.town || result.address?.village || result.address?.county || '',
                state: result.address?.state || result.address?.region || '',
                country: result.address?.country || '',
                postcode: result.address?.postcode || '',
            }));
            
            setSearchResults(formattedResults);
            setShowResults(true);
        } catch (error) {
            console.error('Error searching location:', error);
            toast({
                title: "Error",
                description: "Failed to search location. Try again.",
                variant: "destructive"
            });
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSelectSearchResult = async (result: any) => {
        setCurrentCoordinates({ lat: result.lat, lng: result.lng });
        setMapCenter({ lat: result.lat, lng: result.lng });
        setCurrentLocation(result.name);

        const reverseInfo = await reverseGeocodeCoordinates(result.lat, result.lng);
        setAddress({
            address1: result.address?.road || result.address?.house_number || reverseInfo.address1 || result.name || '',
            address2: result.address?.suburb || result.address?.neighbourhood || reverseInfo.address2 || '',
            city: result.address?.city || result.address?.town || result.address?.village || reverseInfo.city || '',
            state: result.address?.state || result.address?.region || reverseInfo.state || '',
            country: result.address?.country || reverseInfo.country || '',
            pincode: result.address?.postcode || reverseInfo.pincode || '',
        });
        
        setSearchResults([]);
        setShowResults(false);
        setSearchQuery('');
        setShowAddressForm(false);
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
            toast({
                title: "Error",
                description: "Geolocation is not supported by your browser",
                variant: "destructive"
            });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentCoordinates({ lat: latitude, lng: longitude });
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
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast({
                    title: "Error",
                    description: "Failed to get your location. Please enter it manually.",
                    variant: "destructive"
                });
                setIsLocating(false);
            }
        );
    };

    const handleAddressChange = (field: string, value: string) => {
        setAddress({ ...address, [field]: value });
    };

    const handleSaveDetails = () => {
        // If we have coordinates from "Use Current Location", that's enough
        if (currentCoordinates.lat && currentCoordinates.lng) {
            const savedLocation = {
                address1: address.address1 || 'Current Location',
                address2: address.address2 || '',
                city: address.city || '',
                state: address.state || '',
                country: address.country || '',
                pincode: address.pincode || '',
                lat: currentCoordinates.lat,
                lng: currentCoordinates.lng,
            };

            onSelectLocation(savedLocation);
            onClose();
            return;
        }

        // If we have manual address, require at least city and state
        if (address.city && address.state) {
            const savedLocation = {
                address1: address.address1 || '',
                address2: address.address2 || '',
                city: address.city,
                state: address.state,
                country: address.country || '',
                pincode: address.pincode || '',
                lat: currentCoordinates.lat,
                lng: currentCoordinates.lng,
            };

            onSelectLocation(savedLocation);
            onClose();
            return;
        }

        // Show error only if neither coordinates nor manual address provided
        toast({
            title: "Error",
            description: "Please select location using GPS or fill in City & State",
            variant: "destructive"
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
            <div className="w-full max-h-[90vh] bg-[#021313] rounded-t-[30px] flex flex-col animate-in slide-in-from-bottom">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#14FFEC]/20">
                    <h2 className="text-xl font-bold text-white">
                        {showAddressForm ? 'Add Address Information' : 'Select Location'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {!showAddressForm ? (
                        <div className="p-6 space-y-4">
                            {/* Search Box */}
                            <div className="relative">
                                <div className="flex items-center gap-2 bg-[#0D1F1F] rounded-[20px] px-4 py-3 border border-[#14FFEC]/20">
                                    <Search className="w-5 h-5 text-white/50" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchLocation(e.target.value)}
                                        placeholder="Search location"
                                        className="flex-1 bg-transparent text-white outline-none placeholder:text-white/50"
                                    />
                                    {loadingSearch && <Loader2 className="w-5 h-5 text-[#14FFEC] animate-spin" />}
                                </div>

                                {/* Search Results */}
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D1F1F] rounded-[15px] border border-[#14FFEC]/30 shadow-lg z-50 max-h-48 overflow-y-auto">
                                        {searchResults.map((result) => (
                                            <div
                                                key={result.id}
                                                onClick={() => handleSelectSearchResult(result)}
                                                className="px-4 py-3 border-b border-[#14FFEC]/10 hover:bg-[#14FFEC]/10 cursor-pointer transition-colors last:border-b-0"
                                            >
                                                <p className="text-white text-sm font-medium truncate">{result.name}</p>
                                                <p className="text-white/50 text-xs mt-1">
                                                    {result.city && `${result.city}, `}{result.state}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

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

                                    {/* Address Info Display */}
                                    {address.address1 && (
                                        <div className="p-4 bg-[#0D1F1F] rounded-[15px] border border-[#14FFEC]/20">
                                            <p className="text-[#14FFEC] text-xs uppercase font-bold mb-2">Address Details</p>
                                            <div className="space-y-1 text-sm text-white">
                                                <p>{address.address1}</p>
                                                {address.address2 && <p>{address.address2}</p>}
                                                <p>{address.city}, {address.state} {address.pincode}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            {/* Manual Address Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[#14FFEC] text-xs uppercase font-bold mb-2 block">Address 1 *</label>
                                    <input
                                        type="text"
                                        value={address.address1}
                                        onChange={(e) => handleAddressChange('address1', e.target.value)}
                                        placeholder="Enter address line 1"
                                        className="w-full bg-[#0D1F1F] text-white rounded-[15px] px-4 py-3 border border-[#14FFEC]/20 focus:border-[#14FFEC]/50 outline-none placeholder:text-white/40"
                                    />
                                </div>

                                <div>
                                    <label className="text-[#14FFEC] text-xs uppercase font-bold mb-2 block">Address 2 (Optional)</label>
                                    <input
                                        type="text"
                                        value={address.address2}
                                        onChange={(e) => handleAddressChange('address2', e.target.value)}
                                        placeholder="Enter address line 2"
                                        className="w-full bg-[#0D1F1F] text-white rounded-[15px] px-4 py-3 border border-[#14FFEC]/20 focus:border-[#14FFEC]/50 outline-none placeholder:text-white/40"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[#14FFEC] text-xs uppercase font-bold mb-2 block">City *</label>
                                        <input
                                            type="text"
                                            value={address.city}
                                            onChange={(e) => handleAddressChange('city', e.target.value)}
                                            placeholder="City"
                                            className="w-full bg-[#0D1F1F] text-white rounded-[15px] px-4 py-3 border border-[#14FFEC]/20 focus:border-[#14FFEC]/50 outline-none placeholder:text-white/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[#14FFEC] text-xs uppercase font-bold mb-2 block">State *</label>
                                        <select
                                            value={address.state}
                                            onChange={(e) => handleAddressChange('state', e.target.value)}
                                            className="w-full bg-[#0D1F1F] text-white rounded-[15px] px-4 py-3 border border-[#14FFEC]/20 focus:border-[#14FFEC]/50 outline-none"
                                        >
                                            <option value="">Select State</option>
                                            <option value="Maharashtra">Maharashtra</option>
                                            <option value="Karnataka">Karnataka</option>
                                            <option value="Delhi">Delhi</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[#14FFEC] text-xs uppercase font-bold mb-2 block">Country</label>
                                        <input
                                            type="text"
                                            value={address.country}
                                            onChange={(e) => handleAddressChange('country', e.target.value)}
                                            placeholder="Country"
                                            className="w-full bg-[#0D1F1F] text-white rounded-[15px] px-4 py-3 border border-[#14FFEC]/20 focus:border-[#14FFEC]/50 outline-none placeholder:text-white/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[#14FFEC] text-xs uppercase font-bold mb-2 block">Pincode</label>
                                        <input
                                            type="text"
                                            value={address.pincode}
                                            onChange={(e) => handleAddressChange('pincode', e.target.value)}
                                            placeholder="Pincode"
                                            className="w-full bg-[#0D1F1F] text-white rounded-[15px] px-4 py-3 border border-[#14FFEC]/20 focus:border-[#14FFEC]/50 outline-none placeholder:text-white/40"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-[#14FFEC]/20 p-6 space-y-3">
                    {!showAddressForm ? (
                        <>
                            {currentLocation ? (
                                <>
                                    <button
                                        onClick={handleSaveDetails}
                                        className="w-full bg-[#14FFEC] hover:bg-[#12E6D6] text-black font-semibold py-3 rounded-[20px] transition-colors"
                                    >
                                        ✓ Use This Location
                                    </button>
                                    <button
                                        onClick={() => setShowAddressForm(true)}
                                        className="w-full bg-[#0D1F1F] hover:bg-[#0D1F1F]/80 text-[#14FFEC] font-semibold py-3 rounded-[20px] transition-colors"
                                    >
                                        Edit Address Details
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowAddressForm(true)}
                                    className="w-full bg-[#14FFEC] hover:bg-[#12E6D6] text-black font-semibold py-3 rounded-[20px] transition-colors"
                                >
                                    Add Address Manually
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowAddressForm(false)}
                                className="w-full bg-[#0D1F1F] hover:bg-[#0D1F1F]/80 text-white font-semibold py-3 rounded-[20px] transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSaveDetails}
                                className="w-full bg-[#14FFEC] hover:bg-[#12E6D6] text-black font-semibold py-3 rounded-[20px] transition-colors"
                            >
                                Save Details
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
