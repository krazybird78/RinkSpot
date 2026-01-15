import { useState, useEffect, useCallback } from 'react';
import { supabase, Rink, Report } from '@/lib/supabase';

export type Bounds = {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};

export function useRinkData() {
    const [rinks, setRinks] = useState<Rink[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false); // Default to false, wait for map to initiate fetch

    const fetchRinksInBounds = useCallback(async (bounds: Bounds) => {
        setLoading(true);
        console.log('Fetching rinks for bounds:', bounds);
        try {
            // 1. Fetch Rinks from Secure API
            const params = new URLSearchParams({
                minLat: bounds.minLat.toString(),
                maxLat: bounds.maxLat.toString(),
                minLng: bounds.minLng.toString(),
                maxLng: bounds.maxLng.toString(),
            });

            const response = await fetch(`/api/rinks?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch rinks');

            const fetchedRinks: Rink[] = await response.json();

            // 2. Client-side filtering (Deletes/Dupes) - Could move to backend later
            const invalidIds = [
                '362cd349-cc7c-456e-93e1-9913660bf847',
                '2ef96e5d-99f5-46a7-9af5-a66b76c13347'
            ];

            // Note: API already filters by bounds, but we keep the ID filter
            const validRinks = fetchedRinks.filter(r => !invalidIds.includes(r.id));

            setRinks(validRinks);

            // 3. Fetch Reports via Secure API (Data Tiering)
            // Auth users get 48h, Anon get 12h
            if (validRinks.length > 0) {
                const { data: { session } } = await supabase.auth.getSession();
                const headers: HeadersInit = {};

                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`;
                }

                const reportParams = new URLSearchParams({
                    minLat: bounds.minLat.toString(),
                    maxLat: bounds.maxLat.toString(),
                    minLng: bounds.minLng.toString(),
                    maxLng: bounds.maxLng.toString(),
                });

                const reportsResponse = await fetch(`/api/reports?${reportParams.toString()}`, {
                    headers
                });

                if (reportsResponse.ok) {
                    const reportsData = await reportsResponse.json();
                    setReports(reportsData || []);
                } else {
                    console.error('Failed to fetch reports API');
                    setReports([]);
                }
            } else {
                setReports([]);
            }

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Remove initial useEffect. Data must be requested by the map.

    return { rinks, reports, loading, fetchRinksInBounds };
}
