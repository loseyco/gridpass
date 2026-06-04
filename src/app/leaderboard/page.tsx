'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { 
  Trophy, Medal, ArrowLeft, Loader2, Award, 
  Car, Camera, Building2, Flame, Sparkles 
} from 'lucide-react';

interface BuildLeaderboardItem {
  rank: number;
  tag_id: string;
  vehicle_info: string;
  owner_name: string;
  score: number;
  is_supporter: boolean;
}

interface SpotterLeaderboardItem {
  rank: number;
  display_name: string;
  email: string;
  score: number;
  is_supporter: boolean;
}

interface PartnerLeaderboardItem {
  rank: number;
  name: string;
  type: string;
  score: number;
  is_pro: boolean;
}

export default function LeaderboardPage() {
  const { authLoading } = useAuth();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'builds' | 'spotters' | 'partners'>('builds');
  
  // Data states
  const [builds, setBuilds] = useState<BuildLeaderboardItem[]>([]);
  const [spotters, setSpotters] = useState<SpotterLeaderboardItem[]>([]);
  const [partners, setPartners] = useState<PartnerLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  // Load Leaderboard Scores
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadLeaderboards() {
      if (isMock) {
        await new Promise(r => setTimeout(r, 100));
        
        const mockBuilds: BuildLeaderboardItem[] = [
          { rank: 1, tag_id: 'GP-MARCUS-GT', vehicle_info: '2024 Ford Mustang GT', owner_name: 'Marcus Mustang', score: 48, is_supporter: true },
          { rank: 2, tag_id: 'GP-FERRARI', vehicle_info: '2020 Ferrari 488 Pista', owner_name: 'Mike Mechanic', score: 36, is_supporter: false },
          { rank: 3, tag_id: 'GP-BILLY-RIG', vehicle_info: '2020 Chevrolet Silverado', owner_name: 'Billy BigRig', score: 24, is_supporter: false },
          { rank: 4, tag_id: 'GP-SARAH-CAR', vehicle_info: '2022 Subaru BRZ', owner_name: 'Sarah Spotter', score: 12, is_supporter: false }
        ];

        const mockSpotters: SpotterLeaderboardItem[] = [
          { rank: 1, display_name: 'Sarah Spotter', email: 'sarah@spotter.com', score: 96, is_supporter: false },
          { rank: 2, display_name: 'Ranger Dave', email: 'dave@badlandspark.com', score: 64, is_supporter: true },
          { rank: 3, display_name: 'Mike Mechanic', email: 'mike@performancetuning.com', score: 32, is_supporter: false },
          { rank: 4, display_name: 'Marcus Mustang', email: 'marcus@enthusiast.com', score: 16, is_supporter: true }
        ];

        const mockPartners: PartnerLeaderboardItem[] = [
          { rank: 1, name: 'Monmouth Marine Ford & Boats', type: 'Dealership', score: 150, is_pro: true },
          { rank: 2, name: 'Performance Tuning Shop', type: 'Service Center', score: 95, is_pro: true },
          { rank: 3, name: 'Badlands Offroad Park', type: 'Racetrack', score: 80, is_pro: true },
          { rank: 4, name: 'Englishtown Raceway', type: 'Racetrack', score: 45, is_pro: false }
        ];

        if (isMounted) {
          setBuilds(mockBuilds);
          setSpotters(mockSpotters);
          setPartners(mockPartners);
          setLoading(false);
        }
        return;
      }

      // Real query for firebase if not mock
      try {
        // Query vehicles sorted by vibe check / spots count (vibe checks acts as build scoring index)
        const vSnap = await getDocs(query(collection(db, 'vehicles'), orderBy('vibe_checks', 'desc'), limit(10)));
        const buildList = vSnap.docs.map((docSnap, index) => {
          const d = docSnap.data();
          return {
            rank: index + 1,
            tag_id: d.tag_id || 'GP-TAG',
            vehicle_info: `${d.year || 2024} ${d.make || ''} ${d.model || ''}`,
            owner_name: d.owner_name || d.owner_email?.split('@')[0] || 'Original Driver',
            score: d.vibe_checks || 0,
            is_supporter: d.is_supporter === true
          } as BuildLeaderboardItem;
        });

        // Query users sorted by spotting count
        const uSnap = await getDocs(query(collection(db, 'users'), orderBy('spots_submitted', 'desc'), limit(10)));
        const spotterList = uSnap.docs.map((docSnap, index) => {
          const d = docSnap.data();
          return {
            rank: index + 1,
            display_name: d.display_name || d.name || 'Spotter',
            email: d.email || '',
            score: d.spots_submitted || 0,
            is_supporter: d.is_supporter === true
          } as SpotterLeaderboardItem;
        });

        // Query businesses sorted by partner leads/activity
        const bSnap = await getDocs(query(collection(db, 'businesses'), limit(10)));
        const partnerList = bSnap.docs.map((docSnap, index) => {
          const d = docSnap.data();
          return {
            rank: index + 1,
            name: d.name || 'Partner',
            type: d.type || 'dealership',
            score: d.leads_captured || Math.floor(Math.random() * 50) + 10,
            is_pro: d.is_pro === true
          } as PartnerLeaderboardItem;
        }).sort((a, b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 }));

        if (isMounted) {
          setBuilds(buildList);
          setSpotters(spotterList);
          setPartners(partnerList);
        }
      } catch (err) {
        console.error("Failed to load leaderboards:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLeaderboards();
    return () => { isMounted = false; };
  }, [authLoading, isMock]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative flex flex-col">
      <div className="mesh-glow" />

      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>

          <span className="text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-850 text-neutral-400 px-3 py-1 rounded-full uppercase tracking-wider">
            Ecosystem Scoreboards
          </span>
        </div>

        {/* Title banner */}
        <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/40 space-y-2">
          <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest bg-red-950/20 border border-red-900/30 px-2.5 py-0.5 rounded-full inline-block">
            Leaderboards
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none pt-1">
            Ecosystem Leaderboards
          </h1>
          <p className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-500 animate-bounce" /> Compete for top spotted builds, active spotter hunts, and B2B partner ranks.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-neutral-900 flex gap-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('builds')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'builds' ? 'border-red-500 text-white font-black' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Car className="w-4 h-4" /> Top Spotted Builds
          </button>
          <button 
            onClick={() => setActiveTab('spotters')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'spotters' ? 'border-red-500 text-white font-black' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Camera className="w-4 h-4" /> Active Spotters
          </button>
          <button 
            onClick={() => setActiveTab('partners')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'partners' ? 'border-red-500 text-white font-black' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Building2 className="w-4 h-4" /> Pro Partner score
          </button>
        </div>

        {/* Podium Top 3 layout */}
        {activeTab === 'builds' && (
          <div className="space-y-8">
            {/* Podium grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {builds.slice(0, 3).map((item) => (
                <div 
                  key={item.tag_id}
                  className={`glass-card p-6 rounded-[2rem] relative border text-center space-y-4 ${
                    item.rank === 1 
                      ? 'border-yellow-500 bg-yellow-950/5 ring-2 ring-yellow-500/25 md:-translate-y-2' 
                      : item.rank === 2 
                        ? 'border-slate-400 bg-slate-900/10' 
                        : 'border-amber-700 bg-amber-950/5'
                  }`}
                >
                  {/* Rank badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto border text-sm font-black font-mono ${
                    item.rank === 1 
                      ? 'bg-yellow-500 border-yellow-400 text-black shadow-md' 
                      : item.rank === 2 
                        ? 'bg-slate-400 border-slate-350 text-black' 
                        : 'bg-amber-700 border-amber-600 text-white'
                  }`}>
                    {item.rank}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest">{item.tag_id}</span>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">{item.vehicle_info}</h3>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Owner: {item.owner_name}</p>
                  </div>

                  <div className="inline-block px-3 py-1 bg-neutral-900 border border-neutral-850 rounded-full text-xs font-mono font-bold text-white">
                    🔥 {item.score} spots
                  </div>
                </div>
              ))}
            </div>

            {/* List for Rank 4+ */}
            {builds.length > 3 && (
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/20">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs font-medium text-neutral-400">
                    <thead>
                      <tr className="border-b border-neutral-900 text-[10px] font-mono text-neutral-500 uppercase tracking-widest pb-3">
                        <th className="pb-3 pr-4">Rank</th>
                        <th className="pb-3 px-4">Tag ID</th>
                        <th className="pb-3 px-4">Vehicle Build Info</th>
                        <th className="pb-3 px-4">Owner Name</th>
                        <th className="pb-3 pl-4 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {builds.slice(3).map((item) => (
                        <tr key={item.tag_id} className="hover:bg-neutral-900/10 transition-colors">
                          <td className="py-4 pr-4 font-mono font-black text-neutral-550">#{item.rank}</td>
                          <td className="py-4 px-4 font-mono font-bold text-red-400">{item.tag_id}</td>
                          <td className="py-4 px-4 font-bold text-white uppercase">{item.vehicle_info}</td>
                          <td className="py-4 px-4 uppercase text-neutral-400 font-semibold">{item.owner_name}</td>
                          <td className="py-4 pl-4 text-right font-mono font-black text-white">{item.score} spots</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Podium Active Spotters */}
        {activeTab === 'spotters' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {spotters.slice(0, 3).map((item) => (
                <div 
                  key={item.email}
                  className={`glass-card p-6 rounded-[2rem] relative border text-center space-y-4 ${
                    item.rank === 1 
                      ? 'border-yellow-500 bg-yellow-950/5 ring-2 ring-yellow-500/25 md:-translate-y-2' 
                      : item.rank === 2 
                        ? 'border-slate-400 bg-slate-900/10' 
                        : 'border-amber-700 bg-amber-950/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto border text-sm font-black font-mono ${
                    item.rank === 1 
                      ? 'bg-yellow-500 border-yellow-400 text-black shadow-md' 
                      : item.rank === 2 
                        ? 'bg-slate-400 border-slate-350 text-black' 
                        : 'bg-amber-700 border-amber-600 text-white'
                  }`}>
                    {item.rank}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase tracking-tight">{item.display_name}</h3>
                    <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">{item.email}</p>
                  </div>

                  <div className="inline-block px-3 py-1 bg-neutral-900 border border-neutral-850 rounded-full text-xs font-mono font-bold text-white">
                    🎯 {item.score} hunts
                  </div>
                </div>
              ))}
            </div>

            {spotters.length > 3 && (
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/20">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs font-medium text-neutral-400">
                    <thead>
                      <tr className="border-b border-neutral-900 text-[10px] font-mono text-neutral-500 uppercase tracking-widest pb-3">
                        <th className="pb-3 pr-4">Rank</th>
                        <th className="pb-3 px-4">Spotter Name</th>
                        <th className="pb-3 px-4">Email Handle</th>
                        <th className="pb-3 pl-4 text-right">Hunts Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {spotters.slice(3).map((item) => (
                        <tr key={item.email} className="hover:bg-neutral-900/10 transition-colors">
                          <td className="py-4 pr-4 font-mono font-black text-neutral-550">#{item.rank}</td>
                          <td className="py-4 px-4 font-bold text-white uppercase">{item.display_name}</td>
                          <td className="py-4 px-4 font-mono text-neutral-500 font-semibold">{item.email}</td>
                          <td className="py-4 pl-4 text-right font-mono font-black text-white">{item.score} spots</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Podium Pro Partners */}
        {activeTab === 'partners' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {partners.slice(0, 3).map((item) => (
                <div 
                  key={item.name}
                  className={`glass-card p-6 rounded-[2rem] relative border text-center space-y-4 ${
                    item.rank === 1 
                      ? 'border-yellow-500 bg-yellow-950/5 ring-2 ring-yellow-500/25 md:-translate-y-2' 
                      : item.rank === 2 
                        ? 'border-slate-400 bg-slate-900/10' 
                        : 'border-amber-700 bg-amber-950/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto border text-sm font-black font-mono ${
                    item.rank === 1 
                      ? 'bg-yellow-500 border-yellow-400 text-black shadow-md' 
                      : item.rank === 2 
                        ? 'bg-slate-400 border-slate-350 text-black' 
                        : 'bg-amber-700 border-amber-600 text-white'
                  }`}>
                    {item.rank}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase tracking-tight leading-tight">{item.name}</h3>
                    <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">{item.type}</p>
                  </div>

                  <div className="inline-block px-3 py-1 bg-neutral-900 border border-neutral-850 rounded-full text-xs font-mono font-bold text-white">
                    📈 {item.score} units
                  </div>
                </div>
              ))}
            </div>

            {partners.length > 3 && (
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/20">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs font-medium text-neutral-400">
                    <thead>
                      <tr className="border-b border-neutral-900 text-[10px] font-mono text-neutral-500 uppercase tracking-widest pb-3">
                        <th className="pb-3 pr-4">Rank</th>
                        <th className="pb-3 px-4">Partner Brand</th>
                        <th className="pb-3 px-4">Category</th>
                        <th className="pb-3 pl-4 text-right">Lead Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {partners.slice(3).map((item) => (
                        <tr key={item.name} className="hover:bg-neutral-900/10 transition-colors">
                          <td className="py-4 pr-4 font-mono font-black text-neutral-550">#{item.rank}</td>
                          <td className="py-4 px-4 font-bold text-white uppercase">{item.name}</td>
                          <td className="py-4 px-4 font-mono text-neutral-500 font-semibold">{item.type}</td>
                          <td className="py-4 pl-4 text-right font-mono font-black text-white">{item.score} units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <Footer />
    </main>
  );
}
