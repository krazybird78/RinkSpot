import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables form .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

interface RinkInput {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    rink_type: 'outdoor' | 'indoor' | 'pond';
}

async function fetchAndInsertToronto() {
    console.log('Fetching Toronto rinks (GeoJSON Direct)...');

    // Direct URL found during verification
    const url = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/e51b5d31-a53c-4fc5-a204-36c43243dd3b/resource/2ae3625b-30f1-4470-bf80-ecc56ab2d674/download/outdoor-ice-rinks-4326.geojson';

    try {
        const response = await fetch(url);
        const data: any = await response.json();
        const features = data.features || [];

        console.log(`Found ${features.length} features.`);

        let inserted = 0;
        let skipped = 0;

        for (const f of features) {
            const props = f.properties;
            const geom = f.geometry;

            let lat = NaN;
            let lng = NaN;

            if (geom && geom.type === 'MultiPoint' && geom.coordinates && geom.coordinates.length > 0) {
                // GeoJSON is [lng, lat]
                lng = geom.coordinates[0][0];
                lat = geom.coordinates[0][1];
            } else if (geom && geom.type === 'Point' && geom.coordinates) {
                lng = geom.coordinates[0];
                lat = geom.coordinates[1];
            }

            if (isNaN(lat) || isNaN(lng)) {
                console.warn(`Skipping ${props['Asset Name']} - Invalid Coordinates`);
                continue;
            }

            const rink: RinkInput = {
                name: props['Public Name'] || props['Asset Name'] || 'Outdoor Rink',
                latitude: lat,
                longitude: lng,
                address: props['Address'] || 'Toronto',
                city: 'Toronto',
                country: 'Canada',
                rink_type: 'outdoor'
            };

            // Insert
            const { error } = await supabase.from('rinks').insert([rink]);

            if (error) {
                // Ignore duplicates gracefully
                if (error.code === '23505' || error.message.includes('duplicate')) {
                    skipped++;
                } else {
                    console.error(`Error inserting ${rink.name}:`, error.message);
                }
            } else {
                inserted++;
            }
        }

        console.log(`\n✅ Toronto Import Complete: ${inserted} inserted, ${skipped} skipped.`);

    } catch (error: any) {
        console.error('Error fetching/inserting Toronto rinks:', error.message);
    }
}

fetchAndInsertToronto();
