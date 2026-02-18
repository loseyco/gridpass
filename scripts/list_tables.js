const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function listTables() {
    console.log('📊 Listing known tables in public schema...\n');

    // Trying to query information_schema directly often fails with REST.
    // Instead, let's try a RPC call if one exists, or just query a known table to see if connection works.

    // Attempt 1: Information Schema (REST) - likely to fail but worth a shot if Service Role has permissions
    // Note context: "401 Unauthorized" usually means RLS or pure restriction.
    // Service Role usually bypasses RLS, but standard REST doesn't expose system tables.

    // Alternative: We can use the POSTGRES connection string if available in env?
    // Let's check env vars for DATABASE_URL.
    console.log('Env DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');

    if (process.env.DATABASE_URL) {
        // We can use 'postgres' lib if installed, but let's assume it isn't.
        // We can try to use a simple query tool if available.
    }

    // Attempt 2: Just list all the tables we KNOW about from the codebase, and check if they exist.
    const potentialTables = [
        'users', 'profiles', 'todos', 'tasks', 'leads', 'claim_tokens',
        'organizations', 'subscriptions', 'invoices', 'payments',
        'os_task', 'os_lead', 'os_project', 'os_contact', 'os_job',
        'classifieds', 'listings', 'vehicles', 'garages', 'events', 'races',
        'news', 'articles', 'comments', 'likes', 'follows'
    ];

    console.log('Checking existence of known tables:');
    for (const table of potentialTables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
            console.log(`✅ ${table} (Rows: ${count})`);
        } else {
            // checking error code to see if it's "relation does not exist"
            if (error.code === '42P01') {
                // console.log(`❌ ${table} (Not Found)`);
            } else {
                // console.log(`⚠️ ${table} (Error: ${error.message})`);
            }
        }
    }
}

listTables();
