'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, doc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ClipboardCheck, Clock, MapPin, Flag, Loader2, 
  ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck 
} from 'lucide-react';
import { logEvent } from '@/lib/logger';

interface TrackData {
  id: string;
  name: string;
  location: string;
  active_sessions: Array<{ name: string; time: string }>;
  pit_status: 'Green Flag' | 'Yellow Flag' | 'Red Flag';
}

export default function TrackWaiverPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const trackId = (params?.id as string) || '';

  // State
  const [track, setTrack] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [signing, setSigning] = useState(false);

  // Form inputs
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [runGroup, setRunGroup] = useState('Group A');
  const [signedCheckbox, setSignedCheckbox] = useState(false);
  const [sigText, setSigText] = useState('');

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  // Initialize form details when user loads
  useEffect(() => {
    if (user) {
      setDriverName(user.displayName || '');
      setDriverEmail(user.email || '');
    }
  }, [user]);

  // Load Track Details
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadTrackData() {
      if (isMock) {
        await new Promise(r => setTimeout(r, 100));
        const mockTrack: TrackData = {
          id: trackId || 'demo-track',
          name: 'Badlands Offroad Park & Raceway',
          location: 'Attica, Indiana',
          active_sessions: [
            { name: 'Group A - Advanced Track Day', time: '10:00 AM' },
            { name: 'Group B - Intermediate Trial', time: '11:15 AM' },
            { name: 'Group C - Novice Safety Run', time: '01:00 PM' }
          ],
          pit_status: 'Green Flag'
        };

        if (isMounted) {
          setTrack(mockTrack);
          setLoading(false);
        }
        return;
      }

      if (!trackId) {
        setLoading(false);
        return;
      }

      try {
        const tDoc = await getDoc(doc(db, 'tracks', trackId));
        if (tDoc.exists()) {
          const tData = tDoc.data();
          const loadedTrack: TrackData = {
            id: tDoc.id,
            name: tData.name || 'Anonymous Raceway',
            location: tData.location || 'Unknown Location',
            active_sessions: tData.active_sessions || [],
            pit_status: tData.pit_status || 'Green Flag'
          };
          if (isMounted) setTrack(loadedTrack);
        } else {
          // Default fallback for new IDs
          const fallbackTrack: TrackData = {
            id: trackId,
            name: trackId.replace(/-/g, ' ').toUpperCase(),
            location: 'Local Region',
            active_sessions: [
              { name: 'Group A - Advanced', time: '9:00 AM' },
              { name: 'Group B - Intermediate', time: '10:00 AM' },
              { name: 'Group C - Novice', time: '11:00 AM' }
            ],
            pit_status: 'Green Flag'
          };
          if (isMounted) setTrack(fallbackTrack);
        }
      } catch (err) {
        console.error("Failed to load track details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTrackData();
    return () => { isMounted = false; };
  }, [trackId, authLoading, isMock]);

  // Handle Waiver Submission
  const handleSignWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !driverEmail.trim() || !emergencyContact.trim() || !emergencyPhone.trim() || !signedCheckbox || !sigText.trim()) {
      alert("Please fill out all safety fields and sign the release form.");
      return;
    }

    setSigning(true);

    const waiverPayload = {
      track_id: trackId,
      user_id: user?.uid || 'anonymous-driver',
      driver_name: driverName,
      driver_email: driverEmail,
      emergency_name: emergencyContact,
      emergency_phone: emergencyPhone,
      run_group: runGroup,
      signature: sigText,
      signed_at: new Date().toISOString()
    };

    if (isMock) {
      await new Promise(r => setTimeout(r, 200));
      // Store in window mockup context for test verification
      (window as any).__MOCK_TRACK_SESSION__ = waiverPayload;
      setWaiverSigned(true);
      setSigning(false);
      await logEvent('success', 'scan', `Waiver signed for track [${trackId}] by mock user [${driverEmail}]`);
      return;
    }

    try {
      // Add to Firestore database
      await addDoc(collection(db, 'track_waivers'), {
        ...waiverPayload,
        signed_at_db: serverTimestamp()
      });

      setWaiverSigned(true);
      await logEvent('success', 'scan', `Liability waiver signed for track [${trackId}] by ${driverEmail}`);
    } catch (err) {
      console.error("Failed to save liability waiver:", err);
      alert("Error saving your safety waiver. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500" />
        <h2 className="text-xl font-bold uppercase tracking-wider">Track Portal Not Found</h2>
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

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-8">
        
        {/* Breadcrumb Header */}
        <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Garage Dashboard
        </Link>

        {/* Track Title banner */}
        <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/40 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest bg-red-950/20 border border-red-900/30 px-2.5 py-0.5 rounded-full inline-block">
                Digital Waiver Portal
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none pt-1">
                {track.name}
              </h1>
              <p className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" /> {track.location}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border ${
                track.pit_status === 'Green Flag' 
                  ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400' 
                  : 'bg-red-950/30 border-red-900/40 text-red-400'
              }`}>
                <Flag className="w-3.5 h-3.5" /> Pit State: {track.pit_status}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic content (Form vs. Ticket Pass) */}
        {!waiverSigned ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left: Waiver details & schedule */}
            <div className="md:col-span-5 space-y-6">
              
              <div className="glass-card p-6 rounded-[2rem] border-neutral-900 bg-neutral-950/20 space-y-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-red-500" /> Active Run Sessions
                </h3>
                
                <div className="space-y-3 pt-2">
                  {track.active_sessions.length > 0 ? (
                    track.active_sessions.map((s, idx) => (
                      <div key={idx} className="p-3 bg-neutral-900/40 border border-neutral-850 rounded-2xl flex items-center justify-between text-xs">
                        <span className="font-bold text-white uppercase">{s.name}</span>
                        <span className="font-mono text-neutral-400 font-semibold">{s.time}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-neutral-500 font-mono">No active track schedules registered today.</p>
                  )}
                </div>
              </div>

              <div className="p-6 bg-red-950/5 border border-red-900/10 rounded-[2rem] space-y-3">
                <h4 className="text-xs font-black text-red-400 uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Liability Information
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">
                  By signing this document, you acknowledge that motorsports are inherently dangerous. 
                  You waive all rights to sue the promoter, safety staff, track operators, and affiliates for any injury or property damage sustained.
                </p>
              </div>

            </div>

            {/* Right: Signing Form */}
            <div className="md:col-span-7">
              <form onSubmit={handleSignWaiver} className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/30 space-y-5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-3">
                  <ClipboardCheck className="w-5 h-5 text-red-500" /> Driver Safety Waiver Form
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                      Driver Full Name
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. PJ Losey"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-850 focus:border-red-500 text-white rounded-xl px-4 py-3 text-xs font-medium outline-none transition-colors min-h-[54px]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. driver@gridpass.app"
                      value={driverEmail}
                      onChange={(e) => setDriverEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-850 focus:border-red-500 text-white rounded-xl px-4 py-3 text-xs font-medium outline-none transition-colors min-h-[54px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                        Emergency Contact Name
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Sarah Spotter"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 focus:border-red-500 text-white rounded-xl px-4 py-3 text-xs font-medium outline-none transition-colors min-h-[54px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                        Emergency Phone
                      </label>
                      <input 
                        type="tel" 
                        required
                        placeholder="e.g. 555-0199"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 focus:border-red-500 text-white rounded-xl px-4 py-3 text-xs font-medium outline-none transition-colors min-h-[54px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                      Registered Run Group
                    </label>
                    <select 
                      value={runGroup}
                      onChange={(e) => setRunGroup(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-850 focus:border-red-500 text-white rounded-xl px-4 py-3 text-xs font-medium outline-none transition-colors min-h-[54px] cursor-pointer"
                    >
                      <option value="Group A">Group A - Advanced (Instructor Required for Solo)</option>
                      <option value="Group B">Group B - Intermediate (Passing only on straights)</option>
                      <option value="Group C">Group C - Novice (Lead-Follow & Heavy Margins)</option>
                    </select>
                  </div>

                  {/* Liability Signature box */}
                  <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={signedCheckbox}
                        onChange={(e) => setSignedCheckbox(e.target.checked)}
                        className="mt-1 w-4.5 h-4.5 text-red-500 border-neutral-800 rounded focus:ring-red-500 bg-neutral-900"
                      />
                      <span className="text-[11px] text-neutral-400 leading-relaxed font-semibold">
                        I hereby release this racetrack and its staff from all liability, and certify my vehicle is prepped to pass safety tech check-in.
                      </span>
                    </label>

                    <div className="pt-2 border-t border-neutral-850">
                      <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase block mb-1">
                        Scribble/Sign full name below to certify:
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Type Driver Name for digital signature"
                        value={sigText}
                        onChange={(e) => setSigText(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-900 focus:border-red-500 text-white rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none transition-colors min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={signing}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs tracking-wider py-4 rounded-xl transition-all shadow-lg hover:shadow-red-600/10 active:scale-[0.99] flex items-center justify-center gap-1.5 min-h-[56px] cursor-pointer"
                >
                  {signing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Stamping Signature...
                    </>
                  ) : (
                    <>
                      Sign Liability Waiver & Register →
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        ) : (
          /* Check-In Success Gate Pass Ticket */
          <div className="max-w-md mx-auto glass-card p-6 md:p-8 rounded-[2rem] border-emerald-950 bg-emerald-950/5 relative text-center space-y-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
              <UserCheck className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Waiver Signed Successfully</h2>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                Cleared — Gate Scan Ticket Active
              </span>
            </div>

            {/* Simulated pass QR code or barcode box */}
            <div className="bg-white p-4 rounded-3xl inline-block shadow-md">
              <div className="w-40 h-40 bg-neutral-900 rounded-2xl flex items-center justify-center text-white text-xs font-mono font-bold border-4 border-neutral-100 uppercase tracking-widest relative">
                <ShieldCheck className="w-16 h-16 text-emerald-400 opacity-80" />
                <span className="absolute bottom-2 text-[8px] tracking-normal font-medium text-neutral-400">Scan at entrance</span>
              </div>
            </div>

            {/* Summary info cards */}
            <div className="p-4 bg-neutral-950/40 border border-neutral-900 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                <span className="text-neutral-500 font-bold uppercase text-[10px]">Driver Name</span>
                <span className="font-bold text-white uppercase">{driverName}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                <span className="text-neutral-500 font-bold uppercase text-[10px]">Track Registered</span>
                <span className="font-bold text-white uppercase">{track.name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                <span className="text-neutral-500 font-bold uppercase text-[10px]">Run Group</span>
                <span className="font-bold text-red-400 font-mono uppercase">{runGroup}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-neutral-500 font-bold uppercase text-[10px]">Waiver Status</span>
                <span className="font-black text-emerald-400 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Checked-In / Released
                </span>
              </div>
            </div>

            <button 
              onClick={() => setWaiverSigned(false)}
              className="text-xs text-neutral-500 hover:text-white font-mono uppercase font-bold underline transition-colors"
            >
              Sign another waiver/edit details
            </button>
          </div>
        )}

      </div>

      <Footer />
    </main>
  );
}
