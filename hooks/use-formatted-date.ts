'use client';

import { formatDateToDDMMYYYY } from '@/lib/date-utils';

/**
 * Hook to format event dates consistently across the app
 */
export const useFormattedDate = () => {
    /**
     * Format event data with consistent date formatting
     */
    const formatEventDate = (date: string | undefined, time: string | undefined): string => {
        if (!date) return 'Date TBD';

        const formatted = formatDateToDDMMYYYY(date);
        if (!formatted) return 'Date TBD';

        if (time) {
            return `${formatted} | ${time}`;
        }

        return formatted;
    };

    /**
     * Format just the date part
     */
    const formatDate = (date: string | undefined): string => {
        if (!date) return '';
        return formatDateToDDMMYYYY(date);
    };

    /**
     * Format just the time part from ISO datetime
     */
    const formatTime = (dateTime: string | undefined): string => {
        if (!dateTime) return '';

        try {
            const date = new Date(dateTime);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return '';
        }
    };

    return {
        formatEventDate,
        formatDate,
        formatTime,
    };
};

export default useFormattedDate;
