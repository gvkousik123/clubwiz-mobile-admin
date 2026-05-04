import { api, handleApiResponse, handleApiError } from '../api-client';
import {
  ApiResponse,
  Event,
  EventsFilter,
  TicketType,
  Performer,
  PaginationMeta,
  AttendingEvent,
} from '../api-types';

// New types for the additional event APIs
export interface EventListItem {
  id: string;
  title: string;
  shortDescription: string;
  imageUrl: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  formattedDate: string;
  formattedTime: string;
  timeUntilEvent: string;
  duration: string;
  attendeeCount: number;
  maxAttendees: number;
  isRegistered: boolean;
  canRegister: boolean;
  isFull: boolean;
  clubId: string;
  clubName: string;
  clubLogo: string;
  organizerName: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  isPublic: boolean;
  requiresApproval: boolean;
  attendeeStatus: string;
  eventStatusText: string;
  pastEvent: boolean;
  upcoming: boolean;
  ongoing: boolean;
  capacityPercentage: number;
}

export interface EventListResponse {
  content: EventListItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
  first: boolean;
  last: boolean;
  paginationInfo: string;
  resultsInfo: string;
}

export interface AttendingEventFull {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  locationText?: string;
  locationMap?: number[];
  imageUrl?: string;
  club: {
    id: string;
    name: string;
    description: string;
    logoUrl?: string;
    images?: Array<{ type: string; url: string }>;
    locationText?: {
      address1: string;
      address2?: string;
      state: string;
      city: string;
      pincode: string;
      fullAddress: string;
    };
    locationMap?: number[];
    foodCuisines?: string[];
    facilities?: string[];
    music?: string[];
    barOptions?: string[];
    entryPricing?: {
      coupleEntryPrice?: number;
      groupEntryPrice?: number;
      maleStagEntryPrice?: number;
      femaleStagEntryPrice?: number;
      coverCharge?: number;
      redeemDetails?: string;
      hasTimeRestriction?: boolean;
      timeRestriction?: string;
      inclusions?: string[];
      exclusions?: string[];
    };
    category?: string;
    isActive: boolean;
    maxMembers?: number;
    contactEmail?: string;
    contactPhone?: string;
    createdAt: string;
    updatedAt: string;
  };
  organizer?: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    mobileNumber?: string;
    isMobileVerified?: boolean;
    profilePicture?: string;
    isActive: boolean;
    roles: string[];
    createdAt: string;
    updatedAt: string;
  };
  attendees?: Array<{
    id: string;
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    mobileNumber?: string;
    isMobileVerified?: boolean;
    profilePicture?: string;
    isActive: boolean;
    roles: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  maxAttendees?: number;
  isPublic: boolean;
  requiresApproval: boolean;
  status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

// Event-specific types matching API documentation
export interface EventListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface EventImageData {
  name: string;
  contentType: string;
  data: string;
  url?: string;
  type?: string;
}

export interface CarouselImage {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  displayOrder: number;
  isActive: boolean;
  imageUrl: string;
}

export interface EventCreateRequest {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  locationText?: string;
  locationMap?: {
    lat: number;
    lng: number;
  };
  clubId: string;
  maxAttendees?: number;
  isPublic: boolean;
  requiresApproval: boolean;
  eventArtistName?: string;
  aboutEventArtist?: string;
  instagramHandle?: string;
  spotifyHandle?: string;
  musicGenre?: string;
  eventOrganizer?: string;
  ticketTypes?: TicketType[];
  hasLimitedTickets?: boolean;
  totalTickets?: number;
  eventImage?: EventImageData;
  eventReel?: EventImageData;
  eventOrganizerLogo?: EventImageData;
  galleryImages?: EventImageData[];
  performerImages?: EventImageData[];
}

export interface EventUpdateRequest {
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: string;
  imageUrl?: string;
  clubId?: string;
  maxAttendees?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
  locationText?: string;
  locationMap?: {
    lat: number;
    lng: number;
  };
}

export interface EventDetailsResponse {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  imageUrl: string;
  images?: string[];
  clubId: string;
  maxAttendees: number;
  attendedCount: number;
  maxAttended: number;
  isRegistered: boolean;
  isPublic: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
  rsvpStatus: 'NOT_REGISTERED' | 'REGISTERED';
  club: {
    id: string;
    name: string;
    logo: string;
    category: string;
  };
  organizer: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string;
    displayName: string;
    fullName: string;
  };
  recentAttendees: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string;
    displayName: string;
    fullName: string;
    rsvpStatus: string;
    registeredAt: string;
  }>;
  locationMap?: {
    lat: number;
    lng: number;
  };
  formattedTime?: string;
  timeUntilEvent?: string;
}

