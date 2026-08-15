import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
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

async function setPjUsername() {
  const uid = "YOYN2HDCwqXc3OYsHd8mdJIwr9K2";
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    console.log("Current user doc:", snap.data());
    await updateDoc(userRef, {
      username: "pjlosey",
      display_name: "PJ LOSEY",
      is_supporter: true,
      role: "SUPER ADMIN & FOUNDER",
      location: "Monmouth Beach, NJ",
      home_town: "Monmouth Beach, NJ",
      website: "https://losey.co",
      website_url: "https://losey.co",
      bio: "Clinical Precision. Motorsport Velocity. Proprietary systems architecture, telemetry extraction, IoT hardware, and custom enterprise SaaS.",
      cover_url: "/images/profile/pjlosey_cover.jpg",
      avatar_url: "/images/profile/pjlosey_avatar.jpg",
      current_status: "🟢 In the Paddock Engineering Gridpass v4",
      updated_at: new Date().toISOString()
    });
    console.log("✅ Successfully updated PJ Losey profile document with username 'pjlosey'!");
  } else {
    console.log("❌ User document not found for UID:", uid);
  }
  process.exit(0);
}

setPjUsername();
