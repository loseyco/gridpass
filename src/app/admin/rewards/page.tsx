'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import {

  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  updateDoc,
} from 'firebase/firestore';
import RuleModal, { RewardRule } from './RuleModal';
import RewardCatalogModal, { RewardCatalogItem } from './RewardCatalogModal';

export interface PointsLogEntry {
  id?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  actionKey: string;
  ruleTitle?: string;
  pointsAwarded: number;
  timestamp?: any;
  status: 'approved' | 'pending_review' | 'revoked';
  notes?: string;
  gpsLocation?: {
    lat: number;
    lng: number;
    withinFence?: boolean;
    distanceMeters?: number;
  };
}

export default function AdminRewardsPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'catalog' | 'ledger' | 'simulator'>('rules');

  // Real-time Firestore States
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [catalog, setCatalog] = useState<RewardCatalogItem[]>([]);
  const [logs, setLogs] = useState<PointsLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<RewardCatalogItem | null>(null);

  // Manual Points Award State
  const [manualAward, setManualAward] = useState({
    userId: '',
    userName: '',
    points: 10,
    actionKey: 'custom_award',
    notes: 'Admin manual points adjustment',
  });
  const [isManualAwardOpen, setIsManualAwardOpen] = useState(false);

  // Simulator State
  const [simTargetLat, setSimTargetLat] = useState('41.4721');
  const [simTargetLng, setSimTargetLng] = useState('-88.0834');
  const [simUserLat, setSimUserLat] = useState('41.4725');
  const [simUserLng, setSimUserLng] = useState('-88.0830');
  const [simFenceMeters, setSimFenceMeters] = useState('500');

  const [permissionError, setPermissionError] = useState(false);

  // 1. Subscribe to Firestore Collections
  useEffect(() => {
    setLoading(true);

    // Rules listener
    const unsubRules = onSnapshot(
      collection(db, 'reward_rules'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RewardRule));
        setRules(list);
        setLoading(false);
        setPermissionError(false);
      },
      (err) => {
        console.warn('Error loading reward_rules:', err);
        setLoading(false);
        if (err.code === 'permission-denied' || err.message?.includes('permissions')) {
          setPermissionError(true);
        }
      }
    );

    // Catalog listener
    const unsubCatalog = onSnapshot(
      collection(db, 'rewards_catalog'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RewardCatalogItem));
        setCatalog(list);
      },
      (err) => {
        console.warn('Error loading rewards_catalog:', err);
        if (err.code === 'permission-denied' || err.message?.includes('permissions')) {
          setPermissionError(true);
        }
      }
    );

    // Logs listener
    const qLogs = query(collection(db, 'points_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(
      qLogs,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PointsLogEntry));
        setLogs(list);
      },
      (err) => {
        console.warn('Error loading points_logs:', err);
        if (err.code === 'permission-denied' || err.message?.includes('permissions')) {
          setPermissionError(true);
        }
      }
    );

    return () => {
      unsubRules();
      unsubCatalog();
      unsubLogs();
    };
  }, []);


  // Handler: Save Rule
  const handleSaveRule = async (rule: RewardRule) => {
    if (rule.id) {
      await setDoc(doc(db, 'reward_rules', rule.id), {
        ...rule,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, 'reward_rules'), {
        ...rule,
        createdAt: serverTimestamp(),
      });
    }
  };

  // Handler: Seed Default Grid Credits Rules & Perks
  const handleSeedDefaults = async () => {
    if (!confirm('Seed default Grid Credits reward rules & perks (100 Grid Credits = $1.00 USD value)?')) return;
    
    // Seed Rules (Repeatable Quests + One-Time Achievements)
    const defaultRules: RewardRule[] = [
      {
        title: '🏆 Achievement: Join Gridpass (Welcome Bonus)',
        actionKey: 'achievement_join_gridpass',
        points: 250, // $2.50 USD value
        category: 'Achievement',
        requiresGps: false,
        geofenceRadiusMeters: 0,
        requiresPhoto: false,
        requiresApproval: false,
        cooldownMinutes: 0,
        oneTimeOnly: true,
        active: true,
        description: 'ONE-TIME FEAT OF STRENGTH: Join Gridpass and claim your 250 Grid Credits ($2.50 value) welcome bonus!',
      },
      {
        title: '🏁 Racetrack GPS Check-In',
        actionKey: 'track_checkin',

        points: 250, // $2.50 USD value
        category: 'Event',
        requiresGps: true,
        geofenceRadiusMeters: 500,
        requiresPhoto: false,
        requiresApproval: false,
        cooldownMinutes: 1440, // 24 hour cooldown
        oneTimeOnly: false,
        active: true,
        description: 'Earn 250 Grid Credits ($2.50 value) for verified GPS check-in at a racetrack or venue.',
      },
      {
        title: '📸 Paddock Vehicle Spot',
        actionKey: 'spot_vehicle',
        points: 50, // $0.50 USD value
        category: 'Spotting',
        requiresGps: false,
        geofenceRadiusMeters: 500,
        requiresPhoto: true,
        requiresApproval: false,
        cooldownMinutes: 30, // 30 minute anti-spam cooldown
        oneTimeOnly: false,
        active: true,
        description: 'Earn 50 Grid Credits ($0.50 value) for snapping and uploading a photo of a vehicle build.',
      },
      {
        title: '💬 Build Discussion & Comment',
        actionKey: 'comment_thread',
        points: 5, // $0.05 USD value
        category: 'Community',
        requiresGps: false,
        geofenceRadiusMeters: 0,
        requiresPhoto: false,
        requiresApproval: false,
        cooldownMinutes: 15, // 15 minute cooldown to prevent spam farming
        oneTimeOnly: false,
        active: true,
        description: 'Earn 5 Grid Credits ($0.05 value) for constructive comments on build logs.',
      },
      {
        title: '🏆 Achievement: Track Debut (First Check-In)',
        actionKey: 'achievement_first_checkin',
        points: 500, // $5.00 USD value
        category: 'Achievement',
        requiresGps: true,
        geofenceRadiusMeters: 500,
        requiresPhoto: false,
        requiresApproval: false,
        cooldownMinutes: 0,
        oneTimeOnly: true,
        active: true,
        description: 'ONE-TIME FEAT OF STRENGTH: Complete your very first racetrack GPS check-in on Gridpass.',
      },
      {
        title: '🏆 Achievement: Paddock Pioneer (First Spot)',
        actionKey: 'achievement_first_spot',
        points: 100, // $1.00 USD value
        category: 'Achievement',
        requiresGps: false,
        geofenceRadiusMeters: 0,
        requiresPhoto: true,
        requiresApproval: false,
        cooldownMinutes: 0,
        oneTimeOnly: true,
        active: true,
        description: 'ONE-TIME FEAT OF STRENGTH: Spot your first vehicle build at an event or meet.',
      },
      {
        title: '🔥 Daily Visit Login Bonus',
        actionKey: 'achievement_daily_login',
        points: 10, // $0.10 USD value
        category: 'Daily',
        requiresGps: false,
        geofenceRadiusMeters: 0,
        requiresPhoto: false,
        requiresApproval: false,
        cooldownMinutes: 1440,
        oneTimeOnly: false,
        active: true,
        description: 'Earn 10 Grid Credits ($0.10 value) every 24 hours just for opening and visiting Gridpass!',
      },
      {
        title: '🏆 Achievement: Garage Collector (3 Vehicles)',
        actionKey: 'achievement_garage_collector',
        points: 250, // $2.50 USD value
        category: 'Achievement',
        requiresGps: false,
        geofenceRadiusMeters: 0,
        requiresPhoto: false,
        requiresApproval: false,
        cooldownMinutes: 0,
        oneTimeOnly: true,
        active: true,
        description: 'ONE-TIME FEAT OF STRENGTH: Add 3 verified vehicles to your Gridpass Garage.',
      },
    ];



    // Seed Catalog Perks
    const defaultPerks: RewardCatalogItem[] = [
      {
        title: '🏅 VIP Paddock Pass Badge',
        pointsCost: 500, // $5.00 USD value
        rewardType: 'badge',
        badgeIcon: '🏅',
        description: 'Displays a verified VIP Paddock Pass badge on your public Member Resume (/u/[id]).',
        active: true,
        totalRedeemed: 0,
      },
      {
        title: '🎟️ $25 Shop Service & Dyno Credit',
        pointsCost: 2500, // $25.00 USD value
        rewardType: 'coupon',
        badgeIcon: '🎟️',
        description: 'Redeem 2,500 Grid Credits for a $25 credit toward shop tuning, dyno runs, or package upgrades.',
        active: true,
        totalRedeemed: 0,
      },
      {
        title: '🏆 Gold Podium Member Status',
        pointsCost: 1000, // $10.00 USD value
        rewardType: 'status_tier',
        badgeIcon: '🏆',
        description: 'Unlocks Tier 1 Gold Status framing across Gridpass leaderboards and event passes.',
        active: true,
        totalRedeemed: 0,
      },
    ];

    try {
      for (const rule of defaultRules) {
        await addDoc(collection(db, 'reward_rules'), {
          ...rule,
          createdAt: serverTimestamp(),
        });
      }

      for (const perk of defaultPerks) {
        await addDoc(collection(db, 'rewards_catalog'), {
          ...perk,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      console.error('Error seeding defaults:', err);
      alert('Cannot write to Firestore: Cloud Firestore security rules need to be deployed first (npx firebase deploy --only firestore:rules).');
    }
  };

  // Handler: Backdate Existing Users with Welcome Credits
  const handleBackdateUsers = async () => {
    if (!confirm('Scan all existing users and retroactively award 250 Grid Credits ($2.50 value) Join Welcome Bonus for any accounts missing it?')) return;

    try {
      const { getDocs, query, where } = await import('firebase/firestore');
      const usersSnap = await getDocs(collection(db, 'users'));
      let backdatedCount = 0;

      for (const userDoc of usersSnap.docs) {
        const uData = userDoc.data();
        const userId = userDoc.id;

        // Check if user already has an achievement_join_gridpass log entry
        const existingLogsQ = query(
          collection(db, 'points_logs'),
          where('userId', '==', userId),
          where('actionKey', '==', 'achievement_join_gridpass')
        );
        const existingSnap = await getDocs(existingLogsQ);

        if (existingSnap.empty) {
          await addDoc(collection(db, 'points_logs'), {
            userId: userId,
            userName: uData.display_name || uData.username || 'MEMBER',
            userEmail: uData.email || '',
            actionKey: 'achievement_join_gridpass',
            ruleTitle: '🏆 Achievement: Join Gridpass (Welcome Bonus)',
            pointsAwarded: 250,
            status: 'approved',
            notes: 'Retroactively backdated Join Gridpass Welcome Bonus',
            timestamp: serverTimestamp(),
          });
          backdatedCount++;
        }
      }

      alert(`Successfully backdated ${backdatedCount} user(s) with 250 Grid Credits ($2.50 value) Welcome Bonus!`);
    } catch (err: any) {
      console.error('Error backdating users:', err);
      alert('Error backdating users: ' + (err.message || String(err)));
    }
  };




  // Handler: Delete Rule
  const handleDeleteRule = async (id: string) => {

    if (!confirm('Are you sure you want to delete this reward rule?')) return;
    await deleteDoc(doc(db, 'reward_rules', id));
  };

  // Handler: Toggle Rule Active
  const handleToggleRuleActive = async (rule: RewardRule) => {
    if (!rule.id) return;
    await updateDoc(doc(db, 'reward_rules', rule.id), {
      active: !rule.active,
    });
  };

  // Handler: Save Catalog Perk
  const handleSaveCatalogItem = async (item: RewardCatalogItem) => {
    if (item.id) {
      await setDoc(doc(db, 'rewards_catalog', item.id), {
        ...item,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, 'rewards_catalog'), {
        ...item,
        totalRedeemed: 0,
        createdAt: serverTimestamp(),
      });
    }
  };

  // Handler: Delete Catalog Perk
  const handleDeleteCatalogItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this perk from the catalog?')) return;
    await deleteDoc(doc(db, 'rewards_catalog', id));
  };

  // Handler: Revoke Log Points
  const handleRevokePoints = async (logId: string) => {
    if (!confirm('Are you sure you want to revoke these awarded points?')) return;
    await updateDoc(doc(db, 'points_logs', logId), {
      status: 'revoked',
      revokedAt: serverTimestamp(),
    });
  };

  // Handler: Manual Points Award
  const handleManualPointsAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAward.userId.trim() || !manualAward.userName.trim()) return;

    await addDoc(collection(db, 'points_logs'), {
      userId: manualAward.userId.trim(),
      userName: manualAward.userName.trim(),
      actionKey: manualAward.actionKey,
      ruleTitle: 'Manual Admin Adjustment',
      pointsAwarded: manualAward.points,
      status: 'approved',
      notes: manualAward.notes,
      timestamp: serverTimestamp(),
    });

    setIsManualAwardOpen(false);
    setManualAward({
      userId: '',
      userName: '',
      points: 10,
      actionKey: 'custom_award',
      notes: 'Admin manual points adjustment',
    });
  };

  // GPS Haversine Distance Calculator
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const simDistance = calculateDistanceMeters(
    parseFloat(simTargetLat) || 0,
    parseFloat(simTargetLng) || 0,
    parseFloat(simUserLat) || 0,
    parseFloat(simUserLng) || 0
  );
  const simWithinFence = simDistance <= (parseFloat(simFenceMeters) || 500);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <h1 className="text-xl md:text-2xl font-black text-neutral-900 uppercase tracking-tight">
                Gamification & Grid Credits Engine
              </h1>
            </div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">
              Manage Grid Credits rules, GPS geofencing guardrails, redemption perks, and real-time audit logs.
            </p>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                activeTab === 'rules'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              📋 Rules ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                activeTab === 'catalog'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🎁 Perks Catalog ({catalog.length})
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                activeTab === 'ledger'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              📜 Audit Ledger ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                activeTab === 'simulator'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🌐 GPS Sandbox
            </button>
          </div>
        </div>

        {/* Currency Conversion Exchange Rate Banner */}
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-neutral-700">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>
              <strong>Economy Peg Invariant:</strong> 100 Grid Credits = <strong>$1.00 USD</strong> value (1 Credit = $0.01).
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBackdateUsers}
              className="px-3 py-1.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-[11px] rounded-lg transition"
            >
              ⚡ Backdate Users (+250 Credits)
            </button>
            <button
              onClick={handleSeedDefaults}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white font-black text-[11px] rounded-lg transition"
            >
              🌱 Seed Rules & Perks
            </button>
          </div>
        </div>

      </div>

      {/* Permission Warning Banner if Cloud Firestore rules need deployment */}
      {permissionError && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl space-y-2 text-amber-900 text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2 font-black text-sm text-amber-950">
            <span>⚠️</span> Cloud Firestore Security Rules Deployment Required
          </div>
          <p>
            Your local code has the updated match rules for <code className="bg-amber-100 px-1 rounded">reward_rules</code>, <code className="bg-amber-100 px-1 rounded">rewards_catalog</code>, and <code className="bg-amber-100 px-1 rounded">points_logs</code> in <code className="bg-amber-100 px-1 rounded">firestore.rules</code>.
          </p>
          <p className="text-[11px] text-amber-800">
            Deploying the rules to Firebase will resolve the <code className="font-mono">Missing or insufficient permissions</code> warning in your browser console.
          </p>
        </div>
      )}


      {/* TAB 1: REWARD RULES MANAGER */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-neutral-800 tracking-wider">
              Active Action Reward Rules
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleSeedDefaults}
                className="bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs px-3 py-2 rounded-xl transition"
              >
                🌱 Seed Defaults
              </button>
              <button
                onClick={() => {
                  setEditingRule(null);
                  setIsRuleModalOpen(true);
                }}
                className="bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
              >
                <span>➕</span> Add Reward Rule
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-500 font-bold">
              Loading reward rules from Firestore... ⏳
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center space-y-4">
              <span className="text-4xl">🎯</span>
              <p className="text-sm font-bold text-neutral-800">No reward rules configured yet.</p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Click <strong>"🌱 Seed 3 Balanced Rules & Perks"</strong> to automatically initialize <strong>Grid Credits</strong> (Track Check-ins = 250 Credits / $2.50, Car Spotting = 50 Credits / $0.50, Comments = 5 Credits / $0.05).
              </p>
              <button
                onClick={handleSeedDefaults}
                className="px-5 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs rounded-xl shadow-md transition"
              >
                🌱 Seed 3 Balanced Rules & Perks Now
              </button>
            </div>
          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`bg-neutral-50 p-4 rounded-xl border ${
                    rule.active ? 'border-neutral-200' : 'border-neutral-300 opacity-60'
                  } space-y-3 relative hover:border-neutral-300 transition`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-neutral-900">{rule.title}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            rule.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-200 text-neutral-600 border-neutral-300'
                          }`}
                        >
                          {rule.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono font-bold text-neutral-500 mt-0.5">
                        Key: <code className="bg-neutral-200 px-1 rounded">{rule.actionKey}</code>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-xl text-[#ff3b30] block">
                        +{rule.points} <span className="text-xs font-bold text-neutral-500">Pts</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-neutral-400">
                        {rule.category}
                      </span>
                    </div>
                  </div>

                  {/* Guardrails Pills */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    {rule.oneTimeOnly && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md font-black">
                        🏆 One-Time Achievement
                      </span>
                    )}
                    {rule.requiresGps && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                        📍 GPS Fence ({rule.geofenceRadiusMeters || 500}m)
                      </span>
                    )}

                    {rule.requiresPhoto && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md">
                        📸 Photo Required
                      </span>
                    )}
                    {rule.requiresApproval && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                        🛡️ Manual Admin Review
                      </span>
                    )}
                    {rule.cooldownMinutes > 0 && (
                      <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">
                        ⏱️ {rule.cooldownMinutes}m Cooldown
                      </span>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-xs">
                    <button
                      onClick={() => handleToggleRuleActive(rule)}
                      className="font-bold text-neutral-600 hover:text-neutral-900"
                    >
                      {rule.active ? '⏸️ Disable Rule' : '▶️ Enable Rule'}
                    </button>
                    <div className="flex gap-2 font-bold">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setIsRuleModalOpen(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => rule.id && handleDeleteRule(rule.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REWARDS & PERKS CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-neutral-800 tracking-wider">
              Redeemable Perks & Status Badges
            </h2>
            <button
              onClick={() => {
                setEditingCatalogItem(null);
                setIsCatalogModalOpen(true);
              }}
              className="bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
            >
              <span>➕</span> Add Catalog Perk
            </button>
          </div>

          {catalog.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center space-y-3">
              <span className="text-3xl">🎁</span>
              <p className="text-sm font-bold text-neutral-800">No perks in catalog yet.</p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Add badges, VIP paddock passes, or shop discount coupons members can unlock with their points.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {catalog.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl p-2 bg-neutral-100 rounded-xl">{item.badgeIcon}</span>
                      <span className="font-black text-sm text-[#ff3b30] bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl">
                        {item.pointsCost} Pts
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-neutral-900 text-sm">{item.title}</h3>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-[10px] font-black uppercase text-neutral-400">
                      Type: {item.rewardType}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCatalogItem(item);
                          setIsCatalogModalOpen(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => item.id && handleDeleteCatalogItem(item.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-neutral-800 tracking-wider">
              Real-Time Points Audit Ledger
            </h2>
            <button
              onClick={() => setIsManualAwardOpen(true)}
              className="bg-neutral-900 hover:bg-black text-white font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
            >
              <span>⚡</span> Manual Points Adjustment
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center space-y-3">
              <span className="text-3xl">📜</span>
              <p className="text-sm font-bold text-neutral-800">Audit ledger is empty.</p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                No point activity recorded yet. As members check in or spot vehicles, live transaction logs will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Action / Rule</th>
                      <th className="py-3 px-4">Points</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">GPS Audit</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50 transition">
                        <td className="py-3 px-4 font-bold text-neutral-900">
                          {log.userName}
                          <span className="block text-[10px] font-mono text-neutral-400 font-normal">
                            ID: {log.userId}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {log.ruleTitle || log.actionKey}
                          <span className="block text-[10px] text-neutral-400 font-mono">
                            {log.actionKey}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-[#ff3b30] text-sm">
                          +{log.pointsAwarded} Pts
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              log.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : log.status === 'revoked'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-neutral-500 font-mono">
                          {log.gpsLocation ? (
                            <span>
                              📍 {log.gpsLocation.lat.toFixed(4)}, {log.gpsLocation.lng.toFixed(4)}
                              {log.gpsLocation.distanceMeters !== undefined && (
                                <span className="block text-[9px] text-neutral-400">
                                  {log.gpsLocation.distanceMeters}m from venue target
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {log.status === 'approved' && log.id && (
                            <button
                              onClick={() => log.id && handleRevokePoints(log.id)}
                              className="text-red-600 hover:underline font-bold text-[11px]"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GPS GEOFENCE SANDBOX */}
      {activeTab === 'simulator' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-5">
          <div>
            <h2 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
              🌐 GPS Geofence Distance & Radius Simulator
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Verify Haversine mathematical distance calculation between user coordinates and target venue/track coordinates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            {/* Target Venue Coordinates */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
              <p className="font-black text-neutral-800 uppercase tracking-wider text-[11px]">
                🏁 Target Racetrack / Venue Position
              </p>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 mb-1">Latitude</label>
                <input
                  type="text"
                  value={simTargetLat}
                  onChange={(e) => setSimTargetLat(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 mb-1">Longitude</label>
                <input
                  type="text"
                  value={simTargetLng}
                  onChange={(e) => setSimTargetLng(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 mb-1">Geofence Radius (Meters)</label>
                <input
                  type="number"
                  value={simFenceMeters}
                  onChange={(e) => setSimFenceMeters(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white font-mono font-bold text-[#ff3b30]"
                />
              </div>
            </div>

            {/* Simulated User Position */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
              <p className="font-black text-neutral-800 uppercase tracking-wider text-[11px]">
                📱 Simulated Driver GPS Position
              </p>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 mb-1">Driver Latitude</label>
                <input
                  type="text"
                  value={simUserLat}
                  onChange={(e) => setSimUserLat(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 mb-1">Driver Longitude</label>
                <input
                  type="text"
                  value={simUserLng}
                  onChange={(e) => setSimUserLng(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white font-mono font-bold"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    // Set user position very close to target for quick test
                    setSimUserLat((parseFloat(simTargetLat) + 0.0002).toString());
                    setSimUserLng((parseFloat(simTargetLng) + 0.0002).toString());
                  }}
                  className="w-full py-2 bg-neutral-200 hover:bg-neutral-300 font-bold rounded-lg transition text-neutral-800"
                >
                  📍 Move User Within Geofence
                </button>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              simWithinFence
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <div>
              <span className="font-black text-sm uppercase block">
                {simWithinFence ? '✅ GPS GEOFENCE PASSED' : '❌ OUTSIDE GEOFENCE RADIUS'}
              </span>
              <p className="text-xs mt-0.5 font-medium">
                Calculated Distance: <strong>{simDistance} meters</strong> (Limit: {simFenceMeters}m)
              </p>
            </div>
            <span className="text-3xl">{simWithinFence ? '🎯' : '🚫'}</span>
          </div>
        </div>
      )}

      {/* MODAL: Edit / Add Rule */}
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={handleSaveRule}
        initialRule={editingRule}
      />

      {/* MODAL: Edit / Add Catalog Perk */}
      <RewardCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        onSave={handleSaveCatalogItem}
        initialItem={editingCatalogItem}
      />

      {/* MODAL: Manual Points Award */}
      {isManualAwardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-black text-lg text-neutral-900 uppercase">
                ⚡ Manual Points Adjustment
              </h3>
              <button
                type="button"
                onClick={() => setIsManualAwardOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 font-black text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualPointsAward} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-neutral-600 mb-1">Target User ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user_marcus_123"
                  value={manualAward.userId}
                  onChange={(e) => setManualAward({ ...manualAward, userId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-neutral-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">User Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={manualAward.userName}
                  onChange={(e) => setManualAward({ ...manualAward, userName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-neutral-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Points Amount *</label>
                <input
                  type="number"
                  required
                  value={manualAward.points}
                  onChange={(e) => setManualAward({ ...manualAward, points: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-xl bg-neutral-50 font-bold text-base text-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Adjustment Reason / Notes</label>
                <input
                  type="text"
                  value={manualAward.notes}
                  onChange={(e) => setManualAward({ ...manualAward, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-neutral-50"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualAwardOpen(false)}
                  className="flex-1 py-2 rounded-xl border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#ff3b30] text-white font-black hover:bg-[#bd2925]"
                >
                  Award Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
