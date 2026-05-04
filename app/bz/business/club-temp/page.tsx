'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Clock,
    Calendar,
    Wine,
    Sparkles,
    Users,
    Car,
    Wifi,
    ShieldCheck,
    Utensils,
    Music,
    Camera,
    ChevronLeft,
    ChevronRight,
    Star,
    Play,
    Pause,
    Heart,
    MapPin,
} from 'lucide-react'; import { useToast } from '@/hooks/use-toast';

// Types
interface VenueInfo {
    name: string;
    address: string;
    rating: number;
}

interface OfferCard {
    title: string;
    isActive?: boolean;
}

interface EntryTab {
    label: string;
    price: string;
    cover: string;
    isActive?: boolean;
}

interface EventCard {
    id: number;
    title: string;
    venue: string;
    date: string;
    month: string;
    category: string;
    image: string;
}

interface FacilityChip {
    icon: string;
    label: string;
}

interface AmenitySection {
    title: string;
    items: string[];
}

interface ReviewCard {
    name: string;
    initial: string;
    rating: number;
    comment: string;
    timeAgo: string;
}

// Data
const venueInfo: VenueInfo = {
    name: 'DABO CLUB & KITCHEN',
    address: 'House 1913/B/1, Yogesham CHS, Wardha Road, Nagpur',
    rating: 4.2,
};

const offers: OfferCard[] = [
    { title: 'Buy 1 get 1 on IFML Drinks', isActive: true },
    { title: 'Free Entry for all before 09:00 PM', isActive: true },
];

const entryTabs: EntryTab[] = [
    { label: 'Couple & Group\\nEntry', price: 'Rs 1500 (Cover - 1000)', cover: 'Redeem cover before 12:00 AM', isActive: true },
    { label: 'Male stag\\n Entry', price: '', cover: '', isActive: false },
    { label: 'Female stag\\n Entry', price: '', cover: '', isActive: false },
];

const upcomingEvents: EventCard[] = [
    {
        id: 1,
        title: 'Freaky Friday \nwith DJ Alexxx',
        venue: 'DABO , Airport Road',
        date: '04',
        month: 'APR',
        category: 'Techno & Bollytech',
        image: '/event list/Rectangle 12249.jpg',
    },
    {
        id: 2,
        title: 'Wow Wednesday \nwith DJ Shade',
        venue: 'DABO , Airport Road',
        date: '04',
        month: 'APR',
        category: 'Bollywood & Bollytech',
        image: '/event list/Rectangle 1.jpg',
    },
];

const facilities: FacilityChip[] = [
    { icon: '🕐', label: 'Open till midnight' },
    { icon: '♿', label: 'Disabled Access' },
    { icon: '🚗', label: 'Car Parking' },
    { icon: '🏠', label: 'Private dining space' },
    { icon: '🪑', label: 'Indoor Seating' },
    { icon: '📋', label: 'Table booking' },
];

const amenities: AmenitySection[] = [
    {
        title: 'Food',
        items: ['Gluten free options', 'Bar Snacks', 'Asian', 'Continental', 'North Indian'],
    },
    {
        title: 'Music',
        items: ['DJ Martin live set', 'Techno & Bollytech', 'Karaoke afterhours'],
    },
    {
        title: 'Bar',
        items: ['Craft beers', 'Wine cellar', 'Cocktails', 'Premium spirits'],
    },
];

const reviews: ReviewCard[] = [
    {
        name: 'Anjali Sharma',
        initial: 'A',
        rating: 5,
        comment: 'Loved the energy! The lighting, music, and service were all on point. Highly recommend booking a table in advance.',
        timeAgo: '2 days ago',
    },
    {
        name: 'Rahul Verma',
        initial: 'R',
        rating: 4,
        comment: 'Great vibe and crowd. Drinks menu is extensive and the DJ kept everyone on the floor all night.',
        timeAgo: '1 week ago',
    },
];

const heroImages = [
    '/dabo ambience main dabo page/Media.jpg',
    '/dabo ambience main dabo page/Media-1.jpg',
    '/dabo ambience main dabo page/Media-2.jpg',
    '/dabo ambience main dabo page/Media-3.jpg',
];

