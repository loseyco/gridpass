import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

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

async function resetAllViewsToZero() {
  console.log("🧹 Resetting all fake view counts in news_articles to 0...");
  const snap = await getDocs(collection(db, "news_articles"));
  let updatedCount = 0;

  for (const d of snap.docs) {
    await updateDoc(doc(db, "news_articles", d.id), {
      views: 0,
      referrers: {},
    });
    updatedCount++;
  }

  console.log(`✅ Successfully reset ${updatedCount} articles to 0 real views!`);
  process.exit(0);
}

resetAllViewsToZero();
