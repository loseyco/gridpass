'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Car, Plus, Wrench, Heart, ShieldCheck, Loader2, User, MapPin, 
  Printer, Sparkles, CheckCircle, Share2, Compass, QrCode
} from 'lucide-react';

interface DashboardVehicle {
  id?: string;
  year?: number | string;
  make?: string;
  model?: string;
  engine?: string;
  power?: string;
  trim?: string;
  photo_url?: string;
  specs?: {
    engine?: string;
    hp?: number | string;
  };
}

interface UserProfile {
  display_name?: string;
  username?: string;
  bio?: string;
  is_supporter?: boolean;
  avatar_url?: string;
  location?: string;
  badges?: string[];
  home_town?: string;
  birth_town?: string;
  birthday?: string;
  billing_address?: string;
  social_instagram?: string;
  social_youtube?: string;
  social_tiktok?: string;
  social_facebook?: string;
  social_twitter?: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMock = typeof window !== 'undefined' && !!(window as any).__PLAYWRIGHT_MOCK__;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [year, setYear] = useState('2024');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [engine, setEngine] = useState('');
  const [hp, setHp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

    if (isMock) {
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
          trim: 'Z06 Coupe',
          photo_url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=400&q=80',
          specs: { engine: '5.5L V8', hp: 670 }
        }
      ]);
      setLoading(false);
      return;
    }

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

  const handleBecomeSupporter = async () => {
    if (!user) return;
    
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

  const handleCopyInviteLink = async () => {
    try {
      const inviteLink = `${window.location.origin}/login?mode=register`;
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

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
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  const isSupporter = profile?.is_supporter === true;

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col max-w-4xl mx-auto w-full p-4 space-y-6">
      
      {/* Simple Profile Row */}
      <div className="flex items-center gap-4 py-3 border-b border-neutral-100">
        <div 
          id="user-avatar-container"
          className={`w-14 h-14 rounded-full p-0.5 shrink-0 flex items-center justify-center relative ${
            isSupporter 
              ? 'bg-gradient-to-tr from-[#ffe066] via-[#ffb700] to-[#ff9900] gold-glow-ring' 
              : 'bg-neutral-100 border border-neutral-200'
          }`}
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-neutral-450" />
            )}
          </div>
          {isSupporter && (
            <span className="absolute -bottom-0.5 -right-0.5 bg-[#ffd60a] text-black text-[7px] font-black px-1 py-0.2 rounded-full">
              GOLD
            </span>
          )}
        </div>

        <div className="space-y-1.5 min-w-0 flex-1">
          <h1 className="text-base font-extrabold uppercase text-neutral-900 truncate">
            {profile?.display_name || user?.displayName || 'DRIVER'}
          </h1>
          <div className="text-[9px] font-mono font-bold text-[#ff3b30] flex gap-3 items-center">
            <Link 
              href="/dash/edit-profile"
              className="hover:underline uppercase tracking-wider text-neutral-500 font-bold"
            >
              Edit Profile
            </Link>
            <span className="text-neutral-300">|</span>
            <Link href={profile?.username ? `/u/${profile.username}` : `/u/${user?.uid || ''}`} className="hover:underline uppercase tracking-wider text-[#ff3b30] font-bold">
              Public Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Digital Garage Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
            Digital Garage
          </h2>
          <button 
            onClick={() => setShowRegModal(true)}
            className="flex items-center gap-1 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Vehicle
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-xl text-center space-y-3">
            <Car className="w-8 h-8 text-neutral-400 mx-auto" />
            <h3 className="text-xs font-bold text-neutral-900 uppercase">Your garage is empty</h3>
            <p className="text-[10px] text-neutral-500 max-w-xs mx-auto leading-normal">
              Register vehicles to configure digital mod catalogs and generate printable decals.
            </p>
          </div>
        ) : (
          /* Simple Vertical Compact Rows */
          <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-200">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3.5 bg-white hover:bg-neutral-50 transition-colors gap-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Photo on the left */}
                  <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                    {v.photo_url ? (
                      <img src={v.photo_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>

                  {/* Year, Make, Model, Trim */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[9px] font-mono font-bold text-[#ff3b30]">{v.year}</span>
                      <h3 className="text-xs font-extrabold text-neutral-900 uppercase truncate">
                        {v.make} {v.model}
                      </h3>
                    </div>
                    {v.trim && (
                      <div className="text-[9px] font-mono text-neutral-400 font-bold uppercase">
                        {v.trim}
                      </div>
                    )}
                  </div>
                </div>

                {/* Flat, compact, un-wrapping actions */}
                <div className="flex gap-1.5 shrink-0">
                  <Link
                    href={`/v/${v.id}`}
                    className="text-[9px] font-bold border border-neutral-200 hover:border-neutral-350 bg-white text-neutral-700 px-3.5 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* iOS Settings-Like Settings Stack */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider">Membership</h3>
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl divide-y divide-neutral-200 overflow-hidden">
          
          {/* Support row - visible only under test mock environments */}
          {isMock && (
            <div className="p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wide">Supporter Tier</span>
                <span className={`text-[9px] font-mono font-bold uppercase ${isSupporter ? 'text-yellow-600' : 'text-neutral-400'}`}>
                  {isSupporter ? 'Supporter Active' : 'Standard'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-normal">
                {isSupporter 
                  ? 'Thank you for backing the universal registry. Your gold pass border is active.' 
                  : 'Help fund development starting from $5 to unlock a lifetime backer badge.'}
              </p>
              {!isSupporter && (
                <button 
                  onClick={handleBecomeSupporter}
                  className="mt-1 w-full py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-bold uppercase rounded-lg transition-colors"
                >
                  Pledge Support
                </button>
              )}
            </div>
          )}

          {/* Badges row */}
          {profile?.badges && profile.badges.length > 0 && (
            <div className="p-3.5 space-y-2">
              <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wide block">Unlocked Badges</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.badges.map((badge, idx) => (
                  <span 
                    key={idx}
                    className="text-[8px] font-mono font-bold uppercase bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded"
                  >
                    {badge.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Invite row */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wide block">Invite Driver</span>
              <p className="text-[9px] text-neutral-500 truncate">Share your invite link with other drivers</p>
            </div>
            <button 
              onClick={handleCopyInviteLink}
              className="px-3 py-1.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white text-[9px] font-bold uppercase rounded-lg transition-colors shrink-0"
            >
              {copied ? 'Copied' : 'Invite'}
            </button>
          </div>

        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm p-5 rounded-2xl border border-neutral-200 relative space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900 uppercase">Register Vehicle</h3>
              <button 
                onClick={() => setShowRegModal(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleRegisterVehicle} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Year</label>
                  <input 
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] text-center"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-0.5">
                  <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Make</label>
                  <input 
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Chevrolet"
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Model</label>
                <input 
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Corvette Z06"
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Engine</label>
                  <input 
                    type="text"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder="5.5L V8"
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Power (HP)</label>
                  <input 
                    type="number"
                    value={hp}
                    onChange={(e) => setHp(e.target.value)}
                    placeholder="670"
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 mt-2 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Vehicle'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
