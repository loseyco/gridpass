import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAb6W337-6Gew_KWdgPAIAKaNLwIk7F6pI",
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gridpass.firebaseapp.com",
  databaseURL: envVars.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://gridpass-default-rtdb.firebaseio.com",
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gridpass",
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gridpass.firebasestorage.app",
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "195906971027",
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID || "1:195906971027:web:e3a99f60233b08018b3466",
};

console.log("Config: ", firebaseConfig.projectId, firebaseConfig.apiKey ? "PRESENT" : "MISSING");

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testWrite() {
  try {
    await setDoc(doc(db, "vehicles", "test-write-id"), { test: true }, { merge: true });
    console.log("SUCCESS: Wrote to vehicles collection!");
  } catch (err) {
    console.error("Failed vehicles write:", err);
  }

  try {
    await setDoc(doc(db, "scraped_events", "test-write-id"), { test: true }, { merge: true });
    console.log("SUCCESS: Wrote to scraped_events collection!");
  } catch (err) {
    console.error("Failed scraped_events write:", err);
  }
  process.exit(0);
}

testWrite();
