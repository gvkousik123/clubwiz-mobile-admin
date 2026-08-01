import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse } from '../api-types';

export interface RunningAd {
    id: string;
    title: string;
    subtitle: string;
    badgeLabel: string;
    mediaType: 'IMAGE' | 'VIDEO';
    mediaUrl: string;
    placement: 'HOME_HERO' | 'EVENT_DETAIL' | 'CLUB_PROFILE';
    displayOrder: number;
    isActive: boolean;
    startDateTime: string;
    endDateTime: string;
    linkType: 'NONE' | 'EVENT' | 'EXTERNAL_URL' | 'CLUB';
    linkTarget: string;
    ctaText: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRunningAdRequest {
    mediaBase64: string;
    mediaType: 'IMAGE' | 'VIDEO';
    fileName: string;
    title: string;
    subtitle: string;
    badgeLabel: string;
    placement: 'HOME_HERO' | 'EVENT_DETAIL' | 'CLUB_PROFILE';
    displayOrder: number;
    isActive: boolean;
    startDateTime: string;
    endDateTime: string;
    linkType: 'NONE' | 'EVENT' | 'EXTERNAL_URL' | 'CLUB';
    linkTarget: string;
    ctaText: string;
}

export interface UpdateRunningAdRequest extends CreateRunningAdRequest {}

export interface RunningAdsListResponse {
    ads: RunningAd[];
    totalAds: number;
}

export interface ActiveAdsResponse {
    ads: RunningAd[];
    placement: string;
    totalAds: number;
}

export class RunningAdsService {
    private static BASE_PATH = '/event-management/running-ads';

    /**
     * Get all running ads (Admin only)
     */
    static async getAllAds(): Promise<ApiResponse<RunningAdsListResponse>> {
        try {
            const response = await api.get(this.BASE_PATH);
            return handleApiResponse<RunningAdsListResponse>(response);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get active ads for a placement (Public)
     */
    static async getActiveAds(placement: string = 'HOME_HERO'): Promise<ApiResponse<ActiveAdsResponse>> {
        try {
            const response = await api.get(`${this.BASE_PATH}/active`, {
                params: { placement }
            });
            return handleApiResponse<ActiveAdsResponse>(response);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get a single running ad by ID (Admin only)
     */
    static async getAdById(id: string): Promise<ApiResponse<RunningAd>> {
        try {
            const response = await api.get(`${this.BASE_PATH}/${id}`);
            return handleApiResponse<RunningAd>(response);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new running ad (Admin only)
     */
    static async createAd(data: CreateRunningAdRequest): Promise<ApiResponse<RunningAd>> {
        try {
            const response = await api.post(this.BASE_PATH, data);
            return handleApiResponse<RunningAd>(response);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update an existing running ad (Admin only)
     */
    static async updateAd(id: string, data: UpdateRunningAdRequest): Promise<ApiResponse<RunningAd>> {
        try {
            const response = await api.put(`${this.BASE_PATH}/${id}`, data);
            return handleApiResponse<RunningAd>(response);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Toggle active status of a running ad (Admin only)
     */
    static async toggleStatus(id: string, isActive: boolean): Promise<ApiResponse<RunningAd>> {
        try {
            const response = await api.patch(`${this.BASE_PATH}/${id}/status`, null, {
                params: { isActive }
            });
            return handleApiResponse<RunningAd>(response);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a running ad (Admin only)
     */
    static async deleteAd(id: string): Promise<ApiResponse<{ message: string }>> {
        try {
            const response = await api.delete(`${this.BASE_PATH}/${id}`);
            return handleApiResponse<{ message: string }>(response);
        } catch (error) {
            throw error;
        }
    }
}
