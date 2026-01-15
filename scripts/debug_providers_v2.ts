
import fetch from 'node-fetch';
import fs from 'fs';

// Disable TLS rejection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkLayer(serviceUrl: string, layerId: number, name: string) {
    const url = `${serviceUrl}/${layerId}?f=pjson`;
    console.log(`Checking: ${url}`);

    try {
        const res = await fetch(url.trim());
        if (!res.ok) {
            console.log(`❌ ${name} Layer ${layerId} Failed: ${res.status} ${res.statusText}`);
            try {
                const text = await res.text();
                // console.log(`   Response: ${text.substring(0, 100)}...`);
            } catch { }
            return;
        }

        const contentType = res.headers.get('content-type');
        if (contentType && !contentType.includes('json')) {
            console.log(`❌ ${name} Layer ${layerId} returned non-JSON content-type: ${contentType}`);
            return;
        }

        const data: any = await res.json();
        if (data.error) {
            console.log(`❌ ${name} Layer ${layerId} Error: ${data.error.message}`);
        } else {
            console.log(`✅ ${name} Layer ${layerId}: ${data.name} (${data.type})`);
            fs.appendFileSync('found_layers.txt', `[${name}] Layer ${layerId}: ${data.name} (${data.type})\nURL: ${url}\n\n`);

            if (data.name && (
                data.name.toLowerCase().includes('rink') ||
                data.name.toLowerCase().includes('ice') ||
                data.name.toLowerCase().includes('winter') ||
                data.name.toLowerCase().includes('skate')
            )) {
                console.log(`   🌟 POTENTIAL MATCH FOUND! 🌟`);
                fs.appendFileSync('found_layers.txt', `*** MATCH ***\n`);
            }
        }
    } catch (e: any) {
        console.log(`❌ ${name} Layer ${layerId} Exception: ${e.message}`);
    }
}

async function main() {
    fs.writeFileSync('found_layers.txt', '');

    console.log('--- Starting Provider Debug V2 ---');

    // Minneapolis (New URL from search)
    // Note: MapServer usually exposes layers just like FeatureServer
    const mplsBase = 'https://gis.minneapolismn.gov/arcgis/rest/services/Services/MPRB_PublicLayers/MapServer';

    // Milwaukee (Existing URL, verify validity)
    const milwBase = 'https://services.arcgis.com/QeS8g9gPzY5Y9d95/ArcGIS/rest/services/Milwaukee_County_Park_Attractions/FeatureServer';

    // Check first 20 layers for each
    console.log('\nScanning Minneapolis...');
    for (let i = 0; i < 20; i++) {
        await checkLayer(mplsBase, i, 'Minneapolis');
    }

    console.log('\nScanning Milwaukee...');
    for (let i = 0; i < 20; i++) {
        await checkLayer(milwBase, i, 'Milwaukee');
    }

    console.log('\n--- Scan Complete ---');
}

main();
