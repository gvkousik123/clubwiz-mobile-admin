'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit3, Trash2, Tag, Calendar, Percent, IndianRupee } from 'lucide-react';
import { useState, useEffect } from 'react';
import { OffersService, ClubOffer } from '@/lib/services/offers.service';
import { ClubService } from '@/lib/services/club.service';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import {
    OfferComposer,
    OfferFormValues,
    EMPTY_OFFER,
    toLocalInput,
} from '@/components/offers/offer-composer';

/**
 * Where an offer sits relative to its window right now (display only).
 * 'expired' is decided by the actual end date AND time, not just the day.
 * 'draft' means the offer is switched off, regardless of its dates.
 */
type OfferStatus = 'live' | 'scheduled' | 'expired' | 'draft';

const getOfferStatus = (offer: ClubOffer): OfferStatus => {
    if (!offer.isActive) return 'draft';
    if (!offer.startDate || !offer.endDate) return 'live';

    const now = new Date();
    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 'live';

    if (now.getTime() > endDate.getTime()) return 'expired';
    if (now.getTime() < startDate.getTime()) return 'scheduled';
    return 'live';
};

// Live first, then scheduled, then expired, then drafts.
const STATUS_ORDER: Record<OfferStatus, number> = { live: 0, scheduled: 1, expired: 2, draft: 3 };

const STATUS_FILTERS: { value: OfferStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'live', label: 'Live' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'expired', label: 'Expired' },
    { value: 'draft', label: 'Draft' },
];

