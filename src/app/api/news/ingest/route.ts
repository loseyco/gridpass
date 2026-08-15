import { NextResponse } from 'next/server';
import { getAdminDb, adminFirestore } from '@/lib/firebase/admin';
import Parser from 'rss-parser';
import crypto from 'crypto';
import { NewsFeed, RawNewsItem, Article } from '@/lib/types/news';
import { scrapeFullArticle } from '@/lib/news-scraper';

export const maxDuration = 300; // 5 minutes max execution time for Vercel

const parser = new Parser({
  customFields: {
    item: ['media:content', 'enclosure', 'content:encoded', 'description'],
  },
});

function hashUrl(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

import { classifyMotorsportArticle } from '@/lib/news-classifier';
import { findMatchingStory } from '@/lib/news-deduplicator';

export async function GET(req: Request) {
  return POST(req);
}

export async function POST(req: Request) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const feedsSnapshot = await db.collection('news_feeds').where('is_active', '==', true).get();
    const feeds = feedsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsFeed));

    // Fetch existing articles for deduplication
    const existingSnap = await db.collection('news_articles').where('is_public', '==', true).get();
    const existingArticles = existingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));

    let totalIngested = 0;
    let totalMerged = 0;
    const batchStats: Record<string, number> = {};

    for (const feed of feeds) {
      try {
        const parsedFeed = await parser.parseURL(feed.url);
        let feedIngested = 0;
        
        for (const item of parsedFeed.items.slice(0, 5)) {
          if (!item.link) continue;
          
          const itemId = hashUrl(item.link);
          const docRef = db.collection('raw_news_items').doc(itemId);
          
          // Check if raw item already ingested
          const docSnap = await docRef.get();
          if (docSnap.exists) continue; // Skip existing

          // Deep scrape the full article from web page for high-res cover and rich content
          const deepScraped = await scrapeFullArticle(item.link);

          const finalTitle = deepScraped?.title || item.title || 'Untitled';
          const finalImage = deepScraped?.cover_image || (item.enclosure && item.enclosure.url) || '';
          const finalContent = deepScraped?.content || item['content:encoded'] || item.contentSnippet || '';
          const finalSummary = deepScraped?.summary || item.contentSnippet || item.summary || '';
          const pubDate = item.isoDate || item.pubDate || new Date().toISOString();

          // Classify with precision taxonomy
          const exactCategory = classifyMotorsportArticle(finalTitle, `${finalSummary} ${finalContent}`, feed.category);

          const rawNewsItem: RawNewsItem = {
            id: itemId,
            feed_id: feed.id,
            title: finalTitle,
            source_name: feed.name,
            source_url: item.link,
            summary: finalSummary,
            content: finalContent,
            image_url: finalImage || null,
            published_at: pubDate,
            category: exactCategory,
            ingested_at: new Date().toISOString(),
          };

          await docRef.set(rawNewsItem);

          // Check if a similar story already exists across existing articles
          const matchingMaster = findMatchingStory(
            finalTitle,
            exactCategory,
            pubDate,
            existingArticles
          );

          if (matchingMaster) {
            // MERGE & SYNTHESIZE into existing master report
            const updatedSources = [...(matchingMaster.sources || [])];
            if (!updatedSources.some(s => s.url === item.link)) {
              updatedSources.push({ name: feed.name, url: item.link });
            }

            const existingUpdates = matchingMaster.updates || [];
            existingUpdates.push({
              id: `update_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              title: `Cross-Outlet Paddock Report: ${feed.name}`,
              content: finalSummary || finalContent.slice(0, 300),
              timestamp: pubDate,
              source_url: item.link,
            });

            await db.collection('news_articles').doc(matchingMaster.id).update({
              sources: updatedSources,
              updates: existingUpdates,
              cover_image_url: matchingMaster.cover_image_url || finalImage || null,
              updated_at: new Date().toISOString(),
            });

            totalMerged++;
          } else {
            // CREATE NEW MASTER STORY
            const cleanSlug = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
            const articleRef = db.collection('news_articles').doc(cleanSlug);
            
            const articleData: Article = {
              id: cleanSlug,
              slug: cleanSlug,
              title: finalTitle,
              subtitle: `Verified live wire report from ${feed.name}`,
              category: exactCategory,
              article_type: 'breaking',
              summary: finalSummary,
              content: finalContent,
              cover_image_url: finalImage || null,
              gallery_urls: [],
              sources: [{ name: feed.name, url: item.link }],
              verified_by: 'Gridpass Motorsport Source of Truth Engine',
              is_public: true,
              status: 'published',
              views: 0,
              referrers: {},
              published_at: pubDate,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            await articleRef.set(articleData, { merge: true });
            existingArticles.push(articleData);
            totalIngested++;
            feedIngested++;
          }
        }
        batchStats[feed.name] = feedIngested;
      } catch (feedErr) {
        console.error(`Error processing feed ${feed.name}:`, feedErr);
      }
    }

    return NextResponse.json({
      success: true,
      total_ingested: totalIngested,
      total_merged: totalMerged,
      stats: batchStats,
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
