
import { GET } from '../app/api/rinks/route';
import dotenv from 'dotenv';
import path from 'path';

// Manually load env but DELETE service role key
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing with Service Role Key removed...');
console.log('Has Service Role:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const url = 'http://localhost:3000/api/rinks?minLat=45.4&maxLat=45.7&minLng=-73.7&maxLng=-73.4';
    const request = new Request(url);

    try {
        const response = await GET(request);
        const data = await response.json();
        console.log('API Response status:', response.status);
        console.log('API Response data length:', data.length);
        if (data.length > 0) {
            console.log('Success! Rinks fetched without Service Role.');
        } else {
            console.log('No rinks found (but no crash).');
        }
        if (data.error) {
            console.error('API Error:', data.error);
        }
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
