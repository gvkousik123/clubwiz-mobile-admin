'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  Image as ImageIcon,
  Upload,
  Trash2,
  RefreshCw,
  Plus,
  X,
  CheckCircle,
  Edit2,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { AuthService } from '@/lib/services/auth.service';
import { ClubService, AdminClubFull } from '@/lib/services/club.service';
import { EventService, EventListItem, CarouselImage } from '@/lib/services/event.service';
import { fileToBase64 } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import { AccessDenied } from '@/components/common/access-denied';
import { filterUpcomingEvents } from '@/lib/utils';

interface UploadForm {
  file: File | null;
  preview: string | null;
  title: string;
  description: string;
  category: string;
  displayOrder: number;
}

const EMPTY_UPLOAD: UploadForm = {
  file: null,
  preview: null,
  title: '',
  description: '',
  category: '',
  displayOrder: 0,
};

export default function AdminPage() {
  const { toast } = useToast();

  // Auth
  const isAuthenticated = AuthService.isAuthenticated();
  const isAdmin = AuthService.hasRole('ADMIN') || AuthService.hasRole('ROLE_ADMIN');

  // Clubs
  const [clubs, setClubs] = useState<AdminClubFull[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [showClubDropdown, setShowClubDropdown] = useState(false);

  // Events
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventListItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // Carousel
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [isLoadingCarousel, setIsLoadingCarousel] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string; category: string; displayOrder: number; isActive: boolean }>({ title: '', description: '', category: '', displayOrder: 0, isActive: true });
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadForm>(EMPTY_UPLOAD);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived selections
  const selectedClub = clubs.find((c) => c.id === selectedClubId) ?? null;
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  // â”€â”€â”€ Data loaders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadClubs = useCallback(async () => {
    setIsLoadingClubs(true);
    try {
      const data = await ClubService.getAllClubsAdmin();
      // Data is now a raw array, no need to unwrap
      const clubs = Array.isArray(data) ? data : [];
      setClubs(clubs);
      // auto-select if only one club
      if (clubs.length === 1) setSelectedClubId(clubs[0].id);
    } catch (err) {
      console.error('âŒ Failed to load clubs:', err);
      toast({ title: 'Error', description: 'Failed to load clubs', variant: 'destructive' });
    } finally {
      setIsLoadingClubs(false);
    }
  }, [toast]);

  const loadClubEvents = useCallback(
    async (clubId: string) => {
      setIsLoadingEvents(true);
      setEvents([]);
      setSelectedEventId('');
      setCarouselImages([]);
      setShowUploadForm(false);
      setUploadForm(EMPTY_UPLOAD);
      try {
        const res = await EventService.getEventsByClub(clubId, { page: 0, size: 100 });
        const content: EventListItem[] =
          (res as any)?.content ??
          (res as any)?.data?.content ??
          (Array.isArray(res) ? res : []);
        setEvents(content);
        // Filter to show only upcoming events based on IST timezone
        const upcomingEvents = filterUpcomingEvents(content);
        setFilteredEvents(upcomingEvents);
      } catch (err) {
        console.error('âŒ Failed to load events:', err);
        toast({ title: 'Error', description: 'Failed to load events', variant: 'destructive' });
      } finally {
        setIsLoadingEvents(false);
      }
    },
    [toast]
  );

  const loadCarouselImages = useCallback(
    async (eventId: string) => {
      setIsLoadingCarousel(true);
      setCarouselImages([]);
      setShowUploadForm(false);
      setUploadForm(EMPTY_UPLOAD);
      try {
        const res = await EventService.getCarouselImages(eventId);
        setCarouselImages(res?.images ?? []);
      } catch (err) {
        console.error('âŒ Failed to load carousel images:', err);
        toast({ title: 'Error', description: 'Failed to load carousel images', variant: 'destructive' });
      } finally {
        setIsLoadingCarousel(false);
      }
    },
    [toast]
  );

  // â”€â”€â”€ Effects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (isAuthenticated && isAdmin) loadClubs();
  }, [isAuthenticated, isAdmin]);

  // Club changed â†’ reload events
  useEffect(() => {
    if (selectedClubId) loadClubEvents(selectedClubId);
  }, [selectedClubId]);

  // Event changed â†’ reload carousel
  useEffect(() => {
    if (selectedEventId) loadCarouselImages(selectedEventId);
  }, [selectedEventId]);

  // â”€â”€â”€ Upload handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadForm((prev) => ({ ...prev, file, preview: URL.createObjectURL(file) }));
  };

  const handleUploadCarousel = async () => {
    if (!selectedEventId || !uploadForm.file) {
      toast({ title: 'Error', description: 'Please select an image', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const base64Full = await fileToBase64(uploadForm.file);
      const imageBase64 = base64Full.includes(',') ? base64Full.split(',')[1] : base64Full;
      await EventService.uploadCarouselImage(selectedEventId, {
        imageBase64,
        title: uploadForm.title || undefined,
        description: uploadForm.description || undefined,
        category: uploadForm.category || undefined,
        displayOrder: uploadForm.displayOrder,
      });
      toast({ title: 'Uploaded', description: 'Carousel image added successfully' });
      setShowUploadForm(false);
      setUploadForm(EMPTY_UPLOAD);
      loadCarouselImages(selectedEventId);
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err?.message || 'Failed to upload', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCarousel = async (imageId: string) => {
    if (!selectedEventId) return;
    setIsDeletingId(imageId);
    try {
      await EventService.deleteCarouselImage(selectedEventId, imageId);
      toast({ title: 'Deleted', description: 'Carousel image removed' });
      setCarouselImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err?.message || 'Failed to delete', variant: 'destructive' });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleEditCarousel = (image: CarouselImage) => {
    setEditingImageId(image.id);
    setEditForm({
      title: image.title || '',
      description: image.description || '',
      category: image.category || '',
      displayOrder: image.displayOrder,
      isActive: image.isActive,
    });
  };

  const handleUpdateCarousel = async (imageId: string) => {
    if (!selectedEventId) return;
    setIsUpdatingId(imageId);
    try {
      await EventService.updateCarouselImage(selectedEventId, imageId, {
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        category: editForm.category || undefined,
        displayOrder: editForm.displayOrder,
        isActive: editForm.isActive,
      });
      toast({ title: 'Updated', description: 'Carousel image updated successfully' });
      setEditingImageId(null);
      loadCarouselImages(selectedEventId);
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err?.message || 'Failed to update', variant: 'destructive' });
    } finally {
      setIsUpdatingId(null);
    }
  };

  // â”€â”€â”€ Auth guards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#021313] flex items-center justify-center">
        <div className="text-white text-lg">Redirecting...</div>
      </div>
    );
  }
  if (!isAdmin) return <AccessDenied />;

  // â”€â”€â”€ Club dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderClubDropdown = () => (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowClubDropdown((p) => !p);
          setShowEventDropdown(false);
        }}
        className="w-full flex items-center gap-3 bg-[#021313] border border-[#14FFEC]/20 rounded-xl px-3 py-3 hover:border-[#14FFEC]/50 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#0D1F1F] border border-[#14FFEC]/10 flex-shrink-0 flex items-center justify-center">
          {selectedClub && ((selectedClub as any).logoUrl || (selectedClub as any).logo) ? (
            <img
              src={(selectedClub as any).logoUrl || (selectedClub as any).logo}
              alt={selectedClub.name}
              className="w-full h-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          ) : (
            <Building2 className="w-4 h-4 text-[#14FFEC]/40" />
          )}
        </div>
        <span className={`flex-1 text-left text-sm truncate ${selectedClub ? 'text-white font-medium' : 'text-gray-500'}`}>
          {isLoadingClubs ? 'Loading clubs...' : selectedClub ? selectedClub.name : 'Choose a club'}
        </span>
        {isLoadingClubs
          ? <RefreshCw className="w-4 h-4 text-[#14FFEC] animate-spin flex-shrink-0" />
          : <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showClubDropdown ? 'rotate-180' : ''}`} />
        }
      </button>

      {showClubDropdown && !isLoadingClubs && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-xl overflow-hidden z-30 shadow-2xl">
          {clubs.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm text-center">No clubs found</div>
          ) : clubs.map((club) => (
            <button
              key={club.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedClubId(club.id);
                setShowClubDropdown(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#14FFEC]/5 transition-colors text-left ${selectedClubId === club.id ? 'bg-[#14FFEC]/10' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#021313] border border-[#14FFEC]/10 flex-shrink-0 flex items-center justify-center">
                {(club as any).logoUrl || (club as any).logo ? (
                  <img src={(club as any).logoUrl || (club as any).logo} alt={club.name} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-[#14FFEC]/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{club.name}</p>
                {(club as any).category && <p className="text-gray-500 text-xs truncate">{(club as any).category}</p>}
              </div>
              {selectedClubId === club.id && <CheckCircle className="w-4 h-4 text-[#14FFEC] flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // â”€â”€â”€ Event dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderEventDropdown = () => (
    <div className="relative">
      <button
        disabled={!selectedClubId || isLoadingEvents}
        onClick={(e) => {
          e.stopPropagation();
          setShowEventDropdown((p) => !p);
          setShowClubDropdown(false);
        }}
        className="w-full flex items-center gap-3 bg-[#021313] border border-[#14FFEC]/20 rounded-xl px-3 py-3 hover:border-[#14FFEC]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#0D1F1F] border border-[#14FFEC]/10 flex-shrink-0 flex items-center justify-center">
          {selectedEvent?.imageUrl ? (
            <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          ) : (
            <Calendar className="w-4 h-4 text-[#14FFEC]/40" />
          )}
        </div>
        <span className={`flex-1 text-left text-sm truncate ${selectedEvent ? 'text-white font-medium' : 'text-gray-500'}`}>
          {isLoadingEvents
            ? 'Loading events...'
            : !selectedClubId
            ? 'Select a club first'
            : selectedEvent
            ? selectedEvent.title
            : filteredEvents.length === 0
            ? 'No upcoming events available'
            : 'Choose an event'}
        </span>
        {isLoadingEvents
          ? <RefreshCw className="w-4 h-4 text-[#14FFEC] animate-spin flex-shrink-0" />
          : <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showEventDropdown ? 'rotate-180' : ''}`} />
        }
      </button>

      {showEventDropdown && !isLoadingEvents && filteredEvents.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-xl overflow-hidden z-30 shadow-2xl max-h-60 overflow-y-auto">
          {filteredEvents.map((event) => (
            <button
              key={event.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEventId(event.id);
                setShowEventDropdown(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#14FFEC]/5 transition-colors text-left ${selectedEventId === event.id ? 'bg-[#14FFEC]/10' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#021313] border border-[#14FFEC]/10 flex-shrink-0">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-[#14FFEC]/40" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{event.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    event.status === 'UPCOMING' ? 'text-[#14FFEC] bg-[#14FFEC]/10'
                    : event.status === 'ONGOING' ? 'text-green-400 bg-green-500/10'
                    : event.status === 'COMPLETED' ? 'text-gray-400 bg-gray-500/10'
                    : 'text-red-400 bg-red-500/10'
                  }`}>{event.status}</span>
                  <span className="text-gray-500 text-xs">{event.formattedDate || event.startDateTime?.split('T')[0]}</span>
                </div>
              </div>
              {selectedEventId === event.id && <CheckCircle className="w-4 h-4 text-[#14FFEC] flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // â”€â”€â”€ Carousel section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderCarouselSection = () => {
    if (!selectedEvent) return null;
    return (
      <div className="space-y-4">
        {/* Event info strip */}
        <div className="flex items-center gap-3 bg-[#021313] rounded-xl p-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0D1F1F] flex-shrink-0 flex items-center justify-center">
            {selectedEvent.imageUrl ? (
              <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="w-full h-full object-cover" />
            ) : <Calendar className="w-4 h-4 text-[#14FFEC]/40" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{selectedEvent.title}</p>
            <p className="text-gray-600 text-xs mt-0.5 font-mono">ID: {selectedEvent.id}</p>
          </div>
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Images</p>
            <p className="text-gray-500 text-xs">{isLoadingCarousel ? 'Loading...' : `${carouselImages.length} image(s)`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadCarouselImages(selectedEvent.id)}
              disabled={isLoadingCarousel}
              className="p-1.5 rounded-lg bg-[#021313] border border-[#14FFEC]/20 text-[#14FFEC] hover:bg-[#14FFEC]/10 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCarousel ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { setShowUploadForm((p) => !p); setUploadForm(EMPTY_UPLOAD); }}
              className="flex items-center gap-1.5 bg-[#14FFEC] text-black text-sm font-semibold px-3 py-1.5 rounded-xl hover:bg-[#12E6D6] transition-colors"
            >
              {showUploadForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showUploadForm ? 'Cancel' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Upload form */}
        {showUploadForm && (
          <div className="bg-[#021313] rounded-[15px] p-4 border border-[#14FFEC]/20 space-y-3">
            <p className="text-[#14FFEC] font-semibold text-sm">New Carousel Image</p>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#14FFEC]/30 rounded-xl overflow-hidden cursor-pointer hover:border-[#14FFEC]/60 transition-colors"
            >
              {uploadForm.preview ? (
                <div className="relative">
                  <img src={uploadForm.preview} alt="Preview" className="w-full h-44 object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadForm((p) => ({ ...p, file: null, preview: null })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                  ><X className="w-3.5 h-3.5 text-white" /></button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Upload className="w-8 h-8 text-[#14FFEC]/40 mb-2" />
                  <p className="text-gray-400 text-sm">Tap to select image</p>
                  <p className="text-gray-600 text-xs mt-1">PNG Â· JPG Â· WEBP</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>

            <input type="text" placeholder="Title (optional)" value={uploadForm.title}
              onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#14FFEC] text-sm" />

            <input type="text" placeholder="Description (optional)" value={uploadForm.description}
              onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#14FFEC] text-sm" />

            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Category (optional)" value={uploadForm.category}
                onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value }))}
                className="bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#14FFEC] text-sm" />
              <input type="number" min={0} placeholder="Order" value={uploadForm.displayOrder}
                onChange={(e) => setUploadForm((p) => ({ ...p, displayOrder: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#14FFEC] text-sm" />
            </div>

            <button
              onClick={handleUploadCarousel}
              disabled={isUploading || !uploadForm.file}
              className="w-full bg-[#14FFEC] text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#12E6D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? <><RefreshCw className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload Carousel Image</>}
            </button>
          </div>
        )}

        {/* Image list */}
        {isLoadingCarousel ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="w-5 h-5 text-[#14FFEC] animate-spin" />
            <span className="ml-2 text-gray-400 text-sm">Loading images...</span>
          </div>
        ) : carouselImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-[#021313] rounded-[15px] border border-[#14FFEC]/10">
            <ImageIcon className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-gray-400 text-sm">No carousel images yet</p>
            <p className="text-gray-600 text-xs mt-1">Upload images using the button above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {carouselImages.map((img) => (
              <div key={img.id} className="bg-[#021313] rounded-[15px] overflow-hidden border border-[#14FFEC]/10">
                {editingImageId === img.id ? (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-semibold text-sm">Edit Image</span>
                      <button
                        onClick={() => setEditingImageId(null)}
                        className="p-1 rounded hover:bg-[#14FFEC]/10 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Title (optional)"
                      value={editForm.title}
                      onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#14FFEC] text-sm"
                    />

                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={editForm.description}
                      onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                      className="w-full bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#14FFEC] text-sm"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Category (optional)"
                        value={editForm.category}
                        onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                        className="bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#14FFEC] text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Order"
                        value={editForm.displayOrder}
                        onChange={(e) => setEditForm((p) => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                        className="bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#14FFEC] text-sm"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
                        className="rounded border-[#14FFEC]/20 bg-[#0D1F1F] text-[#14FFEC] focus:ring-[#14FFEC]"
                      />
                      <span className="text-white text-sm">Active</span>
                    </label>

                    <button
                      onClick={() => handleUpdateCarousel(img.id)}
                      disabled={isUpdatingId === img.id}
                      className="w-full bg-[#14FFEC] text-black font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[#12E6D6] transition-colors disabled:opacity-50"
                    >
                      {isUpdatingId === img.id ? <><RefreshCw className="w-4 h-4 animate-spin" />Updating...</> : <>Save Changes</>}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <img
                        src={img.imageUrl}
                        alt={img.title || 'Carousel image'}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-64 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzBEMUYxRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2NjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+'; }}
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${img.isActive ? 'bg-green-500/80 text-white' : 'bg-gray-700/80 text-gray-300'}`}>
                          {img.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-black/60 text-[#14FFEC] font-semibold">#{img.displayOrder}</span>
                      </div>
                    </div>
                    <div className="p-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {img.title && <p className="text-white text-sm font-medium truncate">{img.title}</p>}
                        {img.description && <p className="text-gray-400 text-xs truncate mt-0.5">{img.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {img.category && <span className="text-[#14FFEC] text-xs bg-[#14FFEC]/10 px-1.5 py-0.5 rounded">{img.category}</span>}
                          <span className="text-gray-600 text-xs font-mono">{img.id.slice(-8)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditCarousel(img)}
                          className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCarousel(img.id)}
                          disabled={isDeletingId === img.id}
                          className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {isDeletingId === img.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // â”€â”€â”€ Main render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div
      className="min-h-screen bg-[#021313]"
      onClick={() => { setShowClubDropdown(false); setShowEventDropdown(false); }}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#021313] border-b border-[#14FFEC]/10 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#14FFEC] font-bold text-lg">Admin</span>
            <span className="bg-[#14FFEC]/10 text-[#14FFEC] text-xs px-2 py-0.5 rounded-full font-medium">ROLE_ADMIN</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); loadClubs(); }}
            disabled={isLoadingClubs}
            className="p-1.5 rounded-lg text-[#14FFEC] hover:bg-[#14FFEC]/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingClubs ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Access Navigation */}
      <div className="sticky top-11 z-9 bg-[#021313]/80 backdrop-blur border-b border-[#14FFEC]/10 px-4 py-2">
        <div className="max-w-lg mx-auto flex items-center gap-2 overflow-x-auto">
          <Link
            href="/admin/contact-form-api"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#14FFEC]/10 hover:bg-[#14FFEC]/20 rounded-lg text-[#14FFEC] text-xs font-medium transition-colors whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" />
            API Docs
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4" onClick={(e) => e.stopPropagation()}>

        {/* Step 1 â€” Club */}
        <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-[#14FFEC]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#14FFEC] text-xs font-bold">1</span>
            </div>
            <span className="text-white font-semibold text-sm">Select Club</span>
            {clubs.length > 0 && <span className="ml-auto text-gray-500 text-xs">{clubs.length} club(s)</span>}
          </div>
          {renderClubDropdown()}
        </div>

        {/* Step 2 â€” Event */}
        <div className={`bg-[#0D1F1F] rounded-[15px] p-4 border transition-colors ${selectedClubId ? 'border-[#14FFEC]/10' : 'border-[#14FFEC]/05 opacity-60'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${selectedClubId ? 'bg-[#14FFEC]/20' : 'bg-gray-700'}`}>
              <span className={`text-xs font-bold ${selectedClubId ? 'text-[#14FFEC]' : 'text-gray-500'}`}>2</span>
            </div>
            <span className={`font-semibold text-sm ${selectedClubId ? 'text-white' : 'text-gray-500'}`}>Select Event</span>
            {selectedClubId && events.length > 0 && <span className="ml-auto text-gray-500 text-xs">{events.length} event(s)</span>}
          </div>
          {renderEventDropdown()}
        </div>

        {/* Step 3 â€” Carousel */}
        {selectedEvent ? (
          <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-[#14FFEC]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#14FFEC] text-xs font-bold">3</span>
              </div>
              <span className="text-white font-semibold text-sm">Carousel Images</span>
            </div>
            {renderCarouselSection()}
          </div>
        ) : (
          <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/05 opacity-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 text-xs font-bold">3</span>
              </div>
              <span className="text-gray-500 font-semibold text-sm">Carousel Images</span>
            </div>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <ImageIcon className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-gray-600 text-sm">Select an event to manage its carousel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
