'use client';

import { useState, useCallback } from 'react';
import {
  ClubService,
  ClubCreateRequest,
  ClubUpdateRequest,
  Club,
  ClubListResponse,
  AdminClubFull
} from '@/lib/services/club.service';
import { useToast } from '@/hooks/use-toast';

export interface UseAdminClubsState {
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isLoadingList: boolean;

  // Data states
  clubs: ClubListResponse | null;
  currentClub: Club | null;

  // Error states
  error: string | null;
}

export interface UseAdminClubsActions {
  // CRUD operations
  createClub: (clubData: ClubCreateRequest) => Promise<boolean>;
  updateClub: (id: string, clubData: ClubUpdateRequest) => Promise<boolean>;
  deleteClub: (id: string) => Promise<boolean>;

  // Data loading
  loadClubs: (params?: { page?: number; size?: number; search?: string }) => Promise<void>;
  loadClub: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;

  // Utility
  clearError: () => void;
  clearCurrentClub: () => void;
}

export function useAdminClubs(): UseAdminClubsState & UseAdminClubsActions {
  const { toast } = useToast();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [clubs, setClubs] = useState<ClubListResponse | null>(null);
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper function to show error toast
  const showErrorToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description: description || "An unexpected error occurred",
      variant: "destructive",
    });
  }, [toast]);

  // Helper function to show success toast
  const showSuccessToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, [toast]);

  // Create club
  const createClub = useCallback(async (clubData: ClubCreateRequest): Promise<boolean> => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await ClubService.createClub(clubData);

      if (response.success) {
        showSuccessToast('Club Created', 'Club has been created successfully');
        return true;
      } else {
        throw new Error(response.errors?.[0] || response.message || 'Failed to create club');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create club';
      setError(errorMessage);
      showErrorToast('Create Failed', errorMessage);
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [showErrorToast, showSuccessToast]);

  // Update club
  const updateClub = useCallback(async (id: string, clubData: ClubUpdateRequest): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await ClubService.updateClub(id, clubData);

      if (response.success) {
        showSuccessToast('Club Updated', 'Club has been updated successfully');
        if (currentClub?.id === id) {
          setCurrentClub(response.data || null);
        }
        return true;
      } else {
        throw new Error(response.errors?.[0] || response.message || 'Failed to update club');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update club';
      setError(errorMessage);
      showErrorToast('Update Failed', errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [currentClub?.id, showErrorToast, showSuccessToast]);

  // Delete club
  const deleteClub = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await ClubService.deleteClub(id);

      if (response.success) {
        showSuccessToast('Club Deleted', 'Club has been deleted successfully');
        if (currentClub?.id === id) {
          setCurrentClub(null);
        }
        // Refresh clubs list
        await loadClubs();
        return true;
      } else {
        throw new Error(response.errors?.[0] || response.message || 'Failed to delete club');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete club';
      setError(errorMessage);
      showErrorToast('Delete Failed', errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [currentClub?.id, showErrorToast, showSuccessToast]);

  // Load clubs list
  const loadClubs = useCallback(async (params: { page?: number; size?: number; search?: string } = {}): Promise<void> => {
    setIsLoadingList(true);
    setError(null);

    try {
      const response = await ClubService.getClubsPaginated({
        page: params.page || 0,
        size: params.size || 20,
        search: params.search,
      });

      if (response.success && response.data) {
        setClubs(response.data);
      } else {
        throw new Error(response.errors?.[0] || response.message || 'Failed to load clubs');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load clubs';
      setError(errorMessage);
      showErrorToast('Load Failed', errorMessage);
    } finally {
      setIsLoadingList(false);
    }
  }, [showErrorToast]);

  // Load specific club
  const loadClub = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ClubService.getClubById(id);

      if (response.success && response.data) {
        setCurrentClub(response.data);
      } else {
        throw new Error(response.errors?.[0] || response.message || 'Failed to load club');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load club';
      setError(errorMessage);
      showErrorToast('Load Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  // Refresh data - Use admin-specific endpoint
  const refreshData = useCallback(async (): Promise<void> => {
    setIsLoadingList(true);
    setError(null);

    try {
      // Use admin-specific endpoint to get clubs owned/managed by this admin
      const data = await ClubService.getAllClubsAdmin();
      const clubsData = Array.isArray(data) ? data : [];

      if (clubsData && clubsData.length > 0) {
        // Convert AdminClubFull[] to ClubListResponse format
        setClubs({
          content: clubsData as any,
          totalElements: clubsData.length,
          totalPages: 1,
          currentPage: 0,
          size: clubsData.length,
          first: true,
          last: true,
          hasNext: false,
          hasPrevious: false,
        });
      } else {
        // If admin endpoint fails, fallback to regular paginated endpoint
        await loadClubs();
      }
    } catch (error) {
      console.error('Failed to load admin clubs:', error);
      // Fallback to regular endpoint
      await loadClubs();
    } finally {
      setIsLoadingList(false);
    }
  }, [loadClubs]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current club
  const clearCurrentClub = useCallback(() => {
    setCurrentClub(null);
  }, []);

  return {
    // State
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isLoadingList,
    clubs,
    currentClub,
    error,

    // Actions
    createClub,
    updateClub,
    deleteClub,
    loadClubs,
    loadClub,
    refreshData,
    clearError,
    clearCurrentClub,
  };
}