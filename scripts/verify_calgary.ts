import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync('calgary_log.txt', msg + '\n');
}

async function verify() {
    fs.writeFileSync('calgary_log.txt', '--- Checking Calgary ---\n');
    log('--- Checking Calgary ---');

    // 1. Check DB
    const { count, error } = await supabase
        .from('rinks')
        .select('*', { count: 'exact', head: true })
        .eq('city', 'Calgary');

    if (error) {
        log('DB Error: ' + error.message);
    } else {
        log(`Found ${count} rinks in Calgary in DB.`);
    }

    // 2. Check Existing API from populate_rinks.ts
    const url = 'https://data.calgary.ca/resource/9kxe-7ixt.json?facility_type=Outdoor%20Skating%20Rink';
    log(`\nChecking API: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            log(`API Failed: ${response.status} ${response.statusText}`);
        } else {
            const data: any = await response.json();
            log(`API returned ${data.length} records.`);
            if (data.length > 0) {
                log('Sample: ' + JSON.stringify(data[0], null, 2));
            }
        }
    } catch (e: any) {
        log('API Error: ' + e.message);
    }
}

verify();