export default function ManageOffersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [offers, setOffers] = useState<ClubOffer[]>([]);
    const [clubId, setClubId] = useState<string>('');
    const [composerMode, setComposerMode] = useState<'create' | 'edit' | null>(null);
    const [composerValues, setComposerValues] = useState<OfferFormValues>(EMPTY_OFFER);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<ClubOffer | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState<OfferStatus | 'all'>('all');

    // Fetch club ID and offers on mount
    useEffect(() => {
        const fetchClubAndOffers = async () => {
            try {
                setIsLoading(true);
                const rawClubsResponse = await ClubService.getMyClubs();
                let clubsData: any[] = [];
                if (Array.isArray(rawClubsResponse)) {
                    clubsData = rawClubsResponse;
                } else if (rawClubsResponse && typeof rawClubsResponse === 'object' && 'data' in rawClubsResponse) {
                    clubsData = (rawClubsResponse as any).data || [];
                }

                if (clubsData && clubsData.length > 0) {
                    const club = clubsData[0];
                    setClubId(club.id);

                    const offersResponse = await OffersService.getClubOffers(club.id);
                    if (offersResponse.success) {
                        setOffers(offersResponse.data || []);
                    } else {
                        console.warn('⚠️ Failed to load offers, but continuing');
                        setOffers([]);
                    }
                } else {
                    toast({
                        title: 'No Club Found',
                        description: 'Please create a club first before managing offers.',
                        variant: 'destructive',
                    });
                    router.push('/bz/business');
                }
            } catch (error) {
                console.error('❌ Error fetching data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load club information',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchClubAndOffers();
    }, [toast, router]);

    const sortedOffers = [...offers].sort((a, b) => {
        const rank = STATUS_ORDER[getOfferStatus(a)] - STATUS_ORDER[getOfferStatus(b)];
        if (rank !== 0) return rank;
        // Within a group: soonest start first, so the next thing to go live is on top.
        const aStart = a.startDate ? new Date(a.startDate).getTime() : 0;
        const bStart = b.startDate ? new Date(b.startDate).getTime() : 0;
        if (isNaN(aStart) || isNaN(bStart)) return 0;
        return aStart - bStart;
    });

    const statusCounts = offers.reduce((acc, offer) => {
        const s = getOfferStatus(offer);
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {} as Record<OfferStatus, number>);

    const visibleOffers = statusFilter === 'all'
        ? sortedOffers
        : sortedOffers.filter(offer => getOfferStatus(offer) === statusFilter);

    const buildPayload = (values: OfferFormValues) => ({
        title: values.title.trim(),
        description: values.description.trim(),
        offerType: values.offerType,
        discountPercentage: values.discountPercentage ? Number(values.discountPercentage) : undefined,
        discountAmount: values.discountAmount ? Number(values.discountAmount) : undefined,
        promoCode: values.promoCode.trim() || undefined,
        minimumAmount: values.minimumAmount ? Number(values.minimumAmount) : undefined,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
        startDate: values.startDate,
        endDate: values.endDate,
        isActive: values.isActive,
    });

    const closeComposer = () => {
        setComposerMode(null);
        setSelectedOffer(null);
        setComposerValues(EMPTY_OFFER);
    };

    const handleComposerSubmit = async (values: OfferFormValues) => {
        setIsSaving(true);
        try {
            const payload = buildPayload(values);

            if (composerMode === 'create') {
                const response = await OffersService.createOffer(clubId, payload);
                if (response.success && response.data) {
                    setOffers(prev => [...prev, response.data as ClubOffer]);
                    closeComposer();
                    toast({ title: 'Success', description: 'Offer created successfully!' });
                } else {
                    toast({
                        title: 'Error',
                        description: response.error || 'Failed to create offer',
                        variant: 'destructive',
                    });
                }
            } else if (composerMode === 'edit' && selectedOffer?.id) {
                const response = await OffersService.updateOffer(clubId, selectedOffer.id, payload);
                if (response.success && response.data) {
                    const updated = response.data as ClubOffer;
                    setOffers(prev => prev.map(o => (o.id === selectedOffer.id ? updated : o)));
                    closeComposer();
                    toast({ title: 'Success', description: 'Offer updated successfully!' });
                } else {
                    toast({
                        title: 'Error',
                        description: response.error || 'Failed to update offer',
                        variant: 'destructive',
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error saving offer:', error);
            toast({ title: 'Error', description: 'Failed to save offer', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOffer = async () => {
        if (!selectedOffer?.id) return;

        setIsSaving(true);
        try {
            const response = await OffersService.deleteOffer(clubId, selectedOffer.id);
            if (response.success) {
                setOffers(prev => prev.filter(o => o.id !== selectedOffer.id));
                setShowDeleteDialog(false);
                setSelectedOffer(null);
                toast({ title: 'Success', description: 'Offer deleted successfully!' });
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to delete offer',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('❌ Error deleting offer:', error);
            toast({ title: 'Error', description: 'Failed to delete offer', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const openCreate = () => {
        setSelectedOffer(null);
        setComposerValues(EMPTY_OFFER);
        setComposerMode('create');
    };

    const openEdit = (offer: ClubOffer) => {
        const start = offer.startDate ? new Date(offer.startDate) : null;
        const end = offer.endDate ? new Date(offer.endDate) : null;

        setSelectedOffer(offer);
        setComposerValues({
            title: offer.title || '',
            description: offer.description || '',
            offerType: offer.offerType || 'PERCENTAGE_DISCOUNT',
            discountPercentage: offer.discountPercentage?.toString() || '',
            discountAmount: offer.discountAmount?.toString() || '',
            promoCode: offer.promoCode || '',
            minimumAmount: offer.minimumAmount?.toString() || '',
            usageLimit: offer.usageLimit?.toString() || '',
            startDate: start && !isNaN(start.getTime()) ? toLocalInput(start) : '',
            endDate: end && !isNaN(end.getTime()) ? toLocalInput(end) : '',
            // The stored flag — NOT whether the window happens to be open right now.
            isActive: offer.isActive ?? true,
        });
        setComposerMode('edit');
    };

    const openDeleteDialog = (offer: ClubOffer) => {
        setSelectedOffer(offer);
        setShowDeleteDialog(true);
    };

    const formatRange = (offer: ClubOffer) => {
        const start = new Date(offer.startDate);
        const end = new Date(offer.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'No schedule set';
        const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' };
        return `${start.toLocaleString('en-IN', opts)} — ${end.toLocaleString('en-IN', opts)}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center">
                <div className="text-[#14FFEC] text-lg">Loading offers...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] text-white">
            {/* Header */}
            <div className="fixed top-0 app-bar z-30 flex flex-col pt-8 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="px-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="text-white">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-lg font-medium">Manage Offers</h2>
                        </div>
                        <button
                            onClick={openCreate}
                            className="bg-[#14FFEC] text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Offer
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pt-[160px] px-6 pb-6">
                <div className="max-w-4xl mx-auto w-full">
                    {offers.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {STATUS_FILTERS.map(f => {
                                const count = f.value === 'all' ? offers.length : (statusCounts[f.value] || 0);
                                const active = statusFilter === f.value;
                                return (
                                    <button
                                        key={f.value}
                                        type="button"
                                        onClick={() => setStatusFilter(f.value)}
                                        aria-pressed={active}
                                        className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active
                                            ? 'border-[#14FFEC] bg-[#14FFEC] text-black'
                                            : 'border-[#14FFEC]/25 bg-[#0D1F1F] text-white/70'
                                            }`}
                                    >
                                        {f.label} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {offers.length === 0 ? (
                        <div className="text-center py-12">
                            <Tag className="w-16 h-16 text-[#14FFEC] mx-auto mb-4" />
                            <p className="text-white/60">No offers yet</p>
                            <p className="text-white/40 text-sm mt-2">Create your first offer to attract customers</p>
                        </div>
                    ) : visibleOffers.length === 0 ? (
                        <div className="text-center py-12">
                            <Tag className="w-16 h-16 text-[#14FFEC]/50 mx-auto mb-4" />
                            <p className="text-white/60">No {statusFilter} offers</p>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className="text-[#14FFEC] text-sm mt-2 underline"
                            >
                                Show all offers
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {visibleOffers.map(offer => (
                                <div key={offer.id} className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="text-white font-semibold text-lg">{offer.title}</h3>
                                                {(() => {
                                                    const status = getOfferStatus(offer);
                                                    if (status === 'live') return (
                                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                            Live now
                                                        </span>
                                                    );
                                                    if (status === 'scheduled') return (
                                                        <span className="px-2 py-1 bg-[#14FFEC]/15 text-[#14FFEC] text-xs rounded-full">
                                                            Scheduled
                                                        </span>
                                                    );
                                                    if (status === 'expired') return (
                                                        <span className="px-2 py-1 bg-orange-500/15 text-orange-400 text-xs rounded-full">
                                                            Expired
                                                        </span>
                                                    );
                                                    return (
                                                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                                                            Draft
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <p className="text-white/70 text-sm">{offer.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => openEdit(offer)}
                                                aria-label="Edit offer"
                                                className="p-2 bg-[#005D5C] rounded-full hover:bg-[#007875] transition-colors"
                                            >
                                                <Edit3 size={16} className="text-[#14FFEC]" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteDialog(offer)}
                                                aria-label="Delete offer"
                                                className="p-2 bg-red-600/60 rounded-full hover:bg-red-600/80 transition-colors"
                                            >
                                                <Trash2 size={16} className="text-red-300" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
                                        {offer.offerType === 'PERCENTAGE_DISCOUNT' && !!offer.discountPercentage && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Percent size={14} className="text-[#14FFEC]" />
                                                <span className="text-white/80">{offer.discountPercentage}% off</span>
                                            </div>
                                        )}
                                        {offer.offerType === 'FIXED_DISCOUNT' && !!offer.discountAmount && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <IndianRupee size={14} className="text-[#14FFEC]" />
                                                <span className="text-white/80">{offer.discountAmount} off</span>
                                            </div>
                                        )}
                                        {!!offer.promoCode && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Tag size={14} className="text-[#14FFEC]" />
                                                <span className="text-white/80">{offer.promoCode}</span>
                                            </div>
                                        )}
                                        {!!offer.minimumAmount && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <IndianRupee size={14} className="text-[#14FFEC]" />
                                                <span className="text-white/80">Min: {offer.minimumAmount}</span>
                                            </div>
                                        )}
                                        {!!offer.usageLimit && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Tag size={14} className="text-[#14FFEC]" />
                                                <span className="text-white/80">Limit: {offer.usageLimit}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-3 text-xs text-white/60">
                                        <Calendar size={12} />
                                        <span>{formatRange(offer)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit composer */}
            <OfferComposer
                open={composerMode !== null}
                mode={composerMode ?? 'create'}
                initialValues={composerValues}
                isSaving={isSaving}
                onCancel={closeComposer}
                onSubmit={handleComposerSubmit}
            />

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <Dialog
                    open={showDeleteDialog}
                    onOpenChange={open => {
                        if (!open) {
                            setShowDeleteDialog(false);
                            setSelectedOffer(null);
                        }
                    }}
                >
                    <DialogOverlay className="bg-black/80" />
                    <DialogContent className="bg-[#0D1F1F] border border-[#14FFEC]/20 text-white max-w-md">
                        <h3 className="text-xl font-bold mb-4">Delete Offer</h3>
                        <p className="text-white/80 mb-6">
                            Are you sure you want to delete &quot;{selectedOffer?.title}&quot;? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteDialog(false);
                                    setSelectedOffer(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-full font-bold hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteOffer}
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
