import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
// @ts-ignore
import Parser from "rss-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { scrapeFullArticle } from "../src/lib/news-scraper";
import { classifyMotorsportArticle } from "../src/lib/news-classifier";
import { calculateTitleSimilarity } from "../src/lib/news-deduplicator";
import { CURATED_PADDOCK_ENTITIES, PaddockEntityRef, Article } from "../src/lib/types/news";

// 1. Load Environment Config
const envPath = path.join(process.cwd(), ".env.development.local");
const envVars: Record<string, string> = {};
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
const parser = new Parser({ timeout: 10000 });

// 2. Initialize Gemini 3.7 Flash Model
const geminiApiKey = envVars.GEMINI_API_KEY || envVars.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-3.7-flash" }) : null;

function cleanForFirestore(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

// 3. Accredited Motorsport Feeds Across All Major Disciplines
const FEEDS = [
  // 1. Stock Car & NASCAR
  { name: "Racer.com NASCAR", url: "https://racer.com/nascar/feed/", category: "stock_car" },
  { name: "Frontstretch NASCAR", url: "https://frontstretch.com/feed/", category: "stock_car" },
  { name: "Speedway Digest", url: "https://speedwaydigest.com/index.php/feed/", category: "stock_car" },
  { name: "Motorsport.com NASCAR", url: "https://www.motorsport.com/rss/nascar-cup/news/", category: "stock_car" },

  // 2. Open Wheel & IndyCar / F1
  { name: "Racer.com F1 / IndyCar", url: "https://racer.com/feed/", category: "open_wheel" },

  // 3. Sports Cars & Endurance
  { name: "Sportscar365", url: "https://sportscar365.com/feed/", category: "sportscar" },
  { name: "Speedcafe", url: "https://speedcafe.com/feed/", category: "sportscar" },

  // 4. Motocross & AMA Supercross
  { name: "Motocross Action Magazine", url: "https://motocrossactionmag.com/feed/", category: "motocross_supercross" },
  { name: "Cycle News Supercross & MX", url: "https://www.cyclenews.com/feed/", category: "motocross_supercross" },

  // 5. American Flat Track (AFT) & Road Racing
  { name: "Cycle News AFT & Flat Track", url: "https://www.cyclenews.com/feed/", category: "flat_track" },
  { name: "MotoAmerica Superbikes", url: "https://www.motoamerica.com/feed/", category: "motorcycles" },

  // 6. Grassroots Dirt Racing, Outlaws & USAC
  { name: "SPEED SPORT USAC Sprint Cars", url: "https://speedsport.com/sprint-cars/usac-sprint-cars/feed/", category: "dirt" },
  { name: "SPEED SPORT World of Outlaws", url: "https://speedsport.com/sprint-cars/world-of-outlaws-sprint-cars/feed/", category: "dirt" },
  { name: "World of Outlaws Sprint & Late Models", url: "https://worldofoutlaws.com/sprintcars/feed/", category: "dirt" },

  // 7. Grassroots Club Racing (SCCA, NASA, ChampCar, Karting)
  { name: "NASA Speed News (NASA National Wire)", url: "https://nasaspeed.news/feed/", category: "grassroots_club" },
  { name: "eKartingNews Grassroots Karting", url: "https://ekartingnews.com/feed/", category: "grassroots_club" },

  // 8. RC Racing (ROAR, IFMAR, 1/8 Nitro, 1/10 Electric)
  { name: "LiveRC Official Wire", url: "https://www.liverc.com/news/rss/", category: "rc_racing" },
  { name: "Red RC International", url: "https://www.redrc.net/feed/", category: "rc_racing" },
  { name: "RC Car Action", url: "https://www.rccaraction.com/feed/", category: "rc_racing" },

  // 9. Baja, Off-Road & American Rally
  { name: "DirtFish American Rally", url: "https://dirtfish.com/feed/", category: "offroad_rally" },
  { name: "UTV Underground Off-Road", url: "https://utvunderground.com/feed/", category: "offroad_rally" },

  // 10. Drag Racing & NHRA
  { name: "CompetitionPlus Drag Racing", url: "https://competitionplus.com/feed", category: "drag" },
  { name: "Drag Illustrated", url: "https://dragillustrated.com/feed/", category: "drag" },
  { name: "Dragzine NHRA", url: "https://www.dragzine.com/feed/", category: "drag" },

  // 11. Sim Racing & Esports
  { name: "Traxion.gg Sim Racing", url: "https://traxion.gg/feed/", category: "sim_racing" },

  // 12. Car Shows & Meets
  { name: "Car Show Radar", url: "https://carshowradar.com/feed/", category: "car_shows" },
];

function detectEntities(title: string, summary: string, content: string, articleCategory: string): PaddockEntityRef[] {
  const matched: PaddockEntityRef[] = [];
  const textHighSignal = `${title} ${summary}`.toLowerCase();
  const textFull = `${title} ${summary} ${content}`.toLowerCase();

  for (const entity of CURATED_PADDOCK_ENTITIES) {
    const nameMatch = textHighSignal.includes(entity.name.toLowerCase());
    const slugMatch = textHighSignal.includes(entity.slug.replace(/-/g, " "));

    if (nameMatch || slugMatch) {
      matched.push(cleanForFirestore({
        type: entity.type,
        name: entity.name,
        slug: entity.slug,
        image_url: entity.image_url || null,
        passport_url: entity.passport_url || null,
      }));
      continue;
    }

    if (entity.category && articleCategory && entity.category !== articleCategory) {
      continue;
    }

    const bodyNameMatch = textFull.includes(entity.name.toLowerCase());
    if (bodyNameMatch) {
      matched.push(cleanForFirestore({
        type: entity.type,
        name: entity.name,
        slug: entity.slug,
        image_url: entity.image_url || null,
        passport_url: entity.passport_url || null,
      }));
    }
  }

  return matched;
}

// 4. Gemini Semantic Synthesis & Journalistic Rewrite Helpers
async function rewriteArticleWithGemini(
  rawTitle: string,
  rawContent: string,
  sourceName: string,
  category: string,
  historicalContextArticles: Article[] = []
): Promise<{ title: string; summary: string; content: string }> {
  if (!geminiModel || !rawContent || rawContent.length < 150) {
    return {
      title: rawTitle,
      summary: rawContent.slice(0, 180).replace(/<[^>]*>/g, '').trim(),
      content: rawContent,
    };
  }

  try {
    const contextBlock = historicalContextArticles.length > 0 
      ? `\nPREVIOUS GRIDPASS WIRE REPORTS (Use STRICTLY for historical background, season continuity, and previous race context):\n` +
        historicalContextArticles.slice(0, 3).map((a, idx) => `[Prior Report ${idx + 1} (${a.published_at?.slice(0, 10) || 'Recent'})]: "${a.title}" — ${a.summary}`).join('\n') + '\n'
      : '';

    const prompt = `You are the Lead Senior Motorsport Editor for Gridpass News.
Rewrite the following raw press wire report from ${sourceName} into the signature "Gridpass 3-Tier Editorial Style".

GRIDPASS EDITORIAL STYLE & STRUCTURE INVARIANTS:
1. PURE ACCURACY FIRST: The raw source is your sole source of truth. NEVER invent fake quotes, fake lap times, or fictitious sponsors.
2. 3-TIER CONTENT STRUCTURE:
   - TIER 1: "### ⚡ Paddock Flash" (3 to 4 fast-reading bullet points with the most critical takeaways for busy racers).
   - TIER 2: "### 📊 Paddock Intelligence & Strategy" (1 to 2 paragraphs breaking down championship implications, car setups, or technical race context).
   - TIER 3: "### 🏁 Full Story & Driver Quotes" (2 to 4 complete narrative paragraphs including verbatim driver/team blockquotes formatted with > "...").
3. NO CUTOFFS: Never end sentences or paragraphs with "..." or placeholder text. Every thought must be complete.

PRIMARY SOURCE OF TRUTH:
Category: ${category}
Raw Headline: "${rawTitle}"
Raw Source Content:
"""
${rawContent.slice(0, 4500)}
"""
${contextBlock}

OUTPUT STRICT JSON with no markdown backticks or code fences, matching this schema:
{
  "title": "Clean, punchy headline",
  "summary": "Crisp 2-sentence executive lead summary without markdown headers",
  "content": "Full 3-tier story formatted with Markdown headings and blockquotes"
}`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    const parsed = JSON.parse(text);

    return {
      title: parsed.title || rawTitle,
      summary: parsed.summary || rawContent.slice(0, 180).trim(),
      content: parsed.content || rawContent,
    };
  } catch (err) {
    console.warn(`⚠️ AI rewrite fallback for "${rawTitle.slice(0, 30)}...":`, err);
    return {
      title: rawTitle,
      summary: rawContent.slice(0, 180).replace(/<[^>]*>/g, '').trim(),
      content: rawContent,
    };
  }
}

async function synthesizeWithGemini(masterStory: Article, newSourceTitle: string, newSourceContent: string, sourceName: string): Promise<string> {
  if (!geminiModel) {
    return newSourceContent.slice(0, 300);
  }

  try {
    const prompt = `You are the chief motorsport editor for Gridpass News.
We already have an existing master wire report: "${masterStory.title}".
A new dispatch just came in from ${sourceName}: "${newSourceTitle}".
Additional raw content: "${newSourceContent.slice(0, 800)}".

Write a crisp, 1-2 sentence factual paddock update synthesizing what new information, timing changes, or quotes ${sourceName} added to this master story. No fluff, no marketing jargon.`;

    const result = await geminiModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    return newSourceContent.slice(0, 300);
  }
}

// 5. Single Ingestion Cycle
async function runSingleIngestionCycle(): Promise<{ newStories: number; mergedStories: number }> {
  console.log(`\n📡 [${new Date().toLocaleTimeString()}] PADDOCK WIRE DAEMON: Checking feeds...`);

  // Load existing articles into local memory
  const existingSnap = await getDocs(collection(db, "news_articles"));
  const existingArticles: Article[] = [];
  existingSnap.forEach((d) => {
    const data = d.data() as Article;
    if (data.is_public !== false) {
      existingArticles.push({ ...data, id: d.id });
    }
  });

  let newStories = 0;
  let mergedStories = 0;

  for (const source of FEEDS) {
    try {
      const parsed = await parser.parseURL(source.url);
      const items = (parsed.items || []).slice(0, 4);

      for (const item of items) {
        if (!item.link || !item.title) continue;

        try {
          // Perform heavy deep scraping on local PC CPU
          const deepScraped = await scrapeFullArticle(item.link);
          const finalTitle = deepScraped?.title || item.title.trim();
          const cleanSlug = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
          const finalImage = deepScraped?.cover_image || (item.enclosure && item.enclosure.url) || "";
          const finalContent = deepScraped?.content || item.contentSnippet || item.title;
          const finalSummary = deepScraped?.summary || item.contentSnippet || item.title;
          const pubDate = item.isoDate || item.pubDate || new Date().toISOString();

          // Title-First Precision Taxonomy Classifier
          const exactCategory = classifyMotorsportArticle(finalTitle, `${finalSummary} ${finalContent}`, source.category as any);
          const detectedEntities = detectEntities(finalTitle, finalSummary, finalContent, exactCategory);

          // Check for similar story across existing articles (Semantic & Fuzzy Match)
          let matchingMaster: Article | null = null;

          for (const cand of existingArticles) {
            if (cand.category !== exactCategory) continue;

            const timeA = new Date(cand.published_at || "").getTime();
            const timeB = new Date(pubDate).getTime();
            if (timeA && timeB) {
              const diffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);
              if (diffHours > 72) continue;
            }

            const sim = calculateTitleSimilarity(finalTitle, cand.title);
            if (sim >= 0.40) {
              matchingMaster = cand;
              break;
            }
          }

          if (matchingMaster) {
            // MERGE & SYNTHESIZE
            const updatedSources = [...(matchingMaster.sources || [])];
            if (!updatedSources.some((s) => s.url === item.link)) {
              updatedSources.push({ name: source.name, url: item.link });

              const synthesizedUpdate = await synthesizeWithGemini(
                matchingMaster,
                finalTitle,
                finalSummary || finalContent,
                source.name
              );

              const existingUpdates = matchingMaster.updates || [];
              existingUpdates.push({
                id: `update_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                title: `Cross-Outlet Update: ${source.name}`,
                content: synthesizedUpdate,
                timestamp: pubDate,
                source_url: item.link,
              });

              await updateDoc(doc(db, "news_articles", matchingMaster.id), cleanForFirestore({
                sources: updatedSources,
                updates: existingUpdates,
                cover_image_url: matchingMaster.cover_image_url || finalImage || null,
                updated_at: new Date().toISOString(),
              }));

              mergedStories++;
              console.log(` 🔗 Merged "${finalTitle.slice(0, 35)}..." into Master "${matchingMaster.title.slice(0, 35)}..." (${updatedSources.length} sources)`);
            }
          } else {
            // Find relevant past articles for historical background context
            const pastContext = existingArticles
              .filter((a) => {
                if (a.id === cleanSlug) return false;
                const sameCat = a.category === exactCategory;
                const shareEntity = a.entities?.some((e) =>
                  detectedEntities.some((de) => de.slug === e.slug)
                );
                return sameCat || shareEntity;
              })
              .slice(0, 3);

            // CREATE NEW MASTER STORY (Synthesized with Gemini 3.7 Flash)
            const rewritten = await rewriteArticleWithGemini(
              finalTitle,
              finalContent || finalSummary,
              source.name,
              exactCategory,
              pastContext
            );

            const articleData = cleanForFirestore({
              id: cleanSlug,
              slug: cleanSlug,
              title: rewritten.title || finalTitle,
              subtitle: `Verified live wire report from ${source.name}`,
              category: exactCategory,
              article_type: "breaking",
              summary: rewritten.summary || finalSummary,
              content: rewritten.content || finalContent,
              cover_image_url: finalImage || null,
              gallery_urls: [],
              sources: [{ name: source.name, url: item.link }],
              entities: detectedEntities,
              verified_by: "Gridpass Motorsport Source of Truth Engine",
              is_public: true,
              status: "published",
              views: 0,
              referrers: {},
              author: deepScraped?.author || source.name,
              reading_time_mins: Math.max(1, Math.ceil((rewritten.content || finalContent).split(/\s+/).length / 200)),
              published_at: pubDate,
              created_at: pubDate,
              updated_at: pubDate,
            });

            await setDoc(doc(db, "news_articles", cleanSlug), articleData, { merge: true });
            existingArticles.push(articleData as Article);
            newStories++;
            console.log(` ✅ Ingested [${exactCategory}] "${finalTitle.slice(0, 45)}..."`);
          }
        } catch (itemErr) {
          // single item skip
        }
      }
    } catch (feedErr) {
      // feed skip
    }
  }

  // Update Daemon Heartbeat Telemetry in Firestore
  try {
    await setDoc(doc(db, "system_telemetry", "paddock_daemon"), {
      status: "RUNNING",
      last_poll_at: new Date().toISOString(),
      active_feeds_count: FEEDS.length,
      total_articles_tracked: existingArticles.length + newStories,
      updated_at: serverTimestamp(),
    }, { merge: true });
  } catch {}

  console.log(`🏁 Cycle Finished: +${newStories} new stories, +${mergedStories} merges.`);
  return { newStories, mergedStories };
}

// 6. Continuous Background Daemon Loop
async function startContinuousDaemon(intervalMinutes = 2) {
  console.log(`\n======================================================`);
  console.log(` 🏎️ GRIDPASS PADDOCK WIRE DAEMON INITIALIZED`);
  console.log(` Running on Local PC Workstation (Zero Cloud Serverless Cost)`);
  console.log(` Poll Interval: Every ${intervalMinutes} minutes`);
  console.log(`======================================================\n`);

  while (true) {
    try {
      await runSingleIngestionCycle();
    } catch (err: any) {
      console.error(`⚠️ Daemon Error during cycle:`, err.message);
    }

    const waitMs = intervalMinutes * 60 * 1000;
    console.log(`⏳ Sleeping ${intervalMinutes} minutes until next cycle...\n`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

if (require.main === module) {
  const isOneShot = process.argv.includes("--once");
  if (isOneShot) {
    runSingleIngestionCycle().then(() => process.exit(0));
  } else {
    startContinuousDaemon(2);
  }
}
