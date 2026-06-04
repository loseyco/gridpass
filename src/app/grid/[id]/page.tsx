'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Flag, Loader2, ArrowLeft, CheckCircle2, XCircle, ShieldCheck, 
  Users, RefreshCw, Car, User, ShieldAlert, Zap, Layers 
} from 'lucide-react';
import { logEvent } from '@/lib/logger';

interface ActiveTrackVehicle {
  id: string;
  timestamp: string;
  driver_name: string;
  vehicle_info: string;
  run_group: string;
  tech_status: boolean;
  waiver_status: boolean;
}

interface SeededAsset {
  uid: string;
  email: string;
  display_name: string;
  vehicle_tag: string;
  vehicle_info: string;
  run_group: string;
  tech_status: boolean;
  waiver_status: boolean;
}

export default function GridConsolePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const trackId = (params?.id as string) || '';

  // Dashboard state
  const [pitFlag, setPitFlag] = useState<'Green' | 'Red'>('Green');
  const [activeGroupFilter, setActiveGroupFilter] = useState<'ALL' | 'Group A' | 'Group B' | 'Group C'>('ALL');
  const [checkedInLogs, setCheckedInLogs] = useState<ActiveTrackVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Scanner Simulator States
  const [selectedAssetKey, setSelectedAssetKey] = useState('');
  const [scannedAsset, setScannedAsset] = useState<SeededAsset | null>(null);
  const [currentTech, setCurrentTech] = useState(false);
  const [currentWaiver, setCurrentWaiver] = useState(false);

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  // Mock seeded profiles for Grid Marshall validation simulation
  const seededAssets: SeededAsset[] = [
    {
      uid: 'user-marcus-123',
      email: 'marcus@enthusiast.com',
      display_name: 'Marcus Mustang',
      vehicle_tag: 'GP-MARCUS-GT',
      vehicle_info: '2024 Ford Mustang GT',
      run_group: 'Group A',
      tech_status: true,
      waiver_status: true
    },
    {
      uid: 'user-billy-456',
      email: 'billy@trucks.com',
      display_name: 'Billy BigRig',
      vehicle_tag: 'GP-BILLY-RIG',
      vehicle_info: '2020 Chevrolet Silverado',
      run_group: 'Group C',
      tech_status: false,
      waiver_status: true
    },
    {
      uid: 'user-sarah-789',
      email: 'sarah@spotter.com',
      display_name: 'Sarah Spotter',
      vehicle_tag: 'GP-SARAH-CAR',
      vehicle_info: '2022 Subaru BRZ',
      run_group: 'Group B',
      tech_status: true,
      waiver_status: false
    },
    {
      uid: 'user-wild-000',
      email: 'unclaimed@gridpass.app',
      display_name: 'Anonymous Wildcar',
      vehicle_tag: 'GP-WILD-999',
      vehicle_info: '2023 Toyota GR Corolla',
      run_group: 'Group C',
      tech_status: false,
      waiver_status: false
    }
  ];

  // Load dashboard logs and setup
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadGridLogs() {
      // Simulate/Load checked in vehicles logs
      if (isMock) {
        await new Promise(r => setTimeout(r, 100));
        const mockLogs: ActiveTrackVehicle[] = [
          {
            id: 'active-1',
            timestamp: new Date(Date.now() - 600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            driver_name: 'Mike Mechanic',
            vehicle_info: '2021 Porsche 911 GT3 RS',
            run_group: 'Group A',
            tech_status: true,
            waiver_status: true
          }
        ];

        if (isMounted) {
          setCheckedInLogs(mockLogs);
          setLoading(false);
        }
        return;
      }

      // Real query for firebase if not mock
      try {
        const checkinsQuery = query(collection(db, 'track_releases'), where('track_id', '==', trackId));
        const checkinsSnap = await getDocs(checkinsQuery);
        const list = checkinsSnap.docs.map(doc => {
          const data = doc.data();
          const localTime = data.released_at?.toDate() 
            ? data.released_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            id: doc.id,
            timestamp: localTime,
            driver_name: data.driver_name || 'Driver',
            vehicle_info: data.vehicle_info || 'Vehicle',
            run_group: data.run_group || 'Group C',
            tech_status: data.tech_status === true,
            waiver_status: data.waiver_status === true
          } as ActiveTrackVehicle;
        });

        if (isMounted) {
          setCheckedInLogs(list);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load grid releases:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGridLogs();
    return () => { isMounted = false; };
  }, [trackId, authLoading, isMock]);

  // Handle dropdown selection change to simulate scanning
  const handleSelectAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedAssetKey(val);
    if (!val) {
      setScannedAsset(null);
      return;
    }
    const found = seededAssets.find(a => a.vehicle_tag === val);
    if (found) {
      setScannedAsset(found);
      setCurrentTech(found.tech_status);
      setCurrentWaiver(found.waiver_status);
    }
  };

  // Perform "Wave onto Track" action release
  const handleWaveOntoTrack = async () => {
    if (!scannedAsset) return;

    const releaseRecord = {
      track_id: trackId,
      driver_name: scannedAsset.display_name,
      vehicle_info: scannedAsset.vehicle_info,
      run_group: scannedAsset.run_group,
      tech_status: currentTech,
      waiver_status: currentWaiver,
      released_at: new Date().toISOString()
    };

    if (isMock) {
      // Append locally for testing
      const newEntry: ActiveTrackVehicle = {
        id: `local-release-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        driver_name: scannedAsset.display_name,
        vehicle_info: scannedAsset.vehicle_info,
        run_group: scannedAsset.run_group,
        tech_status: currentTech,
        waiver_status: currentWaiver
      };

      setCheckedInLogs(prev => [newEntry, ...prev]);
      // Reset validation states
      setScannedAsset(null);
      setSelectedAssetKey('');
      await logEvent('success', 'scan', `Mock marshall waved ${releaseRecord.driver_name} onto track`);
      return;
    }

    try {
      await addDoc(collection(db, 'track_releases'), {
        ...releaseRecord,
        released_at_db: serverTimestamp()
      });

      const newEntry: ActiveTrackVehicle = {
        id: `db-release-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        driver_name: scannedAsset.display_name,
        vehicle_info: scannedAsset.vehicle_info,
        run_group: scannedAsset.run_group,
        tech_status: currentTech,
        waiver_status: currentWaiver
      };

      setCheckedInLogs(prev => [newEntry, ...prev]);
      setScannedAsset(null);
      setSelectedAssetKey('');
      await logEvent('success', 'scan', `Marshall waved ${releaseRecord.driver_name} onto track`);
    } catch (err) {
      console.error("Failed to release vehicle onto track:", err);
      alert("Error logging the pit-lane release.");
    }
  };

  const isReleasedEnabled = currentTech && currentWaiver && pitFlag === 'Green';

  // Filtered checkins logs list
  const filteredLogs = checkedInLogs.filter(log => {
    if (activeGroupFilter === 'ALL') return true;
    return log.run_group === activeGroupFilter;
  });

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

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-8">
        
        {/* Header navigation breadcrumbs */}
        <div className="flex items-center justify-between">
          <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>

          <span className="text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-850 text-neutral-400 px-3 py-1 rounded-full uppercase tracking-wider">
            Marshall Station: {trackId.replace(/-/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Marshall Stats panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Active Track Stats */}
          <div className="md:col-span-8 glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/40 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Live Status</span>
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${pitFlag === 'Green' ? 'bg-emerald-500 animate-pulse' : 'bg-red-600 animate-ping'}`} />
                <span className="text-lg font-black text-white uppercase tracking-tight">{pitFlag} flag active</span>
              </div>
              <div className="flex gap-2 pt-2.5">
                <button 
                  onClick={() => setPitFlag('Green')} 
                  className={`px-3 py-1 text-[9px] font-mono font-bold uppercase rounded-lg border transition-all ${
                    pitFlag === 'Green' ? 'bg-emerald-950/50 border-emerald-900/60 text-emerald-400' : 'bg-neutral-900 border-neutral-850 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Green Pit
                </button>
                <button 
                  onClick={() => setPitFlag('Red')} 
                  className={`px-3 py-1 text-[9px] font-mono font-bold uppercase rounded-lg border transition-all ${
                    pitFlag === 'Red' ? 'bg-red-950/50 border-red-900/60 text-red-400' : 'bg-neutral-900 border-neutral-850 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Close Pit
                </button>
              </div>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-neutral-900 sm:pl-6 py-2 sm:py-0">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Cars On Track Today</span>
              <div className="text-3xl font-black text-white font-mono leading-none">{checkedInLogs.length}</div>
              <span className="text-[10px] text-neutral-400 font-semibold block">Waved onto Pit Lane</span>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-neutral-900 sm:pl-6 py-2 sm:py-0">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Marshall Controls</span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400 bg-blue-950/20 border border-blue-900/30 px-3 py-1 rounded-xl uppercase inline-block">
                <Zap className="w-4 h-4 text-blue-400 animate-pulse" /> Active Connection
              </div>
            </div>
          </div>

          {/* Active Run Group Filter */}
          <div className="md:col-span-4 glass-card p-6 rounded-[2rem] border-neutral-900 bg-neutral-950/20 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-red-500" /> Active Run Group Filter
              </h3>
              <p className="text-[10px] text-neutral-500 font-medium">Filter checked-in vehicles by session group</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {(['ALL', 'Group A', 'Group B', 'Group C'] as const).map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveGroupFilter(group)}
                  className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all ${
                    activeGroupFilter === group 
                      ? 'bg-red-600/10 border-red-500 text-red-400 font-black' 
                      : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Scan & Validation Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left: QR scanner simulator dropdown */}
          <div className="md:col-span-5 space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/30 space-y-5">
              
              <div className="space-y-1.5 border-b border-neutral-900 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-4.5 h-4.5 text-red-500 animate-spin-slow" /> Scanner Simulator
                </h3>
                <p className="text-[11px] text-neutral-400 font-medium">Select a test profile or vehicle scan sticker to verify gate ingress rules.</p>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1.5 tracking-wider">
                  Scan Input (Select seeded build)
                </label>
                <select 
                  value={selectedAssetKey}
                  onChange={handleSelectAssetChange}
                  className="w-full bg-neutral-900 border border-neutral-850 focus:border-red-500 text-white rounded-xl px-4 py-3.5 text-xs font-semibold outline-none transition-colors min-h-[54px] cursor-pointer"
                >
                  <option value="">-- WAITING FOR SCAN SIGNAL --</option>
                  {seededAssets.map((asset) => (
                    <option key={asset.vehicle_tag} value={asset.vehicle_tag}>
                      {asset.vehicle_tag} - {asset.display_name} ({asset.vehicle_info})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-neutral-950/40 border border-neutral-900 rounded-2xl text-[11px] text-neutral-500 leading-relaxed font-mono">
                📟 Simulator active. Selecting a dropdown vehicle simulates scanning a physical helmet QR decal or side-window specifications card.
              </div>

            </div>
          </div>

          {/* Right: Scan Results Verification panel */}
          <div className="md:col-span-7">
            {scannedAsset ? (
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/40 space-y-6">
                
                {/* Scanned header */}
                <div className="flex items-start justify-between border-b border-neutral-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-850 rounded-2xl flex items-center justify-center text-neutral-500">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">{scannedAsset.vehicle_tag}</span>
                      <h4 className="text-base font-black text-white uppercase tracking-tight">{scannedAsset.display_name}</h4>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{scannedAsset.vehicle_info}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-850 text-red-400 px-3 py-1 rounded-full uppercase">
                    {scannedAsset.run_group}
                  </span>
                </div>

                {/* Checklist parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Parameter 1: Safety Tech Pass */}
                  <div className={`p-4 border rounded-2xl space-y-2.5 transition-all flex flex-col justify-between ${
                    currentTech ? 'bg-emerald-950/5 border-emerald-900/30 text-emerald-400' : 'bg-red-950/5 border-red-900/30 text-red-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Tech Checklist</span>
                      {currentTech ? <CheckCircle2 className="w-4.5 h-4.5" /> : <XCircle className="w-4.5 h-4.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase">{currentTech ? 'Tech Pass Signed' : 'Tech Pass Missing'}</div>
                      <p className="text-[10px] text-neutral-500 font-medium">Brake lines & helmet tech check</p>
                    </div>
                    <button 
                      onClick={() => setCurrentTech(!currentTech)}
                      className="mt-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-[9px] font-mono font-bold uppercase text-white hover:text-red-400 transition-all cursor-pointer"
                    >
                      Toggle Tech Override
                    </button>
                  </div>

                  {/* Parameter 2: Track Waiver signed */}
                  <div className={`p-4 border rounded-2xl space-y-2.5 transition-all flex flex-col justify-between ${
                    currentWaiver ? 'bg-emerald-950/5 border-emerald-900/30 text-emerald-400' : 'bg-red-950/5 border-red-900/30 text-red-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Liability Waiver</span>
                      {currentWaiver ? <CheckCircle2 className="w-4.5 h-4.5" /> : <XCircle className="w-4.5 h-4.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase">{currentWaiver ? 'Waiver Signed' : 'Waiver Missing'}</div>
                      <p className="text-[10px] text-neutral-500 font-medium">Agreement & release terms</p>
                    </div>
                    <button 
                      onClick={() => setCurrentWaiver(!currentWaiver)}
                      className="mt-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-[9px] font-mono font-bold uppercase text-white hover:text-red-400 transition-all cursor-pointer"
                    >
                      Toggle Waiver Override
                    </button>
                  </div>

                </div>

                {/* Final RELEASE VERDICT banner */}
                <div className={`p-5 rounded-2xl text-center space-y-2.5 border ${
                  isReleasedEnabled 
                    ? 'bg-emerald-900/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-red-900/10 border-red-500/20 text-red-400'
                }`}>
                  <div className="text-lg font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                    {isReleasedEnabled ? (
                      <>
                        <ShieldCheck className="w-5 h-5 text-emerald-400" /> RELEASE TO PIT LANE
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" /> HOLD — DO NOT RELEASE
                      </>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 font-medium max-w-sm mx-auto">
                    {isReleasedEnabled 
                      ? `Waiver is active, vehicle has passed safety tech checks, and pit flag is Green.`
                      : pitFlag === 'Red' 
                        ? 'Pit lane is currently closed (Red Flag active). Wave-on is blocked.'
                        : 'Driver must complete track waivers and pass tech inspection before entry.'
                    }
                  </p>
                </div>

                {/* Wave onto Track Button */}
                <button
                  onClick={handleWaveOntoTrack}
                  disabled={!isReleasedEnabled}
                  className={`w-full font-black uppercase text-xs tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[56px] ${
                    isReleasedEnabled 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-[0.99]' 
                      : 'bg-neutral-900 text-neutral-600 border border-neutral-850 cursor-not-allowed'
                  }`}
                >
                  Wave onto Track (Green Flag) →
                </button>

              </div>
            ) : (
              /* Idle screen waiting for scan signal */
              <div className="glass-card p-16 rounded-[2rem] border-neutral-900 bg-neutral-950/20 text-center space-y-4">
                <Car className="w-16 h-16 mx-auto text-neutral-850" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-neutral-450 uppercase tracking-widest">WAITING FOR SCANNED SIGNAL</h4>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">Scan driver's helmet QR tag or windshield card using the simulator on the left to verify credentials.</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Check-In Release Log table */}
        <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/20 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-4 h-4 text-red-500" /> Pit Lane Check-in History Logs
            </h3>
            
            <span className="text-[9px] font-mono font-bold text-neutral-400 bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded-full uppercase">
              {filteredLogs.length} Logs Showing ({activeGroupFilter})
            </span>
          </div>

          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs font-medium text-neutral-400">
                <thead>
                  <tr className="border-b border-neutral-900 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">Release Time</th>
                    <th className="pb-3 px-4">Driver Name</th>
                    <th className="pb-3 px-4">Vehicle Info</th>
                    <th className="pb-3 px-4">Run Group</th>
                    <th className="pb-3 pl-4 text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-900/10 transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-bold text-neutral-500">{log.timestamp}</td>
                      <td className="py-3.5 px-4 font-bold text-white uppercase">{log.driver_name}</td>
                      <td className="py-3.5 px-4 uppercase font-semibold text-neutral-300">{log.vehicle_info}</td>
                      <td className="py-3.5 px-4 font-mono font-bold"><span className="text-red-400">{log.run_group}</span></td>
                      <td className="py-3.5 pl-4 text-right">
                        <span className="text-[9px] font-mono font-bold bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Cleared & Released
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-600 space-y-2">
              <Flag className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-[11px] uppercase font-mono font-bold">No checked-in vehicles in history log.</p>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </main>
  );
}
