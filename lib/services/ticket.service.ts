import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse } from '../api-types';

// ============================================================================
// TICKET SERVICE TYPES
// ============================================================================

export interface CreateTicketRequest {
    orderId: string;
}

export interface GenerateTicketRequest {
    orderId: string;
}

export interface ValidateTicketRequest {
    ticketId: string;
}

export interface CancelTicketRequest {
    ticketId: string;
}

export interface TicketResponse {
    ticketId: string;
    ticketNumber?: string;
    orderId?: string;
    qrCode?: string;
    downloadUrl?: string;
    isValid?: boolean;
    status?: 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';
    eventId?: string;
    eventTitle?: string;
    eventLogo?: string; // Event logo/image URL
    eventStartDateTime?: string; // Exact event start time (ISO 8601 format)
    eventEndDateTime?: string; // Exact event end time (ISO 8601 format)
    clubId?: string;
    clubName?: string;
    clubLogo?: string; // Club/Venue logo URL
    venueLogo?: string; // Alternative field for venue logo
    userId?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    createdAt?: string;
    updatedAt?: string;
    // Payment related
    paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED';
    paymentId?: string;
    amount?: number;
    currency?: string;
    // Booking details
    bookingDate?: string;
    arrivalTime?: string;
    guestCount?: number; // For no-event tickets
    maleCount?: number; // For event tickets
    femaleCount?: number; // For event tickets
    coupleCount?: number; // For event tickets
    entryFee?: number;
    totalAmount?: number;
    offerTitle?: string;
    offerDescription?: string;
    offerDiscount?: number;
    occasion?: string;
    floorPreference?: string;
    isEmailSent?: boolean;
    isValidated?: boolean;
    validatedAt?: string;
    validatedBy?: string;
    cancellationReason?: string;
    cancelledAt?: string;
    ticketDescription?: string; // Description of the ticket type/category
}

export interface ScannedTicketSummary {
    ticketId: string;
    ticketNumber: string;
    fullName?: string;
    guestCount: number;
    arrivalStatus: 'USED' | string;
    bookingDate: string;
    userEmail: string;
    userPhone: string;
    totalAmount: number;
    maleCount: number;
    femaleCount: number;
    coupleCount: number;
    eventTitle?: string | null;
    eventId?: string | null;
    isValidated: boolean;
    validatedAt: string;
    validatedBy: string;
}

export interface CreateNoEventTicketRequest {
    clubId: string;
    userId: string;
    ticketType?: string;
    amount?: number;
}

export interface CreateEventTicketRequest {
    eventId: string;
    userId: string;
    ticketTypeId?: string;
    quantity?: number;
    amount?: number;
}

// ============================================================================
// TICKET SERVICE
// ============================================================================

/**
 * Ticket Management Service
 * Handles ticket creation, generation, validation, and cancellation
 * Based on API: https://clubwiz.in/ticket
 */
export class TicketService {
    private static readonly BASE_URL = '/ticket/club-tickets';

