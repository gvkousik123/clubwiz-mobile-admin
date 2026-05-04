'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { CircleF, GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';

// Static libraries array to prevent LoadScript reload warning
const GOOGLE_LIBRARIES: Array<'marker'> = ['marker'];

// Google Maps API Key - from environment variable (NEXT_PUBLIC_ prefix required for browser access)
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface GoogleMapPickerProps {
    center: { lat: number; lng: number };
    radius?: number;
    onSelect: (coords: { lat: number; lng: number }) => void;
    apiKey?: string;
    height?: number | string;
}

const baseContainerStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
};

const resolveHeight = (height?: number | string): string => {
    if (typeof height === 'number') {
        return `${height}px`;
    }
    return height || '420px';
};

export function GoogleMapPicker({ center, radius = 5000, onSelect, apiKey, height }: GoogleMapPickerProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const legacyMarkerRef = useRef<google.maps.Marker | null>(null);

    // Debug: Log environment variable
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        console.log('🔍 Google Maps API Key check:', {
            hasKey: !!key,
            keyPreview: key ? `${key.substring(0, 10)}...${key.substring(key.length - 10)}` : 'MISSING',
            envVarName: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
        });
    }, []);

    // Use hardcoded key or fallback to prop, then to env var
    const finalApiKey = apiKey || GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    const mapContainerStyle = {
        ...baseContainerStyle,
        height: resolveHeight(height),
    } as React.CSSProperties;

    // Call hooks before any conditional returns
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'clubviz-map-picker',
        googleMapsApiKey: finalApiKey,
        libraries: GOOGLE_LIBRARIES,
        preventGoogleFontsLoading: true,
    });

    // Setup advanced marker when map loads (hook must run every render to satisfy React rules)
    useEffect(() => {
        if (!isLoaded || !mapRef.current) return;

        // Remove old marker if it exists
        if (markerRef.current) {
            markerRef.current.map = null;
            markerRef.current = null;
        }

        if (legacyMarkerRef.current) {
            legacyMarkerRef.current.setMap(null);
            legacyMarkerRef.current = null;
        }

        const mapInstance = mapRef.current;
        if (!mapInstance) return;

        // Create new advanced marker when supported, fallback to default Marker otherwise
        if (window.google?.maps?.marker?.AdvancedMarkerElement) {
            const marker = new window.google.maps.marker.AdvancedMarkerElement({
                map: mapInstance,
                position: center,
                title: 'Current Location',
            });
            markerRef.current = marker;
        } else if (window.google?.maps?.Marker) {
            const classicMarker = new window.google.maps.Marker({
                map: mapInstance,
                position: center,
                title: 'Current Location',
            });
            legacyMarkerRef.current = classicMarker;
        }
    }, [isLoaded, center]);

    const handleMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const handleMapUnmount = useCallback(() => {
        mapRef.current = null;
        if (markerRef.current) {
            markerRef.current.map = null;
            markerRef.current = null;
        }
        if (legacyMarkerRef.current) {
            legacyMarkerRef.current.setMap(null);
            legacyMarkerRef.current = null;
        }
    }, []);

    // Now safe to have early returns (hooks already declared)
    if (!finalApiKey) {
        console.error('❌ Google Maps API key missing! Please check:');
        console.error('   - Env var: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
        console.error('   - File: .env.local');
        console.error('   - Restart dev server after changes');
        return (
            <div className="rounded-2xl border border-dashed border-yellow-500/50 bg-yellow-500/10 p-4 text-center text-sm text-yellow-100">
                <p className="font-semibold">⚠️ Google Maps API Key Missing</p>
                <p className="mt-2 text-xs text-yellow-200">
                    Add to .env.local:<br />
                    <code className="block bg-yellow-900/50 px-2 py-1 mt-1 rounded font-mono">
                        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDW9KJ9rak_A4DNRAFT203Z_40bmVMi4IM
                    </code>
                </p>
                <p className="mt-2 text-xs text-yellow-200">Then restart: <code className="bg-yellow-900/50 px-1 rounded">npm run dev</code></p>
            </div>
        );
    }

    if (loadError) {
        console.error('Google Maps JavaScript API failed to load:', loadError);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'this site';
        return (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                <p className="font-semibold mb-2">⚠️ Google Maps failed to load</p>
                <p className="text-xs mb-2">Error: <code className="bg-red-900/50 px-1 rounded">{loadError.message || 'Unknown error'}</code></p>
                <div className="text-xs space-y-1 text-red-200">
                    <p><strong>Fix: Add authorized referrers</strong></p>
                    <ol className="ml-3 space-y-1">
                        <li>1. Open <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-100">Google Cloud Console</a></li>
                        <li>2. Find your API key and click Edit</li>
                        <li>3. Go to "Application restrictions" → "HTTP referrers"</li>
                        <li>4. Add both lines:</li>
                        <li className="ml-4 font-mono bg-red-900/30 px-2 py-1 rounded">http://localhost:3001/*</li>
                        <li className="ml-4 font-mono bg-red-900/30 px-2 py-1 rounded">https://localhost:3001/*</li>
                        <li>5. Save, then restart: <code className="bg-red-900/50 px-1 rounded">pnpm dev</code></li>
                    </ol>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
                <Loader2 className="h-5 w-5 animate-spin text-[#14FFEC]" />
                Loading map...
            </div>
        );
    }

    return (
        <div style={mapContainerStyle}>
            <GoogleMap
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
                center={center}
                zoom={13}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    suppressInfoWindows: true,
                    gestureHandling: 'greedy',
                    styles: [
                        {
                            elementType: 'geometry',
                            stylers: [{ color: '#0b2526' }],
                        },
                        {
                            elementType: 'labels.text.fill',
                            stylers: [{ color: '#f0fdfa' }],
                        },
                    ],
                }}
                onError={(error) => {
                    // Suppress error messages from showing
                    console.log('Map event:', error);
                }}
                onClick={(event) => {
                    if (!event.latLng) return;
                    const lat = event.latLng.lat();
                    const lng = event.latLng.lng();
                    onSelect({ lat, lng });
                }}
            >
                <CircleF
                    center={center}
                    radius={radius}
                    options={{
                        fillColor: '#14ffec33',
                        strokeColor: '#14ffec',
                        strokeOpacity: 0.5,
                        strokeWeight: 1,
                    }}
                />
            </GoogleMap>
            <div className="flex items-center justify-between bg-[#021010]/80 px-4 py-2 text-xs text-white/70">
                <span className="flex items-center gap-2 font-semibold uppercase tracking-wide">
                    <MapPin className="h-3.5 w-3.5" /> Tap anywhere to pin
                </span>
            </div>
        </div>
    );
}
