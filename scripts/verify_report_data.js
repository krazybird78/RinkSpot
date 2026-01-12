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
    console.log('--- Verifying Report Data Fetching ---');

    // 1. Get a rink with reports
    const { data: rinks } = await supabase.from('rinks').select('id, name').limit(1);
    if (!rinks || rinks.length === 0) {
        console.log('No rinks found.');
        return;
    }
    const rink = rinks[0];
    console.log(`Checking reports for rink: ${rink.name} (${rink.id})`);

    // 2. Fetch reports with user data (Simulating RinkDetailModal query)
    const { data: reports, error } = await supabase
        .from('reports')
        .select('*, users(display_name, avatar_id)')
        .eq('rink_id', rink.id)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching reports:', error);
        return;
    }

    console.log(`Fetched ${reports.length} reports.`);

    reports.forEach((r, i) => {
        console.log(`\nReport #${i + 1}:`);
        console.log(`- Ice: ${r.ice_status}, Crowd: ${r.crowd_level}`);
        console.log(`- User: ${JSON.stringify(r.users)}`);

        if (r.users) {
            console.log(`  -> Display Name: ${r.users.display_name}`);
            console.log(`  -> Avatar ID: ${r.users.avatar_id}`);
        } else {
            console.log('  -> [WARNING] User data is missing/null');
        }
    });

    if (reports.length === 0) {
        console.log('No reports found for this rink. Try adding one via the app to test.');
    }
}

main();
