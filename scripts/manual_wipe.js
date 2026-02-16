const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipe() {
    console.log('⚠️  WIPING ALL LEAGUE DATA...');

    // Delete in order of dependencies (Results -> Events/Members -> Seasons -> League)
    const tables = [
        'os_league_race_results',
        'os_league_events',
        'os_league_members',
        'os_league_seasons',
        'os_leagues'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (error) console.error(`Error wiping ${table}:`, error.message);
        else console.log(`✅ Wiped ${table}`);
    }

    console.log('Cleanup Complete.');
}

wipe();