// Tag Component for reusability
const TagComponent = ({ icon, label, iconPath }: { icon?: React.ReactNode, label: string, iconPath?: string }) => (
    <div className="px-3 py-2 bg-[rgba(40,60,61,0.30)] rounded-full flex items-center gap-2">
        {iconPath && <img src={iconPath} alt={label} className="w-4 h-4" />}
        {icon && icon}
        <span className="text-white text-xs">{label}</span>
    </div>
);

export default function ClubDaboPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLiked, setIsLiked] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [nowPlaying, setNowPlaying] = useState({
        title: "Timeless Tuesday with DJ Xpensive",
        genres: ["Bolly tech", "Progressive tech"]
    });

    const handleGoBack = () => {
        router.back();
    };

    const handleShare = async () => {
        try {
            if (navigator?.share) {
                await navigator.share({
                    title: 'DABO Club & Kitchen',
                    text: 'Check out this amazing club!',
                    url: window.location.href,
                });
                return;
            }

            await navigator.clipboard?.writeText(window.location.href);
            toast({
                title: 'Link copied',
                description: 'Club link copied to your clipboard.',
            });
        } catch (error) {
            console.error('Share failed', error);
        }
    };

    const handleToggleLike = () => {
        setIsLiked((prev) => !prev);
        toast({
            title: isLiked ? 'Removed from favorites' : 'Added to favorites',
            description: isLiked ? 'Club removed from your favorites' : 'Club added to your favorites',
        });
    };

    const handleLike = () => {
        toast({
            title: 'Thanks for the feedback!',
            description: 'You liked this club',
        });
    };

    const handleDislike = () => {
        toast({
            title: 'Thanks for the feedback!',
            description: 'You disliked this club',
        });
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    };

    return (
        <div className="min-h-screen bg-[#021313] relative w-full max-w-[430px] mx-auto">
            {/* Hero Image Carousel */}
            <div className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 flex">
                    {heroImages.map((image, index) => (
                        <img
                            key={index}
                            className="min-w-full h-full object-cover transition-transform duration-300"
                            src={image}
                            alt={`Hero ${index + 1}`}
                            style={{
                                transform: `translateX(${(index - currentImageIndex) * 100}%)`,
                            }}
                        />
                    ))}
                </div>

                {/* Navigation arrows */}
                <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 flex justify-between items-center w-[calc(100%-28px)]">
                    <button
                        onClick={prevImage}
                        className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center"
                    >
                        <ChevronLeft className="w-4 h-4 text-black" />
                    </button>
                    <button
                        onClick={nextImage}
                        className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center"
                    >
                        <ChevronRight className="w-4 h-4 text-black" />
                    </button>
                </div>

                {/* Back button */}
                <button
                    onClick={handleGoBack}
                    className="absolute left-4 top-12 w-[35px] h-[35px] bg-white/20 rounded-[18px] flex items-center justify-center"
                >
                    <ArrowLeft className="h-5 w-5 text-white" />
                </button>
            </div>

            {/* Profile picture - positioned exactly at the border */}
            <div className="absolute left-1/2 transform -translate-x-1/2 z-20" style={{ top: 'calc(35vh - 42.5px)' }}>
                {/* Profile Picture */}
                <div className="w-[85px] h-[85px] rounded-full border-4 border-[#08C2B3] overflow-hidden shadow-xl">
                    <img
                        src="/dabo ambience main dabo page/Media.jpg"
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
                {/* Fixed positioning container for title and buttons */}
                <div className="flex flex-col items-center w-full" style={{ paddingTop: 'calc(6vh + 30px)' }}>
                    {/* Title */}
                    <h1 className="text-white text-[36px] tracking-[0.36px] text-center font-normal leading-[35px] mb-3" style={{ fontFamily: "'Anton', sans-serif" }}>
                        {venueInfo.name}
                    </h1>

                    {/* Social buttons and Action buttons */}
                    <div className="w-full flex flex-col items-center gap-3 mb-4">
                        <div className="flex justify-center items-center gap-3">
                            <div
                                className="transition-transform hover:scale-110 active:scale-95 w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: "radial-gradient(ellipse 122.14% 367.06% at 47.50% 51.28%, #01756C 0%, #08C2B3 100%)" }}
                                onClick={handleLike}
                                role="button"
                                tabIndex={0}
                            >
                                <img src="/club/ThumbsUp (1).svg" alt="Like" className="w-5 h-5" />
                            </div>
                            <div
                                className="transition-transform hover:scale-110 active:scale-95 w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: "radial-gradient(ellipse 122.14% 367.06% at 47.50% 51.28%, #01756C 0%, #08C2B3 100%)" }}
                                onClick={handleDislike}
                                role="button"
                                tabIndex={0}
                            >
                                <img src="/club/ThumbsDown (1).svg" alt="Dislike" className="w-5 h-5" />
                            </div>
                            <div
                                className="transition-transform hover:scale-110 active:scale-95 w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: "radial-gradient(ellipse 122.14% 367.06% at 47.50% 51.28%, #01756C 0%, #08C2B3 100%)" }}
                                onClick={handleShare}
                                role="button"
                                tabIndex={0}
                            >
                                <img src="/club/ShareNetwork (1).svg" alt="Share" className="w-5 h-5" />
                            </div>
                            <div
                                className="transition-transform hover:scale-110 active:scale-95 w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: "radial-gradient(ellipse 122.14% 367.06% at 47.50% 51.28%, #01756C 0%, #08C2B3 100%)" }}
                                onClick={handleToggleLike}
                                role="button"
                                tabIndex={0}
                            >
                                <img src="/club/BookmarkSimple (1).svg" alt="Bookmark" className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="w-full flex justify-center items-center gap-3">
                            <Link
                                href="/booking/form"
                                className="transition-all hover:brightness-110 hover:shadow-lg active:brightness-90 active:scale-95 px-5 py-3 rounded-full flex items-center justify-center text-white text-sm font-bold tracking-wide"
                                style={{ background: "radial-gradient(ellipse 122.14% 367.06% at 47.50% 51.28%, #01756C 0%, #08C2B3 100%)", minWidth: "160px" }}
                            >
                                Reserve your spot
                            </Link>
                            <Link
                                href="/booking/form"
                                className="transition-all hover:brightness-110 hover:shadow-lg active:brightness-90 active:scale-95 px-5 py-3 rounded-full flex items-center justify-center text-white text-sm font-bold tracking-wide"
                                style={{ background: "radial-gradient(ellipse 122.14% 367.06% at 47.50% 51.28%, #01756C 0%, #08C2B3 100%)", minWidth: "120px" }}
                            >
                                Book offline
                            </Link>
                        </div>
                    </div>

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
                                        <div className="px-[8px] py-[2px] bg-[#202B2B99] rounded-full border border-[#28D2DB] flex items-center gap-[3px]">
                                            <span className="text-white text-[10px]">Chill House Mix</span>
                                            <div className="w-[4px] h-[4px] bg-[#C50000] rounded-full"></div>
                                        </div>

                                        <div className="px-[8px] py-[2px] bg-[#202B2B99] rounded-full border border-[#28D2DB] flex items-center gap-[3px]">
                                            <span className="text-white text-[10px]">Techno Vibes</span>
                                            <div className="w-[4px] h-[4px] bg-[#C50000] rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Today's Offers */}
                        <div className="flex flex-col gap-[8px] mt-4">
                            <h3 className="text-[#FFFEFF] text-lg font-semibold mb-1 px-1">Today's Offers</h3>

                            <div className="bg-[rgba(31.93,42.75,43.32,0.60)] rounded-[15px] overflow-hidden p-3">
                                <div className="bg-[#263438] rounded-[10px] border border-dashed border-[#14FFEC] p-2 flex items-center justify-between mb-3">
                                    <div className="text-white text-[14px] font-[700]">
                                        Buy 1 get 1 on IFML Drinks
                                    </div>
                                    <div className="w-[30px] h-[30px] opacity-35">
                                        <img
                                            src="/common/discount.png"
                                            alt="Discount"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="bg-[#263438] rounded-[10px] border border-dashed border-[#14FFEC] p-2 flex items-center justify-between">
                                    <div className="text-white text-[14px] font-[700]">
                                        Free Entry for all before 09:00 PM
                                    </div>
                                    <div className="w-[30px] h-[30px] opacity-35">
                                        <img
                                            src="/common/discount.png"
                                            alt="Discount"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Entry/Booking */}
                        <div className="flex flex-col gap-[8px] mt-3">
                            <h3 className="text-[#FFFEFF] text-lg font-semibold mb-1 px-1">Entry/Booking</h3>

                            <div className="relative bg-[rgba(31.93,42.75,43.32,0.60)] rounded-[15px] overflow-hidden">
                                <div className="bg-[#263438] rounded-[15px] p-3 pb-5">
                                    {/* Tabs Row */}
                                    <div className="flex w-full border-b border-gray-700">
                                        {/* Tab 1 - Couple & Group Entry */}
                                        <div className="flex-1 text-center pb-2 relative">
                                            <div className="text-white text-[12px] font-[600]">
                                                Couple & Group<br />Entry
                                            </div>
                                            <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-[#14FFEC] rounded-t-[4px]"></div>
                                        </div>

                                        {/* Tab 2 - Male stag Entry */}
                                        <div className="flex-1 text-center pb-2">
                                            <div className="text-white text-[12px] font-[600] opacity-70">
                                                Male stag<br />Entry
                                            </div>
                                        </div>

                                        {/* Tab 3 - Female stag Entry */}
                                        <div className="flex-1 text-center pb-2">
                                            <div className="text-white text-[12px] font-[600] opacity-70">
                                                Female stag<br />Entry
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Row */}
                                    <div className="pt-4 pb-2 relative">
                                        {/* Price & Cover */}
                                        <div className="text-center">
                                            <div className="text-[#14FFEC] text-[15px] font-[500] mb-1">
                                                Rs 1500 (Cover - 1000)
                                            </div>
                                            <div className="text-[#D9D9D9] text-[12px] font-[500]">
                                                Redeem cover before 12:00 AM
                                            </div>
                                        </div>

                                        {/* Right Arrow Button */}
                                        <div className="absolute right-[8px] bottom-0 w-[30px] h-[30px] bg-[#0D7377] rounded-full flex items-center justify-center">
                                            <ChevronRight className="w-5 h-5 text-[#14FFEC]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Events in Dabo */}
                    <div className="w-full mt-5 mb-5">
                        <h3 className="text-[#FFFEFF] text-xl font-semibold mb-4">Events in Dabo</h3>
                        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                            {upcomingEvents.map((event) => (
                                <Link
                                    href="/event/timeless-tuesday"
                                    key={event.id}
                                    className="min-w-[222px] h-[320px] relative flex-shrink-0 cursor-pointer"
                                >
                                    <div className="w-full h-full bg-gradient-radial from-black at-22% to-[#014A4B] at-70% rounded-[20px]">
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className="w-full h-[180px] object-cover rounded-t-[20px]"
                                        />

                                        {/* Date badge */}
                                        <div className="absolute right-4 top-0 w-9 h-[45px] px-1 py-1 bg-gradient-to-b from-black to-[#00C0CA] rounded-b-[28px] flex flex-col items-center justify-center text-white text-center font-semibold border-l border-r border-b border-[#CDCDCD]">
                                            <span className="text-[10px] uppercase">{event.month}</span>
                                            <span className="text-base">{event.date}</span>
                                        </div>

                                        {/* Event details */}
                                        <div className="p-4">
                                            <h4 className="text-white text-base font-bold leading-tight mb-1 whitespace-pre-line">
                                                {event.title}
                                            </h4>
                                            <p className="text-[#C3C3C3] text-xs font-medium">
                                                {event.venue}
                                            </p>
                                        </div>

                                        {/* Heart icon */}
                                        <button
                                            className="absolute right-4 bottom-16 w-6 h-6 flex items-center justify-center"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                        >
                                            <Heart className="w-5 h-5 text-[#28D2DB]" />
                                        </button>

                                        {/* Category badge */}
                                        <div className="absolute bottom-0 left-0 w-full h-[34px] bg-gradient-to-r from-[#005F57] to-[#14FFEC] rounded-b-[20px] flex items-center justify-center text-white font-bold text-sm">
                                            {event.category}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Photos Section */}
                    <div className="w-full">
                        <h3 className="text-white text-base font-semibold mb-4">Photos</h3>
                        <div className="w-full bg-[rgba(40,60,61,0.30)] rounded-[15px] p-4 flex flex-wrap gap-2 justify-center">
                            <div className="w-[48%] h-44 bg-gray-700 rounded-[15px]">
                                <img src="/dabo ambience main dabo page/Media.jpg" alt="Gallery 1" className="w-full h-full object-cover rounded-[15px]" />
                            </div>
                            <div className="w-[48%] h-44 bg-gray-700 rounded-[15px]">
                                <img src="/dabo ambience main dabo page/Media-1.jpg" alt="Gallery 2" className="w-full h-full object-cover rounded-[15px]" />
                            </div>
                            <div className="w-[31%] h-28 bg-gray-700 rounded-[15px]">
                                <img src="/dabo ambience main dabo page/Media-2.jpg" alt="Gallery 3" className="w-full h-full object-cover rounded-[15px]" />
                            </div>
                            <div className="w-[31%] h-28 bg-gray-700 rounded-[15px]">
                                <img src="/dabo ambience main dabo page/Media-3.jpg" alt="Gallery 4" className="w-full h-full object-cover rounded-[15px]" />
                            </div>
                            <div className="w-[31%] h-28 bg-gray-700 rounded-[15px] relative">
                                <img src="/dabo ambience main dabo page/Media.jpg" alt="Gallery 5" className="w-full h-full object-cover rounded-[15px] opacity-60" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[15px]">
                                    <span className="text-white text-xl font-bold">+7</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="w-full mt-5 mb-5">
                        <h3 className="text-white text-xl font-semibold mb-4">Location</h3>
                        <div className="w-full bg-[rgba(40,60,61,0.30)] rounded-[20px] p-4">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-[#FF3B3B]/20 flex items-center justify-center mt-1">
                                    <MapPin className="w-5 h-5 text-[#FF3B3B] flex-shrink-0" />
                                </div>
                                <p className="text-white text-sm">{venueInfo.address}</p>
                            </div>
                            <div className="w-full h-[150px] rounded-[15px] overflow-hidden">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d59398.187240769305!2d78.96056867424174!3d21.14914597223921!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd4c0a5a31faf13%3A0x19b37d06d0bb3e2b!2sNagpur%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1698233719734!5m2!1sen!2sin"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Club Location"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Facilities Section */}
                    <div className="w-full mt-5 mb-5">
                        <h3 className="text-white text-xl font-semibold mb-4">Facilities</h3>
                        <div className="grid grid-cols-2 gap-2 bg-[rgba(40,60,61,0.30)] rounded-[15px] p-3">
                            <TagComponent
                                iconPath="/club/facilities/Clock (1).svg"
                                label="Open till midnight"
                            />
                            <TagComponent
                                iconPath="/club/facilities/Wheelchair.svg"
                                label="Disabled Access"
                            />
                            <TagComponent
                                iconPath="/club/facilities/LetterCircleP.svg"
                                label="Car Parking"
                            />
                            <TagComponent
                                iconPath="/club/facilities/ForkKnife.svg"
                                label="Private dining space"
                            />
                            <TagComponent
                                iconPath="/club/facilities/Armchair.svg"
                                label="Indoor Seating"
                            />
                            <TagComponent
                                iconPath="/club/facilities/PicnicTable.svg"
                                label="Table booking"
                            />
                        </div>
                    </div>

                    {/* Food Section */}
                    <div className="w-full mt-5 mb-5">
                        <h3 className="text-white text-xl font-semibold mb-4">Food</h3>
                        <div className="flex flex-wrap gap-2 bg-[rgba(40,60,61,0.30)] rounded-[15px] p-3">
                            <TagComponent
                                iconPath="/club/food/BowlFood (1).svg"
                                label="Gluten free options"
                            />
                            <TagComponent
                                iconPath="/club/food/Popcorn (1).svg"
                                label="Bar Snacks"
                            />
                            <TagComponent
                                iconPath="/club/food/FishSimple.svg"
                                label="Asian"
                            />
                            <TagComponent
                                iconPath="/club/food/Pizza (1).svg"
                                label="Italian"
                            />
                            <TagComponent
                                iconPath="/club/food/BowlFood (1).svg"
                                label="Continental"
                            />
                            <TagComponent
                                iconPath="/club/food/CookingPot (1).svg"
                                label="North Indian"
                            />
                            <TagComponent
                                iconPath="/club/food/Hamburger (1).svg"
                                label="Burgers & Sandwich"
                            />
                        </div>
                    </div>

                    {/* Music Section */}
                    <div className="w-full mt-5 mb-5">
                        <h3 className="text-white text-xl font-semibold mb-4">Music</h3>
                        <div className="flex flex-wrap gap-2 bg-[rgba(40,60,61,0.30)] rounded-[15px] p-3">
                            <TagComponent
                                iconPath="/club/music/MicrophoneStage.svg"
                                label="Karaoke"
                            />
                            <TagComponent
                                iconPath="/club/music/Equalizer.svg"
                                label="DJs"
                            />
                            <TagComponent
                                iconPath="/club/music/Guitar.svg"
                                label="Live Music"
                            />
                        </div>
                    </div>

                    {/* Bar Section */}
                    <div className="w-full mt-5 mb-5">
                        <h3 className="text-white text-xl font-semibold mb-4">Bar</h3>
                        <div className="flex flex-wrap gap-2 bg-[rgba(40,60,61,0.30)] rounded-[15px] p-3">
                            <TagComponent
                                iconPath="/club/bar/Brandy (1).svg"
                                label="Spirits"
                            />
                            <TagComponent
                                iconPath="/club/bar/Wine (1).svg"
                                label="Wine"
                            />
                            <TagComponent
                                iconPath="/club/bar/BeerStein (1).svg"
                                label="Draught"
                            />
                            <TagComponent
                                iconPath="/club/bar/Martini (1).svg"
                                label="Cocktail"
                            />
                            <TagComponent
                                iconPath="/club/bar/PintGlass (1).svg"
                                label="Non Alcoholic"
                            />
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="w-full mt-5 mb-3 flex justify-between items-center">
                        <h3 className="text-white text-xl font-semibold">Reviews</h3>
                        <Link href="/review" className="text-[#14FFEC] text-sm font-semibold">
                            View All
                        </Link>
                    </div>

                    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
                        <div className="flex gap-4">
                            <div className="min-w-[300px] bg-[rgba(40,60,61,0.30)] rounded-[15px] p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <img
                                        src="/vibemeter/Screenshot_2025-05-16_192139-removebg-preview.png"
                                        alt="Anjali Sharma"
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h4 className="text-white text-base font-medium">Anjali Sharma</h4>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[#14FFEC] text-sm font-medium">4.5</span>
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={`${i < 4 ? 'text-[#14FFEC] fill-[#14FFEC]' :
                                                            i === 4 ? 'text-[#14FFEC]' : 'text-gray-600'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <span className="text-white/70 text-sm">25/07/2024</span>
                                    </div>
                                </div>
                                <p className="text-white/80 text-sm leading-relaxed mb-2">
                                    I recently ate at Dabo and had a great time. The food tasted good, and Rakesh's suggestions were perfect. The service was excellent. I'm very happy with my visit. Decor and interiors can be improved a bit.
                                </p>
                                <div className="text-right">
                                    <span className="text-white/50 text-xs">3 Days ago</span>
                                </div>
                            </div>

                            <div className="min-w-[300px] bg-[rgba(40,60,61,0.30)] rounded-[15px] p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <img
                                        src="/vibemeter/Screenshot_2025-05-16_193232-removebg-preview.png"
                                        alt="Ankit Trivedi"
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h4 className="text-white text-base font-medium">Ankit Trivedi</h4>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[#14FFEC] text-sm font-medium">4.5</span>
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={`${i < 4 ? 'text-[#14FFEC] fill-[#14FFEC]' :
                                                            i === 4 ? 'text-[#14FFEC]' : 'text-gray-600'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <span className="text-white/70 text-sm">02/07/2024</span>
                                    </div>
                                </div>
                                <p className="text-white/80 text-sm leading-relaxed mb-2">
                                    Generally any pub strikes one of the two cords, ambiance or tasty food. The food here is simply amazing and combine it with the perfect and soothing ambiance you will have a time of your life.
                                </p>
                                <div className="text-right">
                                    <span className="text-white/50 text-xs">6 Days ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}