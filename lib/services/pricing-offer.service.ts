import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse } from '../api-types';

export interface CreateOfferRequest {
    title: string;
    description: string;
    offerType: 'PERCENTAGE_DISCOUNT' | 'FLAT_DISCOUNT' | 'BOGO' | 'OTHER';
    discountPercentage?: number;
    promoCode?: string;
    minimumAmount?: number;
    startDate: string; // ISO_DATE
    endDate: string;   // ISO_DATE
    isActive: boolean;
}

export interface Offer {
    id: string;
    clubId: string;
    title: string;
    description: string;
    offerType: string;
    discountPercentage: number;
    promoCode: string;
    minimumAmount: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const PricingOfferService = {
    // Get all active offers for a club
    getClubOffers: async (clubId: string): Promise<ApiResponse<Offer[]>> => {
        try {
            const response = await api.get(`/pricing-offers/pricing-offers/clubs/${clubId}/offers`);
            console.log('📡 Offers API response:', response.data);

            // Handle array response directly or wrapped response
            const data = Array.isArray(response.data) ? response.data : response.data?.data || response.data;

            return {
                success: true,
                data: Array.isArray(data) ? data : [],
                message: 'Offers fetched successfully'
            };
        } catch (error: any) {
            console.error('❌ Error fetching offers:', error);
            throw new Error(handleApiError(error));
        }
    },

    // Create a special offer for a club (Admin/SuperAdmin only)
    createOffer: async (clubId: string, data: CreateOfferRequest): Promise<ApiResponse<Offer>> => {
        try {
            const response = await api.post(`/pricing-offers/pricing-offers/clubs/${clubId}/offers`, data);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Update an existing club offer (Admin/SuperAdmin only)
    updateOffer: async (clubId: string, offerId: string, data: CreateOfferRequest): Promise<ApiResponse<Offer>> => {
        try {
            const response = await api.put(`/pricing-offers/pricing-offers/clubs/${clubId}/offers/${offerId}`, data);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Delete a club offer (Admin/SuperAdmin only)
    deleteOffer: async (clubId: string, offerId: string): Promise<ApiResponse<void>> => {
        try {
            const response = await api.delete(`/pricing-offers/pricing-offers/clubs/${clubId}/offers/${offerId}`);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
};
