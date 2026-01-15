
import fetch from 'node-fetch';
import fs from 'fs';

// Disable TLS rejection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkLayer(serviceUrl: string, layerId: number, name: string) {
    const url = `${serviceUrl}/${layerId}?f=pjson`;
    const log = [`Checking ${name} Layer ${layerId}: ${url}`];

    try {
        const res = await fetch(url);
        if (!res.ok) {
            log.push(`failed: ${res.status}`);
        } else {
            const data: any = await res.json();
            if (data.error) {
                log.push(`Error: ${data.error.message}`);
            } else {
                log.push(`Success! Name: ${data.name}, Type: ${data.type}`);
                // Check if it's rink related
                if (data.name && (data.name.toLowerCase().includes('rink') || data.name.toLowerCase().includes('ice') || data.name.toLowerCase().includes('winter'))) {
                    log.push('*** LIKELY MATCH ***');
                }
            }
        }
    } catch (e: any) {
        log.push(`Exception: ${e.message}`);
    }
    fs.appendFileSync('debug_layers.txt', log.join('\n') + '\n\n');
}

async function main() {
    fs.writeFileSync('debug_layers.txt', '');

    // Minneapolis
    const mplsBase = 'https://services.arcgis.com/afSMGVsC7QlRK1kZ/ArcGIS/rest/services/MPRB_PublicLayers/FeatureServer';
    for (let i = 0; i < 20; i++) {
        await checkLayer(mplsBase, i, 'Minneapolis');
    }

    // Milwaukee
    const milwBase = 'https://services.arcgis.com/QeS8g9gPzY5Y9d95/ArcGIS/rest/services/Milwaukee_County_Park_Attractions/FeatureServer';
    for (let i = 0; i < 10; i++) {
        await checkLayer(milwBase, i, 'Milwaukee');
    }

    console.log('Layer check complete.');
}

main();
