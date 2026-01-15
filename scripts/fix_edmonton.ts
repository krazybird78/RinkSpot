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
const edmontonRinks: RinkInput[] = [
    {
        name: "Victoria Park IceWay & Oval",
        address: "12130 River Valley Road",
        city: "Edmonton",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 53.536,
        longitude: -113.526
    },
    {
        name: "Rundle Park IceWay",
        address: "2909 113 Ave NW",
        city: "Edmonton",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 53.56874,
        longitude: -113.377985
    },
    {
        name: "City Hall Outdoor Ice",
        address: "1 Sir Winston Churchill Square",
        city: "Edmonton",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 53.545883,
        longitude: -113.490112
    },
    {
        name: "Castle Downs Park Rink",
        address: "11510 153 Avenue",
        city: "Edmonton",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 53.625,
        longitude: -113.517
    },
    {
        name: "Sir Wilfrid Laurier Park",
        address: "13221 Buena Vista Road",
        city: "Edmonton",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 53.504,
        longitude: -113.565
    },
    {
        name: "Jackie Parker Park Rink",
        address: "4540 50 Street NW",
        city: "Edmonton",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 53.479595,
        longitude: -113.419118
    },
    {
        name: "The Meadows Outdoor Leisure Ice",
        address: "2704 17 Street",
        city: "Edmonton",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 53.456,
        longitude: -113.375
    }
];

async function insertEdmontonManual() {
    console.log(`Inserting ${edmontonRinks.length} Edmonton rinks...`);

    let inserted = 0;
    let skipped = 0;

    for (const rink of edmontonRinks) {
        // Check for duplicates
        const { data: existing } = await supabase
            .from('rinks')
            .select('id')
            .eq('city', 'Edmonton')
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

    console.log(`✅ Edmonton Import Complete: ${inserted} inserted, ${skipped} skipped.`);
}

insertEdmontonManual();
