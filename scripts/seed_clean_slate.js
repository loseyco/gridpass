const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedClean() {
    console.log('🧹 Seeding Clean Slate (No Events)...');

    // 1. Wipe Everything First
    const tables = ['os_league_race_results', 'os_league_events', 'os_league_members', 'os_league_seasons', 'os_leagues'];
    for (const table of tables) {
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 2. Create Official League
    const { data: league } = await supabase.from('os_leagues').upsert({
        slug: 'official-gridpass-gt3',
        name: 'GridPass Official GT3 Cup',
        description: 'The flagship competitive series for GridPass members.',
        is_official: true,
        require_membership: true
    }, { onConflict: 'slug' }).select().single();

    // 3. Create Season (Empty)
    await supabase.from('os_league_seasons').insert({
        league_id: league.id,
        name: 'Season 1: 2026',
        slug: 's1-2026-gt3',
        start_date: '2026-03-01',
        end_date: '2026-06-01',
        is_active: true,
        entry_fee_amount: 0,
        currency: 'USD'
    });

    // Seed Dummy Members
    const { error: membersError } = await supabase.from('os_league_members').insert([
        {
            league_id: league.id,
            user_id: null, // Dummy member
            role: 'driver',
            status: 'active',
            car_number: '99',
            iracing_customer_id: null
        },
        {
            league_id: league.id,
            user_id: null, // Dummy member 2
            role: 'driver',
            status: 'pending',
            car_number: '01',
            iracing_customer_id: 12345
        }
    ]);

    if (membersError) console.error('Error seeding members:', membersError);
    else console.log('✅ Seeded 2 Dummy Members.');

    console.log('✅ Clean Slate Ready: League & Season created. 0 Events. 0 Results. 2 Members.');
}

seedClean();
