import { api, handleApiResponse, handleApiError } from '../api-client';
import {
  ApiResponse,
  Story,
  StoryView,
  UploadRequest,
  UploadResponse,
  Notification,
  PaginationMeta,
} from '../api-types';

export class MediaService {
  /**
   * Upload file (images, videos, documents)
   */
  static async uploadFile(
    file: File,
    type: 'avatar' | 'club_image' | 'event_image' | 'review_image' | 'story' | 'document',
    metadata?: any
  ): Promise<ApiResponse<UploadResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      const response = await api.post<ApiResponse<UploadResponse>>(
        '/media/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    files: File[],
    type: string,
    metadata?: any
  ): Promise<ApiResponse<UploadResponse[]>> {
    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      formData.append('type', type);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      const response = await api.post<ApiResponse<UploadResponse[]>>(
        '/media/upload-multiple',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete uploaded file
   */
  static async deleteFile(fileUrl: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        '/media/delete',
        { data: { fileUrl } }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(fileUrl: string): Promise<ApiResponse<{
    filename: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    dimensions?: { width: number; height: number };
    duration?: number;
  }>> {
    try {
      const response = await api.get<ApiResponse<{
        filename: string;
        size: number;
        mimeType: string;
        uploadedAt: string;
        dimensions?: { width: number; height: number };
        duration?: number;
      }>>(`/media/metadata?url=${encodeURIComponent(fileUrl)}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Generate thumbnail for image/video
   */
  static async generateThumbnail(
    fileUrl: string,
    width: number = 200,
    height: number = 200
  ): Promise<ApiResponse<{ thumbnailUrl: string }>> {
    try {
      const response = await api.post<ApiResponse<{ thumbnailUrl: string }>>(
        '/media/thumbnail',
        { fileUrl, width, height }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Resize image
   */
  static async resizeImage(
    fileUrl: string,
    width: number,
    height: number,
    quality: number = 80
  ): Promise<ApiResponse<{ resizedUrl: string }>> {
    try {
      const response = await api.post<ApiResponse<{ resizedUrl: string }>>(
        '/media/resize',
        { fileUrl, width, height, quality }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export class StoryService {
  /**
   * Create a new story
   */
  static async createStory(
    clubId: string,
    mediaFile: File,
    title?: string,
    description?: string,
    duration: number = 24 * 60 * 60 // 24 hours in seconds
  ): Promise<ApiResponse<Story>> {
    try {
      const formData = new FormData();
      formData.append('mediaFile', mediaFile);
      formData.append('clubId', clubId);
      formData.append('duration', duration.toString());
      
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      
      const response = await api.post<ApiResponse<Story>>(
        '/stories',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get active stories
   */
  static async getActiveStories(clubId?: string): Promise<ApiResponse<Story[]>> {
    try {
      const params = clubId ? `?clubId=${clubId}` : '';
      const response = await api.get<ApiResponse<Story[]>>(`/stories/active${params}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get story by ID
   */
  static async getStoryById(storyId: string): Promise<ApiResponse<Story>> {
    try {
      const response = await api.get<ApiResponse<Story>>(`/stories/${storyId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get stories for a club
   */
  static async getClubStories(clubId: string): Promise<ApiResponse<Story[]>> {
    try {
      const response = await api.get<ApiResponse<Story[]>>(`/clubs/${clubId}/stories`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * View a story (track view)
   */
  static async viewStory(storyId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/stories/${storyId}/view`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get story views
   */
  static async getStoryViews(storyId: string): Promise<ApiResponse<StoryView[]>> {
    try {
      const response = await api.get<ApiResponse<StoryView[]>>(`/stories/${storyId}/views`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete story
   */
  static async deleteStory(storyId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(`/stories/${storyId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get story analytics
   */
  static async getStoryAnalytics(storyId: string): Promise<ApiResponse<{
    totalViews: number;
    uniqueViews: number;
    viewsByHour: { hour: number; views: number }[];
    topViewers: { userId: string; userName: string; viewCount: number }[];
  }>> {
    try {
      const response = await api.get<ApiResponse<{
        totalViews: number;
        uniqueViews: number;
        viewsByHour: { hour: number; views: number }[];
        topViewers: { userId: string; userName: string; viewCount: number }[];
      }>>(`/stories/${storyId}/analytics`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Archive story
   */
  static async archiveStory(storyId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/stories/${storyId}/archive`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get archived stories
   */
  static async getArchivedStories(clubId: string): Promise<ApiResponse<Story[]>> {
    try {
      const response = await api.get<ApiResponse<Story[]>>(`/clubs/${clubId}/stories/archived`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export class GalleryService {
  /**
   * Get club gallery
   */
  static async getClubGallery(
    clubId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ images: string[]; pagination: PaginationMeta }>> {
    try {
      const response = await api.get<ApiResponse<{ images: string[]; pagination: PaginationMeta }>>(
        `/clubs/${clubId}/gallery?page=${page}&limit=${limit}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get event gallery
   */
  static async getEventGallery(
    eventId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ images: string[]; pagination: PaginationMeta }>> {
    try {
      const response = await api.get<ApiResponse<{ images: string[]; pagination: PaginationMeta }>>(
        `/events/${eventId}/gallery?page=${page}&limit=${limit}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Add images to club gallery
   */
  static async addToClubGallery(clubId: string, images: File[]): Promise<ApiResponse<{ message: string; uploadedUrls: string[] }>> {
    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append('images', image);
      });
      
      const response = await api.post<ApiResponse<{ message: string; uploadedUrls: string[] }>>(
        `/clubs/${clubId}/gallery`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Remove image from gallery
   */
  static async removeFromGallery(imageUrl: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        '/gallery/image',
        { data: { imageUrl } }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export class NotificationService {
  /**
   * Get user notifications
   */
  static async getNotifications(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<ApiResponse<{ notifications: Notification[]; pagination: PaginationMeta; unreadCount: number }>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (unreadOnly) {
        params.append('unreadOnly', 'true');
      }
      
      const response = await api.get<ApiResponse<{ notifications: Notification[]; pagination: PaginationMeta; unreadCount: number }>>(
        `/notifications?${params.toString()}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.put<ApiResponse<{ message: string }>>(
        `/notifications/${notificationId}/read`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<ApiResponse<{ message: string; markedCount: number }>> {
    try {
      const response = await api.put<ApiResponse<{ message: string; markedCount: number }>>(
        '/notifications/read-all'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/notifications/${notificationId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribeToPush(subscription: any): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        '/notifications/push/subscribe',
        subscription
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribeFromPush(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        '/notifications/push/unsubscribe'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export class ContentService {
  /**
   * Search content (clubs, events, users)
   */
  static async searchContent(
    query: string,
    type?: 'clubs' | 'events' | 'users' | 'all',
    filters?: any
  ): Promise<ApiResponse<{
    clubs: any[];
    events: any[];
    users: any[];
    total: number;
  }>> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (type) {
        params.append('type', type);
      }
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await api.get<ApiResponse<{
        clubs: any[];
        events: any[];
        users: any[];
        total: number;
      }>>(`/search?${params.toString()}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get trending content
   */
  static async getTrendingContent(): Promise<ApiResponse<{
    trendingClubs: any[];
    trendingEvents: any[];
    popularSearches: string[];
  }>> {
    try {
      const response = await api.get<ApiResponse<{
        trendingClubs: any[];
        trendingEvents: any[];
        popularSearches: string[];
      }>>('/content/trending');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get content recommendations
   */
  static async getRecommendations(): Promise<ApiResponse<{
    recommendedClubs: any[];
    recommendedEvents: any[];
    basedOn: string;
  }>> {
    try {
      const response = await api.get<ApiResponse<{
        recommendedClubs: any[];
        recommendedEvents: any[];
        basedOn: string;
      }>>('/content/recommendations');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Report content
   */
  static async reportContent(
    contentType: 'club' | 'event' | 'review' | 'story',
    contentId: string,
    reason: string,
    description?: string
  ): Promise<ApiResponse<{ message: string; reportId: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string; reportId: string }>>(
        '/content/report',
        { contentType, contentId, reason, description }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}