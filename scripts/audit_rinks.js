
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditRinks() {
    const { data: rinks, error } = await supabase.from('rinks').select('id, name, latitude, longitude, created_at');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const output = `Total rinks in DB: ${rinks.length}\n` +
        rinks.map(r => `[${r.id}] ${r.name}: (${r.latitude}, ${r.longitude})`).join('\n');

    fs.writeFileSync('audit_rinks.txt', output);
    console.log('Audit complete. Check audit_rinks.txt');
}

auditRinks();
