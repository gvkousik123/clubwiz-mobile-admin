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
 * Club Service
 * Handles all club-related API operations
 */
export class ClubService {
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
      const response = await api.post<ApiResponse<ClubCreateResponse>>('/clubs/create-json-with-images', clubData);
      console.log('🎯 ClubService.createClub() response:', response);
      return handleApiResponse(response);
    } catch (error) {
      console.error('🎯 ClubService.createClub() error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update club
   * PUT /clubs/{id}
   */
  static async updateClub(id: string, clubData: ClubUpdateRequest): Promise<ApiResponse<Club>> {
    try {
      console.log(`📡 API Call: PUT /clubs/${id}`);
      console.log(`📋 Update data:`, clubData);
      const response = await api.put<ApiResponse<Club>>(`/clubs/${id}`, clubData);
      console.log(`✅ Club updated:`, response);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`❌ Error updating club ${id}:`, error);
      throw new Error(handleApiError(error));
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
}
