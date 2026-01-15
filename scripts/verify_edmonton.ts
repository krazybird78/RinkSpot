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
    fs.appendFileSync('edmonton_log.txt', msg + '\n');
}

async function verify() {
    fs.writeFileSync('edmonton_log.txt', '--- Checking Edmonton ---\n');
    log('--- Checking Edmonton ---');

    // 1. Check DB
    const { count, error } = await supabase
        .from('rinks')
        .select('*', { count: 'exact', head: true })
        .eq('city', 'Edmonton');

    if (error) {
        log('DB Error: ' + error.message);
    } else {
        log(`Found ${count} rinks in Edmonton in DB.`);
    }

    // 2. Check Existing API from populate_rinks.ts
    // URL from populate_rinks.ts: 
    // https://data.edmonton.ca/resource/v9f2-2v4e.json

    const url = 'https://data.edmonton.ca/resource/v9f2-2v4e.json';
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
