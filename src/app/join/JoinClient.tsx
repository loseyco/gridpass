'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { QrCode, Loader2, Sparkles, CheckCircle2, Zap, Car, Utensils, Plane, Camera, Toilet, Flame, ArrowRight, Camera as CameraIcon, Copy, Link as LinkIcon, Building2, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import Link from 'next/link';

function JoinPageContent() {
  const searchParams = useSearchParams();
  const rawTagId = searchParams.get('tag') || searchParams.get('id') || searchParams.get('ref') || searchParams.get('referral') || null;
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(!!rawTagId);
  const [tagRecord, setTagRecord] = useState<any | null>(null);
  const [unclaimedVehicle, setUnclaimedVehicle] = useState<any | null>(null);
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);

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

  // Admin On-The-Spot Car Photo & Unclaimed Vehicle Staging State
  const [editTargetType, setEditTargetType] = useState('intake_join');
  const [editTargetDest, setEditTargetDest] = useState('/join');
  const [editMethod, setEditMethod] = useState('handout');
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editSpottedPhoto, setEditSpottedPhoto] = useState('');
  const [editSpottedTitle, setEditSpottedTitle] = useState('');
  const [editSpottedNote, setEditSpottedNote] = useState('');
  
  // Unclaimed Vehicle Specific Fields
  const [editYear, setEditYear] = useState('1969');
  const [editMake, setEditMake] = useState('Chevrolet');
  const [editModel, setEditModel] = useState('Camaro');
  const [editTrim, setEditTrim] = useState('SS 396');

  // Fetch Database Entities when Admin Drawer Opens
  useEffect(() => {
    if (!showAdminDrawer) return;

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
  }, [showAdminDrawer]);

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
          setEditTargetType(rec.target_type || 'intake_join');
          setEditTargetDest(rec.target_destination || '/join');
          setEditMethod(rec.distribution_method || 'handout');
          setEditPartnerName(rec.partner_business_name || '');
          setEditSpottedPhoto(rec.custom_spotted_photo_url || '');
          setEditSpottedTitle(rec.custom_spotted_title || '');
          setEditSpottedNote(rec.custom_spotted_note || '');
          setEditYear(rec.unclaimed_year || '1969');
          setEditMake(rec.unclaimed_make || 'Chevrolet');
          setEditModel(rec.unclaimed_model || 'Camaro');
          setEditTrim(rec.unclaimed_trim || 'SS 396');
        }

        // If tag points to an unclaimed vehicle ID
        if (rec.unclaimed_vehicle_id) {
          try {
            const vSnap = await getDocs(query(collection(db, 'vehicles'), where('id', '==', rec.unclaimed_vehicle_id)));
            if (!vSnap.empty && isMounted) {
              setUnclaimedVehicle({ id: vSnap.docs[0].id, ...vSnap.docs[0].data() });
            }
          } catch (err) {
            console.warn('Error resolving unclaimed vehicle:', err);
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

        // Auto-redirect if bound tag and not logged in as admin
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

  // 1-Tap Copy Shareable VIP Link (for Facebook / SMS / Instagram DMs)
  const copyShareableLink = () => {
    const url = `${window.location.origin}/join?tag=${rawTagId || '250'}`;
    navigator.clipboard.writeText(url);
    showToast({
      title: 'SHAREABLE VIP LINK COPIED! 📋',
      message: `Direct invitation link (${url}) copied to clipboard. Send on Facebook, SMS, or DM!`,
      icon: '📋',
    });
  };

  // Handle Form Submission (or Claiming Unclaimed Vehicle)
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

      // If an unclaimed vehicle was linked to this tag, transfer it to the new user's garage!
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
        message: rawTagId ? `Membership active! Vehicle passport claimed for Card #${rawTagId}.` : 'Membership active! Welcome to the roster.',
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

  // Save Dynamic Target Re-route & On-The-Spot Car Photo Personalization (Admin Controller)
  const handleAdminSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTagId) return;

    // Create Unclaimed Vehicle Document in Firestore if photo or vehicle details specified
    let newUnclaimedVehId = tagRecord?.unclaimed_vehicle_id || null;
    if (editSpottedPhoto || (editMake && editModel)) {
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
      title: editSpottedTitle || `${editYear} ${editMake} ${editModel}` || `Physical Tag #${rawTagId}`,
      distribution_method: editMethod,
      target_type: editTargetType,
      target_destination: editTargetDest,
      partner_business_name: editPartnerName || '',
      custom_spotted_photo_url: editSpottedPhoto || null,
      custom_spotted_title: editSpottedTitle || `${editYear} ${editMake} ${editModel}` || null,
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
      const tagDocId = tagRecord?.id || `tag_${rawTagId}`;
      await setDoc(doc(db, 'physical_tags', tagDocId), updated, { merge: true });
      showToast({
        title: 'UNCLAIMED VEHICLE & CARD INVITATION CREATED! 🏎️',
        message: `Tag #${rawTagId} pre-staged for ${editYear} ${editMake} ${editModel}.`,
        icon: '🏎️',
      });
      setShowAdminDrawer(false);
    } catch (err: any) {
      console.error('Failed to update tag:', err);
    }
  };

  const getContextualHeadline = () => {
    if (tagRecord?.custom_spotted_photo_url || editMake) {
      return `🏎️ SPOTTED! PRE-STAGED PASSPORT FOR ${tagRecord?.custom_spotted_title || `${editYear} ${editMake} ${editModel}`}`;
    }
    const method = tagRecord?.distribution_method;
    if (method === 'car_drop') {
      return '🏎️ SPOTTED! INVITATION LEFT ON YOUR MACHINE';
    }
    if (method === 'sticker') {
      return '💥 SPOTTED IN THE WILD! YOU ARE INVITED TO GRIDPASS';
    }
    if (method === 'dealership_intake' || method === 'sales_floor') {
      return '🏬 NIELSEN\'S ENTERPRISES • MACHINE DIGITAL PASSPORT';
    }
    return '⚡ YOU ARE INVITED TO JOIN GRIDPASS';
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
        
        {/* On-The-Spot Personal Car Photo Banner (If Admin Took Photo for Car Drop) */}
        {tagRecord?.custom_spotted_photo_url && (
          <div className="bg-neutral-900 border-2 border-[#ff3b30] rounded-3xl overflow-hidden shadow-2xl space-y-0 relative group">
            <div className="relative h-56 sm:h-64 w-full bg-neutral-950">
              <img
                src={tagRecord.custom_spotted_photo_url}
                alt="Spotted Vehicle"
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

        {/* Modern Vibrant Hero Card */}
        <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-6 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#ff3b30] text-white font-mono font-black text-[10px] uppercase rounded-full tracking-wider shadow-sm flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                {rawTagId ? `TAG #${rawTagId}` : 'VIP INVITATION'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
              LOSEY.CO
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              {getContextualHeadline()}
            </h1>
            <p className="text-xs text-neutral-300 font-medium leading-relaxed">
              Whether you race it, show it, cook it, fly it, or captured it in the wild — Gridpass brings your world together.
            </p>
          </div>

          {/* First-Scan Excitement Callout */}
          <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-emerald-950/80 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <p className="text-xs font-mono font-bold text-emerald-300 leading-tight">
              HEY! THIS ISN&apos;T JUST A QR CODE — WELCOME TO GRIDPASS!
            </p>
          </div>

          {/* Super Admin Controller Trigger */}
          {user && ((user as any).role === 'super_admin' || user.email === 'loseyp@gmail.com') && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowAdminDrawer(true)}
                className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 font-mono font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <CameraIcon className="w-3.5 h-3.5" />
                <span>Snap & Personalize</span>
              </button>
              <button
                onClick={copyShareableLink}
                className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-blue-400 border border-blue-500/30 font-mono font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Share Link</span>
              </button>
            </div>
          )}

        </div>

        {/* Dynamic Intake Form / Logged-in Welcome Card */}
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
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-xs font-mono font-black text-[10px]">
                ACTIVE
              </div>
            </div>

            {/* 1-Tap Quick Actions for Logged-In Members */}
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
              
              {/* Universal Inclusive Category Selector */}
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

      {/* Admin Tag Controller & Camera Photo Personalization Modal */}
      {showAdminDrawer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-neutral-900 border border-neutral-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <h2 className="font-black text-sm uppercase text-neutral-900 flex items-center gap-2">
                  <span>⚡ DYNAMIC TAG CONTROLLER</span>
                  <span className="font-mono text-[#ff3b30]">{rawTagId ? `#${rawTagId}` : ''}</span>
                </h2>
                <p className="text-[10px] text-neutral-500 font-mono">Pre-stage unclaimed vehicle passport & personalize invitation.</p>
              </div>
              <button onClick={() => setShowAdminDrawer(false)} className="text-neutral-400 font-bold hover:text-neutral-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminSaveTarget} className="space-y-3">
              
              {/* Native Camera Photo Capture Button */}
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-2">
                <span className="block text-[10px] font-black uppercase text-[#ff3b30] flex items-center gap-1">
                  <CameraIcon className="w-3.5 h-3.5" />
                  <span>📸 Snap Car Drop Photo (On-The-Spot)</span>
                </span>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="camera-photo-input"
                  className="hidden"
                  onChange={handleCameraCapture}
                />

                <label
                  htmlFor="camera-photo-input"
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

                {/* Pre-stage Unclaimed Vehicle Specs */}
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
                    <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Trim / Package</label>
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
                    placeholder="e.g. Saw your car at Road America — claim your passport!"
                    className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Distribution Method</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none"
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
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setEditTargetType(nextType);
                    if (nextType === 'intake_join') setEditTargetDest('/join');
                  }}
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none"
                >
                  <option value="intake_join">🌐 Default /join Intake & Signup</option>
                  <option value="vehicle">🏎️ Specific Garage Vehicle Passport</option>
                  <option value="business">🏢 Specific Auto Shop / Business Exhibit</option>
                  <option value="event">🏁 Specific Motorsports Event Hub</option>
                  <option value="driver">👤 Specific Driver Card & Resume</option>
                  <option value="dealership_service">🔧 Dealership Service Log & Work Orders</option>
                  <option value="dealership_sales">🏬 Dealership Sales Floor Spec & Price Alert</option>
                  <option value="custom_url">🔗 Custom URL Path / Link</option>
                </select>
              </div>

              {/* Dynamic Real Database Entity Dropdowns */}
              {editTargetType === 'vehicle' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-[#ff3b30]" />
                    <span>Select Vehicle from Database</span>
                  </label>
                  <select
                    value={editTargetDest}
                    onChange={(e) => setEditTargetDest(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none"
                  >
                    <option value="/v/demo">Demo Vehicle Passport (/v/demo)</option>
                    {dbVehicles.map((v) => (
                      <option key={v.id} value={`/v/${v.id}`}>
                        {v.year || ''} {v.make || ''} {v.model || v.name || v.id} (/v/{v.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editTargetType === 'business' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Select Shop / Business from Database</span>
                  </label>
                  <select
                    value={editTargetDest}
                    onChange={(e) => setEditTargetDest(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none"
                  >
                    <option value="/b/nielsens-enterprises">Nielsen&apos;s Enterprises (/b/nielsens-enterprises)</option>
                    {dbBusinesses.map((b) => (
                      <option key={b.id} value={`/b/${b.id}`}>
                        {b.name || b.company_name || b.id} (/b/{b.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editTargetType === 'event' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>Select Event from Database</span>
                  </label>
                  <select
                    value={editTargetDest}
                    onChange={(e) => setEditTargetDest(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none"
                  >
                    <option value="/events/demo">Demo Motorsports Event (/events/demo)</option>
                    {dbEvents.map((ev) => (
                      <option key={ev.id} value={`/events/${ev.id}`}>
                        {ev.title || ev.name || ev.id} (/events/{ev.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editTargetType === 'driver' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select Driver from Database</span>
                  </label>
                  <select
                    value={editTargetDest}
                    onChange={(e) => setEditTargetDest(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none"
                  >
                    {dbDrivers.map((u) => (
                      <option key={u.id} value={`/u/${u.username || u.id}`}>
                        {u.full_name || u.email || u.id} (/u/{u.username || u.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editTargetType === 'custom_url' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Target Destination Path / URL</label>
                  <input
                    type="text"
                    required
                    value={editTargetDest}
                    onChange={(e) => setEditTargetDest(e.target.value)}
                    placeholder="/join or /v/corvette-z06"
                    className="w-full text-xs font-mono font-bold p-3 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminDrawer(false)}
                  className="px-3 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold uppercase rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm"
                >
                  Save & Stage Vehicle ➔
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
