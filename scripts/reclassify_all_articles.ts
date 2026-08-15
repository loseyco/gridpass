import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { classifyMotorsportArticle } from "../src/lib/news-classifier";

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

import { CURATED_PADDOCK_ENTITIES, PaddockEntityRef } from "../src/lib/types/news";

function cleanForFirestore(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

function detectAccurateEntities(title: string, summary: string, content: string, articleCategory: string): PaddockEntityRef[] {
  const matched: PaddockEntityRef[] = [];
  const textHighSignal = `${title} ${summary}`.toLowerCase();
  const textFull = `${title} ${summary} ${content}`.toLowerCase();

  for (const entity of CURATED_PADDOCK_ENTITIES) {
    const nameMatch = textHighSignal.includes(entity.name.toLowerCase());
    const slugMatch = textHighSignal.includes(entity.slug.replace(/-/g, " "));

    // If mentioned in title or summary -> definitely matched
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

    // If mentioned only in deep body text, ensure category matches or entity is a team/driver
    if (entity.category && articleCategory && entity.category !== articleCategory) {
      continue; // Don't tag IndyCar on a NASCAR story just because of a footer link
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

async function reclassifyAllArticles() {
  console.log("🏁 Auditing & Cleaning all motorsport articles (Taxonomy & Entities)...");
  const snap = await getDocs(collection(db, "news_articles"));
  let updatedCount = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const currentCategory = data.category;
    const title = data.title || "";
    const summary = data.summary || "";
    const content = data.content || "";

    const correctCategory = classifyMotorsportArticle(title, `${summary} ${content}`, currentCategory);
    const cleanedEntities = detectAccurateEntities(title, summary, content, correctCategory);

    const needsCategoryUpdate = correctCategory !== currentCategory;
    const currentEntitiesCount = data.entities?.length || 0;
    const newEntitiesCount = cleanedEntities.length;
    const needsEntitiesUpdate = JSON.stringify(data.entities || []) !== JSON.stringify(cleanedEntities);

    if (needsCategoryUpdate || needsEntitiesUpdate) {
      console.log(` 🔄 [${currentCategory} ➔ ${correctCategory}] (${currentEntitiesCount} ➔ ${newEntitiesCount} entities): "${title.slice(0, 45)}..."`);
      await updateDoc(doc(db, "news_articles", d.id), {
        category: correctCategory,
        entities: cleanedEntities,
      });
      updatedCount++;
    }
  }

  console.log(`\n🎉 Audit Complete! Cleaned and updated ${updatedCount} articles in Firestore.`);
  process.exit(0);
}

reclassifyAllArticles();
