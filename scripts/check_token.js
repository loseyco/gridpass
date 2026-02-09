const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabaseAnon = createClient(supabaseUrl, anonKey);

async function check(token) {
    console.log(`🔍 Checking token: ${token}`);

    // 1. Check with Admin (Service Role)
    const { data: adminData, error: adminError } = await supabaseAdmin
        .from('claim_tokens')
        .select('*')
        .eq('token', token)
        .single();

    if (adminError || !adminData) {
        console.error('❌ Admin check failed:', adminError);
    } else {
        console.log('✅ Admin found token:', adminData);
    }

    // 2. Check with Anon (Simulating Public Access)
    const { data: anonData, error: anonError } = await supabaseAnon
        .from('claim_tokens')
        .select('*')
        .eq('token', token)
        .single();

    if (anonError || !anonData) {
        console.error('❌ Anon check failed (RLS Issue?):', anonError);
    } else {
        console.log('✅ Anon found token:', anonData);
    }
}

const token = 'test_vle1h';
check(token);
