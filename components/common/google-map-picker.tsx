'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CircleF, GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, MapPin, Maximize2, Minimize2, Minus, Plus } from 'lucide-react';

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
    /** Highlight circle in metres. Pass 0 to hide it. */
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

const TILE_SIZE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const DEFAULT_ZOOM = 15;
const DRAG_THRESHOLD = 6; // px before a press counts as a pan instead of a tap

// Standard Web Mercator, the projection OSM tiles are cut in.
const projectToPixels = (lat: number, lng: number, zoom: number) => {
    const worldSize = TILE_SIZE * 2 ** zoom;
    const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
    const sinLat = Math.sin((clampedLat * Math.PI) / 180);
    return {
        x: ((lng + 180) / 360) * worldSize,
        y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldSize,
    };
};

const unprojectFromPixels = (x: number, y: number, zoom: number) => {
    const worldSize = TILE_SIZE * 2 ** zoom;
    const n = Math.PI - (2 * Math.PI * y) / worldSize;
    return {
        lat: (180 / Math.PI) * Math.atan(Math.sinh(n)),
        lng: (x / worldSize) * 360 - 180,
    };
};

/**
 * Interactive dark map used when Google Maps has no key, fails to load, or
 * rejects the key. It draws OSM raster tiles directly instead of embedding
 * openstreetmap.org in an iframe: the embed paints blank for seconds and
 * swallows every click, so "tap the map to drop a pin" never worked there.
 * Drag to pan, +/- to zoom, tap to drop the pin.
 */
