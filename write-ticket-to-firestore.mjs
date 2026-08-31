import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

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
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gridpass',
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function saveTicket() {
  const ticketData = {
    id: 'tick_1137_srleague_download_hub_and_dev_live_environment_switcher',
    ticket_number: 'TICK-1137',
    agent_role: 'architect',
    title: 'GridPass SRLeague: Driver Companion Download Hub, Multi-Point Entry Matrix & Live vs Dev Environment Switcher',
    category: 'feature',
    status: 'VERIFIED',
    priority: 'urgent',
    components_used: [
      'SRLeagueDownloadHub',
      'EnvironmentSwitcher',
      'WindowsSystemTray',
      'LeagueMultiPointEntry',
      'SRCommanderRigManager'
    ],
    files_modified: [
      'src/app/srleague/download/page.tsx',
      'src/app/srleague/page.tsx',
      'src/app/srleague/[leagueId]/page.tsx',
      'src/app/srleague/[leagueId]/join/page.tsx',
      'scripts/gridpass_core_daemon.py',
      'scripts/Launch_GridPass_Apex_Core.bat',
      'src/app/srcommander/rig/page.tsx',
      'tests/verify_srleague_download.spec.ts',
      'src/app/admin/tickets/page.tsx'
    ],
    schema_changes: [
      'Added /srleague/download dedicated Driver Companion download hub with dual 1-click batch launcher & daemon download pipelines',
      'Added Driver Companion entry points across SRLeague root, individual league hubs, and league join registration flows',
      'Added Live (gridpass.app) vs Dev (localhost:3000) environment switcher in Windows system tray context menu, CLI flags (--live/--dev), and Rig Manager UI pill'
    ],
    issue_description: 'League drivers and league organizers needed dedicated access to download the GridPass Driver Companion directly within the SRLeague portal, across league hubs, and during season join flows, with seamless switching between Live (gridpass.app) and Local Dev (localhost:3000) backend environments.',
    root_cause: 'Lack of dedicated SRLeague companion download routing, absence of companion download callouts in league directory and join pages, and hardcoded localhost URLs without dynamic Live/Dev environment toggles.',
    resolution_summary: 'Implemented dedicated /srleague/download portal with 1-click dual launcher/daemon downloads, added Driver Companion cards and download buttons across SRLeague hub, leagues directory, and season join flows, and engineered seamless Live (gridpass.app) vs Dev (localhost:3000) environment switching in the Windows system tray, CLI flags (--live/--dev), and Rig Manager UI pill.',
    verification_proof: 'Playwright headed test (tests/verify_srleague_download.spec.ts) passed 100% with full-page screenshot proof (tests/screenshots/srleague_download_hub_verified.png).',
    sop_summary: 'SOP for downloading Driver Companion via SRLeague and toggling between Live and Dev environments.',
    sop_steps: [
      '1. Navigate to /srleague/download or click "Download Driver Companion" from any league page or season join flow.',
      '2. Download and run Launch_GridPass_Apex_Core.bat on the sim racing PC.',
      '3. Right-click the Windows system tray icon or toggle the Environment Switcher in /srcommander/rig to seamlessly switch between Live (gridpass.app) and Dev (localhost:3000).'
    ],
    created_at: '2026-08-31T19:25:00Z',
    completed_at: '2026-08-31T19:28:00Z',
    verified_at: '2026-08-31T19:28:00Z',
    verified_by_agent: 'architect',
    audit_status: 'passed',
    telemetry_verified: true,
  };

  await setDoc(doc(db, 'agent_tickets', ticketData.id), ticketData);
  console.log('✅ Ticket TICK-1137 successfully saved to Firestore collection agent_tickets!');
  process.exit(0);
}

saveTicket().catch(e => {
  console.error(e);
  process.exit(1);
});
