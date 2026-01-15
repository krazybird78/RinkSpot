
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use Service Role to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function recalculateScores() {
    console.log('--- Recalculating Scores for All Users ---');

    // 1. Fetch all users
    // Note: We should fetch from 'users' table, assuming it's the source of truth for profiles
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name');

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        console.log(`Processing ${user.display_name} (${user.id})...`);

        // 2. Count Rinks
        const { count: rinkCount, error: rinkError } = await supabase
            .from('rinks')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id);

        if (rinkError) {
            console.error(`Error counting rinks for ${user.display_name}:`, rinkError);
            continue;
        }

        // 3. Count Reports
        const { count: reportCount, error: reportError } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (reportError) {
            console.error(`Error counting reports for ${user.display_name}:`, reportError);
            continue;
        }

        // 4. Calculate Points
        // 50 pts per rink, 10 pts per report
        // Note: reportCount includes the initial report created with a rink
        const rinks = rinkCount || 0;
        const reports = reportCount || 0;
        const totalPoints = (rinks * 50) + (reports * 10);

        console.log(`  -> Rinks: ${rinks}, Reports: ${reports} => Points: ${totalPoints}`);

        // 5. Update user_stats
        // We upsert to ensure row exists
        const { error: upsertError } = await supabase
            .from('user_stats')
            .upsert({
                user_id: user.id,
                total_points: totalPoints,
                rinks_added: rinks,
                reports_submitted: reports,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' }); // Important to specify conflict target if relying on PK

        if (upsertError) {
            console.error(`  -> Error updating stats:`, upsertError);
        } else {
            console.log(`  -> Stats updated successfully.`);
        }
    }

    console.log('--- Recalculation Complete ---');
}

recalculateScores();
