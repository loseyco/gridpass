import * as fs from 'fs';
import * as path from 'path';
import Parser from 'rss-parser';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { scrapeFullArticle } from '../src/lib/news-scraper';
import { classifyMotorsportArticle } from '../src/lib/news-classifier';
import { findMatchingStory, cleanTitle } from '../src/lib/news-deduplicator';
import { NewsFeed, RawNewsItem, Article } from '../src/lib/types/news';

// 1. Read Environment Variables
const envVars: Record<string, string> = {};
const envFiles = ['.env.development.local', '.env.local', '.env.production.local', '.env'];

for (const file of envFiles) {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const eqIdx = trimmed.indexOf('=');
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!envVars[key]) envVars[key] = val;
      }
    });
  }
}

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gridpass',
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Gridpass-Wire/2.0',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  timeout: 10000,
  customFields: {
    item: ['media:content', 'enclosure', 'content:encoded', 'description'],
  },
});

function hashUrl(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function runSingleCycle() {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  try {
    const feedsQuery = query(collection(db, 'news_feeds'), where('is_active', '==', true));
    const feedsSnap = await getDocs(feedsQuery);
    const feeds = feedsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as NewsFeed));

    if (feeds.length === 0) {
      console.log(`[${timestamp}] ⚠️ No active feeds found in news_feeds collection.`);
      return;
    }

    // Load existing articles for cross-feed deduplication
    const existingSnap = await getDocs(query(collection(db, 'news_articles'), where('is_public', '==', true)));
    const existingArticles = existingSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));

    let newItemsCount = 0;
    let mergedCount = 0;

    for (const feed of feeds) {
      try {
        const parsedFeed = await parser.parseURL(feed.url);
        const recentItems = (parsedFeed.items || []).slice(0, 5);

        for (const item of recentItems) {
          if (!item.link) continue;
          const itemId = hashUrl(item.link);
          const rawDocRef = doc(db, 'raw_news_items', itemId);
          const rawSnap = await getDoc(rawDocRef);

          if (rawSnap.exists()) continue; // Already ingested raw item

          // Deep scrape article
          const deep = await scrapeFullArticle(item.link);
          const rawTitle = (deep?.title || item.title || 'Untitled Motorsport Report').trim();
          const finalTitle = cleanTitle(rawTitle);
          const finalImage = deep?.cover_image || (item.enclosure && item.enclosure.url) || null;
          const finalContent = deep?.content || (item as any)['content:encoded'] || item.contentSnippet || item.content || '';
          const finalSummary = deep?.summary || item.contentSnippet || item.summary || finalContent.slice(0, 200);
          const pubDate = item.isoDate || item.pubDate || new Date().toISOString();

          // Classify
          const exactCategory = classifyMotorsportArticle(finalTitle, `${finalSummary} ${finalContent}`, feed.category);

          const rawItem: RawNewsItem = {
            id: itemId,
            feed_id: feed.id,
            title: finalTitle,
            category: exactCategory,
            source_name: feed.name,
            source_url: item.link,
            summary: finalSummary,
            content: finalContent,
            image_url: finalImage,
            published_at: pubDate,
            ingested_at: new Date().toISOString(),
          };

          await setDoc(rawDocRef, rawItem);

          // Check if a matching story already exists across any feed
          const matchingMaster = findMatchingStory(finalTitle, exactCategory, pubDate, existingArticles, 0.45);

          if (matchingMaster) {
            // MERGE into existing master story rather than creating duplicate card
            const masterDocRef = doc(db, 'news_articles', matchingMaster.id);
            const updates: Record<string, any> = {
              updated_at: new Date().toISOString(),
            };
            if (!matchingMaster.cover_image && finalImage) {
              updates.cover_image = finalImage;
              updates.cover_image_url = finalImage;
            }
            await setDoc(masterDocRef, updates, { merge: true });
            mergedCount++;
            console.log(`[${timestamp}] 🔀 Merged duplicate story into "${matchingMaster.title?.slice(0, 40)}..." (${feed.name})`);
          } else {
            // CREATE NEW STORY
            const slug = `${slugify(finalTitle).slice(0, 80)}-${itemId.slice(0, 6)}`;
            const articleDocRef = doc(db, 'news_articles', itemId);

            const article: Partial<Article> = {
              id: itemId,
              slug,
              title: finalTitle,
              category: exactCategory,
              article_type: 'standard',
              summary: finalSummary,
              content: finalContent,
              cover_image: finalImage,
              cover_image_url: finalImage,
              source_name: feed.name,
              source_url: item.link,
              verified_by: 'Gridpass Autonomous News Engine',
              is_public: true,
              status: 'published',
              views: 0,
              likes_count: 0,
              comments_count: 0,
              published_at: pubDate,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            await setDoc(articleDocRef, article, { merge: true });
            existingArticles.push(article as Article);
            newItemsCount++;
            console.log(`[${timestamp}] 🏎️ Ingested [${exactCategory.toUpperCase()}]: "${finalTitle.slice(0, 50)}..." (${feed.name})`);
          }
        }
      } catch (err: any) {
        // Individual feed error
      }
    }

    if (newItemsCount === 0 && mergedCount === 0) {
      console.log(`[${timestamp}] 📡 Polled ${feeds.length} feeds. (0 new stories - up to date)`);
    } else {
      console.log(`[${timestamp}] ✅ Cycle Complete: ${newItemsCount} new, ${mergedCount} merged stories!`);
    }

    // Save live status doc for page headers
    await setDoc(
      doc(db, 'system_settings', 'news_feed_status'),
      {
        last_checked_at: new Date().toISOString(),
        total_active_feeds: feeds.length,
        last_new_items_count: newItemsCount,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.error(`[${timestamp}] ❌ Polling error:`, err.message);
  }
}

async function startDaemon() {
  console.log('================================================================');
  console.log('🏁 Gridpass Local 1-Minute RSS Feed Daemon Initialized');
  console.log('📡 Running continuously in background on your local PC...');
  console.log('🔄 Checking all 22 active motorsport feeds every 60 seconds');
  console.log('================================================================\n');

  // Initial Run
  await runSingleCycle();

  // 60-Second Loop
  setInterval(async () => {
    await runSingleCycle();
  }, 60000);
}

startDaemon();
