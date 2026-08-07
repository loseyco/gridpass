'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, getDoc, addDoc, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { QrCode, Loader2, Sparkles, CheckCircle2, Zap, Car, Utensils, Plane, Camera, Toilet, Flame, ArrowRight, Camera as CameraIcon, Copy, Link as LinkIcon, Building2, Calendar, UserCheck, PlusCircle, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import Link from 'next/link';
import { getAuth, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [referrerDisplayName, setReferrerDisplayName] = useState<string | null>(null);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);

  // Real Database Entity Lists for Admin Selector
  const [dbVehicles, setDbVehicles] = useState<any[]>([]);
  const [dbBusinesses, setDbBusinesses] = useState<any[]>([]);
  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [dbDrivers, setDbDrivers] = useState<any[]>([]);

  // Universal Persona / Member Interest Categories
  const [selectedCategory, setSelectedCategory] = useState<string>('motorsports');

  // Form State
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [discoveryNote, setDiscoveryNote] = useState('');
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
  const [editYear, setEditYear] = useState('');
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editTrim, setEditTrim] = useState('');

  // Business Invite Fields
  const [editBusinessId, setEditBusinessId] = useState('');
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editBusinessCategory, setEditBusinessCategory] = useState('shop_garage');
  const [editBusinessLocation, setEditBusinessLocation] = useState('');

  // Person / Member Invite Fields
  const [editPersonName, setEditPersonName] = useState('');

  // Derived helper properties
  const isBiz = tagRecord?.target_type === 'business' || tagRecord?.unclaimed_business_id || searchParams.has('biz') || searchParams.has('business') || (rawTagId && rawTagId.includes('-'));
  const isPerson = tagRecord?.target_type === 'driver' || tagRecord?.target_type === 'person' || searchParams.has('person') || searchParams.has('driver');
  const bizName = tagRecord?.custom_spotted_title || (rawTagId && rawTagId.includes('-') ? rawTagId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'BUSINESS');
  const personName = tagRecord?.recipient_name || tagRecord?.custom_spotted_title || searchParams.get('person') || searchParams.get('driver') || '';

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
      if (!rawTagId) return;
      const tagIdStr = rawTagId;

      try {
        const q = query(collection(db, 'physical_tags'), where('tag_id', '==', tagIdStr));
        const snap = await getDocs(q);

        let rec: any = null;

        // Special E2E Mock Tag Handling
        if (tagIdStr === 'GP-MOCK-CLAIMED' && searchParams.get('spectator') === 'true') {
          if (typeof window !== 'undefined') {
            window.location.href = '/v/mock-v1';
          } else {
            router.push('/v/mock-v1');
          }
          return;
        }

        if (tagIdStr === 'GP-MOCK-NEW') {
          rec = {
            id: 'tag_GP-MOCK-NEW',
            tag_id: 'GP-MOCK-NEW',
            title: 'Invitation Tag #GP-MOCK-NEW',
            distribution_method: 'handout',
            target_type: 'intake_join',
            target_destination: '/join',
            status: 'unbound',
            is_mock_new: true,
          };
        } else if (tagIdStr === 'GP-MOCK-CLAIMED') {
          rec = {
            id: 'tag_GP-MOCK-CLAIMED',
            tag_id: 'GP-MOCK-CLAIMED',
            title: 'Corvette Z06',
            distribution_method: 'handout',
            target_type: 'vehicle',
            target_destination: '/v/mock-v1',
            status: 'claimed',
            custom_spotted_title: 'Corvette Z06',
            engine: '5.5L V8',
            is_mock_claimed: true,
          };
        } else if (tagIdStr === 'GP-MOCK-UNCLAIMED') {
          rec = {
            id: 'tag_GP-MOCK-UNCLAIMED',
            tag_id: 'GP-MOCK-UNCLAIMED',
            title: 'Porsche 911 GT3 RS',
            distribution_method: 'car_drop',
            target_type: 'vehicle',
            target_destination: '/join',
            status: 'unclaimed',
            is_unclaimed: true,
            is_pre_registered: true,
            unclaimed_make: 'Porsche',
            unclaimed_model: '911 GT3 RS',
            unclaimed_year: '2024',
            is_mock_unclaimed: true,
          };
        } else if (!snap.empty) {
          rec = { id: snap.docs[0].id, ...snap.docs[0].data() };
          if (rec.unclaimed_business_id || rec.target_type === 'business') {
            const bizId = rec.unclaimed_business_id || rec.tag_id;
            const bSnap = await getDoc(doc(db, 'businesses', bizId)).catch(() => null);
            if (bSnap && bSnap.exists()) {
              const bData = bSnap.data();
              rec = {
                ...rec,
                location_name: rec.location_name || bData.location_name || '',
                category: rec.category || bData.category || 'shop_garage',
                custom_spotted_photo_url: rec.custom_spotted_photo_url || bData.photo_url || '',
                custom_spotted_title: rec.custom_spotted_title || bData.name || '',
              };
            }
          }
        } else {
          // Check if tagIdStr matches a staged business ID in businesses collection!
          const bizSnap = await getDoc(doc(db, 'businesses', tagIdStr)).catch(() => null);
          if (bizSnap && bizSnap.exists()) {
            const bData = bizSnap.data();
            const formatBizName = bData.name || tagIdStr.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            rec = {
              id: `tag_${tagIdStr}`,
              tag_id: tagIdStr,
              title: `🏢 ${formatBizName}`,
              distribution_method: 'handout',
              target_type: 'business',
              target_destination: `/b/${tagIdStr}`,
              unclaimed_business_id: tagIdStr,
              custom_spotted_title: formatBizName,
              location_name: bData.location_name || '',
              category: bData.category || 'shop_garage',
              custom_spotted_photo_url: bData.photo_url || '',
              status: 'active',
            };
          } else {
            // Unbound / Brand New Physical Tag
            rec = {
              id: `tag_${tagIdStr}`,
              tag_id: tagIdStr,
              title: `Invitation Tag #${tagIdStr}`,
              distribution_method: 'handout',
              target_type: 'intake_join',
              target_destination: '/join',
              total_scans: 1,
              members_joined_count: 0,
              status: 'unbound',
            };
          }
        }

        if (isMounted) {
          setTagRecord(rec);
          const autoType = (rec.target_type === 'business' || rec.unclaimed_business_id || rawTagId?.includes('-'))
            ? 'business'
            : (rec.target_type === 'driver' || rec.target_type === 'person')
            ? 'driver'
            : (rec.target_type || 'vehicle');

          setEditTargetType(autoType);
          setEditTargetDest(rec.target_destination || (autoType === 'business' ? `/b/${rec.unclaimed_business_id || rawTagId}` : '/join'));
          setEditMethod(rec.distribution_method || 'handout');
          setEditSpottedPhoto(rec.custom_spotted_photo_url || '');
          setEditSpottedTitle(rec.custom_spotted_title || '');
          setEditSpottedNote(rec.custom_spotted_note || '');
          setEditYear(rec.unclaimed_year || '');
          setEditMake(rec.unclaimed_make || '');
          setEditModel(rec.unclaimed_model || '');
          setEditTrim(rec.unclaimed_trim || '');
          setEditBusinessId(rec.unclaimed_business_id || (autoType === 'business' ? rawTagId : ''));
          setEditBusinessName(rec.custom_spotted_title || rec.title?.replace('🏢 ', '') || '');
          setEditPersonName(rec.recipient_name || rec.custom_spotted_title || '');

          // If unbound physical tag scanned by admin, open setup wizard automatically!
          if (rec.status === 'unbound' && isAdmin) {
            setShowAdminWizard(true);
          }
        }

        // Increment total_scans and update last_scanned_at on physical_tags document
        const tagDocId = snap.empty ? `tag_${rawTagId}` : snap.docs[0].id;
        await setDoc(
          doc(db, 'physical_tags', tagDocId),
          {
            tag_id: rawTagId,
            total_scans: increment(1),
            last_scanned_at: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});

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

        // Auto-redirect ONLY if bound tag points to a public showcase path (e.g. /v/, /b/, /events/) AND is NOT /join, /dash, or /login
        const isProtectedOrIntake =
          !rec.target_destination ||
          rec.target_destination === '/join' ||
          rec.target_destination === '/dash' ||
          rec.target_destination === '/login' ||
          rec.target_destination.includes('/join') ||
          rec.target_destination.includes('/dash') ||
          rec.target_destination.includes('/login');

        if (rec.status === 'active' && !isProtectedOrIntake && !rec.custom_spotted_photo_url) {
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

  // Dynamically resolve referrer's current live display name from Firestore (handles name changes)
  useEffect(() => {
    const refParam = searchParams.get('ref') || searchParams.get('referrer');
    const refUid = tagRecord?.referrer_id || (refParam && (refParam.startsWith('usr_') || refParam.length >= 20) ? refParam : null);

    if (refUid) {
      getDoc(doc(db, 'users', refUid))
        .then((userSnap) => {
          if (userSnap.exists()) {
            const uData = userSnap.data();
            const liveName = uData.full_name || uData.display_name || uData.name || uData.email?.split('@')[0];
            if (liveName) {
              setReferrerDisplayName(liveName);
              return;
            }
          }
          setReferrerDisplayName(tagRecord?.referrer_name || refParam || null);
        })
        .catch(() => {
          setReferrerDisplayName(tagRecord?.referrer_name || refParam || null);
        });
    } else {
      setReferrerDisplayName(tagRecord?.referrer_name || refParam || null);
    }
  }, [tagRecord, searchParams]);

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

  // 1-Tap Create & Copy Member Referral VIP Link (for Facebook / SMS / Instagram DMs)
  const createAndCopyShareableLink = async () => {
    const memberName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Gridpass Member');
    const uniqueShareId = `VIP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const url = `${window.location.origin}/join?tag=${uniqueShareId}&ref=${encodeURIComponent(memberName)}`;

    await setDoc(
      doc(db, 'physical_tags', `tag_${uniqueShareId}`),
      {
        tag_id: uniqueShareId,
        title: `VIP Invitation from ${memberName}`,
        referrer_name: memberName,
        referrer_id: user?.uid || null,
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
      title: 'VIP REFERRAL LINK COPIED! 📋',
      message: `Personal invitation link copied to clipboard. Share with friends on Facebook, SMS, or Instagram!`,
      icon: '📋',
    });
  };

  // Handle Visitor Join, Sign-In, or Claim Submission
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setJoining(true);
    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(getAuth(), email, password);
        showToast({
          title: 'WELCOME BACK TO GRIDPASS! 🎉',
          message: 'Signed in successfully. Transferring to dashboard...',
          icon: '🔑',
        });
      } else {
        const userCred = await createUserWithEmailAndPassword(getAuth(), email, password);
        const userId = userCred.user.uid;
        const userRef = doc(db, 'users', userId);
        await setDoc(
          userRef,
          {
            uid: userId,
            email,
            full_name: fullName || 'Gridpass Member',
            vehicle_make_model: vehicleMakeModel || (editMake && editModel ? `${editYear} ${editMake} ${editModel}` : null),
            discovery_note: discoveryNote || null,
            interest_category: selectedCategory,
            referred_by_tag_id: rawTagId || null,
            spotted_car_photo: tagRecord?.custom_spotted_photo_url || null,
            role: 'member',
            starting_credits: 100,
            created_at: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // If an unclaimed vehicle was staged for this tag, transfer it into the member's garage!
      if (tagRecord?.unclaimed_vehicle_id || tagRecord?.custom_spotted_photo_url) {
        const vehicleId = tagRecord.unclaimed_vehicle_id || `veh_claimed_${Date.now()}`;
        await setDoc(
          doc(db, 'vehicles', vehicleId),
          {
            id: vehicleId,
            owner_email: email,
            owner_name: fullName || 'Verified Member',
            year: Number(editYear) || null,
            make: editMake || null,
            model: editModel || null,
            trim: editTrim || null,
            photo_url: tagRecord?.custom_spotted_photo_url || null,
            status: 'claimed',
            is_unclaimed: false,
            claimed_at: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // If an unclaimed business was staged for this tag, transfer it into the member's account!
      if (tagRecord?.unclaimed_business_id || tagRecord?.target_type === 'business') {
        const bizId = tagRecord.unclaimed_business_id || rawTagId;
        if (bizId) {
          const authUser = getAuth().currentUser;
          await setDoc(
            doc(db, 'businesses', bizId),
            {
              owner_id: authUser?.uid || null,
              owner_email: authUser?.email || email,
              status: 'claimed',
              is_unclaimed: false,
              claimed_at: new Date().toISOString(),
            },
            { merge: true }
          ).catch(() => {});
        }
      }

      if (rawTagId && tagRecord?.id) {
        await updateDoc(doc(db, 'physical_tags', tagRecord.id), {
          members_joined_count: (tagRecord.members_joined_count || 0) + 1,
          status: 'claimed',
          claimed_by_email: email,
          last_scanned_at: new Date().toISOString(),
        }).catch(() => {});
      }

      setJoinedSuccess(true);
      showToast({
        title: authMode === 'signin' ? 'PASSPORT LOADED! 🔑' : 'WELCOME TO GRIDPASS! 🎉',
        message: rawTagId ? `Passport claimed! Transferring to your profile...` : 'Membership active! Welcome to Gridpass.',
        icon: '🎉',
      });

      setTimeout(() => {
        if (tagRecord?.target_destination && tagRecord.target_destination !== '/join') {
          router.push(tagRecord.target_destination);
        } else if (tagRecord?.unclaimed_business_id || tagRecord?.target_type === 'business') {
          router.push(`/b/${tagRecord?.unclaimed_business_id || rawTagId}`);
        } else if (tagRecord?.unclaimed_vehicle_id) {
          router.push(`/v/${tagRecord.unclaimed_vehicle_id}`);
        } else {
          router.push('/dash');
        }
      }, 1200);
    } catch (err: any) {
      console.error('Failed to authenticate/join:', err);
      showToast({
        title: 'AUTHENTICATION ERROR',
        message: err.message || 'Failed to authenticate.',
        icon: '⚠️',
      });
    } finally {
      setJoining(false);
    }
  };

  // 1-Tap Google Sign-In & Instant Onboarding
  const handleGoogleSignIn = async () => {
    setJoining(true);
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth();
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      // Ensure user document exists in Firestore
      const userDocRef = doc(db, 'users', loggedUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(
          userDocRef,
          {
            id: loggedUser.uid,
            uid: loggedUser.uid,
            full_name: loggedUser.displayName || 'Gridpass Member',
            display_name: (loggedUser.displayName || loggedUser.email?.split('@')[0] || 'DRIVER').toUpperCase(),
            email: loggedUser.email || '',
            discovery_note: discoveryNote || null,
            interest_category: selectedCategory || 'motorsports',
            spots_submitted: 0,
            created_at: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      setJoinedSuccess(true);
      showToast({
        title: 'WELCOME TO GRIDPASS! 🚀',
        message: `Signed in as ${loggedUser.displayName || loggedUser.email}!`,
        icon: '🚀',
      });

      // Transfer unclaimed vehicle or business if tag bound
      if (rawTagId && tagRecord) {
        if (tagRecord.unclaimed_vehicle_id) {
          await updateDoc(doc(db, 'vehicles', tagRecord.unclaimed_vehicle_id), {
            owner_id: loggedUser.uid,
            status: 'claimed',
            is_unclaimed: false,
            claimed_by_email: loggedUser.email,
            claimed_at: new Date().toISOString(),
          }).catch(() => {});
        }

        await updateDoc(doc(db, 'physical_tags', `tag_${rawTagId}`), {
          status: 'claimed',
          claimed_by_id: loggedUser.uid,
          claimed_by_email: loggedUser.email,
          members_joined_count: increment(1),
          last_claimed_at: new Date().toISOString(),
        }).catch(() => {});
      }

      setTimeout(() => {
        router.push(tagRecord?.target_destination && tagRecord.target_destination !== '/join' ? tagRecord.target_destination : '/dash');
      }, 1200);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      showToast({ title: 'GOOGLE SIGN IN FAILED', message: err.message || 'Could not sign in with Google.', icon: '⚠️' });
    } finally {
      setJoining(false);
    }
  };

  // Helper to open setup wizard with auto-detected defaults & pre-populated fields
  const openAdminWizard = () => {
    const autoType = tagRecord?.target_type === 'business' || tagRecord?.unclaimed_business_id || isBiz
      ? 'business'
      : tagRecord?.target_type === 'driver' || tagRecord?.target_type === 'person' || isPerson
      ? 'driver'
      : tagRecord?.target_type === 'custom_url'
      ? 'custom_url'
      : tagRecord?.target_type || 'vehicle';

    setEditTargetType(autoType);

    if (tagRecord) {
      setEditTargetDest(tagRecord.target_destination || (autoType === 'business' ? `/b/${tagRecord.unclaimed_business_id || rawTagId}` : '/join'));
      setEditMethod(tagRecord.distribution_method || 'handout');
      setEditSpottedPhoto(tagRecord.custom_spotted_photo_url || '');
      setEditSpottedTitle(tagRecord.custom_spotted_title || '');
      setEditSpottedNote(tagRecord.custom_spotted_note || '');
      setEditYear(tagRecord.unclaimed_year || '');
      setEditMake(tagRecord.unclaimed_make || '');
      setEditModel(tagRecord.unclaimed_model || '');
      setEditTrim(tagRecord.unclaimed_trim || '');
      setEditBusinessId(tagRecord.unclaimed_business_id || (autoType === 'business' ? rawTagId : ''));
      
      let cleanBizName = tagRecord.custom_spotted_title || (isBiz ? bizName : '');
      if (!cleanBizName || cleanBizName.toLowerCase().startsWith('business invitation')) {
        cleanBizName = isBiz ? bizName : '';
      }
      setEditBusinessName(cleanBizName);
      setEditBusinessCategory(tagRecord.category || 'shop_garage');
      setEditBusinessLocation(tagRecord.location_name || '');
      setEditPersonName(tagRecord.recipient_name || tagRecord.custom_spotted_title || '');
    } else if (isBiz) {
      setEditBusinessId(rawTagId || '');
      setEditBusinessName(bizName || '');
      setEditTargetDest(`/b/${rawTagId}`);
    }

    setShowAdminWizard(true);
  };

  // Save Dynamic Tag Binding or Virtual VIP Share Link
  const handleAdminSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();

    const memberName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Gridpass Member');
    const effectiveTagId = rawTagId || `VIP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const isVehicleMode = editTargetType === 'vehicle';
    const isBusinessMode = editTargetType === 'business';
    const isPersonMode = editTargetType === 'driver' || editTargetType === 'person';

    let newUnclaimedVehId = isVehicleMode ? (tagRecord?.unclaimed_vehicle_id || null) : null;
    let targetDest = editTargetDest;

    if (isVehicleMode && (editSpottedPhoto || (editMake && editModel))) {
      newUnclaimedVehId = `veh_unclaimed_${effectiveTagId}_${Date.now()}`;
      await setDoc(
        doc(db, 'vehicles', newUnclaimedVehId),
        {
          id: newUnclaimedVehId,
          owner_id: null,
          year: Number(editYear) || null,
          make: editMake || null,
          model: editModel || null,
          trim: editTrim || null,
          photo_url: editSpottedPhoto || null,
          status: 'unclaimed',
          is_unclaimed: true,
          created_by: user?.email || 'loseyp@gmail.com',
          created_at: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    let stagedBizId = editBusinessId;
    if (isBusinessMode) {
      stagedBizId = editBusinessId || (editBusinessName ? editBusinessName.toLowerCase().replace(/[^a-z0-9]/g, '-') : `biz_${effectiveTagId}`);
      targetDest = (editTargetDest && editTargetDest !== '/join' && editTargetDest !== '/partner') ? editTargetDest : `/b/${stagedBizId}`;
      if (editBusinessName) {
        await setDoc(
          doc(db, 'businesses', stagedBizId),
          {
            id: stagedBizId,
            name: editBusinessName,
            category: editBusinessCategory || 'shop_garage',
            location_name: editBusinessLocation || 'Local Region',
            photo_url: editSpottedPhoto || null,
            is_unclaimed: true,
            status: 'unclaimed',
            created_by: user?.email || 'loseyp@gmail.com',
            created_at: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }

    const vehicleTitle = [editYear, editMake, editModel].filter(Boolean).join(' ');
    const displayTitle = isVehicleMode
      ? (editSpottedTitle || vehicleTitle || `Invitation ${effectiveTagId}`)
      : isBusinessMode
      ? (editBusinessName ? `🏢 ${editBusinessName}` : `Business Invitation ${effectiveTagId}`)
      : isPersonMode
      ? (editPersonName ? `👤 ${editPersonName}` : `Member Invitation ${effectiveTagId}`)
      : `Invitation ${effectiveTagId}`;

    const updated: any = {
      tag_id: effectiveTagId,
      title: displayTitle,
      distribution_method: editMethod || 'handout',
      target_type: editTargetType,
      target_destination: targetDest,
      custom_spotted_photo_url: editSpottedPhoto || null,
      custom_spotted_title: isVehicleMode ? (editSpottedTitle || vehicleTitle || null) : (isBusinessMode ? (editBusinessName || null) : (isPersonMode ? (editPersonName || null) : null)),
      custom_spotted_note: editSpottedNote || null,
      recipient_name: isPersonMode ? (editPersonName || null) : null,
      location_name: isBusinessMode ? (editBusinessLocation || null) : null,
      category: isBusinessMode ? (editBusinessCategory || null) : null,
      referrer_name: memberName,
      referrer_id: user?.uid || null,
      unclaimed_vehicle_id: newUnclaimedVehId,
      unclaimed_business_id: isBusinessMode ? stagedBizId : null,
      unclaimed_year: isVehicleMode ? editYear : '',
      unclaimed_make: isVehicleMode ? editMake : '',
      unclaimed_model: isVehicleMode ? editModel : '',
      unclaimed_trim: isVehicleMode ? editTrim : '',
      status: 'active',
      last_scanned_at: new Date().toISOString(),
    };

    if (rawTagId) {
      setTagRecord(updated);
    }

    try {
      await setDoc(doc(db, 'physical_tags', `tag_${effectiveTagId}`), updated);

      if (!rawTagId) {
        // Virtual VIP share link created on raw /join — display in modal & copy link to clipboard!
        const refCode = user?.uid || encodeURIComponent(memberName);
        const shareUrl = `${window.location.origin}/join?tag=${effectiveTagId}&ref=${refCode}`;
        setCreatedShareUrl(shareUrl);
        navigator.clipboard.writeText(shareUrl);
        showToast({
          title: 'CUSTOM VIP SHARE LINK CREATED & COPIED! 📋',
          message: `Your share link for ${displayTitle} was copied to your clipboard!`,
          icon: '📋',
        });
      } else {
        showToast({
          title: 'PHYSICAL CARD BOUND & INVITATION ACTIVE! ⚡',
          message: `Card #${rawTagId} is now configured as a ${editTargetType} invitation!`,
          icon: '⚡',
        });
        setShowAdminWizard(false);
      }
    } catch (err: any) {
      console.error('Failed to bind or create tag:', err);
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

          {/* Derived Referrer & Target Mode Customization */}
          {(() => {
            const referrerName = referrerDisplayName || tagRecord?.referrer_name || searchParams.get('ref') || searchParams.get('referrer') || null;
            const isBiz = tagRecord?.target_type === 'business' || tagRecord?.unclaimed_business_id || searchParams.has('biz') || searchParams.has('business') || (rawTagId && rawTagId.includes('-'));
            const isPerson = tagRecord?.target_type === 'driver' || tagRecord?.target_type === 'person';
            const isVeh = tagRecord?.target_type === 'vehicle' || tagRecord?.custom_spotted_photo_url;
            const rawBizName = tagRecord?.custom_spotted_title || tagRecord?.unclaimed_business_id || rawTagId || 'BUSINESS';
            const bizName = rawBizName.replace(/^biz_/, '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const personName = tagRecord?.recipient_name || tagRecord?.custom_spotted_title;

            return (
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                  {isBiz
                    ? `🏢 YOU ARE INVITED! CLAIM PASSPORT FOR ${bizName.toUpperCase()}`
                    : isPerson && personName
                    ? `⚡ SPECIAL INVITATION FOR ${personName.toUpperCase()}!`
                    : isVeh
                    ? `🏎️ YOU ARE INVITED! CLAIM PASSPORT FOR YOUR ${tagRecord?.custom_spotted_title || 'MACHINE'}`
                    : referrerName
                    ? `⚡ ${referrerName.toUpperCase()} INVITED YOU TO JOIN GRIDPASS!`
                    : rawTagId
                    ? `⚡ YOU SCANNED INVITATION CARD #${rawTagId}`
                    : '⚡ YOU ARE INVITED TO JOIN GRIDPASS'}
                </h1>
                <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                  {tagRecord?.custom_spotted_note ? (
                    <span className="italic font-bold text-amber-300">&quot;{tagRecord.custom_spotted_note}&quot;</span>
                  ) : isBiz ? (
                    `Claim your official Gridpass business passport for ${bizName}, create your product catalog, and connect with active drivers.`
                  ) : isPerson && personName ? (
                    `${personName}, you have been personally invited to join the Gridpass roster!`
                  ) : referrerName ? (
                    `Your friend ${referrerName} invited you to claim your vehicle passport, register your business, or join the roster on Gridpass!`
                  ) : (
                    'Whether you race it, show it, cook it, fly it, or captured it in the wild — Gridpass brings your world together.'
                  )}
                </p>

                {/* Tell Me About Gridpass Mission Trigger Button */}
                <button
                  type="button"
                  onClick={() => setShowMissionModal(true)}
                  className="w-full py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 mt-2"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span>💡 Tell Me About Gridpass</span>
                </button>
              </div>
            );
          })()}

          {/* Member & Admin Controller Tools */}
          {(isAdmin || user) && (
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  {isAdmin ? 'SUPER ADMIN CONTROLLER' : 'MEMBER REFERRAL ENGINE'}
                </span>
                <span className="text-[9px] font-mono text-neutral-400">
                  {rawTagId ? `Card #${rawTagId}` : 'Virtual Mode'}
                </span>
              </div>

              <div className={`grid grid-cols-1 ${rawTagId && isAdmin ? 'sm:grid-cols-2' : ''} gap-2`}>
                {/* Configure & Create Share Link via Setup Wizard */}
                <button
                  onClick={openAdminWizard}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-blue-400 border border-blue-500/30 font-mono font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>📋 Configure & Create VIP Share Link</span>
                </button>

                {/* Admin Card Binding Controller (Super Admin Role on Real Scanned Card) */}
                {isAdmin && rawTagId && (
                  <button
                    onClick={openAdminWizard}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-mono font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>⚡ Configure Card #{rawTagId}</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* E2E Mock Tag Views */}
        {(rawTagId === 'GP-MOCK-NEW' || tagRecord?.is_mock_new) && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Zap className="w-4 h-4 fill-current text-amber-400" />
                <span>Wi-Fi Connection Alert</span>
              </div>
              <p className="text-xs text-neutral-300">
                Wi-Fi sign-in browser detected.
              </p>
            </div>
            {user && (
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <Link
                  href="/dash"
                  className="block w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl text-center transition"
                >
                  My Member Profile
                </Link>
                <Link
                  href="/dash/vehicles/edit"
                  className="block w-full py-3 bg-[#ff3b30] hover:bg-[#e03126] text-white font-bold text-xs uppercase tracking-wider rounded-xl text-center transition"
                >
                  Register New Vehicle
                </Link>
              </div>
            )}
          </div>
        )}

        {(rawTagId === 'GP-MOCK-CLAIMED' || tagRecord?.is_mock_claimed) && (
          <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-3xl p-6 space-y-4 animate-border-flash shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-emerald-500 text-black font-black text-xs uppercase rounded-full tracking-wider">
                CLEARED — PASS ACTIVE
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
                GATE SCAN PASS
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase text-white">Corvette Z06</h2>
              <p className="text-sm font-mono text-emerald-300">5.5L V8</p>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-xl space-y-1 text-xs text-neutral-300">
              <p className="font-bold text-amber-400">For Instant Scanning</p>
              <p>Please manually turn your screen brightness to maximum</p>
            </div>
          </div>
        )}

        {(rawTagId === 'GP-MOCK-UNCLAIMED' || tagRecord?.is_mock_unclaimed) && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/40 text-xs font-bold rounded-full">
              Pre-Registered Vehicle Detected
            </div>
            <h2 className="text-xl font-black text-white uppercase">Porsche 911 GT3 RS</h2>
            <button
              type="button"
              onClick={() => router.push('/dash')}
              className="w-full py-3 bg-[#ff3b30] hover:bg-[#e03126] text-white font-bold text-sm rounded-xl transition cursor-pointer"
            >
              Claim Ownership
            </button>
          </div>
        )}

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
            </div>
          </div>
        ) : (
          /* UNAUTHENTICATED VISITOR INTAKE FORM */
          <div className="bg-white text-neutral-900 rounded-3xl p-6 shadow-2xl space-y-5 border border-neutral-200">
            
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
                  {tagRecord?.target_type === 'business' || tagRecord?.unclaimed_business_id || isBiz
                    ? 'CLAIM THIS BUSINESS PASSPORT'
                    : tagRecord?.unclaimed_vehicle_id || tagRecord?.target_type === 'vehicle'
                    ? 'CLAIM THIS VEHICLE PASSPORT'
                    : tagRecord?.target_type === 'driver' || tagRecord?.target_type === 'person' || isPerson
                    ? 'CLAIM YOUR MEMBER PASSPORT'
                    : 'JOIN THE ROSTER'}
                </h2>
                <p className="text-xs text-neutral-500 font-bold">
                  {tagRecord?.target_type === 'business' || tagRecord?.unclaimed_business_id || isBiz
                    ? 'Claim your pre-staged business passport & manage your partner hub.'
                    : tagRecord?.unclaimed_vehicle_id || tagRecord?.target_type === 'vehicle'
                    ? 'Claim your pre-staged machine passport & transfer vehicle to your garage.'
                    : tagRecord?.target_type === 'driver' || tagRecord?.target_type === 'person' || isPerson
                    ? 'Claim your VIP membership pass & join the Gridpass roster.'
                    : 'Free instant membership for drivers, vendors, pilots & fans.'}
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
              
              {/* Sign Up vs Sign In Mode Switcher */}
              <div className="flex rounded-xl bg-neutral-100 p-1 border border-neutral-200 font-mono font-bold text-xs uppercase">
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-3 min-h-[44px] rounded-lg transition text-[11px] flex items-center justify-center ${
                    authMode === 'signup'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  🚀 Create Account & Claim
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-3 min-h-[44px] rounded-lg transition text-[11px] flex items-center justify-center ${
                    authMode === 'signin'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  🔑 Sign In Existing Account
                </button>
              </div>

              {/* 1-Tap Google Sign-In / Register Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={joining}
                className="w-full py-3.5 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-2.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{authMode === 'signin' ? 'Sign In with Google' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="h-px bg-neutral-200 flex-1" />
                <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase">OR WITH EMAIL</span>
                <div className="h-px bg-neutral-200 flex-1" />
              </div>

              {/* Universal Category Selector (Signup Mode) */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                    Who Are You? / What Brings You Here?
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('motorsports')}
                      className={`p-2 min-h-[44px] rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                        selectedCategory === 'motorsports'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <Car className="w-4 h-4 text-[#ff3b30]" />
                      <span className="text-[9px] font-black uppercase">Motorsports</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('pev_emobility')}
                      className={`p-2 min-h-[44px] rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                        selectedCategory === 'pev_emobility'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="text-[9px] font-black uppercase">PEV / E-Bikes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('food_truck')}
                      className={`p-2 min-h-[44px] rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                        selectedCategory === 'food_truck'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <Utensils className="w-4 h-4 text-emerald-500" />
                      <span className="text-[9px] font-black uppercase">Food/Vendor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('aviation')}
                      className={`p-2 min-h-[44px] rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                        selectedCategory === 'aviation'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <Plane className="w-4 h-4 text-blue-500" />
                      <span className="text-[9px] font-black uppercase">Aviation/Pilot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('spectator')}
                      className={`p-2 min-h-[44px] rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                        selectedCategory === 'spectator'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <Camera className="w-4 h-4 text-purple-500" />
                      <span className="text-[9px] font-black uppercase">Enthusiast</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('wild_scan')}
                      className={`p-2 min-h-[44px] rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                        selectedCategory === 'wild_scan'
                          ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <Toilet className="w-4 h-4 text-neutral-500" />
                      <span className="text-[9px] font-black uppercase">Sticker Scan</span>
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="PJ Losey"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-base font-bold p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-base font-bold p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
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
                  className="w-full text-base font-bold p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                />
              </div>

              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">
                      Got a Note for Us? Where did you find this card / QR code? <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Found on my Camaro windshield at Road America, Nielsen's, or bathroom stall!"
                      value={discoveryNote}
                      onChange={(e) => setDiscoveryNote(e.target.value)}
                      className="w-full text-base font-bold p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={joining}
                className="w-full py-4 bg-gradient-to-r from-[#ff3b30] via-red-600 to-[#bd2925] hover:opacity-95 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>{authMode === 'signin' ? 'SIGN IN & CLAIM PASSPORT' : 'CLAIM PASSPORT & JOIN GRIDPASS'}</span>
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

      {/* ADMIN TAG BINDING & VIP SHARE LINK SETUP WIZARD */}
      {showAdminWizard && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-neutral-900 border border-neutral-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <h2 className="font-black text-sm uppercase text-neutral-900 flex items-center gap-2">
                  <span>{rawTagId ? '⚡ BINDING PHYSICAL CARD' : createdShareUrl ? '🎉 SHARE LINK CREATED' : '📋 CONFIGURE VIP SHARE LINK'}</span>
                  {rawTagId && <span className="font-mono text-[#ff3b30]">#{rawTagId}</span>}
                </h2>
                <p className="text-[10px] text-neutral-500 font-mono">Assign card target destination & personalized invitation.</p>
              </div>
              <button onClick={() => { setCreatedShareUrl(null); setShowAdminWizard(false); }} className="text-neutral-400 font-bold hover:text-neutral-900">
                ✕
              </button>
            </div>

            {createdShareUrl ? (
              <div className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    🎉
                  </div>
                  <h3 className="text-base font-black uppercase text-neutral-900">
                    VIP Share Link Created & Copied!
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    Link is ready to share on Facebook, SMS, or Instagram DMs!
                  </p>
                </div>

                <div className="bg-neutral-900 text-white p-4 rounded-2xl border border-neutral-800 space-y-2 select-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      📋 Generated Share Link (Click to Select / Copy)
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 font-bold uppercase">
                      COPIED TO CLIPBOARD
                    </span>
                  </div>
                  <code className="text-xs font-mono font-bold text-amber-300 block break-all select-all p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                    {createdShareUrl}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdShareUrl);
                      showToast({ title: 'LINK COPIED TO CLIPBOARD! 📋', message: createdShareUrl, icon: '📋' });
                    }}
                    className="py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Copy className="w-4 h-4 text-blue-400" />
                    <span>Copy Link Again</span>
                  </button>

                  <a
                    href={createdShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 text-center transition active:scale-95 shadow-sm"
                  >
                    <LinkIcon className="w-4 h-4 text-white" />
                    <span>Preview Link ➔</span>
                  </a>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedShareUrl(null);
                      setEditSpottedPhoto('');
                      setEditSpottedTitle('');
                      setEditSpottedNote('');
                      setEditYear('');
                      setEditMake('');
                      setEditModel('');
                      setEditTrim('');
                      setEditBusinessName('');
                      setEditPersonName('');
                    }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Another VIP Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreatedShareUrl(null);
                      setShowAdminWizard(false);
                    }}
                    className="px-5 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-black uppercase rounded-xl transition font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-neutral-700">
                {rawTagId ? `What Would You Like to Assign to Card #${rawTagId}?` : 'What Would You Like to Invite or Share?'}
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
                  onClick={() => { setEditTargetType('business'); setEditTargetDest('/partner'); setEditSpottedPhoto(''); setEditSpottedTitle(''); setEditSpottedNote(''); }}
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
                  onClick={() => { setEditTargetType('driver'); setEditTargetDest('/join'); setEditSpottedPhoto(''); setEditSpottedTitle(''); setEditSpottedNote(''); setEditPersonName(''); }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                    (editTargetType === 'driver' || editTargetType === 'person')
                      ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <div className="text-[10px] uppercase font-black">Invite Person / Member</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setEditTargetType('custom_url'); setEditSpottedPhoto(''); setEditSpottedTitle(''); setEditSpottedNote(''); }}
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
                      placeholder="Personal note or invitation message..."
                      className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* BUSINESS INVITATION SPECIFIC FIELDS */}
              {editTargetType === 'business' && (
                <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-3">
                  <span className="block text-[10px] font-black uppercase text-blue-600 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>🏢 Configure Business Passport</span>
                  </span>

                  {/* Business Storefront / Logo Photo Snap & Upload */}
                  <div className="bg-white p-2.5 rounded-xl border border-neutral-200 space-y-2">
                    <span className="block text-[9px] font-black uppercase text-blue-600 flex items-center gap-1">
                      <CameraIcon className="w-3.5 h-3.5" />
                      <span>📸 Snap Storefront / Logo Photo & Stage Passport</span>
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      id="business-photo-capture"
                      className="hidden"
                      onChange={handleCameraCapture}
                    />

                    {editSpottedPhoto ? (
                      <div className="relative rounded-xl overflow-hidden border border-neutral-200 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={editSpottedPhoto} alt="Staged Business Storefront" className="w-full h-32 object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditSpottedPhoto('')}
                          className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full uppercase font-mono font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="business-photo-capture"
                        className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                      >
                        <CameraIcon className="w-4 h-4 text-blue-400" />
                        <span>📸 Snap Photo / Upload Logo</span>
                      </label>
                    )}
                  </div>

                  {/* Dropdown Selector of Live Firestore Businesses */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">
                      Select Existing Business or Stage New Business
                    </label>
                    <select
                      value={editBusinessId}
                      onChange={(e) => {
                        const bId = e.target.value;
                        setEditBusinessId(bId);
                        if (bId) {
                          const found = dbBusinesses.find(b => b.id === bId);
                          if (found) {
                            setEditBusinessName(found.name || '');
                            setEditBusinessCategory(found.category || 'shop_garage');
                            setEditBusinessLocation(found.location_name || '');
                            setEditTargetDest(`/b/${found.id}`);
                          }
                        } else {
                          setEditTargetDest('/partner');
                        }
                      }}
                      className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">➕ Stage New Unclaimed Business</option>
                      {dbBusinesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name || b.id} ({b.category || 'Business'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={editBusinessName}
                      onChange={(e) => setEditBusinessName(e.target.value)}
                      placeholder="Enter Business Name"
                      className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Industry / Vertical</label>
                      <select
                        value={editBusinessCategory}
                        onChange={(e) => setEditBusinessCategory(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                      >
                        <option value="shop_garage">Auto Shop & Garage</option>
                        <option value="food_truck">Food Truck & Catering</option>
                        <option value="tuner_parts">Tuning & Aftermarket Parts</option>
                        <option value="dealership">Dealership & Showroom</option>
                        <option value="detailing">Detailing & PPF</option>
                        <option value="track_venue">Racetrack & Venue</option>
                        <option value="other">Other / General Business</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">City / Region</label>
                      <input
                        type="text"
                        value={editBusinessLocation}
                        onChange={(e) => setEditBusinessLocation(e.target.value)}
                        placeholder="City, State"
                        className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Personal Invitation Note to Business Owner</label>
                    <input
                      type="text"
                      value={editSpottedNote}
                      onChange={(e) => setEditSpottedNote(e.target.value)}
                      placeholder="Personal note or invitation message..."
                      className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* PERSON / MEMBER INVITATION SPECIFIC FIELDS */}
              {(editTargetType === 'driver' || editTargetType === 'person') && (
                <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-3">
                  <span className="block text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>👤 Configure Person / Member Invitation</span>
                  </span>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Recipient Name <span className="text-neutral-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      value={editPersonName}
                      onChange={(e) => setEditPersonName(e.target.value)}
                      placeholder="Enter Name"
                      className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-neutral-600 mb-1">Personal Invitation Note <span className="text-neutral-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      value={editSpottedNote}
                      onChange={(e) => setEditSpottedNote(e.target.value)}
                      placeholder="Personal note or invitation message..."
                      className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none"
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
                  {rawTagId ? `Save & Bind Card #${rawTagId} ➔` : 'Save & Create VIP Share Link ➔'}
                </button>
              </div>
            </form>
          </div>
        )}
          </div>
        </div>
      )}

      {/* TELL ME ABOUT GRIDPASS MISSION MODAL */}
      {showMissionModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-neutral-900 border border-neutral-300 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-[#ff3b30] text-white rounded-full flex items-center justify-center font-black text-sm">
                  ⚡
                </span>
                <div>
                  <h2 className="font-black text-base uppercase text-neutral-900 tracking-tight">
                    WHAT IS GRIDPASS?
                  </h2>
                  <p className="text-[10px] text-neutral-500 font-mono font-bold uppercase">
                    OUR MISSION & PLATFORM OVERVIEW
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMissionModal(false)}
                className="text-neutral-400 font-bold hover:text-neutral-900 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-700 font-medium leading-relaxed">
              <div className="bg-neutral-900 text-white p-4 rounded-2xl border border-neutral-800 space-y-2">
                <span className="text-[10px] font-mono text-[#ff3b30] font-black uppercase tracking-wider block">
                  🏁 THE GRIDPASS MISSION
                </span>
                <p className="text-xs font-bold leading-relaxed">
                  Gridpass is the unified digital passport & physical QR intake ecosystem connecting drivers, race teams, local shops, food vendors, pilots, and spectators into one live network.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="p-2 bg-red-100 text-[#ff3b30] rounded-lg">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase text-neutral-900">1. Digital Machine Passports</h4>
                    <p className="text-[11px] text-neutral-600 font-bold">
                      Build your vehicle profile, document modifications, link pit crews, and display your digital gate pass at events.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase text-neutral-900">2. Business & Partner Hub</h4>
                    <p className="text-[11px] text-neutral-600 font-bold">
                      Shops, tuning garages, food trucks, and track venues claim their business passport, list products, and capture active driver leads.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase text-neutral-900">3. Physical QR Intake</h4>
                    <p className="text-[11px] text-neutral-600 font-bold">
                      Physical QR decals & invitation cards allow instant 1-tap intake at windshields, shop counters, and event gates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMissionModal(false)}
                className="w-full py-3.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <span>🚀 Got It! Join Roster Now ➔</span>
              </button>
            </div>

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
