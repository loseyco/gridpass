
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Seeding os_system_settings...');

    const defaults = [
        { key: 'cron.news_scraper.enabled', value: { enabled: true, frequency_mins: 15 } },
        { key: 'cron.facebook_publisher.enabled', value: { enabled: true, frequency_mins: 60 } },
        { key: 'cron.youtube_monitor.enabled', value: { enabled: true, frequency_mins: 5 } },
        { key: 'system.heartbeat', value: { status: 'offline' } } // Initial state
    ];

    for (const item of defaults) {
        const { error } = await supabase
            .from('os_system_settings')
            .upsert(item, { onConflict: 'key' });

        if (error) {
            console.error(`Error upserting ${item.key}:`, error.message);
        } else {
            console.log(`✅ Set ${item.key}`);
        }
    }
}

seed();
