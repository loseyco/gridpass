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

async function rewriteInGridpassStyle(title: string, fullScrapedText: string, sourceName: string, category: string) {
  if (!genAI) return null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are the Lead Senior Motorsport Editor at Gridpass.
You are rewriting an accredited press wire into the signature, highly engaging "Gridpass 3-Tier Editorial Style".

GRIDPASS EDITORIAL STYLE & STRUCTURE INVARIANTS:
1. PURE ACCURACY FIRST: The raw source is your sole source of truth. NEVER invent fake quotes, fake lap times, or fictitious sponsors.
2. 3-TIER CONTENT STRUCTURE:
   - TIER 1: "### ⚡ Paddock Flash" (3 to 4 fast-reading bullet points with the most critical takeaways for busy racers).
   - TIER 2: "### 📊 Paddock Intelligence & Strategy" (1 to 2 paragraphs breaking down championship implications, car setups, or technical race context).
   - TIER 3: "### 🏁 Full Story & Driver Quotes" (2 to 4 complete narrative paragraphs including verbatim driver/team blockquotes formatted with > "...").
3. NO CUTOFFS: Never end sentences or paragraphs with "..." or placeholder text. Every thought must be complete.

RAW WIRE MATERIAL:
Headline: ${title}
Source Outlet: ${sourceName}
Category: ${category}
Full Wire Content:
${fullScrapedText.slice(0, 4500)}

Respond strictly in valid JSON format with this exact schema:
{
  "title": "Compelling, punchy headline",
  "summary": "Crisp 2-sentence executive lead summary",
  "content": "Full 3-tier story formatted with Markdown headings and blockquotes"
}`;

      const res = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      });

      const parsed = JSON.parse(res.response.text());
      return parsed;
    } catch (err: any) {
      if (err?.message?.includes("429") || err?.message?.includes("Quota") || err?.status === 429) {
        console.log(`   ⏳ Rate limit reached. Waiting 15s before retry (Attempt ${attempt}/3)...`);
        await new Promise((r) => setTimeout(r, 15000));
      } else {
        console.warn(`   ⚠️ Generation error: ${err.message.slice(0, 100)}`);
        break;
      }
    }
  }

  return null;
}

async function main() {
  console.log("🏁 Starting Gridpass Style Rebatch (Past Week's Articles)...");
  const snap = await getDocs(collection(db, "news_articles"));
  console.log(`Loaded ${snap.size} total articles from Cloud Firestore.`);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const targetArticles: any[] = [];
  snap.forEach((d) => {
    const data = d.data();
    const pubDate = new Date(data.published_at || data.created_at || "2026-08-01");
    // Target past week or any truncated story
    if (pubDate >= oneWeekAgo || (data.content || "").length < 400 || (data.content || "").endsWith("...")) {
      targetArticles.push({ id: d.id, ...data });
    }
  });

  console.log(`🔍 Found ${targetArticles.length} articles from the past week to re-scrape and write in Gridpass 3-Tier Style.\n`);

  let upgradedCount = 0;

  for (let i = 0; i < targetArticles.length; i++) {
    const art = targetArticles[i];
    const sourceUrl = art.sources?.[0]?.url || art.source_url || art.url;
    const sourceName = art.sources?.[0]?.name || art.source_name || "Paddock Wire";

    console.log(`\n📄 [${i + 1}/${targetArticles.length}] Processing: "${art.title.slice(0, 45)}..."`);

    let fullText = art.content || "";
    let coverImage = art.cover_image || null;

    if (sourceUrl) {
      try {
        console.log(`   🌐 Scraping full source: ${sourceUrl}`);
        const scraped = await scrapeFullArticle(sourceUrl);
        if (scraped && scraped.content && scraped.content.length > 250) {
          fullText = scraped.content;
          if (!coverImage && scraped.cover_image) {
            coverImage = scraped.cover_image;
          }
          console.log(`   ✅ Extracted ${scraped.content.length} chars of rich editorial context.`);
        } else {
          console.log(`   ⚠️ Scraper returned fallback context (${fullText.length} chars).`);
        }
      } catch (scrapeErr: any) {
        console.log(`   ⚠️ Scraper error: ${scrapeErr.message}`);
      }
    }

    // Rate-limit throttle delay
    await new Promise((r) => setTimeout(r, 1200));

    const rewritten = await rewriteInGridpassStyle(art.title, fullText, sourceName, art.category || "stock_car");

    if (rewritten && rewritten.content && rewritten.content.length > 350) {
      const readingTime = Math.max(1, Math.ceil(rewritten.content.split(/\s+/).length / 200));
      await updateDoc(doc(db, "news_articles", art.id), {
        title: rewritten.title || art.title,
        summary: rewritten.summary || art.summary,
        content: rewritten.content,
        cover_image: coverImage || art.cover_image || null,
        reading_time_mins: readingTime,
        updated_at: new Date().toISOString(),
      });
      console.log(`   🎉 Upgraded in Gridpass Style! Length: ${rewritten.content.length} chars (${readingTime} min read).`);
      upgradedCount++;
    } else {
      console.log(`   ❌ Skipped (AI generation error).`);
    }
  }

  console.log(`\n🏁 Rebatch Completed! Successfully converted ${upgradedCount} articles into the Gridpass 3-Tier Editorial Style.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
