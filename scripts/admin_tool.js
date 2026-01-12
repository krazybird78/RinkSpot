
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("\n🏒 RINKSPOT ADMIN TOOL 🏒");
    console.log("---------------------------");

    // 1. Get Credentials
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        supabaseUrl = await askQuestion("Enter your Supabase URL: ");
    }

    if (!serviceKey) {
        console.log("\n⚠️  I need your SERVICE_ROLE_KEY to perform admin actions.");
        console.log("   (Find this in Supabase Dashboard -> Project Settings -> API)");
        serviceKey = await askQuestion("Enter your SERVICE_ROLE_KEY: ");
    }

    if (!supabaseUrl || !serviceKey) {
        console.error("❌ Missing credentials.");
        rl.close();
        return;
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 2. Menu
    while (true) {
        console.log("\nSelect an action:");
        console.log("1. Run Migration (Create deletion_requests table)");
        console.log("2. Force Confirm a Deletion Request (Act as User B)");
        console.log("3. Exit");

        const choice = await askQuestion("\nEnter choice (1-3): ");

        if (choice === '1') {
            await runMigration(supabase);
        } else if (choice === '2') {
            await forceConfirm(supabase);
        } else if (choice === '3') {
            break;
        } else {
            console.log("Invalid choice.");
        }
    }

    rl.close();
}

async function runMigration(supabase) {
    console.log("\n--- Running Migration ---");
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260110_deletion_requests.sql');

    try {
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Note: Supabase JS client cannot run raw SQL via 'from' unless using rpc, 
        // OR if the user provides a service key we specifically need to use the pg connection or an RPC function.
        // HOWEVER, standard supabase-js doesn't support raw SQL query execution directly on the DB instance 
        // without a helper function (like 'exec_sql').

        console.log("ℹ️  To run this migration via script, you ideally need a PostgreSQL client or an RPC function 'exec_sql'.");
        console.log("   Attempting to use a workaround (Split statements? No, too complex).");
        console.log("   ACTUALLY: The best way is to PASTE this into the SQL Editor.");
        console.log("\n   Here is the SQL content:\n");
        console.log(sql);
        console.log("\n✅ Please copy/paste the above into Supabase SQL Editor.");

        // We can't actually execute raw SQL easily without 'postgres' driver and connection string.
        await askQuestion("Press Enter once you have run the SQL in Supabase...");

    } catch (e) {
        console.error("Error reading migration file:", e.message);
    }
}

async function forceConfirm(supabase) {
    console.log("\n--- Force Confirm Deletion ---");

    // Fetch pending requests
    const { data: requests, error } = await supabase
        .from('deletion_requests')
        .select('*, rinks(name)')
        .eq('status', 'pending');

    if (error) {
        console.error("Error fetching requests:", error.message);
        return;
    }

    if (!requests || requests.length === 0) {
        console.log("No pending deletion requests found.");
        return;
    }

    console.log("Pending Requests:");
    requests.forEach((r, idx) => {
        console.log(`${idx + 1}. Rink: ${r.rinks?.name} (ID: ${r.rink_id}) - Requested by: ${r.requested_by}`);
    });

    const index = await askQuestion("\nEnter number to confirm (or 0 to cancel): ");
    const i = parseInt(index) - 1;

    if (i >= 0 && i < requests.length) {
        const req = requests[i];

        // Force update using service key (bypasses RLS).
        // We need a valid 'confirmed_by' user ID that exists in the public.users table to satisfy the FK constraint.
        // We will try to find a user who is NOT the requester, or just fallback to the requester if they are the only one.

        const { data: users } = await supabase
            .from('users')
            .select('id')
            .neq('id', req.requested_by)
            .limit(1);

        let confirmUserId = users && users.length > 0 ? users[0].id : req.requested_by;

        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 7);

        const { error: updateError } = await supabase
            .from('deletion_requests')
            .update({
                status: 'confirmed',
                confirmed_by: confirmUserId,
                scheduled_deletion_at: scheduledDate.toISOString()
            })
            .eq('id', req.id);

        if (updateError) {
            console.error("Failed to confirm:", updateError.message);
        } else {
            console.log(`✅ Successfully confirmed deletion for "${req.rinks?.name}".`);
            console.log(`   Rink will disappear on ${scheduledDate.toLocaleDateString()}`);
        }
    }
}

main();
