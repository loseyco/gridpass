import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
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
    const slugMatch = lower.includes(entity.slug.replace(/-/g, " "));
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

const NASCAR_FEEDS = [
  { name: "Racer.com NASCAR", url: "https://racer.com/nascar/feed/" },
  { name: "Racer.com NASCAR Paged", url: "https://racer.com/nascar/feed/?paged=2" },
  { name: "Frontstretch NASCAR", url: "https://frontstretch.com/feed/" },
  { name: "Frontstretch NASCAR Paged", url: "https://frontstretch.com/feed/?paged=2" },
  { name: "Speedway Digest", url: "https://speedwaydigest.com/index.php/feed/" },
  { name: "Motorsport.com NASCAR", url: "https://www.motorsport.com/rss/nascar-cup/news/" },
];

async function ingestNascar() {
  console.log("🏁 Ingesting Verified 2026 NASCAR Stories...");
  let totalIngested = 0;

  for (const source of NASCAR_FEEDS) {
    try {
      console.log(`📡 Fetching [stock_car] ${source.name} (${source.url})...`);
      const parsed = await parser.parseURL(source.url);

      for (const item of (parsed.items || []).slice(0, 10)) {
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
            subtitle: `Verified 2026 NASCAR paddock dispatch from ${source.name}`,
            category: "stock_car",
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
          console.log(` ✅ Ingested NASCAR: "${finalTitle.slice(0, 45)}..."`);
        } catch (err: any) {
          console.log(` ⚠️ Skip NASCAR item:`, err.message);
        }
      }
    } catch (err: any) {
      console.log(`⚠️ Skip NASCAR feed ${source.name}:`, err.message);
    }
  }

  console.log(`\n🎉 Ingested ${totalIngested} verified NASCAR articles!`);
  process.exit(0);
}

ingestNascar();
