'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import '../new-event/styles.css';
import PageHeader from '@/components/common/page-header';
import Image from 'next/image';
import { ArrowLeft, Loader2, MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/lib/constants/storage';

export default function AddLocationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [address, setAddress] = useState({
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<string | null>(null);
    const [currentCoordinates, setCurrentCoordinates] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
    const [isLocating, setIsLocating] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);

    const handleGoBack = () => {
        router.back();
    };

    const handleAddressChange = (field: string, value: string) => {
        setAddress({ ...address, [field]: value });
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
            // Use OpenStreetMap Nominatim API (free, no key required)
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
                city: result.address?.city || result.address?.town || '',
                state: result.address?.state || '',
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

    const handleSelectSearchResult = (result: any) => {
        setCurrentCoordinates({ lat: result.lat, lng: result.lng });
        setCurrentLocation(result.name);
        
        // Parse address from result
        const addressParts = result.name.split(',').map((s: string) => s.trim());
        
        setAddress({
            address1: addressParts[0] || '',
            address2: addressParts[1] || '',
            city: result.city,
            state: result.state,
            country: result.country,
            pincode: result.postcode,
        });
        
        setSearchResults([]);
        setShowResults(false);
        setSearchQuery('');
        
        toast({
            title: "Location Selected",
            description: result.name,
            variant: "default"
        });
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
                setCurrentLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
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

    const handleAddressSubmit = () => {
        // Here you would save the address and return to the previous page
        // For now, we'll just go back
        router.back();
    };

    const handleShowAddressForm = () => {
        setShowAddressForm(true);
    };

    const handleSaveDetails = () => {
        const savedLocation = {
            address1: address.address1,
            address2: address.address2,
            city: address.city,
            state: address.state,
            country: address.country,
            pincode: address.pincode,
            fullAddress: [address.address1, address.address2, address.city, address.state, address.pincode, address.country]
                .filter(Boolean)
                .join(', '),
            lat: currentCoordinates.lat,
            lng: currentCoordinates.lng,
        };

        localStorage.setItem(STORAGE_KEYS.clubSelectedLocation, JSON.stringify(savedLocation));
        router.back();
    };

    useEffect(() => {
        const reloadSavedLocation = () => {
            try {
                const locationData = localStorage.getItem(STORAGE_KEYS.clubSelectedLocation);
                if (locationData) {
                    const location = JSON.parse(locationData);
                    setAddress(prev => ({
                        ...prev,
                        address1: location.address1 || prev.address1,
                        address2: location.address2 || prev.address2,
                        city: location.city || prev.city,
                        state: location.state || prev.state,
                        country: location.country || prev.country,
                        pincode: location.pincode || prev.pincode,
                    }));
                    setCurrentLocation(location.fullAddress || currentLocation);
                    setCurrentCoordinates({ lat: location.lat ?? null, lng: location.lng ?? null });
                }
            } catch (error) {
                console.error('Failed to reload selected location:', error);
            }
        };

        window.addEventListener('focus', reloadSavedLocation);
        return () => window.removeEventListener('focus', reloadSavedLocation);
    }, [currentLocation]);

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            <PageHeader title={showAddressForm ? "Add Address Info" : "Enter your Location"} />

            {/* Google Map */}
            <div className="w-full h-[calc(100vh-250px)] pt-[10vh] z-[-1]">
                <div className="w-full h-full bg-gray-300 relative">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14882.301196323082!2d79.07200731381253!3d21.14599109999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd4c0a1a9e94981%3A0xb7c17454491a28cd!2sNagpur%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700143121201!5m2!1sen!2sin"
                        className="w-full h-full border-0"
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </div>

            {/* Bottom Container */}
            {!showAddressForm ? (
                <div className="fixed bottom-0 left-0 right-0 z-40 w-full py-7 px-5 bg-[#021313] overflow-hidden rounded-t-[40px] rounded-b-[20px] border-t-2 border-[#14FFEC] flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        {/* Search Box */}
                        <div className="h-[51px] py-[6px] relative">
                            <div className="h-[50px] py-[8px] px-[15px] bg-[#0D1F1F] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] overflow-hidden rounded-[23px] flex justify-between items-center">
                                <div className="flex items-center gap-[8px] flex-1">
                                    <div className="w-[30px] h-[30px] relative overflow-hidden flex items-center justify-center">
                                        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M21 21L16.65 16.65" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchLocation(e.target.value)}
                                        placeholder="Search location"
                                        className="bg-transparent text-white text-[16px] font-bold leading-[16px] tracking-[0.5px] outline-none flex-1 placeholder:text-white/50"
                                    />
                                </div>
                                <div className="w-[30px] h-[30px] relative overflow-hidden flex items-center justify-center">
                                    {loadingSearch ? (
                                        <Loader2 className="w-5 h-5 text-[#14FFEC] animate-spin" />
                                    ) : (
                                        <Image
                                            src="/admin/location/NavigationArrow.svg"
                                            alt="Navigation"
                                            width={24}
                                            height={24}
                                        />
                                    )}
                                </div>
                            </div>
                            
                            {/* Search Results Dropdown */}
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

                        {/* Current Location and Address */}
                        <div className="flex flex-col gap-3">
                            {/* Use Current Location Option */}
                            <div
                                onClick={handleUseCurrentLocation}
                                className={`flex items-center gap-[12px] cursor-pointer p-3 rounded-xl hover:bg-[#14FFEC]/10 transition-colors ${isLocating ? 'opacity-50' : ''}`}
                            >
                                <div className="w-[30px] h-[30px] relative overflow-hidden flex items-center justify-center">
                                    {isLocating ? (
                                        <Loader2 className="w-6 h-6 text-[#14FFEC] animate-spin" />
                                    ) : (
                                        <Navigation className="w-6 h-6 text-[#14FFEC]" />
                                    )}
                                </div>
                                <div className="text-white text-[16px] font-bold leading-[16px] tracking-[0.5px]">
                                    {isLocating ? 'Locating...' : 'Use your current location'}
                                </div>
                            </div>

                            {/* Selected Location */}
                            {currentLocation && (
                                <div className="py-4 px-5 bg-[#14FFEC]/5 border border-[#14FFEC]/30 rounded-[20px] flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="w-[24px] h-[24px] relative overflow-hidden flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-[#14FFEC]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-[14px] font-medium leading-[20px] tracking-[0.14px]">{currentLocation}</p>
                                        <p className="text-[#14FFEC] text-[10px] uppercase font-bold mt-1">Confirmed Location</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add Address Button */}
                    <div
                        onClick={handleShowAddressForm}
                        className="text-center text-[#14FFEC] text-[18px] font-semibold leading-[21px] tracking-[0.2px] cursor-pointer hover:underline"
                    >
                        Add Address Information
                    </div>
                </div>
            ) : (
                <div className="fixed bottom-0 left-0 right-0 z-40 w-full pt-8 pb-10 px-6 bg-[#021313] overflow-hidden rounded-t-[40px] rounded-b-[20px] border-t-2 border-[#14FFEC] flex flex-col items-center gap-8 max-h-[80vh] overflow-y-auto">
                    <div className="flex flex-col items-center gap-6 w-full max-w-[360px]">
                        <div className="text-center text-[#14FFEC] text-[16px] font-semibold leading-[21px] tracking-[0.16px]">
                            Enter location manually
                        </div>

                        <div className="w-full flex flex-col items-start gap-4">
                            <div className="w-full px-2 flex justify-start items-center mb-1">
                                <div className="flex-1 flex flex-col justify-center text-white text-[20px] font-semibold leading-[16px] tracking-[0.5px]">
                                    Address info
                                </div>
                            </div>

                            <div className="w-full flex flex-col items-start gap-3">
                                {/* Address 1 */}
                                <div className="w-full px-2 flex justify-start items-center">
                                    <div className="flex-1 flex flex-col justify-center text-[#14FFEC] text-[16px] font-semibold leading-[16px] tracking-[0.5px]">
                                        Address 1 *
                                    </div>
                                </div>
                                <div className="w-full h-[50px] px-4 py-3 bg-[#0D1F1F] rounded-[30px] outline outline-[#0C898B] flex items-center">
                                    <input
                                        type="text"
                                        value={address.address1}
                                        onChange={(e) => handleAddressChange('address1', e.target.value)}
                                        placeholder="Enter address line 1"
                                        className="w-full bg-transparent text-white text-[16px] font-semibold leading-[16px] tracking-[0.5px] outline-none placeholder:text-white/40"
                                    />
                                </div>

                                {/* Address 2 */}
                                <div className="w-full px-2 flex justify-start items-center">
                                    <div className="flex-1 flex flex-col justify-center text-[#14FFEC] text-[16px] font-semibold leading-[16px] tracking-[0.5px]">
                                        Address 2 (Optional)
                                    </div>
                                </div>
                                <div className="w-full h-[50px] px-4 py-3 bg-[#0D1F1F] rounded-[30px] outline outline-[#0C898B] flex items-center">
                                    <input
                                        type="text"
                                        value={address.address2}
                                        onChange={(e) => handleAddressChange('address2', e.target.value)}
                                        placeholder="Enter address line 2"
                                        className="w-full bg-transparent text-white text-[16px] font-semibold leading-[16px] tracking-[0.5px] outline-none placeholder:text-white/40"
                                    />
                                </div>

                                {/* City and State in one row */}
                                <div className="w-full flex justify-between items-center gap-3">
                                    <div className="w-[48%] flex flex-col items-start gap-3">
                                        <div className="w-full px-2 flex justify-start items-center">
                                            <div className="flex-1 flex flex-col justify-center text-[#14FFEC] text-[16px] font-semibold leading-[16px] tracking-[0.5px]">
                                                City *
                                            </div>
                                        </div>
                                        <div className="w-full h-[50px] px-4 py-3 bg-[#0D1F1F] rounded-[30px] outline outline-[#0C898B] flex items-center">
                                            <input
                                                type="text"
                                                value={address.city}
                                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                                placeholder="Enter City"
                                                className="w-full bg-transparent text-white text-[16px] font-semibold leading-[16px] tracking-[0.5px] outline-none placeholder:text-white/40"
                                            />
                                        </div>
                                    </div>

                                    <div className="w-[48%] flex flex-col items-start gap-3">
                                        <div className="w-full px-2 flex justify-start items-center">
                                            <div className="flex-1 flex flex-col justify-center text-[#14FFEC] text-[16px] font-semibold leading-[16px] tracking-[0.5px]">
                                                State *
                                            </div>
                                        </div>
                                        <div className="w-full h-[50px] px-4 py-3 bg-[#0D1F1F] rounded-[30px] outline outline-[#0C898B] flex items-center relative">
                                            <select
                                                value={address.state}
                                                onChange={(e) => handleAddressChange('state', e.target.value)}
                                                className="w-full bg-transparent text-white text-[16px] font-semibold leading-[16px] tracking-[0.5px] outline-none appearance-none"
                                            >
                                                <option value="" className="text-gray-900">Select State</option>
                                                <option value="Maharashtra" className="text-gray-900">Maharashtra</option>
                                                <option value="Karnataka" className="text-gray-900">Karnataka</option>
                                                <option value="Delhi" className="text-gray-900">Delhi</option>
                                            </select>
                                            <div className="absolute right-4 pointer-events-none">
                                                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 1.5L6 6.5L11 1.5" stroke="#14FFEC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Country and Pincode in one row */}
                                <div className="w-full flex justify-between items-center gap-3">
                                    <div className="w-[48%] flex flex-col items-start gap-3">
                                        <div className="w-full px-2 flex justify-start items-center">
                                            <div className="flex-1 flex flex-col justify-center text-[#14FFEC] text-[16px] font-semibold leading-[16px] tracking-[0.5px]">
                                                Country
                                            </div>
                                        </div>
                                        <div className="w-full h-[50px] px-4 py-3 bg-[#0D1F1F] rounded-[30px] outline outline-[#0C898B] flex items-center">
                                            <input
                                                type="text"
                                                value={address.country}
                                                onChange={(e) => handleAddressChange('country', e.target.value)}
                                                placeholder="Enter Country"
                                                className="w-full bg-transparent text-white text-[16px] font-semibold leading-[16px] tracking-[0.5px] outline-none placeholder:text-white/40"
                                            />
                                        </div>
                                    </div>

                                    <div className="w-[48%] flex flex-col items-start gap-3">
                                        <div className="w-full px-2 flex justify-start items-center">
                                            <div className="flex-1 flex flex-col justify-center text-[#14FFEC] text-[16px] font-semibold leading-[16px] tracking-[0.5px]">
                                                Pincode
                                            </div>
                                        </div>
                                        <div className="w-full h-[50px] px-4 py-3 bg-[#0D1F1F] rounded-[30px] outline outline-[#0C898B] flex items-center">
                                            <input
                                                type="text"
                                                value={address.pincode}
                                                onChange={(e) => handleAddressChange('pincode', e.target.value)}
                                                placeholder="Enter Pincode"
                                                className="w-full bg-transparent text-white text-[16px] font-semibold leading-[16px] tracking-[0.5px] outline-none placeholder:text-white/40"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Details Button */}
                    <button
                        onClick={handleSaveDetails}
                        className="w-[220px] h-[45px] bg-[#0F6861] rounded-[30px] flex justify-center items-center mx-auto hover:bg-[#0D7A76] transition-colors"
                    >
                        <div className="text-center text-white text-[18px] font-bold tracking-[0.08px]">
                            Save Details
                        </div>
                    </button>
                </div>
            )
            }
        </div >
    );
}
