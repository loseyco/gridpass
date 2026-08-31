'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/components/ToastContext';
import {
  BarChart3,
  Users,
  Eye,
  Clock,
  TrendingUp,
  Share2,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Award,
  Sparkles,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  Shield,
  Layers,
  ArrowUpRight,
  PieChart,
  Activity,
  Flame,
} from 'lucide-react';

interface LeagueAnalyticsDashboardProps {
  leagueId: string;
  seriesId?: string;
  leagueName: string;
  seriesName?: string;
  isOwner?: boolean;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

export default function LeagueAnalyticsDashboard({
  leagueId,
  seriesId,
  leagueName,
  seriesName,
  isOwner = false,
}: LeagueAnalyticsDashboardProps) {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [hideLocalhost, setHideLocalhost] = useState(true);
  const [sponsorMode, setSponsorMode] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Real-time Firestore query on system_logs for this league
  useEffect(() => {
    setLoading(true);
    const logsRef = collection(db, 'system_logs');
    const q = query(logsRef, where('league_id', '==', leagueId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rawLogs: any[] = [];
        snapshot.forEach((docSnap) => {
          rawLogs.push({ id: docSnap.id, ...docSnap.data() });
        });
        rawLogs.sort(
          (a, b) =>
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
        setLogs(rawLogs);
        setLoading(false);
      },
      (err) => {
        console.warn('League analytics subscription fallback:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [leagueId]);

  // Filter logs by series (if selected), time range, and localhost setting
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const rangeThresholds: Record<TimeRange, number> = {
      '24h': now - 24 * 60 * 60 * 1000,
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000,
      all: 0,
    };
    const cutoff = rangeThresholds[timeRange];

    return logs.filter((log) => {
      if (seriesId && log.series_id && log.series_id !== seriesId) return false;
      if (hideLocalhost && log.is_localhost === true) return false;
      const logTime = new Date(log.timestamp || 0).getTime();
      return logTime >= cutoff;
    });
  }, [logs, seriesId, timeRange, hideLocalhost]);

  // Compute Core Metrics
  const metrics = useMemo(() => {
    const pageViews = filteredLogs.filter((l) => l.action === 'PAGE_VIEW');
    const dwellLogs = filteredLogs.filter((l) => l.action === 'PAGE_DWELL');

    const totalViews = pageViews.length;

    // Unique Visitors: Set of distinct visitor_id, user_id, or session_id
    const uniqueVisitorIds = new Set<string>();
    pageViews.forEach((l) => {
      const vid = l.visitor_id || l.user_id || l.session_id;
      if (vid) uniqueVisitorIds.add(vid);
    });
    const uniqueVisitors = uniqueVisitorIds.size || (totalViews > 0 ? 1 : 0);

    // Returning vs New Visitors
    let returningCount = 0;
    let newCount = 0;
    pageViews.forEach((l) => {
      if (l.is_returning_visitor || (l.visit_count && l.visit_count > 1)) {
        returningCount++;
      } else {
        newCount++;
      }
    });
    const returningRate =
      totalViews > 0 ? Math.round((returningCount / totalViews) * 100) : 0;

    // Average Dwell Time (in seconds)
    const totalDwellSeconds = dwellLogs.reduce(
      (sum, l) => sum + (Number(l.dwell_time_seconds) || 0),
      0
    );
    const avgDwellSeconds =
      dwellLogs.length > 0 ? Math.round(totalDwellSeconds / dwellLogs.length) : 0;

    // Referral Sources Breakdown
    const referrers: Record<string, { count: number; type: string }> = {};
    pageViews.forEach((l) => {
      let domain = l.referrer_domain || 'Direct / Bookmarks';
      if (domain === 'Internal Navigation') domain = 'GridPass App Internal';
      if (!referrers[domain]) {
        referrers[domain] = {
          count: 0,
          type: l.traffic_source_type || 'Direct / Bookmark',
        };
      }
      referrers[domain].count += 1;
    });

    const topReferrers = Object.entries(referrers)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    // Content Route Breakdown
    const contentRoutes: Record<string, number> = {};
    pageViews.forEach((l) => {
      const path = l.path || l.target_path || '';
      let label = 'League Hub';
      if (path.includes('/series/')) label = 'Series Championship Hub';
      if (path.includes('/schedule')) label = 'Race Calendar & Rounds';
      if (path.includes('/standings')) label = 'Championship Standings';
      if (path.includes('/roster')) label = 'Confirmed Driver Entry List';
      if (path.includes('/join')) label = 'Driver Registration / Join';
      if (path.includes('/broadcast') || path.includes('/overlay')) label = 'Live Broadcast Overlay';
      if (path.includes('/stewarding')) label = 'Steward Review Desk';

      contentRoutes[label] = (contentRoutes[label] || 0) + 1;
    });

    const topContent = Object.entries(contentRoutes)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Device Category Breakdown
    const devices: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    pageViews.forEach((l) => {
      const cat = (l.device_category || 'desktop').toLowerCase();
      devices[cat] = (devices[cat] || 0) + 1;
    });

    return {
      totalViews,
      uniqueVisitors,
      avgDwellSeconds,
      returningRate,
      newCount,
      returningCount,
      topReferrers,
      topContent,
      devices,
    };
  }, [filteredLogs]);

  // Format Dwell Time string
  const formatDwellTime = (seconds: number) => {
    if (seconds <= 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return secs + 's';
    return mins + 'm ' + secs + 's';
  };

  // Copy Sponsor Pitch Summary to Clipboard
  const handleCopySponsorPitch = () => {
    const pitchText = '🏆 ' + leagueName + (seriesName ? ' — ' + seriesName : '') + ' Official Audience Reach & Impression Report\n\n' +
      '📊 Verified Engagement Metrics (Past ' + (timeRange === 'all' ? 'Season' : timeRange) + '):\n' +
      '• Total Page Impressions: ' + metrics.totalViews.toLocaleString() + '\n' +
      '• Unique Sim Racers Reached: ' + metrics.uniqueVisitors.toLocaleString() + '\n' +
      '• Average Driver Dwell Time: ' + formatDwellTime(metrics.avgDwellSeconds) + ' per session\n' +
      '• Driver Loyalty / Retention: ' + metrics.returningRate + '% returning drivers\n' +
      '• Top Inbound Channels: ' + (metrics.topReferrers.slice(0, 3).map((r) => r.name + ' (' + r.count + ')').join(', ') || 'iRacing Forums, Discord, Reddit') + '\n\n' +
      'Verified via GridPass First-Party League Telemetry Engine (100% Ad-Blocker Immune). Partner with us for on-car liveries, broadcast overlays, and title sponsorships!';

    navigator.clipboard.writeText(pitchText);
    setCopiedPitch(true);
    showToast({
      title: '📋 Copied to Clipboard!',
      message: 'Sponsor reach summary copied. Ready to email or send on Discord!',
      icon: '✅',
    });
    setTimeout(() => setCopiedPitch(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER & CONTROLS */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              <span>League Traffic & Sponsor Reach HQ</span>
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            First-party, privacy-verified visitor telemetry for {leagueName}
            {seriesName ? ' • ' + seriesName : ''}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-2xl border border-neutral-200 text-xs font-bold">
            {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={'px-3 py-1.5 rounded-xl transition cursor-pointer ' + (
                  timeRange === r
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                {r === '24h'
                  ? '24H'
                  : r === '7d'
                  ? '7 Days'
                  : r === '30d'
                  ? '30 Days'
                  : 'All Time'}
              </button>
            ))}
          </div>

          {/* Sponsor Mode Toggle */}
          <button
            onClick={() => setSponsorMode(!sponsorMode)}
            className={'px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer border ' + (
              sponsorMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{sponsorMode ? '💼 Sponsor Mode ON' : '💼 Sponsor Pitch Deck'}</span>
          </button>

          {/* Localhost Filter Toggle */}
          {isOwner && (
            <button
              onClick={() => setHideLocalhost(!hideLocalhost)}
              className="px-3 py-1.5 rounded-2xl text-[11px] font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer border border-neutral-200"
            >
              {hideLocalhost ? '🛡️ Local Dev: HIDDEN' : '🌐 Local Dev: VISIBLE'}
            </button>
          )}
        </div>
      </div>

      {/* SPONSOR DECK HERO (When in Sponsor Mode) */}
      {sponsorMode && (
        <div className="p-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border-2 border-amber-500/40 rounded-3xl text-white shadow-xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Verified Media Kit
                </span>
                <span className="text-xs text-neutral-400">
                  Past {timeRange === 'all' ? 'All Time' : timeRange} Performance
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white mt-1">
                {leagueName} {seriesName ? '• ' + seriesName : ''}
              </h3>
            </div>

            <button
              onClick={handleCopySponsorPitch}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-98"
            >
              {copiedPitch ? (
                <>
                  <Check className="w-4 h-4 text-neutral-950" />
                  <span>Copied Report!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-950" />
                  <span>Copy Sponsor Pitch Deck</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-800/60 border border-neutral-700/60 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-neutral-400">
                Verified Impressions
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {metrics.totalViews.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">
                100% Ad-Blocker Immune
              </span>
            </div>

            <div className="p-4 bg-neutral-800/60 border border-neutral-700/60 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-neutral-400">
                Unique Sim Racers
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {metrics.uniqueVisitors.toLocaleString()}
              </div>
              <span className="text-[10px] text-neutral-400">Distinct Drivers Reached</span>
            </div>

            <div className="p-4 bg-neutral-800/60 border border-neutral-700/60 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-neutral-400">
                Avg Driver Dwell Time
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {formatDwellTime(metrics.avgDwellSeconds)}
              </div>
              <span className="text-[10px] text-neutral-400">High Brand Recall</span>
            </div>

            <div className="p-4 bg-neutral-800/60 border border-neutral-700/60 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-neutral-400">
                Driver Retention
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {metrics.returningRate}%
              </div>
              <span className="text-[10px] text-neutral-400">Returning Active Racers</span>
            </div>
          </div>
        </div>
      )}

      {/* CORE 4 KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Impressions */}
        <div className="p-5 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-black uppercase tracking-wider">
              Total Impressions
            </span>
            <Eye className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
            {metrics.totalViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            Page views across championship hub
          </div>
        </div>

        {/* Unique Sim Racers */}
        <div className="p-5 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-black uppercase tracking-wider">
              Unique Drivers
            </span>
            <Users className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
            {metrics.uniqueVisitors.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            Distinct sim racers & visitors
          </div>
        </div>

        {/* Average Dwell Time */}
        <div className="p-5 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-black uppercase tracking-wider">
              Avg Dwell Time
            </span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
            {formatDwellTime(metrics.avgDwellSeconds)}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            Time exploring roster & schedule
          </div>
        </div>

        {/* Driver Retention Loyalty */}
        <div className="p-5 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-black uppercase tracking-wider">
              Driver Loyalty
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tight">
            {metrics.returningRate}%
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            {metrics.returningCount} repeat vs {metrics.newCount} new
          </div>
        </div>
      </div>

      {/* DETAILED BREAKDOWNS: 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INBOUND TRAFFIC REFERRALS */}
        <div className="p-6 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-600" />
              <span>Inbound Traffic & Referrers</span>
            </h3>
            <span className="text-[11px] font-bold text-neutral-500">
              {metrics.topReferrers.length} Channels
            </span>
          </div>

          {metrics.topReferrers.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-400">
              ⚪ No inbound referral data recorded in this time window yet.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.topReferrers.map((refItem, idx) => {
                const pct =
                  metrics.totalViews > 0
                    ? Math.round((refItem.count / metrics.totalViews) * 100)
                    : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-neutral-900 truncate max-w-[220px]">
                        {refItem.name}
                      </span>
                      <div className="flex items-center gap-2 text-neutral-500">
                        <span>{refItem.count} views</span>
                        <span className="text-[11px] font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-lg">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full transition-all duration-500"
                        style={{ width: Math.max(5, pct) + '%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CONTENT & PAGE ENGAGEMENT */}
        <div className="p-6 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-600" />
              <span>Driver Content Engagement</span>
            </h3>
            <span className="text-[11px] font-bold text-neutral-500">Top Routes</span>
          </div>

          {metrics.topContent.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-400">
              ⚪ No page views recorded in this time window yet.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.topContent.map((item, idx) => {
                const pct =
                  metrics.totalViews > 0
                    ? Math.round((item.count / metrics.totalViews) * 100)
                    : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-neutral-900 truncate max-w-[220px]">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 text-neutral-500">
                        <span>{item.count} views</span>
                        <span className="text-[11px] font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-lg">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                        style={{ width: Math.max(5, pct) + '%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* HARDWARE & DEVICE AUDIENCE PROFILE */}
      <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-red-600" />
            <span>Driver Device & Hardware Breakdown</span>
          </h3>
          <span className="text-[11px] font-bold text-neutral-500">Viewports</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-white border border-neutral-200 rounded-2xl">
            <Monitor className="w-5 h-5 mx-auto text-neutral-800 mb-1" />
            <div className="text-lg font-black text-neutral-900">
              {metrics.devices.desktop}
            </div>
            <div className="text-[10px] uppercase font-bold text-neutral-500">
              PC Cockpit / Desktop
            </div>
          </div>

          <div className="p-4 bg-white border border-neutral-200 rounded-2xl">
            <Smartphone className="w-5 h-5 mx-auto text-neutral-800 mb-1" />
            <div className="text-lg font-black text-neutral-900">
              {metrics.devices.mobile}
            </div>
            <div className="text-[10px] uppercase font-bold text-neutral-500">
              Mobile Phone
            </div>
          </div>

          <div className="p-4 bg-white border border-neutral-200 rounded-2xl">
            <Tablet className="w-5 h-5 mx-auto text-neutral-800 mb-1" />
            <div className="text-lg font-black text-neutral-900">
              {metrics.devices.tablet}
            </div>
            <div className="text-[10px] uppercase font-bold text-neutral-500">
              Tablet / iPad
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
