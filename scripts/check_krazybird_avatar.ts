
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAvatar() {
    console.log('--- Checking Avatar for: Krazybird ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('id, display_name, avatar_id')
        .ilike('display_name', 'Krazybird');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (users && users.length > 0) {
        console.log('User found:', users[0]);
    } else {
        console.log('User not found.');
    }
}

checkAvatar();
