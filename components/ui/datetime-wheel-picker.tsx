'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const ROW = 40;
const DAY_COUNT = 21;
const MINUTE_STEP = 5;

export interface DateTimeWheelPickerProps {
    open: boolean;
    title?: string;
    /** Currently selected value; the wheels seed from this when opened. */
    value?: Date | null;
    /** Fallback seed when there is no value yet. */
    defaultValue?: Date | null;
    /** Selections before this instant are rejected. */
    minDate?: Date | null;
    onCancel: () => void;
    onConfirm: (value: Date) => void;
}

interface WheelProps {
    items: string[];
    index: number;
    flex: number;
    syncToken: number;
    onSelect: (index: number) => void;
    ariaLabel: string;
}

function Wheel({ items, index, flex, syncToken, onSelect, ariaLabel }: WheelProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Snap to the seeded index whenever the sheet (re)opens.
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.scrollTop = index * ROW;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncToken]);

    const handleScroll = () => {
        const el = ref.current;
        if (!el) return;
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
            const next = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW)));
            if (next !== index) onSelect(next);
        }, 60);
    };

    const handlePick = (i: number) => {
        ref.current?.scrollTo({ top: i * ROW, behavior: 'smooth' });
        onSelect(i);
    };

    return (
        <div
            ref={ref}
            role="listbox"
            aria-label={ariaLabel}
            onScroll={handleScroll}
            style={{ flex, scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
            className="overflow-y-scroll py-20 [&::-webkit-scrollbar]:hidden"
        >
            {items.map((label, i) => (
                <div
                    key={`${label}-${i}`}
                    role="option"
                    aria-selected={i === index}
                    onClick={() => handlePick(i)}
                    style={{ height: ROW, scrollSnapAlign: 'center' }}
                    className={`flex cursor-pointer items-center justify-center text-sm font-semibold transition-all duration-100 ${
                        i === index ? 'scale-[1.06] text-[#14FFEC]' : 'text-white/40'
                    }`}
                >
                    {label}
                </div>
            ))}
        </div>
    );
}

export function DateTimeWheelPicker({
    open,
    title = 'Select',
    value,
    defaultValue,
    minDate,
    onCancel,
    onConfirm,
}: DateTimeWheelPickerProps) {
    // Primitive dep: minDate is rebuilt on every parent render, so keying the
    // memos off the object itself would recompute the wheels each time.
    const minDayTs = minDate ? new Date(minDate).setHours(0, 0, 0, 0) : null;

    const days = useMemo(() => {
        const base = new Date();
        base.setHours(0, 0, 0, 0);
        // Start the wheel at the earliest selectable day rather than always at today,
        // so a day that is already ruled out (e.g. before the chosen start) is never
        // offered and then rejected on confirm.
        if (minDayTs !== null && minDayTs > base.getTime()) base.setTime(minDayTs);

        return Array.from({ length: DAY_COUNT }, (_, i) => {
            const d = new Date(base);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [minDayTs]);

    const dayLabels = useMemo(() => {
        // Labelled against the real today, not the first row, since the wheel may
        // now begin on a later day.
        const today = new Date().setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return days.map(d =>
            d.getTime() === today
                ? 'Today'
                : d.getTime() === tomorrow.getTime()
                    ? 'Tomorrow'
                    : d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
        );
    }, [days]);

    const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []);
    const minutes = useMemo(
        () => Array.from({ length: 60 / MINUTE_STEP }, (_, i) => String(i * MINUTE_STEP).padStart(2, '0')),
        []
    );
    const meridiems = useMemo(() => ['AM', 'PM'], []);

    const [dayIdx, setDayIdx] = useState(0);
    const [hourIdx, setHourIdx] = useState(7);
    const [minIdx, setMinIdx] = useState(0);
    const [ampmIdx, setAmpmIdx] = useState(1);
    const [syncToken, setSyncToken] = useState(0);
    const [error, setError] = useState('');

    // Seed the wheels each time the sheet opens.
    useEffect(() => {
        if (!open) return;
        const seed = value ?? defaultValue ?? new Date(Date.now() + 2 * 60 * 60 * 1000);

        const dIdx = days.findIndex(d => d.toDateString() === seed.toDateString());
        const h24 = seed.getHours();

        setDayIdx(dIdx >= 0 ? dIdx : 0);
        setHourIdx((h24 % 12 || 12) - 1);
        setMinIdx(Math.round(seed.getMinutes() / MINUTE_STEP) % (60 / MINUTE_STEP));
        setAmpmIdx(h24 >= 12 ? 1 : 0);
        setError('');
        setSyncToken(t => t + 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Escape closes
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    const buildDate = () => {
        const d = new Date(days[dayIdx]);
        let h = (hourIdx + 1) % 12;
        if (ampmIdx === 1) h += 12;
        d.setHours(h, minIdx * MINUTE_STEP, 0, 0);
        return d;
    };

    const handleConfirm = () => {
        const picked = buildDate();
        if (minDate && picked.getTime() < minDate.getTime()) {
            setError('That is before the start time.');
            return;
        }
        if (!minDate && picked.getTime() < Date.now() - 60_000) {
            setError('Pick a time in the future.');
            return;
        }
        onConfirm(picked);
    };

    return (
        <>
            <div
                onClick={onCancel}
                className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${
                    open ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />
            <div
                className={`fixed bottom-6 left-1/2 z-[61] w-[min(420px,92vw)] -translate-x-1/2 overflow-hidden rounded-[22px] border border-[#14FFEC]/20 bg-[#0D1F1F] shadow-[0_-24px_60px_rgba(0,0,0,.55)] transition-transform duration-300 ${
                    open ? 'translate-y-0' : 'translate-y-[140%]'
                }`}
                style={{ transitionTimingFunction: 'cubic-bezier(.32,.72,0,1)' }}
            >
                <header className="flex items-center border-b border-white/[.07] px-4 py-3.5">
                    <button onClick={onCancel} className="p-1 text-sm font-bold text-white/50 hover:text-white/80">
                        Cancel
                    </button>
                    <span className="flex-1 text-center text-sm font-bold text-white">{title}</span>
                    <button onClick={handleConfirm} className="p-1 text-sm font-bold text-[#14FFEC] hover:text-[#5CF3CE]">
                        Set
                    </button>
                </header>

                <div className="relative flex h-[200px] px-2.5">
                    {/* selection band */}
                    <div className="pointer-events-none absolute left-2.5 right-2.5 top-20 h-10 rounded-[9px] border-y border-white/[.14] bg-[#14FFEC]/[.06]" />

                    <Wheel items={dayLabels} index={dayIdx} flex={1.5} syncToken={syncToken} onSelect={setDayIdx} ariaLabel="Day" />
                    <Wheel items={hours} index={hourIdx} flex={0.7} syncToken={syncToken} onSelect={setHourIdx} ariaLabel="Hour" />
                    <Wheel items={minutes} index={minIdx} flex={0.7} syncToken={syncToken} onSelect={setMinIdx} ariaLabel="Minute" />
                    <Wheel items={meridiems} index={ampmIdx} flex={0.8} syncToken={syncToken} onSelect={setAmpmIdx} ariaLabel="AM or PM" />

                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[76px] bg-gradient-to-b from-[#0D1F1F] to-transparent" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[76px] bg-gradient-to-t from-[#0D1F1F] to-transparent" />
                </div>

                {error && (
                    <p className="border-t border-white/[.07] px-4 py-2.5 text-center text-xs font-semibold text-red-400">
                        {error}
                    </p>
                )}
            </div>
        </>
    );
}
