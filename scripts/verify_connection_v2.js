require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars:', { supabaseUrl, supabaseKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log(`Connecting to ${supabaseUrl}...`);

    // 1. Check Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) {
        console.error('PROFILES Error:', pError);
    } else {
        console.log('✅ Profiles Table Accessible. Row count:', profiles.length);
    }

    // 2. Check Sys Registry
    const { data: reg, error: rError } = await supabase.from('sys_api_registry').select('*').limit(1);
    if (rError) {
        console.error('REGISTRY Error:', rError);
    } else {
        console.log('✅ Registry Table Accessible. Row count:', reg.length);
    }
}

check();
