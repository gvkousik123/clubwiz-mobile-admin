import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse, Story, PaginationMeta } from '../api-types';

export interface StoryStats {
    totalStories: number;
    totalViews: number;
    averageViews: number;
    activeStories: number;
}

export interface CreateStoryRequest {
    base64Data: string;
    caption?: string;
    fileName: string;
    clubId: string;
}

export interface UpdateStoryRequest {
    caption: string;
}

export interface StoryListResponse {
    content: Story[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
}

export const StoryService = {
    // Get all active stories uploaded by the authenticated user
    getMyStories: async (): Promise<ApiResponse<Story[]>> => {
        try {
            const response = await api.get('/story/stories/my-stories');
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Update story details (Admin/SuperAdmin only)
    updateStory: async (storyId: string, data: UpdateStoryRequest): Promise<ApiResponse<Story>> => {
        try {
            const response = await api.put(`/story/stories/${storyId}`, data);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Delete a story (Admin/SuperAdmin only)
    deleteStory: async (storyId: string): Promise<ApiResponse<void>> => {
        try {
            const response = await api.delete(`/story/stories/${storyId}`);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Mark a story as viewed and increment view count
    viewStory: async (storyId: string): Promise<ApiResponse<void>> => {
        try {
            const response = await api.post(`/story/stories/${storyId}/view`);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Upload a story from base64 data (Admin/SuperAdmin only) - For images
    uploadStory: async (data: CreateStoryRequest): Promise<ApiResponse<Story>> => {
        try {
            const { clubId, ...storyData } = data;
            const response = await api.post(`/story/stories/upload?clubId=${clubId}`, storyData, {
                timeout: 120000, // 2 minutes for large video uploads
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Upload response:', response);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Upload a story asynchronously from base64 data (Admin/SuperAdmin only) - For videos
    uploadStoryAsync: async (data: CreateStoryRequest): Promise<ApiResponse<Story>> => {
        try {
            const { clubId, ...storyData } = data;
            const response = await api.post(`/story/stories/upload-async?clubId=${clubId}`, storyData, {
                timeout: 120000, // 2 minutes for large video uploads
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Async upload response:', response);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Trigger manual cleanup of expired stories
    cleanupStories: async (): Promise<ApiResponse<void>> => {
        try {
            const response = await api.post('/story/stories/cleanup');
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Get all active stories (Instagram-like feed)
    getStories: async (page = 0, size = 20): Promise<ApiResponse<StoryListResponse>> => {
        try {
            const response = await api.get('/story/stories', {
                params: { page, size }
            });
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Get statistics about the authenticated user's stories
    getStoryStats: async (): Promise<ApiResponse<StoryStats>> => {
        try {
            const response = await api.get('/story/stories/stats');
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
};