'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CircleF, GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, MapPin, Maximize2, Minimize2, Search, X } from 'lucide-react';

// Static libraries array to prevent LoadScript reload warning
const GOOGLE_LIBRARIES: ('marker' | 'places')[] = ['marker', 'places'];

// Google Maps API Key - from environment variable
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Dark theme map styles for Google Maps
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#1a2e35' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2e35' }, { weight: 2 }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2d4a4a' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64a89a' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#14FFEC' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#243f3f' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a8d' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e3d34' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4a8b6e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d4a4a' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a3535' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5ab' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a5858' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2d4545' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5cc' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#344f4f' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2d4545' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#14FFEC' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e2628' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a7a7a' }] },
];

interface GoogleMapPickerProps {
    center: { lat: number; lng: number };
    currentLocation?: { lat: number; lng: number } | null;
    selectedLocation?: { lat: number; lng: number } | null;
    radius?: number;
    onSelect: (coords: { lat: number; lng: number }) => void;
    apiKey?: string;
    height?: number | string;
    showFullscreenButton?: boolean;
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
    return height || '450px';
};

// OpenStreetMap dark interactive map component used when Google Maps fails or is unauthenticated
function OSMMapPicker({
    center,
    selectedLocation,
    onSelect,
    height
}: {
    center: { lat: number; lng: number };
    selectedLocation?: { lat: number; lng: number } | null;
    onSelect: (coords: { lat: number; lng: number }) => void;
    height?: number | string;
}) {
    const activeCoords = selectedLocation || center;
    const delta = 0.025;
    const bbox = `${activeCoords.lng - delta}%2C${activeCoords.lat - delta}%2C${activeCoords.lng + delta}%2C${activeCoords.lat + delta}`;

    return (
        <div
            style={{ width: '100%', height: resolveHeight(height) }}
            className="relative rounded-2xl overflow-hidden border border-[#14FFEC]/30 bg-[#021313] shadow-2xl flex flex-col group"
        >
            <div className="relative flex-1 w-full h-full overflow-hidden">
                <iframe
                    title="Interactive Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${activeCoords.lat}%2C${activeCoords.lng}`}
                    className="w-full h-full filter invert-[0.92] hue-rotate-180 brightness-[0.85] contrast-[1.2] transition-opacity duration-300"
                />
            </div>
            <div className="flex items-center justify-between bg-[#082A2B]/90 backdrop-blur-md px-4 py-2.5 text-xs border-t border-[#14FFEC]/20">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#14FFEC] animate-pulse" />
                    <span className="text-[#14FFEC] font-bold">Interactive Map</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-[11px] font-mono">
                    <MapPin className="w-3 h-3 text-[#14FFEC]" />
                    <span>{activeCoords.lat.toFixed(4)}, {activeCoords.lng.toFixed(4)}</span>
                </div>
            </div>
        </div>
    );
}

