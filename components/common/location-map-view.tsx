'use client';

import { MapPin } from 'lucide-react';
import { GoogleMapPicker } from '@/components/common/google-map-picker';

export interface LocationMapViewProps {
    lat?: number | null;
    lng?: number | null;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    height?: number;
}

/** 0,0 is the Null Island default the API returns when nothing was ever set. */
const hasRealCoords = (lat?: number | null, lng?: number | null): boolean =>
    typeof lat === 'number' && typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);

/**
 * Read-only location card: the same map the edit screens use, over the address.
 *
 * It renders GoogleMapPicker with a no-op onSelect so previews get the identical
 * look and the same OpenStreetMap fallback when Google Maps has no key.
 */
export function LocationMapView({
    lat, lng, address1, address2, city, state, pincode, country, height = 180,
}: LocationMapViewProps) {
    const heading = [city, state].filter(Boolean).join(', ');
    const street = [address1, address2].filter(Boolean).join(', ');
    const footer = [pincode ? `Pincode: ${pincode}` : '', country || 'India'].filter(Boolean).join(' · ');

    if (!heading && !street && !hasRealCoords(lat, lng)) return null;

    return (
        <div className="w-full rounded-[15px] bg-[rgba(40,60,61,0.3)] overflow-hidden">
            {hasRealCoords(lat, lng) && (
                <div className="w-full">
                    <GoogleMapPicker
                        center={{ lat: lat as number, lng: lng as number }}
                        selectedLocation={{ lat: lat as number, lng: lng as number }}
                        onSelect={() => { /* read-only preview */ }}
                        height={height}
                    />
                </div>
            )}

            <div className="flex items-start gap-3 p-4">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#14FFEC]" />
                <div className="min-w-0">
                    {heading && <p className="text-white text-sm font-semibold">{heading}</p>}
                    {street && <p className="text-white/70 text-xs mt-0.5">{street}</p>}
                    {footer && <p className="text-white/50 text-[11px] mt-1">{footer}</p>}
                    {hasRealCoords(lat, lng) && (
                        <a
                            href={`https://maps.google.com/?q=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#14FFEC] text-xs mt-1.5 inline-block hover:underline"
                        >
                            Open in Maps
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LocationMapView;