function OSMMapPicker({
    center,
    selectedLocation,
    onSelect,
    height,
    showFullscreenButton,
    containerRef,
    isFullscreen,
    onToggleFullscreen,
}: {
    center: { lat: number; lng: number };
    selectedLocation?: { lat: number; lng: number } | null;
    onSelect: (coords: { lat: number; lng: number }) => void;
    height?: number | string;
    showFullscreenButton?: boolean;
    containerRef: React.RefObject<HTMLDivElement>;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}) {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const dragRef = useRef<{ id: number; startX: number; startY: number; moved: boolean } | null>(null);

    const [view, setView] = useState(() => selectedLocation || center);
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [tilesReady, setTilesReady] = useState(false);

    // Follow the parent whenever it re-centres the map (search result, GPS fix, ...)
    const centerKey = `${center.lat},${center.lng}`;
    useEffect(() => {
        setView(center);
        setDragOffset({ x: 0, y: 0 });
    }, [centerKey]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const node = viewportRef.current;
        if (!node) return;
        const measure = () => setSize({ width: node.clientWidth, height: node.clientHeight });
        measure();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const width = size.width || 1;
    const viewHeight = size.height || 1;

    const centerPixels = projectToPixels(view.lat, view.lng, zoom);
    // Top-left corner of the viewport in world pixels, with any in-progress drag applied.
    const originX = centerPixels.x - width / 2 - dragOffset.x;
    const originY = centerPixels.y - viewHeight / 2 - dragOffset.y;

    const tileCount = 2 ** zoom;
    const firstTileX = Math.floor(originX / TILE_SIZE);
    const lastTileX = Math.floor((originX + width) / TILE_SIZE);
    const firstTileY = Math.max(0, Math.floor(originY / TILE_SIZE));
    const lastTileY = Math.min(tileCount - 1, Math.floor((originY + viewHeight) / TILE_SIZE));

    const tiles: { key: string; url: string; left: number; top: number }[] = [];
    // Wait for the first measurement, otherwise the opening frame paints a
    // single tile column against a dark band on either side.
    for (let tx = firstTileX; size.width > 0 && tx <= lastTileX; tx += 1) {
        for (let ty = firstTileY; ty <= lastTileY; ty += 1) {
            const wrappedX = ((tx % tileCount) + tileCount) % tileCount;
            tiles.push({
                key: `${zoom}/${tx}/${ty}`,
                url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
                left: tx * TILE_SIZE - originX,
                top: ty * TILE_SIZE - originY,
            });
        }
    }

    const pinPosition = (() => {
        if (!selectedLocation) return null;
        const pixels = projectToPixels(selectedLocation.lat, selectedLocation.lng, zoom);
        const x = pixels.x - originX;
        const y = pixels.y - originY;
        if (x < -48 || y < -48 || x > width + 48 || y > viewHeight + 48) return null;
        return { x, y };
    })();

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current) return;
        dragRef.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already released */ }
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        drag.moved = true;
        setDragOffset({ x: dx, y: dy });
    };

    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        dragRef.current = null;
        try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* ignore */ }

        if (!drag.moved) {
            const rect = event.currentTarget.getBoundingClientRect();
            const point = unprojectFromPixels(
                originX + (event.clientX - rect.left),
                originY + (event.clientY - rect.top),
                zoom
            );
            setDragOffset({ x: 0, y: 0 });
            onSelect(point);
            return;
        }

        const moved = unprojectFromPixels(originX + width / 2, originY + viewHeight / 2, zoom);
        setView(moved);
        setDragOffset({ x: 0, y: 0 });
    };

    const zoomBy = (delta: number) => {
        setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
        setDragOffset({ x: 0, y: 0 });
    };

    return (
        <div
            ref={containerRef}
            style={isFullscreen ? { width: '100%', height: '100vh' } : { width: '100%', height: resolveHeight(height) }}
            className="relative rounded-[20px] overflow-hidden border border-[#14FFEC]/20 bg-[#0D1F1F] select-none"
        >
            <div
                ref={viewportRef}
                className="absolute inset-0 overflow-hidden touch-none cursor-crosshair"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
            >
                {/* Tiles are inverted into a dark theme to match the sheet */}
                <div className="absolute inset-0 [filter:invert(1)_hue-rotate(180deg)_brightness(0.95)_contrast(0.9)_saturate(0.7)]">
                    {tiles.map((tile) => (
                        <img
                            key={tile.key}
                            src={tile.url}
                            alt=""
                            draggable={false}
                            loading="eager"
                            onLoad={() => setTilesReady(true)}
                            className="absolute pointer-events-none max-w-none"
                            style={{ left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}
                        />
                    ))}
                </div>

                {(!tilesReady || size.width === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 text-white/50 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-[#14FFEC]" />
                        Loading map...
                    </div>
                )}

                {pinPosition && (
                    <div
                        className="absolute pointer-events-none"
                        style={{ left: pinPosition.x, top: pinPosition.y, transform: 'translate(-50%, -100%)' }}
                    >
                        <MapPin
                            className="w-8 h-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
                            fill="#14FFEC"
                            stroke="#021313"
                            strokeWidth={1.75}
                        />
                    </div>
                )}
            </div>

            {/* Zoom + fullscreen controls */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                {showFullscreenButton && (
                    <button
                        type="button"
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#021313]/85 border border-[#14FFEC]/30 text-[#14FFEC] hover:bg-[#0a3a3a] transition-colors backdrop-blur-sm"
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => zoomBy(1)}
                    disabled={zoom >= MAX_ZOOM}
                    title="Zoom in"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#021313]/85 border border-[#14FFEC]/30 text-[#14FFEC] hover:bg-[#0a3a3a] transition-colors backdrop-blur-sm disabled:opacity-40"
                >
                    <Plus className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => zoomBy(-1)}
                    disabled={zoom <= MIN_ZOOM}
                    title="Zoom out"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#021313]/85 border border-[#14FFEC]/30 text-[#14FFEC] hover:bg-[#0a3a3a] transition-colors backdrop-blur-sm disabled:opacity-40"
                >
                    <Minus className="w-4 h-4" />
                </button>
            </div>

            {/* OSM tile usage policy requires visible attribution */}
            <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-1.5 right-2 text-[9px] text-white/45 hover:text-white/80 bg-[#021313]/70 px-1.5 py-0.5 rounded backdrop-blur-sm"
            >
                (c) OpenStreetMap
            </a>
        </div>
    );
}

export function GoogleMapPicker({ center, currentLocation, selectedLocation, radius = 5000, onSelect, apiKey, height, showFullscreenButton = true }: GoogleMapPickerProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const currentLegacyMarkerRef = useRef<google.maps.Marker | null>(null);
    const selectedLegacyMarkerRef = useRef<google.maps.Marker | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasAuthFailure, setHasAuthFailure] = useState(false);

    // Capture global Google Maps authentication / key failure
    useEffect(() => {
        if (typeof window === 'undefined') return;

        (window as any).gm_authFailure = () => {
            console.warn('Google Maps API key rejected — falling back to the OpenStreetMap picker.');
            setHasAuthFailure(true);
        };

        // Hide only Google's own error overlay. Never blanket-hide dialogs:
        // that used to swallow every role="dialog" on the page, this modal included.
        if (!document.getElementById('gm-style-override')) {
            const style = document.createElement('style');
            style.id = 'gm-style-override';
            style.innerHTML = `
                .gm-err-container, .gm-err-content, .gm-err-title,
                .gm-err-message, .gm-err-autocomplete { display: none !important; }
            `;
            document.head.appendChild(style);
        }

        return () => {
            document.getElementById('gm-style-override')?.remove();
        };
    }, []);

    // Keep local fullscreen state in step with the browser (Esc, gestures, ...)
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggleFullscreen = useCallback(async () => {
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
    }, []);

    const finalApiKey = apiKey || GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'clubviz-map-picker',
        googleMapsApiKey: finalApiKey,
        libraries: GOOGLE_LIBRARIES,
        preventGoogleFontsLoading: true,
    });

    const usingGoogle = Boolean(finalApiKey) && !loadError && !hasAuthFailure;

    // Current location marker setup
    useEffect(() => {
        if (!usingGoogle || !isLoaded || !mapRef.current || !currentLocation) return;

        const mapInstance = mapRef.current;
        try {
            currentLegacyMarkerRef.current?.setMap(null);
            if (window.google?.maps?.Marker) {
                currentLegacyMarkerRef.current = new window.google.maps.Marker({
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
            }
        } catch (error) {
            console.log('Error creating current location marker:', error);
        }
    }, [usingGoogle, isLoaded, currentLocation]);

    // Selected location marker setup
    useEffect(() => {
        if (!usingGoogle || !isLoaded || !mapRef.current || !selectedLocation) return;

        const mapInstance = mapRef.current;
        try {
            selectedLegacyMarkerRef.current?.setMap(null);
            if (window.google?.maps?.Marker) {
                selectedLegacyMarkerRef.current = new window.google.maps.Marker({
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
            }
        } catch (error) {
            console.log('Error creating selected location marker:', error);
        }
    }, [usingGoogle, isLoaded, selectedLocation]);

    // Recentre when the parent picks a new place
    useEffect(() => {
        if (!usingGoogle || !mapRef.current) return;
        mapRef.current.panTo(center);
    }, [usingGoogle, center.lat, center.lng]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const handleMapUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    // OpenStreetMap interactive fallback if key missing, invalid, or the API failed
    if (!usingGoogle) {
        return (
            <OSMMapPicker
                center={center}
                selectedLocation={selectedLocation}
                onSelect={onSelect}
                height={height}
                showFullscreenButton={showFullscreenButton}
                containerRef={containerRef as React.RefObject<HTMLDivElement>}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
            />
        );
    }

    if (!isLoaded) {
        return (
            <div
                style={{ height: resolveHeight(height) }}
                className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-[#14FFEC]/20 bg-[#0D1F1F] text-white/60 text-sm"
            >
                <Loader2 className="h-5 w-5 animate-spin text-[#14FFEC]" />
                <span>Loading map...</span>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={isFullscreen
                ? { width: '100%', height: '100vh', borderRadius: 0 }
                : { ...baseContainerStyle, borderRadius: 20, height: resolveHeight(height) }}
            className="relative border border-[#14FFEC]/20"
        >
            <GoogleMap
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
                center={center}
                zoom={15}
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
                        if (!event?.latLng) return;
                        const lat = event.latLng.lat();
                        const lng = event.latLng.lng();
                        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                        onSelect({ lat, lng });
                        mapRef.current?.panTo({ lat, lng });
                    } catch (error) {
                        console.log('Error handling map click:', error);
                    }
                }}
            >
                {radius > 0 && (
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
                )}
            </GoogleMap>

            {showFullscreenButton && (
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-[#021313]/85 border border-[#14FFEC]/30 text-[#14FFEC] hover:bg-[#0a4a4a] transition-colors backdrop-blur-sm"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
            )}
        </div>
    );
}
