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
const quebecRinks: RinkInput[] = [
    {
        name: "Place D'Youville Patinoire",
        address: "Place D'Youville",
        city: "Quebec City",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 46.812335,
        longitude: -71.213860
    },
    {
        name: "Anneau de glace des plaines d'Abraham",
        address: "Plaines d'Abraham",
        city: "Quebec City",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 46.8016,
        longitude: -71.2211
    },
    {
        name: "Parc Victoria (Bleu Blanc Bouge)",
        address: "275 Rue du Cardinal-Maurice-Roy",
        city: "Quebec City",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 46.8161,
        longitude: -71.2339
    },
    {
        name: "Domaine de Maizerets",
        address: "2000 Boulevard Montmorency",
        city: "Quebec City",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 46.840,
        longitude: -71.215
    },
    {
        name: "Pointe-aux-Lièvres (Sentier de glace)",
        address: "51 Rue de la Pointe-aux-Lièvres",
        city: "Quebec City",
        country: "Canada",
        rink_type: "outdoor",
        latitude: 46.8222,
        longitude: -71.2353
    }
];

async function insertQuebecManual() {
    console.log(`Inserting ${quebecRinks.length} Quebec City rinks...`);

    let inserted = 0;
    let skipped = 0;

    for (const rink of quebecRinks) {
        // Check for duplicates
        const { data: existing } = await supabase
            .from('rinks')
            .select('id')
            .eq('city', 'Quebec City')
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

    console.log(`✅ Quebec City Import Complete: ${inserted} inserted, ${skipped} skipped.`);
}

insertQuebecManual();
