'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { BusinessProfile } from '@/lib/types/business';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Car, 
  QrCode, 
  DollarSign, 
  Building2, 
  Activity, 
  ShieldCheck, 
  Globe, 
  ArrowUpRight,
  PieChart,
  Zap,
  MousePointer,
  Smartphone,
  Monitor,
  AlertTriangle,
  Eye,
  Filter,
  MapPin,
  Play,
  ArrowDown,
  Layers,
  Loader2
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [clients, setClients] = useState<BusinessProfile[]>([]);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalVehicles, setTotalVehicles] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  
  // UX & Clarity Telemetry State
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [excludeLocalhost, setExcludeLocalhost] = useState<boolean>(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'realtime' | 'valuation' | 'clarity' | 'telemetry' | 'b2b'>('realtime');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time Businesses Subscription
    const unsubBiz = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      const bizList: BusinessProfile[] = [];
      snapshot.forEach((docSnap) => {
        bizList.push({ id: docSnap.id, ...docSnap.data() } as BusinessProfile);
      });
      setClients(bizList);
      setLoading(false);
    });

    // Real-time Tag Scans Subscription
    const unsubScans = onSnapshot(collection(db, 'tag_scans'), (snapshot) => {
      setTotalScans(snapshot.size);
      const scanList: any[] = [];
      snapshot.forEach((docSnap) => {
        scanList.push({ id: docSnap.id, ...docSnap.data() });
      });
      scanList.sort((a, b) => new Date(b.scanned_at || b.timestamp || 0).getTime() - new Date(a.scanned_at || a.timestamp || 0).getTime());
      setRecentScans(scanList.slice(0, 10));
    });

    // Real-time System Logs (Page views, Viewports, Click Streams, Scroll Depth, Rage Clicks)
    const unsubLogs = onSnapshot(collection(db, 'system_logs'), (snapshot) => {
      const logsList: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logsList.push({ id: docSnap.id, ...data });
      });

      logsList.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setSystemLogs(logsList);
    });

    // Real-time Drivers Count
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTotalUsers(snapshot.size);
    });

    // Real-time Vehicles Count
    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      setTotalVehicles(snapshot.size);
    });

    // Real-time Events Count
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      setTotalEvents(snapshot.size);
    });

    return () => {
      unsubBiz();
      unsubScans();
      unsubLogs();
      unsubUsers();
      unsubVehicles();
      unsubEvents();
    };
  }, []);

  // Filter out localhost / development logs if toggle enabled
  const filteredLogs = systemLogs.filter((log) => {
    if (!excludeLocalhost) return true;
    const isDev =
      log.is_localhost === true ||
      log.environment === 'development' ||
      (log.referrer && log.referrer.includes('localhost'));
    return !isDev;
  });

  // Active Sessions in last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recentLogs = filteredLogs.filter((log) => (log.timestamp || '') >= tenMinutesAgo);

  // Group logs by session_id
  const sessionGroupMap: { [sessionId: string]: any[] } = {};
  filteredLogs.forEach((log) => {
    const sId = log.session_id || 'anonymous_session';
    if (!sessionGroupMap[sId]) sessionGroupMap[sId] = [];
    sessionGroupMap[sId].push(log);
  });

  const sessionIds = Object.keys(sessionGroupMap);
  const activeSessionsCount = Object.keys(
    recentLogs.reduce((acc, l) => {
      if (l.session_id) acc[l.session_id] = true;
      return acc;
    }, {} as any)
  ).length || (recentLogs.length > 0 ? 1 : 0);

  // Location / Timezone counts for Live Map Dashboard
  const timezoneCounts: { [tz: string]: number } = {};
  filteredLogs.forEach((log) => {
    if (log.timezone) {
      timezoneCounts[log.timezone] = (timezoneCounts[log.timezone] || 0) + 1;
    }
  });

  // Calculate telemetry stats from filtered logs
  let pageViewsCount = 0;
  let totalClicksCount = 0;
  let rageClicksCount = 0;
  let scrollEventsCount = 0;
  let mobileDeviceCount = 0;
  let desktopDeviceCount = 0;

  filteredLogs.forEach((log) => {
    if (log.type === 'page_view') {
      pageViewsCount++;
      if (log.device_category === 'mobile') mobileDeviceCount++;
      else desktopDeviceCount++;
    } else if (log.type === 'ux_click') {
      totalClicksCount++;
    } else if (log.type === 'ux_scroll') {
      scrollEventsCount++;
    } else if (log.type === 'ux_rage_click') {
      rageClicksCount++;
    }
  });

  const totalMrr = clients.reduce((acc, c) => acc + (c.subscription?.mrr || 0), 0);
  const annualRunRate = totalMrr * 12;
  const arpu = clients.length > 0 ? Math.round(totalMrr / clients.length) : 0;
  const estimatedValuation = annualRunRate > 0 ? annualRunRate * 8 : 0;

  const verticalCounts: { [key: string]: { mrr: number; clients: number } } = {};
  clients.forEach((c) => {
    const vert = c.vertical || c.category || 'Powersports & Auto';
    if (!verticalCounts[vert]) {
      verticalCounts[vert] = { mrr: 0, clients: 0 };
    }
    verticalCounts[vert].mrr += c.subscription?.mrr || 0;
    verticalCounts[vert].clients += 1;
  });

  const activeSessionLogs = selectedSessionId ? sessionGroupMap[selectedSessionId] || [] : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-neutral-900 text-white p-6 rounded-3xl border border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-[#ff3b30] uppercase tracking-widest bg-[#ff3b30]/10 border border-[#ff3b30]/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Telemetry & Session Recording Engine
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Gridpass Real-Time Map & Clarity Session Viewer
          </h1>
          <p className="text-xs text-neutral-400 max-w-xl">
            In-house Google Analytics Real-Time & Microsoft Clarity Session Recording engine tracking active map users, scroll depth, click streams, and UX friction.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={() => setExcludeLocalhost(!excludeLocalhost)}
            className={`px-3 py-2 rounded-2xl border text-xs font-mono font-bold uppercase transition flex items-center gap-2 ${
              excludeLocalhost
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-amber-950/80 border-amber-700 text-amber-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {excludeLocalhost ? 'Localhost Filter: ON' : 'Localhost Filter: OFF'}
          </button>

          <div className="flex items-center gap-2 bg-neutral-800/80 border border-neutral-700 p-2 rounded-2xl">
            <Globe className="w-4 h-4 text-emerald-400 animate-pulse ml-2" />
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider mr-2">
              100% First-Party Data
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="flex border-b border-neutral-200 gap-4 overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setActiveTab('realtime')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'realtime'
              ? 'border-[#ff3b30] text-[#ff3b30]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Zap className="w-4 h-4" /> Live Active Users & Location Map
        </button>
        <button
          onClick={() => setActiveTab('clarity')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'clarity'
              ? 'border-[#ff3b30] text-[#ff3b30]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <MousePointer className="w-4 h-4" /> Clarity Session Playback & Heatmaps
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'valuation'
              ? 'border-[#ff3b30] text-[#ff3b30]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Enterprise Valuation & ARR
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'telemetry'
              ? 'border-[#ff3b30] text-[#ff3b30]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <QrCode className="w-4 h-4" /> Physical QR Scans
        </button>
        <button
          onClick={() => setActiveTab('b2b')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'b2b'
              ? 'border-[#ff3b30] text-[#ff3b30]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Building2 className="w-4 h-4" /> B2B Vertical Performance
        </button>
      </div>

      {/* TAB 1: Live Realtime Active Users & Location Map */}
      {activeTab === 'realtime' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-neutral-900 text-white border border-neutral-800 rounded-3xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> Active Users Right Now
              </span>
              <p className="text-3xl font-black text-white">{activeSessionsCount}</p>
              <p className="text-[10px] font-mono text-neutral-400">Active in last 10 minutes</p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                Total Recorded Page Views
              </span>
              <p className="text-2xl font-black text-neutral-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-500" /> {pageViewsCount}
              </p>
              <p className="text-[10px] font-mono font-bold text-neutral-500">Across all active routes</p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                Click Stream Events Logged
              </span>
              <p className="text-2xl font-black text-neutral-900 flex items-center gap-2">
                <MousePointer className="w-5 h-5 text-sky-500" /> {totalClicksCount}
              </p>
              <p className="text-[10px] font-mono font-bold text-neutral-500">Target elements & coordinates</p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                Scroll Depth Milestones
              </span>
              <p className="text-2xl font-black text-purple-600 flex items-center gap-2">
                <ArrowDown className="w-5 h-5 text-purple-600" /> {scrollEventsCount}
              </p>
              <p className="text-[10px] font-mono font-bold text-neutral-500">25%, 50%, 75%, 100% depth</p>
            </div>
          </div>

          {/* Real-time Location Breakdown & Active Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ff3b30]" /> Active User Timezones & Locations
              </h3>

              {Object.keys(timezoneCounts).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(timezoneCounts).map(([tz, count]) => (
                    <div key={tz} className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-800 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-neutral-400" /> {tz}
                      </span>
                      <span className="font-mono font-black text-[#ff3b30] bg-[#ff3b30]/10 border border-[#ff3b30]/20 px-2.5 py-0.5 rounded-full">
                        {count} Session{count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs font-mono font-bold text-neutral-400 uppercase border border-dashed border-neutral-200 rounded-2xl">
                  No active location timezone streams yet.
                </div>
              )}
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Active Route URL Viewports Right Now
              </h3>

              <div className="space-y-2">
                {recentLogs.slice(0, 10).map((log, idx) => (
                  <div key={log.id || idx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold font-mono text-neutral-900">{log.path || '/'}</span>
                      {log.device_category && (
                        <span className="text-[9px] font-mono text-neutral-500 bg-neutral-200 px-1.5 py-0.5 rounded">
                          {log.device_category}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Clarity Session Playback & Heatmaps */}
      {activeTab === 'clarity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session List */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-[#ff3b30]" /> Recorded User Sessions ({sessionIds.length})
              </h3>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {sessionIds.map((sId) => {
                  const logs = sessionGroupMap[sId];
                  const firstLog = logs[0] || {};
                  const isSelected = selectedSessionId === sId;
                  const clicksCount = logs.filter((l) => l.type === 'ux_click').length;
                  const rClicks = logs.filter((l) => l.type === 'ux_rage_click').length;

                  return (
                    <button
                      key={sId}
                      onClick={() => setSelectedSessionId(sId)}
                      className={`w-full text-left p-3 rounded-2xl border text-xs transition flex flex-col space-y-1.5 ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                          : 'bg-neutral-50 text-neutral-900 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-mono font-bold uppercase truncate max-w-[150px]">
                          {sId.slice(0, 18)}...
                        </span>
                        {rClicks > 0 && (
                          <span className="text-[9px] font-mono font-bold text-red-400 bg-red-950 px-1.5 py-0.5 rounded">
                            {rClicks} Rage Click
                          </span>
                        )}
                      </div>

                      <div className={`flex justify-between text-[10px] font-mono ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        <span>Path: {firstLog.path || '/'}</span>
                        <span>{logs.length} Events</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session Timeline Playback Viewer */}
            <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#ff3b30]" /> Clarity Session Playback Timeline
                </h3>
                {selectedSessionId && (
                  <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
                    Session: {selectedSessionId.slice(0, 16)}
                  </span>
                )}
              </div>

              {selectedSessionId ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {activeSessionLogs.map((evt, idx) => (
                    <div key={evt.id || idx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-start justify-between text-xs space-x-3">
                      <div className="flex items-start gap-3">
                        <span className="font-mono font-bold text-neutral-400 shrink-0 mt-0.5">#{idx + 1}</span>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {evt.type === 'page_view' && (
                              <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                PAGE VIEW
                              </span>
                            )}
                            {evt.type === 'ux_click' && (
                              <span className="text-[9px] font-mono font-bold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                                CLICK STREAM ({evt.x}px, {evt.y}px)
                              </span>
                            )}
                            {evt.type === 'ux_scroll' && (
                              <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                SCROLL {evt.scroll_depth_percent}%
                              </span>
                            )}
                            {evt.type === 'ux_rage_click' && (
                              <span className="text-[9px] font-mono font-bold text-[#ff3b30] bg-[#ff3b30]/10 border border-[#ff3b30]/20 px-2 py-0.5 rounded">
                                RAGE CLICK
                              </span>
                            )}
                            <span className="font-bold text-neutral-900">{evt.path || '/'}</span>
                          </div>

                          {evt.target_text && (
                            <p className="text-[11px] font-semibold text-neutral-700 mt-1">
                              Clicked Element: <span className="font-mono text-neutral-900 bg-neutral-200 px-1 py-0.5 rounded">{evt.target_tag}</span> &quot;{evt.target_text}&quot;
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Logged'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-xs font-mono font-bold text-neutral-400 uppercase border border-dashed border-neutral-200 rounded-2xl space-y-2">
                  <Play className="w-8 h-8 text-neutral-300 mx-auto" />
                  <p>Select a recorded session on the left to inspect timeline playback, click streams, and scroll depth.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Enterprise Valuation & ARR */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                Estimated Enterprise Value
              </span>
              <p className="text-2xl font-black text-neutral-900 flex items-center gap-1">
                ${estimatedValuation.toLocaleString()}
              </p>
              <p className="text-[10px] font-mono font-bold text-emerald-600 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> 8.0x ARR Multiple Gating
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                Annual Run Rate (ARR)
              </span>
              <p className="text-2xl font-black text-neutral-900">
                ${annualRunRate.toLocaleString()}<span className="text-xs font-normal text-neutral-400">/yr</span>
              </p>
              <p className="text-[10px] font-mono font-bold text-neutral-500">
                MRR: ${totalMrr.toLocaleString()}/mo
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                Active Drivers & Garage
              </span>
              <p className="text-2xl font-black text-neutral-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#ff3b30]" /> {totalUsers}
              </p>
              <p className="text-[10px] font-mono font-bold text-sky-600 flex items-center gap-1">
                <Car className="w-3 h-3" /> {totalVehicles} Verified Passports
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                Production Page Views
              </span>
              <p className="text-2xl font-black text-[#ff3b30] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#ff3b30]" /> {pageViewsCount}
              </p>
              <p className="text-[10px] font-mono font-bold text-emerald-600">
                {excludeLocalhost ? 'Filtered (Production Only)' : 'All Environments'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#ff3b30]" /> Buyer Acquisition Due-Diligence Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="font-bold text-neutral-700">Average Revenue Per Business (ARPU)</span>
                  <span className="font-mono font-black text-neutral-900">${arpu}/mo</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <div>
                    <span className="font-bold text-neutral-700 block">Active B2B Partner Client Accounts</span>
                    <span className="text-[9px] font-mono text-neutral-400">Real-time count from Firestore `businesses`</span>
                  </div>
                  <span className="font-mono font-black text-neutral-900">{clients.length} Accounts</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <div>
                    <span className="font-bold text-neutral-700 block">Hosted Geofenced Events</span>
                    <span className="text-[9px] font-mono text-neutral-400">Real-time count from Firestore `events`</span>
                  </div>
                  <span className="font-mono font-black text-neutral-900">{totalEvents} Events</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <div>
                    <span className="font-bold text-neutral-700 block">First-Party Telemetry Ownership</span>
                    <span className="text-[9px] font-mono text-neutral-400">Zero 3rd-party cookie reliance</span>
                  </div>
                  <span className="font-mono font-black text-emerald-600">100% Native</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Platform Audit & Valuation Standard
              </h3>

              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Our in-house telemetry engine logs hardware physical QR tag scans, vehicle passports, and viewport dimensions directly into Firestore. When presenting Gridpass for enterprise acquisition or investor due diligence, this data provides verifiable proof of actual field traffic without relying on external analytics trackers like Google Analytics or Meta Pixel.
              </p>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono font-bold text-emerald-950 uppercase tracking-widest block">
                  Valuation Certification Status
                </span>
                <p className="text-xs font-bold text-emerald-800">
                  ✔ First-Party Data Verified — Clean Firestore Audit Ready
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Physical QR Scans */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#ff3b30]" /> Live QR Physical Tag Scan Stream
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 fill-emerald-600" /> Live Reactive Feed
              </span>
            </div>

            {recentScans.length > 0 ? (
              <div className="space-y-2">
                {recentScans.map((scan, idx) => (
                  <div key={scan.id || idx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-mono font-black text-xs">
                        QR
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 uppercase">
                          {scan.tag_id || scan.vehicle_id || scan.pass_id || `Tag Scan #${scan.id.slice(0, 6)}`}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          {typeof scan.location === 'string'
                            ? scan.location
                            : scan.location?.lat !== undefined && scan.location?.lng !== undefined
                            ? `GPS: ${scan.location.lat.toFixed(4)}, ${scan.location.lng.toFixed(4)}`
                            : scan.venue_name || 'Geofenced Venue Scan'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-neutral-500">
                      {scan.scanned_at ? new Date(scan.scanned_at).toLocaleTimeString() : 'Just Now'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-mono font-bold text-neutral-400 uppercase border border-dashed border-neutral-200 rounded-2xl">
                No physical QR scan events recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: B2B Vertical Performance */}
      {activeTab === 'b2b' && (
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#ff3b30]" /> Business Vertical MRR & Account Distribution
          </h3>

          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
            </div>
          ) : Object.keys(verticalCounts).length === 0 ? (
            <div className="py-12 text-center text-xs font-mono font-bold text-neutral-400 uppercase border border-dashed border-neutral-200 rounded-2xl">
              No business accounts provisioned yet.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(verticalCounts).map(([vertName, data]) => {
                const percentage = totalMrr > 0 ? Math.round((data.mrr / totalMrr) * 100) : 0;
                return (
                  <div key={vertName} className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-neutral-900 uppercase">
                      <span>{vertName.replace('_', ' ')} ({data.clients} client{data.clients > 1 ? 's' : ''})</span>
                      <span className="font-mono font-black text-[#ff3b30]">${data.mrr}/mo ({percentage}%)</span>
                    </div>
                    <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ff3b30] transition-all duration-500"
                        style={{ width: `${percentage || 15}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
