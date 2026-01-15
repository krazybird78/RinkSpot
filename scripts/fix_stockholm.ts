import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
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
    rink_type: 'outdoor' | 'pond';
}

// Manually extracted coordinates and addresses
const stockholmRinks: RinkInput[] = [
    {
        name: "Kungsträdgården Ice Rink",
        address: "Jussi Björlings Allé 5",
        city: "Stockholm",
        country: "Sweden",
        rink_type: "outdoor",
        latitude: 59.33112,
        longitude: 18.0716
    },
    {
        name: "Vasaparken Ice Rink",
        address: "Dalagatan 11C",
        city: "Stockholm",
        country: "Sweden",
        rink_type: "outdoor",
        latitude: 59.3405, // Precise center of park
        longitude: 18.0460
    },
    {
        name: "Trekanten (Natural Ice)",
        address: "Liljeholmen",
        city: "Stockholm",
        country: "Sweden",
        rink_type: "pond",
        latitude: 59.313,
        longitude: 18.016
    },
    {
        name: "Drevviken (Natural Ice)",
        address: "Drevviken",
        city: "Stockholm",
        country: "Sweden",
        rink_type: "pond",
        latitude: 59.2407,
        longitude: 18.1213
    },
    {
        name: "Magelungen (Natural Ice)",
        address: "Farsta",
        city: "Stockholm",
        country: "Sweden",
        rink_type: "pond",
        latitude: 59.2308,
        longitude: 18.0886
    },
    {
        name: "Långsjön (Natural Ice)",
        address: "Älvsjö",
        city: "Stockholm",
        country: "Sweden",
        rink_type: "pond",
        latitude: 59.2675,
        longitude: 17.9664
    }
];

async function insertStockholmManual() {
    console.log(`Inserting ${stockholmRinks.length} Stockholm rinks...`);

    let inserted = 0;
    let skipped = 0;

    for (const rink of stockholmRinks) {
        // Check for duplicates
        const { data: existing } = await supabase
            .from('rinks')
            .select('id')
            .eq('city', 'Stockholm')
            .ilike('name', rink.name)
            .maybeSingle();

        if (existing) {
            skipped++;
            continue;
        }

        const { error } = await supabase.from('rinks').insert([rink]);
        if (error) {
            // Check for lat/lng dupes if name differs slightly
            if (error.code === '23505') {
                skipped++;
            } else {
                console.error(`Error inserting ${rink.name}:`, error.message);
            }
        } else {
            inserted++;
        }
    }

    console.log(`✅ Stockholm Import Complete: ${inserted} inserted, ${skipped} skipped.`);
}

insertStockholmManual();
