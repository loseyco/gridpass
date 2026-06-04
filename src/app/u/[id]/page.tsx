'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { 
  UserCircle2, Instagram, Youtube, Compass, MapPin, 
  CarFront, Loader2, ArrowLeft, Heart, ShieldCheck, Link2
} from 'lucide-react';

interface DriverProfile {
  uid: string;
  email: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  is_supporter?: boolean;
  socials?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
}

interface Vehicle {
  id: string;
  tag_id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
}

export default function DriverProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = (params?.id as string) || '';

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadDriverProfile() {
      if (isMock) {
        // Return simulated mock driver profile for tests
        await new Promise(r => setTimeout(r, 100));
        
        const mockProfile: DriverProfile = {
          uid: userId || 'user-marcus-123',
          email: 'marcus@enthusiast.com',
          display_name: 'Marcus Mustang',
          bio: 'Everyday track hobbyist, Mustang enthusiast, carbon enthusiast.',
          is_supporter: true,
          socials: {
            instagram: 'marcus_stang_gt',
            youtube: 'MarcusTrackDays',
            tiktok: 'marcus_gt'
          }
        };

        const mockVehicles: Vehicle[] = [
          {
            id: 'mock-v1',
            tag_id: 'GP-MARCUS-GT',
            year: 2024,
            make: 'Ford',
            model: 'Mustang GT',
            trim: 'Premium'
          }
        ];

        if (isMounted) {
          setProfile(mockProfile);
          setVehicles(mockVehicles);
          setLoading(false);
        }
        return;
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const uDoc = await getDoc(doc(db, 'users', userId));
        if (uDoc.exists()) {
          const uData = uDoc.data();
          const loadedProfile: DriverProfile = {
            uid: uDoc.id,
            email: uData.email || '',
            display_name: uData.display_name || uData.name || 'Anonymous Driver',
            bio: uData.bio,
            avatar_url: uData.avatar_url,
            is_supporter: uData.is_supporter === true,
            socials: uData.socials
          };

          if (isMounted) setProfile(loadedProfile);

          // Query owned vehicles
          const vQuery = query(collection(db, 'vehicles'), where('owner_id', '==', uDoc.id));
          const vSnap = await getDocs(vQuery);
          const vList = vSnap.docs.map(vDoc => {
            const vData = vDoc.data();
            return {
              id: vDoc.id,
              tag_id: vData.tag_id || '',
              year: vData.year || 2024,
              make: vData.make || '',
              model: vData.model || '',
              trim: vData.trim
            } as Vehicle;
          });

          if (isMounted) setVehicles(vList);
        }
      } catch (err) {
        console.error("Failed to load driver profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDriverProfile();

    return () => { isMounted = false; };
  }, [userId, authLoading, isMock]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col items-center justify-center space-y-4">
        <UserCircle2 className="w-16 h-16 text-neutral-700" />
        <h2 className="text-xl font-bold uppercase tracking-wider">Driver Passport Not Found</h2>
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

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-8">
        
        {/* Breadcrumb Header */}
        <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Garage Dashboard
        </Link>

        {/* Profile Card layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Driver Info */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Avatar & Support Gilded Ring */}
            <div className="glass-card p-6 rounded-[2rem] border-neutral-900 bg-neutral-950/40 text-center space-y-6">
              
              {/* Avatar ring */}
              <div className="relative inline-block mx-auto">
                <div className={`w-24 h-24 rounded-full bg-neutral-900 border-4 flex items-center justify-center text-neutral-450 ${
                  profile.is_supporter ? 'border-yellow-500 gold-glow-ring' : 'border-neutral-805'
                }`}>
                  <UserCircle2 className="w-16 h-16" />
                </div>
                {profile.is_supporter && (
                  <span className="absolute bottom-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                    PRO
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">{profile.display_name}</h2>
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">{profile.email}</span>
              </div>

              {profile.bio && (
                <p className="text-xs text-neutral-400 leading-relaxed font-medium pt-2 border-t border-neutral-900">
                  “{profile.bio}”
                </p>
              )}

              {/* Social Channels wrapper */}
              <div className="flex justify-center gap-3 pt-2">
                {profile.socials?.instagram && (
                  <a 
                    href={`https://instagram.com/${profile.socials.instagram}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white transition-all"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {profile.socials?.youtube && (
                  <a 
                    href={`https://youtube.com/@${profile.socials.youtube}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white transition-all"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {!profile.socials?.instagram && !profile.socials?.youtube && (
                  <div className="text-[9px] font-mono font-bold text-neutral-600 uppercase tracking-wide">
                    No socials linked.
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Right Column: Owned Vehicles grid */}
          <div className="md:col-span-8 space-y-6">
            
            <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/20 space-y-6">
              
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CarFront className="w-4 h-4 text-red-500" /> Pilot Digital Garage
                </h3>
                <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded-full uppercase">
                  {vehicles.length} Active {vehicles.length === 1 ? 'Build' : 'Builds'}
                </span>
              </div>

              {vehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vehicles.map((v) => (
                    <Link 
                      key={v.id} 
                      href={`/v/${v.id}`}
                      className="p-5 bg-neutral-900/30 hover:bg-red-600/5 border border-neutral-900 hover:border-red-500/20 rounded-3xl transition-all group flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest group-hover:text-red-400 transition-colors">
                          {v.tag_id}
                        </span>
                        <h4 className="text-base font-black text-white uppercase tracking-tight group-hover:text-white leading-snug">
                          {v.year} {v.make} {v.model}
                        </h4>
                        {v.trim && <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{v.trim}</p>}
                      </div>
                      
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider pt-4 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View Passport Details →
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-550 space-y-3">
                  <CarFront className="w-12 h-12 mx-auto opacity-35" />
                  <p className="text-xs uppercase font-mono font-bold">No registered vehicles found in garage.</p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      <Footer />
    </main>
  );
}
