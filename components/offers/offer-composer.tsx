'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { DateTimeWheelPicker } from '@/components/ui/datetime-wheel-picker';

export interface OfferFormValues {
    title: string;
    description: string;
    offerType: string;
    discountPercentage: string;
    discountAmount: string;
    promoCode: string;
    minimumAmount: string;
    usageLimit: string;
    /** Local datetime strings: YYYY-MM-DDTHH:mm */
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export const EMPTY_OFFER: OfferFormValues = {
    title: '',
    description: '',
    offerType: 'BUY_ONE_GET_ONE',
    discountPercentage: '',
    discountAmount: '',
    promoCode: '',
    minimumAmount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    isActive: true,
};

const TITLE_LIMIT = 32;

const TITLE_PRESETS = ['Ladies’ night', 'Happy hours', 'Weekend warm-up'];

/** Keeps '' so a field can actually be cleared, and clamps only real values. */
const numericField = (raw: string, max?: number): string => {
    const digits = raw.replace(/[^\d]/g, '');
    if (digits === '') return '';
    const parsed = parseInt(digits, 10);
    if (Number.isNaN(parsed)) return '';
    return String(max !== undefined ? Math.min(parsed, max) : parsed);
};

const pad = (n: number) => String(n).padStart(2, '0');

export const toLocalInput = (d: Date): string =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const fromLocalInput = (s: string): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
};

const formatStamp = (s: string): string => {
    const d = fromLocalInput(s);
    if (!d) return '';
    return (
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
        ', ' +
        d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    );
};

export interface OfferComposerProps {
    open: boolean;
    mode: 'create' | 'edit';
    initialValues?: OfferFormValues;
    isSaving?: boolean;
    onCancel: () => void;
    onSubmit: (values: OfferFormValues) => void;
}

