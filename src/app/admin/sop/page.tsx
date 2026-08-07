'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { AgentTicket, SOPGuide } from '@/lib/types/admin';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';

// Default Subagent Execution Tickets & SOP Manuals
const DEFAULT_AGENT_TICKETS: AgentTicket[] = [
  {
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
    created_at: new Date().toISOString().split('T')[0],
  },
  {
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
    created_at: new Date().toISOString().split('T')[0],
  },
  {
    id: 'tick_003_soft_delete',
    ticket_number: 'TICK-1003',
    agent_role: 'site_auditor',
    title: 'Strict Soft Delete & Data Archival Invariant ("Never Delete, Only Hide")',
    category: 'database',
    status: 'VERIFIED',
    components_used: ['clean-test-db.mjs', 'firestore.rules', 'admin/db/page.tsx'],
    files_modified: ['clean-test-db.mjs', 'AGENTS.md'],
    schema_changes: ['is_hidden: boolean', 'archived: boolean', 'archived_at: string'],
    sop_summary: 'SOP for hiding or archiving Firestore documents non-destructively without deleteDoc calls.',
    sop_steps: [
      'Never perform hard deletions (deleteDoc) on real production entities or user records.',
      'Update documents with is_hidden: true or archived: true (soft-delete).',
      'Public feeds and app viewports filter out records where is_hidden === true.',
      'Super Admin HQ (/admin/db) preserves full recovery and restoration capabilities at all times.',
      'Cleanup scripts strictly target temporary test documents tagged GPTestUser_*.'
    ],
    created_at: new Date().toISOString().split('T')[0],
  },
  {
    id: 'tick_1004_mobile_admin_nav',
    ticket_number: 'TICK-1004',
    agent_role: 'site_auditor',
    title: 'Collapsible Mobile Admin Hamburger Navigation Bar',
    category: 'mobile_touch',
    status: 'VERIFIED',
    components_used: ['AdminLayout', 'Navbar'],
    files_modified: ['src/app/admin/layout.tsx'],
    schema_changes: [],
    sop_summary: 'Added isMobileMenuOpen toggle to reduce mobile vertical header height from 70% to <52px.',
    sop_steps: [
      'Navigate to Super Admin UI on mobile or small viewports (<768px).',
      'Toggle hamburger menu state using isMobileMenuOpen state hook.',
      'Verify header height remains under 52px when collapsed, preventing viewport clipping.',
      'Ensure touch targets for hamburger toggle meet Apple iOS HIG >=44px standards.'
    ],
    created_at: new Date().toISOString().split('T')[0],
  },
  {
    id: 'tick_1005_sticky_actions',
    ticket_number: 'TICK-1005',
    agent_role: 'site_auditor',
    title: 'Sticky Right Actions Column in ExcelWorksheetTable',
    category: 'ui_design',
    status: 'VERIFIED',
    components_used: ['ExcelWorksheetTable'],
    files_modified: ['packages/ui/src/ExcelWorksheetTable.tsx'],
    schema_changes: [],
    sop_summary: 'Made ACTIONS column sticky right-0 so action buttons are 100% visible on all viewports without being cut off.',
    sop_steps: [
      'Open ExcelWorksheetTable in wide data tables with horizontal scroll.',
      'Verify the rightmost ACTIONS column is styled with sticky right-0 z-10 bg-white.',
      'Confirm action buttons (Edit, Delete, Support, Toggle) remain visible without horizontal scrolling.'
    ],
    created_at: new Date().toISOString().split('T')[0],
  },
];

const DEFAULT_SOPS: SOPGuide[] = [
  {
    id: 'sop_001_vehicle_support',
    slug: 'vehicle-support-sop',
    title: 'Super Admin Vehicle Troubleshooting & Tag Binding SOP',
    category: 'Architecture & Operations',
    author_agent: 'architect',
    description: 'Complete guide for Super Admins to re-assign vehicle owners, bind physical RFID/QR emblem tags, set staging classes, and soft-delete/restore assets.',
    prerequisites: ['Super Admin Role Access (PJ Losey)', 'Access to /admin/vehicles'],
    steps: DEFAULT_AGENT_TICKETS[0].sop_steps,
    components_referenced: DEFAULT_AGENT_TICKETS[0].components_used,
    created_at: new Date().toISOString().split('T')[0],
  },
  {
    id: 'sop_002_mobile_touch',
    slug: 'mobile-touch-sop',
    title: 'Apple Native iOS Touch & Viewport Design SOP',
    category: 'UI & Mobile Ergonomics',
    author_agent: 'mobile_expert',
    description: 'Standard operating procedure for maintaining >=44px touch hitboxes, preventing iOS input zoom, and building fixed bottom action docks.',
    prerequisites: ['Tailwind CSS v4', 'Apple iOS HIG Guidelines'],
    steps: DEFAULT_AGENT_TICKETS[1].sop_steps,
    components_referenced: DEFAULT_AGENT_TICKETS[1].components_used,
    created_at: new Date().toISOString().split('T')[0],
  },
];

