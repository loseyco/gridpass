import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/utils/supabase/admin';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function generateDailySummary() {
    const supabase = createAdminClient();
    const results = {
        summariesGenerated: 0,
        articlesProcessed: 0,
        errors: [] as string[]
    };

    // 1. Fetch ALL unsummarized articles
    const { data: articles, error: fetchError } = await supabase
        .from('os_news_articles')
        .select('id, title, content, url, source_id, category')
        .eq('is_included_in_summary', false);

    if (fetchError) {
        console.error('Error fetching articles:', fetchError);
        return { error: fetchError };
    }

    if (!articles || articles.length === 0) {
        return { message: 'No new articles to summarize.' };
    }

    // 2. Group articles by Category
    const articlesByCategory: Record<string, typeof articles> = {};
    articles.forEach(a => {
        const cat = a.category || 'General';
        if (!articlesByCategory[cat]) articlesByCategory[cat] = [];
        articlesByCategory[cat].push(a);
    });

    console.log(`Found unsummarized articles in categories: ${Object.keys(articlesByCategory).join(', ')}`);

    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

    // 3. Process each category separately
    for (const [category, categoryArticles] of Object.entries(articlesByCategory)) {
        if (categoryArticles.length === 0) continue;

        console.log(`Summarizing ${categoryArticles.length} articles for ${category}...`);

        // Prepare content
        const articlesText = categoryArticles.slice(0, 30).map(a => // Limit to 30 per category to avoid token limits
            `Source: ${a.source_id}\nTitle: ${a.title}\nContent: ${a.content?.substring(0, 800)}...\nURL: ${a.url}\n`
        ).join('\n---\n');

        const prompt = `
        You are the "GridPass" automated racing news editor, specializing in **${category}**.
        Analyze these latest ${category} news articles and create two outputs in JSON format.
        
        1. "article_content": A comprehensive "${category} Update" article in Markdown.
           - Headline (H1): Create a dynamic, urgent headline based on the biggest story.
           - Subtitle: "Update as of ${currentTime} ET".
           - Structure: Group by topic or team.
           - FORMATTING RULES (CRITICAL):
             - Use SHORT paragraphs (max 2-3 sentences).
             - Use **Bold** for key names and teams.
             - Use Bullet Points for list items.
             - Insert horizontal rules (---) between major sections.
           - TONE: Fast-paced, high-energy, "Breaking News" feel.
        
        2. "meta_title": SEO title tag (max 60 chars).
        3. "meta_description": SEO meta description (max 160 chars).
        
        4. "video_script": A 60-second vertical video script for social media about ${category}.
           - Hook: "Fresh ${category} news on GridPass!"
           - Hit the top 3 biggest stories fast.
           - visual_cues: Describe what should be shown.
        
        Input Articles:
        ${articlesText}
        
        Output strictly valid JSON:
        {
          "article_content": "# Markdown...",
          "meta_title": "...",
          "meta_description": "...",
          "video_script": "..."
        }
        `;

        // Generate with Retry Logic
        const candidates = ['gemma-3-4b-it', 'gemini-1.5-flash'];
        let success = false;
        let generatedData = null;

        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
                generatedData = JSON.parse(text);
                if (generatedData.article_content) {
                    success = true;
                    break;
                }
            } catch (err: any) {
                console.warn(`Failed ${category} summary with ${modelName}: ${err.message}`);
            }
        }

        if (success && generatedData) {
            // Save Summary
            const { error: insertError } = await supabase.from('os_daily_summaries').insert({
                content: generatedData.article_content,
                video_script: generatedData.video_script || '',
                title: generatedData.meta_title || `${category} Update`,
                summary_snippet: generatedData.meta_description || '',
                category: category,
                date: new Date().toISOString(),
                period_end: new Date().toISOString()
            });

            if (!insertError) {
                results.summariesGenerated++;
                // Mark articles as processed
                const ids = categoryArticles.map(a => a.id);
                await supabase.from('os_news_articles').update({ is_included_in_summary: true }).in('id', ids);
                results.articlesProcessed += ids.length;
            } else {
                results.errors.push(`DB Error for ${category}: ${insertError.message}`);
            }
        } else {
            results.errors.push(`Failed to generate AI summary for ${category}`);
        }
    }

    return results;
}
