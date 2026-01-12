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
    center?: [number, number];
    zoom?: number;
    cursor?: string;
}

export default function RetroMap({
    rinks,
    reports,
    onRinkClick,
    onMapClick,
    center = [-73.5673, 45.5017], // Default: Montreal
    zoom = 11,
    cursor = 'default',
}: RetroMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Initialize map
    useEffect(() => {
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
                onMapClick?.(e.lngLat.lat, e.lngLat.lng);
            });

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

            // Update cursor when it changes
            if (map.current) {
                map.current.getCanvas().style.cursor = cursor;
            }

            // Play skate scratch sound on map drag
            map.current.on('dragend', () => {
                playSound('skate-scratch');
            });
        } catch (err) {
            console.error('Error initializing map:', err);
        }

        return () => {
            map.current?.remove();
        };
    }, [center, zoom, onMapClick, cursor]);

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

        // Clear existing markers
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
            el.addEventListener('click', () => {
                playSound('menu-beep');
                onRinkClick?.(rink);
            });

            markers.push(marker);
        });

        return () => {
            markers.forEach(marker => marker.remove());
        };
    }, [rinks, reports, mapLoaded, onRinkClick]);

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
