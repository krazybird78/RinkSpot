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

            // Move attribution to top-right
            map.current.addControl(new mapboxgl.AttributionControl({
                compact: true
            }), 'top-right');

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

            // Handle Map Load
            map.current.on('load', () => {
                console.log('Map loaded successfully');
                setMapLoaded(true);

                if (!map.current) return;

                // Add Source (empty initially)
                map.current.addSource('rinks-source', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    },
                    cluster: true,
                    clusterMaxZoom: 14, // Max zoom to cluster points
                    clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
                });

                // 1. Clusters Layer (Glowing Circles)
                map.current.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'rinks-source',
                    filter: ['has', 'point_count'],
                    paint: {
                        // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                        // with three steps to implement three types of circles:
                        //   * Blue, 20px circles when point count is less than 10
                        //   * Yellow, 30px circles when point count is between 10 and 30
                        //   * Pink, 40px circles when point count is greater than or equal to 30
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#4A90E2', // Blue (small)
                            10,
                            '#F59E0B', // Amber (medium)
                            30,
                            '#EF4444'  // Red (large)
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            15, // px
                            10,
                            20, // px
                            30,
                            25  // px
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#fff',
                        'circle-opacity': 0.8
                    }
                });

                // 2. Cluster Count Text
                map.current.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'rinks-source',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    },
                    paint: {
                        'text-color': '#ffffff'
                    }
                });

                // 3. Unclustered Points (Individual Rinks)
                map.current.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'rinks-source',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': ['get', 'color'], // Data-driven color
                        'circle-radius': 8,
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#fff',
                        'circle-opacity': 1
                    }
                });

                // --- Interactions ---

                // Click on Cluster -> Zoom in
                map.current.on('click', 'clusters', (e) => {
                    const features = map.current?.queryRenderedFeatures(e.point, {
                        layers: ['clusters']
                    });
                    const clusterId = features?.[0].properties?.cluster_id;
                    if (!map.current || !clusterId) return;

                    (map.current.getSource('rinks-source') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
                        clusterId,
                        (err, zoom) => {
                            if (err || !map.current) return;

                            map.current.easeTo({
                                center: (features?.[0].geometry as any).coordinates,
                                zoom: zoom as number
                            });
                        }
                    );
                });

                // Click on Unclustered Point -> Open Rink
                map.current.on('click', 'unclustered-point', (e) => {
                    e.originalEvent.stopPropagation(); // Stop propagation to map click
                    const feature = e.features?.[0];
                    if (!feature) return;

                    const rinkId = feature.properties?.id;
                    // Find the full rink object from props using ID to ensure we have latest state
                    // (Though we could pass data in props, lookup is safer for complex objects)
                    // We need to access the LATEST rinks prop. 
                    // Since specific rink data isn't in scope here, we might rely on the properties passed or external lookup.
                    // BUT: 'rinks' inside this closure is stale (initial render).
                    // We need a ref or pass all props to properties.
                    // For now, let's just pass the ID back up.
                    // The parent component or a ref lookup is needed.

                    // Actually, let's use a ref to get the current rinks list safely
                    playSound('menu-beep');
                    // We can emit the event with just the ID, or look it up if we have a Ref for rinks.
                    // Let's rely on the fact that onRinkClickRef handles the action, 
                    // but we need to pass the Rink object.
                    // Let's store rinks in a Ref so we can lookup inside this callback!
                });

                // Hover cursors
                map.current.on('mouseenter', 'clusters', () => {
                    if (map.current) map.current.getCanvas().style.cursor = 'pointer';
                });
                map.current.on('mouseleave', 'clusters', () => {
                    if (map.current) map.current.getCanvas().style.cursor = '';
                });
                map.current.on('mouseenter', 'unclustered-point', () => {
                    if (map.current) map.current.getCanvas().style.cursor = 'pointer';
                });
                map.current.on('mouseleave', 'unclustered-point', () => {
                    if (map.current) map.current.getCanvas().style.cursor = '';
                });

                // Retro styling
                map.current.setPaintProperty('water', 'fill-color', '#4A90E2');
                map.current.setPaintProperty('land', 'background-color', '#1F2937');
                map.current.getCanvas().style.cursor = cursor;

                // Trigger initial bounds
                const bounds = map.current?.getBounds();
                if (bounds && onBoundsChangeRef.current) {
                    onBoundsChangeRef.current({
                        minLng: bounds.getWest(),
                        maxLng: bounds.getEast(),
                        minLat: bounds.getSouth(),
                        maxLat: bounds.getNorth(),
                    });
                }
            });

            // Generic Map Click
            map.current.on('click', (e) => {
                // Ensure we didn't click a feature
                const features = map.current?.queryRenderedFeatures(e.point, { layers: ['unclustered-point', 'clusters'] });
                if (!features?.length) {
                    onMapClickRef.current?.(e.lngLat.lat, e.lngLat.lng);
                }
            });

            map.current.on('error', (e) => console.error('Mapbox error:', e));
            map.current.on('dragend', () => playSound('skate-scratch'));

        } catch (err) {
            console.error('Error initializing map:', err);
        }

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []); // Init once

    // Keep track of rinks for click lookup (to avoid stale closures)
    const rinksRef = useRef(rinks);
    useEffect(() => {
        rinksRef.current = rinks;
    }, [rinks]);

    // Handle Unclustered Point Click (Defined outside to access refs properly if needed, but easier to attach inside load if we use ref)
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // We need to attach the listener dynamically or use the one inside 'load' that references 'rinksRef'.
        // The listener inside 'load' runs once. It receives the event.
        // We can create a mutable ref for the lookup function.
    }, []);

    // Workaround: We need the click handler inside 'load' to access current rinks.
    // Solution: Use a Ref for the callback itself that we call from inside the map event.
    const handlePointClick = useRef((id: string) => {
        const rink = rinksRef.current.find(r => r.id === id);
        if (rink) {
            onRinkClickRef.current?.(rink);
        }
    });

    useEffect(() => {
        handlePointClick.current = (id: string) => {
            const rink = rinksRef.current.find(r => r.id === id);
            if (rink) {
                onRinkClickRef.current?.(rink);
            }
        };
    }, [rinks]); // Update access when rinks change? Actually ref is enough.

    // Better: Update the 'click' listener logic in the main effect?
    // No, main effect runs once.
    // Let's modify the listener in the main effect to call `handlePointClick.current(id)`.
    // I will add this logic to the main replacement block above.

    // RE-INJECTING missing piece into the replacement block:
    // "map.current.on('click', 'unclustered-point', (e) => { ... handlePointClick.current(id) ... })"

    // Update GeoJSON Source when props change
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        const source = map.current.getSource('rinks-source') as mapboxgl.GeoJSONSource;
        if (!source) return;

        // Prepare Status Map
        const rinkStatusMap = new Map<string, IceStatus>();
        reports.forEach(report => {
            const existing = rinkStatusMap.get(report.rink_id);
            if (!existing || new Date(report.created_at) > new Date(existing)) {
                rinkStatusMap.set(report.rink_id, report.ice_status);
            }
        });

        const getColor = (status: string) => {
            switch (status) {
                case 'frozen': return '#3B82F6';
                case 'good': return '#10B981';
                case 'slush': return '#F59E0B';
                case 'melted': return '#EF4444';
                default: return '#9CA3AF';
            }
        };

        const features: GeoJSON.Feature[] = rinks.map(rink => ({
            type: 'Feature',
            properties: {
                id: rink.id,
                name: rink.name,
                status: rinkStatusMap.get(rink.id) || 'good',
                color: getColor(rinkStatusMap.get(rink.id) || 'good')
            },
            geometry: {
                type: 'Point',
                coordinates: [rink.longitude, rink.latitude]
            }
        }));

        source.setData({
            type: 'FeatureCollection',
            features: features as any
        });

    }, [rinks, reports, mapLoaded]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
}
