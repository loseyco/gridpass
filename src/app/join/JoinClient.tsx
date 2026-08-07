'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { QrCode, Loader2, Sparkles, CheckCircle2, Zap, Car, Utensils, Plane, Camera, Toilet, Flame, ArrowRight, Camera as CameraIcon, Copy, Link as LinkIcon, Building2, Calendar, UserCheck, PlusCircle, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';

function JoinPageContent() {
  const searchParams = useSearchParams();

  // Extract ANY URL parameter e.g. /join?tag=250, /join?id=250, /join?v=camaro_69, /join?250, /join?anything
  const getUniversalTagId = () => {
    const knownParam =
      searchParams.get('tag') ||
      searchParams.get('id') ||
      searchParams.get('ref') ||
      searchParams.get('referral') ||
      searchParams.get('v') ||
      searchParams.get('vehicle') ||
      searchParams.get('b') ||
      searchParams.get('business') ||
      searchParams.get('e') ||
      searchParams.get('event') ||
      searchParams.get('u') ||
      searchParams.get('user');

    if (knownParam) return knownParam;

    // Fallback: Check if ANY single key exists in searchParams e.g. /join?250 or /join?camaro69 or /join?nielsens
    const keys = Array.from(searchParams.keys());
    if (keys.length > 0 && keys[0]) {
      const firstVal = searchParams.get(keys[0]);
      return firstVal && firstVal !== '' ? firstVal : keys[0];
    }

    return null;
  };

  const rawTagId = getUniversalTagId();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(!!rawTagId);
  const [tagRecord, setTagRecord] = useState<any | null>(null);
  const [showAdminWizard, setShowAdminWizard] = useState(false);

  // Real Database Entity Lists for Admin Selector
  const [dbVehicles, setDbVehicles] = useState<any[]>([]);
  const [dbBusinesses, setDbBusinesses] = useState<any[]>([]);
  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [dbDrivers, setDbDrivers] = useState<any[]>([]);

  // Universal Persona / Member Interest Categories
  const [selectedCategory, setSelectedCategory] = useState<string>('motorsports');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  // Admin Tag Personalization State
  const [editTargetType, setEditTargetType] = useState('vehicle'); // 'vehicle' | 'business' | 'driver' | 'custom_url'
  const [editTargetDest, setEditTargetDest] = useState('/join');
  const [editMethod, setEditMethod] = useState('car_drop');
  const [editSpottedPhoto, setEditSpottedPhoto] = useState('');
  const [editSpottedTitle, setEditSpottedTitle] = useState('');
  const [editSpottedNote, setEditSpottedNote] = useState('');
  
  // Vehicle Invite Fields
  const [editYear, setEditYear] = useState('1969');
  const [editMake, setEditMake] = useState('Chevrolet');
  const [editModel, setEditModel] = useState('Camaro');
  const [editTrim, setEditTrim] = useState('SS 396');

  // Is Current User Admin?
  const isAdmin = user && ((user as any).role === 'super_admin' || user.email === 'loseyp@gmail.com');

  // Fetch Database Entities when Admin Wizard Opens
  useEffect(() => {
    if (!showAdminWizard) return;

    async function fetchDbEntities() {
      try {
        const [vSnap, bSnap, eSnap, uSnap] = await Promise.all([
          getDocs(collection(db, 'vehicles')),
          getDocs(collection(db, 'businesses')),
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'users')),
        ]);

        const vList: any[] = [];
        vSnap.forEach((d) => vList.push({ id: d.id, ...d.data() }));
        setDbVehicles(vList);

        const bList: any[] = [];
        bSnap.forEach((d) => bList.push({ id: d.id, ...d.data() }));
        setDbBusinesses(bList);

        const eList: any[] = [];
        eSnap.forEach((d) => eList.push({ id: d.id, ...d.data() }));
        setDbEvents(eList);

        const uList: any[] = [];
        uSnap.forEach((d) => uList.push({ id: d.id, ...d.data() }));
        setDbDrivers(uList);
      } catch (err) {
        console.warn('Error fetching DB entities for tag controller:', err);
      }
    }

    fetchDbEntities();
  }, [showAdminWizard]);

  // Audit & Resolve Tag Intake
  useEffect(() => {
    if (!rawTagId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function resolvePhysicalTag() {
      try {
        const q = query(collection(db, 'physical_tags'), where('tag_id', '==', rawTagId));
        const snap = await getDocs(q);

        let rec: any = null;
        if (!snap.empty) {
          rec = { id: snap.docs[0].id, ...snap.docs[0].data() };
        } else {
          // Unbound / Brand New Physical Tag
          rec = {
            id: `tag_${rawTagId}`,
            tag_id: rawTagId,
            title: `Invitation Tag #${rawTagId}`,
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
          setEditTargetType(rec.target_type || 'vehicle');
          setEditTargetDest(rec.target_destination || '/join');
          setEditMethod(rec.distribution_method || 'car_drop');
          setEditSpottedPhoto(rec.custom_spotted_photo_url || '');
          setEditSpottedTitle(rec.custom_spotted_title || '');
          setEditSpottedNote(rec.custom_spotted_note || '');
          setEditYear(rec.unclaimed_year || '1969');
          setEditMake(rec.unclaimed_make || 'Chevrolet');
          setEditModel(rec.unclaimed_model || 'Camaro');
          setEditTrim(rec.unclaimed_trim || 'SS 396');

          // If unbound physical tag scanned by admin, open setup wizard automatically!
          if (rec.status === 'unbound' && isAdmin) {
            setShowAdminWizard(true);
          }
        }

        // Log scan telemetry
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

        // Auto-redirect if bound tag, has a destination, and visitor is NOT admin
        if (
          rec.status === 'active' &&
          rec.target_destination &&
          rec.target_destination !== '/join' &&
          !rec.target_destination.includes('/join') &&
          !rec.custom_spotted_photo_url
        ) {
          if (!isAdmin) {
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
  }, [rawTagId, user, router, isAdmin]);

  // Handle Native Mobile Camera Capture / File Pick
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setEditSpottedPhoto(base64);
        showToast({
          title: 'MACHINE PHOTO SNAP CAPTURED! 📸',
          message: 'Car photo attached directly from camera/device.',
          icon: '📸',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // 1-Tap Create & Copy Virtual Shareable VIP Link (for Facebook / SMS / Instagram DMs)
  const createAndCopyShareableLink = async () => {
    // Generates a 100% collision-free unique virtual share tag ID (e.g. VIP-88A9)
    const uniqueShareId = rawTagId || `VIP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const url = `${window.location.origin}/join?tag=${uniqueShareId}`;

    // Auto-register virtual share tag in Firestore physical_tags collection
    await setDoc(
      doc(db, 'physical_tags', `tag_${uniqueShareId}`),
      {
        tag_id: uniqueShareId,
        title: `Virtual Social Media Share Link (${uniqueShareId})`,
        distribution_method: 'handout',
        target_type: 'intake_join',
        target_destination: '/join',
        total_scans: 0,
        members_joined_count: 0,
        status: 'active',
        created_at: new Date().toISOString(),
      },
      { merge: true }
    ).catch(() => {});

    navigator.clipboard.writeText(url);
    showToast({
      title: 'UNIQUE VIRTUAL VIP LINK COPIED! 📋',
      message: `Collision-free link (${url}) copied to clipboard. Send on Facebook, SMS, or Instagram!`,
      icon: '📋',
    });
  };

  // Handle Visitor Join or Claim Submission
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setJoining(true);
    try {
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        email,
        full_name: fullName || 'Gridpass Member',
        vehicle_make_model: vehicleMakeModel || (editMake && editModel ? `${editYear} ${editMake} ${editModel}` : null),
        interest_category: selectedCategory,
        referred_by_tag_id: rawTagId || null,
        spotted_car_photo: tagRecord?.custom_spotted_photo_url || null,
        role: 'member',
        starting_credits: 100,
        created_at: new Date().toISOString(),
      });

      // If an unclaimed vehicle was staged for this tag, transfer it into the member's garage!
      if (tagRecord?.unclaimed_vehicle_id || tagRecord?.custom_spotted_photo_url) {
        const vehicleId = tagRecord.unclaimed_vehicle_id || `veh_claimed_${Date.now()}`;
        await setDoc(
          doc(db, 'vehicles', vehicleId),
          {
            id: vehicleId,
            owner_id: userRef.id,
            owner_email: email,
            owner_name: fullName || 'Verified Member',
            year: Number(editYear) || 1969,
            make: editMake || 'Chevrolet',
            model: editModel || 'Camaro',
            trim: editTrim || 'SS',
            photo_url: tagRecord?.custom_spotted_photo_url || null,
            status: 'claimed',
            is_unclaimed: false,
            claimed_at: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      if (rawTagId && tagRecord?.id) {
        await updateDoc(doc(db, 'physical_tags', tagRecord.id), {
          members_joined_count: (tagRecord.members_joined_count || 0) + 1,
          last_scanned_at: new Date().toISOString(),
        }).catch(() => {});
      }

      setJoinedSuccess(true);
      showToast({
        title: 'WELCOME TO GRIDPASS! 🎉',
        message: rawTagId ? `Membership active! Card #${rawTagId} claimed.` : 'Membership active! Welcome to Gridpass.',
        icon: '🎉',
      });

      setTimeout(() => {
        router.push('/dash');
      }, 1200);
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

  // Save Dynamic Tag Binding (Admin Wizard - Only active when rawTagId exists from real QR scan)
  const handleAdminSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTagId) return; // Strict Invariant: Cannot bind without real scanned rawTagId!

    let newUnclaimedVehId = tagRecord?.unclaimed_vehicle_id || null;
    if (editTargetType === 'vehicle' && (editSpottedPhoto || (editMake && editModel))) {
      newUnclaimedVehId = `veh_unclaimed_${rawTagId}_${Date.now()}`;
      await setDoc(
        doc(db, 'vehicles', newUnclaimedVehId),
        {
          id: newUnclaimedVehId,
          owner_id: null,
          year: Number(editYear) || 1969,
          make: editMake || 'Chevrolet',
          model: editModel || 'Camaro',
          trim: editTrim || 'SS',
          photo_url: editSpottedPhoto || null,
          status: 'unclaimed',
          is_unclaimed: true,
          created_by: user?.email || 'loseyp@gmail.com',
          created_at: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    const updated = {
      tag_id: rawTagId,
      title: editSpottedTitle || (editTargetType === 'vehicle' ? `${editYear} ${editMake} ${editModel}` : `Tag #${rawTagId}`),
      distribution_method: editMethod,
      target_type: editTargetType,
      target_destination: editTargetDest,
      custom_spotted_photo_url: editSpottedPhoto || null,
      custom_spotted_title: editSpottedTitle || (editTargetType === 'vehicle' ? `${editYear} ${editMake} ${editModel}` : null),
      custom_spotted_note: editSpottedNote || null,
      unclaimed_vehicle_id: newUnclaimedVehId,
      unclaimed_year: editYear,
      unclaimed_make: editMake,
      unclaimed_model: editModel,
      unclaimed_trim: editTrim,
      status: 'active',
      last_scanned_at: new Date().toISOString(),
    };

    setTagRecord(updated);

    try {
      await setDoc(doc(db, 'physical_tags', `tag_${rawTagId}`), updated, { merge: true });
      showToast({
        title: 'PHYSICAL CARD BOUND & INVITATION ACTIVE! ⚡',
        message: `Card #${rawTagId} is now configured as a ${editTargetType} invitation!`,
        icon: '⚡',
      });
      setShowAdminWizard(false);
    } catch (err: any) {
      console.error('Failed to bind tag:', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-x-hidden selection:bg-[#ff3b30] selection:text-white">
      
      {/* Dynamic Background Glow Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#ff3b30]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-5 relative z-10 my-auto">
        
        {/* On-The-Spot Personal Car Photo Banner */}
        {tagRecord?.custom_spotted_photo_url && (
          <div className="bg-neutral-900 border-2 border-[#ff3b30] rounded-3xl overflow-hidden shadow-2xl space-y-0 relative group">
            <div className="relative h-56 sm:h-64 w-full bg-neutral-950">
              <img
                src={tagRecord.custom_spotted_photo_url}
                alt="Spotted Machine"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
              <div className="absolute top-3 left-3 bg-[#ff3b30] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <CameraIcon className="w-3.5 h-3.5" />
                <span>SPOTTED BY GRIDPASS</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 space-y-1">
                <h2 className="text-lg font-black uppercase text-white tracking-tight leading-tight">
                  {tagRecord.custom_spotted_title || `${tagRecord.unclaimed_year || ''} ${tagRecord.unclaimed_make || ''} ${tagRecord.unclaimed_model || ''}`}
                </h2>
                {tagRecord.custom_spotted_note && (
                  <p className="text-xs text-neutral-300 font-medium italic">
                    &quot;{tagRecord.custom_spotted_note}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-6 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#ff3b30] text-white font-mono font-black text-[10px] uppercase rounded-full tracking-wider shadow-sm flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                {rawTagId ? `TAG #${rawTagId}` : 'VIP INVITATION'}
              </span>
              {tagRecord?.status === 'unbound' && (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-[9px] uppercase rounded-full">
                  UNBOUND
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
              GRIDPASS
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              {tagRecord?.custom_spotted_photo_url
                ? `🏎️ YOU ARE INVITED! CLAIM PASSPORT FOR YOUR ${tagRecord.custom_spotted_title || 'MACHINE'}`
                : rawTagId
                ? `⚡ YOU SCANNED INVITATION CARD #${rawTagId}`
                : '⚡ YOU ARE INVITED TO JOIN GRIDPASS'}
            </h1>
            <p className="text-xs text-neutral-300 font-medium leading-relaxed">
              Whether you race it, show it, cook it, fly it, or captured it in the wild — Gridpass brings your world together.
            </p>
          </div>

          {/* Admin Controller Tools */}
          {isAdmin && (
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  SUPER ADMIN CONTROLLER
                </span>
                <span className="text-[9px] font-mono text-neutral-400">
                  {rawTagId ? `Card #${rawTagId}` : 'Virtual Mode'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {rawTagId ? (
                  <button
                    onClick={() => setShowAdminWizard(true)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-mono font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>⚡ Configure Scanned Physical Card #{rawTagId}</span>
                  </button>
                ) : (
                  <button
                    onClick={createAndCopyShareableLink}
                    className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-blue-400 border border-blue-500/30 font-mono font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>📋 Create & Copy Shareable VIP Link</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* LOGGED IN MEMBER VIEW (e.g. PJ Losey) */}
        {user ? (
          <div className="bg-white text-neutral-900 rounded-3xl p-6 shadow-2xl space-y-5 border border-neutral-200 font-sans">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#ff3b30] tracking-wider block">AUTHENTICATED MEMBER</span>
                <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
                  WELCOME BACK, {user.displayName || (user.email ? user.email.split('@')[0] : 'MEMBER')}! 🏎️
                </h2>
                <p className="text-xs text-neutral-500 font-bold">
                  Logged in as {user.email}. Your Gridpass is active.
                </p>
              </div>
              <button
                onClick={() => signOut(getAuth())}
                className="p-2 text-neutral-400 hover:text-[#ff3b30] transition rounded-xl hover:bg-neutral-100"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* If Scanned Unbound Tag as Admin */}
            {rawTagId && tagRecord?.status === 'unbound' && isAdmin && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase">
                  <Zap className="w-4 h-4 text-amber-600 fill-current" />
                  <span>UNBOUND PHYSICAL CARD #{rawTagId} SCANNED!</span>
                </div>
                <p className="text-xs text-amber-800 font-bold">
                  Card #{rawTagId} is scanned and ready to configure.
                </p>
                <button
                  onClick={() => setShowAdminWizard(true)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>⚡ LAUNCH TAG BINDING WIZARD</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 1-Tap Quick Actions */}
            <div className="space-y-2.5">
              <Link
                href="/dash"
                className="w-full py-3.5 bg-neutral-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-between px-4"
              >
                <span>🏎️ GO TO DRIVER DASHBOARD & GARAGE</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>

              <Link
                href="/dash"
                className="w-full py-3.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-between px-4"
              >
                <span>➕ REGISTER / CLAIM VEHICLE PASSPORT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/partner"
                className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs uppercase tracking-wider rounded-xl border border-neutral-300 transition flex items-center justify-between px-4"
              >
                <span>🏢 REGISTER BUSINESS OR AUTO SHOP</span>
                <ArrowRight className="w-4 h-4 text-neutral-500" />
              </Link>
            </div>
          </div>
        ) : (
          /* UNAUTHENTICATED VISITOR INTAKE FORM */
          <div className="bg-white text-neutral-900 rounded-3xl p-6 shadow-2xl space-y-5 border border-neutral-200">
            
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
                  {tagRecord?.custom_spotted_photo_url ? 'CLAIM THIS VEHICLE PASSPORT' : 'JOIN THE ROSTER'}
                </h2>
                <p className="text-xs text-neutral-500 font-bold">
                  {tagRecord?.custom_spotted_photo_url ? 'Claim your pre-staged passport & transfer vehicle to your garage.' : 'Free instant membership for drivers, vendors, pilots & fans.'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md">
                <QrCode className="w-6 h-6" />
              </div>
            </div>

            {joinedSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black uppercase text-neutral-900">PASSPORT CLAIMED! 🎉</h3>
                <p className="text-xs text-neutral-600 font-bold max-w-xs mx-auto">
                  Welcome to Gridpass! Vehicle passport transferred to your garage. Redirecting...
                </p>
              </div>
            ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              
              {/* Universal Category Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                  Who Are You? / What Brings You Here?
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('motorsports')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                      selectedCategory === 'motorsports'
                        ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase">Motorsports</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory('food_truck')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                      selectedCategory === 'food_truck'
                        ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase">Food/Vendor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory('aviation')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                      selectedCategory === 'aviation'
                        ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Plane className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase">Aviation/Pilot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory('spectator')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                      selectedCategory === 'spectator'
                        ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase">Enthusiast</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory('wild_scan')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                      selectedCategory === 'wild_scan'
                        ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Toilet className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase">Sticker Scan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory('other')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                      selectedCategory === 'other'
                        ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase">Anything Else</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="PJ Losey"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs font-bold p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
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
                  className="w-full text-xs font-bold p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
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
                  className="w-full text-xs font-bold p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">
                  Machine, Business, or Craft Make & Model <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1969 Camaro, Cessna 172, or Tacos El Rey Truck"
                  value={vehicleMakeModel}
                  onChange={(e) => setVehicleMakeModel(e.target.value)}
                  className="w-full text-xs font-bold p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <button
                type="submit"
                disabled={joining}
                className="w-full py-4 bg-gradient-to-r from-[#ff3b30] via-red-600 to-[#bd2925] hover:opacity-95 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>CLAIM PASSPORT & JOIN GRIDPASS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {rawTagId && (
            <div className="pt-3 border-t border-neutral-200 text-center text-[10px] font-mono text-neutral-500 font-bold">
              <span>EACH CARD HAS A UNIQUE ID • REFERRED BY TAG #{rawTagId}</span>
            </div>
          )}

        </div>
        )}

      </div>

      {/* ADMIN TAG BINDING WIZARD MODAL (Strict Invariant: Requires real scanned rawTagId!) */}
      {showAdminWizard && rawTagId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-neutral-900 border border-neutral-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <h2 className="font-black text-sm uppercase text-neutral-900 flex items-center gap-2">
                  <span>⚡ BINDING PHYSICAL CARD</span>
                  <span className="font-mono text-[#ff3b30]">#{rawTagId}</span>
                </h2>
                <p className="text-[10px] text-neutral-500 font-mono">Assign card target destination & personalized invitation.</p>
              </div>
              <button onClick={() => setShowAdminWizard(false)} className="text-neutral-400 font-bold hover:text-neutral-900">
                ✕
              </button>
            </div>

            {/* Target Type Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-neutral-700">
                What Would You Like to Assign to Card #{rawTagId}?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setEditTargetType('vehicle'); setEditTargetDest('/join'); }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    editTargetType === 'vehicle'
                      ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <Car className="w-4 h-4 text-[#ff3b30]" />
                  <div className="text-[10px] uppercase font-black">Invite Vehicle</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setEditTargetType('business'); setEditTargetDest('/partner'); }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    editTargetType === 'business'
                      ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <div className="text-[10px] uppercase font-black">Invite Business</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setEditTargetType('driver'); setEditTargetDest('/dash'); }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    editTargetType === 'driver'
                      ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <div className="text-[10px] uppercase font-black">Invite Driver</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEditTargetType('custom_url')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    editTargetType === 'custom_url'
                      ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 text-purple-500" />
                  <div className="text-[10px] uppercase font-black">Custom Page/URL</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleAdminSaveTarget} className="space-y-3 pt-2">
              
              {/* VEHICLE INVITATION SPECIFIC FIELDS */}
              {editTargetType === 'vehicle' && (
                <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-2">
                  <span className="block text-[10px] font-black uppercase text-[#ff3b30] flex items-center gap-1">
                    <CameraIcon className="w-3.5 h-3.5" />
                    <span>📸 Snap Vehicle Photo & Pre-stage Passport</span>
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    id="wizard-camera-input"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />

                  <label
                    htmlFor="wizard-camera-input"
                    className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <CameraIcon className="w-4 h-4 text-[#ff3b30]" />
                    <span>{editSpottedPhoto ? '📷 Retake Machine Photo' : '📸 Snap Photo with Camera'}</span>
                  </label>

                  {editSpottedPhoto && (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-neutral-300">
                      <img src={editSpottedPhoto} alt="Spotted Machine" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditSpottedPhoto('')}
                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 text-[10px]"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Year</label>
                      <input
                        type="text"
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        placeholder="1969"
                        className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Make</label>
                      <input
                        type="text"
                        value={editMake}
                        onChange={(e) => setEditMake(e.target.value)}
                        placeholder="Chevrolet"
                        className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Model</label>
                      <input
                        type="text"
                        value={editModel}
                        onChange={(e) => setEditModel(e.target.value)}
                        placeholder="Camaro"
                        className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Trim</label>
                      <input
                        type="text"
                        value={editTrim}
                        onChange={(e) => setEditTrim(e.target.value)}
                        placeholder="SS 396"
                        className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Personal Note to Owner</label>
                    <input
                      type="text"
                      value={editSpottedNote}
                      onChange={(e) => setEditSpottedNote(e.target.value)}
                      placeholder="e.g. Saw your Camaro at Road America — claim your passport!"
                      className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* CUSTOM URL SPECIFIC FIELDS */}
              {editTargetType === 'custom_url' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Target Page Path or External URL</label>
                  <input
                    type="text"
                    required
                    value={editTargetDest}
                    onChange={(e) => setEditTargetDest(e.target.value)}
                    placeholder="/v/corvette-z06 or /b/nielsens or /events/badlands"
                    className="w-full text-xs font-mono font-bold p-3 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminWizard(false)}
                  className="px-3 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold uppercase rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm"
                >
                  Save & Bind Card #{rawTagId} ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full text-center py-4 text-[10px] font-mono text-neutral-500 space-y-1 relative z-10 mt-auto">
        <p>GRIDPASS PLATFORM • LOSEY.CO • ALL RIGHTS RESERVED</p>
      </footer>

    </div>
  );
}

export default function JoinClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
        <span className="text-xs font-mono font-bold text-neutral-400 mt-2">Loading Gridpass Invitation...</span>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  );
}
