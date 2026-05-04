'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Trash2, Edit, Loader2, Plus } from 'lucide-react';
import { StoryService, StoryStats } from '@/lib/services/story.service';
import { Story } from '@/lib/api-types';
import { useToast } from '@/hooks/use-toast';
import { getClubId } from '@/lib/utils/get-club-id';
import {
    Dialog,
    DialogContent,
    DialogOverlay,
} from '@/components/ui/dialog';

export const dynamic = 'force-dynamic';

function MyStoriesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [clubId, setClubId] = useState<string | null>(null);

    const [myStories, setMyStories] = useState<Story[]>([]);
    const [stats, setStats] = useState<StoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [editCaption, setEditCaption] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Get clubId from URL or localStorage on mount
    useEffect(() => {
        const cid = getClubId(searchParams);
        if (cid) {
            setClubId(cid);
        }
    }, [searchParams]);

    // Load stories and stats
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch my stories
            const storiesResponse = await StoryService.getMyStories();
            console.log('My Stories Response:', storiesResponse);

            // Handle different response formats
            let storiesData: Story[] = [];
            if (Array.isArray(storiesResponse)) {
                storiesData = storiesResponse;
            } else if (storiesResponse.success && storiesResponse.data) {
                storiesData = Array.isArray(storiesResponse.data)
                    ? storiesResponse.data
                    : (storiesResponse.data as any).content || [];
            } else if ((storiesResponse as any).content) {
                storiesData = (storiesResponse as any).content;
            }

            setMyStories(storiesData);

            // Fetch stats
            const statsResponse = await StoryService.getStoryStats();
            console.log('Stats Response:', statsResponse);
            setStats(statsResponse as any);
        } catch (error) {
            console.error('Error loading stories:', error);
            toast({
                title: 'Error',
                description: 'Failed to load stories',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (story: Story) => {
        setSelectedStory(story);
        setDeleteDialogOpen(true);
    };

    const handleEditClick = (story: Story) => {
        setSelectedStory(story);
        setEditCaption(story.caption || '');
        setEditDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedStory) return;

        try {
            setIsDeleting(true);

            // Get the correct ID field
            const storyId = (selectedStory as any).storyId || selectedStory.id;
            console.log('Deleting story with ID:', storyId);

            const response = await StoryService.deleteStory(storyId);
            console.log('Delete response:', response);

            // Response successful - just close and show toast
            toast({
                title: 'Success',
                description: 'Story deleted successfully',
                variant: 'success',
            });

            // Remove from UI
            setMyStories(prev => prev.filter(s => ((s as any).storyId || s.id) !== storyId));
            setDeleteDialogOpen(false);
            setSelectedStory(null);

            // Reload stats
            const statsResponse = await StoryService.getStoryStats();
            console.log('Stats response:', statsResponse);
            setStats(statsResponse as any);

        } catch (error: any) {
            console.error('Error deleting story:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete story',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleConfirmUpdate = async () => {
        if (!selectedStory) return;

        try {
            setIsUpdating(true);

            // Get the correct ID field
            const storyId = (selectedStory as any).storyId || selectedStory.id;
            console.log('Updating story with ID:', storyId, 'Caption:', editCaption);

            const response = await StoryService.updateStory(storyId, {
                caption: editCaption,
            });
            console.log('Update response:', response);

            // Response successful - just close and show toast
            toast({
                title: 'Success',
                description: 'Story updated successfully',
                variant: 'success',
            });

            // Update in UI
            setMyStories(prev =>
                prev.map(s =>
                    ((s as any).storyId || s.id) === storyId
                        ? { ...s, caption: editCaption }
                        : s
                )
            );
            setEditDialogOpen(false);
            setSelectedStory(null);
            setEditCaption('');

        } catch (error: any) {
            console.error('Error updating story:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update story',
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="px-6 pt-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-semibold">My Stories</h1>
                    </div>
                    <button
                        onClick={() => router.push(`/bz/business/upload-story?clubId=${clubId}`)}
                        className="w-10 h-10 flex items-center justify-center bg-[#14FFEC] hover:bg-[#14FFEC]/80 text-black rounded-full transition-colors"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-0 relative mt-[100px] z-40">
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col">
                    <div className="px-6 py-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-[#14FFEC] animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Analytics Stats */}
                                {stats && (
                                    <div className="mb-8">
                                        <h2 className="text-lg font-semibold mb-4">Analytics</h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20">
                                                <p className="text-gray-400 text-sm mb-1">Total Stories</p>
                                                <p className="text-2xl font-bold text-[#14FFEC]">{stats.totalStories}</p>
                                            </div>
                                            <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20">
                                                <p className="text-gray-400 text-sm mb-1">Active Stories</p>
                                                <p className="text-2xl font-bold text-[#14FFEC]">{stats.activeStories}</p>
                                            </div>
                                            <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20">
                                                <p className="text-gray-400 text-sm mb-1">Total Views</p>
                                                <p className="text-2xl font-bold text-[#14FFEC]">{stats.totalViews}</p>
                                            </div>
                                            <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20">
                                                <p className="text-gray-400 text-sm mb-1">Avg. Views</p>
                                                <p className="text-2xl font-bold text-[#14FFEC]">{stats?.averageViews ? stats.averageViews.toFixed(1) : '0'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stories Grid - 2 cards per row */}
                                <div className="mb-6">
                                    {myStories.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <p>No stories found</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            {myStories.map((story) => {
                                                const mediaUrl = story.mediaUrl || story.mediaBase64 || '';
                                                return (
                                                    <div
                                                        key={story.id}
                                                        className="bg-[#0D1F1F] rounded-[15px] overflow-hidden border border-[#14FFEC]/20"
                                                    >
                                                        {/* Story Media - Taller height */}
                                                        <div className="relative h-72 bg-gray-800 flex items-center justify-center overflow-hidden">
                                                            {mediaUrl && (
                                                                story.mediaType === 'video' || mediaUrl.endsWith('.mp4') ? (
                                                                    <video
                                                                        src={mediaUrl}
                                                                        className="max-w-full max-h-full object-contain"
                                                                        controls
                                                                        controlsList="nodownload"
                                                                        onDoubleClick={(e) => {
                                                                            if (e.currentTarget.requestFullscreen) {
                                                                                e.currentTarget.requestFullscreen();
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : story.mediaType === 'audio' || mediaUrl.endsWith('.mp3') || mediaUrl.endsWith('.wav') ? (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#005D5C] to-[#14FFEC]">
                                                                        <audio
                                                                            src={mediaUrl}
                                                                            controls
                                                                            className="w-[90%]"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <img
                                                                        src={mediaUrl}
                                                                        alt={story.caption || 'Story'}
                                                                        className="max-w-full max-h-full object-contain cursor-pointer"
                                                                        onDoubleClick={(e) => {
                                                                            if (e.currentTarget.requestFullscreen) {
                                                                                e.currentTarget.requestFullscreen();
                                                                            }
                                                                        }}
                                                                    />
                                                                )
                                                            )}
                                                            {/* View Count Badge - Highlighted */}
                                                            <div className="absolute top-2 right-2 bg-[#14FFEC]/80 backdrop-blur-sm px-3 py-2 rounded-full border border-[#14FFEC]">
                                                                <p className="text-sm font-bold text-black">{story.viewCount} views</p>
                                                            </div>
                                                            {/* Fullscreen hint for video/image */}
                                                            {(story.mediaType === 'video' || story.mediaType === 'image' || mediaUrl.endsWith('.mp4') || mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i)) && (
                                                                <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                                                                    Double-click for fullscreen
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Story Info */}
                                                        <div className="p-3">
                                                            <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                                                                {story.caption || 'No caption'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mb-3">
                                                                {new Date(story.createdAt).toLocaleDateString()}
                                                            </p>

                                                            {/* Action Buttons - Icons only */}
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleEditClick(story)}
                                                                    className="flex-1 bg-[#14FFEC]/20 hover:bg-[#14FFEC]/30 text-[#14FFEC] py-2 px-3 rounded-lg flex items-center justify-center transition-colors"
                                                                    title="Edit story"
                                                                >
                                                                    <Edit className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(story)}
                                                                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-3 rounded-lg flex items-center justify-center transition-colors"
                                                                    title="Delete story"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogOverlay />
                <DialogContent className="p-0 border-none bg-transparent max-w-[420px]" showCloseButton={false}>
                    <div className="w-full p-[20px_21px_20px_22px] bg-[#0D1F1F] overflow-hidden rounded-[17px] flex flex-col items-center gap-[26px]">
                        <div className="w-[74px] h-[74px] bg-red-500/20 rounded-full flex items-center justify-center">
                            <Trash2 className="w-10 h-10 text-red-400" />
                        </div>

                        <div className="text-center">
                            <h3 className="text-white text-lg font-semibold mb-2">Delete Story</h3>
                            <p className="text-gray-400 text-sm">
                                Are you sure you want to delete this story? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={isDeleting}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogOverlay />
                <DialogContent className="p-0 border-none bg-transparent max-w-[420px]" showCloseButton={false}>
                    <div className="w-full p-[20px_21px_20px_22px] bg-[#0D1F1F] overflow-hidden rounded-[17px] flex flex-col gap-[26px]">
                        <div className="w-[74px] h-[74px] bg-[#14FFEC]/20 rounded-full flex items-center justify-center mx-auto">
                            <Edit className="w-10 h-10 text-[#14FFEC]" />
                        </div>

                        <div>
                            <h3 className="text-white text-lg font-semibold mb-2 text-center">Update Story</h3>
                            <p className="text-gray-400 text-sm mb-4 text-center">
                                Edit the caption for your story
                            </p>

                            <textarea
                                value={editCaption}
                                onChange={(e) => setEditCaption(e.target.value)}
                                placeholder="Enter caption..."
                                maxLength={500}
                                className="w-full bg-[#021313] border border-[#14FFEC]/20 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#14FFEC]/40 resize-none"
                                rows={4}
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">
                                {editCaption.length}/500
                            </p>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setEditDialogOpen(false)}
                                disabled={isUpdating}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmUpdate}
                                disabled={isUpdating}
                                className="flex-1 bg-[#14FFEC] hover:bg-[#14FFEC]/80 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update'
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function MyStoriesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#14FFEC] animate-spin" />
            </div>
        }>
            <MyStoriesContent />
        </Suspense>
    );
}

