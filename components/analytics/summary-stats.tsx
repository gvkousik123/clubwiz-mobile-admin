'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnalyticsService, SummaryStats } from '@/lib/services/analytics.service';

interface SummaryStatsProps {
    clubId: string | null;
    onStatsChange?: (stats: SummaryStats | null) => void;
}

export function useSummaryStats({ clubId, onStatsChange }: SummaryStatsProps) {
    const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const didLoadRef = useRef(false);
    const onStatsChangeRef = useRef(onStatsChange);

    const loadedClubIdRef = useRef<string | null>(null);

    useEffect(() => {
        const loadSummary = async () => {
            if (!clubId) return;                          // check this FIRST
            if (loadedClubIdRef.current === clubId) return; // already loaded this exact club
            loadedClubIdRef.current = clubId;

            setSummaryLoading(true);
            try {
                const response = await AnalyticsService.getSummary(clubId);
                setSummaryStats(response.data);
                onStatsChangeRef.current?.(response.data);
            } catch (error) {
                setSummaryStats(null);
                onStatsChangeRef.current?.(null);
            } finally {
                setSummaryLoading(false);
            }
        };

        loadSummary();
    }, [clubId]);

    return { summaryStats, summaryLoading };
}
