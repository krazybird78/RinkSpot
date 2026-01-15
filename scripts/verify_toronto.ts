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
    fs.appendFileSync('verify_log.txt', msg + '\n');
}

async function verify() {
    fs.writeFileSync('verify_log.txt', '--- Start Verify ---\n');
    log('Checking Supabase for Toronto rinks...');

    const { count, error } = await supabase
        .from('rinks')
        .select('*', { count: 'exact', head: true })
        .eq('city', 'Toronto');

    if (error) {
        log('DB Error: ' + error.message);
    } else {
        log(`Found ${count} rinks in Toronto in DB.`);
    }

    log('\nChecking Toronto Open Data API...');
    try {
        const packageUrl = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=outdoor-artificial-ice-rinks';
        const packageRes = await fetch(packageUrl);
        const packageData: any = await packageRes.json();

        log('Package Fetch Status: ' + packageRes.status);
        if (!packageData.success) {
            log('Package API failed: ' + JSON.stringify(packageData));
            return;
        }

        const resources = packageData.result?.resources || [];
        const resource = resources.find((r: any) => r.format?.toLowerCase() === 'json' || r.format?.toLowerCase() === 'geojson');

        if (resource) {
            const directUrl = resource.url;
            log('Direct URL: ' + directUrl);

            log('\nTrying Direct URL fetch...');
            try {
                const directRes = await fetch(directUrl);
                const directJson: any = await directRes.json();

                if (directJson.features && directJson.features.length > 0) {
                    log('FOUND GEOJSON FEATURES: ' + directJson.features.length);
                    log('Sample Feature Properties: ' + JSON.stringify(directJson.features[0].properties, null, 2));
                    log('Sample Geometry: ' + JSON.stringify(directJson.features[0].geometry, null, 2));
                } else {
                    log('Direct URL returned JSON but no features?');
                }
            } catch (e: any) {
                log('Direct URL Fetch Failed: ' + e.message);
            }

        } else {
            log('No JSON/GeoJSON resource found!');
        }

    } catch (err: any) {
        log('API Fetch Error: ' + err.message);
    }
}

verify();
