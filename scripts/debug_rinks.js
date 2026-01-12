
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
    console.log('--- Debugging Rinks ---');
    const { data: rinks, error } = await supabase.from('rinks').select('*');
    if (error) {
        console.error('Error fetching rinks:', error);
    } else {
        console.log(`Total Rinks: ${rinks ? rinks.length : 0}`);
        if (rinks) {
            rinks.forEach(r => {
                console.log(`- ${r.name} (${r.city}): ${r.latitude}, ${r.longitude} [${r.rink_type}]`);
            });
        }
    }

    console.log('\n--- Checking Users Schema ---');
    // unexpected error if column doesn't exist?
    const { data: users, error: userError } = await supabase.from('users').select('id, avatar_id').limit(1);

    if (userError) {
        console.log('Error fetching avatar_id (Column likely missing):', userError.message);
    } else {
        console.log('Success fetching avatar_id! Column exists.');
    }
}

main();
