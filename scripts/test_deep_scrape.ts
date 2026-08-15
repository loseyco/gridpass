import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
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

async function testDeepScrape() {
  const url = "https://traxion.gg/le-mans-ultimates-next-us-tracks-set-for-september-and-december-release/";
  console.log(`🔍 Deep scraping full article from ${url}...`);
  
  const scraped = await scrapeFullArticle(url);
  if (!scraped) {
    console.error("❌ Failed to scrape");
    process.exit(1);
  }

  console.log("✅ Scrape Success!");
  console.log("Title:", scraped.title);
  console.log("Cover Image:", scraped.cover_image);
  console.log("Content Length:", scraped.content.length, "characters");
  console.log("Paragraphs Sample:\n", scraped.content.slice(0, 400));

  const cleanSlug = "le-mans-ultimate-s-next-us-tracks-set-for-september-and-december-release";
  const docRef = doc(db, "news_articles", cleanSlug);

  await setDoc(docRef, {
    id: cleanSlug,
    slug: cleanSlug,
    title: scraped.title || "Le Mans Ultimate’s next US tracks set for September and December release",
    subtitle: "Verified motorsport intelligence & timing breakdown",
    category: "sim_racing",
    article_type: "breaking",
    summary: scraped.summary,
    content: scraped.content,
    cover_image_url: scraped.cover_image,
    sources: [{ name: "Traxion.gg", url }],
    verified_by: "Gridpass Motorsport Source of Truth Engine",
    is_public: true,
    status: "published",
    views: 0,
    author: scraped.author || "Paddock Wire",
    reading_time_mins: Math.max(1, Math.ceil(scraped.content.split(/\s+/).length / 200)),
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { merge: true });

  console.log("🎉 Article successfully updated in Firestore!");
  process.exit(0);
}

testDeepScrape();
