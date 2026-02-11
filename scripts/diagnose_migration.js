const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Admin key bypasses RLS
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing key/url');
    process.exit(1);
}

// 1. Admin Client (Bypasses RLS)
const adminSupabase = createClient(supabaseUrl, supabaseKey);

// 2. User Client (Simulating the user via RLS if possible, but we need a session)
// Since we can't easily get a user session token here without login, we will just check the data via Admin and see if `archived_at` is null.

async function diagnose() {
    console.log('Diagnosing via Admin Client...');

    // Fetch all collections
    const { data: allCollections, error } = await adminSupabase
        .from('collections')
        .select('id, name, owner_id, archived_at, is_default, created_at');

    if (error) {
        console.error('Admin Query Error:', error);
        return;
    }

    console.log(`Found ${allCollections.length} total collections in DB.`);

    // Check for collections with archived_at = null
    const activeCollections = allCollections.filter(c => c.archived_at === null);
    console.log(`Found ${activeCollections.length} active (non-archived) collections.`);

    if (activeCollections.length > 0) {
        console.log('Sample active collection:', activeCollections[0]);
    } else {
        console.log('ALL collections are archived?');
    }

    // Check recent collections
    const recent = activeCollections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (recent) {
        console.log('Most recent active collection:', recent);
    }
}

diagnose();
