'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ClipboardCheck, Clock, MapPin, Flag, Loader2, ArrowLeft, 
  CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, Waves,
  Shield, Milestone, Sparkles, Navigation2
} from 'lucide-react';
import { logEvent } from '@/lib/logger';
import { Venue } from '@/lib/types/venue';
import VenueSpotMapper from './VenueSpotMapper';

interface VenuePortalViewProps {
  venue: Venue;
}

export default function VenuePortalView({ venue }: VenuePortalViewProps) {
  const { user, loading: authLoading } = useAuth();
  
  // Theme state
  const isWater = venue.type === 'waterway';
  const isTrack = venue.type === 'racetrack';
  const isOffroad = venue.type === 'offroad_park';
  const isEvent = venue.type === 'event_center';

  // Styles Map
  const themeColors = {
    waterway: {
      text: 'text-cyan-400',
      bgGlow: 'bg-cyan-950/20 border-cyan-900/30',
      badge: 'bg-cyan-950/30 border-cyan-900/40 text-cyan-400',
      button: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/10 focus:border-cyan-500',
      icon: 'text-cyan-400',
      mesh: 'rgba(6,182,212,0.15)',
      loader: 'text-cyan-500'
    },
    racetrack: {
      text: 'text-red-400',
      bgGlow: 'bg-red-950/20 border-red-900/30',
      badge: 'bg-red-950/30 border-red-900/40 text-red-400',
      button: 'bg-red-600 hover:bg-red-500 shadow-red-600/10 focus:border-red-500',
      icon: 'text-red-500',
      mesh: 'rgba(239,68,68,0.15)',
      loader: 'text-red-500'
    },
    offroad_park: {
      text: 'text-amber-400',
      bgGlow: 'bg-amber-950/20 border-amber-900/30',
      badge: 'bg-amber-950/30 border-amber-900/40 text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/10 focus:border-amber-500',
      icon: 'text-amber-500',
      mesh: 'rgba(245,158,11,0.15)',
      loader: 'text-amber-500'
    },
    event_center: {
      text: 'text-yellow-400',
      bgGlow: 'bg-yellow-950/20 border-yellow-900/30',
      badge: 'bg-yellow-950/30 border-yellow-900/40 text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/10 focus:border-yellow-500',
      icon: 'text-yellow-500',
      mesh: 'rgba(234,179,8,0.15)',
      loader: 'text-yellow-500'
    }
  };

  const style = themeColors[venue.type] || themeColors.racetrack;

  // Form inputs
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [runGroup, setRunGroup] = useState('Group A');
  const [signedCheckbox, setSignedCheckbox] = useState(false);
  const [sigText, setSigText] = useState('');

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  // Active Tab state
  const [portalTab, setPortalTab] = useState<'map' | 'waiver' | 'details' | 'rules'>(
    venue.type === 'racetrack' ? 'waiver' : 'map'
  );

  // Waiver signing states
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [signing, setSigning] = useState(false);

  // Geofencing states
  const [insideGeofence, setInsideGeofence] = useState(!!isMock);
  const [checkingGeofence, setCheckingGeofence] = useState(false);

  // Initialize form details when user loads
  useEffect(() => {
    if (user) {
      setDriverName(user.displayName || '');
      setDriverEmail(user.email || '');
    }
  }, [user]);

  // Simulate active geofencing coordinates checks
  useEffect(() => {
    if (isMock) {
      setInsideGeofence(true);
      setCheckingGeofence(false);
      return;
    }
    setCheckingGeofence(true);
    const timer = setTimeout(() => {
      setInsideGeofence(true);
      setCheckingGeofence(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [venue, isMock]);

  // Handle Waiver Submission
  const handleSignWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !driverEmail.trim() || !emergencyContact.trim() || !emergencyPhone.trim() || !signedCheckbox || !sigText.trim()) {
      alert("Please fill out all safety fields and sign the release form.");
      return;
    }

    setSigning(true);

    const waiverPayload = {
      track_id: venue.id,
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
      (window as any).__MOCK_TRACK_SESSION__ = waiverPayload;
      setWaiverSigned(true);
      setSigning(false);
      await logEvent('success', 'scan', `Waiver signed for track [${venue.id}] by mock user [${driverEmail}]`);
      return;
    }

    try {
      await addDoc(collection(db, 'track_waivers'), {
        ...waiverPayload,
        signed_at_db: serverTimestamp()
      });

      setWaiverSigned(true);
      await logEvent('success', 'scan', `Liability waiver signed for track [${venue.id}] by ${driverEmail}`);
    } catch (err) {
      console.error("Failed to save liability waiver:", err);
      alert("Error saving your safety waiver. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative flex flex-col">
      {/* Mesh Glow Background */}
      <div 
        className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none transition-all duration-700" 
        style={{
          background: `radial-gradient(circle at 50% 0%, ${style.mesh} 0%, transparent 70%)`
        }}
      />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Garage Dashboard
          </Link>

          {/* Active Geofence Alert */}
          <div className={`text-[10px] font-mono font-bold px-3.5 py-1 rounded-xl border flex items-center gap-1.5 ${
            checkingGeofence 
              ? 'bg-neutral-900/40 border-neutral-800 text-neutral-500' 
              : insideGeofence
              ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 animate-pulse'
              : 'bg-red-950/20 border-red-900/30 text-red-400'
          }`}>
            <Navigation2 className="w-3.5 h-3.5" />
            {checkingGeofence ? 'GPS Tracking Active...' : insideGeofence ? 'Geofence Active: Safe Zone location sharing' : 'Outside Venue Boundary: Tracking Disabled'}
          </div>
        </div>

        {/* Dynamic Venue Title Banner */}
        <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/40 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block border ${style.badge}`}>
                {venue.type === 'waterway' 
                  ? 'Smart-Water Ecosystem' 
                  : venue.type === 'racetrack'
                  ? 'Digital Waiver Portal'
                  : venue.type === 'offroad_park'
                  ? 'Offroad Trail Portal'
                  : 'Event & Car Show Center'}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none pt-1">
                {venue.name}
              </h1>
              <p className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" /> {venue.location}
              </p>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center gap-3">
              {venue.pit_status && (
                <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border ${
                  venue.pit_status === 'Green Flag' 
                    ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400' 
                    : 'bg-red-950/30 border-red-900/40 text-red-400'
                }`}>
                  <Flag className="w-3.5 h-3.5" /> Track Status: {venue.pit_status}
                </span>
              )}
              {venue.gate_status && (
                <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border ${
                  venue.gate_status === 'Open' 
                    ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400' 
                    : 'bg-red-950/30 border-red-900/40 text-red-400'
                }`}>
                  <Flag className="w-3.5 h-3.5" /> Gate: {venue.gate_status}
                </span>
              )}
              {isWater && (
                <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border bg-cyan-950/30 border-cyan-900/40 text-cyan-400">
                  <Waves className="w-3.5 h-3.5" /> Boat Mode Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Selection Controls */}
        <div className="flex border-b border-neutral-900 pb-3 gap-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setPortalTab('map')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              portalTab === 'map' ? `border-white text-white font-black` : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Live Map & Spots
          </button>
          
          {isTrack && (
            <button
              onClick={() => setPortalTab('waiver')}
              className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                portalTab === 'waiver' ? `border-white text-white font-black` : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Sign Waiver
            </button>
          )}

          <button
            onClick={() => setPortalTab('details')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              portalTab === 'details' ? `border-white text-white font-black` : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {isWater ? 'Ramps & Launches' : isOffroad ? 'Campgrounds' : isEvent ? 'Show Schedule & Vendors' : 'Run Schedules'}
          </button>

          <button
            onClick={() => setPortalTab('rules')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              portalTab === 'rules' ? `border-white text-white font-black` : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Rules & Safety
          </button>
        </div>

        {/* Render Tab Contents */}
        {portalTab === 'map' && (
          <VenueSpotMapper venue={venue} />
        )}

        {portalTab === 'waiver' && isTrack && (
          /* Liability Safety Waiver Form matching Phase 4 */
          !waiverSigned ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              <div className="md:col-span-5 space-y-6 text-left">
                <div className="glass-card p-6 rounded-[2rem] border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-red-500" /> Active Run Sessions
                  </h3>
                  
                  <div className="space-y-3 pt-2">
                    {venue.active_sessions && venue.active_sessions.length > 0 ? (
                      venue.active_sessions.map((s, idx) => (
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

              <div className="md:col-span-7">
                <form onSubmit={handleSignWaiver} className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/30 space-y-5 text-left">
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
                        <option value="Group A">Group A - Advanced (Instructor Required)</option>
                        <option value="Group B">Group B - Intermediate (Passing on straights)</option>
                        <option value="Group C">Group C - Novice (Lead-Follow rules)</option>
                      </select>
                    </div>

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
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[56px] cursor-pointer"
                  >
                    {signing ? 'Stamping Signature...' : 'Sign Liability Waiver & Register →'}
                  </button>
                </form>
              </div>

            </div>
          ) : (
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

              <div className="bg-white p-4 rounded-3xl inline-block shadow-md">
                <div className="w-40 h-40 bg-neutral-900 rounded-2xl flex items-center justify-center text-white text-xs font-mono font-bold border-4 border-neutral-100 uppercase tracking-widest relative">
                  <ShieldCheck className="w-16 h-16 text-emerald-400 opacity-80" />
                  <span className="absolute bottom-2 text-[8px] tracking-normal font-medium text-neutral-400">Scan at entrance</span>
                </div>
              </div>

              <div className="p-4 bg-neutral-950/40 border border-neutral-900 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                  <span className="text-neutral-500 font-bold uppercase text-[10px]">Driver Name</span>
                  <span className="font-bold text-white uppercase">{driverName}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                  <span className="text-neutral-500 font-bold uppercase text-[10px]">Track Registered</span>
                  <span className="font-bold text-white uppercase">{venue.name}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                  <span className="text-neutral-500 font-bold uppercase text-[10px]">Run Group</span>
                  <span className="font-bold text-red-400 font-mono uppercase">{runGroup}</span>
                </div>
              </div>

              <button 
                onClick={() => setWaiverSigned(false)}
                className="text-xs text-neutral-500 hover:text-white font-mono uppercase font-bold underline transition-colors"
              >
                Sign another waiver/edit details
              </button>
            </div>
          )
        )}

        {/* POI details list tab */}
        {portalTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {venue.pois.map((poi, idx) => (
              <div key={idx} className="glass-card p-6 rounded-[2rem] border-neutral-900 bg-neutral-950/20 space-y-4 hover:border-neutral-800 transition-all flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded uppercase ${style.badge}`}>
                      {poi.type}
                    </span>
                    {poi.fee && (
                      <span className="text-[10px] font-mono font-bold text-neutral-400">{poi.fee}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">{poi.name}</h4>
                  <p className="text-[10px] font-mono text-neutral-500">{poi.location}</p>
                </div>

                {poi.amenities && (
                  <div className="pt-3 border-t border-neutral-900 space-y-1">
                    <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">Amenities</span>
                    <div className="flex flex-wrap gap-1">
                      {poi.amenities.map((a, i) => (
                        <span key={i} className="text-[8.5px] bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded-lg text-neutral-450 uppercase">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rules & Regulations Tab */}
        {portalTab === 'rules' && (
          <div className="max-w-2xl mx-auto glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/20 space-y-6 text-left">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-3">
              <Shield className={`w-4 h-4 ${style.icon}`} /> Safety Bylaws & Regulations
            </h3>

            <div className="space-y-5">
              {venue.rules.map((rule, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Milestone className={`w-3.5 h-3.5 shrink-0 ${style.icon}`} />
                    <h4 className="text-xs font-bold text-white uppercase">{rule.title}</h4>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed pl-5">{rule.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl flex gap-3 items-center">
              <Sparkles className={`w-5 h-5 shrink-0 ${style.icon}`} />
              <p className="text-[10px] text-neutral-500 font-mono">
                Observe all markers and tethers. Safe mapping ensures long-term access for all PWC, Offroad, and Track enthusiasts!
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
