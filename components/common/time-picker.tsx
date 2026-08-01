'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { parseDDMMYYYYToDate, getCurrentTimeIST } from '@/lib/date-utils';

interface TimePickerProps {
    value: string; // HH:MM format
    onChange: (time: string) => void;
    eventDate?: string; // DD/MM/YYYY format
    disabled?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({
    value,
    onChange,
    eventDate,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close picker on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Check if selected date is today
    const isToday = (): boolean => {
        if (!eventDate) return false;
        const selectedDate = parseDDMMYYYYToDate(eventDate);
        if (!selectedDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        return selectedDate.getTime() === today.getTime();
    };

    // Get current hour and minute
    const getCurrentTime = () => {
        const now = getCurrentTimeIST();
        return {
            hour: now.getHours(),
            minute: now.getMinutes()
        };
    };

    // Generate time slots (every 15 minutes)
    const generateTimeSlots = (): string[] => {
        const slots: string[] = [];
        const today = isToday();
        const currentTime = getCurrentTime();

        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                // If today, only show time slots at least 30 minutes from current time
                if (today) {
                    // Create a time value for comparison (total minutes since midnight)
                    const slotTimeInMinutes = hour * 60 + minute;
                    const currentTimeInMinutes = currentTime.hour * 60 + currentTime.minute;
                    
                    // Skip if this slot is less than 30 minutes from current time
                    if (slotTimeInMinutes <= currentTimeInMinutes + 30) continue;
                }

                const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                slots.push(timeString);
            }
        }

        return slots;
    };

    const timeSlots = generateTimeSlots();

    // Format time for display (12-hour format)
    const formatTimeDisplay = (time: string): string => {
        if (!time) return 'Select time';
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    const handleTimeSelect = (time: string) => {
        onChange(time);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5 cursor-pointer flex items-center justify-between ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#14FFEC]'
                }`}
            >
                <span className={`text-base font-semibold ${value ? 'text-white' : 'text-[#9D9C9C]'}`}>
                    {formatTimeDisplay(value)}
                </span>
                <Clock className="w-5 h-5 text-[#14FFEC]" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-[#0D1F1F] border border-[#14FFEC]/30 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {timeSlots.length > 0 ? (
                        timeSlots.map((time) => (
                            <div
                                key={time}
                                onClick={() => handleTimeSelect(time)}
                                className={`px-4 py-2 cursor-pointer transition-colors ${
                                    value === time
                                        ? 'bg-[#14FFEC]/20 text-[#14FFEC]'
                                        : 'text-white hover:bg-[#14FFEC]/10'
                                }`}
                            >
                                {formatTimeDisplay(time)}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-white/60 text-center text-sm">
                            No available time slots for today
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TimePicker;
