'use client';

import { useState, useCallback } from 'react';
import { EventService, EventListItem } from '@/lib/services/event.service';

export interface UseOrganizedEventsState {
    events: EventListItem[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    isLoading: boolean;
    error: string | null;
}

export interface UseOrganizedEventsActions {
    loadOrganizedEvents: (params?: {
        page?: number;
        size?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc'
    }) => Promise<void>;
    refreshOrganizedEvents: () => Promise<void>;
    clearError: () => void;
    setEvents: (events: EventListItem[]) => void;
}

export function useOrganizedEvents(): UseOrganizedEventsState & UseOrganizedEventsActions {
    const [events, setEvents] = useState<EventListItem[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load organized events
    const loadOrganizedEvents = useCallback(async (params?: {
        page?: number;
        size?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc'
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            const resAny: any = await EventService.getMyOrganizedEvents(params) as any;

            // The API may return either a wrapped ApiResponse { success, message, data }
            // or the payload directly (EventListResponse). Handle both shapes.
            let payload: any = null;

            if (resAny) {
                // If wrapped response
                if (typeof resAny === 'object' && 'data' in resAny && ('success' in resAny || 'message' in resAny)) {
                    payload = resAny.data;
                    // If API indicates failure explicitly
                    if ('success' in resAny && resAny.success === false) {
                        throw new Error(resAny.message || 'Failed to load organized events');
                    }
                } else if (typeof resAny === 'object' && 'content' in resAny) {
                    // Direct payload
                    payload = resAny;
                } else {
                    // Unknown shape - try to be resilient
                    payload = resAny.data || resAny;
                }
            }

            if (payload) {
                setEvents(payload.content || []);
                setTotalElements(payload.totalElements || payload.total || 0);
                setTotalPages(payload.totalPages || 0);
                setCurrentPage(payload.currentPage || payload.page || 0);
            } else {
                // No payload - treat as empty
                setEvents([]);
                setTotalElements(0);
                setTotalPages(0);
                setCurrentPage(0);
            }
        } catch (error: any) {
            // Treat 403 Forbidden as empty state for new users (server may use 403 when user has no organizer access)
            if (error?.response?.status === 403 || String(error?.message || '').includes('403')) {
                console.log('No organized events yet or access restricted (403) - showing empty state.');
                setEvents([]);
                setTotalElements(0);
                setTotalPages(0);
                setCurrentPage(0);
                setError(null);
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Failed to load organized events';
                setError(errorMessage);
                console.error('Error loading organized events:', error);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh organized events (reload with current params)
    const refreshOrganizedEvents = useCallback(async () => {
        await loadOrganizedEvents();
    }, [loadOrganizedEvents]);

    // Set events directly (for optimistic updates)
    const setEventsDirectly = useCallback((newEvents: EventListItem[]) => {
        setEvents(newEvents);
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        events,
        totalElements,
        totalPages,
        currentPage,
        isLoading,
        error,
        loadOrganizedEvents,
        refreshOrganizedEvents,
        clearError,
        setEvents: setEventsDirectly,
    };
}
