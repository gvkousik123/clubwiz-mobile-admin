'use client';

import { useState, useCallback } from 'react';

/**
 * Pagination hook for managing paginated data loading
 * Supports: page-based pagination with 50 items per page
 */
export interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
    startIndex: number; // For display purposes (1-based)
    endIndex: number;   // For display purposes
}

export interface UsePaginationReturn {
    pagination: PaginationState;
    goToPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    reset: () => void;
    updatePagination: (data: Partial<PaginationState>) => void;
}

const DEFAULT_PAGE_SIZE = 50;

export function usePagination(initialPage = 0): UsePaginationReturn {
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: initialPage,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalElements: 0,
        hasNext: false,
        hasPrevious: false,
        startIndex: initialPage * DEFAULT_PAGE_SIZE + 1,
        endIndex: (initialPage + 1) * DEFAULT_PAGE_SIZE,
    });

    const goToPage = useCallback((page: number) => {
        const newPage = Math.max(0, Math.min(page, pagination.totalPages - 1));
        setPagination(prev => ({
            ...prev,
            currentPage: newPage,
            startIndex: newPage * DEFAULT_PAGE_SIZE + 1,
            endIndex: (newPage + 1) * DEFAULT_PAGE_SIZE,
            hasPrevious: newPage > 0,
            hasNext: newPage < prev.totalPages - 1,
        }));
    }, [pagination.totalPages]);

    const nextPage = useCallback(() => {
        if (pagination.hasNext) {
            goToPage(pagination.currentPage + 1);
        }
    }, [pagination.currentPage, pagination.hasNext, goToPage]);

    const previousPage = useCallback(() => {
        if (pagination.hasPrevious) {
            goToPage(pagination.currentPage - 1);
        }
    }, [pagination.currentPage, pagination.hasPrevious, goToPage]);

    const reset = useCallback(() => {
        setPagination(prev => ({
            ...prev,
            currentPage: 0,
            startIndex: 1,
            endIndex: DEFAULT_PAGE_SIZE,
            hasPrevious: false,
            hasNext: prev.totalPages > 1,
        }));
    }, []);

    const updatePagination = useCallback((data: Partial<PaginationState>) => {
        setPagination(prev => {
            const updated = { ...prev, ...data };
            
            // Recalculate derived fields if needed
            if (data.currentPage !== undefined || data.totalPages !== undefined || data.pageSize !== undefined) {
                const pageSize = updated.pageSize || DEFAULT_PAGE_SIZE;
                updated.startIndex = updated.currentPage * pageSize + 1;
                updated.endIndex = (updated.currentPage + 1) * pageSize;
                updated.hasNext = updated.currentPage < updated.totalPages - 1;
                updated.hasPrevious = updated.currentPage > 0;
            }
            
            return updated;
        });
    }, []);

    return {
        pagination,
        goToPage,
        nextPage,
        previousPage,
        reset,
        updatePagination,
    };
}
