/**
 * Date formatting and parsing utilities
 * All dates are formatted as DD/MM/YYYY
 */

/**
 * Format a date object or ISO string to DD/MM/YYYY format
 */
export const formatDateToDDMMYYYY = (date: Date | string | null | undefined): string => {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) {
            return '';
        }

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        return `${day}/${month}/${year}`;
    } catch {
        return '';
    }
};

/**
 * Parse a DD/MM/YYYY formatted string to a Date object
 */
export const parseDDMMYYYYToDate = (dateString: string): Date | null => {
    if (!dateString) return null;

    try {
        const [day, month, year] = dateString.split('/');

        if (!day || !month || !year) {
            return null;
        }

        const date = new Date(`${year}-${month}-${day}`);

        if (isNaN(date.getTime())) {
            return null;
        }

        return date;
    } catch {
        return null;
    }
};

/**
 * Validate if a string is a valid DD/MM/YYYY format
 */
export const isValidDDMMYYYY = (dateString: string): boolean => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    if (!regex.test(dateString)) {
        return false;
    }

    const [, day, month, year] = dateString.match(regex) || [];

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    if (yearNum < 1900 || yearNum > 2100) return false;

    // Check for valid day in month
    const date = new Date(`${year}-${month}-${day}`);
    return date.getDate() === dayNum;
};

/**
 * Get today's date in DD/MM/YYYY format
 */
export const getTodayDDMMYYYY = (): string => {
    return formatDateToDDMMYYYY(new Date());
};

/**
 * Convert ISO format (YYYY-MM-DD) to DD/MM/YYYY
 */
export const convertISOToDDMMYYYY = (isoDate: string): string => {
    try {
        const date = new Date(isoDate);
        return formatDateToDDMMYYYY(date);
    } catch {
        return '';
    }
};

/**
 * Convert DD/MM/YYYY to ISO format (YYYY-MM-DD)
 */
export const convertDDMMYYYYToISO = (ddmmyyyy: string): string => {
    const date = parseDDMMYYYYToDate(ddmmyyyy);
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Format Date for API (ISO 8601 with time)
 */
export const formatDateTimeForAPI = (ddmmyyyy: string, time: string): string => {
    try {
        const date = parseDDMMYYYYToDate(ddmmyyyy);
        if (!date) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Validate time format (HH:MM)
        const timeRegex = /^(\d{2}):(\d{2})$/;
        const timeMatch = time.match(timeRegex);

        if (!timeMatch) {
            return `${year}-${month}-${day}T00:00:00Z`;
        }

        const [, hours, minutes] = timeMatch;

        return `${year}-${month}-${day}T${hours}:${minutes}:00Z`;
    } catch {
        return '';
    }
};

/**
 * Get current time in IST (Indian Standard Time - UTC+5:30)
 */
export const getCurrentTimeIST = (): Date => {
    const utcDate = new Date();
    const istTime = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    return istTime;
};

/**
 * Check if an event's startDateTime is in the future (not yet started)
 */
export const isFutureEvent = (eventStartDateTime: string | undefined): boolean => {
    if (!eventStartDateTime) return false;
    try {
        const eventDate = new Date(eventStartDateTime);
        const currentTimeIST = getCurrentTimeIST();
        return eventDate > currentTimeIST; // Event is future if it starts after current time
    } catch {
        return false;
    }
};

/**
 * Filter an array of events to include only future events
 */
export const filterFutureEvents = <T extends { startDateTime?: string }>(
    events: T[]
): T[] => {
    try {
        return events.filter(event => isFutureEvent(event.startDateTime));
    } catch {
        return events;
    }
};
