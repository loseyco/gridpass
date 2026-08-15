import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
// @ts-ignore
import Parser from "rss-parser";
import { scrapeFullArticle } from "../src/lib/news-scraper";
import { CURATED_PADDOCK_ENTITIES, PaddockEntityRef } from "../src/lib/types/news";

const envPath = path.join(process.cwd(), ".env.development.local");
const envVars: any = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      envVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/['"]/g, "");
    }
  });
}

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gridpass",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const parser = new Parser({ timeout: 5000 });

// Helper to remove undefined values for Firestore
function cleanForFirestore(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

// Helper to auto-match entities mentioned in the title/content
function detectPaddockEntities(text: string): PaddockEntityRef[] {
  const matched: PaddockEntityRef[] = [];
  const lower = text.toLowerCase();

  for (const entity of CURATED_PADDOCK_ENTITIES) {
    const nameMatch = lower.includes(entity.name.toLowerCase());
    const slugMatch = lower.includes(entity.slug.replace(/-/g, ' '));
    if (nameMatch || slugMatch) {
      matched.push({
        type: entity.type,
        name: entity.name,
        slug: entity.slug,
        image_url: entity.image_url || undefined,
        passport_url: entity.passport_url || undefined,
      });
    }
  }

  return matched;
}

const ARCHIVE_FEEDS = [
  { name: 'Traxion.gg', category: 'sim_racing', urls: ['https://traxion.gg/feed/', 'https://traxion.gg/feed/?paged=2'] },
  { name: 'MotoAmerica', category: 'motorcycles', urls: ['https://motoamerica.com/feed/', 'https://motoamerica.com/feed/?paged=2'] },
  { name: 'Cycle News', category: 'motorcycles', urls: ['https://www.cyclenews.com/feed/'] },
  { name: 'Racer.com F1', category: 'open_wheel', urls: ['https://racer.com/f1/feed/'] },
  { name: 'Racer.com IndyCar', category: 'open_wheel', urls: ['https://racer.com/indycar/feed/'] },
  { name: 'Speedcafe', category: 'open_wheel', urls: ['https://www.speedcafe.com/feed/'] },
  { name: 'Sportscar365', category: 'sportscar', urls: ['https://sportscar365.com/feed/'] },
  { name: 'World of Outlaws', category: 'dirt', urls: ['https://worldofoutlaws.com/feed/'] },
  { name: 'Dragzine', category: 'drag', urls: ['https://www.dragzine.com/feed/'] },
  { name: 'CarShowRadar', category: 'car_shows', urls: ['https://carshowradar.com/feed/'] },
];

async function run2026Backfeed() {
  console.log("🏁 Starting Fast 2026 Historical Motorsport Backfeed Engine...");
  let totalIngested = 0;

  for (const source of ARCHIVE_FEEDS) {
    for (const url of source.urls) {
      try {
        console.log(`📡 Ingesting archive page: [${source.category}] ${source.name}...`);
        const parsed = await parser.parseURL(url);

        for (const item of (parsed.items || []).slice(0, 4)) {
          if (!item.link || !item.title) continue;

          try {
            // Deep scrape article with 3s timeout
            const deepScraped = await scrapeFullArticle(item.link);
            const finalTitle = deepScraped?.title || item.title.trim();
            const cleanSlug = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
            const finalImage = deepScraped?.cover_image || (item.enclosure && item.enclosure.url) || "";
            const finalContent = deepScraped?.content || item.contentSnippet || item.title;
            const finalSummary = deepScraped?.summary || item.contentSnippet || item.title;
            const pubDate = item.isoDate || item.pubDate || new Date().toISOString();

            // Auto-detect entity tags (Series, Teams, Drivers, Venues)
            const combinedText = `${finalTitle} ${finalSummary} ${finalContent}`;
            const detectedEntities = detectPaddockEntities(combinedText);

            const articleData = cleanForFirestore({
              id: cleanSlug,
              slug: cleanSlug,
              title: finalTitle,
              subtitle: `Verified 2026 paddock report from ${source.name}`,
              category: source.category,
              article_type: "breaking",
              summary: finalSummary,
              content: finalContent,
              cover_image_url: finalImage || null,
              sources: [{ name: source.name, url: item.link }],
              entities: detectedEntities,
              verified_by: "Gridpass Motorsport Source of Truth Engine",
              is_public: true,
              status: "published",
              views: 0,
              author: deepScraped?.author || source.name,
              reading_time_mins: Math.max(1, Math.ceil(finalContent.split(/\s+/).length / 200)),
              published_at: pubDate,
              created_at: pubDate,
              updated_at: pubDate,
            });

            const articleRef = doc(db, "news_articles", cleanSlug);
            await setDoc(articleRef, articleData, { merge: true });
            totalIngested++;
            console.log(` ✅ Ingested: "${finalTitle.slice(0, 45)}..." (${detectedEntities.length} entities tagged)`);
          } catch (itemErr: any) {
            console.log(` ⚠️ Skip item:`, itemErr.message);
          }
        }
      } catch (err: any) {
        console.log(`⚠️ Skip archive url ${url}:`, err.message);
      }
    }
  }

  console.log(`\n🎉 2026 Backfeed Complete! Ingested and entity-tagged ${totalIngested} rich articles!`);
  process.exit(0);
}

run2026Backfeed();
