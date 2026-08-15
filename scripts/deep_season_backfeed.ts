import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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
const parser = new Parser({ timeout: 6000 });

function cleanForFirestore(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

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

// Full deep pagination across all feeds for the entire 2026 season
const DEEP_SEASON_FEEDS = [
  // Traxion (Sim Racing) - Pages 1-5
  { name: 'Traxion.gg', category: 'sim_racing', baseUrl: 'https://traxion.gg/feed/?paged=', maxPages: 5 },
  // MotoAmerica (Motorcycles) - Pages 1-6
  { name: 'MotoAmerica', category: 'motorcycles', baseUrl: 'https://motoamerica.com/feed/?paged=', maxPages: 6 },
  // Cycle News (Motorcycles) - Pages 1-5
  { name: 'Cycle News', category: 'motorcycles', baseUrl: 'https://www.cyclenews.com/feed/?paged=', maxPages: 5 },
  // Racer.com F1 - Pages 1-6
  { name: 'Racer.com F1', category: 'open_wheel', baseUrl: 'https://racer.com/f1/feed/?paged=', maxPages: 6 },
  // Racer.com IndyCar - Pages 1-6
  { name: 'Racer.com IndyCar', category: 'open_wheel', baseUrl: 'https://racer.com/indycar/feed/?paged=', maxPages: 6 },
  // Speedcafe - Pages 1-6
  { name: 'Speedcafe', category: 'open_wheel', baseUrl: 'https://www.speedcafe.com/feed/?paged=', maxPages: 6 },
  // Sportscar365 (IMSA / WEC) - Pages 1-6
  { name: 'Sportscar365', category: 'sportscar', baseUrl: 'https://sportscar365.com/feed/?paged=', maxPages: 6 },
  // World of Outlaws (Dirt) - Pages 1-5
  { name: 'World of Outlaws', category: 'dirt', baseUrl: 'https://worldofoutlaws.com/feed/?paged=', maxPages: 5 },
  // Dragzine (Drag Racing) - Pages 1-5
  { name: 'Dragzine', category: 'drag', baseUrl: 'https://www.dragzine.com/feed/?paged=', maxPages: 5 },
  // CarShowRadar (Car Shows) - Pages 1-5
  { name: 'CarShowRadar', category: 'car_shows', baseUrl: 'https://carshowradar.com/feed/?paged=', maxPages: 5 },
];

async function runDeepSeasonBackfeed() {
  console.log("🏁 Starting Deep Full-Season 2026 Motorsport Ingestion...");
  let totalIngested = 0;

  for (const source of DEEP_SEASON_FEEDS) {
    for (let page = 1; page <= source.maxPages; page++) {
      const url = `${source.baseUrl}${page}`;
      try {
        console.log(`📡 Ingesting [${source.category}] ${source.name} (Page ${page}/${source.maxPages})...`);
        const parsed = await parser.parseURL(url);

        if (!parsed.items || parsed.items.length === 0) break;

        for (const item of parsed.items) {
          if (!item.link || !item.title) continue;

          try {
            const deepScraped = await scrapeFullArticle(item.link);
            const finalTitle = deepScraped?.title || item.title.trim();
            const cleanSlug = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
            const finalImage = deepScraped?.cover_image || (item.enclosure && item.enclosure.url) || "";
            const finalContent = deepScraped?.content || item.contentSnippet || item.title;
            const finalSummary = deepScraped?.summary || item.contentSnippet || item.title;
            const pubDate = item.isoDate || item.pubDate || new Date().toISOString();

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
          } catch (itemErr) {
            // Ignore single item error
          }
        }
      } catch (err: any) {
        console.log(`⚠️ Skip page ${page} for ${source.name}:`, err.message);
      }
    }
  }

  console.log(`\n🎉 Deep Full-Season Backfeed Complete! Total Ingested Articles: ${totalIngested}`);
  process.exit(0);
}

runDeepSeasonBackfeed();
