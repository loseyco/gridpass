
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Env Vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function apply() {
    console.log('🚀 Applying Migration: seed_news_sources...');

    const sources = [
        { name: 'Racer.com', url: 'https://racer.com/feed/', type: 'rss', category: 'Racing', enabled: true, reliability_score: 95 },
        { name: 'Motorsport.com', url: 'https://www.motorsport.com/rss/all/news/', type: 'rss', category: 'Global', enabled: true, reliability_score: 90 },
        { name: 'IndyCar', url: 'https://www.indycar.com/rss/news', type: 'rss', category: 'IndyCar', enabled: true, reliability_score: 100 },
        { name: 'IMSA', url: 'https://www.imsa.com/feed/', type: 'rss', category: 'IMSA', enabled: true, reliability_score: 100 },
        { name: 'Jalopnik', url: 'https://jalopnik.com/rss', type: 'rss', category: 'Culture', enabled: true, reliability_score: 80 }
    ];

    const { error } = await supabase
        .from('os_news_sources')
        .upsert(sources, { onConflict: 'name' });

    if (error) {
        console.error('❌ Migration Failed:', error.message);
    } else {
        console.log('✅ Migration Applied Successfully.');
    }
}

apply();
