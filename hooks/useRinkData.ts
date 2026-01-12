import { useState, useEffect, useCallback } from 'react';
import { supabase, Rink, Report } from '@/lib/supabase';

export function useRinkData() {
    const [rinks, setRinks] = useState<Rink[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        console.log('Loading data from Supabase...');
        try {
            // Fetch rinks
            const { data: rinksData, error: rinksError } = await supabase
                .from('rinks')
                .select('*')
                .order('created_at', { ascending: false });

            if (rinksError) {
                console.error('Error loading rinks:', rinksError);
                throw rinksError;
            }

            // Filter out invalid coordinates (e.g., 0,0 initialized rinks) AND known duplicates/ghosts
            const invalidIds = [
                '362cd349-cc7c-456e-93e1-9913660bf847', // Nuns Island (0,0)
                '2ef96e5d-99f5-46a7-9af5-a66b76c13347'  // Duplicate Parc de la Fontaine
            ];

            const validRinks = (rinksData || []).filter(r =>
                !(Math.abs(r.latitude) < 0.0001 && Math.abs(r.longitude) < 0.0001) &&
                !invalidIds.includes(r.id)
            );

            // Fetch active deletion requests to filter out expired ones
            const { data: deletionRequests } = await supabase
                .from('deletion_requests')
                .select('rink_id, status, scheduled_deletion_at')
                .eq('status', 'confirmed');

            const deletedRinkIds = (deletionRequests || [])
                .filter(req => req.scheduled_deletion_at && new Date(req.scheduled_deletion_at) < new Date())
                .map(req => req.rink_id);

            const finalRinks = validRinks.filter(r => !deletedRinkIds.includes(r.id));

            // Fetch reports (Optimization: Request only last 48 hours to improve performance)
            const fortyEightHoursAgo = new Date();
            fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

            const { data: reportsData, error: reportsError } = await supabase
                .from('reports')
                .select('*')
                .gte('created_at', fortyEightHoursAgo.toISOString())
                .order('created_at', { ascending: false });

            if (reportsError) {
                console.error('Error loading reports:', reportsError);
                throw reportsError;
            }

            console.log('Data loaded successfully:', { rinks: finalRinks.length, reports: reportsData?.length });
            setRinks(finalRinks);
            setReports(reportsData || []);
        } catch (error) {
            console.error('Error loading data:', error);
            // Set empty arrays so the app can still load
            setRinks([]);
            setReports([]);
        } finally {
            console.log('Data loading complete');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { rinks, reports, loading, refreshData: fetchData };
}
