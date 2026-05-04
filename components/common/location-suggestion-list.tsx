import React from 'react';
import { Loader2, Music, Wine } from 'lucide-react';
import clsx from 'clsx';
import { NearbyResultSummary } from '@/lib/services/search.service';

interface LocationSuggestionListProps {
    suggestions: NearbyResultSummary[];
    onSelect: (suggestion: NearbyResultSummary) => void;
    isLoading?: boolean;
    error?: string | null;
    emptyStateText?: string;
    selectedId?: string | null;
    loadingId?: string | null;
}

const getSuggestionId = (item: NearbyResultSummary): string => {
    return item.id || item.place_id || `${item.lat}-${item.lng}`;
};

const distanceLabel = (suggestion: NearbyResultSummary): string => {
    if (typeof suggestion.distance === 'number') {
        const km = suggestion.distance >= 1000
            ? `${(suggestion.distance / 1000).toFixed(1)} km`
            : `${Math.round(suggestion.distance)} m`;
        return `${km} away`;
    }
    return 'within ~5 km';
};

const truncateDescription = (description: string | undefined, maxChars: number = 50): string => {
    if (!description) return '';
    const text = description.trim();
    if (text.length > maxChars) {
        return text.slice(0, maxChars) + '...';
    }
    return text;
};

const getTypeIcon = (type?: string) => {
    if (type === 'event') {
        return <Music className="h-4 w-4" />;
    }
    // For clubs, use Wine/Cocktail icon
    return <Wine className="h-4 w-4" />;
};

export function LocationSuggestionList({
    suggestions,
    onSelect,
    isLoading = false,
    error,
    emptyStateText = 'No nearby suggestions right now.',
    selectedId,
    loadingId,
}: LocationSuggestionListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-3 py-6 text-white/80">
                <Loader2 className="h-5 w-5 animate-spin text-[#14FFEC]" />
                <span className="text-sm font-semibold tracking-wide">Loading nearby spots...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
            </div>
        );
    }

    if (!suggestions.length) {
        return (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                {emptyStateText}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {suggestions.map((suggestion) => {
                const suggestionId = getSuggestionId(suggestion);
                const isActive = selectedId === suggestionId;
                const isLoadingRow = loadingId === suggestionId;
                return (
                    <button
                        key={suggestionId}
                        className={clsx(
                            'w-full rounded-xl border px-3 py-2 text-left transition-colors',
                            isActive
                                ? 'border-[#14FFEC]/80 bg-[#14FFEC]/10'
                                : 'border-white/10 bg-white/5 hover:border-[#14FFEC]/40 hover:bg-white/10'
                        )}
                        onClick={() => onSelect(suggestion)}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-left min-w-0">
                                <div className="rounded-full bg-[#14FFEC]/15 p-2 text-[#14FFEC] flex-shrink-0">
                                    {getTypeIcon(suggestion.type)}
                                </div>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-sm font-semibold text-white truncate">
                                        {suggestion.name}
                                    </span>
                                    {suggestion.description && (
                                        <span className="text-xs text-white/70 truncate">
                                            {truncateDescription(suggestion.description, 45)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isLoadingRow && (
                                <Loader2 className="h-4 w-4 animate-spin text-[#14FFEC] flex-shrink-0" />
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
