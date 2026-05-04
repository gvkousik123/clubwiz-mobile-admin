import React from 'react';
import { Clock3, Globe, Loader2, MapPin, Phone } from 'lucide-react';
import { NearbyDetailsResponse } from '@/lib/services/search.service';

interface NearbyDetailCardProps {
    detail: NearbyDetailsResponse | null;
    isLoading?: boolean;
    title?: string;
}

export function NearbyDetailCard({ detail, isLoading = false, title = 'Details' }: NearbyDetailCardProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#14FFEC]" />
                <p className="text-sm text-white/70">Fetching details...</p>
            </div>
        );
    }

    if (!detail) {
        return null;
    }
    return (
        <div className="rounded-2xl border border-white/10 bg-[#041919] px-5 py-4 text-white">
            <h3 className="mb-3 text-base font-semibold tracking-wide">{title}</h3>
            <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-[#14FFEC]" />
                    <div>
                        <p className="font-semibold">{detail.name}</p>
                        <p className="text-white/70">{detail.address || 'Exact address coming soon'}</p>
                    </div>
                </div>
                {detail.phone && (
                    <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 text-[#14FFEC]" />
                        <a href={`tel:${detail.phone}`} className="text-white/80 underline-offset-2 hover:underline">
                            {detail.phone}
                        </a>
                    </div>
                )}
                {detail.website && (
                    <div className="flex items-start gap-3">
                        <Globe className="mt-0.5 h-4 w-4 text-[#14FFEC]" />
                        <a
                            href={detail.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-white/80 underline-offset-2 hover:underline"
                        >
                            Visit website
                        </a>
                    </div>
                )}
                {detail.opening_hours && detail.opening_hours.length > 0 && (
                    <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 h-4 w-4 text-[#14FFEC]" />
                        <div className="flex flex-col gap-1 text-white/80">
                            {detail.opening_hours.map((entry) => (
                                <span key={entry}>{entry}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
