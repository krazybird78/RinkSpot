'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Rink, Report, IceStatus } from '@/lib/supabase';
import { playSound } from '@/lib/sounds';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface RetroMapProps {
    rinks: Rink[];
    reports: Report[];
    onRinkClick?: (rink: Rink) => void;
    onMapClick?: (lat: number, lng: number) => void;
    onBoundsChange?: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => void; // New Prop
    center?: [number, number];
    zoom?: number;
    cursor?: string;
}

export default function RetroMap({
    rinks,
    reports,
    onRinkClick,
    onMapClick,
    onBoundsChange,
    center = [-73.5673, 45.5017], // Default: Montreal
    zoom = 11,
    cursor = 'default',
}: RetroMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const onRinkClickRef = useRef(onRinkClick);
    const onMapClickRef = useRef(onMapClick);
    const onBoundsChangeRef = useRef(onBoundsChange);

    // Update refs when props change
    useEffect(() => {
        onRinkClickRef.current = onRinkClick;
        onMapClickRef.current = onMapClick;
        onBoundsChangeRef.current = onBoundsChange;
    }, [onRinkClick, onMapClick, onBoundsChange]);

    // Initialize map
    useEffect(() => {
        if (map.current) return; // Only initialize once

        console.log('Initializing map with token:', mapboxgl.accessToken?.substring(0, 10) + '...');

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current!,
                style: 'mapbox://styles/mapbox/dark-v11', // Dark base for retro feel
                center,
                zoom,
                attributionControl: false,
            });

            // Move attribution to top-right to avoid footer overlapping
            map.current.addControl(new mapboxgl.AttributionControl({
                compact: true
            }), 'top-right');

            // Add map click listener
            map.current.on('click', (e) => {
                onMapClickRef.current?.(e.lngLat.lat, e.lngLat.lng);
            });

            // Handle Bounds Change
            const handleMoveEnd = () => {
                const bounds = map.current?.getBounds();
                if (bounds && onBoundsChangeRef.current) {
                    onBoundsChangeRef.current({
                        minLng: bounds.getWest(),
                        maxLng: bounds.getEast(),
                        minLat: bounds.getSouth(),
                        maxLat: bounds.getNorth(),
                    });
                }
            };

            map.current.on('moveend', handleMoveEnd);

            map.current.on('load', () => {
                console.log('Map loaded successfully');
                setMapLoaded(true);

                // Apply retro color filter to map
                if (map.current) {
                    map.current.setPaintProperty('water', 'fill-color', '#4A90E2');
                    map.current.setPaintProperty('land', 'background-color', '#1F2937');
                    map.current.getCanvas().style.cursor = cursor; // Set initial cursor
                }
            });

            map.current.on('error', (e) => {
                console.error('Mapbox error:', e);
            });

            // Play skate scratch sound on map drag
            map.current.on('dragend', () => {
                playSound('skate-scratch');
            });
        } catch (err) {
            console.error('Error initializing map:', err);
        }

        // Cleanup only on unmount
        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []); // Empty dependency array to initialize only once

    // Update cursor separately
    useEffect(() => {
        if (map.current) {
            map.current.getCanvas().style.cursor = cursor;
        }
    }, [cursor]);

    // Handle center/zoom updates if needed (optional, but good for imperative moves)
    // We typically don't want to force move the map if the user panned, unless specific logic demands it.
    // For now, let's leave this out to respect user's manual navigation unless specific "flyTo" prop is added later.

    // Add rink markers
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Get latest report for each rink to determine ice status
        const rinkStatusMap = new Map<string, IceStatus>();
        reports.forEach(report => {
            const existing = rinkStatusMap.get(report.rink_id);
            if (!existing || new Date(report.created_at) > new Date(existing)) {
                rinkStatusMap.set(report.rink_id, report.ice_status);
            }
        });

        // Clear existing markers (naive approach: remove all and re-add)
        // In a heavier app, we'd diff them, but for <100 rinks it's fine.
        // We need to track markers to remove them.
        // Since we don't have a ref for markers in this scope across renders easily without a ref,
        // let's assume this effect handles its own cleanup via return.

        const markers: mapboxgl.Marker[] = [];

        rinks.forEach(rink => {
            const status = rinkStatusMap.get(rink.id) || 'good';

            // Create marker container (Mapbox controls position of this)
            const el = document.createElement('div');
            el.style.cursor = 'pointer';

            // Create inner content (We control animation of this)
            const inner = document.createElement('div');
            inner.className = 'hover:scale-110 transition-transform duration-200';
            inner.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3" fill="#B4975A" stroke="none"/>
              </svg>
            `;
            el.appendChild(inner);

            const marker = new mapboxgl.Marker(el)
                .setLngLat([rink.longitude, rink.latitude])
                .addTo(map.current!);

            // Add click handler
            el.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent map click
                playSound('menu-beep');
                onRinkClickRef.current?.(rink);
            });

            markers.push(marker);
        });

        return () => {
            markers.forEach(marker => marker.remove());
        };
    }, [rinks, reports, mapLoaded]); // removed onRinkClick from deps as we use ref

    // Check for token
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        return (
            <div className="w-full h-full bg-rink-blue flex items-center justify-center">
                <div className="pixel-container max-w-sm text-center border-rose-500">
                    <h3 className="text-rose-500 mb-4">MISSING MAP KEY</h3>
                    <p className="text-[10px] text-ice-white mb-4">
                        The Zamboni cannot clean the ice without a Mapbox Token.
                    </p>
                    <p className="text-[8px] text-ice-white/60">
                        Create .env.local and add NEXT_PUBLIC_MAPBOX_TOKEN
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />
            {/* Overlay border removed for cleaner look, map takes full space */}
        </div>
    );
}
