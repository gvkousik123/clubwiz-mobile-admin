import { useState, useCallback } from 'react';
import { SuperAdminService, SuperAdminUser, AdminStats, AdminClub } from '@/lib/services/superadmin.service';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// CUSTOM HOOK FOR SUPER ADMIN OPERATIONS
// ============================================================================

interface UseSuperAdminReturn {
  // Loading states
  isLoading: boolean;
  isStatsLoading: boolean;
  isUsersLoading: boolean;
  isClubsLoading: boolean;

  // Data
  users: SuperAdminUser[];
  clubs: AdminClub[];
  stats: AdminStats | null;
  selectedUsers: string[];

  // Actions
  loadStats: () => Promise<void>;
  loadUsers: (page?: number, size?: number) => Promise<void>;
  loadClubs: () => Promise<void>;
  refreshData: () => Promise<void>;

  // User management
  activateUser: (username: string) => Promise<void>;
  deactivateUser: (username: string) => Promise<void>;
  deleteUser: (username: string) => Promise<void>;

  // Club management
  deleteClub: (clubId: string) => Promise<void>;

  // Role management
  addRole: (username: string, role: string) => Promise<void>;
  removeRole: (username: string, role: string) => Promise<void>;

  // Bulk operations
  bulkActivate: (usernames: string[]) => Promise<void>;
  bulkDeactivate: (usernames: string[]) => Promise<void>;
  bulkDelete: (usernames: string[]) => Promise<void>;

  // Selection management
  toggleUserSelection: (username: string) => void;
  selectAllUsers: () => void;
  clearSelection: () => void;

  // Utility
  getUserByUsername: (username: string) => Promise<SuperAdminUser | null>;
}

