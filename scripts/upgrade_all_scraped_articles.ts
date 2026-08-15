import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
// @ts-ignore
import Parser from "rss-parser";
import { scrapeFullArticle } from "../src/lib/news-scraper";

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
const parser = new Parser();

async function upgradeAllArticles() {
  console.log("⚡ Upgrading all articles with Deep Web Page Scraping (High-Res Photos + Full Text)...");
  const feedsSnap = await getDocs(collection(db, "news_feeds"));
  let upgradedCount = 0;

  for (const feedDoc of feedsSnap.docs) {
    const feed = feedDoc.data();
    try {
      console.log(`📡 Ingesting & Deep Scraping [${feed.category}] ${feed.name}...`);
      const parsed = await parser.parseURL(feed.url);

      for (const item of parsed.items.slice(0, 3)) {
        if (!item.link || !item.title) continue;

        const deepScraped = await scrapeFullArticle(item.link);
        const finalTitle = deepScraped?.title || item.title.trim();
        const cleanSlug = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
        const finalImage = deepScraped?.cover_image || (item.enclosure && item.enclosure.url) || "";
        const finalContent = deepScraped?.content || item.contentSnippet || item.title;
        const finalSummary = deepScraped?.summary || item.contentSnippet || item.title;
        const pubDate = item.isoDate || item.pubDate || new Date().toISOString();

        const articleRef = doc(db, "news_articles", cleanSlug);
        await setDoc(articleRef, {
          id: cleanSlug,
          slug: cleanSlug,
          title: finalTitle,
          subtitle: `Verified live wire report from ${feed.name}`,
          category: feed.category,
          article_type: "breaking",
          summary: finalSummary,
          content: finalContent,
          cover_image_url: finalImage,
          sources: [{ name: feed.name, url: item.link }],
          verified_by: "Gridpass Motorsport Source of Truth Engine",
          is_public: true,
          status: "published",
          views: 0,
          author: deepScraped?.author || feed.name,
          reading_time_mins: Math.max(1, Math.ceil(finalContent.split(/\s+/).length / 200)),
          published_at: pubDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { merge: true });

        upgradedCount++;
      }
    } catch (err: any) {
      console.log(`⚠️ Skip ${feed.name}:`, err.message);
    }
  }

  console.log(`\n🎉 Upgrade Complete! Deep scraped and updated ${upgradedCount} articles with full photos & paragraphs!`);
  process.exit(0);
}

upgradeAllArticles();
