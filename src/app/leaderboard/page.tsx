'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs } from 'firebase/firestore';
import { 
  Trophy, Medal, ArrowLeft, Loader2, Award, 
  Car, Camera, Flame, Sparkles, User, Zap, Search
} from 'lucide-react';

interface DriverLeaderboardEntry {
  uid: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  is_supporter?: boolean;
  total_credits: number;
  usd_value: string;
  achievements_count: number;
  vehicles_count: number;
  spots_count: number;
  rank?: number;
}

export default function LeaderboardPage() {
  const { loading: authLoading } = useAuth();
  
  // Tabs: 'credits' | 'achievements' | 'vehicles' | 'spots'
  const [activeTab, setActiveTab] = useState<'credits' | 'achievements' | 'vehicles' | 'spots'>('credits');
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState<DriverLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadLeaderboardData() {
      if (isMock) {
        await new Promise((r) => setTimeout(r, 100));
        const mockData: DriverLeaderboardEntry[] = [
          {
            uid: 'YOYN2HDCwqXc3OYsHd8mdJIwr9K2',
            display_name: 'PJ LOSEY',
            username: 'pjlosey',
            avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocITjk-UWkYaGm1YXNsQYZSKw7TRD4gt1zU7QX79t4VL2zOmGKFhtA=s96-c',
            is_supporter: true,
            total_credits: 500,
            usd_value: '$5.00',
            achievements_count: 3,
            vehicles_count: 8,
            spots_count: 12,
          },
          {
            uid: 'Ac1Y9KusNhQMry0cLpukXdKxAg13',
            display_name: 'KRIS_TIN_A',
            username: 'kristina',
            avatar_url: '',
            is_supporter: true,
            total_credits: 250,
            usd_value: '$2.50',
            achievements_count: 1,
            vehicles_count: 0,
            spots_count: 4,
          },
        ];
        if (isMounted) {
          setDrivers(mockData);
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch all users, vehicles, and points_logs to calculate live leaderboard
        const [usersSnap, vehiclesSnap, pointsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'vehicles')),
          getDocs(collection(db, 'points_logs')),
        ]);

        const vehiclesByOwner: Record<string, number> = {};
        vehiclesSnap.docs.forEach((doc) => {
          const owner = doc.data().owner_id || doc.data().owner_uid;
          if (owner) {
            vehiclesByOwner[owner] = (vehiclesByOwner[owner] || 0) + 1;
          }
        });

        const creditsByUser: Record<string, number> = {};
        const achievementsByUser: Record<string, number> = {};

        pointsSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (d.status === 'approved' && d.userId) {
            creditsByUser[d.userId] = (creditsByUser[d.userId] || 0) + (d.pointsAwarded || 0);
            if (d.actionKey?.startsWith('achievement_')) {
              achievementsByUser[d.userId] = (achievementsByUser[d.userId] || 0) + 1;
            }
          }
        });

        const driverList: DriverLeaderboardEntry[] = usersSnap.docs
          .map((uDoc) => {
            const data = uDoc.data();
            const uid = uDoc.id;
            const credits = creditsByUser[uid] || 0;

            return {
              uid: uid,
              display_name: data.display_name || data.displayName || data.name || 'Anonymous Driver',
              username: data.username || uid.slice(0, 8),
              avatar_url: data.avatar_url || data.photoUrl || '',
              is_supporter: data.is_supporter === true || data.is_gold === true,
              total_credits: credits,
              usd_value: `$${(credits / 100).toFixed(2)}`,
              achievements_count: achievementsByUser[uid] || 0,
              vehicles_count: vehiclesByOwner[uid] || 0,
              spots_count: data.spots_submitted || 0,
              _is_test: (
                uid.startsWith('staff_inv_test') ||
                uid.startsWith('GPTestUser') ||
                (data.display_name && data.display_name.toLowerCase().includes('gptestuser')) ||
                (data.display_name && data.display_name.toLowerCase().includes('test user')) ||
                (data.display_name && data.display_name.toLowerCase().includes('sales rep')) ||
                (data.email && data.email.toLowerCase().includes('salesrep@gridpass.app'))
              )
            };
          })
          .filter(d => !d._is_test);

        if (isMounted) {
          setDrivers(driverList);
        }
      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLeaderboardData();
    return () => {
      isMounted = false;
    };
  }, [authLoading, isMock]);

  // Sort drivers based on active tab
  const sortedDrivers = [...drivers].sort((a, b) => {
    if (activeTab === 'credits') return b.total_credits - a.total_credits;
    if (activeTab === 'achievements') return b.achievements_count - a.achievements_count;
    if (activeTab === 'vehicles') return b.vehicles_count - a.vehicles_count;
    if (activeTab === 'spots') return b.spots_count - a.spots_count;
    return 0;
  }).map((d, index) => ({ ...d, rank: index + 1 }));

  // Search filter
  const filteredDrivers = sortedDrivers.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return d.display_name.toLowerCase().includes(q) || d.username.toLowerCase().includes(q);
  });

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1c1c1e] flex flex-col font-sans">
      <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dash"
            className="text-xs font-bold text-neutral-500 hover:text-neutral-900 uppercase flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#ff3b30]" /> Back to Dash
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dash/achievements"
              className="text-xs font-black uppercase text-[#ff3b30] hover:underline"
            >
              Achievements HQ →
            </Link>
          </div>
        </div>

        {/* Page Banner */}
        <div className="bg-neutral-900 text-white p-6 rounded-3xl border border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                Gridpass Driver Leaderboard
              </h1>
            </div>
            <p className="text-xs text-neutral-400 font-medium">
              Compete for top Grid Credits earnings, completed Feats of Strength, and active garage builds.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase text-neutral-300 block">Economy Peg</span>
            <span className="text-xs font-black text-amber-400">100 Credits = $1.00 USD</span>
          </div>
        </div>

        {/* Tab Selection & Search */}
        <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
            <button
              onClick={() => setActiveTab('credits')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'credits'
                  ? 'bg-[#ff3b30] text-white font-black'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Grid Credits
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'achievements'
                  ? 'bg-[#ff3b30] text-white font-black'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Feats Unlocked
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'vehicles'
                  ? 'bg-[#ff3b30] text-white font-black'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" /> Garage Collector
            </button>
            <button
              onClick={() => setActiveTab('spots')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'spots'
                  ? 'bg-[#ff3b30] text-white font-black'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Spotters
            </button>
          </div>

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search driver name or handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 text-xs font-bold pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
        </div>

        {/* Podium Top 3 Cards */}
        {filteredDrivers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredDrivers.slice(0, 3).map((driver) => {
              const isFirst = driver.rank === 1;
              const isSecond = driver.rank === 2;
              const isThird = driver.rank === 3;

              return (
                <div
                  key={driver.uid}
                  className={`bg-neutral-50 border rounded-3xl p-5 text-center relative flex flex-col items-center justify-between space-y-4 transition-transform hover:-translate-y-0.5 ${
                    isFirst
                      ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/40'
                      : isSecond
                      ? 'border-neutral-300 bg-neutral-100/40'
                      : 'border-amber-700/30 bg-amber-900/5'
                  }`}
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-black text-xs border shadow-xs ${
                      isFirst
                        ? 'bg-amber-400 border-amber-300 text-neutral-950'
                        : isSecond
                        ? 'bg-neutral-300 border-neutral-200 text-neutral-900'
                        : 'bg-amber-800 border-amber-700 text-white'
                    }`}
                  >
                    #{driver.rank}
                  </div>

                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-full overflow-hidden border-2 bg-white flex items-center justify-center ${
                        driver.is_supporter ? 'border-amber-400 gold-glow-ring' : 'border-neutral-200'
                      }`}
                    >
                      {driver.avatar_url ? (
                        <img src={driver.avatar_url} alt={driver.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-neutral-400" />
                      )}
                    </div>
                    {driver.is_supporter && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-400 text-neutral-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        GOLD
                      </span>
                    )}
                  </div>

                  {/* Driver Info */}
                  <div className="space-y-0.5 min-w-0 w-full">
                    <Link
                      href={`/u/${driver.username || driver.uid}`}
                      className="font-black text-sm uppercase text-neutral-900 hover:text-[#ff3b30] transition truncate block"
                    >
                      {driver.display_name}
                    </Link>
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                      @{driver.username}
                    </span>
                  </div>

                  {/* Primary Metric Pill */}
                  <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-xl font-mono text-xs font-black w-full flex items-center justify-center gap-1.5">
                    {activeTab === 'credits' && (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>{driver.total_credits} Pts</span>
                        <span className="text-[10px] text-neutral-400">({driver.usd_value})</span>
                      </>
                    )}
                    {activeTab === 'achievements' && (
                      <>
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>{driver.achievements_count} Feats</span>
                      </>
                    )}
                    {activeTab === 'vehicles' && (
                      <>
                        <Car className="w-3.5 h-3.5 text-[#ff3b30]" />
                        <span>{driver.vehicles_count} Vehicles</span>
                      </>
                    )}
                    {activeTab === 'spots' && (
                      <>
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{driver.spots_count} Spots</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Table View for Drivers */}
        <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-neutral-800">
                  <th className="p-3 w-12 text-center">RANK</th>
                  <th className="p-3">DRIVER NAME</th>
                  <th className="p-3">HANDLE</th>
                  <th className="p-3 text-center">CREDITS (USD)</th>
                  <th className="p-3 text-center">FEATS</th>
                  <th className="p-3 text-center">GARAGE</th>
                  <th className="p-3 text-right">PASSPORT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                      No drivers match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver, idx) => (
                    <tr
                      key={driver.uid}
                      className={`transition ${
                        idx % 2 === 0 ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50/50 hover:bg-neutral-100/80'
                      }`}
                    >
                      <td className="p-3 text-center font-black text-neutral-900 font-mono">
                        #{driver.rank}
                      </td>

                      <td className="p-3 font-extrabold text-neutral-900 whitespace-nowrap">
                        <Link
                          href={`/u/${driver.username || driver.uid}`}
                          className="hover:text-[#ff3b30] flex items-center gap-2"
                        >
                          {driver.display_name}
                          {driver.is_supporter && (
                            <span className="bg-amber-400 text-neutral-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                              GOLD
                            </span>
                          )}
                        </Link>
                      </td>

                      <td className="p-3 text-neutral-500 font-bold text-[11px] whitespace-nowrap">
                        @{driver.username}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="bg-amber-50 border border-amber-200 text-amber-900 font-black px-2 py-0.5 rounded-full text-[11px]">
                          ⚡ {driver.total_credits} ({driver.usd_value})
                        </span>
                      </td>

                      <td className="p-3 text-center font-bold text-neutral-800">
                        {driver.achievements_count}
                      </td>

                      <td className="p-3 text-center font-bold text-neutral-800">
                        {driver.vehicles_count}
                      </td>

                      <td className="p-3 text-right">
                        <Link
                          href={`/u/${driver.username || driver.uid}`}
                          className="text-[10px] font-extrabold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-200 transition"
                        >
                          Profile ↗
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
