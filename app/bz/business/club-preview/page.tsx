'use client';

import React, { useState, useEffect, Suspense } from 'react';
import LocationMapView from '@/components/common/location-map-view';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
    Share2,
    MapPin,
    Star,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Edit3,
    Trash2,
    Loader2,
    Heart,
} from 'lucide-react';
import { ClubService } from '@/lib/services/club.service';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

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

function ClubPreviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const clubId = searchParams.get('clubId');
    const { toast } = useToast();

    const [clubData, setClubData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState<number | null>(null);
    const [showVibeModal, setShowVibeModal] = useState(false);

    const heroImages = clubData?.images?.length > 0
        ? clubData.images.map((img: any) => img.url || img)
        : (clubData?.logo || clubData?.logoUrl ? [clubData.logo || clubData.logoUrl] : []);

    useEffect(() => {
        const loadClubData = async () => {
            try {
                if (!clubId) {
                    setError('No club ID provided');
                    setIsLoading(false);
                    return;
                }

                const response = await ClubService.getClubById(clubId);

                let clubDetails: any;
                if (response.success && response.data) {
                    clubDetails = response.data;
                } else if ((response as any).id) {
                    clubDetails = response;
                } else {
                    throw new Error('Invalid response format');
                }

                setClubData(clubDetails);
                setError(null);

                // Fetch favorite count
                try {
                    const countData = await ClubService.getFavoriteCount(clubId);
                    setFavoriteCount(countData.favoriteCount ?? 0);
                } catch {
                    setFavoriteCount(0);
                }
            } catch (err) {
                console.error('Error loading club:', err);
                setError('Failed to load club data');
            } finally {
                setIsLoading(false);
            }
        };

        loadClubData();
    }, [clubId]);

    const handleGoBack = () => {
        router.push('/bz/business');
    };

    const handleEdit = () => {
        router.push(`/bz/business/edit-club/_?id=${clubId}`);
    };

    const handleShare = async () => {
        try {
            if (navigator?.share) {
                await navigator.share({
                    title: clubData?.name || 'Club',
                    text: `Check out ${clubData?.name || 'this club'}!`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast({ title: 'Link copied!', description: 'Club link copied to clipboard.' });
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % (clubData?.images?.length > 0 ? clubData.images.length : 1));
    };

    const prevImage = () => {
        const imageCount = clubData?.images?.length > 0 ? clubData.images.length : 1;
        setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
    };

    const handleDeleteClub = async () => {
        if (!clubId) return;

        try {
            setIsDeleting(true);
            await ClubService.deleteClub(clubId);
            toast({ title: 'Success', description: 'Club deleted successfully', variant: 'success' });
            router.push('/bz/business');
        } catch (err) {
            console.error('Error deleting club:', err);
            toast({
                title: 'Delete Failed',
                description: err instanceof Error ? err.message : 'Failed to delete club',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#14FFEC] animate-spin" />
            </div>
        );
    }

    if (error || !clubData) {
        return (
            <div className="min-h-screen bg-[#021313] flex flex-col items-center justify-center p-4">
                <p className="text-white mb-4">{error || 'Club not found'}</p>
                <button onClick={handleGoBack} className="text-[#14FFEC] flex items-center gap-2 hover:opacity-80">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] relative w-full max-w-[430px] mx-auto">
            {/* Hero Image Carousel */}
            <div className="relative w-[430px] h-[391px] bg-gray-900 overflow-hidden flex justify-center items-center mx-auto">
                <div className="absolute inset-0 flex">
                    {heroImages.map((image, index) => (
                        <img
                            key={`${clubData.id}-${index}`}
                            className="min-w-full h-full object-cover transition-transform duration-300"
                            src={image}
                            alt={`${clubData.name} - Image ${index + 1}`}
                            style={{
                                transform: `translateX(${(index - currentImageIndex) * 100}%)`,
                            }}
                            onError={(e) => {
                                console.error('❌ Image failed to load:', image);
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ))}
                </div>

                {/* Navigation arrows (only if multiple images) */}
                {heroImages.length > 1 && (
                    <>
                        <button 
                            onClick={prevImage} 
                            className="absolute left-[14px] top-1/2 transform -translate-y-1/2 w-[40px] h-[40px] bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition z-10"
                        >
                            <ChevronLeft className="w-6 h-6 text-black" />
                        </button>
                        <button 
                            onClick={nextImage} 
                            className="absolute right-[14px] top-1/2 transform -translate-y-1/2 w-[40px] h-[40px] bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition z-10"
                        >
                            <ChevronRight className="w-6 h-6 text-black" />
                        </button>
                    </>
                )}

                {/* Back button */}
                <button
                    onClick={handleGoBack}
                    className="absolute left-4 top-4 w-[35px] h-[35px] bg-white/20 rounded-[18px] flex items-center justify-center hover:bg-white/30 transition z-10"
                >
                    <ArrowLeft className="h-5 w-5 text-white" />
                </button>

                {/* Action Buttons - Share, Edit, Delete - FIXED: At very top right with back button */}
                <div className="absolute right-4 top-4 flex items-center gap-2 z-10">
                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        className="w-10 h-10 flex justify-center items-center rounded-full bg-white hover:bg-white/90 transition"
                    >
                        <Share2 size={20} className="text-black" />
                    </button>

                    {/* Edit Button */}
                    <button
                        onClick={handleEdit}
                        className="w-10 h-10 flex justify-center items-center rounded-full bg-white hover:bg-white/90 transition"
                    >
                        <Edit3 size={20} className="text-black" />
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="w-10 h-10 flex justify-center items-center rounded-full bg-white hover:bg-white/90 transition"
                    >
                        <Trash2 size={20} className="text-red-500" />
                    </button>
                </div>
            </div>

            {/* Main content Section */}
            <div 
                className="w-full bg-[#021313] rounded-tl-[40px] rounded-tr-[40px] rounded-br-[20px] rounded-bl-[20px] pb-8 relative"
                style={{ marginTop: '-32px', position: 'relative', zIndex: 10 }}
            >
                {/* Club Logo Circle - Centered at top, half outside */}
                <div 
                    className="absolute flex items-center gap-2.5 p-1 rounded-[36px] border-2 border-solid border-[#14FFEC] bg-[#021313]"
                    style={{
                        top: '-36px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                >
                    <img
                        src={clubData.logo || ''}
                        alt={clubData.name}
                        className="w-16 h-16 object-cover rounded-[45px]"
                        onError={(e) => (e.currentTarget.src = heroImages[0])}
                    />
                </div>
                {/* Rating Circle - Below the logo */}
                <div 
                    onClick={() => setShowVibeModal(true)}
                    className="absolute w-[38px] h-[38px] bg-[#005d5c] rounded-[30px] flex items-center justify-center cursor-pointer hover:bg-[#007a79] transition-colors"
                    style={{
                        top: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                >
                    <span className="font-bold text-[16px] leading-[21px] text-center text-[#fff4f4]">
                        {clubData.rating || clubData.avgRating || 4.2}
                    </span>
                </div>

                {/* Club Name */}
                <div 
                    className="px-[29px] text-center"
                    style={{ paddingTop: '79px' }}
                >
                    <span className="font-bold text-[36px] leading-[40px] text-center text-white" style={{ fontFamily: "'Anton SC', sans-serif" }}>
                        {clubData.name}
                    </span>
                </div>

                {/* Main Content Container */}
                <div className="w-full" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '25px', paddingBottom: '9px' }}>
                    <div className="w-full flex flex-col justify-center items-center gap-[11px] bg-[rgba(40,60,61,0.3)] py-[15px] rounded-[15px]" style={{ paddingLeft: '17px', paddingRight: '17px' }}>
                        
                        {/* About Section - hidden when the club has no description */}
                        {clubData?.description && (
                            <div className="flex flex-col self-stretch">
                                <div className="flex items-center gap-2.5 self-stretch mb-3">
                                    <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">About</span>
                                </div>
                                <p className="text-white/80 text-xs leading-5 px-1">
                                    {clubData.description}
                                </p>
                            </div>
                        )}

                        {/* Contact Section */}
                        {(clubData?.contactPhone || clubData?.phone || clubData?.contactEmail || clubData?.email) && (
                            <div className="flex flex-col self-stretch mt-2">
                                <div className="flex items-center gap-2.5 self-stretch mb-3">
                                    <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">Contact</span>
                                </div>
                                <div className="flex flex-col gap-1.5 px-1">
                                    {(clubData?.contactPhone || clubData?.phone) && (
                                        <p className="text-white/80 text-xs">📞 {clubData?.contactPhone || clubData?.phone}</p>
                                    )}
                                    {(clubData?.contactEmail || clubData?.email) && (
                                        <p className="text-white/80 text-xs">✉️ {clubData?.contactEmail || clubData?.email}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Details - each line appears only when the club actually has that value */}
                        {(clubData?.category || clubData?.maxMembers) && (
                            <div className="flex flex-col self-stretch mt-2">
                                <div className="flex items-center gap-2.5 self-stretch mb-3">
                                    <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">Details</span>
                                </div>
                                <div className="flex flex-col gap-1.5 px-1">
                                    {clubData?.category && (
                                        <p className="text-white/80 text-xs">Category: {clubData.category}</p>
                                    )}
                                    {clubData?.maxMembers && (
                                        <p className="text-white/80 text-xs">Capacity: {clubData.maxMembers} members</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[1px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent opacity-80"></div>
                </div>

                {/* Location Section */}
                <div className="w-full" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                    <div className="flex flex-col items-center self-stretch">
                        <div className="flex items-center gap-2.5 self-stretch mb-[16px]">
                            <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">Location</span>
                        </div>

                        <div className="w-full max-w-[398px] mx-auto">
                            <LocationMapView
                                lat={clubData?.locationMap?.lat}
                                lng={clubData?.locationMap?.lng}
                                address1={clubData?.locationText?.address1}
                                address2={clubData?.locationText?.address2}
                                city={clubData?.locationText?.city}
                                state={clubData?.locationText?.state}
                                pincode={clubData?.locationText?.pincode}
                            />
                        </div>
                    </div>
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Facilities Section */}
                <div className="w-full" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
                    <div className="flex flex-col items-center self-stretch">
                        <div className="flex items-center gap-2.5 self-stretch mb-[16px]">
                            <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">Facilities</span>
                        </div>

                        {clubData?.facilities && clubData.facilities.length > 0 ? (
                            <div className="flex flex-col justify-end gap-3.5 self-stretch bg-[rgba(40,60,61,0.3)] pl-5 pr-[22px] pt-3 pb-[18px] rounded-[17px]">
                                {clubData.facilities.map((facility: string, idx: number) => (
                                    <TagComponent key={idx} label={facility} />
                                ))}
                            </div>
                        ) : (
                            <div className="w-full bg-[rgba(40,60,61,0.3)] rounded-[15px] p-4 flex items-center justify-center h-[100px]">
                                <span className="text-white/50 text-xs">No facilities available</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Food Section */}
                <div className="w-full" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
                    <div className="flex flex-col items-center self-stretch">
                        <div className="flex items-center gap-2.5 self-stretch mb-[16px]">
                            <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">Food</span>
                        </div>

                        {clubData?.foodCuisines && clubData.foodCuisines.length > 0 ? (
                            <div className="flex flex-col gap-3.5 self-stretch bg-[rgba(40,60,61,0.3)] pl-[21px] pr-3.5 pt-3 pb-3 rounded-[17px]">
                                {clubData.foodCuisines.map((cuisine: string, idx: number) => (
                                    <TagComponent key={idx} label={cuisine} />
                                ))}
                            </div>
                        ) : (
                            <div className="w-full bg-[rgba(40,60,61,0.3)] rounded-[15px] p-4 flex items-center justify-center h-[100px]">
                                <span className="text-white/50 text-xs">No food options available</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Music Section */}
                <div className="w-full" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
                    <div className="flex flex-col items-center self-stretch">
                        <div className="flex items-center gap-2.5 self-stretch mb-[16px]">
                            <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">Music</span>
                        </div>

                        {clubData?.music && clubData.music.length > 0 ? (
                            <div className="flex flex-col gap-3.5 self-stretch bg-[rgba(40,60,61,0.3)] pl-[21px] pr-[22px] pt-3 pb-3 rounded-[17px]">
                                {clubData.music.map((genre: string, idx: number) => (
                                    <TagComponent key={idx} label={genre} />
                                ))}
                            </div>
                        ) : (
                            <div className="w-full bg-[rgba(40,60,61,0.3)] rounded-[15px] p-4 flex items-center justify-center h-[100px]">
                                <span className="text-white/50 text-xs">No music genres available</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Bar Section */}
                <div className="w-full" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
                    <div className="flex flex-col items-center self-stretch">
                        <div className="flex items-center gap-2.5 self-stretch mb-[16px]">
                            <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">Bar</span>
                        </div>

                        {clubData?.barOptions && clubData.barOptions.length > 0 ? (
                            <div className="flex flex-col gap-3.5 self-stretch bg-[rgba(40,60,61,0.3)] pl-[21px] pr-[22px] pt-3 pb-3 rounded-[17px]">
                                {clubData.barOptions.map((option: string, idx: number) => (
                                    <TagComponent key={idx} label={option} />
                                ))}
                            </div>
                        ) : (
                            <div className="w-full bg-[rgba(40,60,61,0.3)] rounded-[15px] p-4 flex items-center justify-center h-[100px]">
                                <span className="text-white/50 text-xs">No bar options available</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Entry Pricing Section */}
                <div className="w-full" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
                    <div className="flex flex-col items-center self-stretch">
                        <div className="flex items-center gap-2.5 self-stretch mb-[16px]">
                            <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">Entry Pricing</span>
                        </div>

                        <div className="w-full bg-[rgba(40,60,61,0.3)] rounded-[15px] p-4 flex flex-col gap-3">
                            {clubData?.entryPricing && Object.values(clubData.entryPricing).some(Boolean) ? (
                                <>
                                    {clubData.entryPricing.coupleEntryPrice && (
                                        <p className="text-white/80 text-xs">💑 Couple Entry: Rs {clubData.entryPricing.coupleEntryPrice}</p>
                                    )}
                                    {clubData.entryPricing.groupEntryPrice && (
                                        <p className="text-white/80 text-xs">👥 Group Entry: Rs {clubData.entryPricing.groupEntryPrice}</p>
                                    )}
                                    {clubData.entryPricing.maleStagEntryPrice && (
                                        <p className="text-white/80 text-xs">👨 Male Stag: Rs {clubData.entryPricing.maleStagEntryPrice}</p>
                                    )}
                                    {clubData.entryPricing.femaleStagEntryPrice && (
                                        <p className="text-white/80 text-xs">👩 Female Stag: Rs {clubData.entryPricing.femaleStagEntryPrice}</p>
                                    )}
                                    {clubData.entryPricing.coverCharge && (
                                        <p className="text-white/80 text-xs">🎫 Cover Charge: Rs {clubData.entryPricing.coverCharge}</p>
                                    )}
                                    {clubData.entryPricing.redeemDetails && (
                                        <p className="text-white/80 text-xs">📝 Redeem: {clubData.entryPricing.redeemDetails}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-white/60 text-xs">No entry pricing set</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Separator Line */}
                <div className="flex justify-center my-4">
                    <div className="w-5/6 h-[0.5px] bg-gradient-to-r from-transparent via-[#71F8FF] to-transparent"></div>
                </div>

                {/* Other Images Section */}
                {clubData?.images && clubData.images.filter((img: any) => typeof img === 'string' || img?.type !== 'MAIN_IMAGE').length > 0 && (
                    <div className="w-full" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
                        <div className="flex flex-col items-center self-stretch">
                            <div className="flex items-center gap-2.5 self-stretch mb-[16px]">
                                <span className="font-semibold text-[16px] leading-[16px] text-[#fffeff]">Other Images</span>
                            </div>

                            <div className="w-full bg-[rgba(40,60,61,0.3)] rounded-[15px] p-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {clubData.images
                                        .filter((img: any) => typeof img === 'string' || img?.type !== 'MAIN_IMAGE')
                                        .map((img: any, idx: number) => (
                                            <div key={`other-img-${idx}`} className="relative overflow-hidden rounded-[10px]">
                                                <img
                                                    src={typeof img === 'string' ? img : img?.url}
                                                    alt={`Image ${idx + 1}`}
                                                    className="w-full h-[140px] object-cover hover:scale-105 transition-transform duration-300"
                                                    onError={(e) => {
                                                        console.error('❌ Image failed to load:', img);
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        ))}
                                </div>
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

            {/* Vibe Rating Modal */}
            <Dialog open={showVibeModal} onOpenChange={setShowVibeModal}>
                <DialogOverlay />
                <DialogContent className="bg-[#021313] border border-[#14FFEC]/50">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-white text-lg font-semibold">Vibe Rating</h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-center">
                                <div className="w-24 h-24 bg-[#005d5c] rounded-full flex items-center justify-center border-4 border-[#14FFEC]">
                                    <span className="font-bold text-5xl text-[#14FFEC]">
                                        {clubData?.rating || clubData?.avgRating || 4.2}
                                    </span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-white/80 text-sm mb-2">Club Rating</p>
                                <p className="text-white text-base font-semibold">{clubData?.name}</p>
                            </div>
                            <div className="bg-[rgba(40,60,61,0.30)] rounded-lg p-4 space-y-2">
                                {clubData?.reviewCount && (
                                    <p className="text-white/80 text-xs">📊 Reviews: {clubData.reviewCount}</p>
                                )}
                                {clubData?.rating && (
                                    <p className="text-white/80 text-xs">⭐ Rating: {clubData.rating}/5</p>
                                )}
                                {clubData?.category && (
                                    <p className="text-white/80 text-xs">🏷️ Category: {clubData.category}</p>
                                )}
                                {clubData?.maxMembers && (
                                    <p className="text-white/80 text-xs">👥 Capacity: {clubData.maxMembers} members</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowVibeModal(false)}
                            className="w-full px-4 py-2 bg-[#14FFEC] text-[#021313] rounded-lg hover:bg-[#14FFEC]/90 font-semibold"
                        >
                            Close
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogOverlay />
                <DialogContent className="bg-[#021313] border border-[#14FFEC]/50">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-white text-lg font-semibold">Delete Club</h2>
                        <p className="text-white/80 text-sm">Are you sure you want to delete this club? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="flex-1 px-4 py-2 bg-[rgba(40,60,61,0.30)] text-white rounded-lg hover:bg-[rgba(40,60,61,0.50)]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteClub}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function ClubPreviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#021313] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#14FFEC] animate-spin" /></div>}>
            <ClubPreviewContent />
        </Suspense>
    );
}