export function GoogleMapPicker({ center, currentLocation, selectedLocation, radius = 5000, onSelect, apiKey, height, showFullscreenButton = true }: GoogleMapPickerProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const currentMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const currentLegacyMarkerRef = useRef<google.maps.Marker | null>(null);
    const selectedMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const selectedLegacyMarkerRef = useRef<google.maps.Marker | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
    const [hasAuthFailure, setHasAuthFailure] = useState(false);

    // Capture global Google Maps authentication / key failure
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).gm_authFailure = () => {
                console.warn('⚠️ Google Maps API Key rejected. Automatically switching to OpenStreetMap interactive map.');
                setHasAuthFailure(true);
            };
        }

        const style = document.createElement('style');
        style.id = 'gm-style-override';
        style.innerHTML = `
            .gm-err-container, .gm-err-content, .gm-err-title, .gm-err-message,
            .dismissButton, .gm-style-cc, div[role="dialog"] {
                display: none !important;
            }
        `;
        if (!document.getElementById('gm-style-override')) {
            document.head.appendChild(style);
        }

        return () => {
            document.getElementById('gm-style-override')?.remove();
        };
    }, []);

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.log('Fullscreen not supported:', err);
        }
    };

    const finalApiKey = apiKey || GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    const mapContainerStyle = {
        ...baseContainerStyle,
        height: resolveHeight(height),
    } as React.CSSProperties;

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'clubviz-map-picker',
        googleMapsApiKey: finalApiKey,
        libraries: GOOGLE_LIBRARIES,
        preventGoogleFontsLoading: true,
    });

    // Current location marker setup
    useEffect(() => {
        if (!isLoaded || !mapRef.current || !currentLocation || hasAuthFailure) return;

        const mapInstance = mapRef.current;
        try {
            if (currentLegacyMarkerRef.current) {
                currentLegacyMarkerRef.current.setMap(null);
            }
            if (window.google?.maps?.Marker) {
                const marker = new window.google.maps.Marker({
                    map: mapInstance,
                    position: currentLocation,
                    title: 'Saved Location',
                    icon: {
                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                        fillColor: '#3B82F6',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                        scale: 1.5,
                        anchor: new window.google.maps.Point(12, 22),
                    },
                    zIndex: 100,
                });
                currentLegacyMarkerRef.current = marker;
            }
        } catch (error) {
            console.log('Error creating current location marker:', error);
        }
    }, [isLoaded, currentLocation, hasAuthFailure]);

    // Selected location marker setup
    useEffect(() => {
        if (!isLoaded || !mapRef.current || !selectedLocation || hasAuthFailure) return;

        const mapInstance = mapRef.current;
        try {
            if (selectedLegacyMarkerRef.current) {
                selectedLegacyMarkerRef.current.setMap(null);
            }
            if (window.google?.maps?.Marker) {
                const marker = new window.google.maps.Marker({
                    map: mapInstance,
                    position: selectedLocation,
                    title: 'Selected Location',
                    icon: {
                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                        fillColor: '#14FFEC',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2.5,
                        scale: 2,
                        anchor: new window.google.maps.Point(12, 22),
                    },
                    zIndex: 200,
                });
                selectedLegacyMarkerRef.current = marker;
            }
        } catch (error) {
            console.log('Error creating selected location marker:', error);
        }
    }, [isLoaded, selectedLocation, hasAuthFailure]);

    const handleMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const handleMapUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    // Return OpenStreetMap interactive fallback if key missing, invalid, or API failed
    if (!finalApiKey || loadError || hasAuthFailure) {
        return (
            <OSMMapPicker
                center={mapCenter || center}
                selectedLocation={selectedLocation}
                onSelect={onSelect}
                height={height}
            />
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70 min-h-[250px]">
                <Loader2 className="h-5 w-5 animate-spin text-[#14FFEC]" />
                <span>Loading map...</span>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={isFullscreen ? { width: '100%', height: '100vh', borderRadius: 0 } : mapContainerStyle}
            className="relative"
        >
            <GoogleMap
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
                center={mapCenter || center}
                zoom={13}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    fullscreenControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    gestureHandling: 'greedy',
                    styles: DARK_MAP_STYLES,
                    backgroundColor: '#1a2e35',
                    clickableIcons: false,
                }}
                onClick={(event) => {
                    try {
                        if (!event || !event.latLng) return;
                        const lat = event.latLng.lat();
                        const lng = event.latLng.lng();
                        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                            setMapCenter({ lat, lng });
                            onSelect({ lat, lng });
                            if (mapRef.current) {
                                mapRef.current.setCenter({ lat, lng });
                                mapRef.current.panTo({ lat, lng });
                            }
                        }
                    } catch (error) {
                        console.log('Error handling map click:', error);
                    }
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

            {showFullscreenButton && (
                <button
                    onClick={toggleFullscreen}
                    className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-[#0a3a3a]/90 border border-[#14FFEC]/30 text-[#14FFEC] hover:bg-[#0a4a4a] transition-colors shadow-lg"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </button>
            )}
        </div>
    );
}
