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

// Manually extracted from https://www.calgary.ca/parks/activities/outdoor-skating-rinks.html
const calgaryRinks: RinkInput[] = [
    {
        name: "Big Marlborough Park Rink",
        address: "6033 Madigan Dr. N.E.",
        city: "Calgary",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 51.0595333,
        longitude: -113.9412581
    },
    {
        name: "Bowness Park Lagoon",
        address: "8900 48 Ave. N.W.",
        city: "Calgary",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 51.097405,
        longitude: -114.220819
    },
    {
        name: "Carburn Park Rink",
        address: "67 Riverview Dr. S.E.",
        city: "Calgary",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 50.974629,
        longitude: -114.024653
    },
    {
        name: "North Glenmore Park Ice Trail",
        address: "7305 Crowchild Tr. S.W.",
        city: "Calgary",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 50.9893359,
        longitude: -114.1246369
    },
    {
        name: "Prairie Winds Park Rink",
        address: "223 Castleridge Blvd. N.E.",
        city: "Calgary",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 51.107,
        longitude: -113.968
    },
    {
        name: "Prince's Island Park Lagoon",
        address: "4 St. and 1 Ave. S.W.",
        city: "Calgary",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 51.056,
        longitude: -114.068
    },
    {
        name: "Thomson Family Park Rink",
        address: "1236 16 Ave. S.W.",
        city: "Calgary",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 51.038601,
        longitude: -114.09042
    },
    {
        name: "West Confederation Park Rink",
        address: "2019 Chicoutimi Dr. N.W.",
        city: "Calgary",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 51.081432,
        longitude: -114.109507
    }
];

async function insertCalgaryManual() {
    console.log(`Inserting ${calgaryRinks.length} Calgary rinks...`);

    let inserted = 0;
    let skipped = 0;

    for (const rink of calgaryRinks) {
        // Check for duplicates
        const { data: existing } = await supabase
            .from('rinks')
            .select('id')
            .eq('city', 'Calgary')
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

    console.log(`✅ Calgary Import Complete: ${inserted} inserted, ${skipped} skipped.`);
}

insertCalgaryManual();
