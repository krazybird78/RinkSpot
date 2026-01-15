import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseKey = serviceKey || anonKey;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables (URL or Key)');
    process.exit(1);
}

if (!serviceKey) {
    console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not found. Using Anon Key.');
    console.warn('   This will likely fail with RLS errors unless you are authenticated.');
} else {
    console.log('✅ Using Service Role Key (Bypassing RLS)');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface RinkInput {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    rink_type: 'outdoor' | 'indoor' | 'pond';
}

async function insertRinks(rinks: RinkInput[]) {
    console.log(`\n--- Processing ${rinks.length} rinks for ${rinks.length > 0 ? rinks[0].city : 'unknown'} ---`);

    let inserted = 0;
    let skipped = 0;

    for (const rink of rinks) {
        // Check if a rink with same name and city exists
        const { data: existing } = await supabase
            .from('rinks')
            .select('id')
            .eq('name', rink.name)
            .eq('city', rink.city)
            .maybeSingle();

        if (existing) {
            skipped++;
            continue;
        }

        const { error } = await supabase.from('rinks').insert([rink]);
        if (error) {
            console.error(`  Error inserting rink ${rink.name}:`, error.message);
        } else {
            inserted++;
        }
    }
    console.log(`  Done: ${inserted} inserted, ${skipped} skipped (duplicates).`);
}

async function fetchMontrealRinks(): Promise<RinkInput[]> {
    console.log('Fetching Montreal rinks...');
    const url = 'https://donnees.montreal.ca/dataset/60850740-dd83-47ee-9a19-13d674e90314/resource/2dac229f-6089-4cb7-ab0b-eadc6a147d5d/download/terrain_sport_ext.json';

    try {
        const response = await fetch(url);
        const data: any = await response.json();

        const features = data.features.filter((f: any) =>
            f.properties.NOM.toLowerCase().includes('patinoire') ||
            f.properties.NOM.toLowerCase().includes('glace')
        );

        return features.map((f: any) => ({
            name: f.properties.NOM,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            address: f.properties.ARROND || 'Montreal',
            city: 'Montreal',
            country: 'Canada',
            rink_type: 'outdoor' as const
        }));
    } catch (error) {
        console.error('Error fetching Montreal rinks:', error);
        return [];
    }
}

async function fetchTorontoRinks(): Promise<RinkInput[]> {
    console.log('Fetching Toronto rinks...');
    try {
        // Step 1: Get the resource ID dynamically
        const packageUrl = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=outdoor-artificial-ice-rinks';
        const packageRes = await fetch(packageUrl);
        const packageData: any = await packageRes.json();

        const resourceId = packageData.result?.resources?.find((r: any) => r.format.toLowerCase() === 'json' || r.format.toLowerCase() === 'geojson')?.id;

        if (!resourceId) throw new Error('No JSON resource found for Toronto rinks');

        // Step 2: Fetch the data
        const url = `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search?resource_id=${resourceId}&limit=1000`;
        const response = await fetch(url);
        const data: any = await response.json();
        const records = data.result?.records || [];

        return records.map((item: any) => ({
            name: item.Asset_Name || item.PADNAME || 'Outdoor Rink',
            latitude: parseFloat(item.Latitude || item.lat),
            longitude: parseFloat(item.Longitude || item.lng),
            address: item.Address || 'Toronto',
            city: 'Toronto',
            country: 'Canada',
            rink_type: 'outdoor' as const
        })).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude) && !r.name.toLowerCase().includes('indoor'));
    } catch (error) {
        console.error('Error fetching Toronto rinks:', error);
        return [];
    }
}

async function fetchOttawaRinks(): Promise<RinkInput[]> {
    console.log('Fetching Ottawa rinks...');
    const url = 'https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/13/query?where=1%3D1&outFields=*&outSR=4326&f=json';

    try {
        const response = await fetch(url);
        const data: any = await response.json();

        return data.features.map((f: any) => ({
            name: f.attributes.NAME,
            latitude: f.geometry.y,
            longitude: f.geometry.x,
            address: f.attributes.ADDRESS || 'Ottawa',
            city: 'Ottawa',
            country: 'Canada',
            rink_type: 'outdoor' as const
        }));
    } catch (error) {
        console.error('Error fetching Ottawa rinks:', error);
        return [];
    }
}

