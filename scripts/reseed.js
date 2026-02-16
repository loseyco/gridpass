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

async function reseed() {
    console.log('Reseeding League Data via Supabase Client...');

    // 1. Create League
    const { data: league, error: leagueError } = await supabase
        .from('os_leagues')
        .upsert({
            slug: 'official-gridpass',
            name: 'Official GridPass League',
            description: 'The premier simulation racing league.'
        }, { onConflict: 'slug' })
        .select()
        .single();

    if (leagueError) {
        console.error('Error creating league:', leagueError);
        return;
    }
    console.log('League ID:', league.id);

    // 2. Create Season
    const { data: season, error: seasonError } = await supabase
        .from('os_league_seasons')
        .insert({
            league_id: league.id,
            name: 'Season 1 2026',
            slug: 'season-1-2026',
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            is_active: true
        })
        .select()
        .single();

    if (seasonError) {
        console.error('Error creating season:', seasonError);
        // It might already exist?
    } else {
        console.log('Season ID:', season.id);
    }

    console.log('Reseeding Complete!');
}

reseed();
