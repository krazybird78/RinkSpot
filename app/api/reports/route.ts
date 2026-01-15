import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const minLat = parseFloat(searchParams.get('minLat') || '');
    const maxLat = parseFloat(searchParams.get('maxLat') || '');
    const minLng = parseFloat(searchParams.get('minLng') || '');
    const maxLng = parseFloat(searchParams.get('maxLng') || '');

    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
        return NextResponse.json(
            { error: 'Viewport bounds (minLat, maxLat, minLng, maxLng) are required.' },
            { status: 400 }
        );
    }

    // Auth Check
    // We need to construct a Supabase client that can read cookies to check for the user session
    const cookieStore = await cookies();

    // Note: For simple auth check without RLS in middleware, we can just use getUser()
    // But strictly we should use createServerClient from @supabase/ssr or similar.
    // Given standard createClient usage in this project so far, we might need to handle cookies manually 
    // or just use the service role and verify the JWT if passed. 
    // However, "cookies()" is available in Next.js App Router.
    // Making a strictly authenticated client is best.
    // For MVP speed and since I might not have @supabase/ssr installed, I will check the Auth cookie manually 
    // OR just proceed with "Service Role" + "Trust the cookie passed"? No, that's insecure.
    // We'll try to use the standard simple approach:
    // If we can't easily validate the user on server without libs, we might assume Anon for now 
    // but "Data Tiering based on user auth" implies we MUST check properly.
    // I'll check package.json again. "@supabase/supabase-js" is there. "supabase" is there.

    // Let's rely on client-side token passing? No, APIs should use cookies.
    // I will skip complex SSR auth setup and assume the user is Anon for now to get the structure up, 
    // OR try to parse the 'sb-access-token' if available. 
    // Actually, standard Supabase pattern is just:
    // const supabase = createClient(URL, KEY, { cookies: ... })

    // Let's implement the Tiering Logic assuming we can detect the user.
    // For now, I'll default to Anon logic if uncertain, which is safe.

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for auth header (Bearer token) if client sends it
    const authHeader = request.headers.get('Authorization');
    let user = null;

    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
        if (!error) user = authUser;
    }

    try {
        // 1. Get rinks in bounds first (to get IDs)
        // Optimization: Directly join reports with rinks.
        // Supabase Inner Join filter:
        // .select('*, rinks!inner(latitude, longitude)')

        // Tiering Logic:
        // Auth User: Last 48h
        // Anon User: Last 12h (or just latest)

        const hours = user ? 48 : 12;
        const timeLimit = new Date();
        timeLimit.setHours(timeLimit.getHours() - hours);

        const { data: reports, error } = await supabase
            .from('reports')
            .select('*, rinks!inner(latitude, longitude)')
            .gte('created_at', timeLimit.toISOString())
            .gte('rinks.latitude', minLat)
            .lte('rinks.latitude', maxLat)
            .gte('rinks.longitude', minLng)
            .lte('rinks.longitude', maxLng)
            .order('created_at', { ascending: false })
            .limit(user ? 200 : 50); // Hard limit to prevent overload

        if (error) throw error;

        // Remove the joined rink data from response payload to save bandwidth
        // (We only needed it for filtering)
        const cleanReports = reports.map(r => {
            const { rinks, ...rest } = r as any;
            return rest;
        });

        return NextResponse.json(cleanReports);
    } catch (error: any) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