async function fetchCalgaryRinks(): Promise<RinkInput[]> {
    console.log('Fetching Calgary rinks...');
    const url = 'https://data.calgary.ca/resource/9kxe-7ixt.json?facility_type=Outdoor%20Skating%20Rink';

    try {
        const response = await fetch(url);
        const data: any = await response.json();
        const items = Array.isArray(data) ? data : [];

        return items.map((item: any) => ({
            name: item.common_name || item.park_name || 'Outdoor Rink',
            latitude: parseFloat(item.location?.latitude || item.latitude),
            longitude: parseFloat(item.location?.longitude || item.longitude),
            address: item.address || 'Calgary',
            city: 'Calgary',
            country: 'Canada',
            rink_type: 'outdoor' as const
        })).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude) && !r.name.toLowerCase().includes('indoor'));
    } catch (error) {
        console.error('Error fetching Calgary rinks:', error);
        return [];
    }
}

async function fetchEdmontonRinks(): Promise<RinkInput[]> {
    console.log('Fetching Edmonton rinks...');
    // Updated Edmonton URL
    // Note: If this fails, we log it. Previous ID was failing.
    const url = 'https://data.edmonton.ca/resource/v9f2-2v4e.json';

    try {
        const response = await fetch(url);
        const data: any = await response.json();
        const items = Array.isArray(data) ? data : (data.results || []);

        return items.map((item: any) => ({
            name: item.facility_name || 'Edmonton Rink',
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            address: item.address || 'Edmonton',
            city: 'Edmonton',
            country: 'Canada',
            rink_type: 'outdoor' as const
        })).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude) && !r.name.toLowerCase().includes('indoor'));
    } catch (error) {
        console.error('Error fetching Edmonton rinks:', error);
        return [];
    }
}

async function fetchWinnipegRinks(): Promise<RinkInput[]> {
    console.log('Fetching Winnipeg rinks...');
    // Updated Winnipeg URL for Pleasure Rinks
    const url = 'https://data.winnipeg.ca/resource/v998-2kud.json';

    try {
        const response = await fetch(url);
        const data: any = await response.json();
        const items = Array.isArray(data) ? data : [];

        return items.map((item: any) => ({
            name: item.name || 'Outdoor Rink',
            latitude: parseFloat(item.location?.latitude || item.latitude),
            longitude: parseFloat(item.location?.longitude || item.longitude),
            address: item.location_address || 'Winnipeg',
            city: 'Winnipeg',
            country: 'Canada',
            rink_type: 'outdoor' as const
        })).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude) && !r.name.toLowerCase().includes('indoor'));
    } catch (error) {
        console.error('Error fetching Winnipeg rinks:', error);
        return [];
    }
}

async function fetchVancouverRinks(): Promise<RinkInput[]> {
    console.log('Fetching Vancouver rinks...');
    // Updated Vancouver URL - Fetch all facilities and filter in JS to avoid query errors
    const url = 'https://opendata.vancouver.ca/api/records/1.0/search/?dataset=parks-facilities&rows=1000';

    try {
        const response = await fetch(url);
        const data: any = await response.json();
        const records = data.records || [];

        return records.filter((r: any) => {
            const type = (r.fields.facilitytype || r.fields.FacilityType || '').toLowerCase();
            return type.includes('rink') && !type.includes('indoor');
        }).map((r: any) => ({
            name: r.fields.parkname || 'Outdoor Rink',
            latitude: r.fields.googlemapscoor ? r.fields.googlemapscoor[0] : NaN,
            longitude: r.fields.googlemapscoor ? r.fields.googlemapscoor[1] : NaN,
            address: r.fields.parkname || 'Vancouver',
            city: 'Vancouver',
            country: 'Canada',
            rink_type: 'outdoor' as const
        })).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude));
    } catch (error) {
        console.error('Error fetching Vancouver rinks:', error);
        return [];
    }
}

