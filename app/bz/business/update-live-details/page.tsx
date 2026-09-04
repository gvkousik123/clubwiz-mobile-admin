'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { EventService } from '@/lib/services/event.service';
import { Event } from '@/lib/api-types';
import '../new-event/styles.css';

function UpdateLiveDetailsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId');

    const [isEditing, setIsEditing] = useState(false);
    const [eventData, setEventData] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        // Event edit fields
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        location: '',
        maxAttendees: '',
        isPublic: true,
        requiresApproval: false,

        // Live details fields
        musicGenreTags: '',
        clubOffers: [{ offer: '' }, { offer: '' }],
        tickets: {
            maleStagEntry: {
                pricing: '',
                description: ''
            },
            femaleStagEntry: {
                pricing: '',
                description: ''
            },
            coupleEntry: {
                pricing: '',
                description: ''
            }
        }
    });

    // Load event data if editing
    useEffect(() => {
        if (eventId) {
            loadEventData();
            setIsEditing(true);
        }
    }, [eventId]);

    const loadEventData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await EventService.getEventDetails(eventId!);

                if (response.success && response.data) {
                    const data = response.data;
                    setEventData(data);

                // Populate form with existing data
                setFormData(prev => ({
                    ...prev,
                    title: data.title,
                    description: data.description,
                    startDateTime: data.startDateTime,
                    endDateTime: data.endDateTime,
                    location: data.location,
                    maxAttendees: data.maxAttendees?.toString() || '',
                    isPublic: data.isPublic,
                    requiresApproval: data.requiresApproval
                }));
            } else {
                setError('Failed to load event data');
            }
        } catch (err) {
            console.error('Error loading event:', err);
            setError('Error loading event details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCheckboxChange = (field: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: checked
        }));
    };

    const handleTicketChange = (category: string, field: string, value: string) => {
        setFormData({
            ...formData,
            tickets: {
                ...formData.tickets,
                [category]: {
                    ...formData.tickets[category as keyof typeof formData.tickets],
                    [field]: value
                }
            }
        });
    };

    const handleOfferChange = (index: number, value: string) => {
        const updatedOffers = [...formData.clubOffers];
        updatedOffers[index] = { offer: value };
        setFormData({ ...formData, clubOffers: updatedOffers });
    };

    const addNewOffer = () => {
        setFormData({
            ...formData,
            clubOffers: [...formData.clubOffers, { offer: '' }]
        });
    };

    // Validation function
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (isEditing) {
            // Validate required fields for event editing
            if (!formData.title.trim()) {
                errors.title = 'Event title is required';
            }
            if (!formData.description.trim()) {
                errors.description = 'Event description is required';
            }
            if (!formData.startDateTime) {
                errors.startDateTime = 'Start date & time is required';
            }
            if (!formData.endDateTime) {
                errors.endDateTime = 'End date & time is required';
            }
            if (!formData.location.trim()) {
                errors.location = 'Event location is required';
            }
            if (!formData.maxAttendees.trim()) {
                errors.maxAttendees = 'Max attendees is required';
            } else if (isNaN(parseInt(formData.maxAttendees))) {
                errors.maxAttendees = 'Max attendees must be a number';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const formatDateTimeForAPI = (dateTime: string) => {
        if (!dateTime) return '';
        try {
            return new Date(dateTime).toISOString();
        } catch (error) {
            console.error('Date API formatting error:', error);
            return dateTime;
        }
    };

    const formatDateTimeForInput = (dateTime: string) => {
        if (!dateTime) return '';
        try {
            const date = new Date(dateTime);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().slice(0, 16);
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            console.log('Validation errors:', validationErrors);
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            if (isEditing && eventId) {
                // Update event with validation
                const updateData = {
                    title: formData.title,
                    description: formData.description,
                    startDateTime: formatDateTimeForAPI(formData.startDateTime),
                    endDateTime: formatDateTimeForAPI(formData.endDateTime),
                    location: formData.location,
                    maxAttendees: parseInt(formData.maxAttendees) || undefined,
                    isPublic: formData.isPublic,
                    requiresApproval: formData.requiresApproval
                };

                console.log('📡 Sending update API with:', updateData);
                const response = await EventService.updateEvent(eventId, updateData);

                if (response.success) {
                    // Show success message
                    const successToast = document.createElement('div');
                    successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    successToast.textContent = '✓ Event updated successfully!';
                    document.body.appendChild(successToast);
                    setTimeout(() => {
                        if (document.body.contains(successToast)) {
                            document.body.removeChild(successToast);
                        }
                    }, 3000);

                    // Navigate back to admin
                    setTimeout(() => {
                        router.push('/bz/business');
                    }, 500);
                } else {
                    setError(response.message || 'Failed to update event');
                }
            } else {
                // Save live details (original functionality)
                console.log('Saving live details:', formData);
                router.back();
            }
        } catch (err) {
            console.error('Error saving:', err);
            setError(err instanceof Error ? err.message : 'Error saving details');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-[#14FFEC] rounded-full mx-auto mb-4 animate-pulse"></div>
                    <p>Loading event details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            {/* Fixed Header with gradient background */}
            <div className="fixed top-0 app-bar z-30 flex flex-col pt-10 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="absolute top-10 left-6">
                    <button
                        onClick={handleGoBack}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <h1 className="text-xl font-bold text-white">
                        {isEditing ? 'Edit Event' : 'Update Live Details'}
                    </h1>
                </div>
            </div>

            {/* Main Content Card - Positioned below fixed header */}
            <div className="px-0 relative mt-[100px] z-40">
                {/* Main Container with rounded corners */}
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col">
                    {/* Fixed header section that stays in place */}
                    <div className="w-full bg-[#021313] rounded-t-[40px]">
                        {/* Heading container */}
                        <div className="w-full pb-2">
                            <div className="flex items-center justify-center pt-8 pb-4">
                                <h2 className="text-[28px] font-bold text-white text-center tracking-wider font-['Anton']">
                                    {isEditing && eventData ? eventData.title.toUpperCase() : 'DABO CLUB & KITCHEN'}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="px-6 pt-4">
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                                <p className="text-red-400">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Form Content - Scrollable content area */}
                    <div className="px-6 pb-36 overflow-y-auto h-[calc(100vh-220px)] scrollbar-hide">
                        <div className="space-y-6">
                            {isEditing ? (
                                // Event Edit Fields
                                <>
                                    {/* Title */}
                                    <div>
                                        <div className="px-1">
                                            <label className="text-[#14FFEC] font-semibold text-base">
                                                Event Title *
                                                {validationErrors.title && <span className="text-red-400 text-sm ml-2">{validationErrors.title}</span>}
                                            </label>
                                        </div>
                                        <div className={`bg-[#0D1F1F] border ${validationErrors.title ? 'border-red-500' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5 mt-2`}>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => handleInputChange('title', e.target.value)}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="Enter event title"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <div className="px-1">
                                            <label className="text-[#14FFEC] font-semibold text-base">
                                                Description *
                                                {validationErrors.description && <span className="text-red-400 text-sm ml-2">{validationErrors.description}</span>}
                                            </label>
                                        </div>
                                        <div className={`bg-[#0D1F1F] border ${validationErrors.description ? 'border-red-500' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5 mt-2`}>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                rows={3}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="Enter event description"
                                            />
                                        </div>
                                    </div>

                                    {/* Start Date & Time */}
                                    <div>
                                        <div className="px-1">
                                            <label className="text-[#14FFEC] font-semibold text-base">
                                                Start Date & Time *
                                                {validationErrors.startDateTime && <span className="text-red-400 text-sm ml-2">{validationErrors.startDateTime}</span>}
                                            </label>
                                        </div>
                                        <div className={`bg-[#0D1F1F] border ${validationErrors.startDateTime ? 'border-red-500' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5 mt-2`}>
                                            <input
                                                type="datetime-local"
                                                value={formatDateTimeForInput(formData.startDateTime)}
                                                min={new Date().toISOString().slice(0, 16)}
                                                onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {/* End Date & Time */}
                                    <div>
                                        <div className="px-1">
                                            <label className="text-[#14FFEC] font-semibold text-base">
                                                End Date & Time *
                                                {validationErrors.endDateTime && <span className="text-red-400 text-sm ml-2">{validationErrors.endDateTime}</span>}
                                            </label>
                                        </div>
                                        <div className={`bg-[#0D1F1F] border ${validationErrors.endDateTime ? 'border-red-500' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5 mt-2`}>
                                            <input
                                                type="datetime-local"
                                                value={formatDateTimeForInput(formData.endDateTime)}
                                                min={new Date().toISOString().slice(0, 16)}
                                                onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <div className="px-1">
                                            <label className="text-[#14FFEC] font-semibold text-base">
                                                Location *
                                                {validationErrors.location && <span className="text-red-400 text-sm ml-2">{validationErrors.location}</span>}
                                            </label>
                                        </div>
                                        <div className={`bg-[#0D1F1F] border ${validationErrors.location ? 'border-red-500' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5 mt-2`}>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={(e) => handleInputChange('location', e.target.value)}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="Enter event location"
                                            />
                                        </div>
                                    </div>

                                    {/* Max Attendees */}
                                    <div>
                                        <div className="px-1">
                                            <label className="text-[#14FFEC] font-semibold text-base">
                                                Max Attendees *
                                                {validationErrors.maxAttendees && <span className="text-red-400 text-sm ml-2">{validationErrors.maxAttendees}</span>}
                                            </label>
                                        </div>
                                        <div className={`bg-[#0D1F1F] border ${validationErrors.maxAttendees ? 'border-red-500' : 'border-[#0C898B]'} rounded-[30px] p-[10px] px-5 mt-2`}>
                                            <input
                                                type="number"
                                                value={formData.maxAttendees}
                                                onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                                                className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                placeholder="Enter max attendees"
                                            />
                                        </div>
                                    </div>

                                    {/* Settings */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="isPublic"
                                                checked={formData.isPublic}
                                                onChange={(e) => handleCheckboxChange('isPublic', e.target.checked)}
                                                className="w-4 h-4 rounded border-[#14FFEC]/20 bg-[#021313] text-[#14FFEC] focus:ring-[#14FFEC]"
                                            />
                                            <label htmlFor="isPublic" className="text-sm">Public Event</label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="requiresApproval"
                                                checked={formData.requiresApproval}
                                                onChange={(e) => handleCheckboxChange('requiresApproval', e.target.checked)}
                                                className="w-4 h-4 rounded border-[#14FFEC]/20 bg-[#021313] text-[#14FFEC] focus:ring-[#14FFEC]"
                                            />
                                            <label htmlFor="requiresApproval" className="text-sm">Requires Approval</label>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Live Details Fields
                                <>
                                    {/* Live Music Info Section */}
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="text-white text-lg font-semibold">Live music info</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="px-1">
                                                <label className="text-[#14FFEC] font-semibold text-base">Music Genre tags</label>
                                            </div>
                                            <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                                <input
                                                    type="text"
                                                    value={formData.musicGenreTags}
                                                    onChange={(e) => handleInputChange('musicGenreTags', e.target.value)}
                                                    className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                    placeholder="Enter Music Genre tags Here"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-[#14FFEC]/20 my-6"></div>

                                    {/* Club Offers Section */}
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="text-white text-lg font-semibold">Club Offers if any</h3>
                                        </div>

                                        {formData.clubOffers.map((offer, index) => (
                                            <div key={index} className="space-y-3">
                                                <div className="px-1">
                                                    <label className="text-[#14FFEC] font-semibold text-base">Club Offer No. {index + 1}</label>
                                                </div>
                                                <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                                    <input
                                                        type="text"
                                                        value={offer.offer}
                                                        onChange={(e) => handleOfferChange(index, e.target.value)}
                                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                        placeholder="Enter Club Name Here"
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Another Offer Button */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#14FFEC] font-semibold">Add Another offer</span>
                                            <button
                                                onClick={addNewOffer}
                                                className="w-8 h-8 bg-[#14FFEC] rounded-full flex items-center justify-center"
                                            >
                                                <Plus className="w-5 h-5 text-black" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-[#14FFEC]/20 my-6"></div>

                                    {/* Live Ticket Pricing Section */}
                                    <div className="space-y-5">
                                        <div>
                                            <h3 className="text-white text-lg font-semibold">Live Ticket Pricing</h3>
                                        </div>

                                        {/* Male Stag Entry */}
                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="text-white text-base font-semibold">Male Stag Entry</h4>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="px-1">
                                                    <label className="text-[#14FFEC] font-semibold text-base">Ticket Pricing details *</label>
                                                </div>
                                                <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                                    <input
                                                        type="text"
                                                        value={formData.tickets.maleStagEntry.pricing}
                                                        onChange={(e) => handleTicketChange('maleStagEntry', 'pricing', e.target.value)}
                                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                        placeholder="Enter Price here"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="px-1">
                                                    <label className="text-[#14FFEC] font-semibold text-base">Ticket Description</label>
                                                </div>
                                                <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                                    <input
                                                        type="text"
                                                        value={formData.tickets.maleStagEntry.description}
                                                        onChange={(e) => handleTicketChange('maleStagEntry', 'description', e.target.value)}
                                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                        placeholder="Write your Ticket Description here"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Female Stag Entry */}
                                        <div className="space-y-3 mt-5">
                                            <div>
                                                <h4 className="text-white text-base font-semibold">Female Stag Entry</h4>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="px-1">
                                                    <label className="text-[#14FFEC] font-semibold text-base">Ticket Pricing details *</label>
                                                </div>
                                                <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                                    <input
                                                        type="text"
                                                        value={formData.tickets.femaleStagEntry.pricing}
                                                        onChange={(e) => handleTicketChange('femaleStagEntry', 'pricing', e.target.value)}
                                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                        placeholder="Enter Price here"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="px-1">
                                                    <label className="text-[#14FFEC] font-semibold text-base">Ticket Description</label>
                                                </div>
                                                <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                                    <input
                                                        type="text"
                                                        value={formData.tickets.femaleStagEntry.description}
                                                        onChange={(e) => handleTicketChange('femaleStagEntry', 'description', e.target.value)}
                                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                        placeholder="Write your Ticket Description here"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Couple Entry */}
                                        <div className="space-y-3 mt-5">
                                            <div>
                                                <h4 className="text-white text-base font-semibold">Couple Entry</h4>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="px-1">
                                                    <label className="text-[#14FFEC] font-semibold text-base">Ticket Pricing details *</label>
                                                </div>
                                                <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                                    <input
                                                        type="text"
                                                        value={formData.tickets.coupleEntry.pricing}
                                                        onChange={(e) => handleTicketChange('coupleEntry', 'pricing', e.target.value)}
                                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                        placeholder="Enter Price here"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="px-1">
                                                    <label className="text-[#14FFEC] font-semibold text-base">Ticket Description</label>
                                                </div>
                                                <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5">
                                                    <input
                                                        type="text"
                                                        value={formData.tickets.coupleEntry.description}
                                                        onChange={(e) => handleTicketChange('coupleEntry', 'description', e.target.value)}
                                                        className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                                                        placeholder="Write your Ticket Description here"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom Save Button - Fixed */}
                    <div className="fixed bottom-0 app-bar z-50">
                        <div className="w-full h-[80px] relative bg-[#0D1F1F] shadow-[0px_30px_30px_-40px_#00968A_inset] overflow-hidden rounded-t-[40px] border-t-2 border-[#14FFEC]">
                            <div className="flex justify-center items-center px-8 h-full">
                                <div className="w-[220px] h-[45px] bg-[#0F6861] rounded-[30px] flex justify-center items-center">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full h-full flex justify-center items-center cursor-pointer disabled:opacity-50"
                                    >
                                        <span className="text-center text-white text-[16px] font-['Manrope'] font-bold tracking-[0.05px]">
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function UpdateLiveDetailsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#021313] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-[#14FFEC] rounded-full mx-auto mb-4 animate-pulse"></div>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <UpdateLiveDetailsPageContent />
        </Suspense>
    );
}



