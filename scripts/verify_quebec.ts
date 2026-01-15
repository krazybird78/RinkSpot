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
    fs.appendFileSync('quebec_log.txt', msg + '\n');
}

async function verify() {
    fs.writeFileSync('quebec_log.txt', '--- Checking Quebec City ---\n');
    log('--- Checking Quebec City ---');

    // 1. Check DB
    const { count, error } = await supabase
        .from('rinks')
        .select('*', { count: 'exact', head: true })
        .eq('city', 'Quebec City');

    if (error) {
        log('DB Error: ' + error.message);
    } else {
        log(`Found ${count} rinks in Quebec City in DB.`);
    }

    // 2. Check Existing API from populate_rinks.ts
    // URL from populate_rinks.ts
    const url = 'https://services.arcgis.com/yFjY6x9zXjN1sH8a/ArcGIS/rest/services/DYNDATA/SPORTS/FeatureServer/19/query?where=1=1&outFields=*&f=json';
    log(`\nChecking API: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            log(`API Failed: ${response.status} ${response.statusText}`);
        } else {
            const data: any = await response.json();

            if (data.error) {
                log('API Error Response: ' + JSON.stringify(data.error));
            } else if (data.features) {
                log(`API returned ${data.features.length} features.`);
                if (data.features.length > 0) {
                    log('Sample Attribute: ' + JSON.stringify(data.features[0].attributes, null, 2));
                    log('Sample Geometry: ' + JSON.stringify(data.features[0].geometry, null, 2));
                }
            } else {
                log('API returned unexpected format: ' + JSON.stringify(data).substring(0, 200));
            }
        }
    } catch (e: any) {
        log('API Error: ' + e.message);
    }
}

verify();
