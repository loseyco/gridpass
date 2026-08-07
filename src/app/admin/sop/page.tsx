'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { SOPGuide } from '@/lib/types/admin';

const DEFAULT_SOPS: SOPGuide[] = [
  {
    id: 'sop_004_production_deployment_and_intake',
    slug: 'production-deployment-and-intake-sop',
    title: 'Master Production Build, Physical QR Decal Intake & Firebase Hosting Deployment SOP',
    category: 'Deployment & Operations',
    author_agent: 'firebase_expert',
    description: 'Master standard operating procedure for configuring Firebase hosting targets (gridpass), building production bundles (npm run build), verifying server-side OpenGraph metadata, and deploying live to https://gridpass.app.',
    prerequisites: ['Super Admin Role Access', 'Firebase CLI', 'Google AI Ultra Workspace'],
    steps: [
      'Step 1 (Localhost First): Build and test all UI and Firestore flow additions locally on localhost (http://localhost:3000).',
      'Step 2 (Execution Tickets & Audit): Document every task in /admin/tickets with root cause, resolution summary, files modified, and sop_steps.',
      'Step 3 (System Changelog): Append release version log (e.g. v4.6.0) to platformSeedData.ts and verify in /admin/changelog.',
      'Step 4 (Target Configuration): Verify .firebaserc specifies "default": "gridpass" and firebase.json specifies "hosting": { "site": "gridpass" }.',
      'Step 5 (OpenGraph Scraping): Verify generateMetadata in /join/page.tsx outputs absolute image URLs (https://gridpass.app/api/og...) and 1200x630 dimensions for Facebook Debugger & iMessage previews.',
      'Step 6 (Git Remote Push): Run conventional commits and push tracking branches to GitHub remote (git push origin main).',
      'Step 7 (Firebase Deployment): Execute npm run build && npx firebase deploy --only hosting --project gridpass to publish live to https://gridpass.app.'
    ],
    components_referenced: ['JoinPage', 'JoinClient', 'firebase.json', '.firebaserc', 'AdminTicketsPage', 'AdminChangelogPage'],
    created_at: new Date().toISOString().split('T')[0],
  },
  {
    id: 'sop_003_tickets_sop_arch',
    slug: 'tickets-sop-separation-sop',
    title: 'Subagent Execution Ticket HQ & Master SOP Manuals Separation Standard',
    category: 'Platform Architecture',
    author_agent: 'architect',
    description: 'Architecture blueprint for separating live subagent execution task tickets (/admin/tickets) from master platform architecture specs and AI operating manuals (/admin/sop).',
    prerequisites: ['Super Admin Role Access', 'Gridpass Admin Layout'],
    steps: [
      'Maintain dedicated ticket management hub at /admin/tickets with dual worksheets for active TODO tasks and completed execution logs.',
      'Reserve /admin/sop strictly for platform architecture specs, AI operating standards, and production SOP guidebooks.',
      'Register both tools under Global System Tools in /admin/layout.tsx.'
    ],
    components_referenced: ['AdminTicketsPage', 'AdminSOPKnowledgeBasePage', 'AdminLayout'],
    created_at: new Date().toISOString().split('T')[0],
  },
  {
    id: 'sop_001_vehicle_support',
    slug: 'vehicle-support-sop',
    title: 'Super Admin Vehicle Troubleshooting & Tag Binding SOP',
    category: 'Vehicle Operations',
    author_agent: 'architect',
    description: 'Complete guide for Super Admins to re-assign vehicle owners, bind physical RFID/QR emblem tags, set staging classes, and soft-delete/restore assets.',
    prerequisites: ['Super Admin Role Access (PJ Losey)', 'Access to /admin/vehicles'],
    steps: [
      'Navigate to Super Admin HQ at /admin/vehicles.',
      'Click "Support 🛠️" on any vehicle row to open the slide-out Support Drawer.',
      'Tab 1 (Specs & Owner): Edit year/make/model or re-assign owner_name and owner_id.',
      'Tab 2 (RFID/QR Tag): Enter or update tag_id (e.g. #0248) to re-bind physical emblems.',
      'Tab 3 (Staging Class): Select vehicle staging class (Track Weapon, Show Build, Marine/Craft, PEV/Electric, Fleet, Stock OEM).',
      'Tab 4 (Audit History): Check document IDs, created timestamps, and service log counts.',
      'Use sticky footer buttons to toggle "Hide Vehicle" (is_hidden: true) or "Soft Archive" (archived: true). Click "Save Spec Overrides".'
    ],
    components_referenced: ['AdminVehicleSupportDrawer', 'ExcelWorksheetTable', 'vehicles'],
    created_at: new Date().toISOString().split('T')[0],
  },
  {
    id: 'sop_002_mobile_touch',
    slug: 'mobile-touch-sop',
    title: 'Apple Native iOS Touch & Viewport Design SOP',
    category: 'UI & Ergonomics',
    author_agent: 'mobile_expert',
    description: 'Standard operating procedure for maintaining >=44px touch hitboxes, preventing iOS input zoom, and building fixed bottom action docks.',
    prerequisites: ['Tailwind CSS v4', 'Apple iOS HIG Guidelines'],
    steps: [
      'Enforce min-h-[44px] and min-w-[44px] on all buttons, links, inputs, and checkboxes via .touch-target-44.',
      'Set form input font-size to >=16px (text-base md:text-xs) to prevent iOS WebKit layout zoom on focus.',
      'Use active:scale-95 or .ios-active-scale for tactile spring physics feedback on touch presses.',
      'Anchor key action buttons to a fixed bottom dock with pb-[calc(0.75rem+env(safe-area-inset-bottom))].',
      'Never lock editing affordances or actions behind mouse hover states.'
    ],
    components_referenced: ['globals.css', 'AppShell.tsx', 'Navbar.tsx'],
    created_at: new Date().toISOString().split('T')[0],
  },
];

