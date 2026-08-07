'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { Trophy, Award, CheckCircle2, Lock, Zap, Shield, Sparkles, ChevronRight, Gift, MapPin, Camera, MessageSquare } from 'lucide-react';

export interface RewardRule {
  id?: string;
  title: string;
  actionKey: string;
  points: number;
  category: string;
  requiresGps: boolean;
  geofenceRadiusMeters: number;
  requiresPhoto: boolean;
  requiresApproval: boolean;
  cooldownMinutes: number;
  oneTimeOnly?: boolean;
  badgeIcon?: string;
  active: boolean;
  description?: string;
}

export interface RewardCatalogItem {
  id?: string;
  title: string;
  pointsCost: number;
  rewardType: 'badge' | 'coupon' | 'physical_perk' | 'status_tier';
  badgeIcon: string;
  description: string;
  active: boolean;
  totalRedeemed?: number;
}

export interface UserPointsLog {
  id?: string;
  userId: string;
  actionKey: string;
  ruleTitle?: string;
  pointsAwarded: number;
  timestamp?: any;
  status: string;
}

export default function UserAchievementsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'achievements' | 'quests' | 'rewards'>('achievements');
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [catalog, setCatalog] = useState<RewardCatalogItem[]>([]);
  const [userLogs, setUserLogs] = useState<UserPointsLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firestore Listeners
  useEffect(() => {
    // 1. Listen to Reward Rules (Achievements & Quests)
    const unsubRules = onSnapshot(
      collection(db, 'reward_rules'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RewardRule));
        setRules(list);
        setLoading(false);
      },
      (err) => console.warn('Error loading rules:', err)
    );

    // 2. Listen to Rewards Catalog
    const unsubCatalog = onSnapshot(
      collection(db, 'rewards_catalog'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RewardCatalogItem));
        setCatalog(list);
      },
      (err) => console.warn('Error loading catalog:', err)
    );

    return () => {
      unsubRules();
      unsubCatalog();
    };
  }, []);

  // 3. Listen to Current User's Points Audit Logs
  useEffect(() => {
    if (!user) return;
    const qUserLogs = query(
      collection(db, 'points_logs'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubUserLogs = onSnapshot(
      qUserLogs,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserPointsLog));
        setUserLogs(list);
      },
      (err) => console.warn('Error loading user points logs:', err)
    );

    return () => unsubUserLogs();
  }, [user]);

  // Calculate User Economy Metrics
  const totalEarnedCredits = userLogs
    .filter((l) => l.status === 'approved')
    .reduce((sum, log) => sum + (log.pointsAwarded || 0), 0);

  const dollarValue = (totalEarnedCredits / 100).toFixed(2);

  // Completed Action Keys set for one-time achievements
  const completedActionKeys = new Set(
    userLogs.filter((l) => l.status === 'approved').map((l) => l.actionKey)
  );

  const achievements = rules.filter((r) => r.oneTimeOnly || r.category === 'Achievement');
  const quests = rules.filter((r) => !r.oneTimeOnly && r.category !== 'Achievement');

  const completedAchievementsCount = achievements.filter((a) =>
    completedActionKeys.has(a.actionKey)
  ).length;

  const achievementPct = achievements.length > 0
    ? Math.round((completedAchievementsCount / achievements.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-md md:max-w-3xl mx-auto space-y-6">

          {/* Top Hero Balance Header */}
          <div className="bg-[#1c1c1e] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#ff3b30]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span className="text-xs font-black uppercase tracking-widest text-[#ff3b30]">
                  Gridpass Achievements HQ
                </span>
              </div>
              <Link
                href="/dash"
                className="text-[11px] font-bold text-neutral-400 hover:text-white transition"
              >
                ← Back to Dashboard
              </Link>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-neutral-800">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Total Grid Credits Earned
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {totalEarnedCredits.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-[#ff3b30]">Credits</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Dollar Value (100 = $1)
                </p>
                <span className="text-xl font-black text-emerald-400">
                  ${dollarValue} <span className="text-xs font-normal text-emerald-500">USD</span>
                </span>
              </div>
            </div>

            {/* WoW-Style Achievement Completion Bar */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-neutral-300">Achievement Completion Score</span>
                <span className="text-[#ff3b30] font-black">
                  {completedAchievementsCount} / {achievements.length} ({achievementPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff3b30] to-amber-400 transition-all duration-500 rounded-full"
                  style={{ width: `${achievementPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200 text-xs font-black">
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'achievements'
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-[#ff3b30]" />
              <span>Achievements ({achievements.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('quests')}
              className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'quests'
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Quests & Tasks ({quests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'rewards'
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Gift className="w-4 h-4 text-purple-600" />
              <span>Perks Store ({catalog.length})</span>
            </button>
          </div>

          {/* TAB 1: ONE-TIME ACHIEVEMENTS (WoW FEATS OF STRENGTH) */}
          {activeTab === 'achievements' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                  One-Time Feats of Strength
                </h2>
                <span className="text-[11px] font-bold text-neutral-400">
                  {completedAchievementsCount} Unlocked
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-neutral-500 font-bold">
                  Loading achievements... ⏳
                </div>
              ) : achievements.length === 0 ? (
                <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200 text-center space-y-2">
                  <p className="text-sm font-bold text-neutral-800">No achievements available yet.</p>
                  <p className="text-xs text-neutral-500">Check back soon for new track day & build quests!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {achievements.map((ach) => {
                    const isUnlocked = completedActionKeys.has(ach.actionKey);

                    return (
                      <div
                        key={ach.id || ach.title}
                        className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          isUnlocked
                            ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                            : 'bg-neutral-50 border-neutral-200 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                              isUnlocked
                                ? 'bg-amber-400 text-neutral-900 shadow-md ring-2 ring-amber-300'
                                : 'bg-neutral-200 text-neutral-400'
                            }`}
                          >
                            {ach.badgeIcon || '🏆'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-sm text-neutral-900">{ach.title}</h3>
                              {isUnlocked ? (
                                <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                  <CheckCircle2 className="w-3 h-3" /> Unlocked
                                </span>
                              ) : (
                                <span className="bg-neutral-200 text-neutral-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Locked
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">
                              {ach.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-base text-[#ff3b30] block">
                            +{ach.points}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                            Credits
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REPEATABLE DAILY QUESTS */}
          {activeTab === 'quests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                  Repeatable Quests & Action Tasks
                </h2>
                <span className="text-[11px] font-bold text-neutral-400">Earn Daily Credits</span>
              </div>

              {quests.length === 0 ? (
                <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200 text-center">
                  <p className="text-sm font-bold text-neutral-800">No active quests.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quests.map((q) => (
                    <div
                      key={q.id || q.title}
                      className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex items-center justify-between gap-3 hover:border-neutral-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-lg shadow-xs shrink-0">
                          {q.requiresGps ? '📍' : q.requiresPhoto ? '📸' : '💬'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm text-neutral-900">{q.title}</h3>
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-700">
                              {q.category}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 mt-0.5">{q.description}</p>
                          <div className="flex gap-2 text-[10px] text-neutral-500 mt-1 font-semibold">
                            {q.requiresGps && <span>• GPS Radius ({q.geofenceRadiusMeters}m)</span>}
                            {q.cooldownMinutes > 0 && <span>• {q.cooldownMinutes}m Cooldown</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-base text-[#ff3b30] block">
                          +{q.points}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                          Credits (${(q.points / 100).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERKS STORE */}
          {activeTab === 'rewards' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                  Redeemable Perks & Package Credits
                </h2>
                <span className="text-[11px] font-bold text-emerald-600 font-mono">
                  Balance: {totalEarnedCredits} Credits
                </span>
              </div>

              {catalog.length === 0 ? (
                <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200 text-center">
                  <p className="text-sm font-bold text-neutral-800">No perks available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {catalog.map((item) => {
                    const canAfford = totalEarnedCredits >= item.pointsCost;

                    return (
                      <div
                        key={item.id || item.title}
                        className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 bg-white rounded-xl border border-neutral-200 shadow-xs">
                            {item.badgeIcon}
                          </span>
                          <div>
                            <h3 className="font-black text-sm text-neutral-900">{item.title}</h3>
                            <p className="text-xs text-neutral-600 mt-0.5">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200">
                          <span className="font-black text-base text-[#ff3b30]">
                            {item.pointsCost} <span className="text-xs font-bold text-neutral-500">Credits</span>
                          </span>

                          <button
                            disabled={!canAfford}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                              canAfford
                                ? 'bg-[#ff3b30] hover:bg-[#bd2925] text-white shadow-sm'
                                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'Redeem Perk' : 'Need More Credits'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