async function fetchChicagoRinks(): Promise<RinkInput[]> {
    console.log('Fetching Chicago rinks...');
    // Verified Chicago URL for Parks Locations with Ice Skating
    const url = 'https://data.cityofchicago.org/resource/wwy2-k7b3.json?ice_skating=1';

    try {
        const response = await fetch(url);
        const data: any = await response.json();
        const items = Array.isArray(data) ? data : [];

        return items.map((item: any) => {
            let address = 'Chicago';
            try {
                if (item.human_address) {
                    address = JSON.parse(item.human_address).address;
                } else if (item.street_address) {
                    address = item.street_address;
                }
            } catch { }

            return {
                name: item.park_name || 'Chicago Park Rink',
                latitude: parseFloat(item.location?.latitude || item.latitude),
                longitude: parseFloat(item.location?.longitude || item.longitude),
                address: address,
                city: 'Chicago',
                country: 'USA',
                rink_type: 'outdoor' as const
            };
        }).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude) && !r.name.toLowerCase().includes('indoor'));
    } catch (error) {
        console.error('Error fetching Chicago rinks:', error);
        return [];
    }
}

async function fetchBostonRinks(): Promise<RinkInput[]> {
    console.log('Fetching Boston rinks...');
    // updated MassGIS URL
    const url = 'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/ICERINKS_PT/MapServer/0/query?where=MUNICIPALITY%20%3D%20%27BOSTON%27&outFields=*&outSR=4326&f=json';

    try {
        const response = await fetch(url);
        const data: any = await response.json();

        if (data.error) {
            console.error('Boston API Error:', data.error);
            return [];
        }

        const features = data.features || [];

        return features.map((f: any) => ({
            name: f.attributes.NAME || 'Boston Rink',
            latitude: f.geometry?.y || NaN,
            longitude: f.geometry?.x || NaN,
            address: f.attributes.ADDRESS || 'Boston',
            city: 'Boston',
            country: 'USA',
            rink_type: 'outdoor' as const
        })).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude) && !r.name.toLowerCase().includes('indoor'));
    } catch (error: any) {
        console.error('Error fetching Boston rinks:', error.message);
        return [];
    }
}

// async function fetchMinneapolisRinks(): Promise<RinkInput[]> { ... }
// async function fetchMilwaukeeRinks(): Promise<RinkInput[]> { ... }

async function fetchMinneapolisRinks(): Promise<RinkInput[]> {
    console.log('Fetching Minneapolis rinks... (SKIPPED - API Unavailable)');
    return [];
}

async function fetchMilwaukeeRinks(): Promise<RinkInput[]> {
    console.log('Fetching Milwaukee rinks... (SKIPPED - API Unavailable)');
    return [];
}

async function fetchQuebecCityRinks(): Promise<RinkInput[]> {
    console.log('Fetching Quebec City rinks...');
    // Updated to ArcGIS FeatureServer
    const url = 'https://services.arcgis.com/yFjY6x9zXjN1sH8a/ArcGIS/rest/services/DYNDATA/SPORTS/FeatureServer/19/query?where=1=1&outFields=*&f=json';

    try {
        const response = await fetch(url);
        const data: any = await response.json();

        if (!data.features) return [];

        return data.features.map((f: any) => {
            let lat = NaN;
            let lon = NaN;

            if (f.geometry) {
                if (f.geometry.y && f.geometry.x) {
                    lat = f.geometry.y;
                    lon = f.geometry.x;
                } else if (f.geometry.rings) {
                    // Centroid/First point of polygon
                    const p = f.geometry.rings[0][0];
                    lon = p[0];
                    lat = p[1];
                }
            }

            return {
                name: f.attributes.NOM || 'Patinoire extérieure',
                latitude: lat,
                longitude: lon,
                address: f.attributes.ADRESSE || 'Quebec City',
                city: 'Quebec City',
                country: 'Canada',
                rink_type: 'outdoor' as const
            };
        }).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude) && !r.name.toLowerCase().includes('indoor'));
    } catch (error) {
        console.error('Error fetching Quebec City rinks:', error);
        return [];
    }
}

