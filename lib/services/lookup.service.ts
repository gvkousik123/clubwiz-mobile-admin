import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse } from '../api-types';

// ============================================================================
// LOOKUP TYPES
// ============================================================================

/**
 * Lookup category types
 */
export type LookupCategory = 'facilities' | 'foodCuisines' | 'music' | 'barOptions';

/**
 * Individual lookup item structure
 */
export interface LookupItem {
  id: string;
  label: string;
  icon?: string;
  active: boolean;
}

/**
 * Complete lookup data structure
 */
export interface LookupData {
  id: string;
  items: LookupItem[];
}

/**
 * All lookup data combined
 */
export interface AllLookupData {
  facilities?: LookupItem[];
  foodCuisines?: LookupItem[];
  music?: LookupItem[];
  barOptions?: LookupItem[];
}

// ============================================================================
// LOOKUP SERVICE
// ============================================================================

/**
 * Lookup Service
 * Handles all lookup data operations for club-related fields
 * These endpoints provide the available options for dropdowns, filters, and form fields
 */
export class LookupService {
  
  /**
   * Reload lookup data (Manual recalculation/reinitialization)
   * POST /lookup/club/reload
   * 
   * Description: Manually recalculate/reinitialize all club lookup data
   * Use this endpoint to refresh the lookup cache
   * 
   * @returns Success message
   */
  static async reloadLookupData(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        '/lookup/club/reload'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get lookup data by category
   * GET /lookup/club/{category}
   * 
   * Description: Retrieve lookup data for a specific category
   * Categories: facilities, foodCuisines, music, barOptions
   * 
   * @param category - The lookup category to retrieve
   * @returns Array of lookup items for the specified category
   */
  static async getLookupByCategory(category: LookupCategory): Promise<ApiResponse<LookupItem[]>> {
    try {
      const response = await api.get<ApiResponse<LookupItem[]>>(
        `/lookup/club/${category}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all club lookup data
   * GET /lookup/club/all
   * 
   * Description: Retrieve all lookup data for club-related fields
   * Returns facilities, food, music, and bar options in a single response
   * 
   * ⭐ RECOMMENDED: Use this method instead of individual category methods 
   * for better performance and to reduce API calls when you need multiple categories.
   * 
   * @returns All lookup data combined
   */
  static async getAllLookupData(): Promise<ApiResponse<AllLookupData>> {
    try {
      const response = await api.get<ApiResponse<AllLookupData>>(
        '/lookup/club/all'
      );
      return handleApiResponse(response);
    } catch (error) {
      console.warn('⚠️ /lookup/club/all returned error/404, using fallback lookup data.');
      return {
        success: true,
        message: 'Loaded fallback lookup categories',
        data: {
          facilities: [
            { id: '1', label: 'Air Conditioning', active: true },
            { id: '2', label: 'VIP Table Booking', active: true },
            { id: '3', label: 'Valet Parking', active: true },
            { id: '4', label: 'Outdoor Seating', active: true },
            { id: '5', label: 'Live DJ', active: true },
            { id: '6', label: 'Dance Floor', active: true }
          ],
          foodCuisines: [
            { id: '1', label: 'Finger Food', active: true },
            { id: '2', label: 'North Indian', active: true },
            { id: '3', label: 'Continental / Italian', active: true },
            { id: '4', label: 'Asian / Chinese', active: true }
          ],
          music: [
            { id: '1', label: 'EDM / House', active: true },
            { id: '2', label: 'Hip Hop / R&B', active: true },
            { id: '3', label: 'Techno', active: true },
            { id: '4', label: 'Bollywood', active: true },
            { id: '5', label: 'Commercial / Pop', active: true }
          ],
          barOptions: [
            { id: '1', label: 'Full Bar Available', active: true },
            { id: '2', label: 'Craft Cocktails', active: true },
            { id: '3', label: 'Beer on Tap', active: true },
            { id: '4', label: 'Wine & Champagne', active: true }
          ]
        }
      };
    }
  }

  /**
   * Get music lookup data
   * GET /lookup/club/music
   * 
   * Description: Retrieve all available music options for clubs
   * 
   * ⚠️ NOTE: Consider using getAllLookupData() instead if you need multiple categories
   * to reduce API calls and improve performance.
   * 
   * @returns Array of music genre options
   */
  static async getMusicOptions(): Promise<ApiResponse<LookupItem[]>> {
    try {
      const response = await api.get<ApiResponse<LookupItem[]>>(
        '/lookup/club/music'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get food cuisines lookup data
   * GET /lookup/club/food-cuisines
   * 
   * Description: Retrieve all available food cuisine options for clubs
   * 
   * @returns Array of food cuisine options
   */
  static async getFoodCuisinesOptions(): Promise<ApiResponse<LookupItem[]>> {
    try {
      const response = await api.get<ApiResponse<LookupItem[]>>(
        '/lookup/club/food-cuisines'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get facilities lookup data
   * GET /lookup/club/facilities
   * 
   * Description: Retrieve all available facility options for clubs
   * 
   * @returns Array of facility options
   */
  static async getFacilitiesOptions(): Promise<ApiResponse<LookupItem[]>> {
    try {
      const response = await api.get<ApiResponse<LookupItem[]>>(
        '/lookup/club/facilities'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get bar options lookup data
   * GET /lookup/club/bar-options
   * 
   * Description: Retrieve all available bar option choices for clubs
   * 
   * @returns Array of bar options
   */
  static async getBarOptions(): Promise<ApiResponse<LookupItem[]>> {
    try {
      const response = await api.get<ApiResponse<LookupItem[]>>(
        '/lookup/club/bar-options'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
