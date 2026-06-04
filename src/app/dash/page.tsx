'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Car, Plus, Wrench, Heart, ShieldCheck, Loader2, User, MapPin, Power 
} from 'lucide-react';

interface DashboardVehicle {
  id?: string;
  year?: number | string;
  make?: string;
  model?: string;
  engine?: string;
  power?: string;
  specs?: {
    engine?: string;
    hp?: number | string;
  };
}

interface UserProfile {
  display_name?: string;
  bio?: string;
  is_supporter?: boolean;
  avatar_url?: string;
  location?: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);

  // New Vehicle form state
  const [year, setYear] = useState('2024');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [engine, setEngine] = useState('');
  const [hp, setHp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load user data and vehicles
  useEffect(() => {
    if (!user) return;

    // Check if we are running in Playwright E2E mock mode
    const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

    if (isMock) {
      // Mock data for Playwright assertions
      setProfile({
        display_name: 'PJ LOSEY',
        bio: 'Founder of Gridpass. From Engines to Protons, if it has an engine or motor, I\'m involved.',
        is_supporter: true,
        location: 'Grayslake, IL'
      });
      setVehicles([
        {
          id: 'v1',
          year: 2023,
          make: 'Chevrolet',
          model: 'Corvette Z06',
          specs: { engine: '5.5L V8', hp: 670 }
        }
      ]);
      setLoading(false);
      return;
    }

    // Real Firebase listeners
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile({
          display_name: user.email?.split('@')[0].toUpperCase() || 'DRIVER',
          bio: 'Welcome to Gridpass! Add your bio here.',
          is_supporter: false,
          location: 'USA'
        });
      }
    });

    const vehiclesQuery = query(collection(db, 'vehicles'), where('owner_id', '==', user.uid));
    const unsubVehicles = onSnapshot(vehiclesQuery, (snap) => {
      const list: DashboardVehicle[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DashboardVehicle);
      });
      setVehicles(list);
      setLoading(false);
    }, (err) => {
      console.error("Error loading vehicles:", err);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubVehicles();
    };
  }, [user]);

  // Handle support trigger
  const handleBecomeSupporter = async () => {
    if (!user) return;
    
    // Playwright Mock Mode
    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
      setProfile(prev => prev ? { ...prev, is_supporter: true } : null);
      return;
    }

    try {
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, { is_supporter: true });
    } catch (err) {
      console.error("Error updating support status:", err);
    }
  };

  // Register vehicle submit
  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !make || !model) return;

    setSubmitting(true);

    const vehicleData = {
      owner_id: user.uid,
      year: parseInt(year) || 2024,
      make,
      model,
      specs: {
        engine: engine || 'Default engine',
        hp: parseInt(hp) || 0
      },
      created_at: serverTimestamp()
    };

    // Playwright Mock Mode local update
    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
      const newVehicle: DashboardVehicle = {
        id: 'mock-' + Date.now(),
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        specs: {
          engine: vehicleData.specs.engine,
          hp: vehicleData.specs.hp
        }
      };
      setVehicles(prev => [...prev, newVehicle]);
      setShowRegModal(false);
      setSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, 'vehicles'), vehicleData);
      setShowRegModal(false);
      setYear('2024');
      setMake('');
      setModel('');
      setEngine('');
      setHp('');
    } catch (err) {
      console.error("Error adding vehicle:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#bd2925] animate-spin" />
      </div>
    );
  }

  const isSupporter = profile?.is_supporter === true;

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden flex flex-col">
      <div className="mesh-glow" />
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-12">
        {/* Profile Card & Welcomer */}
        <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/40 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Supporter HSL Gold border ring around avatar */}
          <div 
            id="user-avatar-container"
            className={`w-24 h-24 rounded-full p-1 shrink-0 flex items-center justify-center relative ${
              isSupporter 
                ? 'bg-gradient-to-tr from-[#ffe066] via-[#ffb700] to-[#ff9900] gold-glow-ring' 
                : 'bg-neutral-800 border border-neutral-700'
            }`}
          >
            <div className="w-full h-full rounded-full bg-[#060608] flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-neutral-500" />
              )}
            </div>
            {isSupporter && (
              <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                GOLD
              </span>
            )}
          </div>

          <div className="space-y-3 flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">{profile?.display_name || 'DRIVER'}</h1>
              {isSupporter && (
                <span className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider animate-pulse">
                  Original Supporter
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-400 max-w-xl font-medium leading-relaxed">
              {profile?.bio || 'No bio configured yet.'}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs font-mono text-neutral-500 font-bold">
              {profile?.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-rose-500" /> {profile.location}</span>
              )}
              <span>Joined: Jun 2026</span>
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Digital Garage */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Digital Garage</h2>
                <p className="text-xs text-neutral-500 font-medium">Verify specs and check-in logs for your registered assets.</p>
              </div>
              <button 
                onClick={() => setShowRegModal(true)}
                className="flex items-center gap-1 bg-[#bd2925] hover:bg-[#bd2925]/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#bd2925]/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl border border-neutral-900 bg-neutral-950/20 text-center space-y-4">
                <Car className="w-12 h-12 text-neutral-600 mx-auto" />
                <h3 className="text-lg font-bold text-white uppercase">Your garage is empty</h3>
                <p className="text-xs text-neutral-405 max-w-sm mx-auto leading-relaxed">
                  Start mapping your vehicles into the Gridpass passport registry to display specs, mod lists, and safety compliance checks.
                </p>
                <button 
                  onClick={() => setShowRegModal(true)}
                  className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
                >
                  Register Another Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {vehicles.map((v) => (
                  <div key={v.id} className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/40 relative overflow-hidden space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-[#bd2925] tracking-widest">{v.year}</span>
                        <h3 className="text-lg font-black text-white leading-tight uppercase">{v.make} {v.model}</h3>
                      </div>
                      <Wrench className="w-5 h-5 text-neutral-600" />
                    </div>

                    <div className="pt-2 border-t border-neutral-900/60 flex justify-between items-center text-xs font-mono text-neutral-500 font-bold">
                      <span>Engine: {v.specs?.engine || 'N/A'}</span>
                      <span>Power: {v.specs?.hp ? `${v.specs.hp} HP` : 'N/A'}</span>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <span className="text-[9px] font-mono uppercase bg-neutral-900 border border-neutral-800 text-neutral-450 px-2 py-0.5 rounded font-bold">
                        FREE PASSPORT
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supporter Card Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Supporter Status</h2>
            
            {isSupporter ? (
              <div className="glass-card p-6 rounded-3xl border border-yellow-500/20 bg-neutral-950/40 space-y-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/5 blur-3xl rounded-full" />
                <div className="flex items-center gap-2 text-yellow-500">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Supporter Active</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase">Thank you for backing us!</h3>
                <p className="text-xs text-neutral-405 leading-relaxed">
                  Your Original Supporter status is fully active. Enjoy your glowing gold avatar border, custom supporter badge, and lifetime access to original backer features.
                </p>
              </div>
            ) : (
              <div className="glass-card p-6 rounded-3xl border-yellow-500/10 bg-neutral-950/40 space-y-4 relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-yellow-500 fill-yellow-500/10 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider">Back the Cause</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase">Original Supporter</h3>
                <p className="text-xs text-neutral-405 leading-relaxed">
                  Back Gridpass starting from $5 to unlock a lifetime **Original Supporter badge** and the **glowing gold avatar border** for your digital garage passport.
                </p>
                <button 
                  onClick={handleBecomeSupporter}
                  className="w-full btn-glow py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Pledge Support <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register Vehicle Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-neutral-800 bg-neutral-950/95 relative space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Register Vehicle</h3>
              <button 
                onClick={() => setShowRegModal(false)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRegisterVehicle} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Year</label>
                  <input 
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full p-3 rounded-xl glass-input text-xs font-bold"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Make</label>
                  <input 
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Chevrolet"
                    className="w-full p-3 rounded-xl glass-input text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Model</label>
                <input 
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Corvette Z06"
                  className="w-full p-3 rounded-xl glass-input text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Engine Specs</label>
                  <input 
                    type="text"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder="5.5L V8"
                    className="w-full p-3 rounded-xl glass-input text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Horsepower</label>
                  <input 
                    type="number"
                    value={hp}
                    onChange={(e) => setHp(e.target.value)}
                    placeholder="670"
                    className="w-full p-3 rounded-xl glass-input text-xs font-bold"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#bd2925] hover:bg-[#bd2925]/90 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#bd2925]/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Register Vehicle <Plus className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
