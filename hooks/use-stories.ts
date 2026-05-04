import { useState, useCallback } from 'react';
import { StoryService, StoryStats, CreateStoryRequest, UpdateStoryRequest, StoryListResponse } from '@/lib/services/story.service';
import { Story } from '@/lib/api-types';
import { useToast } from './use-toast';

export function useStories() {
    const { toast } = useToast();
    const [stories, setStories] = useState<Story[]>([]);
    const [myStories, setMyStories] = useState<Story[]>([]);
    const [stats, setStats] = useState<StoryStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 0,
        hasNext: false,
        totalPages: 0
    });

    const fetchStories = useCallback(async (page = 0, size = 20, append = false) => {
        setLoading(true);
        setError(null);
        try {
            const response: any = await StoryService.getStories(page, size);
            console.log('📖 fetchStories - Full response:', response);

            let content: Story[] = [];
            let paginationData = {
                page: 0,
                hasNext: false,
                totalPages: 0
            };
            let isSuccess = false;

            // Handle unwrapped response (direct paginated object)
            // The API returns: { content: [...], currentPage: 0, totalPages: 1, totalElements: 2, hasNext: false }
            if (response && Array.isArray(response.content)) {
                console.log('📖 fetchStories - Detected unwrapped response format');
                content = response.content;
                paginationData = {
                    page: response.number || response.currentPage || 0,
                    hasNext: !response.last && (response.currentPage < response.totalPages - 1),
                    totalPages: response.totalPages || 0
                };
                isSuccess = true;
            }
            // Handle wrapped response (standard ApiResponse)
            else if (response.success && response.data) {
                console.log('📖 fetchStories - Detected standard wrapped response format');
                const apiResponse = response.data;
                content = apiResponse.content || [];
                paginationData = {
                    page: apiResponse.currentPage || page,
                    hasNext: apiResponse.hasNext || false,
                    totalPages: apiResponse.totalPages || 0
                };
                isSuccess = true;
            }

            if (isSuccess) {
                console.log('📖 fetchStories - Extracted content array:', content);
                console.log('📖 fetchStories - Content length:', content.length);

                if (append) {
                    setStories(prev => [...prev, ...content]);
                } else {
                    setStories(content);
                }

                setPagination(paginationData);
                console.log('📖 fetchStories - Stories set to state. Total:', content.length);
            } else {
                setError(response.message || 'Failed to fetch stories');
                console.warn('📖 fetchStories - Response not recognizable:', response);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching stories');
            console.error('📖 fetchStories - Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMyStories = useCallback(async () => {
        setLoading(true);
        try {
            const response: any = await StoryService.getMyStories();

            if (Array.isArray(response)) {
                setMyStories(response);
            } else if (response.success && response.data) {
                setMyStories(response.data);
            } else if (response && Array.isArray(response.content)) {
                // In case my-stories is also paginated
                setMyStories(response.content);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const response = await StoryService.getStoryStats();
            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    const uploadStory = useCallback(async (data: CreateStoryRequest) => {
        setLoading(true);
        try {
            const response: any = await StoryService.uploadStory(data);
            // Handle success if response is the story object itself or success=true
            const isSuccess = response?.success || response?.id || response?.fileName;

            if (isSuccess) {
                // Don't show toast here - let the component handle it
                // Refresh my stories
                fetchMyStories();
                return response.data || response;
            } else {
                toast({
                    title: 'Error',
                    description: response.message || 'Failed to upload story',
                    variant: 'destructive',
                });
                return null;
            }
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'An error occurred',
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [fetchMyStories, toast]);

    const removeStory = useCallback(async (storyId: string) => {
        try {
            const response = await StoryService.deleteStory(storyId);
            if (response.success) {
                toast({
                    title: 'Success',
                    description: 'Story deleted',
                });
                setMyStories(prev => prev.filter(s => s.id !== storyId));
                setStories(prev => prev.filter(s => s.id !== storyId));
            } else {
                toast({
                    title: 'Error',
                    description: response.message,
                    variant: 'destructive'
                });
            }
        } catch (err) {
            console.error(err);
        }
    }, [toast]);

    const viewStory = useCallback(async (storyId: string) => {
        // Optimistic update locally if needed, but usually we just fire and forget
        try {
            await StoryService.viewStory(storyId);
        } catch (err) {
            console.error('Failed to mark story as viewed', err);
        }
    }, []);

    return {
        stories,
        myStories,
        stats,
        loading,
        error,
        pagination,
        fetchStories,
        fetchMyStories,
        fetchStats,
        uploadStory,
        removeStory,
        viewStory
    };
}
