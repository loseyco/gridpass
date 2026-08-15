import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase
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

async function inspectNews() {
  console.log("🔍 Checking seeded feeds in Firestore...");
  const feedsSnap = await getDocs(collection(db, "news_feeds"));
  console.log(`Found ${feedsSnap.size} active news feeds in Firestore!`);
  feedsSnap.forEach(doc => {
    const d = doc.data();
    console.log(` - [${d.category}] ${d.name} (${d.url})`);
  });

  process.exit(0);
}

inspectNews();
