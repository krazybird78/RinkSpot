import { GET } from '../app/api/rinks/route';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    const url = 'http://localhost:3000/api/rinks?minLat=45.4&maxLat=45.7&minLng=-73.7&maxLng=-73.4';
    const request = new Request(url);

    try {
        const response = await GET(request);
        const data = await response.json();
        console.log('API Response status:', response.status);
        console.log('API Response data length:', data.length);
        if (data.length > 0) {
            console.log('Sample Rink:', data[0]);
        } else {
            console.log('No rinks found in these bounds.');
        }
        if (data.error) {
            console.error('API Error:', data.error);
        }
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
