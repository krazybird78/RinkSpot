
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkKrazybird() {
    console.log('--- Checking User: Krazybird ---');

    // 1. Find User ID
    // Check 'users' table (public profile)
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .ilike('display_name', 'Krazybird');

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    if (!users || users.length === 0) {
        console.log('User "Krazybird" not found in public.users table.');
        // Try searching in auth.users? We can't easily.
        return;
    }

    console.log(`Found ${users.length} user(s) matching "Krazybird":`);
    users.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.display_name}, Email: ${u.email}`));

    const userId = users[0].id; // Assumption: only one or we take first

    // 2. Check User Stats
    const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId);

    if (statsError) console.error('Error fetching stats:', statsError);
    else console.log('User Stats:', stats);

    // 3. Check Rinks Created
    const { data: rinks, error: rinksError } = await supabase
        .from('rinks')
        .select('id, name, created_at')
        .eq('created_by', userId);

    if (rinksError) console.error('Error fetching rinks:', rinksError);
    else console.log(`Rinks Created (${rinks?.length}):`, rinks);

    // 4. Check Reports Submitted
    const { count: reportCount, error: reportError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (reportError) console.error('Error fetching report count:', reportError);
    else console.log('Reports Submitted:', reportCount);

    // 5. Audit Points Logic
    // Expected points: (Rinks * 50) + (Reports * 10)
    // Note: Reports includes the automatic one when creating a rink.
    // Wait, AddRinkModal calls `awardPoints` twice: once for 'add_rink', once for 'submit_report'.
    // So 1 Rink = 50 + 10 = 60 points.

    const expectedPoints = ((rinks?.length || 0) * 50) + ((reportCount || 0) * 10); // Approximation
    // Actually, reportCount includes the initial report.
    // So if user added 1 rink, they have 1 rink + 1 report.
    // Points = 50 (rink) + 10 (report) = 60.

    // If they updated photo: +5.

    console.log(`\nEstimated Expected Points (min): ${expectedPoints}`);
}

checkKrazybird();
