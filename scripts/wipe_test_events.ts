import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, deleteDoc, collection, getDocs } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env.development.local");
const envVars: any = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
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

async function wipe() {
  console.log("🧹 STARTING CLEAN DATABASE RESET FOR TEST GTM RUN...");

  // 1. Wipe events collection except 'maple-city-cruise'
  const eventsSnap = await getDocs(collection(db, "events"));
  let deletedEvents = 0;
  for (const docSnap of eventsSnap.docs) {
    if (docSnap.id !== "maple-city-cruise") {
      await deleteDoc(doc(db, "events", docSnap.id));
      console.log(`🗑️ Deleted production event: ${docSnap.id}`);
      deletedEvents++;
    }
  }

  // 2. Wipe scraped_events triage collection completely
  const scrapedSnap = await getDocs(collection(db, "scraped_events"));
  let deletedScraped = 0;
  for (const docSnap of scrapedSnap.docs) {
    await deleteDoc(doc(db, "scraped_events", docSnap.id));
    console.log(`🗑️ Deleted triage scraped event: ${docSnap.id}`);
    deletedScraped++;
  }

  console.log(`🏁 RESET COMPLETE! Deleted ${deletedEvents} live events & ${deletedScraped} triage events.`);
  process.exit(0);
}

wipe();
