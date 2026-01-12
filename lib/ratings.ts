import { supabase } from './supabase';

/**
 * Calculate the average rating for a rink based on all reports
 */
export async function calculateAverageRating(rinkId: string): Promise<{ average: number; count: number }> {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('rating')
            .eq('rink_id', rinkId)
            .not('rating', 'is', null);

        if (error) throw error;

        if (!data || data.length === 0) {
            return { average: 0, count: 0 };
        }

        const ratings = data.map(r => r.rating).filter(r => r !== null);
        const sum = ratings.reduce((acc, rating) => acc + rating, 0);
        const average = sum / ratings.length;

        return {
            average: Math.round(average * 10) / 10, // Round to 1 decimal
            count: ratings.length
        };
    } catch (error) {
        console.error('Error calculating average rating:', error);
        return { average: 0, count: 0 };
    }
}

/**
 * Get rating distribution for a rink (how many 5-star, 4-star, etc.)
 */
export async function getRatingDistribution(rinkId: string): Promise<Record<number, number>> {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('rating')
            .eq('rink_id', rinkId)
            .not('rating', 'is', null);

        if (error) throw error;

        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        data?.forEach(report => {
            if (report.rating) {
                distribution[report.rating]++;
            }
        });

        return distribution;
    } catch (error) {
        console.error('Error getting rating distribution:', error);
        return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
}
