import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const minLat = parseFloat(searchParams.get('minLat') || '');
    const maxLat = parseFloat(searchParams.get('maxLat') || '');
    const minLng = parseFloat(searchParams.get('minLng') || '');
    const maxLng = parseFloat(searchParams.get('maxLng') || '');

    // 1. Viewport Constraint (Security #1)
    // Prevent "Select All" / Scrapers by requiring bounding box
    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
        return NextResponse.json(
            { error: 'Viewport bounds (minLat, maxLat, minLng, maxLng) are required.' },
            { status: 400 }
        );
    }

    // Fallback to Anon Key if Service Role is missing (for public read compatibility)
    // This prevents 500 errors in environments where Service Role isn't set but Anon is available.
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase keys in environment');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data: rinks, error } = await supabase
            .from('rinks')
            .select('id, name, latitude, longitude, rink_type, city, country, address') // Select only public fields
            .gte('latitude', minLat)
            .lte('latitude', maxLat)
            .gte('longitude', minLng)
            .lte('longitude', maxLng)
            .limit(100); // Sanity limit for performance

        if (error) {
            console.error('Supabase Error:', error);
            throw error;
        }

        return NextResponse.json(rinks);
    } catch (error: any) {
        console.error('Error fetching rinks:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
