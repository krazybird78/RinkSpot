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
    rink_type: 'outdoor';
}

// Manually extracted coordinates and addresses
const helsinkiRinks: RinkInput[] = [
    {
        name: "Brahenkenttä Ice Rink",
        address: "Helsinginkatu 25a",
        city: "Helsinki",
        country: "Finland",
        rink_type: "outdoor",
        latitude: 60.1875,
        longitude: 24.9492
    },
    {
        name: "Johanneksenkenttä Ice Rink",
        address: "Merimiehenkatu 2",
        city: "Helsinki",
        country: "Finland",
        rink_type: "outdoor",
        latitude: 60.1601,
        longitude: 24.9368
    },
    {
        name: "Jätkäsaari Sports Park",
        address: "Hyväntoivonkatu 3",
        city: "Helsinki",
        country: "Finland",
        rink_type: "outdoor",
        latitude: 60.1600,
        longitude: 24.9232
    },
    {
        name: "Käpylä Sports Park",
        address: "Mäkelänkatu 70",
        city: "Helsinki",
        country: "Finland",
        rink_type: "outdoor",
        latitude: 60.2024,
        longitude: 24.9421
    },
    {
        name: "Eläintarha Sports Park",
        address: "Vauhtitie",
        city: "Helsinki",
        country: "Finland",
        rink_type: "outdoor",
        latitude: 60.1911,
        longitude: 24.9308
    },
    {
        name: "Malmi Airport Ice Rink",
        address: "Malmi Airport",
        city: "Helsinki",
        country: "Finland",
        rink_type: "outdoor",
        latitude: 60.2539,
        longitude: 25.0442
    }
];

async function insertHelsinkiManual() {
    console.log(`Inserting ${helsinkiRinks.length} Helsinki rinks...`);

    let inserted = 0;
    let skipped = 0;

    for (const rink of helsinkiRinks) {
        // Check for duplicates
        const { data: existing } = await supabase
            .from('rinks')
            .select('id')
            .eq('city', 'Helsinki')
            .ilike('name', rink.name)
            .maybeSingle();

        if (existing) {
            skipped++;
            continue;
        }

        const { error } = await supabase.from('rinks').insert([rink]);
        if (error) {
            console.error(`Error inserting ${rink.name}:`, error.message);
        } else {
            inserted++;
        }
    }

    console.log(`✅ Helsinki Import Complete: ${inserted} inserted, ${skipped} skipped.`);
}

insertHelsinkiManual();
