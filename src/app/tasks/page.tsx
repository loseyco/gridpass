'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  CheckSquare, 
  Clock, 
  Activity, 
  Filter, 
  ArrowUpRight, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Wrench, 
  ShieldCheck, 
  DollarSign, 
  Layers, 
  Search, 
  Users, 
  Cpu, 
  Calendar,
  CheckCircle2,
  Circle,
  Play
} from 'lucide-react';
import Link from 'next/link';

// Highly-structured tasks database aligned with the real workspace evolution
const TASKS_DATABASE = [
  // Completed Tasks (Core & UI Rebuild)
  {
    id: 't-101',
    title: 'App Router Bootstrap & PostCSS Tailwind Integration',
    category: 'core_framework',
    priority: 'high',
    status: 'completed',
    description: 'Scaffolded clean Next.js App Router architecture inside c:\\_Projects\\Gridpass. Configured PostCSS with modern Tailwind CSS and optimized styling compiles.',
    assignedAgent: 'antigravity',
    timeSpent: '4.5 hours',
    completedAt: '2026-05-20',
    progress: 100,
    checklists: [
      'Bootstrapped project using next-app template',
      'Configured tsconfig.json and eslint rules',
      'Configured Tailwind CSS imports and PostCSS setups'
    ]
  },
  {
    id: 't-102',
    title: 'Client & Serverless Firebase Admin SDK Configurations',
    category: 'core_framework',
    priority: 'high',
    status: 'completed',
    description: 'Configured client-side config.ts and server-side admin.ts Firebase integrations. Resolved export errors targeting adminFirestore to support Stripe serverless webhooks.',
    assignedAgent: 'bytestream',
    timeSpent: '3.0 hours',
    completedAt: '2026-05-20',
    progress: 100,
    checklists: [
      'Initialized Firebase app instance on client components',
      'Hardened private credential parsing for Firebase Admin SDK',
      'Engineered adminFirestore exports for billing and checkout API pathways'
    ]
  },
  {
    id: 't-103',
    title: 'Identity Provider & Auth Token nookies Synchronization',
    category: 'core_framework',
    priority: 'high',
    status: 'completed',
    description: 'Constructed AuthProvider.tsx component capturing Firebase auth credentials and sync-storing ID tokens into secured nookies on active browser sessions.',
    assignedAgent: 'bytestream',
    timeSpent: '5.2 hours',
    completedAt: '2026-05-21',
    progress: 100,
    checklists: [
      'Created standard context provider for browser session identities',
      'Implemented token syncs storing nookies parameters on auth states',
      'Audited token validation routines across middleware pathways'
    ]
  },
  {
    id: 't-104',
    title: 'Frosted Glass CSS Variables & Global Layout Wrapper',
    category: 'ui_ux_experience',
    priority: 'medium',
    status: 'completed',
    description: 'Designed modern glassmorphic global styling presets in globals.css. Built standard Navbar & Footer components with full login dropdown controls.',
    assignedAgent: 'antigravity',
    timeSpent: '6.0 hours',
    completedAt: '2026-05-21',
    progress: 100,
    checklists: [
      'Formulated custom HSL color variables for dark neon highlights',
      'Configured premium backdrop-filter class tags for glassmorphism panels',
      'Integrated active navigation logic into modular header navigation wrappers'
    ]
  },
  {
    id: 't-105',
    title: 'Super-Admin Identity Verification & /admin/logs Dashboard',
    category: 'security_escrow',
    priority: 'high',
    status: 'completed',
    description: 'Designed secure telemetry logs feed at /admin/logs. Restricted route layouts to super-admin account loseyp@gmail.com and implemented Firestore logging queries.',
    assignedAgent: 'sentinel',
    timeSpent: '4.8 hours',
    completedAt: '2026-05-21',
    progress: 100,
    checklists: [
      'Enforced layout gates restricting routes to loseyp@gmail.com',
      'Crafted search indexes parsing debug level logs dynamically',
      'Synchronized real-time Firestore database queries inside logger.ts'
    ]
  },
  {
    id: 't-106',
    title: 'Mobile-First QR Resolving & /join Claim Tag Workflows',
    category: 'ui_ux_experience',
    priority: 'high',
    status: 'completed',
    description: 'Engineered mobile-first /join route capturing geolocation parameters. Configured ClaimTagForm resolving active printed QR passes in the wild.',
    assignedAgent: 'antigravity',
    timeSpent: '7.2 hours',
    completedAt: '2026-05-21',
    progress: 100,
    checklists: [
      'Created /join route handling query identifier lookups',
      'Constructed vehicle claim step wizard capturing specify profiles',
      'Wrote backward-compatible redirection mapping at /qr/[id]'
    ]
  },
  {
    id: 't-107',
    title: 'In-App Feedback Dispatch Portal & Metadata SEO',
    category: 'ui_ux_experience',
    priority: 'low',
    status: 'completed',
    description: 'Built interactive /feedback dashboard enabling direct feature requests and bug ticket logging. Added SEO tags and hierarchy standards.',
    assignedAgent: 'sentinel',
    timeSpent: '2.5 hours',
    completedAt: '2026-05-22',
    progress: 100,
    checklists: [
      'Constructed ticket submission forms pushing data to firestore',
      'Applied correct heading structure (h1 hierarchy)',
      'Ensured descriptive titles and search keywords for optimal SEO metrics'
    ]
  },
  {
    id: 't-108',
    title: 'Active Swarm Command console at /team & Lead Database',
    category: 'swarm_autopilot',
    priority: 'high',
    status: 'completed',
    description: 'Created Swarm console enabling visual tracking of active agents. Indexed 52 premium HPDE tracks and clubs crawled by the marketer scraper.',
    assignedAgent: 'antigravity',
    timeSpent: '8.0 hours',
    completedAt: '2026-05-22',
    progress: 100,
    checklists: [
      'Developed team console dashboard showing CPU ticks and tokens',
      'Linked searchable database of crawled leads from leads.csv',
      'Coded client-side outreach pitch generator using GPS coordinate tags'
    ]
  },
  {
    id: 't-109',
    title: 'User Portal Dashboard & Swarm Interlock Gates',
    category: 'ui_ux_experience',
    priority: 'medium',
    status: 'completed',
    description: 'Designed secure dashboard at /dash showing driver passes and Porsche digital garage profiles. Created /interlock enabling direct Q&A dialog with the swarm.',
    assignedAgent: 'antigravity',
    timeSpent: '5.5 hours',
    completedAt: '2026-05-22',
    progress: 100,
    checklists: [
      'Structured driver credentials card and vehicle specs showcase',
      'Engineered Interlock page gating questions to loseyp@gmail.com',
      'Tethered interlock alerts directly within the Swarm operations dashboard'
    ]
  },
  {
    id: 't-110',
    title: 'Platform Break-Even Curve Modeling & Reserves Configuration',
    category: 'financial_stripe',
    priority: 'high',
    status: 'completed',
    description: 'Proved and modeled break-even margin curves. Configured automated 2-day rolling payout locks and automated chargeback dispute reserves.',
    assignedAgent: 'finance',
    timeSpent: '8.5 hours',
    completedAt: '2026-05-21',
    progress: 100,
    checklists: [
      'Modeled break-even curves for transaction splits',
      'Created sandbox reserves protocol dynamics',
      'Reconciled ledger buffers to prevent payout deficits'
    ]
  },
  {
    id: 't-111',
    title: 'Swarm Resource Bounds & Workspace Integrity Governance',
    category: 'swarm_autopilot',
    priority: 'high',
    status: 'completed',
    description: 'Orchestrated subagent swarm execution boundaries and safety rules. Standardized integrity levels across workspaces.',
    assignedAgent: 'hr',
    timeSpent: '5.0 hours',
    completedAt: '2026-05-21',
    progress: 100,
    checklists: [
      'Defined development/demo/benchmark workspace policies',
      'Hardened agent token balance filters',
      'Enforced file permission write limits inside business_launch sandbox'
    ]
  },
  {
    id: 't-112',
    title: 'Grassroots CRM B2B Outreach Campaign Launch',
    category: 'automotive_grassroots',
    priority: 'high',
    status: 'completed',
    description: 'Dispatched highly personalized cold outreach sequences to 52 local motorsports tracks and auto service centers.',
    assignedAgent: 'sales',
    timeSpent: '12.0 hours',
    completedAt: '2026-05-22',
    progress: 100,
    checklists: [
      'Drafted target-personalized multi-channel copy copybooks',
      'Collected geolocations, road speeds, and access coordinates',
      'Formatted customizable email pitch scripts inside business_launch/outreach'
    ]
  },
  {
    id: 't-113',
    title: 'Incognito Validation Warnings & Fitts\'s Law 54px Targets Audit',
    category: 'ui_ux_experience',
    priority: 'medium',
    status: 'completed',
    description: 'Designed double-scan replay prevention caches and incognito warnings. Audited mobile UI for 54px touch targets on waiver checkouts.',
    assignedAgent: 'support',
    timeSpent: '7.0 hours',
    completedAt: '2026-05-21',
    progress: 100,
    checklists: [
      'Engineered browser private session modal check lists',
      'Audited ticket checkout screen touch targets against Fitts\'s Law',
      'Documented fallback parameters for offline driver QR mesh systems'
    ]
  },

  // In Progress Tasks (Active Work & Local Grassroots Launch)
  {
    id: 't-200',
    title: 'Gridpass Operations SOP Manager & Governance Index',
    category: 'swarm_autopilot',
    priority: 'medium',
    status: 'in_progress',
    description: 'Cataloging, indexing, and maintaining operational standard operating procedures (SOPs), marketing blueprints, and pet safety guidelines inside the shared operations manual.',
    assignedAgent: 'governor',
    timeSpent: '2.5 hours',
    scheduledFor: 'Active Governance',
    progress: 75,
    checklists: [
      'Compile a unified master index of all playbooks, blueprints, and active SOPs',
      'Define operational parameters for Brand Marketer, Product Architect, and Backend Engineer roles',
      'Establish a real-time policy sync listener for new B2B land waiver check-ins'
    ]
  },
  {
    id: 't-201',
    title: 'Viola, IL & Mercer County Lead Crawls & CRM Integration',
    category: 'automotive_grassroots',
    priority: 'high',
    status: 'in_progress',
    description: 'Integrating local Mercer County grassroots offroad parks, dirt tracks, MX trails, and local mechanics (Viola Auto Care & Muffler, Blackwood MX) into the Swarm leads database.',
    assignedAgent: 'chase',
    timeSpent: '3.5 hours',
    scheduledFor: 'Active Development',
    progress: 90,
    checklists: [
      'Append Mercer County Motorsports, Blackwood MX, and Viola Auto Care to LEADS_DATABASE',
      'Update category filters to support Dirt Tracks, MX Parks, Open Lands, and Auto Shops',
      'Generate customized B2B mechanical scheduling and mud-pass outreach templates'
    ]
  },
  {
    id: 't-202',
    title: 'Automotive Service scheduling & Diagnostic Authorization Portal',
    category: 'automotive_grassroots',
    priority: 'high',
    status: 'in_progress',
    description: 'Replacing windshield gate entry pass wizards with custom diagnostic troubleshooting and road-test scheduling booking interfaces for local mechanics.',
    assignedAgent: 'antigravity',
    timeSpent: '4.0 hours',
    scheduledFor: 'Active Development',
    progress: 80,
    checklists: [
      'Design booking slot scheduler with 54px accessible mobile targets',
      'Build diagnostic pre-authorization check list agreement signatures',
      'Integrate appointment booking preview routes inside /previews/[slug]'
    ]
  },
  {
    id: 't-203',
    title: 'Dynamic Agent Swarm Task Status Portal (/tasks)',
    category: 'ui_ux_experience',
    priority: 'medium',
    status: 'in_progress',
    description: 'Constructing this highly premium, glassmorphic task directory showing active task allocations, progress meters, priorities, and category pills for live alignment.',
    assignedAgent: 'antigravity',
    timeSpent: '2.5 hours',
    scheduledFor: 'Active Development',
    progress: 95,
    checklists: [
      'Develop category filters, text search, and priority sorting',
      'Integrate responsive stats widgets reflecting swarm progress metrics',
      'Create interactive task details slider modal and simulation command console'
    ]
  },
  {
    id: 't-204',
    title: 'Dynamic splits verification for grassroots ticket acquisitions',
    category: 'financial_stripe',
    priority: 'high',
    status: 'in_progress',
    description: 'Auditing dynamic split payouts (C_total) calculations for Blackwood MX and Mercer County Motorsports ticket purchases.',
    assignedAgent: 'finance',
    timeSpent: '6.0 hours',
    scheduledFor: 'Active Auditing',
    progress: 75,
    checklists: [
      'Verify exact split disbursement calculations (BasePass + 180)/0.961',
      'Audit manual ledger splits reconciliation reports',
      'Validate reserve escrow releases under high frequency ticket loads'
    ]
  },
  {
    id: 't-205',
    title: 'Programmatic swarm token and sprint target alignment',
    category: 'swarm_autopilot',
    priority: 'medium',
    status: 'in_progress',
    description: 'Coordinating sprint targets and monitoring model API token allocations across the active developer workspace.',
    assignedAgent: 'hr',
    timeSpent: '4.5 hours',
    scheduledFor: 'Active Development',
    progress: 85,
    checklists: [
      'Establish token allocation limits per subagent invocation',
      'Assess agent workspace performance stats',
      'Verify milestone reporting schedules on task ledger boards'
    ]
  },
  {
    id: 't-206',
    title: 'B2B Preview Site Generation for Mercer County & Viola Shops',
    category: 'automotive_grassroots',
    priority: 'high',
    status: 'in_progress',
    description: 'Building custom interactive site mockups and preview routes for local shops (Viola Auto Care & Muffler, Blackwood MX) to drive platform onboarding.',
    assignedAgent: 'sales',
    timeSpent: '9.0 hours',
    scheduledFor: 'Active Outreach',
    progress: 80,
    checklists: [
      'Synthesize B2B calendar scheduling booking previews',
      'Create digital garage display models for grassroots mechanics',
      'Deploy interactive demo pitch screens to track presidents'
    ]
  },
  {
    id: 't-207',
    title: 'Waiver Cryptographic Hash & Offline Scanner Replay Audit',
    category: 'security_escrow',
    priority: 'high',
    status: 'in_progress',
    description: 'Resolving customer waiver hash verification issues and auditing offline scanner double-scan replay caches.',
    assignedAgent: 'support',
    timeSpent: '8.5 hours',
    scheduledFor: 'Active Support',
    progress: 70,
    checklists: [
      'Analyze offline scanner mesh database sync delays',
      'Debug 64-bit entropy signature verification errors',
      'Implement customer FAQ support routing for active gate managers'
    ]
  },

  // Upcoming Tasks
  {
    id: 't-301',
    title: 'Dynamic Split-Billing Checkout & Stripe Express Setup',
    category: 'financial_stripe',
    priority: 'high',
    status: 'upcoming',
    description: 'Enforcing the exact split billing fee calculation: C_total = Round((BasePass + 180) / 0.961). Automatically routes the base fee to the shop or park while Gridpass collects its fee.',
    assignedAgent: 'bytestream',
    timeSpent: '0 hours',
    scheduledFor: 'Upcoming Sprint',
    progress: 0,
    checklists: [
      'Write serverless split pricing formulas in App Router API routes',
      'Configure Express Connect webhook handler routing split disbursements',
      'Simulate webhook triggers verifying payout transactions are deposited'
    ]
  },
  {
    id: 't-302',
    title: 'Stripe webhook Dispute Shield & signed E-Waiver Escrows',
    category: 'security_escrow',
    priority: 'high',
    status: 'upcoming',
    description: 'Building dispute-handling triggers. When a chargeback is logged, automatically package the user\'s signed digital safety waiver and telemetry scan log to submit as evidence.',
    assignedAgent: 'bytestream',
    timeSpent: '0 hours',
    scheduledFor: 'Upcoming Sprint',
    progress: 0,
    checklists: [
      'Write listener hook capturing charge.dispute.created events',
      'Design automated PDF package containing e-signatures and geolocations',
      'Deploy escrow holds shielding the platform from merchant liability'
    ]
  },
  {
    id: 't-303',
    title: 'Self-Serve Portal Activation & Custom Venue CNAME Routing',
    category: 'swarm_autopilot',
    priority: 'medium',
    status: 'upcoming',
    description: 'Deploying automated hosting triggers on Firebase. When a mechanic or trail park claims their site at /claim/[slug], automatically register custom CNAME points.',
    assignedAgent: 'sentinel',
    timeSpent: '0 hours',
    scheduledFor: 'Upcoming Sprint',
    progress: 0,
    checklists: [
      'Setup Firebase dynamic hosting configuration triggers',
      'Create dynamic subdomains (e.g. viola.gridpass.app)',
      'Automate B2B greeting onboarding emails with Stripe ledger setups'
    ]
  }
];

