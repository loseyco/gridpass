import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
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

async function migrate() {
  console.log("🔄 RUNNING SCALED METADATA MIGRATION FOR EVENTS...");
  
  const scrapedSnap = await getDocs(collection(db, "scraped_events"));
  let updatedCount = 0;
  
  for (const docSnap of scrapedSnap.docs) {
    const scrapedData = docSnap.data();
    const eventId = docSnap.id;
    
    // Check if event already exists in production events list
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (eventSnap.exists()) {
      const currentEventData = eventSnap.data();
      const updatedEvent = {
        ...currentEventData,
        location_name: scrapedData.location_name || currentEventData.location_name,
        physical_address: scrapedData.physical_address || scrapedData.location_name || currentEventData.physical_address || currentEventData.location_name,
        description: scrapedData.description || currentEventData.description || "",
        banner_url: scrapedData.banner_url || currentEventData.banner_url || "",
        cover_url: scrapedData.banner_url || currentEventData.banner_url || "",
        latitude: scrapedData.latitude || currentEventData.latitude || 40.91148,
        longitude: scrapedData.longitude || currentEventData.longitude || -90.64764,
        official_event_url: scrapedData.target_url || currentEventData.official_event_url || "",
        claim_token: currentEventData.claim_token || Math.random().toString(36).substring(2, 10).toUpperCase(),
        start_date: scrapedData.start_date || currentEventData.start_date || `${scrapedData.date_str}T09:00`,
        end_date: scrapedData.end_date || currentEventData.end_date || `${scrapedData.date_str}T12:00`,
      };
      
      await setDoc(eventRef, updatedEvent, { merge: true });
      // Mark triage as approved too
      await setDoc(docSnap.ref, { status: "approved" }, { merge: true });
      
      console.log(`✅ Migrated rich metadata to live event "${currentEventData.title}":`);
      console.log(`   - Address: ${updatedEvent.physical_address}`);
      console.log(`   - Banner: ${updatedEvent.banner_url}`);
      console.log(`   - Coords: ${updatedEvent.latitude}, ${updatedEvent.longitude}`);
      updatedCount++;
    }
  }
  
  console.log(`🏁 MIGRATION DONE. Updated ${updatedCount} live events with crawled content.`);
  process.exit(0);
}

migrate();
