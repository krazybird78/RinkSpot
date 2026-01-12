
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupRinks() {
    const idsToDelete = [
        '362cd349-cc7c-456e-93e1-9913660bf847', // Nuns Island (0,0)
        '2ef96e5d-99f5-46a7-9af5-a66b76c13347'  // Parc de la Fontaine (Duplicate)
    ];

    console.log(`Deleting ${idsToDelete.length} rinks...`);

    // Delete reports first (foreign key constraint likely exists)
    const { error: reportsError } = await supabase
        .from('reports')
        .delete()
        .in('rink_id', idsToDelete);

    if (reportsError) {
        console.error('Error deleting reports:', reportsError);
        return;
    }
    console.log('Deleted associated reports.');

    // Delete rinks
    const { error: rinksError } = await supabase
        .from('rinks')
        .delete()
        .in('id', idsToDelete);

    if (rinksError) {
        console.error('Error deleting rinks:', rinksError);
        return;
    }

    console.log('Successfully deleted rinks.');
}

cleanupRinks();
