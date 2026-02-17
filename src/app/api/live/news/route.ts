import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    // Fetch latest daily summary
    const { data: summary } = await supabase
        .from('os_daily_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    // Fetch latest 20 raw articles
    const { data: articles } = await supabase
        .from('os_news_articles')
        .select('id, title, source_id, published_at, category')
        .order('published_at', { ascending: false })
        .limit(20);

    return NextResponse.json({
        summary: summary || null,
        articles: articles || [],
    });
}
