
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    console.log('🔍 Checking pending Facebook posts...');

    const { count, error } = await supabase
        .from('os_news_articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_published_to_facebook', false);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`📚 Pending Articles: ${count}`);
    }
}

check();