export const useSuperAdmin = (): UseSuperAdminReturn => {
  const { toast } = useToast();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isClubsLoading, setIsClubsLoading] = useState(false);
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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
  // DATA LOADING
  // ============================================================================

  const loadStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const statsData = await SuperAdminService.getAdminStats();
      setStats(statsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics';
      showErrorToast('Failed to Load Statistics', errorMessage);
    } finally {
      setIsStatsLoading(false);
    }
  }, [showErrorToast]);

  const loadUsers = useCallback(async (page: number = 0, size: number = 50) => {
    setIsUsersLoading(true);
    try {
      const result = await SuperAdminService.getAllUsers(page, size);
      setUsers(result.users);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      showErrorToast('Failed to Load Users', errorMessage);
    } finally {
      setIsUsersLoading(false);
    }
  }, [showErrorToast]);

  const loadClubs = useCallback(async () => {
    setIsClubsLoading(true);
    try {
      const clubsData = await SuperAdminService.getAllClubs();
      setClubs(clubsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load clubs';
      showErrorToast('Failed to Load Clubs', errorMessage);
    } finally {
      setIsClubsLoading(false);
    }
  }, [showErrorToast]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadStats(), loadUsers(), loadClubs()]);
  }, [loadStats, loadUsers, loadClubs]);

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  const activateUser = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      const result = await SuperAdminService.activateUser(username);

      // Update local state
      setUsers(prev => prev.map(user =>
        user.username === username ? { ...user, isActive: true } : user
      ));

      showSuccessToast('User Activated', result.message || `User ${username} has been activated successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate user';
      showErrorToast('Activation Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  const deactivateUser = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      const result = await SuperAdminService.deactivateUser(username);

      // Update local state
      setUsers(prev => prev.map(user =>
        user.username === username ? { ...user, isActive: false } : user
      ));

      showSuccessToast('User Deactivated', result.message || `User ${username} has been deactivated successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate user';
      showErrorToast('Deactivation Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  const deleteUser = useCallback(async (username: string) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${username}"?\n\nThis action cannot be undone and will permanently remove all user data.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await SuperAdminService.deleteUser(username);

      // Update local state
      setUsers(prev => prev.filter(user => user.username !== username));
      setSelectedUsers(prev => prev.filter(u => u !== username));

      showSuccessToast('User Deleted', result.message || `User ${username} has been deleted successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      showErrorToast('Deletion Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  // ============================================================================
  // CLUB MANAGEMENT
  // ============================================================================

  const deleteClub = useCallback(async (clubId: string) => {
    setIsLoading(true);
    try {
      const result = await SuperAdminService.deleteClub(clubId);

      // Update local state - remove the deleted club
      setClubs(prev => prev.filter(club => club.id !== clubId));

      showSuccessToast('Club Deleted', result.message || 'Club has been deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete club';
      showErrorToast('Delete Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  const addRole = useCallback(async (username: string, role: string) => {
    setIsLoading(true);
    try {
      const result = await SuperAdminService.addRoleToUser(username, role);

      // Update local state
      setUsers(prev => prev.map(user => {
        if (user.username === username) {
          const updatedRoles = [...user.roles];
          if (!updatedRoles.includes(role)) {
            updatedRoles.push(role);
          }
          return { ...user, roles: updatedRoles };
        }
        return user;
      }));

      showSuccessToast('Role Added', result.message || `Role ${role} added to ${username} successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add role';
      showErrorToast('Add Role Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  const removeRole = useCallback(async (username: string, role: string) => {
    setIsLoading(true);
    try {
      const result = await SuperAdminService.removeRoleFromUser(username, role);

      // Update local state
      setUsers(prev => prev.map(user => {
        if (user.username === username) {
          const updatedRoles = user.roles.filter(r => r !== role);
          return { ...user, roles: updatedRoles };
        }
        return user;
      }));

      showSuccessToast('Role Removed', result.message || `Role ${role} removed from ${username} successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove role';
      showErrorToast('Remove Role Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const bulkActivate = useCallback(async (usernames: string[]) => {
    if (usernames.length === 0) return;

    setIsLoading(true);
    try {
      const result = await SuperAdminService.bulkActivateUsers(usernames);

      // Update local state for successful activations
      if (result.successful.length > 0) {
        setUsers(prev => prev.map(user =>
          result.successful.includes(user.username)
            ? { ...user, isActive: true }
            : user
        ));
      }

      // Show results
      if (result.successful.length > 0) {
        showSuccessToast(
          'Bulk Activation Complete',
          `${result.successful.length} users activated successfully`
        );
      }

      if (result.failed.length > 0) {
        showErrorToast(
          'Some Activations Failed',
          `${result.failed.length} users could not be activated. Check individual user permissions.`
        );
      }

      // Clear selection
      setSelectedUsers([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk activation failed';
      showErrorToast('Bulk Activation Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  const bulkDeactivate = useCallback(async (usernames: string[]) => {
    if (usernames.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${usernames.length} user(s)?\n\nThis will prevent them from accessing the system.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await SuperAdminService.bulkDeactivateUsers(usernames);

      // Update local state for successful deactivations
      if (result.successful.length > 0) {
        setUsers(prev => prev.map(user =>
          result.successful.includes(user.username)
            ? { ...user, isActive: false }
            : user
        ));
      }

      // Show results
      if (result.successful.length > 0) {
        showSuccessToast(
          'Bulk Deactivation Complete',
          `${result.successful.length} users deactivated successfully`
        );
      }

      if (result.failed.length > 0) {
        showErrorToast(
          'Some Deactivations Failed',
          `${result.failed.length} users could not be deactivated. Check individual user permissions.`
        );
      }

      // Clear selection
      setSelectedUsers([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk deactivation failed';
      showErrorToast('Bulk Deactivation Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  const bulkDelete = useCallback(async (usernames: string[]) => {
    if (usernames.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to DELETE ${usernames.length} user(s)?\n\n⚠️ WARNING: This action cannot be undone and will permanently remove all user data!\n\nType "DELETE" to confirm:`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await SuperAdminService.bulkDeleteUsers(usernames);

      // Update local state for successful deletions
      if (result.successful.length > 0) {
        setUsers(prev => prev.filter(user =>
          !result.successful.includes(user.username)
        ));
      }

      // Show results
      if (result.successful.length > 0) {
        showSuccessToast(
          'Bulk Deletion Complete',
          `${result.successful.length} users deleted successfully`
        );
      }

      if (result.failed.length > 0) {
        showErrorToast(
          'Some Deletions Failed',
          `${result.failed.length} users could not be deleted. Check individual user permissions.`
        );
      }

      // Clear selection
      setSelectedUsers([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk deletion failed';
      showErrorToast('Bulk Deletion Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  // ============================================================================
  // SELECTION MANAGEMENT
  // ============================================================================

  const toggleUserSelection = useCallback((username: string) => {
    setSelectedUsers(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  }, []);

  const selectAllUsers = useCallback(() => {
    setSelectedUsers(users.map(user => user.username));
  }, [users]);

  const clearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  // ============================================================================
  // UTILITY
  // ============================================================================

  const getUserByUsername = useCallback(async (username: string): Promise<SuperAdminUser | null> => {
    try {
      return await SuperAdminService.getUserByUsername(username);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
      showErrorToast('Failed to Fetch User', errorMessage);
      return null;
    }
  }, [showErrorToast]);

  return {
    // Loading states
    isLoading,
    isStatsLoading,
    isUsersLoading,
    isClubsLoading,

    // Data
    users,
    clubs,
    stats,
    selectedUsers,

    // Actions
    loadStats,
    loadUsers,
    loadClubs,
    refreshData,

    // User management
    activateUser,
    deactivateUser,
    deleteUser,

    // Club management
    deleteClub,

    // Role management
    addRole,
    removeRole,

    // Bulk operations
    bulkActivate,
    bulkDeactivate,
    bulkDelete,

    // Selection management
    toggleUserSelection,
    selectAllUsers,
    clearSelection,

    // Utility
    getUserByUsername,
  };
};