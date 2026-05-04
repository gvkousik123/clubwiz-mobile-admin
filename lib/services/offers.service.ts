import apiClient from '../api-client';

export interface ClubOffer {
    id?: string;
    clubId?: string;
    title: string;
    description: string;
    offerType: 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'BUY_ONE_GET_ONE' | 'FREE_ENTRY' | 'OTHER';
    discountPercentage?: number;
    discountAmount?: number;
    promoCode?: string;
    minimumBill?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface CreateOfferRequest {
    title: string;
    description: string;
    offerType: string;
    discountPercentage?: number;
    discountAmount?: number;
    promoCode?: string;
    minimumAmount?: number;
    usageLimit?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface UpdateOfferRequest extends CreateOfferRequest { }

export class OffersService {
    private static readonly BASE_URL = '/pricing-offers';

    /**
     * Get all offers for a specific club (Public - available to all users)
     */
    static async getClubOffers(clubId: string): Promise<{ success: boolean; data: ClubOffer[] }> {
        try {
            if (!apiClient) {
                throw new Error('API client not initialized');
            }
            console.log(`📡 Fetching offers for club: ${clubId}`);
            const response = await apiClient.get(`${this.BASE_URL}/pricing-offers/clubs/${clubId}/offers`);
            console.log(`✅ Offers fetched successfully:`, response.data);
            return {
                success: true,
                data: Array.isArray(response.data) ? response.data : response.data?.data || []
            };
        } catch (error: any) {
            console.error('❌ Error fetching club offers:', error.message, error);
            return {
                success: false,
                data: []
            };
        }
    }

    /**
     * Create a new offer for a club (Admin/SuperAdmin only)
     */
    static async createOffer(clubId: string, offerData: CreateOfferRequest): Promise<{ success: boolean; data?: ClubOffer; error?: string }> {
        try {
            if (!apiClient) {
                throw new Error('API client not initialized');
            }
            console.log(`📡 Creating offer for club: ${clubId}`, offerData);
            const response = await apiClient.post(`${this.BASE_URL}/pricing-offers/clubs/${clubId}/offers`, offerData);
            console.log(`✅ Offer created successfully:`, response.data);
            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            console.error('❌ Error creating offer:', error.message, error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Update an existing offer (Admin/SuperAdmin only)
     */
    static async updateOffer(clubId: string, offerId: string, offerData: UpdateOfferRequest): Promise<{ success: boolean; data?: ClubOffer; error?: string }> {
        try {
            if (!apiClient) {
                throw new Error('API client not initialized');
            }
            console.log(`📡 Updating offer ${offerId} for club: ${clubId}`, offerData);
            const response = await apiClient.put(`${this.BASE_URL}/pricing-offers/clubs/${clubId}/offers/${offerId}`, offerData);
            console.log(`✅ Offer updated successfully:`, response.data);
            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            console.error('❌ Error updating offer:', error.message, error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Delete an offer (Admin/SuperAdmin only)
     */
    static async deleteOffer(clubId: string, offerId: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!apiClient) {
                throw new Error('API client not initialized');
            }
            console.log(`📡 Deleting offer ${offerId} for club: ${clubId}`);
            await apiClient.delete(`${this.BASE_URL}/pricing-offers/clubs/${clubId}/offers/${offerId}`);
            console.log(`✅ Offer deleted successfully`);
            return {
                success: true
            };
        } catch (error: any) {
            console.error('❌ Error deleting offer:', error.message, error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}
