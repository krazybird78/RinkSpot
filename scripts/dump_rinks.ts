
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

async function dumpRinks() {
    console.log('Dumping all rinks from database...');

    const { data: rinks, error } = await supabase
        .from('rinks')
        .select('*');

    if (error) {
        console.error('Error fetching rinks:', error);
        return;
    }

    const dumpPath = path.resolve(process.cwd(), 'full_rink_dump.json');
    fs.writeFileSync(dumpPath, JSON.stringify(rinks, null, 2));

    console.log(`Dumped ${rinks.length} rinks to ${dumpPath}`);

    // Also print a summary
    const cities = rinks.reduce((acc: any, r: any) => {
        acc[r.city] = (acc[r.city] || 0) + 1;
        return acc;
    }, {});
    console.log('City Summary:', cities);
}

dumpRinks();
