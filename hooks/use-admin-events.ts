'use client';

import { useState, useCallback } from 'react';
import { 
  EventService, 
  EventCreateRequest, 
  EventUpdateRequest
} from '@/lib/services/event.service';
import { useToast } from '@/hooks/use-toast';

export interface UseAdminEventsState {
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: string | null;
}

export interface UseAdminEventsActions {
  // CRUD operations
  createEvent: (eventData: EventCreateRequest) => Promise<boolean>;
  updateEvent: (id: string, eventData: EventUpdateRequest) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  
  // Utility
  clearError: () => void;
}

export function useAdminEvents(): UseAdminEventsState & UseAdminEventsActions {
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Create event
  const createEvent = useCallback(async (eventData: EventCreateRequest): Promise<boolean> => {
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await EventService.createEvent(eventData);
      
      if (response.success) {
        showSuccessToast('Event Created', 'Event has been created successfully');
        return true;
      } else {
        throw new Error(response.errors?.[0] || response.message || 'Failed to create event');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      setError(errorMessage);
      showErrorToast('Create Failed', errorMessage);
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [showErrorToast, showSuccessToast]);

  // Update event
  const updateEvent = useCallback(async (id: string, eventData: EventUpdateRequest): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await EventService.updateEvent(id, eventData);
      
      if (response.success) {
        showSuccessToast('Event Updated', 'Event has been updated successfully');
        return true;
      } else {
        throw new Error(response.errors?.[0] || response.message || 'Failed to update event');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
      setError(errorMessage);
      showErrorToast('Update Failed', errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [showErrorToast, showSuccessToast]);

  // Delete event
  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await EventService.deleteEvent(id);
      
      if (response.success) {
        showSuccessToast('Event Deleted', 'Event has been deleted successfully');
        return true;
      } else {
        throw new Error(response.errors?.[0] || response.message || 'Failed to delete event');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete event';
      setError(errorMessage);
      showErrorToast('Delete Failed', errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [showErrorToast, showSuccessToast]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    
    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    clearError,
  };
}