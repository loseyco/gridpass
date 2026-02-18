const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectTables() {
    console.log('🔍 Inspecting Schemas...\n');

    const tables = ['leads', 'os_lead', 'claim_tokens', 'os_claim_tokens', 'tasks', 'os_task'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: Found.`);
            if (data.length > 0) {
                console.log(`   Keys: ${Object.keys(data[0]).join(', ')}`);
            } else {
                console.log(`   (Empty table)`);
            }
        }
    }
}

inspectTables();
