
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('🔍 Diagnosing News Sources...');

    // 1. Check Sources
    const { data: sources, error } = await supabase
        .from('os_news_sources')
        .select('*');

    if (error) {
        console.error('❌ Error fetching sources:', error.message);
        return;
    }

    console.log(`found ${sources.length} sources.`);
    console.table(sources.map(s => ({
        name: s.name,
        enabled: s.enabled,
        type: s.type,
        last_scraped: s.last_scraped_at
    })));

    // 2. Check Articles count
    const { count } = await supabase
        .from('os_news_articles')
        .select('*', { count: 'exact', head: true });

    console.log(`📚 Total Articles in DB: ${count}`);
}

diagnose();
