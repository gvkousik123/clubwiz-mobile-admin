'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Video, Eye, EyeOff, Edit2, Trash2, RefreshCw, ExternalLink, Upload } from 'lucide-react';
import { RunningAdsService, RunningAd, CreateRunningAdRequest } from '@/lib/services/running-ads.service';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64 } from '@/lib/image-utils';
import Image from 'next/image';

export default function RunningAdsPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [ads, setAds] = useState<RunningAd[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    
    // Form state
    const [formData, setFormData] = useState<CreateRunningAdRequest>({
        mediaBase64: '',
        mediaType: 'IMAGE',
        fileName: '',
        title: '',
        subtitle: '',
        badgeLabel: '',
        placement: 'HOME_HERO',
        displayOrder: 0,
        isActive: true,
        startDateTime: new Date().toISOString(),
        endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        linkType: 'NONE',
        linkTarget: '',
        ctaText: ''
    });

    useEffect(() => {
        loadAds();
    }, []);

    const loadAds = async () => {
        setIsLoading(true);
        try {
            const response = await RunningAdsService.getAllAds();
            console.log('📦 Load ads response:', response);
            
            // Handle both wrapped and unwrapped responses
            const responseAny = response as any;
            if (response.success && response.data) {
                // Standard ApiResponse format
                const adsData = response.data.ads || response.data;
                setAds(Array.isArray(adsData) ? adsData : []);
            } else if (responseAny.ads) {
                // Direct response format (no wrapper)
                setAds(responseAny.ads);
            } else if (Array.isArray(responseAny)) {
                // Direct array response
                setAds(responseAny);
            }
        } catch (error: any) {
            console.error('Failed to load ads:', error);
            
            // Check for 403 Forbidden - token expired
            if (error.response?.status === 403) {
                toast({
                    title: 'Session Expired',
                    description: 'Your session has expired. Please login again.',
                    variant: 'destructive'
                });
                setTimeout(() => {
                    router.push('/bz/auth/login');
                }, 2000);
                return;
            }
            
            toast({
                title: 'Error',
                description: 'Failed to load running ads',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.mediaBase64) {
            toast({
                title: 'Validation Error',
                description: 'Title and Media are required',
                variant: 'destructive'
            });
            return;
        }

        setIsCreating(true);
        try {
            const response = await RunningAdsService.createAd(formData);
            
            // Check for successful creation (201 or 200)
            if (response.success) {
                toast({
                    title: '✅ Ad Created!',
                    description: 'Running ad created successfully',
                });
                
                // Close form and reset
                setShowCreateForm(false);
                resetForm();
                
                // Reload ads list
                await loadAds();
            }
        } catch (error: any) {
            console.error('Create ad error:', error);
            
            // Check for 403 Forbidden - token expired
            if (error.response?.status === 403) {
                toast({
                    title: 'Session Expired',
                    description: 'Your session has expired. Please login again.',
                    variant: 'destructive'
                });
                setTimeout(() => {
                    router.push('/bz/auth/login');
                }, 2000);
                return;
            }
            
            toast({
                title: 'Error',
                description: error.response?.data?.message || error.message || 'Failed to create ad',
                variant: 'destructive'
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await RunningAdsService.toggleStatus(id, !currentStatus);
            
            // Show success toast
            toast({
                title: currentStatus ? '❌ Deactivated' : '✅ Activated',
                description: `Ad ${currentStatus ? 'deactivated' : 'activated'} successfully`,
            });
            
            // Reload ads to reflect changes
            await loadAds();
        } catch (error: any) {
            // Check for 403 Forbidden - token expired
            if (error.response?.status === 403) {
                toast({
                    title: 'Session Expired',
                    description: 'Your session has expired. Please login again.',
                    variant: 'destructive'
                });
                setTimeout(() => {
                    router.push('/bz/auth/login');
                }, 2000);
                return;
            }
            
            toast({
                title: 'Error',
                description: 'Failed to toggle ad status',
                variant: 'destructive'
            });
        }
    };

    const handleEdit = (ad: RunningAd) => {
        setEditingId(ad.id);
        setFormData({
            mediaBase64: '', // Will need to re-upload image
            mediaType: ad.mediaType,
            fileName: '',
            title: ad.title,
            subtitle: ad.subtitle,
            badgeLabel: ad.badgeLabel,
            placement: ad.placement,
            displayOrder: ad.displayOrder,
            isActive: ad.isActive,
            startDateTime: ad.startDateTime,
            endDateTime: ad.endDateTime,
            linkType: ad.linkType,
            linkTarget: ad.linkTarget,
            ctaText: ad.ctaText
        });
        setImagePreview(ad.mediaUrl); // Show existing image
        setShowCreateForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        
        if (!formData.title || (!formData.mediaBase64 && !imagePreview)) {
            toast({
                title: 'Validation Error',
                description: 'Title and Media are required',
                variant: 'destructive'
            });
            return;
        }

        setIsCreating(true);
        try {
            const response = await RunningAdsService.updateAd(editingId, formData);
            
            toast({
                title: '✅ Ad Updated!',
                description: 'Running ad updated successfully',
            });
            
            setShowCreateForm(false);
            resetForm();
            await loadAds();
        } catch (error: any) {
            console.error('Update ad error:', error);
            
            if (error.response?.status === 403) {
                toast({
                    title: 'Session Expired',
                    description: 'Your session has expired. Please login again.',
                    variant: 'destructive'
                });
                setTimeout(() => {
                    router.push('/bz/auth/login');
                }, 2000);
                return;
            }
            
            toast({
                title: 'Error',
                description: error.response?.data?.message || error.message || 'Failed to update ad',
                variant: 'destructive'
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ad?')) return;

        try {
            await RunningAdsService.deleteAd(id);
            
            // Show success toast
            toast({
                title: '🗑️ Deleted',
                description: 'Ad deleted successfully',
            });
            
            // Remove from UI immediately
            setAds(prevAds => prevAds.filter(ad => ad.id !== id));
        } catch (error: any) {
            // Check for 403 Forbidden - token expired
            if (error.response?.status === 403) {
                toast({
                    title: 'Session Expired',
                    description: 'Your session has expired. Please login again.',
                    variant: 'destructive'
                });
                setTimeout(() => {
                    router.push('/bz/auth/login');
                }, 2000);
                return;
            }
            
            toast({
                title: 'Error',
                description: 'Failed to delete ad',
                variant: 'destructive'
            });
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid File',
                description: 'Please select an image file',
                variant: 'destructive'
            });
            return;
        }

        try {
            const base64 = await fileToBase64(file);
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
            setFormData({
                ...formData,
                mediaBase64: base64,
                fileName: file.name
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to process image',
                variant: 'destructive'
            });
        }
    };

    const resetForm = () => {
        setFormData({
            mediaBase64: '',
            mediaType: 'IMAGE',
            fileName: '',
            title: '',
            subtitle: '',
            badgeLabel: '',
            placement: 'HOME_HERO',
            displayOrder: 0,
            isActive: true,
            startDateTime: new Date().toISOString(),
            endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            linkType: 'NONE',
            linkTarget: '',
            ctaText: ''
        });
        setEditingId(null);
        setSelectedFile(null);
        setImagePreview(null);
    };

    return (
        <div className="min-h-screen bg-[#021313] flex justify-center items-center md:py-8">
            <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[850px] relative md:rounded-[2.5rem] md:border border-white/10 shadow-2xl bg-[#021313] flex flex-col">
                
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-b from-purple-600/20 to-[#021313] border-b border-purple-500/20 px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={() => router.back()}
                            className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 transition-all"
                        >
                            <ArrowLeft size={22} />
                        </button>
                        <h1 className="font-['Anton_SC'] text-xl tracking-[0.2em] text-white/90">
                            <span className="text-purple-400">ADS</span>
                        </h1>
                        <button
                            onClick={loadAds}
                            disabled={isLoading}
                            className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 transition-all"
                        >
                            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <p className="text-purple-300/60 text-xs text-center">Manage hero advertisements</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                    
                    {/* Create Button */}
                    {!showCreateForm && (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
                        >
                            <Plus size={20} />
                            Create New Ad
                        </button>
                    )}

                    {/* Filter Buttons */}
                    {!showCreateForm && ads.length > 0 && (
                        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    filterStatus === 'all' 
                                    ? 'bg-purple-500 text-white' 
                                    : 'text-white/40 hover:text-white'
                                }`}
                            >
                                All ({ads.length})
                            </button>
                            <button
                                onClick={() => setFilterStatus('active')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    filterStatus === 'active' 
                                    ? 'bg-green-500 text-white' 
                                    : 'text-white/40 hover:text-white'
                                }`}
                            >
                                Active ({ads.filter(ad => ad.isActive).length})
                            </button>
                            <button
                                onClick={() => setFilterStatus('inactive')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    filterStatus === 'inactive' 
                                    ? 'bg-gray-500 text-white' 
                                    : 'text-white/40 hover:text-white'
                                }`}
                            >
                                Inactive ({ads.filter(ad => !ad.isActive).length})
                            </button>
                        </div>
                    )}

                    {/* Create Form */}
                    {showCreateForm && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-white font-bold">{editingId ? 'Edit Running Ad' : 'New Running Ad'}</h3>
                                <button
                                    onClick={() => { setShowCreateForm(false); resetForm(); }}
                                    className="text-white/40 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Title *"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 outline-none"
                            />

                            <textarea
                                placeholder="Description"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 outline-none resize-none"
                                rows={3}
                            />

                            <input
                                type="text"
                                placeholder="Badge Label"
                                value={formData.badgeLabel}
                                onChange={(e) => setFormData({ ...formData, badgeLabel: e.target.value })}
                                className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 outline-none"
                            />

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                                {!imagePreview ? (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-3 text-white/60 hover:border-purple-500/50 outline-none flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Upload size={18} />
                                        Upload Image *
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="relative w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border border-purple-500/30">
                                            <img src={imagePreview} alt="Preview" className="w-full h-auto object-contain" style={{ maxHeight: '300px' }} />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setSelectedFile(null);
                                                    setFormData({ ...formData, mediaBase64: '', fileName: '' });
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-2 text-white/60 hover:border-purple-500/50 outline-none text-sm transition-all"
                                        >
                                            Change Image
                                        </button>
                                    </div>
                                )}
                            </div>

                            <select
                                value={formData.placement}
                                onChange={(e) => setFormData({ ...formData, placement: e.target.value as any })}
                                className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500/50 outline-none"
                            >
                                <option value="HOME_HERO">Home Hero</option>
                            </select>

                            <select
                                value={formData.linkType}
                                onChange={(e) => setFormData({ ...formData, linkType: e.target.value as any })}
                                className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500/50 outline-none"
                            >
                                <option value="NONE">No Link</option>
                                <option value="EVENT">Event</option>
                                <option value="EXTERNAL_URL">External URL</option>
                                <option value="CLUB">Club</option>
                            </select>

                            <input
                                type="text"
                                placeholder="Link URL / ID"
                                value={formData.linkTarget}
                                onChange={(e) => setFormData({ ...formData, linkTarget: e.target.value })}
                                className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 outline-none"
                            />

                            <input
                                type="text"
                                placeholder="CTA Text (e.g., 'Join Now')"
                                value={formData.ctaText}
                                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                                className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 outline-none"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-white/60 text-xs mb-1 block">Start Date</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDateTime.slice(0, 16)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => setFormData({ ...formData, startDateTime: new Date(e.target.value).toISOString() })}
                                        className="w-full bg-[#021313] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-white/60 text-xs mb-1 block">End Date</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endDateTime.slice(0, 16)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => setFormData({ ...formData, endDateTime: new Date(e.target.value).toISOString() })}
                                        className="w-full bg-[#021313] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500/50 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-[#021313] border border-white/10 rounded-lg px-4 py-3">
                                <span className="text-white">Active</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`w-12 h-6 rounded-full transition-all ${formData.isActive ? 'bg-purple-500' : 'bg-white/10'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            <input
                                type="number"
                                placeholder="Display Order"
                                min="0"
                                value={formData.displayOrder}
                                onChange={(e) => setFormData({ ...formData, displayOrder: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-full bg-[#021313] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 outline-none"
                            />

                            <button
                                onClick={editingId ? handleUpdate : handleCreate}
                                disabled={isCreating}
                                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                            >
                                {isCreating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Ad' : 'Create Ad')}
                            </button>
                        </div>
                    )}

                    {/* Ads List */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                        </div>
                    ) : ads.length === 0 ? (
                        <div className="text-center py-12">
                            <Video size={64} className="text-white/10 mx-auto mb-4" />
                            <p className="text-white/40">No running ads yet</p>
                            <p className="text-white/30 text-sm mt-2">Create your first ad to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ads
                                .filter(ad => {
                                    if (filterStatus === 'active') return ad.isActive;
                                    if (filterStatus === 'inactive') return !ad.isActive;
                                    return true;
                                })
                                .map((ad) => (
                                <div
                                    key={ad.id}
                                    className="bg-[#0D1F1F] rounded-2xl overflow-hidden border border-purple-500/10"
                                >
                                    {/* Image */}
                                    <div className="relative h-40 bg-black">
                                        <img
                                            src={ad.mediaUrl}
                                            alt={ad.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${ad.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                                                {ad.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-500 text-white">
                                                #{ad.displayOrder}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="text-white font-bold mb-1">{ad.title}</h3>
                                        {ad.subtitle && (
                                            <p className="text-white/60 text-sm mb-3">{ad.subtitle}</p>
                                        )}
                                        
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                                {ad.linkType}
                                            </span>
                                            {ad.linkTarget && (
                                                <span className="text-xs text-white/40 truncate flex-1">
                                                    {ad.linkTarget}
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(ad)}
                                                className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-4 py-2 rounded-xl transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(ad.id, ad.isActive)}
                                                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
                                            >
                                                {ad.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                                {ad.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ad.id)}
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
