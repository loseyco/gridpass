import Parser from 'rss-parser';
import { createAdminClient } from '@/utils/supabase/admin';

const parser = new Parser();

export async function scrapeLatestNews() {
    const supabase = createAdminClient();
    const results = {
        processed: 0,
        inserted: 0,
        errors: 0,
    };

    // Fetch enabled RSS feeds from DB
    const { data: sources, error: sourceError } = await supabase
        .from('os_news_sources')
        .select('*')
        .eq('enabled', true)
        .eq('type', 'rss');

    if (sourceError || !sources) {
        console.error('Error fetching news sources:', sourceError);
        return results;
    }

    console.log(`Found ${sources.length} enabled RSS feeds.`);

    for (const source of sources) {
        try {
            const feed = await parser.parseURL(source.url);

            for (const item of feed.items) {
                if (!item.link || !item.title) continue;

                results.processed++;

                // Check if article already exists
                const { data: existing } = await supabase
                    .from('os_news_articles')
                    .select('id')
                    .eq('url', item.link)
                    .single();

                if (existing) {
                    continue;
                }

                // Insert new article
                const { error } = await supabase.from('os_news_articles').insert({
                    source_id: source.name,
                    title: item.title,
                    url: item.link,
                    content: item.contentSnippet || item.content || '',
                    published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                    category: source.category || 'General',
                    is_included_in_summary: false,
                });

                if (error) {
                    console.error(`Error inserting article from ${source.name}:`, error);
                    results.errors++;
                } else {
                    results.inserted++;
                }
            }

            // Update last_scraped_at
            await supabase
                .from('os_news_sources')
                .update({ last_scraped_at: new Date().toISOString() })
                .eq('id', source.id);

        } catch (error) {
            console.error(`Error processing feed ${source.name} (${source.url}):`, error);
            results.errors++;
        }
    }

    return results;
}