export class EventService {
  /**
   * Get all events with optional filtering (API: GET /events/list)
   */
  static async getEvents(params?: EventListParams): Promise<ApiResponse<{ events: Event[]; pagination: PaginationMeta }>> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params.category) queryParams.append('category', params.category);
        if (params.search) queryParams.append('search', params.search);
        if (params.status) queryParams.append('status', params.status);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
      }

      const response = await api.get<ApiResponse<{ events: Event[]; pagination: PaginationMeta }>>(
        `/events/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get event by ID (API: GET /events/{id})
   */
  static async getEventById(eventId: string): Promise<ApiResponse<Event>> {
    try {
      const response = await api.get<ApiResponse<Event>>(`/events/${eventId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get events by club (API: GET /events/club/{clubId})
   */
  static async getEventsByClub(
    clubId: string,
    params?: { page?: number; size?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<ApiResponse<EventListResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      console.log(`📡 API Call: GET /event-management/events/club/${clubId}?${queryParams.toString()}`);
      const response = await api.get<ApiResponse<EventListResponse>>(
        `/event-management/events/club/${clubId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      );
      console.log(`✅ Club events retrieved:`, response);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error getting events for club ${clubId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a new event (API: POST /events)
   */
  static async createEvent(eventData: EventCreateRequest): Promise<ApiResponse<Event>> {
    try {
      console.log('📡 API Call: POST /events');
      console.log('📋 Event data:', eventData);
      console.log('🎯 Required fields check:', {
        title: !!eventData.title,
        description: !!eventData.description,
        startDateTime: !!eventData.startDateTime,
        endDateTime: !!eventData.endDateTime,
        location: !!eventData.location,
        clubId: !!eventData.clubId,
        isPublic: eventData.isPublic !== undefined,
        requiresApproval: eventData.requiresApproval !== undefined
      });
      const response = await api.post<ApiResponse<Event>>('/events', eventData);
      console.log('✅ Event created:', response);
      return handleApiResponse(response);
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create event with images (base64 encoded)
   * POST /events/create-json-with-images
   * Images can be provided as base64 data or uploaded URLs
   */
  static async createEventWithImages(eventData: EventCreateRequest & { images?: string[] }): Promise<ApiResponse<Event>> {
    try {
      console.log('📡 API Call: POST /events/create-json-with-images');
      console.log('📋 Event data:', eventData);
      console.log('📸 Images count:', eventData.images?.length || 0);
      const response = await api.post<ApiResponse<Event>>('/event-management/events/create-json-with-images', eventData);
      console.log('✅ Event created with images:', response);
      return handleApiResponse(response);
    } catch (error) {
      console.error('❌ Error creating event with images:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update an event (API: PUT /events/{id})
   */
  static async updateEvent(eventId: string, eventData: EventUpdateRequest): Promise<any> {
    try {
      console.log(`📡 API Call: PUT /events/${eventId}`);
      console.log('📋 Update data:', eventData);
      const response = await api.put(`/event-management/events/${eventId}`, eventData);
      console.log('✅ Event updated:', response);

      // Handle various response formats
      if (response.data) {
        // If the response has success property, return it directly
        if (typeof response.data === 'object' && 'success' in response.data) {
          return response.data;
        }
        // If it's the event object directly
        if (response.data.id) {
          return { success: true, data: response.data };
        }
        // If it's just a 200 response without structured data
        return { success: true, data: response.data };
      }

      // Fallback
      return { success: true, data: response };
    } catch (error) {
      console.error(`❌ Error updating event ${eventId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete an event (API: DELETE /events/{id})
   * Only the event organizer can delete their events
   */
  static async deleteEvent(eventId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      console.log(`📡 API Call: DELETE /event-management/events/${eventId}`);
      const response = await api.delete<ApiResponse<{ message: string }>>(`/event-management/events/${eventId}`);
      console.log('✅ Event deleted:', response);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error deleting event ${eventId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Attend/Register for an event (API: POST /events/{id}/attend)
   */
  static async attendEvent(eventId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      console.log(`📡 API Call: POST /events/${eventId}/attend`);
      const response = await api.post<ApiResponse<{ message: string }>>(`/event-management/events/${eventId}/attend`);
      console.log(`✅ Registered for event:`, response);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error registering for event ${eventId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Leave/Unregister from an event (API: POST /events/{id}/leave)
   */
  static async leaveEvent(eventId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      console.log(`📡 API Call: POST /events/${eventId}/leave`);
      const response = await api.post<ApiResponse<{ message: string }>>(`/event-management/events/${eventId}/leave`);
      console.log(`✅ Left event:`, response);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error leaving event ${eventId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user's event registrations (API: GET /events/my-registrations)
   */
  static async getMyRegistrations(params?: { page?: number; size?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<ApiResponse<{ events: Event[]; pagination: PaginationMeta }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      console.log(`📡 API Call: GET /events/my-registrations?${queryParams.toString()}`);
      const response = await api.get<ApiResponse<{ events: Event[]; pagination: PaginationMeta }>>(
        `/event-management/events/my-registrations${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      );
      console.log(`✅ My registrations retrieved:`, response);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error getting my registrations:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get events organized by the current user (API: GET /events/my-organized-events)
   */
  static async getMyOrganizedEvents(params?: { page?: number; size?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<ApiResponse<EventListResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      console.log(`📡 API Call: GET /event-management/events/my-organized-events?${queryParams.toString()}`);
      const response = await api.get<ApiResponse<EventListResponse>>(
        `/event-management/events/my-organized-events${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      );
      console.log(`✅ My organized events retrieved:`, response);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error getting my organized events:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get event details by ID (API: GET /event-management/events/{eventId}/details)
   */
  static async getEventDetails(eventId: string): Promise<ApiResponse<Event>> {
    try {
      console.log(`📡 API Call: GET /event-management/events/${eventId}/details`);
      const response = await api.get<ApiResponse<Event>>(`/event-management/events/${eventId}/details`);
      console.log(`✅ Event details retrieved:`, response);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error getting event details for ${eventId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get events the user is attending (API: GET /events/attending)
   * Returns full event details with club and attendee information
   */
  static async getAttendingEvents(): Promise<ApiResponse<AttendingEventFull[]>> {
    try {
      const response = await api.get<ApiResponse<AttendingEventFull[]>>('/event-management/events/attending');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get featured events
   */
  static async getFeaturedEvents(limit: number = 10): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>(`/event-management/events/featured?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get upcoming events
   */
  static async getUpcomingEvents(limit: number = 20): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>(`/event-management/events/upcoming?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Search events by name, artist, or club
   */
  static async searchEvents(query: string, filters?: EventsFilter): Promise<ApiResponse<{ events: Event[]; pagination: PaginationMeta }>> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (filters) {
        if (filters.dateRange) {
          params.append('startDate', filters.dateRange.startDate);
          params.append('endDate', filters.dateRange.endDate);
        }
        if (filters.priceRange) {
          params.append('minPrice', filters.priceRange.min.toString());
          params.append('maxPrice', filters.priceRange.max.toString());
        }
        if (filters.musicGenres?.length) {
          params.append('musicGenres', filters.musicGenres.join(','));
        }
        if (filters.location) {
          params.append('latitude', filters.location.latitude.toString());
          params.append('longitude', filters.location.longitude.toString());
          params.append('radius', filters.location.radius.toString());
        }
        if (filters.sortBy) {
          params.append('sortBy', filters.sortBy);
        }
        if (filters.sortOrder) {
          params.append('sortOrder', filters.sortOrder);
        }
        if (filters.page) {
          params.append('page', filters.page.toString());
        }
        if (filters.limit) {
          params.append('limit', filters.limit.toString());
        }
      }

      const response = await api.get<ApiResponse<{ events: Event[]; pagination: PaginationMeta }>>(
        `/events/search?${params.toString()}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get popular events
   */
  static async getPopularEvents(limit: number = 10): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>(`/event-management/events/popular?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get events by date range
   */
  static async getEventsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>(
        `/event-management/events/date-range?startDate=${startDate}&endDate=${endDate}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get events by music genre
   */
  static async getEventsByGenre(genre: string, limit: number = 20): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>(`/event-management/events/genre/${genre}?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get available music genres
   */
  static async getMusicGenres(): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get<ApiResponse<string[]>>('/event-management/events/genres');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Add event to favorites
   */
  static async addToFavorites(eventId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/event-management/events/${eventId}/favorite`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Remove event from favorites
   */
  static async removeFromFavorites(eventId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/event-management/events/${eventId}/favorite`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user's favorite events
   */
  static async getFavoriteEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>('/user/favorite-events');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Check if event is in user's favorites
   */
  static async isEventFavorite(eventId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    try {
      const response = await api.get<ApiResponse<{ isFavorite: boolean }>>(
        `/event-management/events/${eventId}/favorite/status`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get favorite count for an event
   * GET /event-management/events/{eventId}/favorite-count
   */
  static async getEventFavoriteCount(eventId: string): Promise<{ eventId: string; favoriteCount: number }> {
    try {
      const response = await api.get<{ eventId: string; favoriteCount: number }>(
        `/event-management/events/${eventId}/favorite-count`
      );
      return (response as any).data ?? response;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get event ticket types
   */
  static async getEventTicketTypes(eventId: string): Promise<ApiResponse<TicketType[]>> {
    try {
      const response = await api.get<ApiResponse<TicketType[]>>(`/event-management/events/${eventId}/tickets`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get event performers
   */
  static async getEventPerformers(eventId: string): Promise<ApiResponse<Performer[]>> {
    try {
      const response = await api.get<ApiResponse<Performer[]>>(`/event-management/events/${eventId}/performers`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get nearby events based on location
   */
  static async getNearbyEvents(
    latitude: number,
    longitude: number,
    radius: number = 10,
    limit: number = 20
  ): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>(
        `/event-management/events/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get events happening today
   */
  static async getTodayEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>('/event-management/events/today');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get events happening this weekend
   */
  static async getWeekendEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>('/event-management/events/weekend');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get recommended events for user
   */
  static async getRecommendedEvents(limit: number = 10): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>(`/event-management/events/recommendations?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get event statistics (for analytics)
   */
  static async getEventStats(eventId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(`/event-management/events/${eventId}/stats`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Report an event
   */
  static async reportEvent(eventId: string, reason: string, description?: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/event-management/events/${eventId}/report`,
        { reason, description }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Share event
   */
  static async shareEvent(eventId: string, platform: string): Promise<ApiResponse<{ shareUrl: string }>> {
    try {
      const response = await api.post<ApiResponse<{ shareUrl: string }>>(
        `/event-management/events/${eventId}/share`,
        { platform }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Check event availability
   */
  static async checkEventAvailability(eventId: string): Promise<ApiResponse<{ isAvailable: boolean; availableTickets: number }>> {
    try {
      const response = await api.get<ApiResponse<{ isAvailable: boolean; availableTickets: number }>>(
        `/event-management/events/${eventId}/availability`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get events by performer
   */
  static async getEventsByPerformer(performerId: string): Promise<ApiResponse<Event[]>> {
    try {
      const response = await api.get<ApiResponse<Event[]>>(`/event-management/performers/${performerId}/events`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get paginated event list (API: GET /events/list)
   */
  static async getEventList(params: EventListParams = {}): Promise<ApiResponse<EventListResponse>> {
    try {
      const queryParams = new URLSearchParams();

      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await api.get<ApiResponse<EventListResponse>>(
        `/event-management/events/my-organized-events/events/list?${queryParams.toString()}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // CAROUSEL IMAGE APIs
  // ============================================================================

  /**
   * Get all carousel images for an event
   * GET /event-management/events/{eventId}/carousel-images
   */
  static async getCarouselImages(eventId: string, category?: string): Promise<{
    eventId: string;
    totalImages: number;
    images: CarouselImage[];
  }> {
    try {
      const params = category ? `?category=${encodeURIComponent(category)}` : '';
      console.log(`📡 API Call: GET /event-management/events/${eventId}/carousel-images${params}`);
      const response = await api.get<any>(
        `/event-management/events/${eventId}/carousel-images${params}`
      );
      console.log(`✅ Carousel images retrieved:`, response);
      return (response as any).data ?? response;
    } catch (error) {
      console.error(`❌ Error getting carousel images for event ${eventId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Upload a new carousel image for an event
   * POST /event-management/events/{eventId}/carousel-images
   */
  static async uploadCarouselImage(
    eventId: string,
    data: {
      imageBase64: string;
      title?: string;
      description?: string;
      category?: string;
      displayOrder?: number;
    }
  ): Promise<CarouselImage> {
    try {
      const body = { eventId, ...data };
      console.log(`📡 API Call: POST /event-management/events/${eventId}/carousel-images`);
      const response = await api.post<any>(
        `/event-management/events/${eventId}/carousel-images`,
        body
      );
      console.log(`✅ Carousel image uploaded:`, response);
      return (response as any).data ?? response;
    } catch (error) {
      console.error(`❌ Error uploading carousel image for event ${eventId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update carousel image metadata
   * PUT /event-management/events/{eventId}/carousel-images/{imageId}
   */
  static async updateCarouselImage(
    eventId: string,
    imageId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<CarouselImage> {
    try {
      const body = { imageId, ...data };
      console.log(`📡 API Call: PUT /event-management/events/${eventId}/carousel-images/${imageId}`);
      const response = await api.put<any>(
        `/event-management/events/${eventId}/carousel-images/${imageId}`,
        body
      );
      console.log(`✅ Carousel image updated:`, response);
      return (response as any).data ?? response;
    } catch (error) {
      console.error(`❌ Error updating carousel image ${imageId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete a carousel image
   * DELETE /event-management/events/{eventId}/carousel-images/{imageId}
   */
  static async deleteCarouselImage(eventId: string, imageId: string): Promise<void> {
    try {
      console.log(`📡 API Call: DELETE /event-management/events/${eventId}/carousel-images/${imageId}`);
      await api.delete(`/event-management/events/${eventId}/carousel-images/${imageId}`);
      console.log(`✅ Carousel image deleted`);
    } catch (error) {
      console.error(`❌ Error deleting carousel image ${imageId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

}