const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkMigrationStatus() {
    console.log('🕵️ Checking Migration Status...\n');

    const tables = [
        { old: 'leads', new: 'os_lead' },
        { old: 'claim_tokens', new: 'os_claim_token' },
        { old: 'organizations', new: 'os_organization' }
    ];

    console.log('--- MIGRATION STATUS REPORT ---');

    for (const t of tables) {
        // Check Old
        const { count: oldData, error: oldError } = await supabase.from(t.old).select('*', { count: 'exact', head: true });
        // Check New
        const { count: newData, error: newError } = await supabase.from(t.new).select('*', { count: 'exact', head: true });

        const oldStatus = oldError ? `❌ Missing/Error (${oldError.message})` : `✅ Exists (${oldData} rows)`;
        const newStatus = newError ? `❌ Missing/Error (${newError.message})` : `✅ Exists (${newData} rows)`;

        console.log(`\nChecking ${t.old} -> ${t.new}:`);
        console.log(`   Old (${t.old}): ${oldStatus}`);
        console.log(`   New (${t.new}): ${newStatus}`);

        if (!oldError && !newError) {
            console.log(`   ⚠️  CONFLICT: Both tables exist. Rename likely failed.`);
        } else if (!oldError && newError) {
            console.log(`   ℹ️  Pending: Migration not started.`);
        } else if (oldError && !newError) {
            console.log(`   ✅  Success: Migrated.`);
        }
    }
    console.log('\n-------------------------------');
}

checkMigrationStatus();