async function fetchNYCRinks(): Promise<RinkInput[]> {
    console.log('Fetching NYC rinks...');
    // Updated NYC URL for Ice Skating Directory
    const url = 'https://data.cityofnewyork.us/resource/xvww-awjk.json';

    try {
        const response = await fetch(url);
        const data: any = await response.json();
        const items = Array.isArray(data) ? data : [];
        console.log(`[NYC] Raw items found: ${items.length}`);

        let mapped = items.map((item: any) => {
            let lat = NaN;
            let lon = NaN;

            // Handle Socrata MultiPolygon
            // coordinates is [[[ [lon, lat], [lon, lat] ... ]]]
            if (item.the_geom?.coordinates) {
                const c = item.the_geom.coordinates;
                try {
                    const point = c[0][0][0];
                    if (Array.isArray(point) && point.length >= 2) {
                        lon = parseFloat(point[0]);
                        lat = parseFloat(point[1]);
                    } else if (Array.isArray(c[0][0][0][0])) {
                        const deepPoint = c[0][0][0][0];
                        lon = parseFloat(deepPoint[0]);
                        lat = parseFloat(deepPoint[1]);
                    }
                } catch (e) { }
            }

            return {
                name: item.name || 'Ice Rink',
                latitude: lat,
                longitude: lon,
                address: item.location || 'NYC',
                city: 'New York',
                country: 'USA',
                rink_type: ((item.comments || '').toLowerCase().includes('indoor') ? 'indoor' : 'outdoor') as 'indoor' | 'outdoor'
            };
        });

        const valid = mapped.filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude) && r.rink_type === 'outdoor');
        console.log(`[NYC] Mapped ${mapped.length}. Valid outdoor: ${valid.length}.`);
        return valid;

    } catch (error) {
        console.error('Error fetching NYC rinks:', error);
        return [];
    }
}

async function fetchDetroitRinks(): Promise<RinkInput[]> {
    console.log('Fetching Detroit rinks...');
    // Base Detroit URL for Outdoor Skating Rinks
    const url = 'https://mappmycity.ca/arcgis/rest/services/Community/MapServer/7/query?where=1%3D1&outFields=*&outSR=4326&f=json';

    try {
        const response = await fetch(url);
        const data: any = await response.json();
        const features = data.features || [];

        return features.map((f: any) => ({
            name: f.attributes.NAME || f.attributes.PARK_NAME || 'Outdoor Rink',
            latitude: f.geometry?.y || NaN,
            longitude: f.geometry?.x || NaN,
            address: f.attributes.ADDRESS || 'Detroit',
            city: 'Detroit',
            country: 'USA',
            rink_type: 'outdoor' as const
        })).filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude) && !r.name.toLowerCase().includes('indoor'));
    } catch (error) {
        console.error('Error fetching Detroit rinks:', error);
        return [];
    }
}

async function main() {
    const providers = [
        fetchMontrealRinks,
        fetchTorontoRinks,
        fetchOttawaRinks,
        fetchCalgaryRinks,
        fetchEdmontonRinks,
        fetchWinnipegRinks,
        fetchVancouverRinks,
        fetchChicagoRinks,
        fetchBostonRinks,
        fetchMinneapolisRinks,
        fetchQuebecCityRinks,
        fetchNYCRinks,
        fetchDetroitRinks,
        fetchMilwaukeeRinks
    ];

    for (const provider of providers) {
        console.log(`\n>>> STARTING PROVIDER: ${provider.name}`);
        try {
            const rinks = await provider();
            console.log(`>>> Provider ${provider.name} returned ${rinks.length} rinks.`);
            if (rinks.length > 0) {
                await insertRinks(rinks);
            }
        } catch (err: any) {
            console.error(`>>> ERROR in provider ${provider.name}:`, err.message);
        }
    }

    console.log('\nFinished population for initial major cities.');
}

main().catch(console.error);
