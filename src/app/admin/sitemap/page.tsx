'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';
import { INITIAL_PLATFORM_FEATURES } from '@/lib/seed/platformSeedData';

interface RouteSitemapEntry {
  id: string;
  name: string;
  route_path: string;
  category: 'public' | 'dynamic' | 'admin' | 'dashboard' | 'seo_api';
  status: 'live' | 'beta' | 'admin_only';
  priority: string;
  change_freq: string;
  live_url: string;
  localhost_url: string;
  access_level: string;
  description: string;
}

export default function AdminSitemapPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'dynamic' | 'admin' | 'dashboard' | 'seo_api'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const PROD_BASE = 'https://gridpass.web.app';
  const LOCAL_BASE = 'http://localhost:3000';

  // Helper to build clean preview URLs
  const formatUrl = (base: string, path: string) => {
    let clean = path.split(',')[0].trim();
    if (clean.includes('[')) {
      clean = clean
        .replace(/\[id\]/g, 'demo')
        .replace(/\[slug\]/g, 'sample')
        .replace(/\[username\]/g, 'driver');
    }
    return `${base}${clean}`;
  };

  // Compile complete sitemap dataset combining seed features & core platform routes
  const sitemapEntries: RouteSitemapEntry[] = [
    // Core Public Routes
    { id: 'sm_home', name: 'Home Landing & Pass Portal', route_path: '/', category: 'public', status: 'live', priority: '1.0', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/'), localhost_url: formatUrl(LOCAL_BASE, '/'), access_level: 'All Public', description: 'Main marketing portal, value proposition & pass claim intake.' },
    { id: 'sm_join', name: 'Join Gridpass Intake', route_path: '/join', category: 'public', status: 'live', priority: '0.9', change_freq: 'weekly', live_url: formatUrl(PROD_BASE, '/join'), localhost_url: formatUrl(LOCAL_BASE, '/join'), access_level: 'All Public', description: 'Member registration & digital pass claim flow.' },
    { id: 'sm_explore', name: 'Explore Directory & Event Map', route_path: '/explore', category: 'public', status: 'live', priority: '0.9', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/explore'), localhost_url: formatUrl(LOCAL_BASE, '/explore'), access_level: 'All Public', description: 'Universal search across vehicles, drivers, events, and businesses.' },
    { id: 'sm_vehicles', name: 'Public Vehicle Garage Directory', route_path: '/vehicles', category: 'public', status: 'live', priority: '0.8', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/vehicles'), localhost_url: formatUrl(LOCAL_BASE, '/vehicles'), access_level: 'All Public', description: 'Directory of staged vehicle passports & build specifications.' },
    { id: 'sm_members', name: 'Public Driver Roster', route_path: '/members', category: 'public', status: 'live', priority: '0.8', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/members'), localhost_url: formatUrl(LOCAL_BASE, '/members'), access_level: 'All Public', description: 'Directory of verified drivers, track teams, and spectators.' },
    { id: 'sm_events', name: 'Events & Track Schedule', route_path: '/events', category: 'public', status: 'live', priority: '0.9', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/events'), localhost_url: formatUrl(LOCAL_BASE, '/events'), access_level: 'All Public', description: 'Motorsports events, track days, and car meet schedules.' },
    { id: 'sm_businesses', name: 'Auto Shop & Vendor Directory', route_path: '/businesses', category: 'public', status: 'live', priority: '0.8', change_freq: 'weekly', live_url: formatUrl(PROD_BASE, '/businesses'), localhost_url: formatUrl(LOCAL_BASE, '/businesses'), access_level: 'All Public', description: 'Sponsor businesses, tuners, performance shops, and exhibitors.' },
    { id: 'sm_guides', name: 'Boating & Trail Knowledge Guides', route_path: '/guides', category: 'public', status: 'live', priority: '0.7', change_freq: 'monthly', live_url: formatUrl(PROD_BASE, '/guides'), localhost_url: formatUrl(LOCAL_BASE, '/guides'), access_level: 'All Public', description: 'PWC anchoring guides, buoy color meanings, and lake rules.' },
    { id: 'sm_sl', name: 'Second Life Metaverse Telemetry', route_path: '/secondlife', category: 'public', status: 'live', priority: '0.7', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/secondlife'), localhost_url: formatUrl(LOCAL_BASE, '/secondlife'), access_level: 'All Public', description: 'Real-time Second Life sim stats, region FPS, time dilation, and avatar lists.' },
    { id: 'sm_water', name: 'Water & Lake Waypoint Portal', route_path: '/water', category: 'public', status: 'live', priority: '0.7', change_freq: 'weekly', live_url: formatUrl(PROD_BASE, '/water'), localhost_url: formatUrl(LOCAL_BASE, '/water'), access_level: 'All Public', description: 'Interactive buoy maps and marine safety guides.' },

    // Dynamic Entity Routes
    { id: 'sm_dyn_v', name: 'Vehicle Passport Spec Sheet', route_path: '/v/[id]', category: 'dynamic', status: 'live', priority: '0.8', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/v/[id]'), localhost_url: formatUrl(LOCAL_BASE, '/v/[id]'), access_level: 'All Public', description: 'Polymorphic vehicle passport with RFID tag binding & build specs.' },
    { id: 'sm_dyn_u', name: 'Driver Card & Online Resume', route_path: '/u/[id]', category: 'dynamic', status: 'live', priority: '0.8', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/u/[id]'), localhost_url: formatUrl(LOCAL_BASE, '/u/[id]'), access_level: 'All Public', description: 'Public driver profile card and motorsports resume.' },
    { id: 'sm_dyn_b', name: 'Business Exhibit & Shop Page', route_path: '/b/[id]', category: 'dynamic', status: 'live', priority: '0.8', change_freq: 'weekly', live_url: formatUrl(PROD_BASE, '/b/[id]'), localhost_url: formatUrl(LOCAL_BASE, '/b/[id]'), access_level: 'All Public', description: 'Business exhibit profile with products and sponsor passes.' },
    { id: 'sm_dyn_ev', name: 'Event Hub & Entrant Manifest', route_path: '/events/[id]', category: 'dynamic', status: 'live', priority: '0.9', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/events/[id]'), localhost_url: formatUrl(LOCAL_BASE, '/events/[id]'), access_level: 'All Public', description: 'Live event page with entrant vehicle cards, discussion, and check-in.' },
    { id: 'sm_dyn_guide', name: 'Guide Article Page', route_path: '/guides/[slug]', category: 'dynamic', status: 'live', priority: '0.7', change_freq: 'monthly', live_url: formatUrl(PROD_BASE, '/guides/[slug]'), localhost_url: formatUrl(LOCAL_BASE, '/guides/[slug]'), access_level: 'All Public', description: 'Full markdown guide article for SEO indexation.' },

    // Super Admin Control HQ Modules
    { id: 'sm_adm_cmd', name: 'Owner Command HQ', route_path: '/admin/command', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'always', live_url: formatUrl(PROD_BASE, '/admin/command'), localhost_url: formatUrl(LOCAL_BASE, '/admin/command'), access_level: 'Super Admin', description: 'Single-screen 6-quadrant dashboard with Localhost filter & TV mode.' },
    { id: 'sm_adm_feedback', name: 'Member Ideas & Triage HQ', route_path: '/admin/feedback', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'always', live_url: formatUrl(PROD_BASE, '/admin/feedback'), localhost_url: formatUrl(LOCAL_BASE, '/admin/feedback'), access_level: 'Super Admin', description: 'Feedback intake & 1-click subagent ticket promotion engine.' },
    { id: 'sm_adm_logs', name: 'System Activity Logs HQ', route_path: '/admin/logs', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'always', live_url: formatUrl(PROD_BASE, '/admin/logs'), localhost_url: formatUrl(LOCAL_BASE, '/admin/logs'), access_level: 'Super Admin', description: 'Real-time telemetry audit stream capturing user & subagent actions.' },
    { id: 'sm_adm_tickets', name: 'Subagent Ticket HQ', route_path: '/admin/tickets', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'always', live_url: formatUrl(PROD_BASE, '/admin/tickets'), localhost_url: formatUrl(LOCAL_BASE, '/admin/tickets'), access_level: 'Super Admin', description: 'Dual worksheet tables for TODO tickets & completed audit logs.' },
    { id: 'sm_adm_agents', name: 'AI Agent Staff Roster', route_path: '/admin/agents', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'weekly', live_url: formatUrl(PROD_BASE, '/admin/agents'), localhost_url: formatUrl(LOCAL_BASE, '/admin/agents'), access_level: 'Super Admin', description: 'Swarm matrix managing all 11 specialized subagent roles & models.' },
    { id: 'sm_adm_sop', name: 'Platform & AI SOP Manuals', route_path: '/admin/sop', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'weekly', live_url: formatUrl(PROD_BASE, '/admin/sop'), localhost_url: formatUrl(LOCAL_BASE, '/admin/sop'), access_level: 'Super Admin', description: 'Platform architecture guidelines & step-by-step SOP manuals.' },
    { id: 'sm_adm_features', name: 'Platform Feature & Route Matrix', route_path: '/admin/features', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'weekly', live_url: formatUrl(PROD_BASE, '/admin/features'), localhost_url: formatUrl(LOCAL_BASE, '/admin/features'), access_level: 'Super Admin', description: 'SaaS module flags, route definitions, and pricing tier matrix.' },
    { id: 'sm_adm_analytics', name: 'System Analytics & Clarity UX', route_path: '/admin/analytics', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'always', live_url: formatUrl(PROD_BASE, '/admin/analytics'), localhost_url: formatUrl(LOCAL_BASE, '/admin/analytics'), access_level: 'Super Admin', description: 'Traffic graphs, scan velocity, and UX friction heatmaps.' },
    { id: 'sm_adm_db', name: 'Firestore Database Inspector', route_path: '/admin/db', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'always', live_url: formatUrl(PROD_BASE, '/admin/db'), localhost_url: formatUrl(LOCAL_BASE, '/admin/db'), access_level: 'Super Admin', description: 'Live database schema inspector & collection document explorer.' },
    { id: 'sm_adm_crm', name: 'Sales CRM & Intake Engine', route_path: '/admin/crm', category: 'admin', status: 'admin_only', priority: '0.5', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/admin/crm'), localhost_url: formatUrl(LOCAL_BASE, '/admin/crm'), access_level: 'Super Admin', description: 'B2B lead pipeline, dealership proposal generator, and sales CRM.' },

    // Driver & Partner Dashboards
    { id: 'sm_dash', name: 'Driver Dashboard HQ', route_path: '/dash', category: 'dashboard', status: 'live', priority: '0.8', change_freq: 'daily', live_url: formatUrl(PROD_BASE, '/dash'), localhost_url: formatUrl(LOCAL_BASE, '/dash'), access_level: 'Members Only', description: 'Driver control panel for managing vehicles, passes, and account.' },
    { id: 'sm_partner', name: 'B2B Partner Portal', route_path: '/partner', category: 'dashboard', status: 'live', priority: '0.8', change_freq: 'weekly', live_url: formatUrl(PROD_BASE, '/partner'), localhost_url: formatUrl(LOCAL_BASE, '/partner'), access_level: 'Business Owners', description: 'Partner dashboard for exhibitor passes, lead analytics, and ads.' },

    // SEO Assets & APIs
    { id: 'sm_xml', name: 'Sitemap.xml Index', route_path: '/sitemap.xml', category: 'seo_api', status: 'live', priority: '1.0', change_freq: 'always', live_url: `${PROD_BASE}/sitemap.xml`, localhost_url: `${LOCAL_BASE}/sitemap.xml`, access_level: 'Search Engines', description: 'Dynamic XML sitemap feed for Google & Bing indexation.' },
    { id: 'sm_robots', name: 'Robots.txt Directive', route_path: '/robots.txt', category: 'seo_api', status: 'live', priority: '1.0', change_freq: 'monthly', live_url: `${PROD_BASE}/robots.txt`, localhost_url: `${LOCAL_BASE}/robots.txt`, access_level: 'Search Engines', description: 'Search crawler directives & sitemap pointer.' },
    { id: 'sm_og', name: 'Dynamic OpenGraph Image Generator', route_path: '/api/og', category: 'seo_api', status: 'live', priority: '0.8', change_freq: 'always', live_url: `${PROD_BASE}/api/og`, localhost_url: `${LOCAL_BASE}/api/og`, access_level: 'All Public', description: 'Dynamic social media image card generator for iMessage/Twitter.' },
  ];

  // Filtered dataset
  const filteredEntries = sitemapEntries.filter((entry) => {
    if (activeTab !== 'all' && entry.category !== activeTab) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.route_path.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns: ColumnDef<RouteSitemapEntry>[] = [
    {
      key: 'name',
      label: 'PAGE / ROUTE NAME',
      render: (row) => (
        <div>
          <span className="font-extrabold text-[#1c1c1e] text-xs block">{row.name}</span>
          <code className="text-[10px] font-mono text-neutral-500">{row.route_path}</code>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'TAXONOMY',
      render: (row) => (
        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 border border-neutral-300 text-neutral-800">
          {row.category === 'public' ? '🌐 PUBLIC' : row.category === 'dynamic' ? '⚡ DYNAMIC' : row.category === 'admin' ? '🔒 ADMIN' : row.category === 'dashboard' ? '🏎️ DASHBOARD' : '📡 SEO / API'}
        </span>
      ),
    },
    {
      key: 'access_level',
      label: 'WHO CAN SEE IT?',
      render: (row) => (
        <span className="text-[10px] font-bold text-neutral-700">
          {row.access_level}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'SEO PRIORITY',
      align: 'center',
      render: (row) => (
        <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {row.priority}
        </span>
      ),
    },
    {
      key: 'localhost_url',
      label: 'LOCAL DEVELOPMENT (LOCALHOST:3000)',
      render: (row) => (
        <a
          href={row.localhost_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline block truncate max-w-[220px]"
        >
          💻 {row.localhost_url.replace('http://localhost:3000', '')}
        </a>
      ),
    },
    {
      key: 'live_url',
      label: 'LIVE PRODUCTION (GRIDPASS.APP)',
      render: (row) => (
        <a
          href={row.live_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono font-bold text-emerald-600 hover:text-emerald-800 hover:underline block truncate max-w-[220px]"
        >
          🌐 {row.live_url.replace('https://gridpass.web.app', '')}
        </a>
      ),
    },
  ];

  // CSV Export
  const exportCSV = () => {
    const headers = ['Route Name', 'Path', 'Category', 'Access Level', 'SEO Priority', 'Localhost URL', 'Live Production URL', 'Description'];
    const rows = filteredEntries.map((e) => [
      `"${e.name}"`,
      e.route_path,
      e.category,
      e.access_level,
      e.priority,
      e.localhost_url,
      e.live_url,
      `"${e.description}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_master_sitemap_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header Card */}
      <div className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">
              Master Sitemap & Route Audit HQ
            </h1>
          </div>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            Complete platform sitemap comparing live production endpoints (<code className="text-emerald-400 font-mono">gridpass.app</code>) vs local development (<code className="text-blue-400 font-mono">localhost:3000</code>).
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="http://localhost:3000/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-blue-950 border border-blue-800 text-blue-300 rounded-xl text-xs font-bold uppercase transition hover:bg-blue-900"
          >
            💻 Local XML Sitemap →
          </a>
          <a
            href="https://gridpass.web.app/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold uppercase transition hover:bg-emerald-900"
          >
            🌐 Live XML Sitemap →
          </a>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Total Routes Audited</span>
          <span className="text-2xl font-black text-neutral-900">{sitemapEntries.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Public Core Routes</span>
          <span className="text-2xl font-black text-emerald-600">{sitemapEntries.filter((e) => e.category === 'public').length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Dynamic Entity Routes</span>
          <span className="text-2xl font-black text-purple-600">{sitemapEntries.filter((e) => e.category === 'dynamic').length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Super Admin Modules</span>
          <span className="text-2xl font-black text-[#ff3b30]">{sitemapEntries.filter((e) => e.category === 'admin').length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">SEO Assets & APIs</span>
          <span className="text-2xl font-black text-blue-600">{sitemapEntries.filter((e) => e.category === 'seo_api').length}</span>
        </div>
      </div>

      {/* Main Table */}
      <ExcelWorksheetTable
        title="Gridpass Universal Route Sitemap & Audit Matrix"
        data={filteredEntries}
        columns={columns}
        idKey="id"
        filterCategories={[
          { label: 'All Routes', key: 'all', count: sitemapEntries.length },
          { label: '🌐 Public Routes', key: 'public', count: sitemapEntries.filter((e) => e.category === 'public').length },
          { label: '⚡ Dynamic Entities', key: 'dynamic', count: sitemapEntries.filter((e) => e.category === 'dynamic').length },
          { label: '🔒 Admin HQ Modules', key: 'admin', count: sitemapEntries.filter((e) => e.category === 'admin').length },
          { label: '🏎️ Dashboards', key: 'dashboard', count: sitemapEntries.filter((e) => e.category === 'dashboard').length },
          { label: '📡 SEO & APIs', key: 'seo_api', count: sitemapEntries.filter((e) => e.category === 'seo_api').length },
        ]}
        activeFilter={activeTab}
        onFilterChange={(tab) => setActiveTab(tab as any)}
        searchPlaceholder="Search routes, paths, descriptions..."
        onExportCSV={exportCSV}
        actionRenderer={(row) => (
          <div className="flex items-center gap-1.5">
            <a
              href={row.localhost_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] font-black uppercase bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition"
            >
              💻 Local ↗
            </a>
            <a
              href={row.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded transition"
            >
              🌐 Live ↗
            </a>
          </div>
        )}
      />

    </div>
  );
}
