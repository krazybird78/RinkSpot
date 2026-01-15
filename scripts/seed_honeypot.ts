import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedHoneypot() {
    console.log('Seeding Honey Pot Rink...');

    const trapRink = {
        name: 'Atlantis Rink (Scraper Trap)',
        address: '1 Null Island Blvd',
        city: 'Atlantis',
        country: 'Ocean',
        latitude: 0.0000,
        longitude: 0.0000,
        rink_type: 'Natural',
        description: 'This rink is a trap for scrapers. Accessing this via the API implies a full-scan attempt.'
    };

    // Check if it exists
    const { data: existing } = await supabase
        .from('rinks')
        .select('id')
        .eq('latitude', 0)
        .eq('longitude', 0)
        .single();

    if (existing) {
        console.log('Honey pot already exists.');
        return;
    }

    const { data, error } = await supabase
        .from('rinks')
        .insert(trapRink)
        .select()
        .single();

    if (error) {
        console.error('Error creating honey pot:', error);
    } else {
        console.log('Honey pot created successfully:', data.id);
    }
}

seedHoneypot();
