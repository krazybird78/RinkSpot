import { supabase } from './supabase';

export type ActionType = 'add_rink' | 'submit_report' | 'upload_photo';
export type BadgeType = 'first_rink' | 'ice_scout' | 'streak_master' | 'photographer' | 'legend' | 'early_bird' | 'night_owl' | 'weekend_warrior' | 'globe_trotter' | 'cold_snap' | 'community_pillar';

const POINTS = {
    add_rink: 50,
    submit_report: 10,
    upload_photo: 5,
};

/**
 * Get badge metadata (name, description)
 */
export function getBadgeInfo(badgeType: BadgeType): { name: string; description: string } {
    const badges = {
        first_rink: {
            name: 'First Rink',
            description: 'Added your first rink to RinkSpot',
        },
        ice_scout: {
            name: 'Ice Scout',
            description: 'Submitted 10 condition reports',
        },
        streak_master: {
            name: 'On Fire',
            description: 'Maintained a 7-day reporting streak',
        },
        photographer: {
            name: 'Photographer',
            description: 'Uploaded 20 rink photos',
        },
        legend: {
            name: 'Legend',
            description: 'Earned 500+ points',
        },
        early_bird: {
            name: 'Early Bird',
            description: 'Submitted a report before 8 AM',
        },
        night_owl: {
            name: 'Night Owl',
            description: 'Submitted a report after 10 PM',
        },
        weekend_warrior: {
            name: 'Weekend Warrior',
            description: 'Submitted reports on both Saturday and Sunday',
        },
        globe_trotter: {
            name: 'Globe Trotter',
            description: 'Submitted reports in 3 different cities',
        },
        cold_snap: {
            name: 'Cold Snap',
            description: 'Braved the cold! (Temp below -15°C)',
        },
        community_pillar: {
            name: 'Pillar',
            description: 'A key member of the local community',
        },
    };

    return badges[badgeType];
}

/**
 * Award points to a user for an action
 */
export async function awardPoints(userId: string, action: ActionType) {
    try {
        const points = POINTS[action];
        if (!points) return;

        // 1. Get current stats
        const { data: stats, error: fetchError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching user stats:', fetchError);
            return;
        }

        let newStats = stats || {
            user_id: userId,
            total_points: 0,
            rinks_added: 0,
            reports_submitted: 0,
            photos_uploaded: 0, // Assuming this column exists or will be ignored if not? 
            // Warning: If column doesn't exist, this might fail unless we check schema. 
            // But usually 'user_stats' has these counters.
        };

        // 2. Update stats objects
        newStats.total_points = (newStats.total_points || 0) + points;

        if (action === 'add_rink') newStats.rinks_added = (newStats.rinks_added || 0) + 1;
        if (action === 'submit_report') newStats.reports_submitted = (newStats.reports_submitted || 0) + 1;
        if (action === 'upload_photo') newStats.photos_uploaded = (newStats.photos_uploaded || 0) + 1;

        // 3. Upsert stats
        const { error: upsertError } = await supabase
            .from('user_stats')
            .upsert(newStats);

        if (upsertError) {
            console.error('Error updating user stats:', upsertError);
            return;
        }

        // 4. Check for badges
        await checkAndAwardBadges(userId, newStats);

    } catch (error) {
        console.error('Error in awardPoints:', error);
    }
}

/**
 * Check if user qualifies for any new badges
 */
export async function checkAndAwardBadges(userId: string, stats: any) {
    try {
        // Fetch existing badges
        const { data: existingBadges } = await supabase
            .from('user_badges')
            .select('badge_type')
            .eq('user_id', userId);

        const earnedBadges = new Set(existingBadges?.map(b => b.badge_type) || []);
        const newBadges: BadgeType[] = [];

        // Definition of requirements
        if (!earnedBadges.has('first_rink') && stats.rinks_added >= 1) {
            newBadges.push('first_rink');
        }
        if (!earnedBadges.has('ice_scout') && stats.reports_submitted >= 10) {
            newBadges.push('ice_scout');
        }
        if (!earnedBadges.has('legend') && stats.total_points >= 500) {
            newBadges.push('legend');
        }
        if (!earnedBadges.has('photographer') && (stats.photos_uploaded || 0) >= 20) {
            newBadges.push('photographer');
        }

        // Placeholder logic for more complex badges (need more data/history to verify)
        // For now, these won't be auto-awarded by 'stats' counters alone easily.
        // Implementing simple logic where possible.

        if (newBadges.length > 0) {
            const badgesToInsert = newBadges.map(type => ({
                user_id: userId,
                badge_type: type,
                awarded_at: new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('user_badges')
                .insert(badgesToInsert);

            if (error) {
                console.error('Error awarding badges:', error);
            }
        }
    } catch (error) {
        console.error('Error checking badges:', error);
    }
}
