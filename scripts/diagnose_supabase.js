
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkConnection(url, key, name) {
    console.log(`\nTesting ${name}:`);
    console.log(`URL: ${url}`);
    console.log(`Key: ${key ? key.substring(0, 10) + '...' : 'MISSING'}`);

    if (!url || !key) {
        console.log('❌ Missing URL or Key');
        return;
    }

    try {
        const supabase = createClient(url, key);
        // Use Management API equivalent check - try admin user list or raw query?
        // Service Role key usually allows everything.
        // Let's try listing users (requires service role).
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

        if (usersError) {
            // If auth fails, maybe try a table select?
            const { data, error } = await supabase.from('leads').select('count', { count: 'exact', head: true });
            if (error) {
                console.log(`❌ Failed (Auth & DB): ${usersError.message} / ${error.message}`);
            } else {
                console.log(`✅ Success (DB only)! Auth Admin failed.`);
            }
        } else {
            console.log(`✅ Success! Connected and listed ${users.users.length} users.`);
        }
    } catch (e) {
        console.log(`❌ Exception: ${e.message}`);
    }
}

async function main() {
    console.log("--- Supabase Diagnostic v2 ---");

    const correctUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // We know this works from v1 (bwpm...)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check if Service Role Key works with Correct URL
    await checkConnection(
        correctUrl,
        serviceKey,
        "Verify Service Role Key with Correct URL (bwpm...)"
    );
}

main();
