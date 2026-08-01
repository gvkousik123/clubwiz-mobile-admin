import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse, PaginationMeta } from '../api-types';

// ============================================================================
// CLUB TYPES
// ============================================================================

// User Profile interface for club members/admins/owners
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  password?: string;
  fullName: string;
  phoneNumber: string;
  mobileNumber?: string;
  isMobileVerified?: boolean;
  otpCode?: string;
  otpExpiryTime?: string;
  otpAttempts?: number;
  lastOtpSentTime?: string;
  passwordResetToken?: string;
  passwordResetExpiryTime?: string;
  passwordResetOtp?: string;
  passwordResetOtpExpiryTime?: string;
  passwordResetAttempts?: number;
  profilePicture?: string;
  isActive: boolean;
  provider?: string;
  providerId?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LocationText {
  address1?: string;
  address2?: string;
  state?: string;
  city?: string;
  pincode?: string;
  fullAddress?: string;
}

export interface LocationMap {
  lat: number;
  lng: number;
}

export interface ClubImage {
  type: string;
  url: string;
}

export interface EntryPricing {
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
}

export interface LiveMusic {
  isEnabled: boolean;
  genres: string[];
  endTiming: string | null;
  soundLevel: string | null;
}

export interface ClubOwner {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  profilePicture?: string;
  isActive?: boolean;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubMember {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
  joinedAt?: string;
  displayName?: string;
  fullName?: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logo: string;
  images: ClubImage[];
  category: string;
  locationText: LocationText;
  locationMap: LocationMap;
  contactEmail: string;
  contactPhone: string;
  foodCuisines: string[];
  facilities: string[];
  music: string[];
  barOptions: string[];
  entryPricing: EntryPricing;
  memberCount: number;
  maxMembers: number;
  isJoined: boolean;
  canJoin: boolean;
  isFull: boolean;
  isActive: boolean;
  owner: ClubOwner;
  recentMembers: ClubMember[];
  admins: ClubMember[];
  createdAt: string;
  updatedAt: string;
  capacityPercentage: number;
  memberStatus: string;
  canPerformAction: boolean;
  joinButtonText: string;
}

export interface ClubListItem {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  category?: string;
  location?: string;
  memberCount?: number;
  maxMembers?: number;
  isJoined?: boolean;
  isFull?: boolean;
  isActive?: boolean;
  ownerName?: string;
  createdAt?: string;
  capacityPercentage?: number;
  memberStatus?: string;
  shortDescription?: string;
}

export interface ClubListResponse {
  content: ClubListItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
  first: boolean;
  last: boolean;
  paginationInfo?: string;
  resultsInfo?: string;
}

export interface AdminClubFull {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  images?: ClubImage[];
  locationText?: LocationText;
  locationMap?: number[];
  foodCuisines?: string[];
  facilities?: string[];
  music?: string[];
  barOptions?: string[];
  entryPricing?: EntryPricing;
  category?: string;
  owner?: UserProfile;
  members?: UserProfile[];
  admins?: UserProfile[];
  isActive: boolean;
  maxMembers?: number;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyClubItem {
  id: string;
  name: string;
  description: string;
  logo?: string;
  category?: string;
  location?: string;
  memberCount: number;
  maxMembers: number;
  isJoined: boolean;
  isFull: boolean;
  isActive: boolean;
  ownerName?: string;
  createdAt: string;
  capacityPercentage: number;
  memberStatus?: string;
  shortDescription?: string;
}

export interface PublicClubByCategory {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  images?: ClubImage[];
  locationText?: LocationText;
  locationMap?: number[];
  foodCuisines?: string[];
  facilities?: string[];
  music?: string[];
  barOptions?: string[];
  entryPricing?: EntryPricing;
}

export interface ClubCreateRequest {
  name: string;
  description: string;
  logo: string | { name: string; contentType: string; data: string; url: string };
  category: string;
  maxMembers: number;
  contactEmail: string;
  contactPhone: string;
  images: ClubImage[];
  locationText: LocationText;
  locationMap?: LocationMap;
  foodCuisines: string[];
  facilities: string[];
  music: string[];
  barOptions: string[];
  entryPricing?: EntryPricing;
}

export interface ClubCreateResponse {
  name: string;
  description: string;
  logo: string;
  category: string;
  maxMembers: number;
  contactEmail: string;
  contactPhone: string;
  images: ClubImage[];
  locationText: LocationText;
  locationMap: LocationMap;
  foodCuisines: string[];
  facilities: string[];
  music: string[];
  barOptions: string[];
  entryPricing: EntryPricing;
}

export interface ClubUpdateRequest {
  name: string;
  description: string;
  logo: string | { name: string; contentType: string; data: string; url: string };
  category: string;
  maxMembers: number;
  contactEmail: string;
  contactPhone: string;
  images: ClubImage[];
  locationText: LocationText;
  locationMap?: LocationMap;
  foodCuisines: string[];
  facilities: string[];
  music: string[];
  barOptions: string[];
  entryPricing?: EntryPricing;
}

/**
 * Helper function to strip base64 data from club payload before multipart upload
 */
function stripBase64FromClubPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...payload };
  
