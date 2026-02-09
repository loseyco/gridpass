const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log('Checking jobs table schema...');

    // Try to insert a dummy row that fails constraint but validates columns
    // actually, simpler: just select * limit 0? No, that returns empty array [] with no keys usually.
    // Better: Query information_schema manually via RPC if I can create a function.
    // Or just try to select specifc columns and see which one errors.

    const columns = ['id', 'team_name', 'role', 'description', 'requirements', 'source_post_id', 'status'];

    for (const col of columns) {
        process.stdout.write(`Column '${col}': `);
        const { error } = await supabase.from('jobs').select(col).limit(1);
        if (error) console.log('❌ MISSING or ERROR:', error.message);
        else console.log('✅ OK');
    }
}

check();
