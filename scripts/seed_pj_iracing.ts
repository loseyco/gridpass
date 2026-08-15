import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
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

async function setIRacingId() {
  const uid = "YOYN2HDCwqXc3OYsHd8mdJIwr9K2";
  const userRef = doc(db, "users", uid);

  // Set the real iRacing Customer ID and structured iRacing stats block
  await updateDoc(userRef, {
    iracing_cust_id: "21596",
    iracing_stats: {
      cust_id: 21596,
      display_name: "Patrick Losey",
      club_name: "Midwest Club",
      member_since: "2008",
      last_synced_at: new Date().toISOString(),
      sync_status: "SYNCED",
      ratings: {
        sports_car: {
          irating: 2150,
          safety_rating: 3.85,
          license_class: "Class A",
          color: "#0070f3"
        },
        formula_car: {
          irating: 2020,
          safety_rating: 3.60,
          license_class: "Class B",
          color: "#00b4d8"
        },
        oval: {
          irating: 1980,
          safety_rating: 3.40,
          license_class: "Class B",
          color: "#ff9900"
        },
        dirt_oval: {
          irating: 1750,
          safety_rating: 3.15,
          license_class: "Class C",
          color: "#8B4513"
        },
        dirt_road: {
          irating: 1680,
          safety_rating: 3.20,
          license_class: "Class C",
          color: "#2e7d32"
        }
      },
      career: {
        starts: 142,
        wins: 18,
        top5: 64,
        poles: 12,
        laps: 3240,
        laps_led: 410,
        win_percentage: 12.7,
        top5_percentage: 45.1,
        avg_start_position: 6.4,
        avg_finish_position: 4.8
      }
    },
    updated_at: new Date().toISOString()
  });

  console.log("✅ Successfully saved iRacing Customer ID 21596 and stats to PJ Losey Firestore profile!");
  process.exit(0);
}

setIRacingId();
