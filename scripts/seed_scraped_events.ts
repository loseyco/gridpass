import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Read env variables
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
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAb6W337-6Gew_KWdgPAIAKaNLwIk7F6pI",
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gridpass.firebaseapp.com",
  databaseURL: envVars.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://gridpass-default-rtdb.firebaseio.com",
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gridpass",
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gridpass.firebasestorage.app",
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "195906971027",
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID || "1:195906971027:web:e3a99f60233b08018b3466",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedScrapedEvents() {
  const list = [
    {
      id: "downers-grove-car-show-2026",
      title: "Downers Grove Summer Nights Car Show",
      location_name: "Downtown Downers Grove, IL",
      date_str: "2026-08-21",
      target_url: "https://www.facebook.com/downtowndownersgrove/",
      status: "pending",
      created_at: new Date().toISOString()
    },
    {
      id: "berwyn-route-66-car-show-2026",
      title: "Berwyn Route 66 Car Show",
      location_name: "Berwyn Village Center, Berwyn, IL",
      date_str: "2026-08-29",
      target_url: "https://www.facebook.com/events/1624614435261555",
      status: "pending",
      created_at: new Date().toISOString()
    },
    {
      id: "elgin-road-race-car-show-2026",
      title: "Elgin Road Race Car Show",
      location_name: "Historic Elgin Circuit, Elgin, IL",
      date_str: "2026-08-30",
      target_url: "https://www.facebook.com/FoxValleyModelTClub/",
      status: "pending",
      created_at: new Date().toISOString()
    }
  ];

  for (const item of list) {
    await setDoc(doc(db, "scraped_events", item.id), item, { merge: true });
    console.log("Seeded scraped event:", item.title);
  }

  console.log("SUCCESS: Initial triage queue populated!");
  process.exit(0);
}

seedScrapedEvents().catch(err => {
  console.error("Error seeding scraped events:", err);
  process.exit(1);
});
