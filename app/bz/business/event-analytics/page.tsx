'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useState } from 'react';
import '../new-event/styles.css';

export default function EventAnalyticsPage() {
    const router = useRouter();

    // Mock data based on the screenshot
    const eventData = {
        name: 'TIMELESS TUESDAYS FT. DJ XPENSIVE',
        date: '24 Dec | 7:00 pm',
        month: 'AUGUST',
        day: '22',
        stats: {
            totalTicketSold: '64/120',
            totalTicketRedeemed: '45',
            revenueGenerated: 'Rs 12,000',
            peopleAttending: '62',
            totalAttendance: '84'
        },
        tickets: {
            maleStag: {
                price: 'Rs 1500',
                sold: '14',
                total: '120',
                description: 'Grants entry to one male attendee for the event.'
            },
            femaleStag: {
                price: 'Rs 750',
                sold: '30',
                total: '120',
                description: 'Grants entry to one male attendee for the event.'
            },
            coupleTicket: {
                price: 'Rs 2000',
                sold: '20',
                total: '120',
                description: 'Grants entry to one male attendee for the event.'
            }
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            {/* Fixed Header with gradient background */}
            <div className="fixed top-0 left-0 right-0 z-30 flex flex-col pt-10 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="absolute top-10 left-6">
                    <button
                        onClick={handleGoBack}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <h1 className="text-xl font-bold text-white">Event Analytics</h1>
                </div>
            </div>

            {/* Main Content Card - Positioned below fixed header */}
            <div className="px-0 relative mt-[100px] z-40">
                {/* Main Container with rounded corners */}
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col">
                    {/* Event details section */}
                    <div className="w-full bg-[#021313] rounded-t-[40px] px-4 py-6">
                        <div className="bg-[#0D1F1F] rounded-[20px] p-4 relative overflow-hidden">
                            {/* Event Date Box */}
                            <div className="absolute top-4 right-4 bg-[#14FFEC] text-black rounded-[10px] w-16 h-16 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold leading-none">{eventData.day}</span>
                                <span className="text-xs font-semibold">{eventData.month}</span>
                            </div>
                            
                            {/* Event Title */}
                            <h2 className="text-xl font-bold tracking-wide pr-20 mb-4 uppercase">{eventData.name}</h2>
                            
                            {/* Event Date/Time */}
                            <div className="flex items-center gap-2 mb-2 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>{eventData.date}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats heading */}
                    <div className="px-4 mb-3">
                        <h3 className="text-lg font-semibold">Stats</h3>
                    </div>

                    {/* Stats grid - first row */}
                    <div className="px-4 grid grid-cols-2 gap-4 mb-4">
                        {/* Total Ticket Sold */}
                        <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                            <p className="text-[#14FFEC] text-sm mb-2">Total Ticket Sold</p>
                            <p className="text-white text-2xl font-bold">{eventData.stats.totalTicketSold}</p>
                        </div>
                        
                        {/* Total Ticket Redeemed */}
                        <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                            <p className="text-[#14FFEC] text-sm mb-2">Total Ticket Redeemed</p>
                            <p className="text-white text-2xl font-bold">{eventData.stats.totalTicketRedeemed}</p>
                        </div>
                    </div>

                    {/* Stats grid - second row */}
                    <div className="px-4 grid grid-cols-2 gap-4 mb-4">
                        {/* Revenue Generated */}
                        <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                            <p className="text-[#14FFEC] text-sm mb-2">Revenue Generated</p>
                            <p className="text-white text-2xl font-bold">{eventData.stats.revenueGenerated}</p>
                        </div>
                        
                        {/* No. of People Attending */}
                        <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                            <p className="text-[#14FFEC] text-sm mb-2">No. of People Attending</p>
                            <p className="text-white text-2xl font-bold">{eventData.stats.peopleAttending}</p>
                        </div>
                    </div>

                    {/* Total No. of Attendance */}
                    <div className="px-4 mb-6">
                        <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                            <p className="text-[#14FFEC] text-sm mb-2">Total No. of Attendance</p>
                            <p className="text-white text-2xl font-bold">{eventData.stats.totalAttendance}</p>
                        </div>
                    </div>

                    {/* Tickets heading */}
                    <div className="px-4 mb-3">
                        <h3 className="text-lg font-semibold">Tickets</h3>
                    </div>

                    {/* Male Stag Ticket */}
                    <div className="px-4 mb-4">
                        <div className="bg-[#0D1F1F] rounded-[15px] p-4 relative">
                            {/* Ticket count box */}
                            <div className="absolute top-4 right-4 bg-[#14FFEC] text-black rounded-[10px] w-16 h-16 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold">{eventData.tickets.maleStag.sold}</span>
                                <span className="text-xs">Out of {eventData.tickets.maleStag.total}</span>
                            </div>
                            
                            <h4 className="text-white text-lg font-semibold mb-1">Male Stag</h4>
                            <p className="text-[#14FFEC] font-semibold mb-2">{eventData.tickets.maleStag.price}</p>
                            <p className="text-sm text-gray-300 pr-20">{eventData.tickets.maleStag.description}</p>
                        </div>
                    </div>

                    {/* Female Stag Ticket */}
                    <div className="px-4 mb-4">
                        <div className="bg-[#0D1F1F] rounded-[15px] p-4 relative">
                            {/* Ticket count box */}
                            <div className="absolute top-4 right-4 bg-[#14FFEC] text-black rounded-[10px] w-16 h-16 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold">{eventData.tickets.femaleStag.sold}</span>
                                <span className="text-xs">Out of {eventData.tickets.femaleStag.total}</span>
                            </div>
                            
                            <h4 className="text-white text-lg font-semibold mb-1">Female Stag</h4>
                            <p className="text-[#14FFEC] font-semibold mb-2">{eventData.tickets.femaleStag.price}</p>
                            <p className="text-sm text-gray-300 pr-20">{eventData.tickets.femaleStag.description}</p>
                        </div>
                    </div>

                    {/* Couple Ticket */}
                    <div className="px-4 mb-20">
                        <div className="bg-[#0D1F1F] rounded-[15px] p-4 relative">
                            {/* Ticket count box */}
                            <div className="absolute top-4 right-4 bg-[#14FFEC] text-black rounded-[10px] w-16 h-16 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold">{eventData.tickets.coupleTicket.sold}</span>
                                <span className="text-xs">Out of {eventData.tickets.coupleTicket.total}</span>
                            </div>
                            
                            <h4 className="text-white text-lg font-semibold mb-1">Couple Ticket</h4>
                            <p className="text-[#14FFEC] font-semibold mb-2">{eventData.tickets.coupleTicket.price}</p>
                            <p className="text-sm text-gray-300 pr-20">{eventData.tickets.coupleTicket.description}</p>
                        </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="fixed bottom-0 left-0 right-0 z-50">
                        <div className="w-full h-[80px] relative bg-[#0D1F1F] shadow-[0px_30px_30px_-40px_#00968A_inset] overflow-hidden rounded-t-[40px] border-t-2 border-[#14FFEC]">
                            <div className="flex justify-center items-center px-8 h-full">
                                <div className="w-[220px] h-[45px] bg-[#0F6861] rounded-[30px] flex justify-center items-center">
                                    <button
                                        onClick={() => router.push('/bz/business/all-organized-events')}
                                        className="w-full h-full flex justify-center items-center cursor-pointer"
                                    >
                                        <span className="text-center text-white text-[16px] font-['Manrope'] font-bold tracking-[0.05px]">
                                            Back to Events
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



