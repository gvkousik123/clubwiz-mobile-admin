'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit3, Trash2, Tag, Calendar, Percent, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { OffersService, ClubOffer } from '@/lib/services/offers.service';
import { ClubService } from '@/lib/services/club.service';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';

export default function ManageOffersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [offers, setOffers] = useState<ClubOffer[]>([]);
    const [clubId, setClubId] = useState<string>('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<ClubOffer | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        offerType: 'PERCENTAGE_DISCOUNT',
        discountPercentage: '',
        discountAmount: '',
        promoCode: '',
        minimumAmount: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        isActive: true
    });

    // Fetch club ID and offers on mount
    useEffect(() => {
        const fetchClubAndOffers = async () => {
            try {
                setIsLoading(true);
                // FIXED: #2 — Use getMyClubs (user-scoped) instead of getAllClubsAdmin (admin-only)
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

                    // Fetch offers for this club
                    const offersResponse = await OffersService.getClubOffers(club.id);
                    if (offersResponse.success) {
                        setOffers(offersResponse.data || []);
                        console.log('✅ Offers loaded:', offersResponse.data);
                    } else {
                        console.warn('⚠️ Failed to load offers, but continuing');
                        setOffers([]);
                    }
                } else {
                    toast({
                        title: "No Club Found",
                        description: "Please create a club first before managing offers.",
                        variant: "destructive",
                    });
                    router.push('/bz/business');
                }
            } catch (error) {
                console.error('❌ Error fetching data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load club information",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchClubAndOffers();
    }, [toast, router]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            offerType: 'PERCENTAGE_DISCOUNT',
            discountPercentage: '',
            discountAmount: '',
            promoCode: '',
            minimumAmount: '',
            usageLimit: '',
            startDate: '',
            endDate: '',
            isActive: true
        });
    };

    const isOfferCurrentlyActive = (offer: ClubOffer): boolean => {
        if (!offer.isActive) return false;
        if (!offer.startDate || !offer.endDate) return true;

        const now = new Date();
        const startDate = new Date(offer.startDate);
        const endDate = new Date(offer.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return offer.isActive;
        }

        return now >= startDate && now <= endDate;
    };

    const handleAddOffer = async () => {
        if (!formData.title.trim() || !formData.description.trim()) {
            toast({
                title: "Error",
                description: "Title and description are required",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            const offerData = {
                title: formData.title,
                description: formData.description,
                offerType: formData.offerType,
                discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : undefined,
                discountAmount: formData.discountAmount ? Number(formData.discountAmount) : undefined,
                promoCode: formData.promoCode || undefined,
                minimumAmount: formData.minimumAmount ? Number(formData.minimumAmount) : undefined,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
                startDate: formData.startDate,
                endDate: formData.endDate,
                isActive: formData.isActive
            };

            const response = await OffersService.createOffer(clubId, offerData);
            if (response.success && response.data) {
                setOffers(prev => [...prev, response.data]);
                setShowAddDialog(false);
                resetForm();
                toast({
                    title: "Success",
                    description: "Offer created successfully!",
                });
            } else {
                toast({
                    title: "Error",
                    description: response.error || "Failed to create offer",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('❌ Error creating offer:', error);
            toast({
                title: "Error",
                description: "Failed to create offer",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateOffer = async () => {
        if (!selectedOffer) return;

        setIsSaving(true);
        try {
            const offerData = {
                title: formData.title,
                description: formData.description,
                offerType: formData.offerType,
                discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : undefined,
                discountAmount: formData.discountAmount ? Number(formData.discountAmount) : undefined,
                promoCode: formData.promoCode || undefined,
                minimumAmount: formData.minimumAmount ? Number(formData.minimumAmount) : undefined,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
                startDate: formData.startDate,
                endDate: formData.endDate,
                isActive: formData.isActive
            };

            const response = await OffersService.updateOffer(clubId, selectedOffer.id!, offerData);
            if (response.success && response.data) {
                setOffers(prev => prev.map(o => o.id === selectedOffer.id ? response.data : o));
                setShowEditDialog(false);
                setSelectedOffer(null);
                resetForm();
                toast({
                    title: "Success",
                    description: "Offer updated successfully!",
                });
            } else {
                toast({
                    title: "Error",
                    description: response.error || "Failed to update offer",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('❌ Error updating offer:', error);
            toast({
                title: "Error",
                description: "Failed to update offer",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOffer = async () => {
        if (!selectedOffer) return;

        setIsSaving(true);
        try {
            const response = await OffersService.deleteOffer(clubId, selectedOffer.id!);
            if (response.success) {
                setOffers(prev => prev.filter(o => o.id !== selectedOffer.id));
                setShowDeleteDialog(false);
                setSelectedOffer(null);
                toast({
                    title: "Success",
                    description: "Offer deleted successfully!",
                });
            } else {
                toast({
                    title: "Error",
                    description: response.error || "Failed to delete offer",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('❌ Error deleting offer:', error);
            toast({
                title: "Error",
                description: "Failed to delete offer",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const openEditDialog = (offer: ClubOffer) => {
        setSelectedOffer(offer);
        setFormData({
            title: offer.title,
            description: offer.description,
            offerType: offer.offerType,
            discountPercentage: offer.discountPercentage?.toString() || '',
            discountAmount: offer.discountAmount?.toString() || '',
            promoCode: offer.promoCode || '',
            minimumAmount: offer.minimumAmount?.toString() || '',
            usageLimit: offer.usageLimit?.toString() || '',
            startDate: offer.startDate,
            endDate: offer.endDate,
            isActive: isOfferCurrentlyActive(offer)
        });
        setShowEditDialog(true);
    };

    const openDeleteDialog = (offer: ClubOffer) => {
        setSelectedOffer(offer);
        setShowDeleteDialog(true);
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
            <div className="fixed top-0 left-0 right-0 z-30 flex flex-col pt-8 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="px-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="text-white">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-lg font-medium">Manage Offers</h2>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowAddDialog(true); }}
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
                {offers.length === 0 ? (
                    <div className="text-center py-12">
                        <Tag className="w-16 h-16 text-[#14FFEC] mx-auto mb-4" />
                        <p className="text-white/60">No offers yet</p>
                        <p className="text-white/40 text-sm mt-2">Create your first offer to attract customers</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {offers.map((offer) => (
                            <div
                                key={offer.id}
                                className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-white font-semibold text-lg">{offer.title}</h3>
                                            {isOfferCurrentlyActive(offer) ? (
                                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">Inactive</span>
                                            )}
                                        </div>
                                        <p className="text-white/70 text-sm">{offer.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditDialog(offer)}
                                            className="p-2 bg-[#005D5C] rounded-full hover:bg-[#007875] transition-colors"
                                        >
                                            <Edit3 size={16} className="text-[#14FFEC]" />
                                        </button>
                                        <button
                                            onClick={() => openDeleteDialog(offer)}
                                            className="p-2 bg-red-600/60 rounded-full hover:bg-red-600/80 transition-colors"
                                        >
                                            <Trash2 size={16} className="text-red-300" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    {offer.offerType === 'PERCENTAGE_DISCOUNT' && offer.discountPercentage && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Percent size={14} className="text-[#14FFEC]" />
                                            <span className="text-white/80">{offer.discountPercentage}% off</span>
                                        </div>
                                    )}
                                    {offer.discountAmount && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <DollarSign size={14} className="text-[#14FFEC]" />
                                            <span className="text-white/80">₹{offer.discountAmount} off</span>
                                        </div>
                                    )}
                                    {offer.promoCode && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Tag size={14} className="text-[#14FFEC]" />
                                            <span className="text-white/80">{offer.promoCode}</span>
                                        </div>
                                    )}
                                    {offer.minimumAmount && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <DollarSign size={14} className="text-[#14FFEC]" />
                                            <span className="text-white/80">Min: ₹{offer.minimumAmount}</span>
                                        </div>
                                    )}
                                    {offer.usageLimit && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Tag size={14} className="text-[#14FFEC]" />
                                            <span className="text-white/80">Limit: {offer.usageLimit}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-3 text-xs text-white/60">
                                    <Calendar size={12} />
                                    <span>{new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Offer Dialog */}
            {(showAddDialog || showEditDialog) && (
                <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
                    if (!open) {
                        setShowAddDialog(false);
                        setShowEditDialog(false);
                        setSelectedOffer(null);
                        resetForm();
                    }
                }}>
                    <DialogOverlay className="bg-black/80" />
                    <DialogContent className="bg-[#0D1F1F] border border-[#14FFEC]/20 text-white max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{showAddDialog ? 'Add New Offer' : 'Edit Offer'}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-[#14FFEC] mb-1 block">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                    placeholder="e.g., Happy Hour Special"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-[#14FFEC] mb-1 block">Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none min-h-[60px]"
                                    placeholder="Describe the offer..."
                                />
                            </div>

                            <div>
                                <label className="text-sm text-[#14FFEC] mb-1 block">Offer Type</label>
                                <select
                                    value={formData.offerType}
                                    onChange={(e) => handleInputChange('offerType', e.target.value)}
                                    className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                >
                                    <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
                                    <option value="FIXED_DISCOUNT">Fixed Discount</option>
                                    <option value="BUY_ONE_GET_ONE">Buy 1 Get 1</option>
                                    <option value="FREE_ENTRY">Free Entry</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-[#14FFEC] mb-1 block">Discount %</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.discountPercentage}
                                        onChange={(e) => handleInputChange('discountPercentage', Math.max(0, parseInt(e.target.value) || 0).toString())}
                                        className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-[#14FFEC] mb-1 block">Discount ₹</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.discountAmount}
                                        onChange={(e) => handleInputChange('discountAmount', Math.max(0, parseInt(e.target.value) || 0).toString())}
                                        className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-[#14FFEC] mb-1 block">Promo Code</label>
                                    <input
                                        type="text"
                                        value={formData.promoCode}
                                        onChange={(e) => handleInputChange('promoCode', e.target.value)}
                                        className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                        placeholder="HAPPY50"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-[#14FFEC] mb-1 block">Min Amount ₹</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.minimumAmount}
                                        onChange={(e) => handleInputChange('minimumAmount', Math.max(0, parseInt(e.target.value) || 0).toString())}
                                        className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-[#14FFEC] mb-1 block">Usage Limit</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.usageLimit}
                                        onChange={(e) => handleInputChange('usageLimit', Math.max(1, parseInt(e.target.value) || 1).toString())}
                                        className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                        placeholder="1"
                                    />
                                </div>
                                <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-[#14FFEC] mb-1 block">Start Date</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                                        className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-[#14FFEC] mb-1 block">End Date</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endDate}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                                        className="w-full bg-[#021313] text-white rounded-lg px-3 py-2 text-sm border border-[#14FFEC]/30 focus:border-[#14FFEC] outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm text-white">Active</label>
                                <div
                                    onClick={() => handleInputChange('isActive', !formData.isActive)}
                                    className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${formData.isActive ? 'bg-[#14FFEC]' : 'bg-gray-600'}`}
                                >
                                    <div className={`w-4 h-4 bg-black rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddDialog(false);
                                    setShowEditDialog(false);
                                    setSelectedOffer(null);
                                    resetForm();
                                }}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-full font-bold hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={showAddDialog ? handleAddOffer : handleUpdateOffer}
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 bg-[#14FFEC] text-black rounded-full font-bold hover:bg-[#10d4c4] transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : (showAddDialog ? 'Create Offer' : 'Update Offer')}
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <Dialog open={showDeleteDialog} onOpenChange={(open) => {
                    if (!open) {
                        setShowDeleteDialog(false);
                        setSelectedOffer(null);
                    }
                }}>
                    <DialogOverlay className="bg-black/80" />
                    <DialogContent className="bg-[#0D1F1F] border border-[#14FFEC]/20 text-white max-w-md">
                        <h3 className="text-xl font-bold mb-4">Delete Offer</h3>
                        <p className="text-white/80 mb-6">
                            Are you sure you want to delete "{selectedOffer?.title}"? This action cannot be undone.
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



