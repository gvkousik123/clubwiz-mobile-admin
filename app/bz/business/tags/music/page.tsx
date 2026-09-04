"use client";

// Prevent SSR pre-render; this page relies on client-only hooks (useSearchParams)
// and must bail out to client rendering. See: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LookupService } from '@/lib/services/lookup.service';
import { useToast } from '@/hooks/use-toast';
import { MusicGenreAutocomplete, MusicGenre } from '@/components/ui/music-genre-autocomplete';

export default function MusicGenresPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [musicGenres, setMusicGenres] = useState<MusicGenre[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<MusicGenre[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load existing selections from localStorage
    useEffect(() => {
        const loadExistingSelections = () => {
            try {
                const savedGenres = localStorage.getItem('clubviz-selected-music-genres');
                if (savedGenres) {
                    const genres = JSON.parse(savedGenres);
                    setSelectedGenres(genres);
                    console.log('📱 Loaded Selected Music Genres:', genres);
                }
            } catch (error) {
                console.error('Failed to load selected music genres:', error);
            }
        };

        loadExistingSelections();
    }, []);

    // Fetch music genres on mount
    useEffect(() => {
        const fetchMusicGenres = async () => {
            try {
                setIsLoading(true);
                const response = await LookupService.getMusicOptions();
                if (response.success && response.data) {
                    setMusicGenres(response.data);
                } else {
                    console.log('No music genres from API, using predefined list');
                    setMusicGenres([]);
                }
            } catch (error) {
                console.error('Failed to fetch music genres:', error);
                toast({
                    title: "Error",
                    description: "Failed to load music genres",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchMusicGenres();
    }, [toast]);

    const handleGoBack = () => {
        router.back();
    };

    const handleSelectionChange = (genres: MusicGenre[]) => {
        setSelectedGenres(genres);

        // Save to localStorage
        try {
            localStorage.setItem('clubviz-selected-music-genres', JSON.stringify(genres));
            console.log('💾 Saved Selected Music Genres:', genres);
        } catch (error) {
            console.error('Failed to save selected music genres:', error);
        }
    };

    const handleSave = () => {
        // Save final selection and go back
        try {
            localStorage.setItem('clubviz-selected-music-genres', JSON.stringify(selectedGenres));
            toast({
                title: "Success",
                description: `${selectedGenres.length} music genre(s) selected`,
                variant: "default",
            });

            // Navigate back to club creation
            router.back();
        } catch (error) {
            console.error('Failed to save music genres:', error);
            toast({
                title: "Error",
                description: "Failed to save music genres",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="w-full min-h-screen bg-black text-white">
            {/* Header */}
            <div className="w-full bg-[#0D1F1F] p-4 flex items-center justify-between border-b border-[#0C898B]">
                <button
                    onClick={handleGoBack}
                    className="flex items-center gap-2 text-[#14FFEC] font-medium"
                >
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>
                <h1 className="text-lg font-semibold">Music Genres</h1>
                <div className="w-16"></div> {/* Spacer for center alignment */}
            </div>

            {/* Content */}
            <div className="flex flex-col px-6 py-6 gap-6">
                {/* Instructions */}
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Select Music Genres</h2>
                    <p className="text-gray-400 text-sm">
                        Choose the music genres that best represent your club.
                        Start typing to see suggestions like "hip hop", "house", "techno", etc.
                    </p>
                </div>

                {/* Music Genre Autocomplete */}
                <div className="w-full">
                    <div className="mb-4">
                        <label className="text-[#14FFEC] font-semibold text-base block mb-3">
                            Music Genres
                        </label>
                        <MusicGenreAutocomplete
                            musicGenres={musicGenres}
                            selectedGenres={selectedGenres}
                            onSelectionChange={handleSelectionChange}
                            placeholder="Type to search genres (e.g., hip hop, house, techno)..."
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Selection Summary */}
                    {selectedGenres.length > 0 && (
                        <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#0C898B]">
                            <h3 className="text-[#14FFEC] font-semibold text-sm mb-2">
                                Selected Genres ({selectedGenres.length})
                            </h3>
                            <p className="text-white text-sm">
                                {selectedGenres.map(genre => genre.label).join(', ')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Quick Selection Hints */}
                <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#0C898B]/30">
                    <h3 className="text-[#14FFEC] font-semibold text-sm mb-3">Popular Genres</h3>
                    <p className="text-gray-400 text-xs mb-2">Tap on any genre below or search for more:</p>
                    <div className="flex flex-wrap gap-2">
                        {['Hip Hop', 'House', 'Techno', 'Progressive House', 'Deep House', 'Trance', 'Bollywood', 'Bollytech'].map((genre) => (
                            <button
                                key={genre}
                                onClick={() => {
                                    const genreObj: MusicGenre = {
                                        id: genre.toLowerCase().replace(/\s+/g, '-'),
                                        label: genre,
                                        active: true
                                    };
                                    if (!selectedGenres.some(g => g.id === genreObj.id)) {
                                        handleSelectionChange([...selectedGenres, genreObj]);
                                    }
                                }}
                                disabled={selectedGenres.some(g => g.label === genre)}
                                className="px-3 py-1 text-xs bg-[#14FFEC]/10 border border-[#14FFEC]/30 rounded-full text-[#14FFEC] hover:bg-[#14FFEC]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Save Button */}
            <div className="fixed bottom-0 app-bar z-50">
                <div className="w-full h-[80px] relative bg-[#0D1F1F] shadow-[0px_30px_30px_-40px_#00968A_inset] overflow-hidden rounded-t-[40px] border-t-2 border-[#14FFEC]">
                    <div className="flex justify-center items-center px-8 h-full">
                        <div className="w-[220px] h-[45px] bg-[#0F6861] rounded-[30px] flex justify-center items-center hover:bg-[#0D5451] transition-colors">
                            <button
                                onClick={handleSave}
                                className="w-full h-full flex justify-center items-center cursor-pointer"
                            >
                                <Check className="w-5 h-5 mr-2" />
                                <span className="text-center text-white text-[16px] font-['Manrope'] font-bold tracking-[0.05px]">
                                    Save Genres ({selectedGenres.length})
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