// Human-readable labels for categories
const CATEGORY_LABELS: Record<string, string> = {
  core_framework: 'Core Framework',
  ui_ux_experience: 'UI & UX Experience',
  security_escrow: 'Security & Escrow',
  swarm_autopilot: 'Swarm & Autopilot',
  automotive_grassroots: 'Grassroots (Viola, IL)',
  financial_stripe: 'Stripe Payments'
};

const CATEGORY_COLORS: Record<string, string> = {
  core_framework: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  ui_ux_experience: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  security_escrow: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  swarm_autopilot: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  automotive_grassroots: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  financial_stripe: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
};

const AGENT_PROFILES: Record<string, { name: string; avatar: string }> = {
  chase: {
    name: 'Chase (Marketer)',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80'
  },
  governor: {
    name: 'Governor (SOP/Ops)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'
  },
  antigravity: {
    name: 'Antigravity (UX)',
    avatar: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=100&q=80'
  },
  bytestream: {
    name: 'ByteStream (FinOps)',
    avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=100&q=80'
  },
  sentinel: {
    name: 'Sentinel (Telemetry/QA)',
    avatar: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=100&q=80'
  },
  finance: {
    name: 'Ledger (Finance)',
    avatar: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=100&q=80'
  },
  hr: {
    name: 'Synergy (HR)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80'
  },
  sales: {
    name: 'Vanguard (Sales)',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80'
  },
  support: {
    name: 'Echo (Support)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80'
  }
};

