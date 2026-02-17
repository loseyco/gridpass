const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const { error } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE os_stewards_incidents ADD COLUMN IF NOT EXISTS thumbnail TEXT;'
    });

    if (error) {
        // If execute_sql RPC doesn't exist (it usually requires a special setup), 
        // we might have to rely on the user running it or `psql`.
        // But since the MCP tool failed, likely the RPC is missing or permissions are tight.
        // Let's try to just output the instruction for the user.
        console.error('Failed to run migration via RPC:', error);
    } else {
        console.log('Migration applied successfully!');
    }
}

// Since we likely can't run DDL via the client directly without a specific RPC,
// I'll try to use the postgres connection string if I can find it, but I don't have it.
// I will rely on the user manually running it if this fails, or use the MCP tool again after a check.
console.log("Please run the following SQL in your Supabase SQL Editor:");
console.log("ALTER TABLE os_stewards_incidents ADD COLUMN IF NOT EXISTS thumbnail TEXT;");