export default function AdminSOPKnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'ai_standards' | 'sop_guides'>('architecture');
  const [sops, setSops] = useState<SOPGuide[]>(DEFAULT_SOPS);
  const [selectedSOP, setSelectedSOP] = useState<SOPGuide | null>(null);

  useEffect(() => {
    const unsubSOPs = onSnapshot(
      collection(db, 'sops'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SOPGuide[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as SOPGuide));
          setSops(list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')));
        }
      },
      (err) => console.warn('SOPs listener fallback:', err)
    );
    return () => unsubSOPs();
  }, []);

  return (
    <div className="w-full max-w-full 2xl:max-w-[1800px] 4k:max-w-[3400px] mx-auto space-y-6 font-sans pb-24 sm:pb-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff3b30] shrink-0" />
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase text-[#1c1c1e] tracking-tight">
              📚 Master Platform Architecture & AI Operating HQ
            </h1>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Authoritative platform specifications, multi-agent operating invariants, domain vertical definitions, and step-by-step SOP guidebooks.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200">
          {[
            { id: 'architecture', label: '📐 Platform Architecture' },
            { id: 'ai_standards', label: '🤖 AI Agent Operating Standards' },
            { id: 'sop_guides', label: '📖 Step-by-Step SOP Guides' },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition active:scale-95 ${
                activeTab === tb.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: GRIDPASS PLATFORM ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-8">
          {/* Multi-Vertical Engine Matrix */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🚀</span>
              <h2 className="text-sm font-black uppercase text-neutral-900 tracking-tight">
                1. Multi-Vertical Engine Architecture (8 Core Domains)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: '🏎️ Vehicles & Garages', spec: 'Staging classes (Track, Show, Fleet, Craft, PEV), RFID/QR tag binding (#0001-#9999), service logs, VIN verification.' },
                { title: '📷 Photos & Media', spec: 'Dynamic OpenGraph social image cards, vehicle media manifests, lossy compressed WebP delivery, zero layout shift.' },
                { title: '🏁 Events & Gates', spec: 'Digital gate badges, waiver status tracking, vehicle staging manifests, spectator pass check-in, real-time scan velocity.' },
                { title: '🏢 Vendors & Gridpass B2B', spec: 'Business profiles, multi-tier SaaS package pricing, quote pipeline, CRM lead conversion engine, account executive routing.' },
                { title: '🏟️ Venues & Facilities', spec: 'Track layout specs, pit shuttle manifests, facility access controls, event scheduling, spectator entry gates.' },
                { title: '⛵ Marine & Watercraft', spec: 'Custom marine staging classification, dock pass registration, trailered craft inspection tags, hull ID tracking.' },
                { title: '🚚 Trade Fleets', spec: 'Business fleet management, upfitter build staging, multi-vehicle batch assignment, service history sync.' },
                { title: '⚡ PEVs & Micromobility', spec: 'Lightweight electric mobility staging class, charging bay passes, durable micro QR emblem tags.' },
              ].map((vert, idx) => (
                <div key={idx} className="bg-white p-4 border border-neutral-200 rounded-xl space-y-2 shadow-2xs hover:border-neutral-400 transition">
                  <h3 className="font-black text-xs uppercase text-[#1c1c1e]">{vert.title}</h3>
                  <p className="text-[11px] text-neutral-600 leading-relaxed font-medium">{vert.spec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Database Architecture & Firestore Schemas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🗄️</span>
              <h2 className="text-sm font-black uppercase text-neutral-900 tracking-tight">
                2. Firestore Database Schemas & Security Match Rules
              </h2>
            </div>

            <div className="bg-white p-5 border border-neutral-200 rounded-xl space-y-4 shadow-2xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                  <span className="font-bold text-neutral-900 block font-mono">collection('members')</span>
                  <p className="text-[11px] text-neutral-600">User accounts, display_name, is_gold, role ('member' | 'admin'), sales permissions.</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                  <span className="font-bold text-neutral-900 block font-mono">collection('vehicles')</span>
                  <p className="text-[11px] text-neutral-600">Year/make/model, tag_id, staging_class, vin_verified, soft-delete flags (is_hidden, archived).</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                  <span className="font-bold text-neutral-900 block font-mono">collection('agent_tickets')</span>
                  <p className="text-[11px] text-neutral-600">Subagent execution tickets, agent_role, status (TODO | VERIFIED), files_modified, audit logs.</p>
                </div>
              </div>
              <div className="p-3 bg-neutral-900 text-white rounded-lg font-mono text-[11px]">
                <p className="text-emerald-400 font-bold mb-1">// RBAC Match Rule Invariant (firestore.rules)</p>
                <p>match /agent_tickets/{'{ticketId}'} {'{'} allow read: if request.auth != null; allow write: if request.auth.token.admin == true; {'}'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI AGENT OPERATING STANDARDS */}
      {activeTab === 'ai_standards' && (
        <div className="space-y-8">
          {/* Core Invariants */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <h2 className="text-sm font-black uppercase text-neutral-900 tracking-tight">
                1. Mandatory System Architecture Invariants
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: '1. GM Pure Delegation & Execution Ticket Invariant', desc: 'GM orchestrates and delegates to subagents, writing 0 direct code without task dispatching and logging an official Execution Ticket (TICK-...) to Firestore agent_tickets.' },
                { title: '2. Zero Fake Data & Zero Mock Fallbacks Invariant', desc: 'Absolute ban on pre-populating views with hardcoded fake seed data or writing conditional fallback index hacks (idx < 5 ? activeVersion : 0). All metrics evaluate from verified live records.' },
                { title: '3. Strict Soft Delete & Data Archival Invariant', desc: 'Gridpass NEVER performs hard deletions (deleteDoc) on real entities. Documents are tagged with is_hidden: true or archived: true to hide from feeds while preserving full recovery.' },
                { title: '4. Apple Native Mobile Touch & Zoom Prevention', desc: 'All interactive elements enforce min-h-[44px] min-w-[44px], input font-size >= 16px to prevent iOS WebKit layout zoom, and active:scale-95 spring physics.' },
              ].map((inv, idx) => (
                <div key={idx} className="bg-white p-4 border border-neutral-200 rounded-xl space-y-2 shadow-2xs">
                  <h3 className="font-black text-xs uppercase text-[#ff3b30]">{inv.title}</h3>
                  <p className="text-xs text-neutral-700 leading-relaxed font-medium">{inv.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subagent Team Roster */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">👥</span>
              <h2 className="text-sm font-black uppercase text-neutral-900 tracking-tight">
                2. Subagent Roster & Operational Domain Matrix
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { role: '🫡 gm', title: 'General Manager', task: 'Task orchestration, delegation, token-lean execution guardrails.' },
                { role: '📐 architect', title: 'Feature Architect', task: 'Firestore schemas, TypeScript contracts, RBAC permission rules, multi-vertical specs.' },
                { role: '🎨 site_auditor', title: 'UI/UX Auditor', task: 'Design system uniformity (#ff3b30 red/black/white), zero fluff, clean viewports.' },
                { role: '📱 mobile_expert', title: 'Apple Mobile Expert', task: '>=44px touch targets, iOS zoom prevention, bottom dock action bars.' },
                { role: '💵 financial_expert', title: 'Financial & B2B Expert', task: 'SaaS package matrices, MRR/ARR, sales quote pipeline, deal stages.' },
                { role: '🧪 tester', title: 'Playwright Tester', task: 'E2E browser tests, persistent auth sessions, headed visual verification.' },
              ].map((agent, idx) => (
                <div key={idx} className="bg-white p-4 border border-neutral-200 rounded-xl space-y-2 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-neutral-900 text-white">
                    {agent.role}
                  </span>
                  <h3 className="font-black text-xs uppercase text-[#1c1c1e]">{agent.title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{agent.task}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STEP-BY-STEP SOP GUIDES */}
      {activeTab === 'sop_guides' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {sops.map((sop) => (
            <div
              key={sop.id}
              onClick={() => setSelectedSOP(sop)}
              className="bg-white p-5 border border-neutral-200 hover:border-neutral-400 rounded-xl shadow-xs space-y-3 cursor-pointer transition active:scale-98"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                  {sop.category}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                  {sop.author_agent}
                </span>
              </div>

              <h3 className="font-black text-sm uppercase text-[#1c1c1e] line-clamp-2">{sop.title}</h3>
              <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">{sop.description}</p>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span>{sop.steps?.length || 0} Steps</span>
                <span className="font-bold text-[#ff3b30] uppercase">Read Guide ↗</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-Out SOP Reader Drawer */}
      {selectedSOP && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col justify-between shadow-2xl border-l border-neutral-200 animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">{selectedSOP.category}</span>
                <h2 className="font-black text-lg uppercase text-[#1c1c1e]">{selectedSOP.title}</h2>
              </div>
              <button
                onClick={() => setSelectedSOP(null)}
                className="touch-target-44 rounded-lg text-neutral-400 hover:text-neutral-900 font-bold active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <h3 className="text-xs font-black uppercase text-neutral-900">Guide Description</h3>
                <p className="text-xs text-neutral-700 leading-relaxed">{selectedSOP.description}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-neutral-900">Standard Operating Procedure</h3>
                <ol className="space-y-2 pl-4 list-decimal text-xs text-neutral-800 font-medium">
                  {(selectedSOP.steps || []).map((step, idx) => (
                    <li key={idx} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end">
              <button
                onClick={() => setSelectedSOP(null)}
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs uppercase rounded-xl"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