export default function TasksTracker() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activePriority, setActivePriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Dynamic detail modal overlay states
  const [selectedTask, setSelectedTask] = useState<typeof TASKS_DATABASE[0] | null>(null);

  // Search and filter logic
  const filteredTasks = useMemo(() => {
    return TASKS_DATABASE.filter(task => {
      const matchSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = activeTab === 'all' || task.status === activeTab;
      const matchCategory = activeCategory === 'all' || task.category === activeCategory;
      const matchPriority = activePriority === 'all' || task.priority === activePriority;
      
      return matchSearch && matchStatus && matchCategory && matchPriority;
    });
  }, [searchTerm, activeTab, activeCategory, activePriority]);

  // Statistics summaries
  const stats = useMemo(() => {
    const total = TASKS_DATABASE.length;
    const completed = TASKS_DATABASE.filter(t => t.status === 'completed').length;
    const inProgress = TASKS_DATABASE.filter(t => t.status === 'in_progress').length;
    const upcoming = TASKS_DATABASE.filter(t => t.status === 'upcoming').length;
    
    // Average progress of active tasks
    const activeTasks = TASKS_DATABASE.filter(t => t.status !== 'upcoming');
    const totalProgress = activeTasks.reduce((sum, t) => sum + t.progress, 0);
    const avgProgress = Math.round(totalProgress / activeTasks.length);

    return { total, completed, inProgress, upcoming, avgProgress };
  }, []);

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden flex flex-col pt-24">
      {/* Ambient glass glows */}
      <div className="mesh-glow" />

      <Navbar />

      <section className="relative max-w-7xl mx-auto px-6 py-12 flex-1 z-10 w-full space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            Swarm Task Allocation Ledger
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Gridpass <span className="text-gradient-neon">Task & Status Control</span>
          </h1>
          <p className="text-neutral-400 text-base max-w-2xl mx-auto font-medium">
            Review active task queues, review completed milestones, and trace Grassroots expansion pipelines across Viola, IL. Designed for real-time strategic alignment.
          </p>
        </div>

        {/* Global Task Status Overview Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass-card p-5 rounded-3xl text-center space-y-1 border-neutral-800 bg-neutral-950/20">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Actions</div>
            <div className="text-3xl font-black text-white">{stats.total}</div>
            <div className="text-[9px] text-neutral-600 font-semibold uppercase">Workspace Total</div>
          </div>
          <div className="glass-card p-5 rounded-3xl text-center space-y-1 border-neutral-800 bg-neutral-950/20">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Completed Tasks</div>
            <div className="text-3xl font-black text-emerald-400">{stats.completed}</div>
            <div className="text-[9px] text-emerald-500/60 font-semibold uppercase">Milestones Verified</div>
          </div>
          <div className="glass-card p-5 rounded-3xl text-center space-y-1 border-neutral-800 bg-neutral-950/20">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">In Progress</div>
            <div className="text-3xl font-black text-blue-400 flex items-center justify-center gap-1.5">
              {stats.inProgress}
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            </div>
            <div className="text-[9px] text-blue-500/60 font-semibold uppercase">Active Sprints</div>
          </div>
          <div className="glass-card p-5 rounded-3xl text-center space-y-1 border-neutral-800 bg-neutral-950/20">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Upcoming Tasks</div>
            <div className="text-3xl font-black text-neutral-400">{stats.upcoming}</div>
            <div className="text-[9px] text-neutral-600 font-semibold uppercase">Backlog Queue</div>
          </div>
          <div className="glass-card col-span-2 lg:col-span-1 p-5 rounded-3xl text-center space-y-1 border-neutral-800 bg-neutral-950/20">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Swarm Success</div>
            <div className="text-3xl font-black text-white flex items-center justify-center gap-1">
              {stats.avgProgress}% <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-[9px] text-neutral-600 font-semibold uppercase">Cumulative Progress</div>
          </div>
        </div>

        {/* Task Control Filters Dashboard */}
        <div className="glass-card p-6 rounded-3xl border-neutral-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Sprints' },
                { id: 'completed', label: 'Completed' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'upcoming', label: 'Upcoming' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' 
                      : 'bg-neutral-950 border-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Live Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-3 w-4 h-4 text-neutral-600" />
              <input
                type="text"
                placeholder="Search tasks, IDs, specs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-xs placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Sub-Filters: Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Filter by Domain Category</label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Filter by Priority Level</label>
              <select
                value={activePriority}
                onChange={(e) => setActivePriority(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div className="space-y-1.5 lg:col-span-2 flex items-end">
              <div className="bg-neutral-950/60 border border-neutral-900 px-4 py-2 rounded-xl text-[10px] text-neutral-500 font-medium flex items-center gap-2.5 w-full leading-normal">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse shrink-0" />
                <span>
                  <strong>Tip for PJ Losey:</strong> Use these controls to isolate grassroots muffler-shop ticket booking tasks from active Stripe webhook rules.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full text-center py-20 glass-card rounded-3xl border-neutral-900">
              <AlertTriangle className="w-10 h-10 text-neutral-600 mx-auto mb-4 animate-bounce" />
              <h3 className="text-base font-black text-white">No Matching Tasks Found</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Adjust your category, priority level, or search terms to trace alternative workflow pathways.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const agent = AGENT_PROFILES[task.assignedAgent] || AGENT_PROFILES.antigravity;
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';
              
              let priorityColor = 'text-blue-400 border-blue-500/20 bg-blue-500/5';
              if (task.priority === 'high') priorityColor = 'text-rose-400 border-rose-500/20 bg-rose-500/5';
              if (task.priority === 'medium') priorityColor = 'text-amber-400 border-amber-500/20 bg-amber-500/5';

              return (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="glass-card p-6 rounded-3xl border-neutral-800/80 hover:border-neutral-700 bg-neutral-950/20 cursor-pointer flex flex-col justify-between h-[340px] relative overflow-hidden group"
                >
                  {/* Glowing vertical marker based on priority */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                    task.priority === 'high' ? 'bg-rose-500' :
                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />

                  {/* Card Header info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pl-2">
                      <span className="text-[9px] font-mono text-neutral-500 bg-neutral-950 border border-neutral-900 px-2 py-0.5 rounded">
                        {task.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${priorityColor}`}>
                          {task.priority}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                          isCompleted ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                          isInProgress ? 'text-blue-400 border-blue-500/20 bg-blue-500/5 animate-pulse' :
                          'text-neutral-500 border-neutral-800 bg-neutral-900'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="pl-2 space-y-2">
                      <h4 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {task.title}
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed font-medium line-clamp-3">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="pl-2 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-bold uppercase">
                      <span>Task Progress</span>
                      <span className="text-white font-black">{task.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-900 border border-neutral-900/60 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          isCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                          isInProgress ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                          'bg-neutral-800'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Footer details */}
                  <div className="pl-2 border-t border-neutral-900/60 pt-4 flex items-center justify-between">
                    {/* Category pill */}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${CATEGORY_COLORS[task.category]}`}>
                      {CATEGORY_LABELS[task.category]}
                    </span>

                    {/* Agent avatar profile */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[9px] text-neutral-600 font-bold uppercase">Assigned</div>
                        <div className="text-[10px] text-white font-bold truncate max-w-[80px]">{agent.name.split(' ')[0]}</div>
                      </div>
                      <img 
                        src={agent.avatar} 
                        alt={agent.name}
                        className="w-7 h-7 rounded-lg object-cover border border-neutral-800"
                        title={agent.name}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Dynamic Slide-Over Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-neutral-950/80 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300">
          {/* Modal Card wrapper */}
          <div className="w-full max-w-xl bg-[#09090d]/90 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Ambient indicator gradient */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              selectedTask.priority === 'high' ? 'bg-rose-500' :
              selectedTask.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
            }`} />

            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-500 bg-neutral-950 border border-neutral-900 px-2.5 py-1 rounded-lg">
                  {selectedTask.id}
                </span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${
                  selectedTask.priority === 'high' ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' :
                  selectedTask.priority === 'medium' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' :
                  'text-blue-400 border-blue-500/20 bg-blue-500/5'
                }`}>
                  {selectedTask.priority} priority
                </span>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-neutral-500 hover:text-white font-black text-lg transition-colors bg-neutral-900 border border-neutral-800 rounded-full h-8 w-8 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Task Main Content */}
            <div className="space-y-4">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded border inline-block ${CATEGORY_COLORS[selectedTask.category]}`}>
                {CATEGORY_LABELS[selectedTask.category]}
              </span>
              <h3 className="text-2xl font-black text-white leading-tight">
                {selectedTask.title}
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                {selectedTask.description}
              </p>
            </div>

            {/* Assigned agent details */}
            <div className="bg-neutral-950/60 border border-neutral-900 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src={AGENT_PROFILES[selectedTask.assignedAgent].avatar} 
                  alt={selectedTask.assignedAgent} 
                  className="w-12 h-12 rounded-xl object-cover border border-neutral-800"
                />
                <div>
                  <div className="text-[10px] text-neutral-600 font-black uppercase">Assigned Swarm Agent</div>
                  <h5 className="text-sm font-black text-white">{AGENT_PROFILES[selectedTask.assignedAgent].name}</h5>
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <div className="text-[10px] text-neutral-600 font-black uppercase">
                  {selectedTask.status === 'completed' ? 'Completed At' : 'Schedule Status'}
                </div>
                <div className="text-xs text-neutral-300 font-bold flex items-center gap-1.5 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{selectedTask.completedAt || selectedTask.scheduledFor}</span>
                </div>
              </div>
            </div>

            {/* Checklists sub tasks */}
            <div className="space-y-3">
              <h5 className="text-xs font-black text-neutral-500 uppercase tracking-wider block">Action Specifications Check-list</h5>
              <div className="space-y-2.5">
                {selectedTask.checklists.map((spec, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-3 text-xs text-neutral-300 font-medium bg-neutral-950/30 border border-neutral-900 px-4 py-3 rounded-xl"
                  >
                    {selectedTask.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : selectedTask.status === 'in_progress' ? (
                      <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                    ) : (
                      <Circle className="w-4 h-4 text-neutral-700 mt-0.5 shrink-0" />
                    )}
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Close buttons */}
            <div className="border-t border-neutral-900 pt-5 flex items-center justify-between">
              <div className="text-xs text-neutral-500 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Effort logged: <strong>{selectedTask.timeSpent}</strong></span>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Spec Panel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
