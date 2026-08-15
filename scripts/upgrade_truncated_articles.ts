import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { scrapeFullArticle } from "../src/lib/news-scraper";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.development.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gridpass",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

async function rewriteFullStory(title: string, fullScrapedText: string, sourceName: string, category: string) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.7-flash" });
    const prompt = `You are the Lead Senior Motorsport Editor at Gridpass.
You are rewriting an accredited press wire into an authoritative, engaging, multi-paragraph Gridpass Editorial Story.

STRICT SOURCE OF TRUTH RULES:
1. The raw source material is your sole source of truth for all driver quotes, lap times, standings, and race events.
2. DO NOT invent fictitious statistics, quotes, or fake sponsors.
3. Write a comprehensive, complete 3 to 6 paragraph story. Never truncate sentences or end with "...".
4. Include:
   - Clean journalistic title
   - 2-sentence executive summary
   - Multi-paragraph editorial body covering the full context, quotes, and championship implications.

RAW WIRE REPORT:
Headline: ${title}
Source Outlet: ${sourceName}
Category: ${category}
Full Wire Content:
${fullScrapedText.slice(0, 4000)}

Respond strictly in valid JSON format with this exact schema:
{
  "title": "Clean, engaging headline",
  "summary": "Crisp 2-sentence executive lead summary without markdown headers",
  "content": "Full multi-paragraph article body with markdown subheadings (##) and formatted quotes (>)"
}`;

    const res = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const parsed = JSON.parse(res.response.text());
    return parsed;
  } catch (err: any) {
    console.warn(`⚠️ Gemini error for "${title.slice(0, 30)}":`, err.message);
    return null;
  }
}

async function main() {
  console.log("🏁 Starting Truncated Articles Deep Upgrade...");
  const snap = await getDocs(collection(db, "news_articles"));
  console.log(`Found ${snap.size} total articles in database.`);

  const truncatedDocs: any[] = [];
  snap.forEach((d) => {
    const data = d.data();
    const c = (data.content || "").trim();
    if (c.length < 350 || c.endsWith("...") || c.endsWith("…") || c.endsWith("..")) {
      truncatedDocs.push({ id: d.id, ...data });
    }
  });

  console.log(`🔍 Found ${truncatedDocs.length} truncated articles that need deep scraping & AI rewriting.\n`);

  let upgradedCount = 0;

  for (const art of truncatedDocs) {
    const sourceUrl = art.sources?.[0]?.url || art.source_url || art.url;
    const sourceName = art.sources?.[0]?.name || art.source_name || "Paddock Wire";
    console.log(`\n📄 [${upgradedCount + 1}/${truncatedDocs.length}] Processing: "${art.title.slice(0, 45)}..."`);

    let fullText = art.content;
    let coverImage = art.cover_image;

    if (sourceUrl) {
      console.log(`   🌐 Scraping full web page: ${sourceUrl}`);
      const scraped = await scrapeFullArticle(sourceUrl);
      if (scraped && scraped.content && scraped.content.length > 250) {
        fullText = scraped.content;
        if (!coverImage && scraped.cover_image) {
          coverImage = scraped.cover_image;
        }
        console.log(`   ✅ Deep scrape successful (${scraped.content.length} chars).`);
      } else {
        console.log(`   ⚠️ Deep scrape returned short content (${scraped?.content?.length || 0} chars). Using available context.`);
      }
    }

    // Rate-limit throttle delay for Gemini free tier
    await new Promise((r) => setTimeout(r, 2000));

    const rewritten = await rewriteFullStory(art.title, fullText, sourceName, art.category || "stock_car");

    if (rewritten && rewritten.content && rewritten.content.length > 300) {
      const readingTime = Math.max(1, Math.ceil(rewritten.content.split(/\s+/).length / 200));
      await updateDoc(doc(db, "news_articles", art.id), {
        title: rewritten.title || art.title,
        summary: rewritten.summary || art.summary,
        content: rewritten.content,
        cover_image: coverImage || art.cover_image || null,
        reading_time_mins: readingTime,
        updated_at: new Date().toISOString(),
      });
      console.log(`   🎉 Successfully upgraded in Firestore! Content length: ${rewritten.content.length} chars (${readingTime} min read).`);
      upgradedCount++;
    } else {
      console.log(`   ❌ Upgrade skipped due to AI generation fallback.`);
    }
  }

  console.log(`\n🏁 Finished! Successfully upgraded ${upgradedCount} truncated articles into full, rich editorial stories.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
