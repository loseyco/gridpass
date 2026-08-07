'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';
import { AgentStaff } from '@/lib/types/admin';
import { AgentTrainingDrawer } from './AgentTrainingDrawer';

const DEFAULT_AGENTS: AgentStaff[] = [
  {
    id: 'gm',
    name: 'General Manager (GM)',
    role_code: 'gm',
    title: 'Operations Supervisor & Executive Orchestrator',
    icon: '👔',
    category: 'Management',
    status: 'ACTIVE',
    llm_model: 'Claude 3.7 Sonnet (Thinking)',
    api_key_name: 'ANTHROPIC_API_KEY',
    credentials_configured: true,
    tickets_completed: 18,
    sops_count: 5,
    system_prompt: 'Oversees team delegation, task orchestration, token-lean execution guardrails, and executive progress updates.',
  },
  {
    id: 'architect',
    name: 'Technical Architect',
    role_code: 'architect',
    title: 'Firestore Schemas & Technical Specs',
    icon: '📐',
    category: 'Architecture',
    status: 'ACTIVE',
    llm_model: 'Claude 3.7 Sonnet (Thinking)',
    api_key_name: 'ANTHROPIC_API_KEY',
    credentials_configured: true,
    tickets_completed: 2,
    sops_count: 2,
    system_prompt: 'Technical specs, domain models, Firestore schemas, RBAC permission rules, Mobile-First architecture.',
  },
  {
    id: 'aiseo_expert',
    name: 'AI & SEO Specialist',
    role_code: 'aiseo_expert',
    title: 'GEO, OpenGraph & JSON-LD Structured Data',
    icon: '🔍',
    category: 'SEO & GEO',
    status: 'ACTIVE',
    llm_model: 'Gemini 3.1 Pro',
    api_key_name: 'GEMINI_API_KEY',
    credentials_configured: true,
    tickets_completed: 1,
    sops_count: 1,
    system_prompt: 'OpenGraph social cards, Twitter cards, Schema.org JSON-LD structured data, llms.txt GEO AI search.',
  },
  {
    id: 'user_panel',
    name: 'User Experience Panel',
    role_code: 'user_panel',
    title: '7-Persona Walkthroughs & Friction Audits',
    icon: '👥',
    category: 'UX Research',
    status: 'ACTIVE',
    llm_model: 'Claude 3.7 Sonnet (Thinking)',
    api_key_name: 'ANTHROPIC_API_KEY',
    credentials_configured: true,
    tickets_completed: 1,
    sops_count: 1,
    system_prompt: '7-persona walkthroughs (Marcus, Sarah, Ranger Dave, Steve, Tech-Illiterate Billy, Cynical CFO Rich, Growth Marketer Chloe).',
  },
  {
    id: 'site_auditor',
    name: 'Site & Design Auditor',
    role_code: 'site_auditor',
    title: 'UX Uniformity & Soft-Delete Engine',
    icon: '🎨',
    category: 'Design & Compliance',
    status: 'ACTIVE',
    llm_model: 'Claude 3.7 Sonnet (Thinking)',
    api_key_name: 'ANTHROPIC_API_KEY',
    credentials_configured: true,
    tickets_completed: 3,
    sops_count: 3,
    system_prompt: 'UX uniformity, design system compliance (#ff3b30 red theme, charcoal #1c1c1e), zero fluff, zero fake data.',
  },
  {
    id: 'mobile_expert',
    name: 'Mobile UX Specialist',
    role_code: 'mobile_expert',
    title: 'Apple Native Touch Standards (≥44px)',
    icon: '📱',
    category: 'Mobile & Ergonomics',
    status: 'ACTIVE',
    llm_model: 'Gemini 3.6 Flash',
    api_key_name: 'GEMINI_API_KEY',
    credentials_configured: true,
    tickets_completed: 2,
    sops_count: 2,
    system_prompt: 'Apple Native Mobile & Touch UX, ≥44px touch hitboxes, zero hover lock, input zoom prevention.',
  },
  {
    id: 'financial_expert',
    name: 'Financial Strategist',
    role_code: 'financial_expert',
    title: 'Acquisition Valuation & Revenue Models',
    icon: '💰',
    category: 'Finance & Growth',
    status: 'ACTIVE',
    llm_model: 'Claude 3.7 Sonnet (Thinking)',
    api_key_name: 'ANTHROPIC_API_KEY',
    credentials_configured: true,
    tickets_completed: 1,
    sops_count: 1,
    system_prompt: 'Cash flow, MRR/ARR models, B2B deal pipelines, pricing packages, LTV/CAC calculations, acquisition valuation readiness.',
  },
  {
    id: 'traffic_expert',
    name: 'Traffic & Analytics Specialist',
    role_code: 'traffic_expert',
    title: 'Real-Time Telemetry & Scanning Velocity',
    icon: '📊',
    category: 'Analytics',
    status: 'ACTIVE',
    llm_model: 'Gemini 3.6 Flash',
    api_key_name: 'GEMINI_API_KEY',
    credentials_configured: true,
    tickets_completed: 1,
    sops_count: 1,
    system_prompt: 'Real-time traffic flows, entry/exit paths, physical QR scan velocity, 390px–430px mobile viewport distributions, rage clicks.',
  },
  {
    id: 'git_expert',
    name: 'Git & Release Coordinator',
    role_code: 'git_expert',
    title: 'Version Control & Conventional Commits',
    icon: '🐙',
    category: 'DevOps & Git',
    status: 'ACTIVE',
    llm_model: 'Claude 3.7 Sonnet (Thinking)',
    api_key_name: 'GITHUB_TOKEN',
    credentials_configured: true,
    tickets_completed: 4,
    sops_count: 4,
    system_prompt: 'Git version control, staging, clean conventional commits, release tagging, and GitHub repository synchronization.',
  },
  {
    id: 'tester',
    name: 'QA & Automated Tester',
    role_code: 'tester',
    title: 'Playwright E2E Visual Browser Testing',
    icon: '🧪',
    category: 'QA & Testing',
    status: 'ACTIVE',
    llm_model: 'Claude 3.7 Sonnet (Thinking)',
    api_key_name: 'PLAYWRIGHT_AUTH',
    credentials_configured: true,
    tickets_completed: 5,
    sops_count: 5,
    system_prompt: 'Automated Playwright E2E visual browser testing (npm run test:headed) & auth session persistence (tests/.auth/user.json).',
  },
  {
    id: 'firebase_expert',
    name: 'Firebase & Cloud Deploy Specialist',
    role_code: 'firebase_expert',
    title: 'Firebase Hosting, Cloud Functions & Security Rules',
    icon: '🔥',
    category: 'Cloud & Infrastructure',
    status: 'ACTIVE',
    llm_model: 'Claude 3.7 Sonnet (Thinking)',
    api_key_name: 'FIREBASE_CLI_TOKEN',
    credentials_configured: true,
    tickets_completed: 1,
    sops_count: 1,
    system_prompt: 'Firebase Hosting, Cloud Functions, Firestore Security Rules (firestore.rules), and Strict Zero Auto-Deploy Invariant.',
  },
];

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentStaff[]>(DEFAULT_AGENTS);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  // Drawer State
  const [selectedAgent, setSelectedAgent] = useState<AgentStaff | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'agent_staff'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AgentStaff[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as AgentStaff);
          });
          setAgents(list);
        } else {
          // Initial seed to Firestore if empty
          DEFAULT_AGENTS.forEach((agent) => {
            setDoc(doc(db, 'agent_staff', agent.id), agent, { merge: true }).catch(() => {});
          });
          setAgents(DEFAULT_AGENTS);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleInlineSave = async (id: string, key: string, newValue: any) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [key]: newValue } : a))
    );

    try {
      await setDoc(doc(db, 'agent_staff', id), { [key]: newValue, updated_at: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error('Failed to inline update agent:', err);
    }
  };

  const handleSaveDrawerAgent = async (id: string, updates: Partial<AgentStaff>) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );

    try {
      await setDoc(doc(db, 'agent_staff', id), updates, { merge: true });
    } catch (err) {
      console.error('Failed to update agent from drawer:', err);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: AgentStaff['status']) => {
    const nextStatus: AgentStaff['status'] = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );

    try {
      await setDoc(doc(db, 'agent_staff', id), { status: nextStatus, updated_at: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle agent status:', err);
    }
  };

  const openDrawer = (agent: AgentStaff) => {
    setSelectedAgent(agent);
    setIsDrawerOpen(true);
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Agent ID', 'Name', 'Role Code', 'Title', 'Category', 'Status', 'LLM Model', 'API Key Name', 'Credentials Configured'];
    const rows = agents.map((a) => [
      a.id,
      `"${a.name || ''}"`,
      a.role_code || '',
      `"${a.title || ''}"`,
      a.category || '',
      a.status || '',
      a.llm_model || '',
      a.api_key_name || '',
      a.credentials_configured ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_ai_agent_staff_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Column definitions for ExcelWorksheetTable
  const columns: ColumnDef<AgentStaff>[] = [
    {
      key: 'name',
      label: 'AGENT & ROLE',
      editable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-base">{row.icon || '🤖'}</span>
          <div>
            <span className="font-black text-neutral-900 uppercase block">{row.name}</span>
            <span className="text-[10px] text-neutral-500 font-mono">@{row.role_code}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'CATEGORY',
      editable: true,
      render: (row) => (
        <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 font-black text-[10px] text-neutral-800 uppercase rounded">
          {row.category}
        </span>
      ),
    },
    {
      key: 'llm_model',
      label: 'LLM MODEL & CREDENTIALS',
      editable: true,
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-neutral-900 text-xs block">{row.llm_model}</span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border inline-block ${
            row.credentials_configured
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            🔑 {row.api_key_name || 'UNSET'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      editable: true,
      render: (row) => {
        const badgeClasses: Record<AgentStaff['status'], string> = {
          ACTIVE: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          TRAINING: 'bg-[#ff3b30] text-white border-[#ff3b30]',
          STANDBY: 'bg-neutral-100 text-neutral-800 border-neutral-300',
          PAUSED: 'bg-rose-100 text-rose-900 border-rose-300',
        };
        return (
          <span className={`px-2.5 py-1 font-black text-[10px] uppercase rounded-full border ${badgeClasses[row.status] || badgeClasses.ACTIVE}`}>
            ● {row.status}
          </span>
        );
      },
    },
    {
      key: 'tickets_completed',
      label: 'DELIVERABLES',
      render: (row) => (
        <span className="px-2 py-1 bg-purple-100 font-black text-xs text-purple-900 rounded">
          🎟️ {row.tickets_completed || 0} Tickets • 📚 {row.sops_count || 0} SOPs
        </span>
      ),
    },
  ];

  // Filtering
  const filteredAgents = agents.filter((a) => {
    if (activeFilter === 'all') return true;
    return a.status === activeFilter;
  });

  const activeCount = agents.filter((a) => a.status === 'ACTIVE').length;
  const configuredCount = agents.filter((a) => a.credentials_configured).length;
  const totalDeliverables = agents.reduce((acc, a) => acc + (a.tickets_completed || 0) + (a.sops_count || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">
              AI Agent Staff Matrix & Training HQ
            </h1>
          </div>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            API Credentialing, System SOP Prompt Training & Operational Roster for 9 Autonomous Subagents
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Total Subagents</span>
          <span className="text-2xl font-black text-neutral-900">{agents.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Active Roster</span>
          <span className="text-2xl font-black text-emerald-600">{activeCount} / {agents.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Credentials Configured</span>
          <span className="text-2xl font-black text-blue-600">{configuredCount} / {agents.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Tickets & SOPs Authored</span>
          <span className="text-2xl font-black text-purple-600">{totalDeliverables}</span>
        </div>
      </div>

      {/* ExcelWorksheetTable Staff Matrix */}
      <ExcelWorksheetTable
        title="Gridpass AI Subagent Fleet"
        data={filteredAgents}
        columns={columns}
        idKey="id"
        filterCategories={[
          { label: 'All Fleet', key: 'all', count: agents.length },
          { label: 'Active', key: 'ACTIVE', count: activeCount },
          { label: 'Training', key: 'TRAINING', count: agents.filter((a) => a.status === 'TRAINING').length },
          { label: 'Paused', key: 'PAUSED', count: agents.filter((a) => a.status === 'PAUSED').length },
        ]}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchPlaceholder="Search agent name, model, role..."
        onExportCSV={exportCSV}
        onInlineSave={handleInlineSave}
        loading={loading}
        actionRenderer={(row) => (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => openDrawer(row)}
              className="text-xs font-bold text-neutral-900 hover:text-[#ff3b30] hover:underline whitespace-nowrap min-h-[44px] px-2 flex items-center"
            >
              ⚙️ Training & Credentials
            </button>
            <button
              onClick={() => handleToggleStatus(row.id, row.status)}
              className={`text-xs font-bold hover:underline whitespace-nowrap min-h-[44px] px-2 flex items-center ${
                row.status === 'ACTIVE' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {row.status === 'ACTIVE' ? 'Pause' : 'Activate'}
            </button>
          </div>
        )}
      />

      {/* Agent Training Slide-Out Drawer */}
      <AgentTrainingDrawer
        isOpen={isDrawerOpen}
        agent={selectedAgent}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveDrawerAgent}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
