require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role can see everything
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Anon key mimics client

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey);
const anon = createClient(supabaseUrl, supabaseAnon);

async function checkRLS() {
    console.log('🔍 Checking RLS Policies...');

    // 1. Check policies via RPC (if possible) or just test access
    // Admin query on pg_policies is tricky via client unless exposed.
    // Instead, let's test ACCESS.

    // 2. Fetch league first (Admin)
    const { data: league } = await admin.from('os_leagues').select('id').eq('is_official', true).single();
    if (!league) {
        console.error('❌ No Official League found via Admin.');
        return;
    }
    console.log('✅ Found League:', league.id);

    // 3. Check Members count via Admin (Service Role)
    const { count: adminCount, error: adminError } = await admin
        .from('os_league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id);

    if (adminError) console.error('❌ Admin Count Error:', adminError);
    else console.log('✅ Admin sees members:', adminCount);

    // 4. Check Members count via Anon (Client)
    // This simulates what the browser sees (mostly).
    const { count: anonCount, error: anonError } = await anon
        .from('os_league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id);

    if (anonError) console.error('❌ Anon Count Error:', anonError);
    else console.log('✅ Anon sees members:', anonCount);

    if (adminCount > 0 && anonCount === 0) {
        console.error('🚨 MISMATCH: RLS is blocking Anon access!');
        console.log('👉 You need to review policies on os_league_members.');
    } else if (adminCount === 0) {
        console.error('🚨 ZERO MEMBERS even for Admin. Data was not seeded correctly?');
    } else {
        console.log('✅ RLS seems fine for basic select.');
    }
}

checkRLS();
