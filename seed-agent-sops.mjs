// ── Gridpass Seed Subagent Execution Tickets & SOP Manuals ────────────

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read .env.development.local
const envPath = path.join(process.cwd(), '.env.development.local');
const envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
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
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'srcommander-82056',
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedSOPsAndTickets() {
  console.log('==================================================');
  console.log('📚 SEEDING AGENT EXECUTION TICKETS & SOP MANUALS');
  console.log('==================================================\n');

  // 1. Ticket 1: Super Admin Vehicle Support Drawer & Staging Classes
  const t1 = {
    id: 'tick_001_vehicle_support',
    ticket_number: 'TICK-1001',
    agent_role: 'architect',
    title: 'Super Admin Vehicle Management HQ & Support Drawer',
    category: 'architecture',
    status: 'VERIFIED',
    components_used: ['AdminVehicleSupportDrawer.tsx', 'ExcelWorksheetTable.tsx', 'vehicles'],
    files_modified: ['src/app/admin/vehicles/page.tsx', 'src/components/admin/AdminVehicleSupportDrawer.tsx', 'src/lib/types/admin.ts'],
    schema_changes: ['vehicles.tag_id', 'vehicles.staging_class', 'vehicles.vin_verified', 'vehicles.is_hidden', 'vehicles.archived'],
    sop_summary: 'SOP for troubleshooting member vehicles, rebinding RFID/QR tags, transferring ownership, and soft-deleting records without data loss.',
    sop_steps: [
      'Navigate to Super Admin HQ at /admin/vehicles.',
      'Click "Support 🛠️" on any vehicle row to open the slide-out Support Drawer.',
      'Tab 1 (Specs & Owner): Edit year/make/model or re-assign owner_name and owner_id.',
      'Tab 2 (RFID/QR Tag): Enter or update tag_id (e.g. #0248) to re-bind physical emblems.',
      'Tab 3 (Staging Class): Select vehicle staging class (Track Weapon, Show Build, Marine/Craft, PEV/Electric, Fleet, Stock OEM).',
      'Tab 4 (Audit History): Check document IDs, created timestamps, and service log counts.',
      'Use sticky footer buttons to toggle "Hide Vehicle" (is_hidden: true) or "Soft Archive" (archived: true). Click "Save Spec Overrides".'
    ],
    created_at: new Date().toISOString(),
  };

  // 2. Ticket 2: Mobile-First Apple Native Touch Standards
  const t2 = {
    id: 'tick_002_mobile_touch',
    ticket_number: 'TICK-1002',
    agent_role: 'mobile_expert',
    title: 'Mobile-First Apple Native Touch Standards & Zoom Prevention',
    category: 'mobile_touch',
    status: 'VERIFIED',
    components_used: ['globals.css', 'AppShell.tsx', 'Navbar.tsx'],
    files_modified: ['src/app/globals.css', 'src/components/Navbar.tsx'],
    schema_changes: [],
    sop_summary: 'SOP for building Apple iOS native feeling components with >=44px touch targets, zero hover lock, and input zoom prevention.',
    sop_steps: [
      'Enforce min-h-[44px] and min-w-[44px] on all buttons, links, inputs, and checkboxes via .touch-target-44 or .ios-touch-target.',
      'Set form input font-size to >=16px (text-base md:text-xs) to prevent iOS WebKit layout zoom on focus.',
      'Use active:scale-95 or .ios-active-scale for tactile spring physics feedback on touch presses.',
      'Anchor key action buttons to a fixed bottom dock with pb-[calc(0.75rem+env(safe-area-inset-bottom))].',
      'Never lock editing affordances or actions behind mouse hover states.'
    ],
    created_at: new Date().toISOString(),
  };

  // 3. Ticket 3: Non-Destructive Soft-Delete & Data Archival Engine
  const t3 = {
    id: 'tick_003_soft_delete',
    ticket_number: 'TICK-1003',
    agent_role: 'site_auditor',
    title: 'Strict Soft Delete & Data Archival Invariant ("Never Delete, Only Hide")',
    category: 'database',
    status: 'VERIFIED',
    components_used: ['clean-test-db.mjs', 'firestore.rules', 'admin/db/page.tsx'],
    files_modified: ['clean-test-db.mjs', 'C:/_Projects/Gridpass-v4/AGENTS.md'],
    schema_changes: ['is_hidden: boolean', 'archived: boolean', 'archived_at: string'],
    sop_summary: 'SOP for hiding or archiving Firestore documents non-destructively without deleteDoc calls.',
    sop_steps: [
      'Never perform hard deletions (deleteDoc) on real production entities or user records.',
      'Update documents with is_hidden: true or archived: true (soft-delete).',
      'Public feeds and app viewports filter out records where is_hidden === true.',
      'Super Admin HQ (/admin/db) preserves full recovery and restoration capabilities at all times.',
      'Cleanup scripts strictly target temporary test documents tagged GPTestUser_*.'
    ],
    created_at: new Date().toISOString(),
  };

  // 4. Ticket 1014: Firestore Security Rules Audit & Admin Collections Permission Match Engine
  const t1014 = {
    id: 'tick_1014_firestore_rules_audit',
    ticket_number: 'TICK-1014',
    agent_role: 'architect',
    title: 'Firestore Security Rules Audit & Admin Collections Permission Match Engine',
    category: 'security',
    status: 'VERIFIED',
    components_used: ['firestore.rules', 'firebase.json', 'agent_tickets'],
    files_modified: ['firestore.rules'],
    schema_changes: [
      'system_logs',
      'tag_scans',
      'user_feedback',
      'agent_tickets',
      'sops',
      'agent_staff',
      'sales_leads',
      'members',
      'vehicles',
      'businesses',
      'events'
    ],
    sop_summary: 'SOP for auditing and synchronizing Firestore permission match rules for all admin and domain collections across localhost and live deployment.',
    sop_steps: [
      'Inspect all active collection calls across src/app/admin and platform API handlers.',
      'Update firestore.rules to include explicit permission match blocks for all domain collections (system_logs, tag_scans, user_feedback, agent_tickets, sops, agent_staff, sales_leads, members, vehicles, businesses, events).',
      'Organize rules logically into domain sections (Telemetry, Swarm, Feedback, Core Entities, B2B CRM, Gamification, Access Control, Second Life SaaS, Voyage AI).',
      'Verify type integrity with npx tsc --noEmit.',
      'Log ticket TICK-1014 to agent_tickets in Firestore.'
    ],
    created_at: new Date().toISOString(),
  };

  // Write Tickets to Firestore
  console.log('  🎟️ Writing Agent Execution Tickets to [agent_tickets]...');
  await setDoc(doc(db, 'agent_tickets', t1.id), t1, { merge: true });
  await setDoc(doc(db, 'agent_tickets', t2.id), t2, { merge: true });
  await setDoc(doc(db, 'agent_tickets', t3.id), t3, { merge: true });
  await setDoc(doc(db, 'agent_tickets', t1014.id), t1014, { merge: true });

  // Write SOP Guides to Firestore
  console.log('  📚 Writing SOP Manuals to [sops]...');
  await setDoc(doc(db, 'sops', 'sop_1014_firestore_rules'), {
    id: 'sop_1014_firestore_rules',
    slug: 'firestore-security-rules-sop',
    title: 'Firestore Security Rules Synchronization & Collection Audit SOP',
    category: 'Security & Database Architecture',
    author_agent: 'architect',
    description: 'SOP for ensuring all newly declared collections have explicit permission match rules in firestore.rules for localhost and live deployment.',
    prerequisites: ['Firebase Admin / Firestore Rules', 'Access to firestore.rules'],
    steps: t1014.sop_steps,
    components_referenced: t1014.components_used,
    created_at: new Date().toISOString(),
  }, { merge: true });
  await setDoc(doc(db, 'sops', 'sop_001_vehicle_support'), {
    id: 'sop_001_vehicle_support',
    slug: 'vehicle-support-sop',
    title: 'Super Admin Vehicle Troubleshooting & Tag Binding SOP',
    category: 'Architecture & Operations',
    author_agent: 'architect',
    description: 'Complete guide for Super Admins to re-assign vehicle owners, bind physical RFID/QR emblem tags, set staging classes, and soft-delete/restore assets.',
    prerequisites: ['Super Admin Role Access (PJ Losey)', 'Access to /admin/vehicles'],
    steps: t1.sop_steps,
    components_referenced: t1.components_used,
    created_at: new Date().toISOString(),
  }, { merge: true });

  await setDoc(doc(db, 'sops', 'sop_002_mobile_touch'), {
    id: 'sop_002_mobile_touch',
    slug: 'mobile-touch-sop',
    title: 'Apple Native iOS Touch & Viewport Design SOP',
    category: 'UI & Mobile Ergonomics',
    author_agent: 'mobile_expert',
    description: 'Standard operating procedure for maintaining >=44px touch hitboxes, preventing iOS input zoom, and building fixed bottom action docks.',
    prerequisites: ['Tailwind CSS v4', 'Apple iOS HIG Guidelines'],
    steps: t2.sop_steps,
    components_referenced: t2.components_used,
    created_at: new Date().toISOString(),
  }, { merge: true });

  console.log('\n==================================================');
  console.log('✅ AGENT EXECUTION TICKETS & SOPS SEEDED SUCCESSFULLY!');
  console.log('==================================================');
}

seedSOPsAndTickets().catch((err) => {
  console.error('Error seeding SOPs:', err);
});
