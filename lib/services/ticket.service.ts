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
    cancellationReason?: string;
    cancelledAt?: string;
    ticketDescription?: string; // Description of the ticket type/category
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
    private static readonly BASE_URL = '/club-tickets';

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