export default function AdminSOPKnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'sops' | 'telemetry'>('tickets');
  const [tickets, setTickets] = useState<AgentTicket[]>(DEFAULT_AGENT_TICKETS);
  const [sops, setSops] = useState<SOPGuide[]>(DEFAULT_SOPS);
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected Reader Drawer State
  const [selectedTicket, setSelectedTicket] = useState<AgentTicket | null>(null);
  const [selectedSOP, setSelectedSOP] = useState<SOPGuide | null>(null);

  // Search Filter State
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    // 1. Subscribe to Agent Execution Tickets
    const unsubTickets = onSnapshot(
      collection(db, 'agent_tickets'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AgentTicket[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as AgentTicket));
          setTickets(list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')));
        }
      },
      (err) => console.warn('Agent tickets listener fallback:', err)
    );

    // 2. Subscribe to SOP Knowledge Base Guides
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

    // 3. Subscribe to System Telemetry Logs
    const unsubTelemetry = onSnapshot(
      collection(db, 'system_logs'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setTelemetryLogs(list.slice(0, 50));
      },
      (err) => console.warn('Telemetry logs listener fallback:', err)
    );

    return () => {
      unsubTickets();
      unsubSOPs();
      unsubTelemetry();
    };
  }, []);

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (roleFilter !== 'all' && t.agent_role !== roleFilter) return false;
    return true;
  });

  const getAgentRoleBadge = (role: string) => {
    switch (role) {
      case 'architect':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">📐 Architect</span>;
      case 'mobile_expert':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300">📱 Mobile Touch</span>;
      case 'git_expert':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-white">🐙 Git & GitHub</span>;
      case 'site_auditor':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-pink-100 text-pink-800 border border-pink-300">🎨 UI Auditor</span>;
      case 'financial_expert':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">💵 Financial</span>;
      case 'traffic_expert':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">🚦 Traffic</span>;
      case 'tester':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">🧪 E2E Playwright</span>;
      default:
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">🫡 General Manager</span>;
    }
  };

  // Columns for Agent Execution Tickets
  const columns: ColumnDef<AgentTicket>[] = [
    {
      key: 'ticket_number',
      label: 'TICKET #',
      render: (row) => <code className="text-xs font-mono font-bold text-neutral-900">{row.ticket_number || row.id}</code>,
    },
    {
      key: 'agent_role',
      label: 'AUTHOR AGENT',
      render: (row) => getAgentRoleBadge(row.agent_role),
    },
    {
      key: 'title',
      label: 'TASK / FEATURE TITLE',
      render: (row) => <span className="font-bold text-neutral-900">{row.title}</span>,
    },
    {
      key: 'components_used',
      label: 'COMPONENTS & SCHEMAS',
      render: (row) => (
        <div className="flex items-center gap-1 max-w-xs overflow-hidden">
          {(row.components_used || []).slice(0, 2).map((comp, idx) => (
            <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-300 truncate">
              {comp}
            </span>
          ))}
          {(row.components_used || []).length > 2 && (
            <span className="text-[10px] font-bold text-neutral-400">+{row.components_used.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
          ✓ {row.status || 'VERIFIED'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'TIMESTAMP',
      render: (row) => <span className="text-[11px] font-mono text-neutral-500">{(row.created_at || '').split('T')[0]}</span>,
    },
  ];

  return (
    <div className="w-full max-w-full 2xl:max-w-[1800px] 4k:max-w-[3400px] mx-auto space-y-5 font-sans pb-24 sm:pb-0">
      
      {/* Top Header & Section Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff3b30] shrink-0" />
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase text-[#1c1c1e] tracking-tight">
              Agent Intelligence & SOP Knowledge Base HQ
            </h1>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Living repository of subagent task reports, Standard Operating Procedures (SOPs), component catalogs, and real-time site telemetry.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          {[
            { id: 'tickets', label: '🎟️ Agent Tickets' },
            { id: 'sops', label: '📚 SOP Manuals' },
            { id: 'telemetry', label: '📡 Site Telemetry' },
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

      {/* TAB 1: AGENT TICKETS WORKSHEET */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <ExcelWorksheetTable
            title="Subagent Execution Tickets & SOP Log"
            data={filteredTickets}
            columns={columns}
            idKey="id"
            searchPlaceholder="Search tickets, components, schemas, SOPs..."
            loading={loading}
            actionRenderer={(row) => (
              <button
                onClick={() => setSelectedTicket(row)}
                className="text-[10px] font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-3 py-1 rounded shadow-xs transition active:scale-95"
              >
                Read SOP 📖
              </button>
            )}
          />
        </div>
      )}

      {/* TAB 2: SOP KNOWLEDGE BASE CARDS */}
      {activeTab === 'sops' && (
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
                {getAgentRoleBadge(sop.author_agent)}
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

      {/* TAB 3: REAL-TIME SITE TELEMETRY AUDIT */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4 bg-white p-5 border border-neutral-200 rounded-xl">
          <h2 className="font-black text-sm uppercase text-[#1c1c1e]">Real-Time User Site Telemetry Stream</h2>
          <div className="space-y-2 font-mono text-xs max-h-[600px] overflow-y-auto">
            {telemetryLogs.length === 0 ? (
              <p className="text-neutral-400">Awaiting user site activity telemetry...</p>
            ) : (
              telemetryLogs.map((log, idx) => (
                <div key={idx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-neutral-900 mr-2">[{log.action || log.event || 'USER_ACTION'}]</span>
                    <span className="text-neutral-600">{log.path || log.target || log.details || 'Site View'}</span>
                  </div>
                  <span className="text-neutral-400 text-[11px]">{log.timestamp || log.created_at || 'Recent'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Slide-Out Ticket / SOP Reader Drawer */}
      {(selectedTicket || selectedSOP) && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col justify-between shadow-2xl border-l border-neutral-200 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                  {selectedTicket ? selectedTicket.ticket_number : selectedSOP?.category}
                </span>
                <h2 className="font-black text-lg uppercase text-[#1c1c1e]">
                  {selectedTicket ? selectedTicket.title : selectedSOP?.title}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setSelectedSOP(null);
                }}
                className="touch-target-44 rounded-lg text-neutral-400 hover:text-neutral-900 font-bold active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedTicket && (
                <>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                    <h3 className="text-xs font-black uppercase text-neutral-900">SOP Summary & Purpose</h3>
                    <p className="text-xs text-neutral-700 leading-relaxed">{selectedTicket.sop_summary}</p>
                  </div>

                  {/* Components & Schemas */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-neutral-900">Components Used & Schemas Affected</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedTicket.components_used || []).map((comp, idx) => (
                        <span key={idx} className="text-xs font-mono px-2 py-1 rounded bg-neutral-100 border border-neutral-300 font-bold">
                          🧩 {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step-by-Step SOP Instructions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-neutral-900">Step-by-Step SOP Execution Blueprint</h3>
                    <ol className="space-y-2 pl-4 list-decimal text-xs text-neutral-800 font-medium">
                      {(selectedTicket.sop_steps || []).map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              {selectedSOP && (
                <>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                    <h3 className="text-xs font-black uppercase text-neutral-900">Guide Description</h3>
                    <p className="text-xs text-neutral-700 leading-relaxed">{selectedSOP.description}</p>
                  </div>

                  {/* Step-by-Step Guide */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-neutral-900">Standard Operating Procedure</h3>
                    <ol className="space-y-2 pl-4 list-decimal text-xs text-neutral-800 font-medium">
                      {(selectedSOP.steps || []).map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Code Snippets */}
                  {(selectedSOP.code_snippets || []).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase text-neutral-900">Code Snippets & Implementation Rules</h3>
                      {selectedSOP.code_snippets?.map((snip, idx) => (
                        <div key={idx} className="space-y-1">
                          <span className="text-xs font-bold text-neutral-700">{snip.title}</span>
                          <pre className="p-3 bg-neutral-900 text-white rounded-lg font-mono text-[11px] overflow-x-auto">
                            <code>{snip.code}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setSelectedSOP(null);
                }}
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs uppercase rounded-xl"
              >
                Close Manual
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
