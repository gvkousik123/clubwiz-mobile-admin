'use client';

import { useState, useCallback } from 'react';
import { ClubService, MyClubItem, ClubUpdateRequest } from '@/lib/services/club.service';
import { useToast } from '@/hooks/use-toast';

export interface UseOwnedClubsState {
    clubs: MyClubItem[];
    isLoading: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    error: string | null;
}

export interface UseOwnedClubsActions {
    loadOwnedClubs: (params?: { page?: number; size?: number }) => Promise<void>;
    updateClub: (id: string, clubData: ClubUpdateRequest) => Promise<boolean>;
    deleteClub: (id: string) => Promise<boolean>;
    setClubs: (clubs: MyClubItem[]) => void;
    refreshClubs: () => Promise<void>;
    clearError: () => void;
}

export function useOwnedClubs(): UseOwnedClubsState & UseOwnedClubsActions {
    const [clubs, setClubs] = useState<MyClubItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const showErrorToast = useCallback((title: string, description: string) => {
        toast({
            title,
            description,
            variant: 'destructive',
        });
    }, [toast]);

    const loadOwnedClubs = useCallback(async (params: { page?: number; size?: number } = {}): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('📡 Loading my clubs...');
            // Use getMyClubs for business admin - calls GET /clubs/my-clubs
            const response = await ClubService.getMyClubs();

            console.log('✅ Raw my-clubs response:', response);

            // getMyClubs returns ApiResponse<MyClubItem[]> - extract the data array
            const clubsData: MyClubItem[] = Array.isArray(response)
                ? response
                : (response as any)?.data ?? [];

            console.log('✅ Setting my clubs:', clubsData.length, 'clubs');
            setClubs(clubsData);
        } catch (error) {
            console.error('❌ Error loading my clubs:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load clubs';
            setError(errorMessage);
            showErrorToast('Load Failed', errorMessage);
            setClubs([]);
        } finally {
            setIsLoading(false);
        }
    }, [showErrorToast]);

    const updateClub = useCallback(async (id: string, clubData: ClubUpdateRequest): Promise<boolean> => {
        setIsUpdating(true);
        setError(null);

        try {
            console.log('📡 Updating club...', id, clubData);
            const response = await ClubService.updateClub(id, clubData);

            console.log('✅ Raw update response:', response);

            // Check if response is successful or contains updated data
            // Based on ClubService.updateClub implementation, it returns response.data
            // which might be the Club object directly or ApiResponse<Club>.
            // However, ClubService usually unwraps ApiResponse using handleApiResponse.
            // If handleApiResponse returns the data directly:
            const updatedClub = response as any;

            if (updatedClub) {
                // Reload all clubs to ensure consistency
                await loadOwnedClubs();

                console.log('✅ Club updated successfully in UI');
                toast({
                    title: "Club Updated",
                    description: "Club has been updated successfully",
                    variant: "default",
                });
                return true;
            } else {
                throw new Error('Failed to update club');
            }
        } catch (error) {
            console.error('❌ Error updating club:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update club';
            setError(errorMessage);
            showErrorToast('Update Failed', errorMessage);
            return false;
        } finally {
            setIsUpdating(false);
        }
    }, [showErrorToast, toast]);

    const deleteClub = useCallback(async (id: string): Promise<boolean> => {
        setIsDeleting(true);
        setError(null);

        try {
            console.log('📡 Deleting club...', id);
            const response = await ClubService.deleteClub(id);

            console.log('✅ Raw delete response:', response);

            // Check if response indicates success
            if (response && (response as any).success === false) {
                throw new Error((response as any).message || 'Failed to delete club');
            }

            // Reload all clubs to ensure consistency
            await loadOwnedClubs();

            console.log('✅ Club deleted successfully from UI');
            toast({
                title: "Success",
                description: (response as any)?.message || "Club has been deleted successfully",
            });
            return true;

        } catch (error: any) {
            console.error('❌ Error deleting club:', error);

            // Extract error message from different possible formats
            let errorMessage = 'Failed to delete club';

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
            return false;
        } finally {
            setIsDeleting(false);
        }
    }, [toast, loadOwnedClubs]);

    const setClubsDirectly = useCallback((newClubs: MyClubItem[]) => {
        setClubs(newClubs);
    }, []);

    const refreshClubs = useCallback(async (): Promise<void> => {
        await loadOwnedClubs();
    }, [loadOwnedClubs]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        clubs,
        isLoading,
        isUpdating,
        isDeleting,
        error,
        loadOwnedClubs,
        updateClub,
        deleteClub,
        setClubs: setClubsDirectly,
        refreshClubs,
        clearError,
    };
}