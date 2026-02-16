const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Checking for RPC functions...');
    // We can't list RPCs easily via JS client without knowing their names, 
    // but we can try to call a common one like 'exec_sql' or 'exec' 
    // or check the schema via the 'rpc' endpoint if it was exposed (it's not).

    // Actually, we can try to query `information_schema.routines` via the API 
    // IF we have access to it. Usually we don't.

    // Let's try to blindly call `exec_sql` which is a common helper.
    const { data, error } = await supabase.rpc('exec_sql', { query: "NOTIFY pgrst, 'reload schema';" });

    if (error) {
        console.log("RPC 'exec_sql' failed or not found:", error.message);
    } else {
        console.log("RPC 'exec_sql' SUCCESS!", data);
        return;
    }

    // Try 'execute_sql'
    const { data: data2, error: error2 } = await supabase.rpc('execute_sql', { sql: "NOTIFY pgrst, 'reload schema';" });
    if (error2) {
        console.log("RPC 'execute_sql' failed or not found:", error2.message);
    } else {
        console.log("RPC 'execute_sql' SUCCESS!", data2);
    }
}

run();
