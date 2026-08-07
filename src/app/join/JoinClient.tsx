'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { QrCode, Loader2, ShieldCheck, CarFront, LogIn, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import Link from 'next/link';

function JoinPageContent() {
  const searchParams = useSearchParams();
  const rawTagId = searchParams.get('tag') || searchParams.get('id') || searchParams.get('ref') || searchParams.get('referral') || '';
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(!!rawTagId);
  const [tagRecord, setTagRecord] = useState<any | null>(null);
  const [tagInput, setTagInput] = useState(rawTagId);
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  // Admin Tag Controller State
  const [editTargetType, setEditTargetType] = useState('intake_join');
  const [editTargetDest, setEditTargetDest] = useState('/join');
  const [editMethod, setEditMethod] = useState('handout');
  const [editPartnerName, setEditPartnerName] = useState('');

  // 1. Audit & Resolve Tag Intake
  useEffect(() => {
    if (!rawTagId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function resolvePhysicalTag() {
      try {
        // Query physical_tags collection
        const q = query(collection(db, 'physical_tags'), where('tag_id', '==', rawTagId));
        const snap = await getDocs(q);

        let rec: any = null;
        if (!snap.empty) {
          rec = { id: snap.docs[0].id, ...snap.docs[0].data() };
        } else {
          // Default unbound physical card record matching user's printed card box
          rec = {
            id: `tag_${rawTagId}`,
            tag_id: rawTagId,
            title: `Invitation Card #${rawTagId}`,
            distribution_method: 'handout',
            target_type: 'intake_join',
            target_destination: '/join',
            total_scans: 1,
            members_joined_count: 0,
            status: 'unbound',
          };
        }

        if (isMounted) {
          setTagRecord(rec);
          setEditTargetType(rec.target_type || 'intake_join');
          setEditTargetDest(rec.target_destination || '/join');
          setEditMethod(rec.distribution_method || 'handout');
          setEditPartnerName(rec.partner_business_name || '');
        }

        // Log scan event telemetry
        await addDoc(collection(db, 'tag_scans'), {
          tag_id: rawTagId,
          scanned_at: new Date().toISOString(),
          distribution_method: rec.distribution_method || 'handout',
          user_id: user?.uid || null,
          user_email: user?.email || null,
          target_destination: rec.target_destination || '/join',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }).catch(() => {});

        // If tag is bound to a specific destination (e.g. vehicle, event, business) AND not default intake
        if (rec.status === 'active' && rec.target_destination && rec.target_destination !== '/join' && !rec.target_destination.includes('/join')) {
          if (!user || ((user as any).role !== 'super_admin' && user?.email !== 'loseyp@gmail.com')) {
            router.push(rec.target_destination);
            return;
          }
        }

        if (isMounted) setLoading(false);
      } catch (err) {
        console.error('Failed to resolve physical tag:', err);
        if (isMounted) setLoading(false);
      }
    }

    resolvePhysicalTag();
    return () => { isMounted = false; };
  }, [rawTagId, user, router]);

  // Handle Form Submission
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setJoining(true);
    try {
      // Create user profile in Firestore
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        email,
        full_name: fullName || 'Gridpass Member',
        vehicle_make_model: vehicleMakeModel || 'Staged Machine',
        referred_by_tag_id: rawTagId || null,
        role: 'member',
        starting_credits: 100,
        created_at: new Date().toISOString(),
      });

      // Update physical tag joined count if tag exists
      if (rawTagId && tagRecord?.id) {
        await updateDoc(doc(db, 'physical_tags', tagRecord.id), {
          members_joined_count: (tagRecord.members_joined_count || 0) + 1,
          last_scanned_at: new Date().toISOString(),
        }).catch(() => {});
      }

      setJoinedSuccess(true);
      showToast({
        title: 'WELCOME TO GRIDPASS! 🎉',
        message: `Your membership card is active! Referred by Card #${rawTagId || '250'}.`,
        icon: '🎉',
      });
      setTimeout(() => {
        router.push('/dash');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to join:', err);
      showToast({
        title: 'JOIN ERROR',
        message: err.message || 'Failed to complete registration.',
        icon: '⚠️',
      });
    } finally {
      setJoining(false);
    }
  };

  // Save Dynamic Target Re-route (Admin Controller)
  const handleAdminSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTagId) return;

    const updated = {
      tag_id: rawTagId,
      title: tagRecord?.title || `Physical Card #${rawTagId}`,
      distribution_method: editMethod,
      target_type: editTargetType,
      target_destination: editTargetDest,
      partner_business_name: editPartnerName || '',
      status: 'active',
      last_scanned_at: new Date().toISOString(),
    };

    setTagRecord(updated);

    try {
      const tagDocId = tagRecord?.id || `tag_${rawTagId}`;
      await setDoc(doc(db, 'physical_tags', tagDocId), updated, { merge: true });
      showToast({
        title: 'PHYSICAL TAG RE-ROUTED! ⚡',
        message: `Card #${rawTagId} now points to ${editTargetDest}.`,
        icon: '⚡',
      });
      setShowAdminDrawer(false);
    } catch (err: any) {
      console.error('Failed to update tag:', err);
      showToast({
        title: 'TAG UPDATE ERROR',
        message: err.message || 'Failed to update tag.',
        icon: '⚠️',
      });
    }
  };

  const getContextualHeadline = () => {
    const method = tagRecord?.distribution_method;
    if (method === 'car_drop') {
      return { headline: '🏎️ SPOTTED! YOU GOT A GRIDPASS CARD ON YOUR MACHINE!', bg: 'from-amber-950/90 to-neutral-900' };
    }
    if (method === 'sticker') {
      return { headline: '💥 SPOTTED IN THE WILD! YOU ARE INVITED TO JOIN GRIDPASS!', bg: 'from-rose-950/90 to-neutral-900' };
    }
    if (method === 'dealership_intake' || method === 'sales_floor') {
      return { headline: '🏬 DEALERSHIP MACHINE PASSPORT • NIELSEN\'S ENTERPRISES', bg: 'from-emerald-950/90 to-neutral-900' };
    }
    return { headline: '🎴 YOU ARE INVITED TO GRIDPASS', bg: 'from-neutral-900 to-black' };
  };

  const contextHeader = getContextualHeadline();

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1c1c1e] font-sans flex flex-col items-center justify-between p-4 sm:p-6 select-none">
      
      {/* Top Banner & Physical Card Badge */}
      <div className="w-full max-w-md space-y-4">
        
        {/* Physical Invitation Card Banner */}
        <div className={`p-4 rounded-2xl bg-gradient-to-r ${contextHeader.bg} text-white shadow-xl border border-neutral-800 space-y-2 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 bg-[#ff3b30] text-white font-mono font-black text-[10px] uppercase rounded-md tracking-wider">
              {rawTagId ? `CARD #${rawTagId}` : 'INVITATION CARD'}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase">
              BUILT BY LOSEY.CO
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
            {contextHeader.headline}
          </h1>

          <p className="text-xs text-neutral-300 font-medium leading-relaxed">
            Whether you race it, show it, cook it, or capture it — Gridpass brings your world together.
          </p>

          {/* Special First-Scan Onboarding Callout */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2 text-emerald-400 font-mono text-[11px] font-bold">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
            <span>HEY! THIS ISN&apos;T JUST A QR CODE — WELCOME TO GRIDPASS!</span>
          </div>
        </div>

        {/* Super Admin Tag Controller Button */}
        {user && ((user as any).role === 'super_admin' || user.email === 'loseyp@gmail.com') && (
          <button
            onClick={() => setShowAdminDrawer(true)}
            className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl border border-neutral-800 shadow-md flex items-center justify-center gap-2 transition active:scale-95"
          >
            <span>⚡ Super Admin Tag Controller (Card #{rawTagId || '250'})</span>
          </button>
        )}

        {/* Join / Registration Card */}
        <div className="bg-white border-2 border-neutral-900 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          
          <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                JOIN GRIDPASS
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Claim your digital vehicle passport & join the roster.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ff3b30]/10 border border-[#ff3b30]/20 flex items-center justify-center text-[#ff3b30]">
              <QrCode className="w-5 h-5" />
            </div>
          </div>

          {joinedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black uppercase text-neutral-900">YOU ARE IN! 🎉</h3>
              <p className="text-xs text-neutral-600 font-medium max-w-xs mx-auto">
                Your Gridpass membership is active. Redirecting to your driver dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="PJ Losey"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs font-bold p-3 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-bold p-3 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-bold p-3 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Primary Machine / Vehicle Make & Model</label>
                <input
                  type="text"
                  placeholder="e.g. 2024 Corvette Z06 or Sea-Doo RXT-X"
                  value={vehicleMakeModel}
                  onChange={(e) => setVehicleMakeModel(e.target.value)}
                  className="w-full text-xs font-bold p-3 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <button
                type="submit"
                disabled={joining}
                className="w-full py-3.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>JOIN GRIDPASS & CLAIM PASSPORT ➔</span>}
              </button>
            </form>
          )}

          {/* Printed Card Footer Note */}
          <div className="pt-3 border-t border-neutral-200 text-center text-[10px] font-mono text-neutral-500">
            <span>EACH CARD HAS A UNIQUE ID • REFERRED BY CARD #{rawTagId || '250'}</span>
          </div>

        </div>

      </div>

      {/* Admin Tag Controller Modal */}
      {showAdminDrawer && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl font-sans">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <h2 className="font-black text-sm uppercase text-neutral-900 flex items-center gap-2">
                  <span>⚡ DYNAMIC TAG CONTROLLER</span>
                  <span className="font-mono text-[#ff3b30]">#{rawTagId || '250'}</span>
                </h2>
                <p className="text-[10px] text-neutral-500 font-mono">Re-route physical card destination & persona rules.</p>
              </div>
              <button onClick={() => setShowAdminDrawer(false)} className="text-neutral-400 font-bold hover:text-neutral-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminSaveTarget} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Distribution Method</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none"
                >
                  <option value="handout">🎴 Business Card Handout</option>
                  <option value="car_drop">🏎️ Car Drop (Windshield Wiper / Interior)</option>
                  <option value="lanyard">🏷️ Rearview Mirror Lanyard Hang</option>
                  <option value="sticker">🚽 Guerrilla Sticker (Porta-potty / Venue Stall)</option>
                  <option value="dealership_intake">🏬 Dealership Machine Intake (Nielsen&apos;s)</option>
                  <option value="service_bay">🔧 Dealership Service Bay</option>
                  <option value="sales_floor">🏷️ Dealership Sales Floor</option>
                  <option value="shop_stack">📦 Auto Shop Counter Stack</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Target Persona Type</label>
                <select
                  value={editTargetType}
                  onChange={(e) => setEditTargetType(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none"
                >
                  <option value="intake_join">🌐 Default /join Intake & Signup</option>
                  <option value="vehicle">🏎️ Vehicle Passport Spec Sheet</option>
                  <option value="business">🏢 Business / Vendor Exhibit</option>
                  <option value="event">🏁 Event Hub & Gate Check-in</option>
                  <option value="driver">👤 Driver Card & Resume</option>
                  <option value="dealership_service">🔧 Dealership Service Log & Work Orders</option>
                  <option value="dealership_sales">🏬 Dealership Sales Floor Spec & Price Alert</option>
                  <option value="custom_url">🔗 Custom URL Redirect</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Target Destination Path / URL</label>
                <input
                  type="text"
                  required
                  value={editTargetDest}
                  onChange={(e) => setEditTargetDest(e.target.value)}
                  placeholder="/join or /v/corvette-z06"
                  className="w-full text-xs font-mono font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminDrawer(false)}
                  className="px-3 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold uppercase rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm"
                >
                  Save Target Route ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="w-full text-center py-4 border-t border-neutral-200 text-[10px] font-mono text-neutral-500 space-y-1">
        <p>GRIDPASS PLATFORM • LOSEY.CO • ALL RIGHTS RESERVED</p>
        <p className="text-neutral-400">AUTHENTICATED PHYSICAL TAG INTENDED FOR OUTDOOR & AUTOMOTIVE USE</p>
      </footer>

    </div>
  );
}

export default function JoinClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
        <span className="text-xs font-mono font-bold text-neutral-600 mt-2">Loading Gridpass Invitation...</span>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  );
}
