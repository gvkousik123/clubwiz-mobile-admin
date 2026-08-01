import { api } from '../api-client';

export interface SummaryStats {
    totalBookings: number;
    totalEntries: number;
    totalRevenue: number;
}

export interface EventAnalytics {
    eventId: string;
    eventTitle: string;
    totalBookings: number;
    totalEntries: number;
    totalRevenue: number;
    arrivals: number;
    pendingArrivals: number;
    maleCount: number;
    femaleCount: number;
    coupleCount: number;
}

export interface Booking {
    ticketNumber: string;
    fullName: string | null;
    guestCount: number;
    arrivalStatus: 'ACTIVE' | 'ARRIVED' | 'CANCELLED';
    bookingDate: string;
    userEmail: string;
    userPhone: string;
    totalAmount: number;
    maleCount?: number;
    femaleCount?: number;
    coupleCount?: number;
}

export interface BookingsResponse {
    content: Booking[];
    totalElements?: number;
    totalPages?: number;
    page?: number;
    size?: number;
}

export interface ExportResponse {
    filename: string;
    success: boolean;
    csv: string;
    totalMatching: number;
    count: number;
    truncated: boolean;
    message: string;
}

const unwrapApiData = <T>(responseData: any): T => {
    if (responseData?.data && typeof responseData.data === 'object' && 'data' in responseData.data) {
        return responseData.data.data as T;
    }
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData.data as T;
    }
    return responseData as T;
};

export class AnalyticsService {
    /**
     * Get overall club-level summary statistics
     */
    static async getSummary(clubId: string): Promise<{ data: SummaryStats; success: boolean; message: string }> {
        try {
            const response = await api.get(`/ticket/api/analytics/summary`, {
                params: { clubId }
            });
            return {
                data: unwrapApiData<SummaryStats>(response.data),
                success: response.data?.success ?? true,
                message: response.data?.message ?? 'Summary fetched successfully'
            };
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Get paginated bookings list
     */
    static async getBookings(params: {
        clubId: string;
        eventId?: string;
        page?: number;
        size?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ data: BookingsResponse; success: boolean; message: string }> {
        try {
            console.log('📊 [Analytics] Fetching bookings for clubId:', params.clubId, 'eventId:', params.eventId || 'all');
            const response = await api.get(`/ticket/api/analytics/bookings`, {
                params: {
                    clubId: params.clubId,
                    eventId: params.eventId,
                    page: params.page || 0,
                    size: params.size || 20,
                    sortBy: params.sortBy || 'bookingDate',
                    sortOrder: params.sortOrder || 'desc'
                }
            });
            console.log('✅ [Analytics] Bookings response:', response.data);
            return {
                data: unwrapApiData<BookingsResponse>(response.data),
                success: response.data?.success ?? true,
                message: response.data?.message ?? 'Bookings fetched successfully'
            };
        } catch (error: any) {
            console.error('❌ [Analytics] Error fetching bookings:', error);
            throw error;
        }
    }

    /**
     * Export bookings as CSV
     */
    static async exportBookings(clubId: string, eventId?: string): Promise<ExportResponse> {
        try {
            console.log('📊 [Analytics] Exporting bookings for clubId:', clubId, 'eventId:', eventId || 'all');
            const response = await api.get(`/ticket/api/analytics/bookings/export`, {
                params: { clubId, eventId }
            });
            console.log('✅ [Analytics] Export response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ [Analytics] Error exporting bookings:', error);
            throw error;
        }
    }

    /**
     * Get bookings filtered by date range
     */
    static async getBookingsByDateRange(params: {
        clubId: string;
        startDate: string;
        endDate: string;
        page?: number;
        size?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ data: BookingsResponse; success: boolean; message: string }> {
        try {
            console.log('📊 [Analytics] Fetching bookings by date range for clubId:', params.clubId, 'from:', params.startDate, 'to:', params.endDate);
            const response = await api.get(`/ticket/api/analytics/bookings/date-range`, {
                params: {
                    clubId: params.clubId,
                    startDate: params.startDate,
                    endDate: params.endDate,
                    page: params.page || 0,
                    size: params.size || 20,
                    sortBy: params.sortBy || 'bookingDate',
                    sortOrder: params.sortOrder || 'desc'
                }
            });
            console.log('✅ [Analytics] Date range bookings response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ [Analytics] Error fetching bookings by date range:', error);
            throw error;
        }
    }

    /**
     * Get event-level analytics
     */
    static async getEventAnalytics(eventId: string, clubId: string): Promise<{ data: EventAnalytics; success: boolean; message: string }> {
        try {
            console.log('📊 [Analytics] Fetching event analytics for eventId:', eventId, 'clubId:', clubId);
            const response = await api.get(`/ticket/api/analytics/event/${eventId}`, {
                params: { clubId }
            });
            console.log('✅ [Analytics] Event analytics response:', response.data);
            return {
                data: unwrapApiData<EventAnalytics>(response.data),
                success: response.data?.success ?? true,
                message: response.data?.message ?? 'Event analytics fetched successfully'
            };
        } catch (error: any) {
            console.error('❌ [Analytics] Error fetching event analytics:', error);
            throw error;
        }
    }
}
