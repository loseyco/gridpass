import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from development/local env files
const envFiles = [".env.development.local", ".env.local", ".env"];
const envVars: Record<string, string> = {};

for (const file of envFiles) {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const idx = trimmed.indexOf("=");
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!envVars[key]) {
          envVars[key] = value;
        }
      }
    });
  }
}

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gridpass",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanFakeIRacingStats() {
  const uid = "YOYN2HDCwqXc3OYsHd8mdJIwr9K2";
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    console.error(`❌ User document not found for UID: ${uid}`);
    process.exit(1);
  }

  console.log("Current user doc state:", {
    uid,
    iracing_cust_id: snap.data().iracing_cust_id,
    has_iracing_stats: !!snap.data().iracing_stats,
  });

  // Preserve real iRacing Customer ID "21596", set iracing_stats to null
  await updateDoc(userRef, {
    iracing_cust_id: "21596",
    iracing_stats: null,
    updated_at: new Date().toISOString(),
  });

  console.log("✅ Successfully cleared fake iRacing stats from PJ's user document while preserving iracing_cust_id: '21596'!");
  process.exit(0);
}

cleanFakeIRacingStats().catch((err) => {
  console.error("❌ Error clearing fake iRacing stats:", err);
  process.exit(1);
});
