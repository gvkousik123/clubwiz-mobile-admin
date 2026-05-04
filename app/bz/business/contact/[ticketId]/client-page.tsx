'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, Phone, Instagram, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContactService } from '@/lib/services/contact.service';

interface Ticket {
    id: string;
    type: string;
    name: string;
    message: string;
    email: string;
    contactNumber: string;
    instagramLink?: string;
    whatsAppLink?: string;
    username?: string;
    createdAt: string;
}

export default function TicketDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const ticketId = params?.ticketId === '_' ? (searchParams.get('id') || '') : (params?.ticketId as string);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTicketDetail = async () => {
            if (!ticketId) return;
            
            setLoading(true);
            try {
                const response = await ContactService.getTicketDetail(ticketId);
                if (response?.data) {
                    setTicket(response.data);
                } else {
                    toast({
                        title: 'Error',
                        description: 'Failed to load ticket details',
                        variant: 'destructive'
                    });
                }
            } catch (error) {
                console.error('Error fetching ticket:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load ticket details',
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTicketDetail();
    }, [ticketId, toast]);

    const handleGoBack = () => {
        router.back();
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
        <div className="min-h-screen w-full bg-[#021313] text-white">
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-30 flex flex-col pt-10 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="absolute top-10 left-6">
                    <button
                        onClick={handleGoBack}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all duration-300"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <h1 className="text-xl font-bold text-white">Ticket Details</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 pt-[160px] pb-24">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 text-[#14FFEC] animate-spin" />
                    </div>
                ) : ticket ? (
                    <div className="max-w-2xl mx-auto">
                        {/* Ticket Header */}
                        <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-2xl p-6 mb-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${getTypeColor(ticket.type || 'SUPPORT')}`}>
                                        {ticket.type || 'SUPPORT'}
                                    </span>
                                    <h2 className="text-2xl font-bold text-white mt-3">{ticket.name || ticket.username}</h2>
                                </div>
                                <span className="text-sm text-[#9D9C9C]">
                                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN', { 
                                        day: '2-digit', 
                                        month: 'long', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : ''}
                                </span>
                            </div>
                        </div>

                        {/* Ticket Message */}
                        <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-2xl p-6 mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Message</h3>
                            <p className="text-[#9D9C9C] leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                            <div className="space-y-4">
                                {ticket.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-[#14FFEC] flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-sm text-[#9D9C9C]">Email</p>
                                            <a 
                                                href={`mailto:${ticket.email}`}
                                                className="text-white break-all hover:text-[#14FFEC] transition"
                                            >
                                                {ticket.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {ticket.contactNumber && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-[#14FFEC] flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-sm text-[#9D9C9C]">Contact Number</p>
                                            <a 
                                                href={`tel:${ticket.contactNumber}`}
                                                className="text-white hover:text-[#14FFEC] transition"
                                            >
                                                {ticket.contactNumber}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {ticket.instagramLink && (
                                    <div className="flex items-start gap-3">
                                        <Instagram className="w-5 h-5 text-[#14FFEC] flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-sm text-[#9D9C9C]">Instagram</p>
                                            <a 
                                                href={ticket.instagramLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white break-all hover:text-[#14FFEC] transition"
                                            >
                                                {ticket.instagramLink}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {ticket.whatsAppLink && (
                                    <div className="flex items-start gap-3">
                                        <MessageSquare className="w-5 h-5 text-[#14FFEC] flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-sm text-[#9D9C9C]">WhatsApp</p>
                                            <a 
                                                href={ticket.whatsAppLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white break-all hover:text-[#14FFEC] transition"
                                            >
                                                {ticket.whatsAppLink}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Info */}
                        <div className="mt-6 bg-[#14FFEC]/10 border border-[#14FFEC]/30 rounded-2xl p-4 text-center">
                            <p className="text-[#14FFEC] text-sm font-medium">
                                Our support team has received your ticket and will respond shortly.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-[#14FFEC]/30 mx-auto mb-4" />
                        <p className="text-[#9D9C9C]">Ticket not found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
