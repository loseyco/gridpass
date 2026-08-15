import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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

async function inspect() {
  const id = "caffeine-and-chrome-gateway-classic-cars-of-chicago";
  const snap = await getDoc(doc(db, "events", id));
  if (snap.exists()) {
    console.log("📄 Firestore Event Doc found:", snap.data());
  } else {
    console.log("❌ No Firestore document found for id:", id);
  }
  
  const scrapedSnap = await getDoc(doc(db, "scraped_events", id));
  if (scrapedSnap.exists()) {
    console.log("🔍 Scraped Event Doc in triage:", scrapedSnap.data());
  } else {
    console.log("❌ No Scraped triage document found for id:", id);
  }
}

inspect();