export function OfferComposer({
    open,
    mode,
    initialValues,
    isSaving = false,
    onCancel,
    onSubmit,
}: OfferComposerProps) {
    const [values, setValues] = useState<OfferFormValues>(initialValues ?? EMPTY_OFFER);
    const [picking, setPicking] = useState<'start' | 'end' | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        const seed = initialValues ?? EMPTY_OFFER;
        setValues(seed);
        setError('');
        setPicking(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialValues]);

    const set = <K extends keyof OfferFormValues>(key: K, value: OfferFormValues[K]) => {
        setValues(prev => ({ ...prev, [key]: value }));
        if (error) setError('');
    };

    const startDate = fromLocalInput(values.startDate);
    const endDate = fromLocalInput(values.endDate);
    const startLabel = formatStamp(values.startDate);
    const endLabel = formatStamp(values.endDate);


    const windowHint = useMemo(() => {
        if (error) return { text: error, danger: true };
        if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
            return { text: 'End time must be after the start.', danger: true };
        }
        if (startLabel && endLabel) {
            return { text: `Live from ${startLabel} to ${endLabel}`, danger: false };
        }
        return { text: 'Set exact start and end. Offers expire to the minute.', danger: false };
    }, [error, startDate, endDate, startLabel, endLabel]);

    const handleSubmit = () => {
        if (!values.title.trim()) return setError('Give the offer a title.');
        if (values.title.trim().length > TITLE_LIMIT) return setError(`Keep the title under ${TITLE_LIMIT} characters.`);
        if (!values.description.trim()) return setError('Describe what the guest gets.');
        if (!values.startDate || !values.endDate) return setError('Set both a start and an end time.');
        if (!startDate || !endDate) return setError('Those dates are not valid.');
        if (endDate.getTime() <= startDate.getTime()) return setError('End time must be after the start.');
        onSubmit(values);
    };

    if (!open) return null;

    const fieldBase =
        'w-full rounded-[14px] bg-[#021313] border border-white/[.08] text-white outline-none transition-colors focus:border-[#14FFEC]/45';

    return (
        <>
            <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 backdrop-blur-[2px]">
                <div className="mx-auto flex w-full max-w-md flex-col items-stretch gap-[22px] px-5 pb-20 pt-7">
                    {/* ============ FORM ============ */}
                    <div className="w-full overflow-hidden rounded-[24px] border border-white/[.07] bg-[#0D1F1F] shadow-[0_30px_70px_-30px_rgba(0,0,0,.7)]">
                        <div className="flex items-start gap-3.5 border-b border-white/[.06] px-6 pb-[18px] pt-[22px]">
                            <div className="min-w-0 flex-1">
                                <div className="text-[19px] font-bold leading-tight tracking-[-.4px] text-white">
                                    {mode === 'create' ? 'Create offer' : 'Edit offer'}
                                </div>
                                <div className="mt-1 text-[11.5px] font-medium text-white/[.42]">
                                    Shown under Today&apos;s Offers and printed on the ticket
                                </div>
                            </div>
                            <button
                                onClick={onCancel}
                                aria-label="Close"
                                className="grid h-8 w-8 place-items-center rounded-[9px] border border-white/10 bg-white/5 text-white/60 transition-colors hover:text-white"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-5 px-6 pb-6 pt-[22px]">
                            {/* TITLE */}
                            <div>
                                <div className="mb-[9px] flex items-baseline gap-2">
                                    <span className="flex-1 text-[10px] font-bold tracking-[1.4px] text-white/[.45]">TITLE</span>
                                    <span
                                        className={`text-[10.5px] font-semibold ${
                                            values.title.length > TITLE_LIMIT ? 'text-red-400' : 'text-white/[.32]'
                                        }`}
                                    >
                                        {values.title.length}/{TITLE_LIMIT}
                                    </span>
                                </div>
                                <input
                                    value={values.title}
                                    maxLength={48}
                                    onChange={e => set('title', e.target.value)}
                                    placeholder="Ladies&#x2019; night on the terrace"
                                    className={`${fieldBase} h-12 px-[15px] text-sm font-semibold placeholder:text-white/[.28] ${
                                        values.title ? 'border-[#14FFEC]/30' : ''
                                    }`}
                                />
                                <div className="mt-[9px] flex flex-wrap gap-1.5">
                                    {TITLE_PRESETS.map(preset => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => set('title', preset)}
                                            className="h-7 rounded-lg border border-dashed border-white/[.13] px-[11px] text-[11px] font-semibold text-white/50 transition-colors hover:border-[#14FFEC]/45 hover:text-[#14FFEC]"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* WHAT'S ON OFFER */}
                            <div>
                                <span className="text-[10px] font-bold tracking-[1.4px] text-white/[.45]">WHAT&apos;S ON OFFER</span>
                                <div className="mb-[9px] mt-1 text-[10.5px] font-medium text-white/[.34]">
                                    Plain words. Whatever it says here is what the guest shows at the venue.
                                </div>
                                <textarea
                                    value={values.description}
                                    rows={2}
                                    onChange={e => set('description', e.target.value)}
                                    placeholder="Upto 40% off on food and bev"
                                    className={`${fieldBase} resize-none px-[15px] py-[13px] text-[13px] font-medium leading-[1.45] placeholder:text-white/[.28] ${
                                        values.description ? 'border-[#14FFEC]/30' : ''
                                    }`}
                                />
                            </div>

                            {/* WHEN IT'S LIVE */}
                            <div>
                                <div className="mb-[9px] text-[10px] font-bold tracking-[1.4px] text-white/[.45]">WHEN IT&apos;S LIVE</div>
                                <div className="flex flex-wrap gap-2.5">
                                    <div className="flex-[1_1_140px]">
                                        <div className="mb-[7px] text-[9.5px] font-bold tracking-[1.2px] text-white/[.38]">STARTS</div>
                                        <button
                                            type="button"
                                            onClick={() => setPicking('start')}
                                            className={`h-11 w-full rounded-[13px] border bg-[#021313] px-[13px] text-left text-[12.5px] font-semibold transition-colors hover:border-[#14FFEC]/35 ${
                                                startLabel ? 'border-[#14FFEC]/30 text-white' : 'border-white/[.08] text-white/[.32]'
                                            }`}
                                        >
                                            {startLabel || 'Set start'}
                                        </button>
                                    </div>
                                    <div className="flex-[1_1_140px]">
                                        <div className="mb-[7px] text-[9.5px] font-bold tracking-[1.2px] text-white/[.38]">ENDS</div>
                                        <button
                                            type="button"
                                            onClick={() => setPicking('end')}
                                            className={`h-11 w-full rounded-[13px] border bg-[#021313] px-[13px] text-left text-[12.5px] font-semibold transition-colors hover:border-[#14FFEC]/35 ${
                                                endLabel ? 'border-[#14FFEC]/30 text-white' : 'border-white/[.08] text-white/[.32]'
                                            }`}
                                        >
                                            {endLabel || 'Set end'}
                                        </button>
                                    </div>
                                </div>
                                <div
                                    className={`mt-2 text-[10.5px] font-medium ${
                                        windowHint.danger ? 'text-red-400' : 'text-white/[.34]'
                                    }`}
                                >
                                    {windowHint.text}
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex flex-wrap items-center gap-3 border-t border-white/[.06] px-6 pb-5 pt-4">
                            <button
                                type="button"
                                onClick={() => set('isActive', !values.isActive)}
                                className="flex flex-[1_1_150px] cursor-pointer items-center gap-2.5"
                            >
                                <span
                                    className={`flex h-[25px] w-11 items-center rounded-full p-[3px] transition-colors ${
                                        values.isActive ? 'justify-end bg-[#14FFEC]' : 'justify-start bg-white/[.12]'
                                    }`}
                                >
                                    <span
                                        className={`h-[19px] w-[19px] rounded-full transition-colors ${
                                            values.isActive ? 'bg-[#04120D]' : 'bg-white/60'
                                        }`}
                                    />
                                </span>
                                <span
                                    className={`text-xs font-semibold ${values.isActive ? 'text-[#14FFEC]' : 'text-white/50'}`}
                                >
                                    {values.isActive ? 'Visible to guests' : 'Saved as draft'}
                                </span>
                            </button>
                            <button
                                onClick={onCancel}
                                className="h-[46px] rounded-[14px] border border-white/10 px-[22px] text-[12.5px] font-bold text-white/60 transition-colors hover:border-white/20 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="h-[46px] rounded-[14px] bg-[#14FFEC] px-[22px] text-[12.5px] font-bold text-[#04120D] transition-colors hover:bg-[#5CF3CE] disabled:opacity-50"
                            >
                                {isSaving ? 'Saving…' : mode === 'create' ? 'Publish offer' : 'Update offer'}
                            </button>
                        </div>
                    </div>

                    {/* ============ PREVIEW ============ */}
                    <div className="w-full rounded-[24px] border border-white/[.07] bg-[#0D1F1F] p-5">
                        <div className="mb-3.5 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#14FFEC]" />
                            <span className="text-[10px] font-bold tracking-[1.5px] text-white/[.45]">LIVE GUEST PREVIEW</span>
                        </div>
                        <div className="mb-[11px] text-sm font-bold text-white">Today&apos;s Offers</div>
                        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-[#14FFEC]/50 bg-[#12211C] px-4 py-[15px]">
                            <div className="min-w-0 flex-1">
                                <div className="mb-1.5 text-sm font-bold leading-[1.25] text-white">
                                    {values.title || 'Ladies’ night on the terrace'}
                                </div>
                                <div className="text-[11.5px] font-medium leading-[1.4] text-white/[.62]">
                                    {values.description || 'Upto 40% off on food and bev'}
                                </div>
                                <div className="mt-[9px] text-[9px] font-bold tracking-[1.1px] text-white/40">
                                    OFFER VALID TILL: {endLabel ? endLabel.toUpperCase() : 'NOT SET'}
                                </div>
                            </div>
                            <span className="grid h-[46px] w-[46px] flex-shrink-0 place-items-center rounded-[13px] bg-[#14FFEC]/[.16] text-[19px]">
                                &#127903;&#65039;
                            </span>
                        </div>
                        <div className="mt-3 text-[10.5px] font-medium leading-[1.45] text-white/[.34]">
                            Same text carries onto the entry ticket at the venue.
                        </div>
                    </div>
                </div>
            </div>

            <DateTimeWheelPicker
                open={picking !== null}
                title={picking === 'start' ? 'Starts' : 'Ends'}
                value={picking === 'start' ? startDate : endDate}
                defaultValue={picking === 'end' && startDate ? new Date(startDate.getTime() + 3 * 60 * 60 * 1000) : null}
                minDate={picking === 'end' ? startDate : null}
                onCancel={() => setPicking(null)}
                onConfirm={picked => {
                    if (picking === 'start') {
                        set('startDate', toLocalInput(picked));
                        // Keep the window coherent if the new start jumps past the end.
                        if (endDate && picked.getTime() >= endDate.getTime()) set('endDate', '');
                    } else if (picking === 'end') {
                        set('endDate', toLocalInput(picked));
                    }
                    setPicking(null);
                }}
            />
        </>
    );
}