  // Remove base64 from logo
  if (copy.logo && typeof copy.logo === 'object') {
    const logo = copy.logo as { data?: string; url?: string };
    if (logo.data) delete logo.data;
    if (logo.url?.startsWith('data:')) delete logo.url;
  }
  
  // Remove base64 from mainImage
  if (copy.mainImage && typeof copy.mainImage === 'object') {
    const mainImage = copy.mainImage as { data?: string; url?: string };
    if (mainImage.data) delete mainImage.data;
    if (mainImage.url?.startsWith('data:')) delete mainImage.url;
  }
  
  // Remove base64 from image arrays
  for (const listKey of ['images', 'galleryImages', 'foodImages', 'ambianceImages', 'menuImages']) {
    const list = copy[listKey] as Array<{ data?: string; url?: string }> | undefined;
    if (list) {
      copy[listKey] = list.filter((i) => !i.data && !i.url?.startsWith('data:'));
    }
  }
  
  return copy;
}

/**
 * Club Service
 * Handles all club-related API operations
 */
export class ClubService {
  // ============================================================================
  // CONSTANTS
  // ============================================================================
  
  static readonly CLUB_MEDIA_UPLOAD_TIMEOUT_MS = 600_000; // 10 minutes

  // ============================================================================
  // CLUB CRUD OPERATIONS
  // ============================================================================

