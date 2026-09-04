'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, ChevronLeft, Mail, Phone, Instagram, MessageSquare } from 'lucide-react';
import PageHeader from '@/components/common/page-header';
import { useContact } from '@/hooks/use-contact';
import { useToast } from '@/hooks/use-toast';
import { ContactService } from '@/lib/services/contact.service';

export default function ContactUsPage() {
    const router = useRouter();
    const { submitBusinessEnquiry, submitSupportRequest, loading } = useContact();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'ticket' | 'support'>('ticket');

    // User info state
    const [userInfo, setUserInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Tickets state
    const [userTickets, setUserTickets] = useState<any[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);

    // Support Form State
    const [supportForm, setSupportForm] = useState({ message: '' });

    // Business Inquiry Form State
    const [businessForm, setBusinessForm] = useState({
        instagramLink: '',
        whatsAppLink: '',
        message: ''
    });

    const [showBusinessForm, setShowBusinessForm] = useState(false);

    // Get user info on mount
    useEffect(() => {
        try {
            const userStr = localStorage.getItem('clubviz-user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserInfo({
                    name: user.name || user.username || '',
                    email: user.email || '',
                    phone: user.phone || user.phoneNumber || user.contactNumber || ''
                });
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }, []);

    // Fetch user's support tickets
    useEffect(() => {
        const fetchTickets = async () => {
            setTicketsLoading(true);
            try {
                const response = await ContactService.getUserSupportTickets();
                const tickets = response?.data || [];
                setUserTickets(Array.isArray(tickets) ? tickets : []);
            } catch (error) {
                console.error('Error fetching support tickets:', error);
                setUserTickets([]);
            } finally {
                setTicketsLoading(false);
            }
        };
        fetchTickets();
    }, []);

    // Navigate to ticket detail page
    const handleViewTicketDetail = (ticketId: string) => {
        router.push(`/business/contact/${ticketId}`);
    };

    // Submit Business Inquiry
    const handleSubmitBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessForm.message.trim()) {
            toast({ title: 'Error', description: 'Please enter a message', variant: 'destructive' });
            return;
        }
        const success = await submitBusinessEnquiry({
            name: userInfo.name,
            contactNumber: userInfo.phone,
            instagramLink: businessForm.instagramLink,
            whatsAppLink: businessForm.whatsAppLink,
            message: businessForm.message
        });
        if (success) {
            setShowBusinessForm(false);
            setBusinessForm({ instagramLink: '', whatsAppLink: '', message: '' });
        }
    };

    // Submit Support Request
    const handleSubmitSupport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supportForm.message.trim()) {
            toast({ title: 'Error', description: 'Please enter a message', variant: 'destructive' });
            return;
        }
        const success = await submitSupportRequest({
            name: userInfo.name,
            email: userInfo.email,
            message: supportForm.message
        });
        if (success) {
            toast({ title: '✓ Support Request Submitted', description: 'Thank you! Our team will respond shortly.', variant: 'success' });
            setSupportForm({ message: '' });
            // Refresh tickets
            const response = await ContactService.getUserSupportTickets();
            setUserTickets(Array.isArray(response?.data) ? response.data : []);
        }
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'SUPPORT':
                return 'bg-blue-500/20 text-blue-400';
            case 'FEEDBACK':
                return 'bg-purple-500/20 text-purple-400';
            case 'BUSINESS':
                return 'bg-green-500/20 text-green-400';
            default:
                return 'bg-[#14FFEC]/20 text-[#14FFEC]';
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#021313] overflow-hidden relative">
            <PageHeader title="CONTACT US" />

            {/* Tab Navigation */}
            <div className="px-6 py-6 pt-[140px] flex gap-6 border-b border-[#0C898B]/30">
                <button
                    onClick={() => setActiveTab('ticket')}
                    className={`pb-3 font-semibold transition-all relative ${
                        activeTab === 'ticket' 
                            ? 'text-[#14FFEC]' 
                            : 'text-[#9D9C9C] hover:text-white'
                    }`}
                >
                    Ticket
                    {activeTab === 'ticket' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#14FFEC]"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('support')}
                    className={`pb-3 font-semibold transition-all relative ${
                        activeTab === 'support' 
                            ? 'text-[#14FFEC]' 
                            : 'text-[#9D9C9C] hover:text-white'
                    }`}
                >
                    Support
                    {activeTab === 'support' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#14FFEC]"></div>}
                </button>
            </div>

            {/* TAB 1: Tickets */}
            {activeTab === 'ticket' && (
                <div className="px-6 py-6 pb-20">
                    <div className="max-w-2xl mx-auto">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <h3 className="text-[#FFFEFF] text-lg font-semibold whitespace-nowrap">Your Support Tickets</h3>
                                <div className="flex-1 h-px bg-gradient-to-r from-[#14FFEC] to-transparent"></div>
                            </div>

                            {ticketsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-6 h-6 text-[#14FFEC] animate-spin" />
                                </div>
                            ) : userTickets.length === 0 ? (
                                <div className="bg-[#0D1F1F] border border-[#0C898B]/40 rounded-2xl p-8 text-center">
                                    <MessageSquare className="w-12 h-12 text-[#14FFEC]/30 mx-auto mb-4" />
                                    <p className="text-[#9D9C9C] text-sm mb-4">No support tickets yet.</p>
                                    <button 
                                        onClick={() => setActiveTab('support')} 
                                        className="text-[#14FFEC] hover:underline font-semibold"
                                    >
                                        Create a new ticket →
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {userTickets.map((ticket: any) => (
                                        <button
                                            key={ticket.id}
                                            onClick={() => handleViewTicketDetail(ticket.id)}
                                            className="w-full bg-[#0D1F1F] border border-[#0C898B]/40 rounded-2xl p-4 hover:border-[#14FFEC]/60 transition-colors text-left group"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getTypeColor(ticket.type || 'SUPPORT')}`}>
                                                    {ticket.type || 'SUPPORT'}
                                                </span>
                                                <span className="text-xs text-[#9D9C9C] shrink-0">
                                                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                                </span>
                                            </div>
                                            <p className="text-white text-sm font-semibold mb-1">{ticket.name || ticket.username}</p>
                                            <p className="text-[#9D9C9C] text-xs leading-relaxed line-clamp-3">{ticket.message || ticket.feedback}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: Support */}
            {activeTab === 'support' && (
                <div className="px-6 py-6 pb-20">
                    <div className="max-w-2xl mx-auto space-y-6">

                        <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-2xl p-6">
                            <h3 className="text-white text-2xl font-bold mb-2">Send us a Message</h3>
                            <p className="text-[#9D9C9C] text-sm mb-6">Our support team will respond to your inquiry as soon as possible.</p>

                            <form onSubmit={handleSubmitSupport} className="space-y-4">
                                <div>
                                    <label className="text-sm text-[#9D9C9C] mb-2 block font-semibold">Name</label>
                                    <div className="w-full bg-[#0A0F0F] border border-[#0C898B]/20 rounded-lg p-3 text-[#9D9C9C] min-h-11 flex items-center opacity-60 cursor-not-allowed">
                                        {userInfo.name || 'Not provided'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-[#9D9C9C] mb-2 block font-semibold">Email</label>
                                    <div className="w-full bg-[#0A0F0F] border border-[#0C898B]/20 rounded-lg p-3 text-[#9D9C9C] min-h-11 flex items-center break-all opacity-60 cursor-not-allowed">
                                        {userInfo.email || 'Not provided'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-[#9D9C9C] mb-2 block font-semibold">Message *</label>
                                    <textarea
                                        required
                                        placeholder="Please describe your issue or inquiry..."
                                        className="w-full bg-[#021313] border border-[#0C898B] rounded-lg p-3 text-white placeholder-[#9D9C9C]/50 focus:outline-none focus:ring-1 focus:ring-[#14FFEC] h-32 resize-none"
                                        value={supportForm.message}
                                        onChange={e => setSupportForm({ message: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !supportForm.message.trim()}
                                    className={`w-full font-bold py-3 rounded-xl transition disabled:opacity-50 flex justify-center items-center gap-2 ${
                                        supportForm.message.trim() 
                                            ? 'bg-gradient-to-r from-[#005D5C] to-[#14FFEC] text-black hover:brightness-110' 
                                            : 'bg-[#0C898B]/30 text-[#9D9C9C] cursor-not-allowed'
                                    }`}
                                >
                                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Sending...</> : 'Send Message'}
                                </button>
                            </form>
                        </div>

                        {/* Divider */}
                        <div className="my-8 border-t border-[#0C898B]/30"></div>

                        {/* Partner Section */}
                        <div className="bg-gradient-to-br from-[#0D1F1F] to-[#021313] rounded-2xl border border-[#0C898B]/50 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#14FFEC]/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <h4 className="text-white font-bold text-lg mb-2">Partnership Opportunity</h4>
                            <p className="text-[#9D9C9C] text-sm mb-6">Join Clubwiz network and manage your events, bookings and more.</p>
                            <button
                                onClick={() => setShowBusinessForm(!showBusinessForm)}
                                className="bg-[#14FFEC] text-black font-bold py-2 px-6 rounded-lg hover:bg-[#14FFEC]/90 transition"
                            >
                                Submit Business Inquiry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Business Inquiry Modal */}
            {showBusinessForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-2xl w-full max-w-md p-6 relative">
                        <button 
                            onClick={() => setShowBusinessForm(false)} 
                            className="absolute top-4 right-4 text-white/50 hover:text-white transition"
                        >
                            <X size={24} />
                        </button>
                        <h3 className="text-white text-xl font-bold mb-6">Business Inquiry</h3>
                        <form onSubmit={handleSubmitBusiness} className="space-y-4">
                            <div>
                                <label className="text-xs text-[#9D9C9C] mb-1 block font-semibold">Name</label>
                                <div className="w-full bg-[#0A0F0F] border border-[#0C898B]/20 rounded-lg p-3 text-[#9D9C9C] min-h-10 flex items-center opacity-60 cursor-not-allowed">
                                    {userInfo.name || 'Not provided'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-[#9D9C9C] mb-1 block font-semibold">Email</label>
                                <div className="w-full bg-[#0A0F0F] border border-[#0C898B]/20 rounded-lg p-3 text-[#9D9C9C] min-h-10 flex items-center break-all text-xs opacity-60 cursor-not-allowed">
                                    {userInfo.email || 'Not provided'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-[#9D9C9C] mb-1 block font-semibold">Contact Number</label>
                                <div className="w-full bg-[#0A0F0F] border border-[#0C898B]/20 rounded-lg p-3 text-[#9D9C9C] min-h-10 flex items-center opacity-60 cursor-not-allowed">
                                    {userInfo.phone || 'Not provided'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-[#9D9C9C] mb-1 block font-semibold">Instagram (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="https://instagram.com/..."
                                    className="w-full bg-[#021313] border border-[#0C898B] rounded-lg p-3 text-white placeholder-[#9D9C9C]/50 focus:outline-none focus:ring-1 focus:ring-[#14FFEC] text-sm"
                                    value={businessForm.instagramLink}
                                    onChange={e => setBusinessForm({ ...businessForm, instagramLink: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[#9D9C9C] mb-1 block font-semibold">WhatsApp (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="https://wa.me/..."
                                    className="w-full bg-[#021313] border border-[#0C898B] rounded-lg p-3 text-white placeholder-[#9D9C9C]/50 focus:outline-none focus:ring-1 focus:ring-[#14FFEC] text-sm"
                                    value={businessForm.whatsAppLink}
                                    onChange={e => setBusinessForm({ ...businessForm, whatsAppLink: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[#9D9C9C] mb-1 block font-semibold">Message *</label>
                                <textarea
                                    required
                                    placeholder="Tell us about your business..."
                                    className="w-full bg-[#021313] border border-[#0C898B] rounded-lg p-3 text-white placeholder-[#9D9C9C]/50 focus:outline-none focus:ring-1 focus:ring-[#14FFEC] h-24 resize-none text-sm"
                                    value={businessForm.message}
                                    onChange={e => setBusinessForm({ ...businessForm, message: e.target.value })}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full bg-gradient-to-r from-[#005D5C] to-[#14FFEC] text-black font-bold py-3 rounded-xl hover:brightness-110 transition disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Inquiry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
