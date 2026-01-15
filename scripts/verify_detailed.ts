
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDetailed() {
    console.log('--- Detailed Database Rink Check ---');

    const { data: rinks, error } = await supabase
        .from('rinks')
        .select('name, city, country');

    if (error) {
        console.error('Error fetching rinks:', error);
        return;
    }

    const counts: Record<string, number> = {};
    rinks.forEach(r => {
        counts[r.city] = (counts[r.city] || 0) + 1;
    });

    const logs: string[] = [];
    logs.push('--- Detailed Database Rink Check ---');
    logs.push(`Total rinks found: ${rinks.length}\n`);

    const sortedCities = Object.keys(counts).sort();
    sortedCities.forEach(city => {
        logs.push(`CITY: ${city} | COUNT: ${counts[city]}`);
    });

    const auditPath = path.resolve(process.cwd(), 'audit_rinks.txt');
    fs.writeFileSync(auditPath, logs.join('\n'));
    console.log(`Audit results written to ${auditPath}`);
}

verifyDetailed();
