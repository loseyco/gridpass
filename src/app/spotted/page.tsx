'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { 
  Camera, MapPin, Compass, ArrowLeft, Loader2, 
  CheckCircle2, AlertTriangle, Plus, Eye 
} from 'lucide-react';
import { logEvent } from '@/lib/logger';

interface SightingItem {
  id: string;
  vehicle_id: string;
  vehicle_info: string;
  spotted_by: string;
  location_name: string;
  description: string;
  timestamp: string;
}

export default function SpottedFeedPage() {
  const { user, loading: authLoading } = useAuth();

  // State
  const [sightings, setSightings] = useState<SightingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [tagId, setTagId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  // Load Sightings Feed
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadSightings() {
      if (isMock) {
        await new Promise(r => setTimeout(r, 100));
        const mockSightings: SightingItem[] = [
          {
            id: 'sight-1',
            vehicle_id: 'mock-v1',
            vehicle_info: '2024 Ford Mustang GT',
            spotted_by: 'Sarah Spotter',
            location_name: 'Wall Stadium Speedway',
            description: 'Looking clean in the paddock! Roush exhaust sounded incredible.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: 'sight-2',
            vehicle_id: 'mock-v2',
            vehicle_info: '2021 Porsche 911 GT3 RS',
            spotted_by: 'Marcus Mustang',
            location_name: 'Englishtown Raceway',
            description: 'Tearing up the curves in intermediate group. Mind-blowing build.',
            timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];

        if (isMounted) {
          setSightings(mockSightings);
          setLoading(false);
        }
        return;
      }

      try {
        const sQuery = query(collection(db, 'sightings'), orderBy('timestamp', 'desc'), limit(30));
        const sSnap = await getDocs(sQuery);
        const list = sSnap.docs.map(doc => {
          const data = doc.data();
          const localTime = data.timestamp?.toDate()
            ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            id: doc.id,
            vehicle_id: data.vehicle_id || 'mock-v1',
            vehicle_info: data.vehicle_info || 'Unknown Vehicle',
            spotted_by: data.spotted_by || 'Passerby Spotter',
            location_name: data.location_name || 'Racetrack Lot',
            description: data.description || 'Spotted this build!',
            timestamp: localTime
          } as SightingItem;
        });

        if (isMounted) {
          setSightings(list);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load sightings feed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSightings();
    return () => { isMounted = false; };
  }, [authLoading, isMock]);

  // Submit Sighting Spot
  const handleAddSighting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagId.trim() || !locationName.trim() || !description.trim()) {
      alert("Please fill in all sighting fields.");
      return;
    }

    setSubmitting(true);

    const sightingPayload = {
      vehicle_id: 'mock-v1', // default fallback link
      vehicle_info: tagId === 'GP-MARCUS-GT' ? '2024 Ford Mustang GT' : 'Custom Build Spec',
      spotted_by: user?.displayName || user?.email || 'Sarah Spotter',
      location_name: locationName,
      description: description,
      timestamp: new Date().toISOString()
    };

    if (isMock) {
      await new Promise(r => setTimeout(r, 200));
      // Append locally for testing
      const newEntry: SightingItem = {
        id: `local-sight-${Date.now()}`,
        vehicle_id: tagId === 'GP-MARCUS-GT' ? 'mock-v1' : 'mock-v2',
        vehicle_info: sightingPayload.vehicle_info,
        spotted_by: sightingPayload.spotted_by,
        location_name: sightingPayload.location_name,
        description: sightingPayload.description,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSightings(prev => [newEntry, ...prev]);
      setTagId('');
      setLocationName('');
      setDescription('');
      setShowAddForm(false);
      setSubmitting(false);
      await logEvent('success', 'scan', `Mock sighting added for tag [${tagId}]`);
      return;
    }

    try {
      // Find corresponding vehicle ID from tag ID query
      let matchedVehicleId = 'mock-v1';
      let matchedVehicleInfo = 'Custom Build Spec';

      const vQuery = query(collection(db, 'vehicles'), where('tag_id', '==', tagId.trim()));
      const vSnap = await getDocs(vQuery);
      if (!vSnap.empty) {
        const vDoc = vSnap.docs[0];
        const vData = vDoc.data();
        matchedVehicleId = vDoc.id;
        matchedVehicleInfo = `${vData.year || 2024} ${vData.make || ''} ${vData.model || ''}`;
      }

      await addDoc(collection(db, 'sightings'), {
        ...sightingPayload,
        vehicle_id: matchedVehicleId,
        vehicle_info: matchedVehicleInfo,
        timestamp: serverTimestamp()
      });

      // Reload list locally
      const newEntry: SightingItem = {
        id: `db-sight-${Date.now()}`,
        vehicle_id: matchedVehicleId,
        vehicle_info: matchedVehicleInfo,
        spotted_by: sightingPayload.spotted_by,
        location_name: sightingPayload.location_name,
        description: sightingPayload.description,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSightings(prev => [newEntry, ...prev]);
      setTagId('');
      setLocationName('');
      setDescription('');
      setShowAddForm(false);
      await logEvent('success', 'scan', `Vehicle sighting logged for tag [${tagId}]`);
    } catch (err) {
      console.error("Failed to add sighting:", err);
      alert("Error logging the sighting details.");
    } finally {
      setSubmitting(false);
    }
  };

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
            Live Feed Discovery
          </span>
        </div>

        {/* Spotted Title Banner */}
        <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none pt-1">
              Spotted Near You
            </h1>
            <p className="text-xs text-neutral-400 font-medium flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-neutral-500 animate-spin-slow" /> Real-time geolocated sighting feed
            </p>
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/10 transition-all min-h-[48px] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Sighting
          </button>
        </div>

        {/* Add Sighting Form */}
        {showAddForm && (
          <form onSubmit={handleAddSighting} className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/30 space-y-5">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-3">
              <Camera className="w-5 h-5 text-red-500" /> Log New Vehicle Sighting
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1.5 tracking-wider">
                  Vehicle Tag ID (QR code code)
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. GP-MARCUS-GT"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 focus:border-red-500 text-white rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-colors min-h-[54px]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1.5 tracking-wider">
                  Location Name
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Englishtown Raceway Pit"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 focus:border-red-500 text-white rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-colors min-h-[54px]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1.5 tracking-wider">
                Spot Details / Description
              </label>
              <textarea 
                required
                rows={3}
                placeholder="Describe the build mods, sounds, or visual state..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-850 focus:border-red-500 text-white rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-colors min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-mono font-bold uppercase text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-red-600/15 min-h-[54px] cursor-pointer"
              >
                {submitting ? 'Logging Spot...' : 'Submit Sighting Spot →'}
              </button>
            </div>
          </form>
        )}

        {/* Timeline feed */}
        <div className="space-y-6">
          {sightings.length > 0 ? (
            sightings.map((s) => (
              <div 
                key={s.id} 
                className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/20 grid grid-cols-1 md:grid-cols-12 gap-6 items-start hover:border-red-500/10 transition-colors"
              >
                
                {/* Left side info */}
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-900 border border-neutral-850 rounded-xl flex items-center justify-center text-red-500">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">Logged Sighting</span>
                      <h3 className="text-base font-black text-white uppercase tracking-tight leading-tight">
                        {s.vehicle_info}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    “{s.description}”
                  </p>

                  {/* Sighting Metadata */}
                  <div className="flex flex-wrap gap-4 text-[10px] font-mono font-bold text-neutral-500 uppercase">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-600" /> {s.location_name}
                    </span>
                    <span>•</span>
                    <span>Spotted By: {s.spotted_by}</span>
                    <span>•</span>
                    <span>{s.timestamp}</span>
                  </div>
                </div>

                {/* Right side link */}
                <div className="md:col-span-4 flex md:justify-end md:items-center h-full">
                  <Link 
                    href={`/v/${s.vehicle_id}`}
                    className="px-4 py-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 hover:border-red-500/20 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-white rounded-xl flex items-center gap-1 transition-all w-full md:w-auto justify-center min-h-[48px]"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Build Passport →
                  </Link>
                </div>

              </div>
            ))
          ) : (
            <div className="glass-card p-16 rounded-[2rem] border-neutral-900 bg-neutral-950/20 text-center space-y-3">
              <Compass className="w-12 h-12 mx-auto text-neutral-850 animate-spin-slow" />
              <h4 className="text-xs font-black text-neutral-450 uppercase tracking-widest">No recent sightings logged</h4>
              <p className="text-[11px] text-neutral-500">Be the first to scan a decal and spot a build near you!</p>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </main>
  );
}
