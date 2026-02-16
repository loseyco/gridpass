import { NextRequest, NextResponse } from 'next/server';
import { scrapeLatestNews } from '@/lib/news/scraper';
import { generateDailySummary } from '@/lib/news/summarizer';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(req: NextRequest) {
    // Verify Cron secret if deployed (Vercel protects cron jobs, but good to have)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('Starting scheduled news processing...');

        // 1. Scrape News
        const scrapeResults = await scrapeLatestNews();
        console.log('Scrape results:', scrapeResults);

        // 2. Summarize (if new articles were processed or just run periodically)
        // For now, we run it every time. The summarizer checks for unsummarized articles.
        const summaryResults = await generateDailySummary();
        console.log('Summary results:', summaryResults);

        return NextResponse.json({
            success: true,
            scraped: scrapeResults,
            summary: summaryResults,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error in news cron:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
    }
}
