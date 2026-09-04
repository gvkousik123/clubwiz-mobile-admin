'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Upload, Trash2, Plus, ChevronLeft, ChevronRight, Share2, MapPin, Edit3 } from 'lucide-react';
import { useState, useEffect, Suspense, useRef } from 'react';
import { ClubService } from '@/lib/services/club.service';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64 } from '@/lib/image-utils';
import LocationModal from '@/components/common/location-modal';

// Tag Component for reusability
const TagComponent = ({ icon, label, iconPath }: { icon?: React.ReactNode, label: string, iconPath?: string }) => (
    <div className="px-3 py-2 bg-[rgba(40,60,61,0.30)] rounded-full flex items-center gap-2">
        {iconPath && (
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <img src={iconPath} alt={label} className="w-3.5 h-3.5" />
            </div>
        )}
        {icon && icon}
        <span className="text-white text-xs">{label}</span>
    </div>
);

function EditClubContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const clubId = params.id === '_' ? (searchParams.get('id') || '') : (params.id as string);
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [clubData, setClubData] = useState<any>(null);
    const [editData, setEditData] = useState<any>(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<any>({
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        lat: null,
        lng: null
    });
    const [clubImages, setClubImages] = useState<string[]>([]);
    const [logo, setLogo] = useState<string>('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [mainImage, setMainImage] = useState<string>('');
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [musicTags, setMusicTags] = useState<string[]>([]);
    const [facilitiesTags, setFacilitiesTags] = useState<string[]>([]);
    const [foodCuisinesTags, setFoodCuisinesTags] = useState<string[]>([]);
    const [barOptionsTags, setBarOptionsTags] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const mainImageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadClubData = async () => {
            try {
                setIsLoading(true);
                const response = await ClubService.getClubById(clubId);

                let club: any;
                if (response.success && response.data) {
                    club = response.data;
                } else if ((response as any).id) {
                    club = response;
                } else {
                    throw new Error('Failed to load club data');
                }

                setClubData(club);

                // Extract logo
                const logoUrl = typeof club?.logo === 'string' ? club.logo : club?.logo?.url || '';
                setLogo(logoUrl);

                // Extract main image (find first MAIN_IMAGE type or use logo as fallback)
                const mainImageObj = (club?.images || []).find((img: any) =>
                    (typeof img !== 'string' && img?.type === 'MAIN_IMAGE')
                );
                const mainImageUrl = mainImageObj?.url || logoUrl;
                setMainImage(mainImageUrl);

                // Extract club images (all non-MAIN_IMAGE images)
                const clubImageUrls = (club?.images || [])
                    .filter((img: any) => {
                        if (typeof img === 'string') return true;
                        return img?.type !== 'MAIN_IMAGE';
                    })
                    .map((img: any) => typeof img === 'string' ? img : img?.url || '')
                    .filter((url: string) => url);
                setClubImages(clubImageUrls);

                // Set tag arrays
                setMusicTags(club?.music || []);
                setFacilitiesTags(club?.facilities || []);
                setFoodCuisinesTags(club?.foodCuisines || []);
                setBarOptionsTags(club?.barOptions || []);

                const loc = {
                    address1: club?.locationText?.address1 || club?.address1 || '',
                    address2: club?.locationText?.address2 || club?.address2 || '',
                    city: club?.locationText?.city || club?.city || '',
                    state: club?.locationText?.state || club?.state || '',
                    pincode: club?.locationText?.pincode || club?.pincode || '',
                    country: club?.locationText?.country || club?.country || 'India',
                    lat: club?.locationText?.lat || club?.locationText?.latitude || club?.lat || null,
                    lng: club?.locationText?.lng || club?.locationText?.longitude || club?.lng || null,
                };
                setSelectedLocation(loc);

                setEditData({
                    name: club?.name || '',
                    description: club?.description || '',
                    phone: club?.contactPhone || club?.phone || '',
                    email: club?.contactEmail || club?.email || '',
                    maxMembers: club?.maxMembers || '',
                    address1: loc.address1,
                    address2: loc.address2,
                    city: loc.city,
                    state: loc.state,
                    pincode: loc.pincode,
                    country: loc.country,
                    lat: loc.lat,
                    lng: loc.lng,
                });
            } catch (error) {
                console.error('Error loading club:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load club data',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (clubId) loadClubData();
    }, [clubId]);

    const handleLocationSelect = (loc: any) => {
        console.log('📍 Location selected in Edit Club:', loc);
        setSelectedLocation(loc);
        // A newly picked location REPLACES the old address outright. Falling back to
        // prev?.* here let fields the geocoder didn't return (commonly pincode and
        // address2) keep the previous club's values, saving a mix of two addresses.
        setEditData((prev: any) => ({
            ...prev,
            address1: loc.address1 || '',
            address2: loc.address2 || '',
            city: loc.city || '',
            state: loc.state || '',
            pincode: loc.pincode || '',
            country: loc.country || 'India',
            lat: loc.lat ?? null,
            lng: loc.lng ?? null,
        }));
    };

    const handleGoBack = () => router.push('/bz/business');

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogo(event.target?.result as string);
            };
            reader.readAsDataURL(file);
            toast({ title: 'Logo uploaded', description: 'Logo uploaded successfully' });
        }
    };

    const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMainImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setMainImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
            toast({ title: 'Main image uploaded', description: 'Main image uploaded successfully' });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newImages: string[] = [];
            for (const file of Array.from(files)) {
                try {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        newImages.push(event.target?.result as string);
                        if (newImages.length === files.length) {
                            setClubImages(prev => [...prev, ...newImages]);
                            toast({ title: 'Images added', description: `${newImages.length} image(s) uploaded successfully` });
                        }
                    };
                    reader.readAsDataURL(file);
                } catch (err) {
                    console.error('Failed to process image:', err);
                }
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setClubImages(clubImages.filter((_, i) => i !== index));
        toast({ title: 'Image removed', description: 'Image deleted successfully' });
    };

    const handleRemoveLogo = () => {
        setLogo('');
        setLogoFile(null);
        if (logoInputRef.current) logoInputRef.current.value = '';
        toast({ title: 'Logo removed', description: 'Logo deleted successfully' });
    };

    const handleRemoveMainImage = () => {
        setMainImage('');
        setMainImageFile(null);
        if (mainImageInputRef.current) mainImageInputRef.current.value = '';
        toast({ title: 'Main image removed', description: 'Main image deleted successfully' });
    };

    const handleSave = async () => {
        if (!clubId || !editData) return;

        try {
            setIsSaving(true);

            // Handle logo - convert to proper format if new file uploaded
            let logoData: any = null;
            if (logoFile) {
                const logoBase64 = await fileToBase64(logoFile);
                logoData = {
                    name: logoFile.name || "club-logo.jpg",
                    contentType: logoFile.type || "image/jpeg",
                    data: logoBase64,
                    type: "LOGO"
                };
            } else if (logo && !logo.startsWith('data:')) {
                // Existing logo URL from server - keep as is
                logoData = {
                    url: logo,
                    type: "LOGO"
                };
            }

            // Build images array: mainImage + clubImages
            const allImages: any[] = [];

            // Add main image as MAIN_IMAGE type
            if (mainImageFile) {
                const mainImageBase64 = await fileToBase64(mainImageFile);
                allImages.push({
                    name: mainImageFile.name || "main-image.jpg",
                    contentType: mainImageFile.type || "image/jpeg",
                    data: mainImageBase64,
                    type: 'MAIN_IMAGE'
                });
            } else if (mainImage && !mainImage.startsWith('data:')) {
                // Existing main image URL from server
                allImages.push({ type: 'MAIN_IMAGE', url: mainImage });
            }

            // Add club images (keeping existing ones and new ones)
            for (const img of clubImages) {
                if (img.startsWith('data:')) {
                    // New image uploaded as base64 data URL - extract base64 part
                    const base64Match = img.match(/data:([^;]+);base64,(.+)/);
                    if (base64Match) {
                        allImages.push({
                            name: `club-image-${Date.now()}.jpg`,
                            contentType: base64Match[1] || "image/jpeg",
                            data: base64Match[2],
                            type: 'AMBIANCE'
                        });
                    }
                } else {
                    // Existing image URL from the server - preserve its type
                    const originalImage = (clubData?.images || []).find((ci: any) =>
                        (typeof ci === 'string' ? ci : ci?.url) === img
                    );
                    const type = originalImage && typeof originalImage !== 'string' ? originalImage.type : 'AMBIANCE';
                    allImages.push({ type, url: img });
                }
            }

            const updatePayload = {
                name: editData.name,
                description: editData.description,
                logo: logoData,
                contactPhone: editData.phone,
                contactEmail: editData.email,
                maxMembers: editData.maxMembers ? parseInt(editData.maxMembers) : null,
                music: musicTags,
                facilities: facilitiesTags,
                foodCuisines: foodCuisinesTags,
                barOptions: barOptionsTags,
                locationText: {
                    address1: editData.address1 || selectedLocation.address1 || "",
                    address2: editData.address2 || selectedLocation.address2 || "",
                    city: editData.city || selectedLocation.city || undefined,
                    state: editData.state || selectedLocation.state || undefined,
                    pincode: editData.pincode || selectedLocation.pincode || undefined,
                    country: editData.country || selectedLocation.country || undefined,
                    latitude: editData.lat || selectedLocation.lat || undefined,
                    longitude: editData.lng || selectedLocation.lng || undefined,
                    lat: editData.lat || selectedLocation.lat || undefined,
                    lng: editData.lng || selectedLocation.lng || undefined,
                },
                images: allImages,
            };

            // Remove undefined values to prevent JSON serialization errors
            const cleanPayload = Object.fromEntries(
                Object.entries(updatePayload).filter(([_, v]) => v !== undefined)
            );

            console.log('📋 Update payload:', cleanPayload);
            await ClubService.updateClub(clubId, cleanPayload as any);
            toast({
                title: 'Success',
                description: 'Club updated successfully',
                variant: 'success',
            });
            router.push('/bz/business');
        } catch (error: any) {
            console.error('Error saving club:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save club data',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#14FFEC] animate-spin" />
            </div>
        );
    }

    if (!clubData || !editData) {
        return (
            <div className="min-h-screen bg-[#021313] flex flex-col items-center justify-center p-4">
                <p className="text-white mb-4">Club not found</p>
                <button onClick={handleGoBack} className="text-[#14FFEC] flex items-center gap-2 hover:opacity-80">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] relative w-full max-w-[430px] mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-4">
                <button onClick={handleGoBack} className="text-[#14FFEC] flex items-center gap-2 hover:opacity-80">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <h1 className="text-white text-2xl font-bold">Edit Club</h1>
                <div className="w-5"></div>
            </div>

            {/* Form Container */}
            <div className="space-y-4 pb-20">
                {/* Club Name */}
                <div>
                    <label className="text-white text-sm font-semibold mb-2 block">Club Name</label>
                    <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full bg-[rgba(40,60,61,0.30)] border border-[#14FFEC]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#14FFEC]"
                        placeholder="Club name"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="text-white text-sm font-semibold mb-2 block">Description</label>
                    <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full bg-[rgba(40,60,61,0.30)] border border-[#14FFEC]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#14FFEC] min-h-[100px]"
                        placeholder="Club description"
                    />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-white text-sm font-semibold mb-2 block">Phone</label>
                        <input
                            type="text"
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            className="w-full bg-[rgba(40,60,61,0.30)] border border-[#14FFEC]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#14FFEC]"
                            placeholder="Phone"
                        />
                    </div>
                    <div>
                        <label className="text-white text-sm font-semibold mb-2 block">Email</label>
                        <input
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            className="w-full bg-[rgba(40,60,61,0.30)] border border-[#14FFEC]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#14FFEC]"
                            placeholder="Email"
                        />
                    </div>
                </div>

                {/* Max Members */}
                <div>
                    <label className="text-white text-sm font-semibold mb-2 block">Max Members</label>
                    <input
                        type="number"
                        min={1}
                        value={editData.maxMembers}
                        onChange={(e) => setEditData({ ...editData, maxMembers: Math.max(1, parseInt(e.target.value) || 0).toString() })}
                        className="w-full bg-[rgba(40,60,61,0.30)] border border-[#14FFEC]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#14FFEC]"
                        placeholder="500"
                    />
                </div>

                {/* Music Genres */}
                <div>
                    <label className="text-white text-sm font-semibold mb-2 block">Music Genres</label>
                    <div className="w-full bg-[rgba(40,60,61,0.30)] border border-[#14FFEC]/30 rounded-lg px-4 py-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {musicTags.map((tag, idx) => (
                                <div key={idx} className="px-3 py-1.5 bg-[#14FFEC]/20 text-[#14FFEC] rounded-full flex items-center gap-2">
                                    <span className="text-sm">{tag}</span>
                                    <button
                                        onClick={() => setMusicTags(musicTags.filter((_, i) => i !== idx))}
                                        className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full transition"
                                    >
                                        <span className="text-white text-xs font-bold leading-none">×</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Type and press Enter to add"
                            className="w-full bg-transparent text-white focus:outline-none text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    e.preventDefault();
                                    setMusicTags([...musicTags, e.currentTarget.value.trim()]);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Facilities */}
                <div>
                    <label className="text-white text-sm font-semibold mb-2 block">Facilities</label>
                    <div className="w-full bg-[rgba(40,60,61,0.30)] border border-[#14FFEC]/30 rounded-lg px-4 py-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {facilitiesTags.map((tag, idx) => (
                                <div key={idx} className="px-3 py-1.5 bg-[#14FFEC]/20 text-[#14FFEC] rounded-full flex items-center gap-2">
                                    <span className="text-sm">{tag}</span>
                                    <button
                                        onClick={() => setFacilitiesTags(facilitiesTags.filter((_, i) => i !== idx))}
                                        className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full transition"
                                    >
                                        <span className="text-white text-xs font-bold leading-none">×</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Type and press Enter to add"
                            className="w-full bg-transparent text-white focus:outline-none text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    e.preventDefault();
                                    setFacilitiesTags([...facilitiesTags, e.currentTarget.value.trim()]);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Food Cuisines */}
                <div>
                    <label className="text-white text-sm font-semibold mb-2 block">Food Cuisines</label>
                    <div className="w-full bg-[rgba(40,60,61,0.30)] border border-[#14FFEC]/30 rounded-lg px-4 py-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {foodCuisinesTags.map((tag, idx) => (
                                <div key={idx} className="px-3 py-1.5 bg-[#14FFEC]/20 text-[#14FFEC] rounded-full flex items-center gap-2">
                                    <span className="text-sm">{tag}</span>
                                    <button
                                        onClick={() => setFoodCuisinesTags(foodCuisinesTags.filter((_, i) => i !== idx))}
                                        className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full transition"
                                    >
                                        <span className="text-white text-xs font-bold leading-none">×</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Type and press Enter to add"
                            className="w-full bg-transparent text-white focus:outline-none text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    e.preventDefault();
                                    setFoodCuisinesTags([...foodCuisinesTags, e.currentTarget.value.trim()]);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Bar Options */}
                <div>
                    <label className="text-white text-sm font-semibold mb-2 block">Bar Options</label>
                    <div className="w-full bg-[rgba(40,60,61,0.30)] border border-[#14FFEC]/30 rounded-lg px-4 py-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {barOptionsTags.map((tag, idx) => (
                                <div key={idx} className="px-3 py-1.5 bg-[#14FFEC]/20 text-[#14FFEC] rounded-full flex items-center gap-2">
                                    <span className="text-sm">{tag}</span>
                                    <button
                                        onClick={() => setBarOptionsTags(barOptionsTags.filter((_, i) => i !== idx))}
                                        className="w-4 h-4 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full transition"
                                    >
                                        <span className="text-white text-xs font-bold leading-none">×</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Type and press Enter to add"
                            className="w-full bg-transparent text-white focus:outline-none text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    e.preventDefault();
                                    setBarOptionsTags([...barOptionsTags, e.currentTarget.value.trim()]);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Location Section */}
                <div className="border-t border-[#14FFEC]/30 pt-4">
                    <div className="w-full flex flex-col gap-[11px]">
                        <div className="flex items-center justify-between">
                            <label className="text-[#14FFEC] font-semibold text-base">Club Location <span className="text-red-500">*</span></label>
                            {(selectedLocation.city || editData.city) && (
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
                        {(selectedLocation.city || editData.city) && (selectedLocation.state || editData.state) ? (
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
                                                {selectedLocation.city || editData.city}, {selectedLocation.state || editData.state}
                                            </h4>
                                            {(selectedLocation.lat || editData.lat) && (selectedLocation.lng || editData.lng) ? (
                                                <span className="text-[10px] bg-[#14FFEC]/15 text-[#14FFEC] font-mono px-2 py-0.5 rounded-full border border-[#14FFEC]/30">
                                                    GPS PIN
                                                </span>
                                            ) : null}
                                        </div>
                                        {(selectedLocation.address1 || editData.address1) && (
                                            <p className="text-white/80 text-sm mt-1 truncate">
                                                {selectedLocation.address1 || editData.address1}
                                                {(selectedLocation.address2 || editData.address2) ? `, ${selectedLocation.address2 || editData.address2}` : ''}
                                            </p>
                                        )}
                                        <p className="text-[#14FFEC]/70 text-xs mt-1.5 font-medium">
                                            {(selectedLocation.pincode || editData.pincode) ? `Pincode: ${selectedLocation.pincode || editData.pincode} · ` : ''}
                                            {selectedLocation.country || editData.country || 'India'}
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
                                    value={editData.address1 || ''}
                                    onChange={(e) => setEditData({ ...editData, address1: e.target.value })}
                                    className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                    placeholder="Address Line 1 (Street/Landmark)"
                                />
                            </div>
                            <div className="w-full bg-[#0D1F1F] border border-[#0C898B]/60 rounded-[30px] p-[10px] px-5 focus-within:border-[#14FFEC]/60 transition-colors">
                                <input
                                    type="text"
                                    value={editData.address2 || ''}
                                    onChange={(e) => setEditData({ ...editData, address2: e.target.value })}
                                    className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                    placeholder="Address Line 2 (Area/Locality)"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logo Section */}
                <div className="border-t border-[#14FFEC]/30 pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-lg font-semibold">Club Logo</h3>
                        <button
                            onClick={() => logoInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-[#14FFEC]/20 text-[#14FFEC] rounded-lg hover:bg-[#14FFEC]/30 transition"
                        >
                            <Upload className="w-4 h-4" /> {logo ? 'Change' : 'Upload'}
                        </button>
                    </div>
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                    />
                    {logo && logo.trim() ? (
                        <div className="relative w-32 h-32">
                            <img
                                src={logo}
                                alt="Club Logo"
                                loading="lazy"
                                className="w-full h-full object-cover rounded-lg bg-[#0D1F1F]"
                                onError={(e) => {
                                    console.error('❌ Logo failed to load:', logo);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <button
                                onClick={handleRemoveLogo}
                                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-1.5 transition shadow-lg"
                            >
                                <Trash2 className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    ) : (
                        <p className="text-white/60 text-sm py-4">No logo uploaded</p>
                    )}
                </div>

                {/* Main Image Section */}
                <div className="border-t border-[#14FFEC]/30 pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-lg font-semibold">Main Image</h3>
                        <button
                            onClick={() => mainImageInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-[#14FFEC]/20 text-[#14FFEC] rounded-lg hover:bg-[#14FFEC]/30 transition"
                        >
                            <Upload className="w-4 h-4" /> {mainImage ? 'Change' : 'Upload'}
                        </button>
                    </div>
                    <input
                        ref={mainImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        className="hidden"
                    />
                    {mainImage && mainImage.trim() ? (
                        <div className="relative w-full h-48">
                            <img
                                src={mainImage}
                                alt="Main Image"
                                loading="lazy"
                                className="w-full h-full object-cover rounded-lg bg-[#0D1F1F]"
                                onError={(e) => {
                                    console.error('❌ Main image failed to load:', mainImage);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <button
                                onClick={handleRemoveMainImage}
                                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-1.5 transition shadow-lg"
                            >
                                <Trash2 className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    ) : (
                        <p className="text-white/60 text-sm py-4">No main image uploaded</p>
                    )}
                </div>

                {/* Club Images Section */}
                <div className="border-t border-[#14FFEC]/30 pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-lg font-semibold">Club Images</h3>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-[#14FFEC]/20 text-[#14FFEC] rounded-lg hover:bg-[#14FFEC]/30 transition"
                        >
                            <Plus className="w-4 h-4" /> Add Images
                        </button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />

                    {clubImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                            {clubImages.filter(img => img && img.trim()).map((img, idx) => (
                                <div key={`${img}-${idx}`} className="relative">
                                    <img
                                        src={img}
                                        alt={`Club ${idx + 1}`}
                                        loading="lazy"
                                        className="w-full h-24 object-cover rounded-lg bg-[#0D1F1F]"
                                        onError={(e) => {
                                            console.error('❌ Image failed to load:', img);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <button
                                        onClick={() => handleRemoveImage(idx)}
                                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-1.5 transition shadow-lg"
                                    >
                                        <Trash2 className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-white/60 text-sm py-4">No club images. Click "Add Images" to upload.</p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 bg-[#021313] py-4 border-t border-[#14FFEC]/30">
                    <button
                        onClick={handleGoBack}
                        className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#005D5C] to-[#14FFEC] text-white rounded-lg hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Location Selection Modal */}
            <LocationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSelectLocation={handleLocationSelect}
                initialAddress={(editData && editData.address1) ? `${editData.address1}, ${editData.city || ''}` : ''}
            />
        </div>
    );
}

export default function EditClubPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#021313] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#14FFEC] animate-spin" /></div>}>
            <EditClubContent />
        </Suspense>
    );
}
