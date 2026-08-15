import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { calculateTitleSimilarity } from "../src/lib/news-deduplicator";

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

function cleanForFirestore(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

async function consolidateDuplicates() {
  console.log("🔍 Scanning for duplicate stories across all 19 outlets...");
  const snap = await getDocs(collection(db, "news_articles"));
  const allArticles: any[] = [];

  snap.forEach((d) => {
    allArticles.push({ id: d.id, ...d.data() });
  });

  // Sort by published_at ascending so earlier story becomes the master
  allArticles.sort((a, b) => (a.published_at || "").localeCompare(b.published_at || ""));

  const mergedMasterMap: Map<string, any> = new Map();
  const duplicateIdsToHide: Set<string> = new Set();
  let mergedCount = 0;

  for (let i = 0; i < allArticles.length; i++) {
    const current = allArticles[i];
    if (duplicateIdsToHide.has(current.id)) continue;

    let master = current;

    for (let j = i + 1; j < allArticles.length; j++) {
      const candidate = allArticles[j];
      if (duplicateIdsToHide.has(candidate.id)) continue;
      if (candidate.category !== master.category) continue;

      const timeA = new Date(master.published_at || "").getTime();
      const timeB = new Date(candidate.published_at || "").getTime();
      if (timeA && timeB) {
        const diffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);
        if (diffHours > 72) continue;
      }

      const sim = calculateTitleSimilarity(master.title, candidate.title);

      if (sim >= 0.40) {
        console.log(` 🔗 MERGING:`);
        console.log(`    Master:    "${master.title}"`);
        console.log(`    Duplicate: "${candidate.title}" (Similarity: ${(sim * 100).toFixed(0)}%)`);

        // Combine sources
        const combinedSources = [...(master.sources || [])];
        for (const src of candidate.sources || []) {
          if (!combinedSources.some((s) => s.url === src.url)) {
            combinedSources.push(src);
          }
        }

        // Add update note
        const existingUpdates = master.updates || [];
        existingUpdates.push({
          id: `update_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: `Cross-Outlet Paddock Report: ${candidate.sources?.[0]?.name || 'Accredited Source'}`,
          content: candidate.summary || candidate.content?.slice(0, 300) || '',
          timestamp: candidate.published_at || new Date().toISOString(),
          source_url: candidate.sources?.[0]?.url || null,
        });

        // Cover photo preference
        const bestImage = master.cover_image_url || candidate.cover_image_url || null;

        master = {
          ...master,
          sources: combinedSources,
          updates: existingUpdates,
          cover_image_url: bestImage,
          updated_at: new Date().toISOString(),
        };

        duplicateIdsToHide.add(candidate.id);
        mergedCount++;
      }
    }

    mergedMasterMap.set(master.id, master);
  }

  console.log(`\n💾 Writing consolidations to Firestore (${mergedCount} duplicates merged)...`);

  // Update Master Articles
  for (const [masterId, masterData] of mergedMasterMap.entries()) {
    if (masterData.sources && masterData.sources.length > 1) {
      await updateDoc(doc(db, "news_articles", masterId), cleanForFirestore({
        sources: masterData.sources,
        updates: masterData.updates || [],
        cover_image_url: masterData.cover_image_url || null,
        updated_at: masterData.updated_at,
      }));
    }
  }

  // Soft-hide duplicate articles
  for (const dupId of duplicateIdsToHide) {
    await updateDoc(doc(db, "news_articles", dupId), {
      is_public: false,
      archived: true,
    });
  }

  console.log(`🎉 Consolidation Complete! Merged ${mergedCount} duplicate stories into multi-source master reports.`);
  process.exit(0);
}

consolidateDuplicates();
