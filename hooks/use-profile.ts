import { useState, useCallback, useEffect } from 'react';
import { ProfileService, UserProfile, ProfileStats, ProfileListItem } from '@/lib/services/profile.service';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// PROFILE HOOK INTERFACE
// ============================================================================

interface UseProfileReturn {
  // Loading states
  isLoading: boolean;
  isProfileLoading: boolean;
  isStatsLoading: boolean;
  isAllProfilesLoading: boolean;

  // Data
  profile: UserProfile | null;
  stats: ProfileStats | null;
  allProfiles: ProfileListItem[];
  currentUser: Partial<UserProfile> | null;

  // Profile operations
  loadProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  loadStats: () => Promise<void>;

  // Admin operations
  loadAllProfiles: () => Promise<void>;
  getProfileByAdmin: (userId: string) => Promise<UserProfile | null>;

  // Utility
  refreshAllData: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

// ============================================================================
// PROFILE HOOK
// ============================================================================

export const useProfile = (): UseProfileReturn => {
  const { toast } = useToast();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isAllProfilesLoading, setIsAllProfilesLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [allProfiles, setAllProfiles] = useState<ProfileListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<Partial<UserProfile> | null>(null);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const showSuccessToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, [toast]);

  const showErrorToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description: description || "An unexpected error occurred",
      variant: "destructive",
    });
  }, [toast]);

  // ============================================================================
  // PROFILE OPERATIONS
  // ============================================================================

  const loadProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const profileData = await ProfileService.getProfile();
      setProfile(profileData);
      setCurrentUser(ProfileService.getCurrentUser());
    } catch (error) {
      // Silently fail - don't show toast for profile load errors
      console.error('Profile load error:', error);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: any) => {
    setIsLoading(true);
    try {
      const updatedProfile = await ProfileService.updateProfile(data);
      setProfile(updatedProfile);
      setCurrentUser(ProfileService.getCurrentUser());
      showSuccessToast('Profile Updated', 'Your profile has been updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      showErrorToast('Update Failed', errorMessage);
      throw error; // Re-throw for form handling
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  const loadStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const statsData = await ProfileService.getProfileStats();
      setStats(statsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics';
      showErrorToast('Failed to Load Statistics', errorMessage);
    } finally {
      setIsStatsLoading(false);
    }
  }, [showErrorToast]);

  // ============================================================================
  // ADMIN OPERATIONS
  // ============================================================================

  const loadAllProfiles = useCallback(async () => {
    setIsAllProfilesLoading(true);
    try {
      const profilesData = await ProfileService.getAllProfiles();
      setAllProfiles(profilesData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load all profiles';
      showErrorToast('Failed to Load Profiles', errorMessage);
    } finally {
      setIsAllProfilesLoading(false);
    }
  }, [showErrorToast]);

  const getProfileByAdmin = useCallback(async (userId: string): Promise<UserProfile | null> => {
    setIsLoading(true);
    try {
      const profileData = await ProfileService.getProfileByAdmin(userId);
      return profileData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user profile';
      showErrorToast('Failed to Load User Profile', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      loadProfile(),
      loadStats(),
      ProfileService.isAdmin() || ProfileService.isSuperAdmin() ? loadAllProfiles() : Promise.resolve()
    ]);
  }, [loadProfile, loadStats, loadAllProfiles]);

  const hasRole = useCallback((role: string): boolean => {
    return ProfileService.hasRole(role);
  }, []);

  const isAdmin = useCallback((): boolean => {
    return ProfileService.isAdmin();
  }, []);

  const isSuperAdmin = useCallback((): boolean => {
    return ProfileService.isSuperAdmin();
  }, []);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Load current user data on mount
    setCurrentUser(ProfileService.getCurrentUser());
  }, []);

  return {
    // Loading states
    isLoading,
    isProfileLoading,
    isStatsLoading,
    isAllProfilesLoading,

    // Data
    profile,
    stats,
    allProfiles,
    currentUser,

    // Profile operations
    loadProfile,
    updateProfile,
    loadStats,

    // Admin operations
    loadAllProfiles,
    getProfileByAdmin,

    // Utility
    refreshAllData,
    hasRole,
    isAdmin,
    isSuperAdmin,
  };
};