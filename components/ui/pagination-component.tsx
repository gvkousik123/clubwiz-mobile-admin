import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationComponentProps {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    onNext: () => void;
    onPrevious: () => void;
    isLoading?: boolean;
    itemCount?: number;
    itemsPerPage?: number;
}

/**
 * Pagination component with Next/Previous buttons
 * Shows current page, total pages, and item range
 */
export function PaginationComponent({
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    onNext,
    onPrevious,
    isLoading = false,
    itemCount = 0,
    itemsPerPage = 50,
}: PaginationComponentProps) {
    const startIndex = currentPage * itemsPerPage + 1;
    const endIndex = Math.min((currentPage + 1) * itemsPerPage, itemCount);

    return (
        <div className="flex items-center justify-between gap-4 py-6 px-4 bg-[#041919]/50 rounded-lg border border-[#14FFEC]/20">
            {/* Left: Previous button */}
            <button
                onClick={onPrevious}
                disabled={!hasPrevious || isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    hasPrevious && !isLoading
                        ? 'bg-[#14FFEC] text-black hover:bg-[#14FFEC]/90 cursor-pointer'
                        : 'bg-gray-600/30 text-gray-400 cursor-not-allowed opacity-50'
                }`}
            >
                <ChevronLeft size={18} />
                <span className="text-sm font-semibold">Previous</span>
            </button>

            {/* Center: Page info */}
            <div className="text-center">
                <div className="text-[#14FFEC] text-sm font-semibold">
                    Page {currentPage + 1} of {totalPages}
                </div>
                {itemCount > 0 && (
                    <div className="text-gray-400 text-xs">
                        Showing {startIndex}-{endIndex} of {itemCount} items
                    </div>
                )}
            </div>

            {/* Right: Next button */}
            <button
                onClick={onNext}
                disabled={!hasNext || isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    hasNext && !isLoading
                        ? 'bg-[#14FFEC] text-black hover:bg-[#14FFEC]/90 cursor-pointer'
                        : 'bg-gray-600/30 text-gray-400 cursor-not-allowed opacity-50'
                }`}
            >
                <span className="text-sm font-semibold">Next</span>
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

/**
 * Compact pagination component (minimal spacing)
 */
export function PaginationComponentCompact({
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    onNext,
    onPrevious,
    isLoading = false,
}: PaginationComponentProps) {
    return (
        <div className="flex items-center justify-center gap-2 py-4">
            <button
                onClick={onPrevious}
                disabled={!hasPrevious || isLoading}
                className={`p-2 rounded-lg transition-all ${
                    hasPrevious && !isLoading
                        ? 'bg-[#14FFEC] text-black hover:bg-[#14FFEC]/90'
                        : 'bg-gray-600/30 text-gray-400 opacity-50 cursor-not-allowed'
                }`}
                title="Previous page"
            >
                <ChevronLeft size={20} />
            </button>

            <div className="text-[#14FFEC] text-sm font-semibold min-w-[80px] text-center">
                {currentPage + 1} / {totalPages}
            </div>

            <button
                onClick={onNext}
                disabled={!hasNext || isLoading}
                className={`p-2 rounded-lg transition-all ${
                    hasNext && !isLoading
                        ? 'bg-[#14FFEC] text-black hover:bg-[#14FFEC]/90'
                        : 'bg-gray-600/30 text-gray-400 opacity-50 cursor-not-allowed'
                }`}
                title="Next page"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}