    /**
     * Create ticket after order creation (before payment)
     * POST /club-tickets/no-event - Create no-event ticket
     * POST /club-tickets/event - Create event ticket
     * POST /club-tickets/generate - Generate ticket after payment (DEPRECATED - use createTicket first)
     * 
     * Call this AFTER create order but BEFORE redirecting to Cashfree
     */
    static async createTicket(orderId: string): Promise<ApiResponse<TicketResponse>> {
        try {
            console.log('📡 Creating ticket for order:', orderId);

            const response = await api.post<ApiResponse<TicketResponse>>(
                `${this.BASE_URL}/no-event`,
                { orderId }
            );

            const result = handleApiResponse(response);
            console.log('✅ Ticket created successfully:', result.data);

            return result;
        } catch (error) {
            console.error('❌ Error creating ticket:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Create no-event ticket (for club entry without specific event)
     * POST /club-tickets/no-event
     */
    static async createNoEventTicket(
        data: CreateNoEventTicketRequest & { orderId: string }
    ): Promise<ApiResponse<TicketResponse>> {
        try {
            console.log('📡 Creating no-event ticket:', data);

            const response = await api.post<ApiResponse<TicketResponse>>(
                `${this.BASE_URL}/no-event`,
                data
            );

            const result = handleApiResponse(response);
            console.log('✅ No-event ticket created:', result.data);

            return result;
        } catch (error) {
            console.error('❌ Error creating no-event ticket:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Create event ticket
     * POST /club-tickets/event
     */
    static async createEventTicket(
        data: CreateEventTicketRequest & { orderId: string }
    ): Promise<ApiResponse<TicketResponse>> {
        try {
            console.log('📡 Creating event ticket:', data);

            const response = await api.post<ApiResponse<TicketResponse>>(
                `${this.BASE_URL}/event`,
                data
            );

            const result = handleApiResponse(response);
            console.log('✅ Event ticket created:', result.data);

            return result;
        } catch (error) {
            console.error('❌ Error creating event ticket:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Generate ticket after payment verification (call from notify payment)
     * POST /club-tickets/generate
     * 
     * This verifies payment with Cashfree and generates the final ticket
     * Call this in the notifypayment page after Cashfree redirect
     */
    static async generateTicket(orderId: string): Promise<ApiResponse<TicketResponse>> {
        try {
            console.log('📡 Generating ticket after payment for order:', orderId);

            const response = await api.post<ApiResponse<TicketResponse>>(
                `${this.BASE_URL}/generate`,
                { orderId }
            );

            const result = handleApiResponse(response);
            console.log('✅ Ticket generated successfully:', result.data);

            return result;
        } catch (error) {
            console.error('❌ Error generating ticket:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Validate ticket
     * POST /club-tickets/{ticketId}/validate
     */
    static async validateTicket(ticketId: string): Promise<ApiResponse<{ isValid: boolean; message?: string; ticket?: TicketResponse }>> {
        try {
            console.log('📡 Validating ticket:', ticketId);

            const response = await api.post<ApiResponse<any>>(
                `${this.BASE_URL}/${ticketId}/validate`
            );

            const result = handleApiResponse(response);
            console.log('✅ Ticket validation result:', result.data);

            return result;
        } catch (error) {
            console.error('❌ Error validating ticket:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Cancel ticket
     * POST /club-tickets/{ticketId}/cancel
     */
    static async cancelTicket(ticketId: string): Promise<ApiResponse<{ message: string }>> {
        try {
            console.log('📡 Cancelling ticket:', ticketId);

            const response = await api.post<ApiResponse<any>>(
                `${this.BASE_URL}/${ticketId}/cancel`
            );

            const result = handleApiResponse(response);
            console.log('✅ Ticket cancelled successfully');

            return result;
        } catch (error) {
            console.error('❌ Error cancelling ticket:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * List scanned tickets for a club.
     * GET /club-tickets/scanned
     */
    static async listScannedTickets(
        clubId: string,
        eventId?: string,
        page = 0,
        size = 20,
        sortBy = 'validatedAt',
        sortOrder: 'asc' | 'desc' = 'desc'
    ): Promise<ApiResponse<ScannedTicketSummary[]>> {
        try {
            console.log('📡 Fetching scanned tickets for club:', clubId);

            const params = new URLSearchParams({
                clubId,
                page: page.toString(),
                size: size.toString(),
                sortBy,
                sortOrder,
            });

            if (eventId) {
                params.set('eventId', eventId);
            }

            const response = await api.get<any>(
                `${this.BASE_URL}/scanned?${params.toString()}`
            );

            const apiResult = handleApiResponse(response) as any;

            let scannedTickets: ScannedTicketSummary[] = [];

            if (Array.isArray(apiResult?.data)) {
                scannedTickets = apiResult.data;
            } else if (Array.isArray(apiResult?.content)) {
                scannedTickets = apiResult.content;
            } else if (Array.isArray(apiResult?.data?.content)) {
                scannedTickets = apiResult.data.content;
            } else if (Array.isArray(apiResult)) {
                scannedTickets = apiResult;
            }

            const success = typeof apiResult?.success === 'boolean' ? apiResult.success : true;

            console.log('✅ Scanned tickets fetched:', scannedTickets.length);

            return {
                success,
                message: apiResult?.message || '',
                error: apiResult?.error || '',
                data: scannedTickets,
                pagination: apiResult?.pagination,
            };
        } catch (error) {
            console.error('❌ Error fetching scanned tickets:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Lookup a ticket without marking it scanned.
     * GET /club-tickets/lookup/{bookingId}
     */
    static async lookupTicket(bookingId: string): Promise<ApiResponse<TicketResponse>> {
        try {
            console.log('📡 Looking up ticket:', bookingId);

            const response = await api.get<any>(
                `${this.BASE_URL}/lookup/${bookingId}`
            );

            const result = handleApiResponse(response) as any;
            console.log('✅ Ticket lookup fetched:', result);

            if (result && typeof result === 'object') {
                if ('success' in result || 'data' in result) {
                    // Already wrapped as ApiResponse<TicketResponse>
                    return result;
                }

                // Normalize direct ticket object response
                const ticketPayload: TicketResponse = result;
                return {
                    success: true,
                    message: '',
                    error: '',
                    data: ticketPayload,
                };
            }

            throw new Error('Invalid ticket lookup response');
        } catch (error) {
            console.error('❌ Error looking up ticket:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Download ticket PDF.
     * GET /club-tickets/{bookingId}/download
     */
    static async downloadTicket(bookingId: string): Promise<void> {
        try {
            console.log('📡 Downloading ticket PDF for:', bookingId);

            const response = await api.get<Blob>(
                `${this.BASE_URL}/${bookingId}/download`,
                { responseType: 'blob' }
            );

            const fileName = `clubwiz-ticket-${bookingId}.pdf`;
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = fileName;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);

            console.log('✅ Ticket PDF download started');
        } catch (error: any) {
            console.error('❌ Error downloading ticket PDF:', error);
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get ticket details
     * GET /club-tickets/{ticketId}
     */
    static async getTicketDetails(ticketId: string): Promise<ApiResponse<TicketResponse>> {
        try {
            console.log('📡 Fetching ticket details:', ticketId);

            const response = await api.get<ApiResponse<TicketResponse>>(
                `${this.BASE_URL}/${ticketId}`
            );

            const result = handleApiResponse(response);
            console.log('✅ Ticket details fetched:', result.data);

            return result;
        } catch (error) {
            console.error('❌ Error fetching ticket details:', error);
            throw new Error(handleApiError(error));
        }
    }
}
