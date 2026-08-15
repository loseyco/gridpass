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

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const TICKET_ID = "tick_1084_promoter_outreach_magic_claims_dynamic_coordinates";

const ticketData = {
  id: TICKET_ID,
  ticket_number: 'TICK-1084',
  agent_role: 'gm',
  title: 'Promoter Outreach Template Optimization, Magic Claim Links & Dynamic Map Coordinate Integration',
  category: 'feature',
  status: 'VERIFIED',
  priority: 'high',
  components_used: ['AdminEventsPage', 'EventDetailsPage', 'ClaimEventPage', 'EventScraper'],
  files_modified: [
    'src/app/admin/events/page.tsx',
    'src/app/events/[id]/page.tsx',
    'src/app/events/[id]/claim/page.tsx',
    'src/lib/types/events.ts',
    'scripts/scrape_real_car_shows.ts',
    'scripts/migrate_scraped_details.ts',
    'src/app/admin/tickets/page.tsx'
  ],
  schema_changes: [
    'Added claim_token (uppercase string) and official_event_url (string) to GridpassEvent typescript interfaces and Firestore documents',
    'Synced Crete IL venue town coordinates (41.4445, -87.6253) and flyer banner covers into live events',
  ],
  issue_description: 'Establish automated outreach pipeline targeting scraped car shows. Resolve empty details map coordinates on landing page. Enable promoter magic onboarding claim links.',
  root_cause: 'Approved events were created before deep scraper inspection was implemented, causing missing descriptions, default Monmouth IL coordinates, and missing promoter back-links. No magic link existed for organizers to claim their pre-built event page.',
  resolution_summary: 'Upgraded car show scraper to deep inspect flyer cover, town coordinates, and description blocks. Implemented migrate_scraped_details.ts to sync crawled info and generate unique security claim_token codes. Created secure claim route at /events/[id]/claim validating token credentials. Integrated "Official Page" backlinks and custom "Claim Link" copy buttons. Fixed home page & directory list filters to hide past completed/cancelled meets.',
  verification_proof: 'Ran scrape & migration scripts with 0 errors. Verified dynamic Crete IL coordinates render Leaflet pins and geofence borders correctly. Compiled type checker npx tsc --noEmit successfully with exit code 0.',
  sop_summary: 'SOP blueprint for scraping events, promoting to live Gridpass hubs, and issuing magic claim links to organizers.',
  sop_steps: [
    'Run npx tsx scripts/scrape_real_car_shows.ts to crawl car show radars.',
    'Approve triage events in /admin/events to promote them to production.',
    'Copy the Magic Claim Link from admin active list to invite promoter.',
    'Verify completed/cancelled events are automatically hidden from front-end directories.',
    'Verify touch target heights (>= 44px) and red/charcoal style guidelines.'
  ],
  created_at: '2026-08-14',
  verified_by_agent: 'gm',
  audit_status: 'passed',
  telemetry_verified: true,
};

async function seedTicket() {
  try {
    console.log(`Writing ticket ${TICKET_ID} to Firestore...`);
    await setDoc(doc(db, "agent_tickets", TICKET_ID), ticketData, { merge: true });
    console.log("SUCCESS: Ticket seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed ticket:", err);
    process.exit(1);
  }
}

seedTicket();
