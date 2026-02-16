const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedProduction() {
    console.log('🌱 Seeding Production League...');

    // 1. Create Official League
    const { data: league } = await supabase.from('os_leagues').upsert({
        slug: 'official-gridpass-gt3',
        name: 'GridPass Official GT3 Cup',
        description: 'The flagship competitive series for GridPass members. Professional officiating, broadcast races, and cash prizes.',
        is_official: true,
        require_membership: true
    }, { onConflict: 'slug' }).select().single();

    console.log('League:', league.name);

    // 2. Create Season with Entry Fee
    const { data: season } = await supabase.from('os_league_seasons').insert({
        league_id: league.id,
        name: 'Season 1: 2026',
        slug: 's1-2026-gt3',
        start_date: '2026-03-01',
        end_date: '2026-06-01',
        is_active: true,
        entry_fee_amount: 15.00, // $15 Entry Fee
        currency: 'USD'
    }).select().single();

    console.log('Season:', season.name);

    // 3. Create Realistic Schedule (12 Rounds)
    const tracks = [
        { name: 'Daytona International Speedway', config: 'Road Course' },
        { name: 'Sebring International Raceway', config: 'International' },
        { name: 'Road Atlanta', config: 'Full Course' },
        { name: 'Watkins Glen International', config: 'Boot' },
        { name: 'Circuit de Spa-Francorchamps', config: 'Grand Prix' },
        { name: 'Nürburgring Combined', config: 'Gesamtstrecke 24h' }
    ];

    let date = new Date('2026-03-01T20:00:00Z'); // Sundays at 8PM

    for (let i = 0; i < tracks.length; i++) {
        await supabase.from('os_league_events').insert({
            season_id: season.id,
            league_id: league.id,
            name: `Round ${i + 1}: ${tracks[i].name}`,
            track_name: tracks[i].name,
            config_name: tracks[i].config,
            start_time: date.toISOString(),
            status: 'scheduled',
            subsession_id: null // Will be filled when race runs
        });
        date.setDate(date.getDate() + 7); // Add 1 week
    }

    console.log(`✅ Created ${tracks.length} scheduled events.`);
}

seedProduction();
