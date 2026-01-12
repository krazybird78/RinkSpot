
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRinks() {
    const { data: rinks, error } = await supabase.from('rinks').select('id, name, latitude, longitude');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total rinks: ${rinks.length}`);
    fs.writeFileSync('rink_data.json', JSON.stringify(rinks, null, 2));
    console.log('Written detailed data to rink_data.json');

    console.log('--- Rink List ---');
    rinks.forEach(r => {
        console.log(`[${r.id}] ${r.name}: (${r.latitude}, ${r.longitude})`);
    });
}

checkRinks();
