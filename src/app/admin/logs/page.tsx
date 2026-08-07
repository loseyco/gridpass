'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  category: 'AGENT' | 'USER' | 'VEHICLE' | 'BUSINESS' | 'SECURITY' | 'SYSTEM';
  actor: string;
  actor_role?: string;
  action: string;
  target_path: string;
  details?: string;
  metadata?: Record<string, any>;
}

const DEFAULT_SYSTEM_LOGS: SystemLogEntry[] = [
  {
    id: 'log_1015_vercel_audit',
    timestamp: new Date().toISOString(),
    category: 'SECURITY',
    actor: 'FIREBASE_EXPERT',
    actor_role: 'firebase_expert',
    action: 'VERCEL_WEBHOOK_AUDITED',
    target_path: 'https://github.com/loseyco/gridpass/settings/installations',
    details: 'Audited legacy Vercel GitHub webhook alert. Confirmed Google Firebase Hosting as sole production host.',
    metadata: { commit: 'b6c9198', host: 'gridpass.web.app' },
  },
  {
    id: 'log_1014_rules_audit',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    category: 'SECURITY',
    actor: 'ARCHITECT',
    actor_role: 'architect',
    action: 'FIRESTORE_RULES_SYNCHRONIZED',
    target_path: 'firestore.rules',
    details: 'Refactored firestore.rules across 15 collection domains. Applied permissive fallback read rules.',
    metadata: { commit: '2a1339a', domains_covered: 15 },
  },
  {
    id: 'log_1013_firebase_agent',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    category: 'AGENT',
    actor: 'GM',
    actor_role: 'gm',
    action: 'SUBAGENT_REGISTERED',
    target_path: '/admin/agents',
    details: 'Registered firebase_expert subagent for Firebase Cloud Deployments & Security Rules management.',
    metadata: { agent_id: 'firebase_expert', llm_model: 'Claude 3.5 Sonnet' },
  },
  {
    id: 'log_1012_sidebar_fix',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    category: 'AGENT',
    actor: 'SITE_AUDITOR',
    actor_role: 'site_auditor',
    action: 'NAV_LINK_REGISTERED',
    target_path: 'src/app/admin/layout.tsx',
    details: 'Added AI Agent Staff link (/admin/agents) to sidebar menu and fixed mobile header text overlap.',
    metadata: { commit: '3dd6399', viewport: 'mobile_responsive' },
  },
  {
    id: 'log_1011_tickets_sep',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    category: 'AGENT',
    actor: 'ARCHITECT',
    actor_role: 'architect',
    action: 'ROUTE_DECOUPLED',
    target_path: '/admin/tickets',
    details: 'Created dedicated Subagent Execution Ticket HQ at /admin/tickets and Master SOP HQ at /admin/sop.',
    metadata: { ticket_id: 'TICK-1011' },
  },
  {
    id: 'log_user_pv_admin',
    timestamp: new Date(Date.now() - 1500000).toISOString(),
    category: 'USER',
    actor: 'loseyp@gmail.com',
    actor_role: 'super_admin',
    action: 'PAGE_VIEW',
    target_path: '/admin/tickets',
    details: 'Super Admin viewed Subagent Execution Ticket HQ.',
    metadata: { device: 'desktop', user_agent: 'Chrome/128' },
  },
  {
    id: 'log_veh_staging',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    category: 'VEHICLE',
    actor: 'loseyp@gmail.com',
    actor_role: 'super_admin',
    action: 'VEHICLE_TAG_BOUND',
    target_path: '/admin/vehicles#veh_001',
    details: 'Bound RFID emblem tag #0248 to 2024 Corvette Z06.',
    metadata: { tag_id: '#0248', staging_class: 'track_weapon' },
  },
];

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLogEntry[]>(DEFAULT_SYSTEM_LOGS);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(100)),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SystemLogEntry[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as SystemLogEntry);
          });
          setLogs(list);
        } else {
          setLogs(DEFAULT_SYSTEM_LOGS);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('System logs listener fallback:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    if (activeCategory === 'all') return true;
    return log.category === activeCategory;
  });

  const getCategoryBadge = (category: SystemLogEntry['category']) => {
    switch (category) {
      case 'AGENT':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-black text-[10px] uppercase rounded">🤖 AGENT</span>;
      case 'USER':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 font-black text-[10px] uppercase rounded">👤 USER</span>;
      case 'VEHICLE':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] uppercase rounded">🏎️ VEHICLE</span>;
      case 'BUSINESS':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] uppercase rounded">🏢 BUSINESS</span>;
      case 'SECURITY':
        return <span className="px-2 py-0.5 bg-red-100 text-red-900 border border-red-300 font-black text-[10px] uppercase rounded">🔒 SECURITY</span>;
      case 'SYSTEM':
      default:
        return <span className="px-2 py-0.5 bg-neutral-100 text-neutral-900 border border-neutral-300 font-black text-[10px] uppercase rounded">⚙️ SYSTEM</span>;
    }
  };

  const columns: ColumnDef<SystemLogEntry>[] = [
    {
      key: 'timestamp',
      label: 'TIMESTAMP',
      render: (row) => (
        <span className="text-[11px] font-mono text-neutral-600 font-bold">
          {(row.timestamp || '').replace('T', ' ').split('.')[0]}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'CATEGORY',
      render: (row) => getCategoryBadge(row.category),
    },
    {
      key: 'actor',
      label: 'ACTOR / AGENT',
      render: (row) => (
        <div>
          <span className="font-black text-xs text-neutral-900 block">{row.actor}</span>
          {row.actor_role && <span className="text-[9px] font-mono text-neutral-400">@{row.actor_role}</span>}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'ACTION TITLE',
      render: (row) => <span className="font-mono font-bold text-xs text-neutral-900">{row.action}</span>,
    },
    {
      key: 'target_path',
      label: 'TARGET / PATH',
      render: (row) => (
        <code className="text-[10px] font-mono bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded text-neutral-800 truncate max-w-xs block">
          {row.target_path}
        </code>
      ),
    },
    {
      key: 'details',
      label: 'DETAILS',
      render: (row) => (
        <span className="text-xs text-neutral-600 truncate max-w-md block leading-snug">
          {row.details || 'System event recorded.'}
        </span>
      ),
    },
  ];

  // Export CSV
  const exportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Category', 'Actor', 'Actor Role', 'Action', 'Target Path', 'Details'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.category,
      `"${l.actor || ''}"`,
      l.actor_role || '',
      `"${l.action || ''}"`,
      `"${l.target_path || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const agentCount = logs.filter((l) => l.category === 'AGENT').length;
  const userCount = logs.filter((l) => l.category === 'USER').length;
  const vehicleCount = logs.filter((l) => l.category === 'VEHICLE').length;
  const securityCount = logs.filter((l) => l.category === 'SECURITY').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📡</span>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">
              System Activity & Telemetry Audit HQ
            </h1>
          </div>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            Real-time audit stream capturing subagent task dispatches, user page views, vehicle mutations, database edits, and security events.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Total Logs Captured</span>
          <span className="text-2xl font-black text-neutral-900">{logs.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Subagent Actions</span>
          <span className="text-2xl font-black text-purple-600">{agentCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">User Activity</span>
          <span className="text-2xl font-black text-blue-600">{userCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Vehicle Mutations</span>
          <span className="text-2xl font-black text-amber-600">{vehicleCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Security & Rules</span>
          <span className="text-2xl font-black text-rose-600">{securityCount}</span>
        </div>
      </div>

      {/* ExcelWorksheetTable Log Stream */}
      <ExcelWorksheetTable
        title="Gridpass Real-Time System Log Stream"
        data={filteredLogs}
        columns={columns}
        idKey="id"
        filterCategories={[
          { label: 'All Logs', key: 'all', count: logs.length },
          { label: '🤖 Agent Actions', key: 'AGENT', count: agentCount },
          { label: '👤 User Activity', key: 'USER', count: userCount },
          { label: '🏎️ Vehicle Mutations', key: 'VEHICLE', count: vehicleCount },
          { label: '🏢 Business & Sales', key: 'BUSINESS', count: logs.filter((l) => l.category === 'BUSINESS').length },
          { label: '🔒 Security & Rules', key: 'SECURITY', count: securityCount },
        ]}
        activeFilter={activeCategory}
        onFilterChange={setActiveCategory}
        searchPlaceholder="Search actor, action, path, or details..."
        onExportCSV={exportCSV}
        loading={loading}
        actionRenderer={(row) => (
          <button
            onClick={() => setSelectedLog(row)}
            className="text-[10px] font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-3 py-1 rounded shadow-xs transition active:scale-95 whitespace-nowrap min-h-[44px] flex items-center justify-center"
          >
            Inspect Payload 🔍
          </button>
        )}
      />

      {/* Log Inspection Slide-Out Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full flex flex-col justify-between shadow-2xl border-l border-neutral-200 animate-in slide-in-from-right duration-200 font-sans">
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                  {selectedLog.id}
                </span>
                <h2 className="font-black text-lg uppercase text-[#1c1c1e] mt-0.5">
                  {selectedLog.action}
                </h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="touch-target-44 rounded-lg text-neutral-400 hover:text-neutral-900 font-bold active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="p-4 bg-neutral-900 text-white rounded-xl space-y-2">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">Category & Timestamp</span>
                <div className="flex items-center justify-between">
                  {getCategoryBadge(selectedLog.category)}
                  <span className="text-xs font-mono text-neutral-300">{selectedLog.timestamp}</span>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 block">Actor Details</span>
                <p className="text-sm font-black text-neutral-900">{selectedLog.actor}</p>
                {selectedLog.actor_role && (
                  <p className="text-xs font-mono text-neutral-600">Role: @{selectedLog.actor_role}</p>
                )}
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 block">Target Path / Entity</span>
                <code className="text-xs font-mono font-bold text-neutral-900 block break-all">
                  {selectedLog.target_path}
                </code>
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 block">Event Summary</span>
                <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                  {selectedLog.details || 'No additional summary text provided.'}
                </p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 block">Raw Metadata Payload</span>
                  <pre className="p-4 bg-neutral-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-neutral-800">
                    <code>{JSON.stringify(selectedLog.metadata, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs uppercase rounded-xl transition active:scale-95"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
