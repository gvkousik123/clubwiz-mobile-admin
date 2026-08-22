'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, Coffee, Zap, Flame } from 'lucide-react';
import { ClubWizInlineLoader } from '@/components/ui/clubwiz-loader';
import { useToast } from '@/hooks/use-toast';
import { getClubId } from '@/lib/utils/get-club-id';
import { MusicGenreAutocomplete, MusicGenre } from '@/components/ui/music-genre-autocomplete';
import { ClubService } from '@/lib/services/club.service';

export const dynamic = 'force-dynamic';

function LiveMusicContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [clubId, setClubId] = useState<string | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [selectedGenres, setSelectedGenres] = useState<MusicGenre[]>([]);
    const [endTiming, setEndTiming] = useState('');
    const [soundLevel, setSoundLevel] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isEndTimingPassed = (time: string): boolean => {
        if (!time) return false;
        const [hours, minutes] = time.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;

        const now = new Date();
        const endTime = new Date(now);
        endTime.setHours(hours, minutes, 0, 0);

        return now >= endTime;
    };

    const resetLiveMusicState = () => {
        setIsEnabled(false);
        setSelectedGenres([]);
        setEndTiming('');
        setSoundLevel('');
    };

    const expireLiveMusic = async () => {
        resetLiveMusicState();
        if (!clubId) return;
        try {
            await ClubService.updateLiveMusic(clubId, {
                isEnabled: false,
                genres: [],
                endTiming: null,
                soundLevel: null,
            });
        } catch (error) {
            console.error('Failed to auto-disable live music after end time:', error);
        }
    };

    useEffect(() => {
        const cid = getClubId(searchParams);
        if (cid) {
            setClubId(cid);
        } else {
            toast({
                title: 'Error',
                description: 'No club found. Please go back and try again.',
                variant: 'destructive'
            });
            setTimeout(() => router.push('/bz/business'), 1500);
        }
    }, [searchParams, toast, router]);

    // Load Live Music details on mount/clubId change
    useEffect(() => {
        if (!clubId) return;

        const loadLiveMusic = async () => {
            try {
                setIsLoading(true);
                const data = await ClubService.getLiveMusic(clubId);
                if (data) {
                    const endTimingValue = data.endTiming || '';
                    const shouldExpire = endTimingValue && isEndTimingPassed(endTimingValue);

                    if (shouldExpire) {
                        await expireLiveMusic();
                    } else {
                        setIsEnabled(data.isEnabled || false);
                        if (data.genres) {
                            setSelectedGenres(data.genres.map(g => ({
                                id: g.toLowerCase().replace(/\s+/g, '-'),
                                label: g,
                                active: true
                            })));
                        }
                        setEndTiming(endTimingValue);
                        setSoundLevel(data.soundLevel || '');
                    }
                }
            } catch (error) {
                console.error('Failed to load live music configuration:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load existing live music configuration.',
                    variant: 'destructive'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadLiveMusic();
    }, [clubId, toast]);

    // Auto-expire live music when end time passes
    useEffect(() => {
        if (!isEnabled || !endTiming) return;

        // Check immediately on mount
        if (isEndTimingPassed(endTiming)) {
            expireLiveMusic();
            return;
        }

        // Check every 5 seconds for more responsive expiry
        const interval = setInterval(() => {
            if (isEndTimingPassed(endTiming)) {
                expireLiveMusic();
                clearInterval(interval);
            }
        }, 5000);

        // Also check when page comes back into focus (user returns after being away)
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                if (isEndTimingPassed(endTiming)) {
                    await expireLiveMusic();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [clubId, endTiming, isEnabled]);

    const handleGoBack = () => {
        router.back();
    };

    const handleSave = async () => {
        if (!clubId) return;

        // If enabled, validate fields. If disabled, no need to validate details.
        if (isEnabled) {
            if (selectedGenres.length === 0 || !endTiming || !soundLevel) {
                toast({
                    title: 'Validation Error',
                    description: 'Please fill in all live music fields before saving.',
                    variant: 'destructive'
                });
                return;
            }
        }

        setIsSaving(true);

        try {
            await ClubService.updateLiveMusic(clubId, {
                isEnabled,
                genres: isEnabled ? selectedGenres.map(g => g.label) : [],
                endTiming: isEnabled ? endTiming : null,
                soundLevel: isEnabled ? soundLevel : null
            });

            toast({
                title: 'Success',
                description: isEnabled 
                    ? 'Live music enabled and updated successfully!'
                    : 'Live music disabled successfully!',
                className: 'bg-[#14FFEC] text-black border-none'
            });

            setTimeout(() => {
                router.replace('/bz/business');
            }, 1000);
        } catch (error) {
            console.error('Failed to update live music:', error);
            toast({
                title: 'Error',
                description: 'Failed to update live music details. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && clubId) {
        return (
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <ClubWizInlineLoader message="Loading live music..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            {/* Fixed Header with gradient background */}
            <div className="fixed top-0 left-0 right-0 z-30 flex flex-col pt-10 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="absolute top-10 left-6">
                    <button
                        onClick={handleGoBack}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all duration-300"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <h1 className="text-xl font-bold text-white">Live Music</h1>
                    <p className="text-sm text-white/80 mt-1">Manage currently playing music</p>
                </div>
            </div>

            {/* Main Content Card - Positioned below fixed header */}
            <div className="px-0 relative mt-[100px] z-40">
                {/* Main Container with rounded corners */}
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col pt-8 px-6 pb-24">
                    <div className="max-w-xl mx-auto w-full space-y-6">
                        {/* Toggle option */}
                        <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[20px] p-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-semibold text-base">Enable Live Music</h3>
                                <p className="text-gray-400 text-xs mt-1">Broadcast currently playing music at your club</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEnabled(!isEnabled)}
                                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isEnabled ? 'bg-[#14FFEC]' : 'bg-[#14FFEC]/10 border-[#14FFEC]/30'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-lg transition duration-200 ease-in-out ${
                                        isEnabled ? 'translate-x-7 bg-black' : 'translate-x-0 bg-[#14FFEC]'
                                    }`}
                                />
                            </button>
                        </div>

                        {isEnabled && (
                            <div className="space-y-6">
                                {/* Track Tags / Genres */}
                                <div className="space-y-3">
                                    <label className="text-[#14FFEC] font-semibold text-base px-2">
                                        Track Tags / Genres
                                    </label>
                                    <MusicGenreAutocomplete 
                                        musicGenres={[]} 
                                        selectedGenres={selectedGenres} 
                                        onSelectionChange={setSelectedGenres}
                                        placeholder="Search or add genres..." 
                                    />
                                </div>

                                {/* End Timing */}
                                <div className="space-y-3">
                                    <label className="text-[#14FFEC] font-semibold text-base px-2">
                                        End Timing
                                    </label>
                                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5 flex items-center gap-3">
                                        <Clock className="text-[#14FFEC] w-5 h-5 flex-shrink-0" />
                                        <input
                                            type="time"
                                            value={endTiming}
                                            onChange={(e) => setEndTiming(e.target.value)}
                                            className="flex-1 bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                {/* Sound Level Radio Buttons */}
                                <div className="space-y-3">
                                    <label className="text-[#14FFEC] font-semibold text-base px-2">
                                        Sound Level
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { level: 'Chill', icon: Coffee },
                                            { level: 'Vibrant', icon: Zap },
                                            { level: 'Raging', icon: Flame }
                                        ].map(({ level, icon: Icon }) => {
                                            const isSelected = soundLevel === level;
                                            return (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setSoundLevel(level)}
                                                    className={`flex flex-col items-center justify-center p-5 rounded-[20px] border transition-all duration-300 gap-2 cursor-pointer ${
                                                        isSelected 
                                                            ? 'bg-[#14FFEC]/10 border-[#14FFEC] text-white shadow-[0_0_15px_rgba(20,255,236,0.1)]' 
                                                            : 'bg-[#0D1F1F] border-[#0C898B]/30 text-gray-400 hover:border-[#14FFEC]/40 hover:bg-[#0D1F1F]/80'
                                                    }`}
                                                >
                                                    <Icon className={`w-6 h-6 transition-transform duration-300 ${
                                                        isSelected ? 'text-[#14FFEC] scale-110' : 'text-gray-400'
                                                    }`} />
                                                    <span className={`text-sm font-semibold transition-colors duration-300 ${
                                                        isSelected ? 'text-[#14FFEC] font-bold' : 'text-gray-400'
                                                    }`}>
                                                        {level}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full bg-[#14FFEC] text-black py-4 rounded-[15px] font-semibold hover:bg-[#14FFEC]/80 transition-all mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LiveMusicPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <ClubWizInlineLoader message="Loading..." />
            </div>
        }>
            <LiveMusicContent />
        </Suspense>
    );
}
