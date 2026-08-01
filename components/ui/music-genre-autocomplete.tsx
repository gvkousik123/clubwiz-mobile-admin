'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Music, X } from 'lucide-react';

export interface MusicGenre {
    id: string;
    label: string;
    icon?: string;
    active: boolean;
}

interface MusicGenreAutocompleteProps {
    musicGenres: MusicGenre[];
    selectedGenres: MusicGenre[];
    onSelectionChange: (genres: MusicGenre[]) => void;
    placeholder?: string;
    isLoading?: boolean;
}

// Predefined music genres for better suggestions
const PREDEFINED_GENRES = [
    'Hip Hop', 'Hardstyle', 'House', 'Techno', 'Progressive House', 'Deep House',
    'Trance', 'Dubstep', 'Electronic', 'Pop', 'Rock', 'Jazz', 'Classical',
    'R&B', 'Reggae', 'Country', 'Blues', 'Folk', 'Indie', 'Alternative',
    'Punk', 'Metal', 'Funk', 'Disco', 'Ambient', 'Drum and Bass',
    'Future Bass', 'Trap', 'Electro', 'Minimal', 'Psytrance', 'Progressive Trance',
    'Bollywood', 'Bollytech'
];

export function MusicGenreAutocomplete({
    musicGenres = [],
    selectedGenres = [],
    onSelectionChange,
    placeholder = "Search music genres...",
    isLoading = false
}: MusicGenreAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Combine API genres with predefined genres, prioritizing API data
    const allGenres = [...musicGenres];
    PREDEFINED_GENRES.forEach(genre => {
        if (!allGenres.some(g => g.label.toLowerCase() === genre.toLowerCase())) {
            allGenres.push({
                id: genre.toLowerCase().replace(/\s+/g, '-'),
                label: genre,
                active: true
            });
        }
    });

    // Filter genres based on search term
    const filteredGenres = allGenres.filter(genre =>
        genre.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedGenres.some(selected => selected.label.toLowerCase() === genre.label.toLowerCase())
    );

    // Handle outside clicks
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex(prev =>
                        prev < filteredGenres.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < filteredGenres.length) {
                        handleSelectGenre(filteredGenres[highlightedIndex]);
                    } else if (searchTerm.trim()) {
                        handleAddCustomGenre(searchTerm.trim());
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    setSearchTerm('');
                    setHighlightedIndex(-1);
                    inputRef.current?.blur();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, highlightedIndex, filteredGenres]);

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setHighlightedIndex(-1);
        setIsOpen(true);
    };

    const handleSelectGenre = (genre: MusicGenre) => {
        const newSelectedGenres = [...selectedGenres, genre];
        onSelectionChange(newSelectedGenres);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const handleRemoveGenre = (genreToRemove: MusicGenre) => {
        const newSelectedGenres = selectedGenres.filter(genre => genre.id !== genreToRemove.id);
        onSelectionChange(newSelectedGenres);
    };

    const handleAddCustomGenre = (label: string) => {
        const customGenre: MusicGenre = {
            id: `custom-${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            label,
            active: true
        };
        const newSelectedGenres = [...selectedGenres, customGenre];
        onSelectionChange(newSelectedGenres);
        setSearchTerm('');
        setHighlightedIndex(-1);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div className="w-full relative" ref={dropdownRef}>
            {/* Selected Genres */}
            {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedGenres.map((genre) => (
                        <div
                            key={genre.id}
                            className="flex items-center gap-2 bg-[#14FFEC] text-black px-3 py-1 rounded-full text-sm font-medium"
                        >
                            <Music className="w-3 h-3" />
                            <span>{genre.label}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveGenre(genre)}
                                className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Field */}
            <div className="relative">
                <div className="w-full bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5 flex items-center gap-3">
                    <Music className="text-[#14FFEC] w-5 h-5 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        className="flex-1 bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                        placeholder={placeholder}
                        autoComplete="off"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(!isOpen);
                            if (!isOpen) {
                                inputRef.current?.focus();
                            }
                        }}
                        className="flex-shrink-0 p-1 hover:bg-[#14FFEC]/10 rounded-full transition-all active:scale-95"
                        aria-label="Toggle dropdown"
                    >
                        <ChevronDown
                            className={`text-[#14FFEC] w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D1F1F] border border-[#0C898B] rounded-[15px] shadow-lg z-50 max-h-60 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#14FFEC]"></div>
                                <span className="text-white text-sm ml-2">Loading genres...</span>
                            </div>
                        ) : filteredGenres.length > 0 ? (
                            <div className="py-2">
                                {filteredGenres.map((genre, index) => (
                                    <button
                                        key={genre.id}
                                        type="button"
                                        onClick={() => handleSelectGenre(genre)}
                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#14FFEC]/10 transition-colors ${index === highlightedIndex ? 'bg-[#14FFEC]/20' : ''
                                            }`}
                                    >
                                        <Music className="text-[#14FFEC] w-4 h-4 flex-shrink-0" />
                                        <span className="text-white font-medium">{genre.label}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-4 px-4 text-center">
                                <p className="text-gray-400">
                                    {searchTerm ? `No genres found for "${searchTerm}"` : 'No genres available'}
                                </p>
                                {searchTerm ? (
                                    <button
                                        type="button"
                                        onClick={() => handleAddCustomGenre(searchTerm.trim())}
                                        className="mt-2 flex items-center gap-2 mx-auto px-4 py-2 bg-[#14FFEC]/10 hover:bg-[#14FFEC]/20 border border-[#14FFEC]/40 rounded-full text-[#14FFEC] text-sm font-medium transition-colors"
                                    >
                                        <Music className="w-3 h-3" />
                                        Add &quot;{searchTerm}&quot; as genre
                                    </button>
                                ) : (
                                    <p className="text-gray-500 text-sm mt-1">
                                        Try searching for: hip hop, house, techno, etc.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}