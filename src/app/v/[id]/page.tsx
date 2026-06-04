'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { 
  collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  CarFront, MapPin, Wrench, ShieldCheck, Heart, User, Calendar, 
  Map, History, ClipboardList, Info, Sparkles, Loader2, ArrowLeft, Sun
} from 'lucide-react';
import { logEvent } from '@/lib/logger';

interface SpecItem {
  engine?: string;
  transmission?: string;
  hp?: number | string;
  torque?: number | string;
}

interface ModItem {
  category: string;
  brand: string;
  name: string;
  date?: string;
  cost?: number | string;
}

interface VehicleData {
  id: string;
  tag_id: string;
  owner_id: string | null;
  owner_email?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  specs?: SpecItem;
  mods?: ModItem[] | string;
  partner_dealer?: string;
  is_ad_free?: boolean;
  has_telemetry?: boolean;
  is_verified_provenance?: boolean;
}

interface ServiceLog {
  id: string;
  title: string;
  notes: string;
  date: string;
  cost?: number | string;
  recorded_by: string;
  is_verified: boolean;
  shop_id?: string;
}

interface Sighting {
  id: string;
  spotted_by: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  location_name: string;
  description: string;
  timestamp: string | any;
}

export default function VehicleProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const vehicleId = (params?.id as string) || '';

  // Data States
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'telemetry' | 'service'>('specs');

  // Interactive States
  const [vibeChecks, setVibeChecks] = useState(12);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  // New Service Log form
  const [logTitle, setLogTitle] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingLog, setSubmittingLog] = useState(false);

  // Checks
  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;
  const isOwner = user && vehicle && user.uid === vehicle.owner_id;
  
  // A certified shop is a user with a B2B shop email (mock or actual) or explicitly authenticated
  const isShop = user && (
    user.email?.endsWith('@performancetuning.com') || 
    user.email?.endsWith('@monmouthmarine.com') ||
    user.email?.endsWith('@gridpass.app') ||
    (user as any).role === 'shop' ||
    (isMock && user.email === 'mike@performancetuning.com')
  );

  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadVehicleData() {
      if (isMock) {
        // Return simulated vehicle data for Playwright tests
        await new Promise(r => setTimeout(r, 100));
        
        let ownerId = 'user-marcus-123';
        if (vehicleId === 'mock-unclaimed-v1') ownerId = '';

        const mockVehicle: VehicleData = {
          id: vehicleId || 'mock-v1',
          tag_id: 'GP-MARCUS-GT',
          owner_id: ownerId,
          owner_email: 'marcus@enthusiast.com',
          year: 2024,
          make: 'Ford',
          model: 'Mustang GT',
          trim: 'Premium',
          specs: {
            engine: '5.0L Coyote V8',
            transmission: '6-Speed Manual',
            hp: 480,
            torque: 415
          },
          mods: [
            { category: 'Exhaust', brand: 'Roush', name: 'Cat-Back Exhaust System', cost: 1200 },
            { category: 'Suspension', brand: 'Steeda', name: 'Progressive lowering springs', cost: 350 }
          ],
          partner_dealer: 'Monmouth Marine Ford',
          has_telemetry: true,
          is_verified_provenance: true
        };

        const mockLogs: ServiceLog[] = [
          {
            id: 'log-1',
            title: 'Roush Cat-Back Exhaust Installation',
            notes: 'Installed Roush exhaust system. Sounds throaty. Fits perfectly.',
            date: '2025-10-12',
            cost: 1200,
            recorded_by: 'mike@performancetuning.com',
            is_verified: true,
            shop_id: 'performance-tuning-demo'
          },
          {
            id: 'log-2',
            title: 'First Oil Change',
            notes: 'Standard 5W-30 synthetic oil change and filter replacement.',
            date: '2025-08-01',
            cost: 85,
            recorded_by: 'owner@gridpass.app',
            is_verified: false
          }
        ];

        const mockSightings: Sighting[] = [
          {
            id: 'sight-1',
            spotted_by: 'Sarah Spotter',
            photo_url: '',
            latitude: 40.2204,
            longitude: -74.0006,
            location_name: 'Wall Stadium Speedway',
            description: 'Looking clean in the paddock!',
            timestamp: new Date().toISOString()
          },
          {
            id: 'sight-2',
            spotted_by: 'Racetrack Dave',
            photo_url: '',
            latitude: 39.9526,
            longitude: -75.1652,
            location_name: 'Badlands Offroad Gate',
            description: 'Checked-in for track day.',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ];

        if (isMounted) {
          setVehicle(mockVehicle);
          setServiceLogs(mockLogs);
          setSightings(mockSightings);
          setVibeChecks(24);
          setLoading(false);
        }
        return;
      }

      try {
        // Real Firestore query
        const docRef = doc(db, 'vehicles', vehicleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const vData = docSnap.data();
          const loadedVehicle: VehicleData = {
            id: docSnap.id,
            tag_id: vData.tag_id || '',
            owner_id: vData.owner_id || null,
            owner_email: vData.owner_email,
            year: vData.year || 2024,
            make: vData.make || '',
            model: vData.model || '',
            trim: vData.trim,
            specs: vData.specs,
            mods: vData.mods,
            partner_dealer: vData.partner_dealer,
            is_ad_free: vData.is_ad_free,
            has_telemetry: vData.has_telemetry,
            is_verified_provenance: vData.is_verified_provenance
          };

          if (isMounted) setVehicle(loadedVehicle);

          // Fetch Service Logs
          const logsQuery = query(collection(db, 'service_logs'), where('vehicle_id', '==', docSnap.id));
          const logsSnap = await getDocs(logsQuery);
          const logsList = logsSnap.docs.map(logDoc => {
            const lData = logDoc.data();
            return {
              id: logDoc.id,
              title: lData.title,
              notes: lData.notes,
              date: lData.date || '',
              cost: lData.cost,
              recorded_by: lData.recorded_by || '',
              is_verified: lData.is_verified === true,
              shop_id: lData.shop_id
            } as ServiceLog;
          }).sort((a, b) => b.date.localeCompare(a.date));

          if (isMounted) setServiceLogs(logsList);

          // Fetch Sightings (Scans/Spots)
          const sightingsQuery = query(collection(db, 'sightings'), where('vehicle_id', '==', docSnap.id));
          const sightingsSnap = await getDocs(sightingsQuery);
          const sightingsList = sightingsSnap.docs.map(sDoc => {
            const sData = sDoc.data();
            return {
              id: sDoc.id,
              spotted_by: sData.spotted_by || 'Anonymous',
              photo_url: sData.photo_url,
              latitude: sData.latitude,
              longitude: sData.longitude,
              location_name: sData.location_name || 'Unknown Location',
              description: sData.description || '',
              timestamp: sData.timestamp?.toDate() ? sData.timestamp.toDate().toISOString() : new Date().toISOString()
            } as Sighting;
          });

          if (isMounted) setSightings(sightingsList);
        }
      } catch (err) {
        console.error("Failed to load vehicle profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVehicleData();

    return () => { isMounted = false; };
  }, [vehicleId, user, authLoading, isMock]);

  // Spot / Vibe Check Counter
  const handleVibeCheck = async () => {
    if (hasVoted || voting) return;
    setVoting(true);

    if (isMock) {
      setVibeChecks(prev => prev + 1);
      setHasVoted(true);
      setVoting(false);
      return;
    }

    try {
      // Record a simple anonymous sighting spot to increment
      await addDoc(collection(db, 'sightings'), {
        vehicle_id: vehicleId,
        spotted_by: user?.displayName || 'Passerby Spectator',
        location_name: 'Vibe Check Rating',
        description: 'Vibe-Checked this build!',
        timestamp: serverTimestamp()
      });

      setVibeChecks(prev => prev + 1);
      setHasVoted(true);

      await logEvent('info', 'scan', `Vehicle [${vehicleId}] Vibe-Checked by ${user?.email || 'Anonymous'}`);
    } catch (err) {
      console.error("Failed to submit vibe check:", err);
    } finally {
      setVoting(false);
    }
  };

  // Submit New Service Log (Owner or Shop)
  const handleAddServiceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) return;
    setSubmittingLog(true);

    const isVerifiedStamp = isShop;
    const authorEmail = user?.email || 'authenticated-user@gridpass.app';

    if (isMock) {
      const newLog: ServiceLog = {
        id: `log-mock-${Date.now()}`,
        title: logTitle,
        notes: logNotes,
        date: logDate,
        cost: logCost ? parseFloat(logCost) : undefined,
        recorded_by: authorEmail,
        is_verified: isVerifiedStamp,
        shop_id: isVerifiedStamp ? 'performance-tuning-demo' : undefined
      };
      setServiceLogs(prev => [newLog, ...prev]);
      setLogTitle('');
      setLogNotes('');
      setLogCost('');
      setSubmittingLog(false);
      return;
    }

    try {
      const payload = {
        vehicle_id: vehicleId,
        title: logTitle.trim(),
        notes: logNotes.trim(),
        date: logDate,
        cost: logCost ? parseFloat(logCost) : null,
        recorded_by: authorEmail,
        is_verified: isVerifiedStamp,
        shop_id: isVerifiedStamp ? 'performance-tuning-demo' : null,
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'service_logs'), payload);

      const updatedLog: ServiceLog = {
        id: `log-${Date.now()}`,
        title: payload.title,
        notes: payload.notes,
        date: payload.date,
        cost: payload.cost || undefined,
        recorded_by: payload.recorded_by,
        is_verified: payload.is_verified,
        shop_id: payload.shop_id || undefined
      };

      setServiceLogs(prev => [updatedLog, ...prev]);
      setLogTitle('');
      setLogNotes('');
      setLogCost('');

      await logEvent('success', 'system', `Service log added for vehicle [${vehicleId}]: ${payload.title} (Verified: ${payload.is_verified})`);
    } catch (error) {
      console.error("Failed to save service log:", error);
      alert("Failed to save service record.");
    } finally {
      setSubmittingLog(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col items-center justify-center space-y-4">
        <CarFront className="w-16 h-16 text-neutral-700" />
        <h2 className="text-xl font-bold uppercase tracking-wider">Vehicle Passport Not Found</h2>
        <Link href="/" className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Safety
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative flex flex-col">
      <div className="mesh-glow" />
      
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Garage Dashboard
          </Link>
          {vehicle.partner_dealer && (
            <span className="text-[10px] font-mono font-bold bg-[#10b981]/5 border border-[#10b981]/25 text-[#10b981] px-3 py-1 rounded-full uppercase tracking-wider">
              Verified Lot: {vehicle.partner_dealer}
            </span>
          )}
        </div>

        {/* Hero Specs Title Card */}
        <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded">
                {vehicle.tag_id}
              </span>
              {vehicle.is_verified_provenance && (
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Provenance Verified
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none pt-1">
              {vehicle.year} {vehicle.make} <span className="text-red-500">{vehicle.model}</span>
            </h1>
            {vehicle.trim && <p className="text-xs text-neutral-400 uppercase font-mono font-bold tracking-widest">{vehicle.trim} Package</p>}
          </div>

          {/* Vibe Check Button */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-white font-mono leading-none">{vibeChecks}</div>
              <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Vibe Checks</div>
            </div>
            <button
              onClick={handleVibeCheck}
              disabled={hasVoted || voting}
              className={`px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 min-h-[48px] cursor-pointer ${
                hasVoted 
                  ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasVoted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
              {hasVoted ? 'Vibe Checked' : 'Vibe Check'}
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-neutral-900 flex gap-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'specs' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <CarFront className="w-4 h-4" /> Specs & Mod List
          </button>
          
          {(isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) && (
            <button 
              onClick={() => setActiveTab('telemetry')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'telemetry' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Map className="w-4 h-4" /> Scan Telemetry
            </button>
          )}

          <button 
            onClick={() => setActiveTab('service')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'service' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <History className="w-4 h-4" /> Service Logbook
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-6">

          {/* TAB 1: Specs & Modifications */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Specifications card */}
              <div className="md:col-span-5 space-y-6">
                <div className="glass-card p-6 rounded-3xl border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500" /> Factory Specifications
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs font-bold pt-2">
                    <span className="text-neutral-550 uppercase">Engine</span>
                    <span className="text-white text-right truncate">{vehicle.specs?.engine || 'N/A'}</span>

                    <span className="text-neutral-550 uppercase">Transmission</span>
                    <span className="text-white text-right truncate">{vehicle.specs?.transmission || 'N/A'}</span>

                    <span className="text-neutral-550 uppercase">Output Power</span>
                    <span className="text-white text-right">{vehicle.specs?.hp ? `${vehicle.specs.hp} HP` : 'N/A'}</span>

                    <span className="text-neutral-550 uppercase">Peak Torque</span>
                    <span className="text-white text-right">{vehicle.specs?.torque ? `${vehicle.specs.torque} lb-ft` : 'N/A'}</span>
                  </div>
                </div>

                {/* Shipped Stickers Callout (Chloe's Growth Hook) */}
                <div className="glass-card p-6 rounded-3xl border border-red-500/10 bg-red-950/5 space-y-4 text-center">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4 text-yellow-500" /> Want physical stickers?
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Order a custom pack of high-res outdoor weatherproof vinyl decals and poster sheets printed directly with your vehicle's registry passport QR code.
                  </p>
                  <Link 
                    href="/pricing" 
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/15 flex items-center justify-center gap-1 min-h-[44px]"
                  >
                    Order Decal Kit ($14.99)
                  </Link>
                </div>
              </div>

              {/* Right Column: Modifications List */}
              <div className="md:col-span-7 space-y-6">
                <div className="glass-card p-6 rounded-3xl border-neutral-900 bg-neutral-950/20 space-y-6">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-red-500" /> Modification List
                  </h3>

                  {Array.isArray(vehicle.mods) && vehicle.mods.length > 0 ? (
                    <div className="space-y-3">
                      {vehicle.mods.map((mod, idx) => (
                        <div key={idx} className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-2xl flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded">
                              {mod.category}
                            </span>
                            <h4 className="font-bold text-white pt-1">{mod.brand} {mod.name}</h4>
                          </div>
                          {mod.cost && (
                            <span className="font-mono font-bold text-neutral-400">${mod.cost}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : typeof vehicle.mods === 'string' && vehicle.mods ? (
                    <p className="text-sm text-neutral-300 font-medium whitespace-pre-line leading-relaxed">{vehicle.mods}</p>
                  ) : (
                    <div className="text-center py-8 text-neutral-550 space-y-2">
                      <CarFront className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs uppercase font-mono font-bold">No modifications logged yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Geolocation Scan Telemetry (Owner Gated Map) */}
          {activeTab === 'telemetry' && (isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-200">
              
              {/* Left Column: Visual Mock Map coordinates */}
              <div className="md:col-span-6 space-y-4">
                <div className="glass-card p-6 rounded-3xl border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-blue-500" /> Geographic Scan Telemetry
                  </h3>
                  
                  {/* SVG Map mockup representing geolocation pings */}
                  <div className="w-full h-64 bg-[#07070a] border border-neutral-900 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    <svg viewBox="0 0 400 200" className="w-full h-full opacity-60">
                      {/* Outline map tracks */}
                      <path d="M50 100 Q 150 20 200 100 T 350 100" fill="none" stroke="#222" strokeWidth="4" />
                      <path d="M100 150 Q 200 80 300 150" fill="none" stroke="#222" strokeWidth="3" strokeDasharray="5,5" />
                      
                      {/* Scan coordinate nodes */}
                      <circle cx="120" cy="80" r="10" fill="#bd2925" className="animate-ping" style={{ animationDuration: '3s' }} />
                      <circle cx="120" cy="80" r="6" fill="#bd2925" />
                      
                      <circle cx="280" cy="110" r="10" fill="#3b82f6" className="animate-ping" style={{ animationDuration: '4s' }} />
                      <circle cx="280" cy="110" r="6" fill="#3b82f6" />
                    </svg>
                    
                    <div className="absolute bottom-3 right-3 bg-neutral-950/80 border border-neutral-900 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold text-neutral-400 uppercase">
                      📍 2 Active Coordinates
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-neutral-450 leading-relaxed font-bold uppercase tracking-wide">
                    ⚠️ GEOLOCATION DATA IS PRIVATE. Spectators scanning your vehicle QR code can only see your public specs sheet.
                  </p>
                </div>
              </div>

              {/* Right Column: Scan History timeline logs */}
              <div className="md:col-span-6 space-y-4">
                <div className="glass-card p-6 rounded-3xl border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-4 h-4 text-red-500" /> Recent Scan Events
                  </h3>

                  <div className="space-y-3">
                    {sightings.map((sight) => (
                      <div key={sight.id} className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-2xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-white uppercase">{sight.location_name}</span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {new Date(sight.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-neutral-400">{sight.description}</p>
                        {sight.latitude && sight.longitude && (
                          <div className="text-[9px] font-mono text-neutral-500">
                            Coords: {sight.latitude.toFixed(4)}° N, {sight.longitude.toFixed(4)}° W
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Maintenance Service Logbook */}
          {activeTab === 'service' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-200">
              
              {/* Left Column: Form to log new maintenance (Available to Owner and Shop) */}
              <div className="md:col-span-5 space-y-4">
                {(isOwner || isShop || (isMock && (user?.email === 'marcus@enthusiast.com' || user?.email === 'mike@performancetuning.com'))) ? (
                  <div className="glass-card p-6 rounded-3xl border-neutral-900 bg-neutral-950/20 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-emerald-500" /> Log Maintenance Event
                      </h3>
                      {isShop && (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 inline-block mt-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Stamping as Certified Shop
                        </span>
                      )}
                    </div>

                    <form onSubmit={handleAddServiceLog} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Event Title</label>
                        <input 
                          type="text" 
                          required
                          value={logTitle}
                          onChange={(e) => setLogTitle(e.target.value)}
                          placeholder="e.g. Synthetic Oil Change" 
                          className="glass-input w-full p-2.5 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Service Details / Notes</label>
                        <textarea 
                          rows={3}
                          value={logNotes}
                          onChange={(e) => setLogNotes(e.target.value)}
                          placeholder="Provide details of parts, dyno results, alignments..." 
                          className="glass-input w-full p-2.5 rounded-xl text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Cost ($ USD)</label>
                          <input 
                            type="number" 
                            value={logCost}
                            onChange={(e) => setLogCost(e.target.value)}
                            placeholder="e.g. 150" 
                            className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Service Date</label>
                          <input 
                            type="date" 
                            required
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingLog}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/15 flex items-center justify-center gap-1 min-h-[44px] cursor-pointer"
                      >
                        {submittingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        {isShop ? 'Stamp Certified Record' : 'Log Maintenance Event'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 text-center space-y-3">
                    <Info className="w-8 h-8 text-neutral-600 mx-auto" />
                    <h4 className="text-xs font-bold text-white uppercase">Certified Stamping</h4>
                    <p className="text-[11px] text-neutral-400 leading-normal">
                      Only the verified vehicle owner or certified Gridpass business profiles (detailers, service centers) can log maintenance timeline events.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Historical logs list */}
              <div className="md:col-span-7 space-y-4">
                <div className="glass-card p-6 rounded-3xl border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-500" /> Service Timeline History
                  </h3>

                  {serviceLogs.length > 0 ? (
                    <div className="space-y-4 relative border-l border-neutral-900 ml-3 pl-4">
                      {serviceLogs.map((log) => (
                        <div key={log.id} className="relative space-y-1 text-xs">
                          {/* Dot pointer indicator */}
                          <div className={`absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                            log.is_verified ? 'bg-emerald-500 border-[#060608]' : 'bg-neutral-850 border-neutral-900'
                          }`} />
                          
                          <div className="flex items-center justify-between font-bold">
                            <h4 className="text-white uppercase flex items-center gap-1">
                              {log.title}
                              {log.is_verified && (
                                <span className="inline-flex text-[9px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-bold">
                                  Shop Certified
                                </span>
                              )}
                            </h4>
                            <span className="text-[10px] font-mono text-neutral-500">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-neutral-400 font-medium pt-1">{log.notes}</p>
                          
                          <div className="flex items-center gap-4 text-[9px] font-mono text-neutral-500 pt-1">
                            {log.cost && <span>Cost: ${log.cost}</span>}
                            <span>Recorded by: {log.recorded_by}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-550 space-y-2">
                      <Wrench className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs uppercase font-mono font-bold">No timeline history recorded.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      <Footer />
    </main>
  );
}
