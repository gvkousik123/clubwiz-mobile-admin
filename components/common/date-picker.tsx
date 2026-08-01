'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDateToDDMMYYYY, parseDDMMYYYYToDate } from '@/lib/date-utils';

interface DatePickerProps {
    value: string; // DD/MM/YYYY format
    onChange: (date: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    minDate?: string; // DD/MM/YYYY format
    maxDate?: string; // DD/MM/YYYY format
}

export const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    placeholder = 'DD/MM/YYYY',
    label,
    disabled = false,
    minDate,
    maxDate,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [displayMonth, setDisplayMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Set default minDate to today if not provided
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const effectiveMinDate = minDate || formatDateToDDMMYYYY(today);

    // Parse the current value to set display month
    useEffect(() => {
        if (value) {
            const date = parseDDMMYYYYToDate(value);
            if (date) {
                setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }
        }
    }, [value]);

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

    const handleDayClick = (day: number) => {
        const selectedDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
        const formattedDate = formatDateToDDMMYYYY(selectedDate);
        onChange(formattedDate);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        onChange(inputValue);

        // If valid date, update display month
        const date = parseDDMMYYYYToDate(inputValue);
        if (date) {
            setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        }
    };

    const handlePrevMonth = () => {
        setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
    };

    const getDaysInMonth = (date: Date): number => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date): number => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(displayMonth);
        const firstDay = getFirstDayOfMonth(displayMonth);
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
            date.setHours(0, 0, 0, 0);
            const dateStr = formatDateToDDMMYYYY(date);
            const isSelected = value === dateStr;
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const isToday = formatDateToDDMMYYYY(todayDate) === dateStr;

            // Check if date is within min/max range
            let isDisabledDay = false;
            // Always use effective min date (today)
            const minDateObj = parseDDMMYYYYToDate(effectiveMinDate);
            if (minDateObj) {
                minDateObj.setHours(0, 0, 0, 0);
                if (date < minDateObj) {
                    isDisabledDay = true;
                }
            }
            if (maxDate) {
                const maxDateObj = parseDDMMYYYYToDate(maxDate);
                if (maxDateObj && date > maxDateObj) {
                    isDisabledDay = true;
                }
            }

            days.push(
                <button
                    key={day}
                    onClick={() => !isDisabledDay && handleDayClick(day)}
                    disabled={isDisabledDay}
                    className={`
                        p-2 rounded-lg text-sm font-semibold transition-colors
                        ${isDisabledDay
                            ? 'text-gray-600 opacity-40 cursor-not-allowed'  /* FIXED: #4 — Past dates greyed out and non-clickable */
                            : isSelected
                                ? 'bg-[#14FFEC] text-black'
                                : isToday
                                    ? 'bg-[#0D7377] text-[#14FFEC]'
                                    : 'text-white hover:bg-[#0D7377]/50 cursor-pointer'
                        }
                    `}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    const monthYear = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div ref={containerRef} className="relative w-full">
            {label && (
                <div className="px-5 mb-3">
                    <label className="text-[#14FFEC] font-semibold text-base">{label}</label>
                </div>
            )}

            <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[30px] p-[10px] px-5 flex items-center gap-2 relative">
                <Calendar className="w-5 h-5 text-[#14FFEC]" />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setIsOpen(true)}
                    disabled={disabled}
                    className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none text-base font-semibold"
                    placeholder={placeholder}
                    maxLength={10}
                />
            </div>

            {/* Calendar Popup */}
            {isOpen && !disabled && (
                <div className="absolute top-full mt-2 bg-[#021313] border border-[#14FFEC]/40 rounded-2xl p-4 z-50 min-w-[320px] shadow-xl">
                    {/* Month/Year Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-[#0D7377] rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} className="text-[#14FFEC]" />
                        </button>
                        <div className="text-white font-semibold text-center flex-1">
                            {monthYear}
                        </div>
                        <button
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-[#0D7377] rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} className="text-[#14FFEC]" />
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="text-center text-[#14FFEC] text-xs font-semibold p-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {renderCalendarDays()}
                    </div>

                    {/* Today Button */}
                    <div className="mt-4 pt-4 border-t border-[#14FFEC]/20 flex gap-2">
                        <button
                            onClick={() => {
                                const today = formatDateToDDMMYYYY(new Date());
                                onChange(today);
                                setIsOpen(false);
                            }}
                            className="flex-1 px-3 py-2 bg-[#14FFEC]/20 hover:bg-[#14FFEC]/40 text-[#14FFEC] rounded-lg text-sm font-semibold transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex-1 px-3 py-2 bg-[#0D7377] hover:bg-[#0D7377]/80 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
