'use client';

import { useState, useEffect } from 'react';
import {
  ClubService,
  ClubListResponse,
  MyClubItem,
  AdminClubFull,
  PublicClubByCategory,
  ClubCreateRequest,
  ClubCreateResponse,
  ClubUpdateRequest,
  Club
} from '@/lib/services/club.service';
import { useToast } from '@/hooks/use-toast';
import { getClubImageWithFallback, getClubImagesWithFallback } from '@/lib/image-utils';

// Utility function to process club data with image fallbacks
function processClubWithImageFallback<T extends { id: string; logo?: string; images?: Array<{ type: string, url: string }> }>(club: T): T {
  return {
    ...club,
    logo: getClubImageWithFallback(club.logo, club.id),
    images: getClubImagesWithFallback(club.images, club.id),
  };
}

// Hook for paginated club list
export function useClubList() {
  const [clubs, setClubs] = useState<ClubListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadClubs = async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    search?: string;
    category?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await ClubService.getClubsPaginated(params);

      if (response.success && response.data) {
        // Process clubs with image fallbacks
        const processedClubs = {
          ...response.data,
          content: response.data.content.map(club => processClubWithImageFallback(club))
        };
        setClubs(processedClubs);
      } else {
        setError(response.message || 'Failed to load clubs');
        toast({
          title: "Error",
          description: response.message || 'Failed to load clubs',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clubs';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    clubs,
    loading,
    error,
    loadClubs,
  };
}

// Hook for user's clubs (my clubs)
export function useMyClubs() {
  const [myClubs, setMyClubs] = useState<MyClubItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadMyClubs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ClubService.getMyClubs();

      if (response.success && response.data) {
        // Process clubs with image fallbacks
        const processedClubs = response.data.map(club => processClubWithImageFallback(club));
        setMyClubs(processedClubs);
      } else {
        setError(response.message || 'Failed to load your clubs');
        toast({
          title: "Error",
          description: response.message || 'Failed to load your clubs',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load your clubs';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyClubs();
  }, []);

  return {
    myClubs,
    loading,
    error,
    loadMyClubs,
    refetch: loadMyClubs,
  };
}

// Hook for admin clubs (full details)
export function useAdminClubs() {
  const [adminClubs, setAdminClubs] = useState<AdminClubFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAdminClubs = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ClubService.getAllClubsAdmin();
      const clubsData = Array.isArray(data) ? data : [];

      if (clubsData && clubsData.length > 0) {
        // Process clubs with image fallbacks
        const processedClubs = clubsData.map(club => processClubWithImageFallback(club));
        setAdminClubs(processedClubs);
      } else if (!clubsData || clubsData.length === 0) {
        setError('No clubs found');
        toast({
          title: "Info",
          description: 'No clubs available',
          variant: "default",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load admin clubs';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminClubs();
  }, []);

  return {
    adminClubs,
    loading,
    error,
    loadAdminClubs,
    refetch: loadAdminClubs,
  };
}

// Hook for public clubs by category
export function usePublicClubsByCategory(category: string) {
  const [clubs, setClubs] = useState<PublicClubByCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadClubsByCategory = async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await ClubService.getPublicClubsByCategoryEnhanced(category, params);

      if (response.success && response.data) {
        // Process clubs with image fallbacks
        const processedClubs = response.data.map(club => processClubWithImageFallback(club));
        setClubs(processedClubs);
      } else {
        setError(response.message || 'Failed to load clubs by category');
        toast({
          title: "Error",
          description: response.message || 'Failed to load clubs by category',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clubs by category';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) {
      loadClubsByCategory();
    }
  }, [category]);

  return {
    clubs,
    loading,
    error,
    loadClubsByCategory,
    refetch: () => loadClubsByCategory(),
  };
}

// Hook for club categories
export function useClubCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ClubService.getPublicClubsCategories();

      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError(response.message || 'Failed to load club categories');
        toast({
          title: "Error",
          description: response.message || 'Failed to load club categories',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load club categories';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    loadCategories,
    refetch: loadCategories,
  };
}

// Hook for club creation
export function useClubCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createClub = async (clubData: ClubCreateRequest): Promise<ClubCreateResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ClubService.createClub(clubData);

      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "Club created successfully!",
          variant: "default",
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to create club');
        toast({
          title: "Error",
          description: response.message || 'Failed to create club',
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create club';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createClub,
    loading,
    error,
  };
}

// Hook for club update
export function useClubUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateClub = async (id: string, clubData: ClubUpdateRequest): Promise<Club | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ClubService.updateClub(id, clubData);

      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "Club updated successfully!",
          variant: "default",
        });
        return response.data;
      } else {
        setError(response.message || 'Failed to update club');
        toast({
          title: "Error",
          description: response.message || 'Failed to update club',
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update club';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateClubPost = async (id: string, clubData: ClubUpdateRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ClubService.updateClubPost(id, clubData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Club updated successfully!",
          variant: "default",
        });
        return true;
      } else {
        setError(response.message || 'Failed to update club');
        toast({
          title: "Error",
          description: response.message || 'Failed to update club',
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update club';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateClub,
    updateClubPost,
    loading,
    error,
  };
}