  /**
   * Get club by ID (Private - Requires Auth)
   * GET /clubs/{id}
   */
  static async getClubById(id: string): Promise<ApiResponse<Club>> {
    try {
      const response = await api.get<ApiResponse<Club>>(`/clubs/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error getting club ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create new club using JSON payload with base64 images
   * POST /clubs/create-json-with-images
   */
  static async createClub(clubData: ClubCreateRequest): Promise<ApiResponse<ClubCreateResponse>> {
    try {
      console.log('🎯 ClubService.createClub() called with:', clubData);
      console.log('📡 API Endpoint: POST /clubs/create-json-with-images');
      const response = await api.post<ApiResponse<ClubCreateResponse>>('/clubs/create-json-with-images', clubData, {
        timeout: ClubService.CLUB_MEDIA_UPLOAD_TIMEOUT_MS
      });
      console.log('🎯 ClubService.createClub() response:', response);
      return handleApiResponse(response);
    } catch (error) {
      console.error('🎯 ClubService.createClub() error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create new club using multipart/form-data for image uploads
   * POST /clubs/create-json-with-images
   */
  static async createClubMultipart(
    clubData: ClubCreateRequest,
    files: {
      logo?: File | null;
      mainImage?: File | null;
      galleryImages?: File[];
      foodImages?: File[];
      ambianceImages?: File[];
      menuImages?: File[];
    }
  ): Promise<ApiResponse<ClubCreateResponse>> {
    try {
      const formData = new FormData();
      
      // Strip base64 from club data before adding to FormData
      const strippedData = stripBase64FromClubPayload(clubData as unknown as Record<string, unknown>);
      formData.append(
        'data',
        new Blob([JSON.stringify(strippedData)], { type: 'application/json' })
      );
      
      if (files.logo) formData.append('logo', files.logo);
      if (files.mainImage) formData.append('mainImage', files.mainImage);
      files.galleryImages?.forEach((f) => formData.append('galleryImages', f));
      files.foodImages?.forEach((f) => formData.append('foodImages', f));
      files.ambianceImages?.forEach((f) => formData.append('ambianceImages', f));
      files.menuImages?.forEach((f) => formData.append('menuImages', f));

      const response = await api.post<ApiResponse<ClubCreateResponse>>(
        '/clubs/create-json-with-images',
        formData,
        {
          timeout: ClubService.CLUB_MEDIA_UPLOAD_TIMEOUT_MS,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error('❌ Error creating club with multipart:', error);
      throw error;
    }
  }

  /**
   * Update club with images
   * POST /clubs/{id}/update-json-with-images
   */
  static async updateClub(id: string, clubData: ClubUpdateRequest): Promise<ApiResponse<Club>> {
    try {
      console.log(`📡 API Call: POST /clubs/${id}/update-json-with-images`);
      console.log(`📋 Update data:`, clubData);
      // Try the new endpoint first for updates with images
      const response = await api.post<ApiResponse<Club>>(`/clubs/${id}/update-json-with-images`, clubData, {
        timeout: ClubService.CLUB_MEDIA_UPLOAD_TIMEOUT_MS
      });
      console.log(`✅ Club updated:`, response);
      return handleApiResponse(response);
    } catch (error) {
      // Fallback to PUT endpoint if the new endpoint doesn't exist
      try {
        console.log(`📡 Fallback: PUT /clubs/${id}`);
        const response = await api.put<ApiResponse<Club>>(`/clubs/${id}`, clubData, {
          timeout: ClubService.CLUB_MEDIA_UPLOAD_TIMEOUT_MS
        });
        console.log(`✅ Club updated:`, response);
        return handleApiResponse(response);
      } catch (fallbackError) {
        console.error(`❌ Error updating club ${id}:`, error);
        throw new Error(handleApiError(fallbackError));
      }
    }
  }

  /**
   * Update club using multipart/form-data for image uploads
   * PUT /clubs/{id}
   */
  static async updateClubMultipart(
    id: string,
    clubData: ClubUpdateRequest,
    files: {
      logo?: File | null;
      mainImage?: File | null;
      galleryImages?: File[];
      foodImages?: File[];
      ambianceImages?: File[];
      menuImages?: File[];
    }
  ): Promise<ApiResponse<Club>> {
    try {
      const formData = new FormData();
      
      // Strip base64 from club data before adding to FormData
      const strippedData = stripBase64FromClubPayload(clubData as unknown as Record<string, unknown>);
      formData.append(
        'data',
        new Blob([JSON.stringify(strippedData)], { type: 'application/json' })
      );
      
      if (files.logo) formData.append('logo', files.logo);
      if (files.mainImage) formData.append('mainImage', files.mainImage);
      files.galleryImages?.forEach((f) => formData.append('galleryImages', f));
      files.foodImages?.forEach((f) => formData.append('foodImages', f));
      files.ambianceImages?.forEach((f) => formData.append('ambianceImages', f));
      files.menuImages?.forEach((f) => formData.append('menuImages', f));

      const response = await api.put<ApiResponse<Club>>(
        `/clubs/${id}`,
        formData,
        {
          timeout: ClubService.CLUB_MEDIA_UPLOAD_TIMEOUT_MS,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error('❌ Error updating club with multipart:', error);
      throw error;
    }
  }

  /**
   * Update club (Alternative endpoint)
   * POST /clubs/{id}
   */
  static async updateClubPost(id: string, clubData: ClubUpdateRequest): Promise<ApiResponse<void>> {
    try {
      const response = await api.post<ApiResponse<void>>(`/clubs/${id}`, clubData);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete club
   * DELETE /clubs/{id}
   */
  static async deleteClub(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/clubs/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // CLUB MEMBERSHIP OPERATIONS
  // ============================================================================

  /**
   * Suspend club (Admin)
   * POST /clubs/{id}/suspend
   */
  static async suspendClub(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.post<ApiResponse<void>>(`/clubs/${id}/suspend`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Leave club
   * POST /clubs/{id}/leave
   */
  static async leaveClub(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.post<ApiResponse<void>>(`/clubs/${id}/leave`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Join club
   * POST /clubs/{id}/join
   */
  static async joinClub(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.post<ApiResponse<void>>(`/clubs/${id}/join`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Approve club (Admin)
   * POST /clubs/{id}/approve
   */
  static async approveClub(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.post<ApiResponse<void>>(`/clubs/${id}/approve`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // ONBOARD OPERATIONS
  // ============================================================================

  /**
   * Onboard club
   * POST /clubs/onboard
   */
  static async onboardClub(clubData: ClubCreateRequest): Promise<ApiResponse<Club>> {
    try {
      const response = await api.post<ApiResponse<Club>>('/clubs/onboard', clubData);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // PUBLIC CLUB OPERATIONS (No Auth Required)
  // ============================================================================

  /**
   * Search public clubs
   * GET /clubs/search
   * Query param: query (required)
   */
  static async searchClubs(query: string): Promise<ApiResponse<Club[]>> {
    try {
      const response = await api.get<ApiResponse<Club[]>>('/clubs/search', {
        params: { query }
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all public clubs
   * GET /clubs/public
   */
  static async getPublicClubs(): Promise<ApiResponse<Club[]>> {
    try {
      const response = await api.get<ApiResponse<Club[]>>('/clubs/public');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get public club by ID
   * GET /clubs/public/{id}
   */
  static async getPublicClubById(id: string): Promise<ApiResponse<PublicClubByCategory>> {
    try {
      const response = await api.get<ApiResponse<PublicClubByCategory>>(`/clubs/public/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get paginated public clubs list
   * GET /clubs/public/list
   */
  static async getPublicClubsList(params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
    category?: string;
    location?: string;
    query?: string;
    hasSpace?: boolean;
  }): Promise<ApiResponse<ClubListResponse>> {
    try {
      const response = await api.get<ApiResponse<ClubListResponse>>('/clubs/public/list', {
        params
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get clubs by location
   * GET /clubs/public/locations
   */
  static async getClubsByLocation(): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get<ApiResponse<string[]>>('/clubs/public/locations');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get clubs by category
   * GET /clubs/public/category/{category}
   */
  static async getClubsByCategory(category: string): Promise<ApiResponse<Club[]>> {
    try {
      const response = await api.get<ApiResponse<Club[]>>(`/clubs/public/category/${category}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all club categories
   * GET /clubs/public/categories
   */
  static async getClubCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get<ApiResponse<string[]>>('/clubs/public/categories');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // USER'S CLUBS
  // ============================================================================

  /**
   * Get clubs owned by current user
   * GET /clubs/owned
   */
  static async getOwnedClubs(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<MyClubItem[]>> {
    try {
      const response = await api.get<ApiResponse<MyClubItem[]>>('/clubs/owned', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get clubs that user has joined
   * GET /clubs/my-clubs
   */
  static async getMyClubs(): Promise<ApiResponse<MyClubItem[]>> {
    try {
      const response = await api.get<ApiResponse<MyClubItem[]>>('/clubs/my-clubs');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get clubs list (Private - requires auth)
   * GET /clubs/list
   */
  static async getClubsList(params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'desc' | 'asc';
    category?: string;
    location?: string;
    query?: string;
    hasSpace?: boolean;
    activeOnly?: boolean;
  }): Promise<ApiResponse<ClubListResponse>> {
    try {
      const response = await api.get<ApiResponse<ClubListResponse>>('/clubs/public/list', {
        params
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // ADMIN OPERATIONS
  // ============================================================================

  /**
   * Get all clubs (Admin only) - Full details
   * GET /clubs/admin/all
   */
  static async getAllClubsAdmin(): Promise<AdminClubFull[]> {
    try {
      const response = await api.get<AdminClubFull[]>('/clubs/admin/all');
      // The endpoint returns a raw array, not wrapped in ApiResponse
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete club (Admin only)
   * DELETE /clubs/admin/{id}
   */
  static async deleteClubAdmin(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/clubs/admin/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get manageable clubs (owned or admin of)
   * GET /clubs/manageable
   */
  static async getManageableClubs(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<Club[]>> {
    try {
      console.log(`📡 API Call: GET /clubs/manageable`, params);
      const response = await api.get<ApiResponse<Club[]>>('/clubs/manageable', { params });
      console.log(`✅ Manageable clubs retrieved:`, response);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error getting manageable clubs:`, error);
      throw new Error(handleApiError(error));
    }
  }

  // ============================================================================
  // NEW PAGINATED CLUB OPERATIONS
  // ============================================================================

  /**
   * Get paginated clubs list
   * GET /clubs
   */
  static async getClubsPaginated(params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    search?: string;
    category?: string;
  }): Promise<ApiResponse<ClubListResponse>> {
    try {
      const response = await api.get<ApiResponse<ClubListResponse>>('/clubs', {
        params
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get public clubs categories
   * GET /clubs/public/categories
   */
  static async getPublicClubsCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get<ApiResponse<string[]>>('/clubs/public/categories');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get public clubs by category with enhanced details
   * GET /clubs/public/{category}/list
   */
  static async getPublicClubsByCategoryEnhanced(
    category: string,
    params?: {
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<PublicClubByCategory[]>> {
    try {
      const response = await api.get<ApiResponse<PublicClubByCategory[]>>(
        `/clubs/public/${category}/list`,
        { params }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get favorite count for a club
   * GET /clubs/{clubId}/favorite-count
   */
  static async getFavoriteCount(clubId: string): Promise<{ clubId: string; favoriteCount: number }> {
    try {
      const response = await api.get<{ clubId: string; favoriteCount: number }>(
        `/clubs/${clubId}/favorite-count`
      );
      return (response as any).data ?? response;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get live music configuration for a club
   * GET /clubs/{id}/live-music
   */
  static async getLiveMusic(id: string): Promise<LiveMusic> {
    try {
      const response = await api.get<LiveMusic>(`/clubs/${id}/live-music`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error getting live music for club ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update live music configuration for a club
   * PUT /clubs/{id}/live-music
   */
  static async updateLiveMusic(id: string, data: LiveMusic): Promise<LiveMusic> {
    try {
      console.log(`📡 API Call: PUT /clubs/${id}/live-music`, data);
      const response = await api.put<LiveMusic>(`/clubs/${id}/live-music`, data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating live music for club ${id}:`, error);
      throw new Error(handleApiError(error));
    }
  }
}
