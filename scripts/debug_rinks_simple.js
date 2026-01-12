
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- RINKS ---');
    const { data: rinks } = await supabase.from('rinks').select('name, city, latitude, longitude');
    if (rinks) {
        console.log(`Count: ${rinks.length}`);
        rinks.forEach(r => console.log(`- ${r.name} (${r.city}) [${r.latitude}, ${r.longitude}]`));
    } else {
        console.log('No rinks found or error.');
    }

    console.log('\n--- USERS ---');
    const { data: users } = await supabase.from('users').select('id, display_name, neighborhood_team');
    if (users) {
        console.log(`Count: ${users.length}`);
        users.forEach(u => console.log(`- ID: ${u.id.substring(0, 4)}... Name: "${u.display_name}" Team: ${u.neighborhood_team}`));
    }
}

main();
