const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- Verifying Leaderboard Data ---');

    // 1. Fetch Stats
    const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(10);

    if (statsError) {
        console.error('Error fetching stats:', statsError);
        return;
    }
    console.log(`Fetched ${statsData.length} stats records.`);

    if (statsData.length === 0) return;

    // 2. Fetch Users
    const userIds = statsData.map(s => s.user_id);
    console.log('User IDs:', userIds);

    const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, team:neighborhood_team, avatar_id')
        .in('id', userIds);

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }
    console.log(`Fetched ${usersData.length} user records.`);

    // 3. Merge and Display
    const merged = statsData.map((stat, index) => {
        const user = usersData.find(u => u.id === stat.user_id);
        const displayName = user?.display_name || 'Anonymous';
        const avatarId = user?.avatar_id;
        const rank = index + 1;

        console.log(`#${rank} User ID: ${stat.user_id}`);
        console.log(`   Points: ${stat.total_points}`);
        console.log(`   Display Name: ${displayName} (Raw: ${user?.display_name})`);
        console.log(`   Avatar ID: ${avatarId}`);
        console.log(`   User Record Found: ${!!user}`);
        console.log('---');
    });
}

main();
