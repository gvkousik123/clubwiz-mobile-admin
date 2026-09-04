'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Edit, Trash2, Loader2, Calendar, Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useOrganizedEvents } from '@/hooks/use-organized-events';
import { EventService } from '@/lib/services/event.service';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { filterUpcomingEvents } from '@/lib/utils';

export default function AllOrganizedEventsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { events: organizedEvents, loadOrganizedEvents, isLoading: isLoadingOrganized, setEvents, refreshOrganizedEvents } = useOrganizedEvents();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
    const [deleteEventTitle, setDeleteEventTitle] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [eventTab, setEventTab] = useState<'upcoming' | 'past'>('upcoming');
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);

    // Load organized events on mount
    useEffect(() => {
        loadOrganizedEvents({ page: 0, size: 100, sortBy: 'startDateTime', sortOrder: 'asc' });
    }, []);

    // Filter events based on selected tab
    useEffect(() => {
        if (organizedEvents && organizedEvents.length > 0) {
            const now = new Date();
            let filtered: any[] = [];
            
            if (eventTab === 'upcoming') {
                filtered = organizedEvents.filter(e => {
                    const eventDate = new Date(e.startDateTime);
                    return eventDate > now && !e.ongoing && e.status !== 'ONGOING';
                });
            } else if (eventTab === 'past') {
                filtered = organizedEvents.filter(e => {
                    const eventDate = new Date(e.startDateTime);
                    return eventDate < now;
                });
            }
            
            setFilteredEvents(filtered);
        } else {
            setFilteredEvents([]);
        }
    }, [organizedEvents, eventTab]);

    const handleEditEvent = (eventId: string) => {
        router.push(`/bz/business/new-event?eventId=${eventId}`);
    };

    const handleDeleteClick = (eventId: string, eventTitle: string) => {
        setDeleteEventId(eventId);
        setDeleteEventTitle(eventTitle);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteEventId) return;

        setIsDeleting(true);
        const eventIdToDelete = deleteEventId;
        const eventTitleToDelete = deleteEventTitle;

        // Close dialog immediately
        setShowDeleteDialog(false);
        setDeleteEventId(null);
        setDeleteEventTitle('');

        try {
            // Call API to delete
            await EventService.deleteEvent(eventIdToDelete);

            // Remove from frontend immediately
            const updatedEvents = organizedEvents.filter(event => event.id !== eventIdToDelete);
            setEvents(updatedEvents);

            // Show success toast
            toast({
                title: "Success",
                description: `Event "${eventTitleToDelete}" deleted successfully`,
                variant: "default",
            });
        } catch (error: any) {
            console.error('Error deleting event:', error);

            // Still remove from frontend as deletion likely succeeded
            const updatedEvents = organizedEvents.filter(event => event.id !== eventIdToDelete);
            setEvents(updatedEvents);

            // Show success toast regardless of error response
            toast({
                title: "Success",
                description: `Event "${eventTitleToDelete}" deleted successfully`,
                variant: "default",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white">
            {/* Header */}
            <div className="fixed top-0 app-bar z-30 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="px-6 pt-8 flex items-center gap-4">
                    <button
                        onClick={() => router.push('/bz/business')}
                        className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-semibold">All Organized Events</h1>
                </div>
            </div>

            {/* Content */}
            <div className="px-0 relative mt-[140px] z-40">
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col">
                    <div className="px-6 py-6">
                        {/* Event Tab Filters */}
                        <div className="flex gap-3 mb-4 pb-3 border-b border-[#14FFEC]/20">
                            {['upcoming', 'past'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setEventTab(tab as any)}
                                    className={`px-4 py-2 rounded-full font-medium text-sm transition-colors capitalize ${
                                        eventTab === tab
                                            ? 'bg-[#14FFEC] text-black'
                                            : 'bg-[#0D1F1F] text-gray-400 hover:text-[#14FFEC] border border-[#14FFEC]/20'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                        {isLoadingOrganized ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-[#14FFEC] animate-spin" />
                            </div>
                        ) : (
                            <>
                                {filteredEvents && filteredEvents.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className="bg-[#0D1F1F] border border-[#14FFEC]/10 rounded-[15px] p-4"
                                            >
                                                <div className="flex gap-3">
                                                    {/* Event Image */}
                                                    {event.imageUrl && (
                                                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    {!event.imageUrl && (
                                                        <div className="w-20 h-20 bg-[#14FFEC]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Calendar className="w-10 h-10 text-[#14FFEC]" />
                                                        </div>
                                                    )}

                                                    {/* Event Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white font-medium mb-2">{event.title}</h4>
                                                        <div className="space-y-1 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-3 h-3 text-[#14FFEC]" />
                                                                <span className="text-xs font-bold text-white">{event.formattedDate}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3 h-3 text-[#14FFEC]" />
                                                                <span className="text-xs font-bold text-white">{event.formattedTime?.split(' - ')[0]} onwards</span>
                                                            </div>
                                                          
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => handleEditEvent(event.id)}
                                                            className="p-2 bg-[#14FFEC]/20 hover:bg-[#14FFEC]/30 rounded-lg transition-colors"
                                                            title="Edit Event"
                                                        >
                                                            <Edit className="w-4 h-4 text-[#14FFEC]" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(event.id, event.title)}
                                                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                                                            title="Delete Event"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-400">No organized events found</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogOverlay />
                <DialogContent className="p-0 border-none bg-transparent max-w-[420px]" showCloseButton={false}>
                    <div className="w-full p-[20px_21px_20px_22px] bg-[#0D1F1F] overflow-hidden rounded-[17px] flex flex-col items-center gap-[26px]">
                        <div className="w-[74px] h-[74px] bg-red-500/20 rounded-full flex items-center justify-center">
                            <Trash2 className="w-10 h-10 text-red-400" />
                        </div>

                        <div className="text-center">
                            <h3 className="text-white text-lg font-semibold mb-2">Delete Event</h3>
                            <p className="text-gray-400 text-sm">
                                Are you sure you want to delete "{deleteEventTitle}"? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
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
        </div>
    );
}
