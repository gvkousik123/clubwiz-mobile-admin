import api from '../api-client';
import { ApiResponse } from '../api-types';

export interface TicketScanResponse {
    ticketId: string;
    ticketNumber: string;
    qrCode: string;
    clubId: string;
    clubName: string;
    venueLogo: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    bookingDate: string;
    arrivalTime: string;
    numberOfGuests: number;
    eventId: string;
    eventTitle: string;
    hasEvent: boolean;
    eventStartDateTime: string;
    eventEndDateTime: string;
    maleStagEntry: number;
    femaleStagEntry: number;
    coupleEntry: number;
    ticketDescription: string | null;
    earlyBirdApplied: boolean;
    complimentaryMaleStagCount: number | null;
    entryFee: number;
    offerTitle: string | null;
    offerDescription: string | null;
    offerDiscount: number;
    totalAmount: number;
    totalCover: number;
    currency: string;
    occasion: string | null;
    floorPreference: string | null;
    status: string;
    paymentStatus: string;
    orderId: string;
    bookingId: string;
    isEmailSent: boolean;
    isValidated: boolean;
    validatedAt: string | null;
    createdAt: string;
    cancellationReason: string | null;
    cancelledAt: string | null;
}

export class TicketScanService {
    /**
     * Normalize scan API responses into a ticket payload.
     */
    private static parseScanResponse(responseData: any): { ticket: TicketScanResponse | null; message: string; scanStatus?: string } {
        if (!responseData) {
            return { ticket: null, message: '' };
        }

        const message = responseData?.message || responseData?.data?.message || responseData?.ticket?.message || '';

        if (responseData.ticket) {
            return {
                ticket: responseData.ticket,
                message,
                scanStatus: responseData.scanStatus,
            };
        }

        if (responseData.data?.ticket) {
            return {
                ticket: responseData.data.ticket,
                message,
                scanStatus: responseData.data.scanStatus || responseData.scanStatus,
            };
        }

        if (responseData.data) {
            return {
                ticket: responseData.data,
                message,
                scanStatus: responseData.scanStatus,
            };
        }

        return {
            ticket: responseData,
            message,
            scanStatus: responseData.scanStatus,
        };
    }

    /**
     * Scan a ticket QR code using the booking ID
     * @param bookingId - The booking ID from the QR code (e.g., "BQ-D51E43")
     * @returns Promise with scan result
     */
    static async scanTicket(bookingId: string): Promise<ApiResponse<TicketScanResponse>> {
        try {
            console.log(`🎫 Scanning ticket: ${bookingId}`);
            
            // Check if token exists
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            console.log('🔑 Token exists:', !!token);
            console.log('🔑 Token preview:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
            
            const response = await api.get<any>(
                `/ticket/club-tickets/scan/${bookingId}`
            );

            console.log('✅ Scan response:', response.data);
            
            const { ticket: ticketData, message } = this.parseScanResponse(response.data);
            if (!ticketData) {
                throw new Error('Invalid response format from scan endpoint');
            }

            return {
                success: true,
                message: message || (ticketData.isValidated ? 'Ticket already scanned' : 'Ticket details retrieved'),
                data: ticketData,
                error: ''
            };
        } catch (error: any) {
            console.error('❌ Ticket scan error:', error);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error status:', error.response?.status);
            console.error('❌ Error data:', error.response?.data);
            
            if (error.response?.status === 409) {
                const { ticket: ticketData, message } = this.parseScanResponse(error.response.data);
                if (ticketData) {
                    return {
                        success: true,
                        message: message || 'Ticket already scanned',
                        data: ticketData,
                        error: ''
                    };
                }
            }

            // Handle specific HTTP status codes
            let errorMessage = 'Failed to scan ticket';
            
            if (error.response?.status === 403) {
                errorMessage = "You're not the owner of this club to scan these tickets.";
                console.error('🚫 403 Forbidden - Token may not have required permissions');
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.';
                console.error('🔒 401 Unauthorized - Token may be invalid or expired');
            } else if (error.response?.status === 404) {
                errorMessage = 'Ticket not found. Please check the ticket number.';
            } else {
                errorMessage = error.response?.data?.message || 
                             error.response?.data?.details ||
                             error.message || 
                             'Failed to scan ticket. Please try again.';
            }
            
            return {
                success: false,
                message: errorMessage,
                data: null as any,
                error: errorMessage
            };
        }
    }

    /**
     * Confirm a ticket entry (marks as USED / Validated in the backend)
     * @param ticketId - The internal MongoDB ID of the ticket
     * @param staffId - The ID or Name of the staff member validating
     * @returns Promise with validation result
     */
    static async confirmTicketEntry(ticketId: string, staffId: string): Promise<ApiResponse<any>> {
        try {
            console.log(`🎫 Confirming entry for ticket: ${ticketId} by ${staffId}`);
            
            // Call the existing backend validate endpoint
            const response = await api.post(
                `/ticket/club-tickets/${ticketId}/validate?validatedBy=${encodeURIComponent(staffId)}`
            );

            return {
                success: true,
                message: 'Ticket validated successfully',
                data: response.data,
                error: ''
            };
        } catch (error: any) {
            console.error('❌ Ticket validation error:', error);
            
            const errorMessage = error.response?.data?.message || 
                                 error.response?.data?.details ||
                                 error.message || 
                                 'Failed to validate ticket.';
                                 
            return {
                success: false,
                message: errorMessage,
                data: null as any,
                error: errorMessage
            };
        }
    }


    /**
     * Validate QR code format
     * @param qrData - Raw QR code data
     * @returns Booking ID if valid, null otherwise
     */
    static validateQRCode(qrData: string): string | null {
        console.log('🔍 Validating QR data:', qrData);
        
        // Try to parse as JSON first (Clubwiz QR codes contain JSON)
        try {
            const parsed = JSON.parse(qrData);
            console.log('📦 Parsed JSON:', parsed);
            
            // Check if it's a Clubwiz ticket JSON
            if (parsed.app === 'CLUBWIZ' && parsed.ticketNumber) {
                console.log('✅ Valid Clubwiz QR code, ticket number:', parsed.ticketNumber);
                return parsed.ticketNumber.toUpperCase();
            }
            
            // Also check bookingId field as fallback
            if (parsed.bookingId) {
                console.log('✅ Valid QR code with bookingId:', parsed.bookingId);
                return parsed.bookingId.toUpperCase();
            }
        } catch (e) {
            // Not JSON, continue with other validation methods
            console.log('⚠️ Not JSON, trying other formats...');
        }
        
        // Check if it's a valid booking ID format (e.g., BQ-D51E43)
        const bookingIdPattern = /^BQ-[A-Z0-9]+$/i;
        
        if (bookingIdPattern.test(qrData)) {
            console.log('✅ Valid booking ID format:', qrData);
            return qrData.toUpperCase();
        }
        
        // Check if it's a URL containing the booking ID
        const urlPattern = /\/scan\/([A-Z0-9-]+)$/i;
        const match = qrData.match(urlPattern);
        
        if (match && match[1]) {
            console.log('✅ Valid URL with booking ID:', match[1]);
            return match[1].toUpperCase();
        }
        
        console.log('❌ Invalid QR code format');
        return null;
    }
}
