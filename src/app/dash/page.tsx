'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Logo from '@/components/Logo';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  User as UserIcon, 
  QrCode, 
  Car, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ExternalLink,
  Settings,
  Sparkles,
  ArrowRight,
  Loader2,
  DollarSign,
  Edit2,
  Trash2,
  Download,
  Plus,
  X,
  Palette,
  Printer,
  Wrench,
  Gauge,
  Zap,
  ArrowLeftRight,
  Camera,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { logEvent } from '@/lib/logger';

interface DashboardVehicle {
  id?: string;
  year?: number | string;
  make?: string;
  model?: string;
  engine?: string;
  power?: string;
  transmission?: string;
  mods?: string[];
  tag_id?: string;
  owner_id?: string;
  owner_email?: string | null;
  updated_at?: unknown;
  isPremium?: boolean;
  created_at?: unknown;
  views?: number;
  photoUrl?: string;
}

interface DashboardProfile {
  name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  email?: string;
  tag_id?: string;
  displayName?: string;
  avatarIcon?: string;
  views?: number;
  photoUrl?: string;
  is_supporter?: boolean;
  socials?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    facebook?: string;
  };
  skills?: Array<{
    id: string;
    name: string;
    rating: number;
    endorsements: number;
  }>;
  achievements?: Array<{
    id: string;
    year: string;
    title: string;
    type: string;
  }>;
}

interface DashboardTagScan {
  id: string;
  tag_id: string;
  timestamp?: unknown;
  locationDetails?: string;
  userAgent?: string;
  ip?: string;
  payload?: unknown;
  resolvedTo?: string;
  scannedAt?: string;
  tagId?: string;
  location?: { lat: number; lng: number } | null;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Active user details
  const email = user?.email || 'driver@gridpass.app';
  const isOwner = email === 'loseyp@gmail.com';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'garage' | 'scans' | 'payouts'>('garage');

  // Live Sync States
  const [pendingBlockers, setPendingBlockers] = useState(0);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [tagScans, setTagScans] = useState<DashboardTagScan[]>([]);
  const [loadingDb, setLoadingDb] = useState<boolean>(true);

  // Profile Editor State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>('');
  const [profilePhone, setProfilePhone] = useState<string>('');
  const [profileLocation, setProfileLocation] = useState<string>('');
  const [profileBio, setProfileBio] = useState<string>('');
  const [profileAvatar, setProfileAvatar] = useState<string>('user');
  const [updatingProfile, setUpdatingProfile] = useState<boolean>(false);

  // Expanded profile fields states
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [socWebsite, setSocWebsite] = useState<string>('');
  const [socTwitter, setSocTwitter] = useState<string>('');
  const [socInstagram, setSocInstagram] = useState<string>('');
  const [socLinkedin, setSocLinkedin] = useState<string>('');
  const [socYoutube, setSocYoutube] = useState<string>('');
  const [socFacebook, setSocFacebook] = useState<string>('');
  
  const [profileSkills, setProfileSkills] = useState<any[]>([]);
  const [profileAchievements, setProfileAchievements] = useState<any[]>([]);
  
  // Temp states for adding new list items
  const [newSkillName, setNewSkillName] = useState<string>('');
  const [newSkillRating, setNewSkillRating] = useState<number>(5);
  const [newAchYear, setNewAchYear] = useState<string>('');
  const [newAchTitle, setNewAchTitle] = useState<string>('');
  const [newAchType, setNewAchType] = useState<string>('milestone');

  // Photo & Resume Upload States & Refs
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [profileResumeUrl, setProfileResumeUrl] = useState<string>('');
  const [uploadingResume, setUploadingResume] = useState<boolean>(false);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingResume(true);

    try {
      const storageRef = ref(storage, `users/${user.uid}/resume.pdf`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setProfileResumeUrl(downloadUrl);
      setUploadingResume(false);
    } catch (err) {
      console.error("Resume upload failed:", err);
      alert("Failed to upload resume: " + (err instanceof Error ? err.message : String(err)));
      setUploadingResume(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);

    try {
      const storageRef = ref(storage, `images/users/${user.uid}/profile_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setProfilePhotoUrl(downloadUrl);
      setUploadingPhoto(false);
    } catch (err) {
      console.error("Photo upload failed:", err);
      alert("Failed to upload photo: " + (err instanceof Error ? err.message : String(err)));
      setUploadingPhoto(false);
    }
  };

  // Vehicle Modals State
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<DashboardVehicle | null>(null); // null = Registering New
  const [vYear, setVYear] = useState<string>('');
  const [vMake, setVMake] = useState<string>('');
  const [vModel, setVModel] = useState<string>('');
  const [vEngine, setVEngine] = useState<string>('');
  const [vPower, setVPower] = useState<string>('');
  const [vTransmission, setVTransmission] = useState<string>('7-speed PDK');
  const [vModsString, setVModsString] = useState<string>('');
  const [vTagId, setVTagId] = useState<string>('');
  const [vPhotoUrl, setVPhotoUrl] = useState<string>('');
  const [uploadingVPhoto, setUploadingVPhoto] = useState<boolean>(false);
  const vehiclePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [savingVehicle, setSavingVehicle] = useState<boolean>(false);

  const handleVehiclePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingVPhoto(true);

    try {
      const tempVehicleId = selectedVehicle?.id || `new_veh_${Date.now()}`;
      const storageRef = ref(storage, `vehicles/${user.uid}/${tempVehicleId}/photo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setVPhotoUrl(downloadUrl);
      setUploadingVPhoto(false);
    } catch (err) {
      console.error("Vehicle photo upload failed:", err);
      alert("Failed to upload vehicle photo: " + (err instanceof Error ? err.message : String(err)));
      setUploadingVPhoto(false);
    }
  };

  // Print-Ready QR Sign Generator State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printAsset, setPrintAsset] = useState<{ title: string; url: string; type: 'vehicle' | 'profile' } | null>(null);
  const [signTitle, setSignTitle] = useState<string>('');
  const [signTheme, setSignTheme] = useState<'cyan' | 'red' | 'emerald'>('red');
  const [signSubtext, setSignSubtext] = useState<string>('');
  const [signFormat, setSignFormat] = useState<'windshield' | 'poster' | 'sticker_3x3' | 'keytag' | 'svg_export'>('windshield');
  const [generatingPrint, setGeneratingPrint] = useState<boolean>(false);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Vehicle Transfer State
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferVehicle, setTransferVehicle] = useState<DashboardVehicle | null>(null);
  const [transferEmail, setTransferEmail] = useState<string>('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<boolean>(false);
  const [transferring, setTransferring] = useState<boolean>(false);

  // Protect the route
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent('/dash')}`);
    }
  }, [user, authLoading, router]);

  // Listen to swarm interlock blockers dynamically
  useEffect(() => {
    if (!isOwner) return;
    const q = query(collection(db, 'swarm_interlock'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingBlockers(snapshot.size);
    });
    return () => unsubscribe();
  }, [isOwner]);

  // Firestore User Profile Real-time listener and Auto-seeding
  useEffect(() => {
    if (!user) return;

    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
      setProfile({
        displayName: 'PJ LOSEY',
        email: 'driver@gridpass.app',
        tag_id: 'GP-8888-Z06',
        phone: '309-335-8324',
        bio: 'Active GridPass pilot member.',
        location: 'Round Lake, IL',
        avatarIcon: 'user',
        views: 42,
        is_supporter: true
      });
      setProfileName('PJ LOSEY');
      setProfilePhone('309-335-8324');
      setProfileLocation('Round Lake, IL');
      setProfileBio('Active GridPass pilot member.');
      setProfileAvatar('user');
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    
    // Check and seed once if user does not exist
    async function verifyAndSeedUser() {
      if (!user) return;
      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const defaultName = (user.email || 'driver').split('@')[0].toUpperCase();
          const defaultProfile = {
            displayName: user.displayName || defaultName,
            email: user.email,
            tag_id: `GP-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
            phone: user.phoneNumber || '',
            bio: 'Active GridPass pilot member.',
            location: 'United States',
            avatarIcon: 'user',
            views: 0,
            created_at: serverTimestamp()
          };
          await setDoc(userDocRef, defaultProfile);
          await logEvent(
            'success',
            'system',
            `Auto-seeded new Firestore driver profile record for ${user.email}`,
            { uid: user.uid, defaultProfile }
          );
        }
      } catch (err) {
        console.error("Auto-seeding error:", err);
      }
    }

    verifyAndSeedUser();

    // Listen live
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        // Sync editor states
        setProfileName(data.displayName || '');
        setProfilePhone(data.phone || '');
        setProfileLocation(data.location || '');
        setProfileBio(data.bio || '');
        setProfileAvatar(data.avatarIcon || 'user');
        setProfilePhotoUrl(data.photoUrl || '');
        setProfileResumeUrl(data.resumeUrl || '');
        setSocWebsite(data.socials?.website || '');
        setSocTwitter(data.socials?.twitter || '');
        setSocInstagram(data.socials?.instagram || '');
        setSocLinkedin(data.socials?.linkedin || '');
        setSocYoutube(data.socials?.youtube || '');
        setSocFacebook(data.socials?.facebook || '');
        setProfileSkills(data.skills || []);
        setProfileAchievements(data.achievements || []);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Firestore Vehicles Real-time listener
  useEffect(() => {
    if (!user) return;

    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
      setVehicles((prev) => {
        if (prev.length === 0) {
          return [
            {
              id: 'gridpass-demo-vehicle',
              year: 2026,
              make: 'Chevrolet',
              model: 'Corvette Z06 (C8)',
              engine: '5.5L LT6 V8',
              power: '670 HP',
              transmission: '8-speed Automatic',
              mods: ['AP Racing Brakes', 'Akrapovič Slip-On Exhaust', 'Michelin Pilot Sport Cup 2 R'],
              tag_id: 'GP-8888-Z06',
              owner_id: user.uid,
              isPremium: true
            }
          ];
        }
        return prev;
      });
      setLoadingDb(false);
      return;
    }

    const q = query(collection(db, 'vehicles'), where('owner_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVehicles(list);
      setLoadingDb(false);
    }, (err) => {
      console.error("Vehicles loading error:", err);
      setLoadingDb(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to scans matching user tags
  useEffect(() => {
    if (!profile) return;
    
    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
      setTagScans([
        {
          id: 'scan-1',
          tag_id: 'GP-8888-Z06',
          tagId: 'GP-8888-Z06',
          scannedAt: '2026-05-22T20:15:30Z',
          userAgent: 'Mozilla/5.0...',
          location: { lat: 42.3601, lng: -71.0589 }
        }
      ]);
      return;
    }

    const userTag = profile.tag_id;
    const vehicleTags = vehicles.map(v => v.tag_id).filter(Boolean);
    const tagsToQuery = [userTag, ...vehicleTags].filter(Boolean);

    if (tagsToQuery.length === 0) {
      Promise.resolve().then(() => {
        setTagScans((prev) => prev.length === 0 ? prev : []);
      });
      return;
    }

    // Query scan events
    const q = query(collection(db, 'tag_scans'), where('tagId', 'in', tagsToQuery));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as DashboardTagScan);
      // Sort by scan time descending
      setTagScans(list.sort((a, b) => new Date(b.scannedAt || 0).getTime() - new Date(a.scannedAt || 0).getTime()));
    }, (err) => {
      console.warn("Telemetry scans fetch error:", err);
    });

    return () => unsubscribe();
  }, [profile, vehicles]);

  // Helper to add skill
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const newSkill = {
      id: `skill_${Date.now()}`,
      name: newSkillName.trim(),
      rating: newSkillRating,
      endorsements: 0
    };
    setProfileSkills([...profileSkills, newSkill]);
    setNewSkillName('');
  };

  // Helper to remove skill
  const handleRemoveSkill = (id: string) => {
    setProfileSkills(profileSkills.filter(s => s.id !== id));
  };

  // Helper to add achievement
  const handleAddAchievement = () => {
    if (!newAchTitle.trim() || !newAchYear.trim()) return;
    const newAch = {
      id: `ach_${Date.now()}`,
      year: newAchYear.trim(),
      title: newAchTitle.trim(),
      type: newAchType
    };
    setProfileAchievements([...profileAchievements, newAch]);
    setNewAchTitle('');
    setNewAchYear('');
  };

  // Helper to remove achievement
  const handleRemoveAchievement = (id: string) => {
    setProfileAchievements(profileAchievements.filter(a => a.id !== id));
  };

  // Save profile modifications
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || updatingProfile) return;
    setUpdatingProfile(true);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: profileName,
        phone: profilePhone,
        location: profileLocation,
        bio: profileBio,
        avatarIcon: profileAvatar,
        photoUrl: profilePhotoUrl,
        socials: {
          website: socWebsite,
          twitter: socTwitter,
          instagram: socInstagram,
          linkedin: socLinkedin,
          youtube: socYoutube,
          facebook: socFacebook
        },
        skills: profileSkills,
        achievements: profileAchievements,
        resumeUrl: profileResumeUrl
      });

      await logEvent(
        'success',
        'system',
        `Driver profile updated for ${user.email}: name="${profileName}"`,
        { uid: user.uid, email: user.email }
      );

      setShowProfileModal(false);
      setUpdatingProfile(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Profile save error:", err);
      alert("Failed to save profile: " + errMsg);
      setUpdatingProfile(false);
    }
  };

  // Open vehicle registration/editor modal
  const openVehicleModal = (veh: DashboardVehicle | null = null) => {
    setSelectedVehicle(veh);
    if (veh) {
      setVYear(veh.year?.toString() || '');
      setVMake(veh.make || '');
      setVModel(veh.model || '');
      setVEngine(veh.engine || '');
      setVPower(veh.power || '');
      setVTransmission(veh.transmission || '7-speed PDK');
      setVModsString(veh.mods ? veh.mods.join(', ') : '');
      setVTagId(veh.tag_id || '');
      setVPhotoUrl(veh.photoUrl || '');
    } else {
      setVYear('');
      setVMake('');
      setVModel('');
      setVEngine('');
      setVPower('');
      setVTransmission('7-speed PDK');
      setVModsString('');
      setVPhotoUrl('');
      // Generate a mock tag ID or let them fill preprinted GP codes
      setVTagId(`GP-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`);
    }
    setShowVehicleModal(true);
  };

  // Save/Register vehicle asset
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || savingVehicle) return;
    setSavingVehicle(true);

    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
      const modsArray = vModsString
        .split(',')
        .map(m => m.trim())
        .filter(Boolean);

      const vehicleData: DashboardVehicle = {
        id: selectedVehicle?.id || `vehicle-mock-${Date.now()}`,
        year: parseInt(vYear) || new Date().getFullYear(),
        make: vMake,
        model: vModel,
        engine: vEngine || 'Stock Specs',
        power: vPower || 'Factory HP',
        transmission: vTransmission,
        mods: modsArray,
        tag_id: vTagId.trim(),
        owner_id: user.uid,
        owner_email: user.email,
        isPremium: selectedVehicle ? selectedVehicle.isPremium : false,
        views: selectedVehicle ? selectedVehicle.views : 0,
        photoUrl: vPhotoUrl
      };

      setVehicles((prev) => {
        if (selectedVehicle) {
          return prev.map(v => v.id === selectedVehicle.id ? vehicleData : v);
        } else {
          return [...prev, vehicleData];
        }
      });

      setShowVehicleModal(false);
      setSavingVehicle(false);
      return;
    }

    try {
      const modsArray = vModsString
        .split(',')
        .map(m => m.trim())
        .filter(Boolean);

      const vehicleData: DashboardVehicle = {
        year: parseInt(vYear) || new Date().getFullYear(),
        make: vMake,
        model: vModel,
        engine: vEngine || 'Stock Specs',
        power: vPower || 'Factory HP',
        transmission: vTransmission,
        mods: modsArray,
        tag_id: vTagId.trim(),
        owner_id: user.uid,
        owner_email: user.email,
        updated_at: serverTimestamp(),
        photoUrl: vPhotoUrl
      };

      if (selectedVehicle) {
        // Edit existing
        if (!selectedVehicle.id) throw new Error('Vehicle ID is missing.');
        const docRef = doc(db, 'vehicles', selectedVehicle.id!);
        await updateDoc(docRef, vehicleData as unknown as Record<string, unknown>);
        await logEvent(
          'success',
          'system',
          `Vehicle specification record updated: [${selectedVehicle.id}] ${vYear} ${vMake} ${vModel}`,
          { vehicleId: selectedVehicle.id, userEmail: user.email }
        );
      } else {
        // Register new
        vehicleData.created_at = serverTimestamp();
        vehicleData.isPremium = false;
        vehicleData.views = 0;
        const colRef = collection(db, 'vehicles');
        const newDoc = await addDoc(colRef, vehicleData);
        await logEvent(
          'success',
          'system',
          `Registered new vehicle passport asset: [${newDoc.id}] ${vYear} ${vMake} ${vModel}`,
          { vehicleId: newDoc.id, userEmail: user.email }
        );
      }

      setShowVehicleModal(false);
      setSavingVehicle(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Vehicle save error:", err);
      alert("Failed to save vehicle: " + errMsg);
      setSavingVehicle(false);
    }
  };

  // Delete vehicle asset
  const handleDeleteVehicle = async (vehicleId: string, vehicleName: string) => {
    if (!confirm(`Are you absolutely sure you want to retire and remove ${vehicleName} from your digital garage?`)) return;

    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId));
      await logEvent(
        'warn',
        'system',
        `Vehicle retired and deleted from digital garage: [${vehicleId}] ${vehicleName}`,
        { vehicleId, userEmail: user!.email }
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to delete vehicle:", err);
      alert("Failed to delete vehicle: " + errMsg);
    }
  };

  // Transfer vehicle ownership cleanly
  const handleTransferVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transferVehicle || transferring) return;
    setTransferring(true);
    setTransferError(null);
    setTransferSuccess(false);

    try {
      const vehicleId = transferVehicle.id;
      if (!vehicleId) throw new Error('Vehicle ID is missing.');

      const cleanEmail = transferEmail.trim().toLowerCase();
      if (!cleanEmail) {
        setTransferError('Please enter a valid email address.');
        setTransferring(false);
        return;
      }

      let recipientUid = '';
      let recipientEmail = '';

      if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
        recipientUid = 'mock-recipient-uid-123';
        recipientEmail = cleanEmail;
      } else {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', cleanEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setTransferError('Recipient email is not registered with Gridpass.');
          setTransferring(false);
          return;
        }

        const recipientDoc = querySnapshot.docs[0];
        recipientUid = recipientDoc.id;
        recipientEmail = recipientDoc.data().email || cleanEmail;
      }

      const prevOwnerId = user.uid;
      const prevOwnerEmail = user.email || 'unknown@gridpass.app';

      if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
        setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      } else {
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        await updateDoc(vehicleRef, {
          owner_id: recipientUid,
          owner_email: recipientEmail,
          updated_at: serverTimestamp()
        });

        const transfersRef = collection(db, 'ownership_transfers');
        const todayStr = new Date().toISOString().split('T')[0];
        await addDoc(transfersRef, {
          vehicle_id: vehicleId,
          previous_owner_id: prevOwnerId,
          previous_owner_email: prevOwnerEmail,
          new_owner_id: recipientUid,
          new_owner_email: recipientEmail,
          timestamp: serverTimestamp(),
          date: todayStr
        });

        await logEvent(
          'info',
          'system',
          `Transferred vehicle ownership: [${vehicleId}] to ${recipientEmail}`,
          { vehicleId, fromUid: prevOwnerId, toUid: recipientUid }
        );
      }

      setTransferSuccess(true);
      setTimeout(() => {
        setShowTransferModal(false);
      }, 2000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Transfer vehicle error:', err);
      setTransferError(errMsg);
    } finally {
      setTransferring(false);
    }
  };

  // Open Sign Printer customizer
  const openPrintModal = (title: string, tagId: string, type: 'vehicle' | 'profile') => {
    const siteUrl = window.location.origin;
    const redirectUrl = `${siteUrl}/qr/${tagId}`;
    setPrintAsset({ title, url: redirectUrl, type });
    setSignTitle(title.toUpperCase());
    
    // Set theme pre-selections based on category
    if (type === 'vehicle') {
      setSignTheme('red');
      setSignSubtext('Scan this sign to inspect verified mechanical telemetry logs, dyno specifications, signed waivers, and permanent service records.');
    } else {
      setSignTheme('cyan');
      setSignSubtext('Scan this holographic pass to synchronize safety check-ins, event entry tickets, signed waivers, and digital driver keys.');
    }
    
    setSignFormat('windshield');
    setShowPrintModal(true);
  };

  // Canvas drawing high-DPI sign compilation engine
  const handleDownloadSign = async () => {
    if (!printAsset || !hiddenCanvasRef.current || generatingPrint) return;
    setGeneratingPrint(true);

    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setGeneratingPrint(false);
      return;
    }

    let primaryColor = '#06b6d4'; // Cyan
    let labelText = 'UNIVERSAL SECURITY DRIVER KEY';

    if (signTheme === 'red') {
      primaryColor = '#ef4444'; // Red
      labelText = 'VERIFIED DRIVER TELEMETRY PASSPORT';
    } else if (signTheme === 'emerald') {
      primaryColor = '#10b981'; // Emerald
      labelText = 'MUD MX CO-BRANDED ACCESS PORTAL';
    }

    // Professional SVG Export Option
    if (signFormat === 'svg_export') {
      const svgString = `<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="800" fill="#060608"/>
        <rect x="25" y="25" width="750" height="750" rx="35" fill="none" stroke="${primaryColor}" stroke-width="10"/>
        <text x="400" y="90" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="34" text-anchor="middle" letter-spacing="4">GRIDPASS</text>
        <text x="400" y="130" fill="${primaryColor}" font-family="monospace" font-weight="bold" font-size="14" text-anchor="middle">${labelText}</text>
        <text x="400" y="195" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="26" text-anchor="middle">${signTitle}</text>
        <image x="175" y="240" width="450" height="450" href="https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&amp;color=${primaryColor.substring(1)}&amp;bgcolor=060608&amp;data=${encodeURIComponent(printAsset.url)}"/>
        <text x="400" y="745" fill="rgba(255,255,255,0.4)" font-family="sans-serif" font-size="14" text-anchor="middle">GRIDPASS.APP / PASSPORT</text>
      </svg>`;
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `gridpass_vector_${signTitle.toLowerCase().replace(/\s+/g, '_')}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setGeneratingPrint(false);
      return;
    }

    // Set Canvas Dimensions based on Layout Format Selection
    if (signFormat === 'sticker_3x3') {
      canvas.width = 1800;
      canvas.height = 1800;
    } else if (signFormat === 'keytag') {
      canvas.width = 1800;
      canvas.height = 900;
    } else {
      canvas.width = 2400;
      canvas.height = 3000;
    }

    try {
      if (signFormat === 'sticker_3x3') {
        // Draw 3x3 Decal Avery sticker layout
        ctx.fillStyle = '#060608';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 15;
        ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('G R I D P A S S', canvas.width / 2, 170);

        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 30px monospace';
        ctx.fillText('SCAN VEHICLE PASSPORT', canvas.width / 2, 240);

        const qrSize = 1050;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 320;

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&color=${primaryColor.substring(1)}&bgcolor=060608&data=${encodeURIComponent(printAsset.url)}`;
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          qrImg.onload = () => {
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            const logoW = qrSize * 0.18;
            const logoH = logoW * (100 / 120);
            const logoX = qrX + (qrSize - logoW) / 2;
            const logoY = qrY + (qrSize - logoH) / 2;
            ctx.fillStyle = '#060608';
            ctx.fillRect(logoX - 12, logoY - 12, logoW + 24, logoH + 24);
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 8;
            ctx.strokeRect(logoX - 12, logoY - 12, logoW + 24, logoH + 24);
            resolve();
          };
          qrImg.onerror = () => reject(new Error("QR image load failed."));
          qrImg.src = qrUrl;
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px sans-serif';
        ctx.fillText(signTitle, canvas.width / 2, 1460);

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'monospace 28px';
        ctx.fillText('GRIDPASS.APP', canvas.width / 2, 1590);

      } else if (signFormat === 'keytag') {
        // Draw 2x1 Key-Tag Keychain Card layout
        ctx.fillStyle = '#060608';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 15;
        ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

        // Hole punch guide
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        ctx.arc(200, canvas.height / 2, 45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 65px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('G R I D P A S S', 380, 200);

        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 30px monospace';
        ctx.fillText('VEHICLE ACCESS KEY', 380, 275);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 45px sans-serif';
        ctx.fillText(signTitle, 380, 420);

        const qrSize = 550;
        const qrX = 1150;
        const qrY = 175;

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&color=${primaryColor.substring(1)}&bgcolor=060608&data=${encodeURIComponent(printAsset.url)}`;
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          qrImg.onload = () => {
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            const logoW = qrSize * 0.18;
            const logoH = logoW * (100 / 120);
            const logoX = qrX + (qrSize - logoW) / 2;
            const logoY = qrY + (qrSize - logoH) / 2;
            ctx.fillStyle = '#060608';
            ctx.fillRect(logoX - 8, logoY - 8, logoW + 16, logoH + 16);
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 5;
            ctx.strokeRect(logoX - 8, logoY - 8, logoW + 16, logoH + 16);
            resolve();
          };
          qrImg.onerror = () => reject(new Error("QR image load failed."));
          qrImg.src = qrUrl;
        });

        // Write tag code reference
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(printAsset.title.split(' ')[0], qrX + qrSize/2, 800);

      } else {
        // Draw standard Car Show Poster/Windshield Flyer
        ctx.fillStyle = '#060608';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle grids
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 2;
        const gridSize = 100;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Outer borders
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.roundRect(60, 60, canvas.width - 120, canvas.height - 120, 80);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(90, 90, canvas.width - 180, canvas.height - 180, 60);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 110px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('G R I D P A S S', canvas.width / 2, 200);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(150, 360, canvas.width - 300, 100);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(150, 360, canvas.width - 300, 100);

        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 36px monospace';
        ctx.fillText(labelText, canvas.width / 2, 395);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 90px sans-serif';
        ctx.fillText(signTitle, canvas.width / 2, 530);

        const qrCodeSize = signFormat === 'poster' ? 1400 : 1000;
        const qrX = (canvas.width - qrCodeSize) / 2;
        const qrY = signFormat === 'poster' ? 620 : 750;

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&color=${primaryColor.substring(1)}&bgcolor=060608&data=${encodeURIComponent(printAsset.url)}`;
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          qrImg.onload = () => {
            ctx.fillStyle = '#060608';
            ctx.fillRect(qrX - 30, qrY - 30, qrCodeSize + 60, qrCodeSize + 60);
            
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 12;
            const bSize = 120;
            // Top Left
            ctx.beginPath(); ctx.moveTo(qrX - 45, qrY - 45 + bSize); ctx.lineTo(qrX - 45, qrY - 45); ctx.lineTo(qrX - 45 + bSize, qrY - 45); ctx.stroke();
            // Top Right
            ctx.beginPath(); ctx.moveTo(qrX + qrCodeSize + 45 - bSize, qrY - 45); ctx.lineTo(qrX + qrCodeSize + 45, qrY - 45); ctx.lineTo(qrX + qrCodeSize + 45, qrY - 45 + bSize); ctx.stroke();
            // Bottom Left
            ctx.beginPath(); ctx.moveTo(qrX - 45, qrY + qrCodeSize + 45 - bSize); ctx.lineTo(qrX - 45, qrY + qrCodeSize + 45); ctx.lineTo(qrX - 45 + bSize, qrY + qrCodeSize + 45); ctx.stroke();
            // Bottom Right
            ctx.beginPath(); ctx.moveTo(qrX + qrCodeSize + 45 - bSize, qrY + qrCodeSize + 45); ctx.lineTo(qrX + qrCodeSize + 45, qrY + qrCodeSize + 45); ctx.lineTo(qrX + qrCodeSize + 45, qrY + qrCodeSize + 45 - bSize); ctx.stroke();

            ctx.drawImage(qrImg, qrX, qrY, qrCodeSize, qrCodeSize);

            const logoW = qrCodeSize * 0.18;
            const logoH = logoW * (100 / 120);
            const logoX = qrX + (qrCodeSize - logoW) / 2;
            const logoY = qrY + (qrCodeSize - logoH) / 2;
            
            ctx.fillStyle = '#060608';
            ctx.fillRect(logoX - 12, logoY - 12, logoW + 24, logoH + 24);
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 10;
            ctx.strokeRect(logoX - 12, logoY - 12, logoW + 24, logoH + 24);

            // Draw center logo mountain peaks
            ctx.beginPath();
            const scale = logoW / 120;
            ctx.moveTo(logoX + 10 * scale, logoY + 70 * scale);
            ctx.lineTo(logoX + 42 * scale, logoY + 22 * scale);
            ctx.lineTo(logoX + 65 * scale, logoY + 52 * scale);
            ctx.lineTo(logoX + 88 * scale, logoY + 28 * scale);
            ctx.lineTo(logoX + 110 * scale, logoY + 70 * scale);
            ctx.closePath();
            
            ctx.fillStyle = '#f4f4f7';
            ctx.fill();
            ctx.strokeStyle = '#f4f4f7';
            ctx.lineWidth = 5 * scale;
            ctx.stroke();

            // Racetrack lines
            ctx.beginPath();
            ctx.moveTo(logoX + 18 * scale, logoY + 86 * scale);
            ctx.bezierCurveTo(logoX + 48 * scale, logoY + 86 * scale, logoX + 56 * scale, logoY + 59 * scale, logoX + 96 * scale, logoY + 59 * scale);
            ctx.strokeStyle = '#262626';
            ctx.lineWidth = 15 * scale;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(logoX + 18 * scale, logoY + 90 * scale);
            ctx.bezierCurveTo(logoX + 48 * scale, logoY + 90 * scale, logoX + 56 * scale, logoY + 63 * scale, logoX + 96 * scale, logoY + 63 * scale);
            ctx.strokeStyle = '#f4f4f7';
            ctx.lineWidth = 5.5 * scale;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(logoX + 18 * scale, logoY + 90 * scale);
            ctx.bezierCurveTo(logoX + 48 * scale, logoY + 90 * scale, logoX + 56 * scale, logoY + 63 * scale, logoX + 96 * scale, logoY + 63 * scale);
            ctx.strokeStyle = '#bd2925';
            ctx.lineWidth = 5.5 * scale;
            ctx.lineCap = 'round';
            ctx.setLineDash([9 * scale, 9 * scale]);
            ctx.stroke();
            ctx.setLineDash([]);
            resolve();
          };
          qrImg.onerror = () => reject(new Error("QR image load failed."));
          qrImg.src = qrUrl;
        });

        // Subtext wrapping
        ctx.fillStyle = '#e5e7eb';
        ctx.font = 'medium 42px sans-serif';
        const maxTextWidth = canvas.width - 400;
        const words = signSubtext.split(' ');
        let line = '';
        let textY = signFormat === 'poster' ? 2200 : 1900;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTextWidth && n > 0) {
            ctx.fillText(line, canvas.width / 2, textY);
            line = words[n] + ' ';
            textY += 65;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, textY);

        // Footer branding elements
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(200, 2480, canvas.width - 400, 4);

        ctx.fillStyle = primaryColor;
        ctx.font = '900 50px sans-serif';
        ctx.fillText('S C A N  M E', canvas.width / 2, 2540);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 32px monospace';
        ctx.fillText('POWERED BY THE GRIDPASS UNIVERSAL KEYWAY NETWORK', canvas.width / 2, 2630);
      }

      // Download trigger
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `gridpass_sign_${signTitle.toLowerCase().replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();

      logEvent(
        'success',
        'system',
        `High-DPI QR signage generated format [${signFormat}] for: ${signTitle}`,
        { targetTitle: signTitle, targetUrl: printAsset.url }
      ).catch(err => console.error("Telemetry failed:", err));

      setGeneratingPrint(false);
      setShowPrintModal(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Sign rendering error:", err);
      alert("Failed to render printable sign: " + errMsg);
      setGeneratingPrint(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060608] space-y-4">
        <Loader2 className="w-8 h-8 text-[#bd2925] animate-spin" />
        <p className="text-neutral-500 text-sm font-semibold uppercase tracking-wider font-mono">Synchronizing Driver Keyway...</p>
      </div>
    );
  }

  const pName = profile?.displayName || 'MEMBER';
  const pLocation = profile?.location || 'United States';
  const pBio = profile?.bio || 'Active GridPass pilot member.';
  const pTagId = profile?.tag_id || null;

  return (
    <main className="min-h-screen bg-[#060608] text-white relative overflow-hidden flex flex-col justify-between">
      <div className="mesh-glow" />
      <Navbar />

      {/* Hidden offscreen canvas for high-DPI printable sign generation */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative z-10 w-full flex-grow space-y-6">
        
        {/* Interlock Alerts */}
        {isOwner && pendingBlockers > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse shadow-lg shadow-yellow-500/2">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm md:text-base font-black text-yellow-400 tracking-tight uppercase">
                  Decisions Awaiting Your Action
                </h3>
                <p className="text-neutral-300 text-xs md:text-sm">
                  The automated operations system has detected **{pendingBlockers} active blocker{pendingBlockers > 1 ? 's' : ''}** on structural architecture. 
                  Provide decisions to unblock tasks.
                </p>
              </div>
            </div>
            
            <Link 
              href="/interlock"
              className="py-3 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-md cursor-pointer"
            >
              Resolve System Blockers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Dashboard Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Universal Driver Key & Pass */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Profile Panel */}
            <div className="glass-card p-6 rounded-3xl space-y-4 text-center relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setShowProfileModal(true)}
                  className="text-neutral-500 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
                  title="Edit Profile Details"
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>
              </div>

              <div id="user-avatar-container" className={`w-20 h-20 bg-neutral-900 rounded-full overflow-hidden flex items-center justify-center mx-auto text-neutral-500 shadow-inner relative ${profile?.is_supporter ? 'p-1 bg-gradient-to-tr from-[#ffe066] via-[#f59f00] to-[#ffe066] shadow-lg shadow-yellow-500/20 border-0' : 'border border-neutral-800'}`}>
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-neutral-900">
                  {profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt={pName} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      {profile?.avatarIcon === 'wrench' && <Wrench className="w-10 h-10 text-cyan-400 animate-pulse" />}
                      {profile?.avatarIcon === 'gauge' && <Gauge className="w-10 h-10 text-emerald-400 animate-pulse" />}
                      {profile?.avatarIcon === 'zap' && <Zap className="w-10 h-10 text-yellow-400 animate-pulse" />}
                      {profile?.avatarIcon === 'car' && <Car className="w-10 h-10 text-red-400 animate-pulse" />}
                      {(!profile?.avatarIcon || profile?.avatarIcon === 'user') && <UserIcon className="w-10 h-10 text-neutral-400" />}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-white uppercase">{pName}</h2>
                <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-500 font-bold uppercase tracking-wider font-mono">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>{pLocation}</span>
                </div>
                <p className="text-neutral-400 text-xs py-1.5 px-3 bg-neutral-950/40 rounded-xl border border-neutral-900/60 leading-relaxed italic max-w-xs mx-auto mt-2">
                  &quot;{pBio}&quot;
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#bd2925]/10 border border-[#bd2925]/20 text-xs font-bold text-[#bd2925]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Universal Key active
              </div>
            </div>

            {/* Simulated Holographic Pass */}
            {pTagId && (
              <div className="glass-card p-6 rounded-3xl space-y-6 border-[#bd2925]/10 relative overflow-hidden group">
                <div className="absolute -right-16 -top-16 w-32 h-32 bg-[#bd2925]/5 blur-3xl rounded-full" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-400 tracking-wider">Universal Gate Pass</span>
                  <span className="text-[10px] font-mono text-rose-500 uppercase tracking-widest bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded">
                    Holographic
                  </span>
                </div>

                {/* Glowing QR wrapper */}
                <div className="relative w-44 h-44 mx-auto bg-neutral-950/85 border border-neutral-900 rounded-2xl p-4 flex items-center justify-center group hover:border-cyan-500/40 transition-all shadow-inner">
                  <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                  
                  {/* Real QR code container with Logo overlay */}
                  <div className="w-36 h-36 relative flex items-center justify-center p-1.5 overflow-hidden">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=22d3ee&bgcolor=060608&data=${encodeURIComponent(`${window.location.origin}/qr/${pTagId}`)}`} 
                      alt="Universal QR" 
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Logo Overlay */}
                    <div className="absolute w-7 h-7 bg-[#060608] border border-neutral-800 rounded-lg flex items-center justify-center p-0.5 shadow-md">
                      <Logo className="w-5 h-5 shrink-0" textClassName="hidden" />
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-[11px] font-mono text-neutral-500 uppercase">ID: {pTagId}</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Scan this universal tag at track access check-ins to synchronize tickets, signed waivers, and digital vehicle logs.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => openPrintModal(pName, pTagId || '', 'profile')}
                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/10"
                  >
                    <Printer className="w-4 h-4" /> Print QR Sign
                  </button>
                  <Link 
                    href={`/u/${user?.uid || ''}`}
                    className="py-3 px-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs transition-all flex items-center justify-center"
                    title="View Public Profile Page"
                  >
                    <ExternalLink className="w-4.5 h-4.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Back the Cause Card */}
            <div className="glass-card p-6 rounded-3xl space-y-4 border-yellow-500/10 bg-neutral-950/20 relative overflow-hidden group">
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full animate-pulse" />
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-yellow-400 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Back the Cause
                </span>
                {profile?.is_supporter && (
                  <span className="text-[9px] font-mono text-yellow-400 uppercase tracking-widest bg-yellow-950/20 border border-yellow-900/30 px-2 py-0.5 rounded">
                    Supporter Active
                  </span>
                )}
              </div>

              {profile?.is_supporter ? (
                <div className="space-y-2 text-center p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                  <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                    Thank you for backing Gridpass! Your profile has been decorated with the premium gold-ring border and supporter badges.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Help get Gridpass off the ground. Support the project to unlock a permanent gold avatar ring and original backer badge on your profiles.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'supporter_5', amount: '$5', label: 'Bronze' },
                      { id: 'supporter_20', amount: '$20', label: 'Gold' },
                      { id: 'supporter_50', amount: '$50', label: 'Legend' }
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        onClick={async () => {
                          if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
                            setProfile((prev: any) => ({ ...prev, is_supporter: true }));
                            return;
                          }
                          if (!user) return;
                          try {
                            const userDocRef = doc(db, 'users', user.uid);
                            await updateDoc(userDocRef, { is_supporter: true });
                          } catch (err) {
                            console.error("Backing failed:", err);
                          }
                        }}
                        className="py-2.5 px-2 bg-neutral-900 hover:bg-yellow-500/10 border border-neutral-800 hover:border-yellow-500/30 text-white rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                      >
                        <span className="font-mono text-yellow-400 font-extrabold">{tier.amount}</span>
                        <span className="text-[9px] text-neutral-500 uppercase font-medium">{tier.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Columns: Garage / Scans Tabs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tab selector */}
            <div className="flex border-b border-neutral-900 gap-6">
              {[
                { id: 'garage', label: 'Digital Garage', icon: <Car className="w-4 h-4" /> },
                { id: 'scans', label: 'Access Scans', icon: <Clock className="w-4 h-4" /> },
                { id: 'payouts', label: 'Fast Payouts', icon: <DollarSign className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'garage' | 'scans' | 'payouts')}
                  className={`py-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all relative cursor-pointer ${
                    activeTab === tab.id 
                      ? 'border-[#bd2925] text-[#bd2925] font-extrabold' 
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Digital Garage */}
            {activeTab === 'garage' && (
              <div className="space-y-6">
                
                {loadingDb ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-[#bd2925] animate-spin mx-auto mb-2" />
                    <p className="text-neutral-500 text-xs font-bold uppercase font-mono">Syncing Garage Register...</p>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="glass-card p-12 text-center space-y-4 border-neutral-900">
                    <Car className="w-12 h-12 text-neutral-700 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-neutral-300">No vehicles registered yet</h4>
                      <p className="text-neutral-500 text-xs max-w-xs mx-auto">
                        Bind your first physical Gridpass holographic tag or create a digital passport for your track rig.
                      </p>
                    </div>
                    <button 
                      onClick={() => openVehicleModal()}
                      className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Your First Vehicle
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {vehicles.map((v) => (
                      <div 
                        key={v.id}
                        className="glass-card p-6 rounded-3xl border-emerald-500/10 hover:border-emerald-500/20 transition-all relative overflow-hidden group"
                      >
                        <div className="absolute right-0 top-0 w-44 h-44 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />
                        
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          
                          {/* Vehicle Image */}
                          {v.photoUrl && (
                            <div className="w-full md:w-48 h-36 md:h-32 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950/80 shrink-0 relative shadow-inner">
                              <img src={v.photoUrl} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          )}
                          
                          {/* Specifications */}
                          <div className="space-y-4 flex-grow">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`px-2.5 py-1 text-[10px] font-black tracking-widest uppercase rounded border ${
                                v.isPremium 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              }`}>
                                {v.isPremium ? 'Premium Passport' : 'Active Passport'}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-500 uppercase">Tag: {v.tag_id || '---'}</span>
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                                {v.year} {v.make} {v.model}
                              </h3>
                              <p className="text-neutral-400 text-xs font-semibold">Engine Specs: {v.engine || 'Factory Stock'}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                              <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-900">
                                <div className="text-[10px] font-bold text-neutral-500 uppercase">Power Output</div>
                                <div className="text-sm font-extrabold text-neutral-200 mt-0.5">{v.power || 'Factory HP'}</div>
                              </div>
                              <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-900">
                                <div className="text-[10px] font-bold text-neutral-500 uppercase">Transmission</div>
                                <div className="text-sm font-extrabold text-neutral-200 mt-0.5">{v.transmission || 'Stock Gearbox'}</div>
                              </div>
                              <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-900 col-span-2 md:col-span-1">
                                <div className="text-[10px] font-bold text-neutral-500 uppercase">Waiver Signed</div>
                                <div className="text-xs font-black text-emerald-400 flex items-center gap-1 mt-1">
                                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
                                </div>
                              </div>
                            </div>

                            {/* Modifications list */}
                            {v.mods && v.mods.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">Active Modifications</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {v.mods.map((mod: string, idx: number) => (
                                    <span key={idx} className="text-[10px] bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded-md text-neutral-300 font-medium">
                                      {mod}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quick controls section */}
                          <div className="md:w-44 shrink-0 flex flex-col justify-between items-center bg-neutral-950/50 p-4 rounded-2xl border border-neutral-900 text-center gap-4">
                            <div className="w-20 h-20 bg-neutral-950/85 border border-neutral-850 rounded-xl flex items-center justify-center relative p-1.5 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=34d399&bgcolor=060608&data=${encodeURIComponent(`${window.location.origin}/qr/${v.tag_id || ''}`)}`} 
                                alt="Vehicle QR" 
                                className="w-full h-full object-contain rounded-lg"
                              />
                              {/* Logo Overlay */}
                              <div className="absolute w-5.5 h-5.5 bg-[#060608] border border-neutral-850 rounded flex items-center justify-center p-0.5 shadow-md">
                                <Logo className="w-3.5 h-3.5 shrink-0" textClassName="hidden" />
                              </div>
                            </div>

                            {/* Controls buttons list */}
                            <div className="w-full space-y-2 text-xs font-bold">
                              <button 
                                onClick={() => openPrintModal(`${v.year} ${v.make} ${v.model}`, v.tag_id || '', 'vehicle')}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print Sign
                              </button>

                              <button 
                                onClick={() => {
                                  setTransferVehicle(v);
                                  setTransferEmail('');
                                  setTransferError(null);
                                  setTransferSuccess(false);
                                  setTransferring(false);
                                  setShowTransferModal(true);
                                }}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Identity
                              </button>
                              
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => openVehicleModal(v)}
                                  className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  title="Edit Vehicle Specs"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteVehicle(v.id || '', `${v.year} ${v.make} ${v.model}`)}
                                  className="py-2 px-2.5 bg-neutral-900 hover:bg-red-650/10 border border-neutral-800 hover:border-red-500/20 text-neutral-500 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                                  title="Retire/Remove Vehicle"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <Link 
                              href={`/v/${v.id}`}
                              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                            >
                              View Passport Details <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>

                        </div>
                      </div>
                    ))}

                    {/* Add new vehicle box */}
                    <div 
                      onClick={() => openVehicleModal()}
                      className="border border-dashed border-neutral-900 hover:border-neutral-800 rounded-3xl p-8 text-center space-y-3 transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 bg-neutral-900/40 border border-neutral-850 rounded-xl flex items-center justify-center mx-auto text-neutral-500 group-hover:text-white transition-colors">
                        <Plus className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-neutral-300 group-hover:text-white transition-colors">Register Another Vehicle</h4>
                        <p className="text-neutral-500 text-xs max-w-xs mx-auto font-medium">
                          Bind a new physical Gridpass holographic tag to create its digital passport.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Access Scans */}
            {activeTab === 'scans' && (
              <div className="glass-card p-6 rounded-3xl space-y-4 border-neutral-900">
                <div className="flex items-center justify-between text-sm font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-900 pb-3">
                  <span>Access check-in Telemetry Logs</span>
                  <span className="text-xs text-neutral-500 font-mono">Total Scans: {tagScans.length}</span>
                </div>

                {tagScans.length === 0 ? (
                  <div className="py-8 text-center text-neutral-500 text-xs font-semibold font-mono">
                    No scan history registered yet. Share your QR sign!
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-900">
                    {tagScans.map((scan) => {
                      // Format date
                      const dateStr = scan.scannedAt ? new Date(scan.scannedAt).toLocaleString() : 'Just now';
                      
                      // Match scan tag with vehicle names or profile
                      let label = 'Universal Driver Key';
                      if (scan.tagId === profile?.tag_id) {
                        label = 'Driver Keyway Profile';
                      } else {
                        const match = vehicles.find(v => v.tag_id === scan.tagId);
                        if (match) {
                          label = `${match.year} ${match.make} ${match.model}`;
                        }
                      }

                      return (
                        <div key={scan.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                              <h4 className="text-xs md:text-sm font-bold text-neutral-200">
                                {scan.location ? `Lat: ${scan.location.lat.toFixed(4)}, Lng: ${scan.location.lng.toFixed(4)}` : 'Gateway Entry Scan'}
                              </h4>
                            </div>
                            <p className="text-neutral-500 text-[10px] md:text-xs font-mono">
                              {dateStr} • Tag: {scan.tagId} • {label}
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-black uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded tracking-wide">
                              APPROVED
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Fast payouts */}
            {activeTab === 'payouts' && (
              <div className="glass-card p-6 rounded-3xl space-y-6 border-neutral-900">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Get Paid Trackside</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed font-semibold">
                    Link your bank account to receive fast, automatic trackside payouts when people scan your code to register for events or claim co-branded passes.
                  </p>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-900 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Payout Status</div>
                      <div className="text-sm font-extrabold text-neutral-300 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-ping" />
                        Details Required
                      </div>
                    </div>
                    
                    <button className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer">
                      Link Bank Account via Stripe
                    </button>
                  </div>
                  
                  <div className="border-t border-neutral-900 pt-4 flex justify-between text-xs text-neutral-400">
                    <span>Automatic splitting:</span>
                    <span className="font-mono font-bold text-white">You get 90% / Gridpass receives 10% processing fee</span>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 italic leading-relaxed">
                  * For custom payout arrangements, billing templates, or off-road club deals, please send us a note in the <Link href="/feedback" className="text-blue-500 hover:underline">Dispatch feedback console</Link>.
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL 1: Profile Details Editor */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020203]/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-lg p-6 rounded-[2rem] border-blue-500/10 space-y-6 relative overflow-y-auto max-h-[90vh]">
            <button 
               onClick={() => setShowProfileModal(false)}
               className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500 animate-spin-slow" /> Edit Driver Profile
              </h3>
              <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest font-mono">Save your track details</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Pilot / Driver Name</label>
                <input 
                  type="text" 
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-bold"
                  placeholder="e.g. PATRICK LOSEY"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Phone Contact</label>
                  <input 
                    type="tel" 
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-semibold"
                    placeholder="+1 (309) 335-8324"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Geographic Location</label>
                  <input 
                    type="text" 
                    value={profileLocation}
                    onChange={(e) => setProfileLocation(e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-semibold"
                    placeholder="Viola, IL"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Profile Photo</label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 glass-panel">
                  {/* Photo Preview */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-neutral-800 border-2 border-white/20 flex-shrink-0 flex items-center justify-center">
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-neutral-500" />
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-grow space-y-1.5">
                    <input 
                      type="file" 
                      ref={photoInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={() => photoInputRef.current?.click()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 active:bg-white/5 text-xs font-bold text-white rounded-xl transition duration-200 border border-white/10 flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 text-cyan-400" />
                          Upload Photo
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      PNG, JPG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Or Paste Image URL</label>
                  <input 
                    type="url" 
                    value={profilePhotoUrl}
                    onChange={(e) => setProfilePhotoUrl(e.target.value)}
                    className="glass-input w-full px-4 py-2 rounded-xl text-xs placeholder:text-neutral-700 font-semibold"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Resume / CV Document (Indeed PDF)</label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 glass-panel">
                  {/* Icon Indicator */}
                  <div className="relative w-16 h-16 rounded-xl bg-neutral-800 border-2 border-white/20 flex-shrink-0 flex items-center justify-center">
                    {profileResumeUrl ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">PDF LOADED</span>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">NO FILE</span>
                    )}
                    {uploadingResume && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-grow space-y-1.5">
                    <input 
                      type="file" 
                      ref={resumeInputRef}
                      onChange={handleResumeUpload}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingResume}
                      onClick={() => resumeInputRef.current?.click()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 active:bg-white/5 text-xs font-bold text-white rounded-xl transition duration-200 border border-white/10 flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingResume ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          Upload PDF Resume
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      PDF format from Indeed or other source. Max 10MB.
                    </p>
                  </div>
                </div>

                {profileResumeUrl && (
                  <div className="pt-1">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Resume Link URL</label>
                    <input 
                      type="url" 
                      value={profileResumeUrl}
                      onChange={(e) => setProfileResumeUrl(e.target.value)}
                      className="glass-input w-full px-4 py-2 rounded-xl text-xs placeholder:text-neutral-700 font-semibold"
                      placeholder="https://example.com/resume.pdf"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Pilot Bio Summary</label>
                <textarea 
                  rows={2}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-medium resize-none"
                  placeholder="Tell tracks and venues about your racing/driving history..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Default Avatar Icon</label>
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[
                    { id: 'user', label: 'Driver', icon: <UserIcon className="w-5 h-5 text-neutral-400" /> },
                    { id: 'wrench', label: 'Wrench', icon: <Wrench className="w-5 h-5 text-cyan-400" /> },
                    { id: 'gauge', label: 'Gauge', icon: <Gauge className="w-5 h-5 text-emerald-400" /> },
                    { id: 'zap', label: 'Zap', icon: <Zap className="w-5 h-5 text-yellow-400" /> },
                    { id: 'car', label: 'Rig', icon: <Car className="w-5 h-5 text-red-400" /> }
                  ].map(av => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setProfileAvatar(av.id)}
                      className={`py-2 px-1 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        profileAvatar === av.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-neutral-900 bg-neutral-950 hover:bg-neutral-900'
                      }`}
                      title={av.label}
                    >
                      {av.icon}
                      <span className="text-[8px] font-bold text-neutral-500 truncate max-w-full">{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Social links grid */}
              <div className="space-y-3 pt-4 border-t border-neutral-900">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Social Media & Websites</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase block">Website Link</label>
                    <input type="text" value={socWebsite} onChange={(e) => setSocWebsite(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="pjlosey.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase block">LinkedIn Username</label>
                    <input type="text" value={socLinkedin} onChange={(e) => setSocLinkedin(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="pjlosey" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase block">Twitter Username</label>
                    <input type="text" value={socTwitter} onChange={(e) => setSocTwitter(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="pjlosey" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase block">Instagram Username</label>
                    <input type="text" value={socInstagram} onChange={(e) => setSocInstagram(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="pjlosey" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase block">YouTube Username</label>
                    <input type="text" value={socYoutube} onChange={(e) => setSocYoutube(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="pjlosey" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase block">Facebook Username</label>
                    <input type="text" value={socFacebook} onChange={(e) => setSocFacebook(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="pjlosey" />
                  </div>
                </div>
              </div>

              {/* Skills section */}
              <div className="space-y-3 pt-4 border-t border-neutral-900">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Endorsed Skills</h4>
                {profileSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-neutral-950/80 border border-neutral-900 rounded-lg">
                    {profileSkills.map((s) => (
                      <span key={s.id} className="text-[9px] bg-neutral-900 text-neutral-300 px-2 py-0.5 rounded border border-neutral-800 flex items-center gap-1.5">
                        {s.name} ({s.rating}/5)
                        <button type="button" onClick={() => handleRemoveSkill(s.id)} className="text-neutral-500 hover:text-red-500 font-bold cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} className="glass-input flex-1 px-3 py-2 rounded-lg text-xs" placeholder="Add skill (e.g. Engine Tuning)" />
                  <select value={newSkillRating} onChange={(e) => setNewSkillRating(Number(e.target.value))} className="glass-input px-2 py-2 rounded-lg text-xs w-16">
                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r}/5</option>)}
                  </select>
                  <button type="button" onClick={handleAddSkill} className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold rounded-lg text-xs uppercase cursor-pointer">Add</button>
                </div>
              </div>

              {/* Achievements section */}
              <div className="space-y-3 pt-4 border-t border-neutral-900">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Career Timeline / Achievements</h4>
                {profileAchievements.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-1.5 bg-neutral-950/80 border border-neutral-900 rounded-lg">
                    {profileAchievements.map((a) => (
                      <div key={a.id} className="text-[10px] bg-neutral-900 text-neutral-300 p-2 rounded border border-neutral-800 flex justify-between items-center gap-2">
                        <span><strong>{a.year}</strong> - {a.title} <span className="text-[8px] opacity-60 uppercase font-mono">({a.type})</span></span>
                        <button type="button" onClick={() => handleRemoveAchievement(a.id)} className="text-neutral-500 hover:text-red-500 font-bold cursor-pointer">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2 bg-neutral-950/40 p-3 border border-neutral-900 rounded-xl">
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={newAchYear} onChange={(e) => setNewAchYear(e.target.value)} className="glass-input px-3 py-2 rounded-lg text-xs" placeholder="Year (2025)" />
                    <select value={newAchType} onChange={(e) => setNewAchType(e.target.value)} className="glass-input px-2 py-2 rounded-lg text-xs">
                      <option value="championship">Championship</option>
                      <option value="win">Race Win</option>
                      <option value="award">Award</option>
                      <option value="milestone">Milestone</option>
                    </select>
                    <button type="button" onClick={handleAddAchievement} className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold rounded-lg text-xs uppercase cursor-pointer">Add Event</button>
                  </div>
                  <input type="text" value={newAchTitle} onChange={(e) => setNewAchTitle(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="Event/Role Title (e.g. Indy 500 Win)" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={updatingProfile}
                className="btn-glow w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
              >
                {updatingProfile ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Save Profile Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Vehicle Passport Editor / Creator */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020203]/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-lg p-6 rounded-[2rem] border-emerald-500/10 space-y-6 relative overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setShowVehicleModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-400" /> 
                {selectedVehicle ? 'Edit Vehicle Passport' : 'Register Garage Asset'}
              </h3>
              <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest font-mono">Immutable Specs & Modifications</p>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Year</label>
                  <input 
                    type="number" 
                    required
                    min="1900"
                    max="2035"
                    value={vYear}
                    onChange={(e) => setVYear(e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-bold"
                    placeholder="2024"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Make Brand</label>
                  <input 
                    type="text" 
                    required
                    value={vMake}
                    onChange={(e) => setVMake(e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-bold"
                    placeholder="Porsche"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Model Description</label>
                <input 
                  type="text" 
                  required
                  value={vModel}
                  onChange={(e) => setVModel(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-bold"
                  placeholder="911 GT3 RS (992)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Engine Spec</label>
                  <input 
                    type="text" 
                    value={vEngine}
                    onChange={(e) => setVEngine(e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-semibold"
                    placeholder="4.0L Flat-6"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Power Output</label>
                  <input 
                    type="text" 
                    value={vPower}
                    onChange={(e) => setVPower(e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-semibold"
                    placeholder="518 HP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Transmission</label>
                  <select 
                    value={vTransmission}
                    onChange={(e) => setVTransmission(e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#060608] text-white border-neutral-800"
                  >
                    <option value="7-speed PDK">7-speed PDK</option>
                    <option value="6-speed Manual">6-speed Manual</option>
                    <option value="Sequential Dog-box">Sequential Dog-box</option>
                    <option value="8-speed Automatic">8-speed Automatic</option>
                    <option value="Electric Single-speed">Electric Single-speed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Holographic Tag ID Link</label>
                  <input 
                    type="text" 
                    required
                    value={vTagId}
                    onChange={(e) => setVTagId(e.target.value.toUpperCase())}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider placeholder:text-neutral-700"
                    placeholder="GP-XXXX-XXX"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Modification Logs (comma-separated list)</label>
                <textarea 
                  rows={2}
                  value={vModsString}
                  onChange={(e) => setVModsString(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-medium resize-none"
                  placeholder="Dundon Exhaust, MCS Coilovers, Manthey Racing Aerodynamics..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Vehicle Photo</label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 glass-panel">
                  {/* Photo Preview */}
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-neutral-800 border border-white/20 flex-shrink-0 flex items-center justify-center">
                    {vPhotoUrl ? (
                      <img src={vPhotoUrl} alt="Vehicle Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-8 h-8 text-neutral-500" />
                    )}
                    {uploadingVPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-grow space-y-1.5">
                    <input 
                      type="file" 
                      ref={vehiclePhotoInputRef}
                      onChange={handleVehiclePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingVPhoto}
                      onClick={() => vehiclePhotoInputRef.current?.click()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 active:bg-white/5 text-xs font-bold text-white rounded-xl transition duration-200 border border-white/10 flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingVPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          Upload Photo
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      PNG, JPG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Or Paste Image URL</label>
                  <input 
                    type="url" 
                    value={vPhotoUrl}
                    onChange={(e) => setVPhotoUrl(e.target.value)}
                    className="glass-input w-full px-4 py-2 rounded-xl text-xs placeholder:text-neutral-700 font-semibold"
                    placeholder="https://example.com/car.jpg"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={savingVehicle}
                className="btn-glow w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10"
              >
                {savingVehicle ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Claim & Save Vehicle Specs'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Print-Ready QR Sign Generator */}
      {showPrintModal && printAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020203]/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-4xl p-6 rounded-[2rem] border-neutral-900 space-y-6 relative grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Options Form (7 cols) */}
            <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-1 pt-4">
                <h3 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                  <Printer className="w-5 h-5 text-cyan-400" /> Print QR Sign Generator
                </h3>
                <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest font-mono">Custom high-DPI printable PDF/Signage layout</p>
              </div>

              <div className="space-y-4">
                
                {/* Accent selection */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Sign Theme Color Accent</span>
                  <div className="flex gap-3">
                    {[
                      { id: 'cyan', label: 'Cyber Cyan', border: 'border-cyan-500', bg: 'bg-cyan-500/10 text-cyan-400' },
                      { id: 'red', label: 'Qualy Crimson', border: 'border-red-500', bg: 'bg-red-500/10 text-red-400' },
                      { id: 'emerald', label: 'Forest Emerald', border: 'border-emerald-500', bg: 'bg-emerald-500/10 text-emerald-400' }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setSignTheme(theme.id as 'cyan' | 'red' | 'emerald')}
                        className={`flex-1 py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          signTheme === theme.id 
                            ? `${theme.border} ${theme.bg} scale-[1.02] shadow-lg shadow-white/2` 
                            : 'border-neutral-900 bg-neutral-950/60 text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sign layout format selection */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Sign Layout Format</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'windshield', label: 'Car Show Flyer (8.5" x 11")', desc: 'Windshield spec layout' },
                      { id: 'poster', label: 'Large Poster / Banner', desc: 'Maximizes QR size for trailers' },
                      { id: 'sticker_3x3', label: '3"x3" Avery Decal (Square)', desc: 'Square label layout for stickers' },
                      { id: 'keytag', label: 'Mini Keytag (2" x 1")', desc: 'Keychain size keytag card' },
                      { id: 'svg_export', label: 'Professional SVG Export', desc: 'Vector asset for custom vinyl' }
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setSignFormat(fmt.id as 'windshield' | 'poster' | 'sticker_3x3' | 'keytag' | 'svg_export')}
                        className={`p-2.5 border rounded-xl text-left transition-all flex flex-col justify-center cursor-pointer ${
                          signFormat === fmt.id
                            ? 'border-blue-500 bg-blue-500/10 text-white'
                            : 'border-neutral-900 bg-neutral-950/60 text-neutral-400 hover:text-neutral-300'
                        }`}
                      >
                        <span className="text-xs font-bold block">{fmt.label}</span>
                        <span className="text-[9px] text-neutral-500 font-medium leading-tight mt-0.5">{fmt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outdoor lamination reminder tip */}
                <div className="p-3.5 bg-neutral-950/80 border border-neutral-900 rounded-2xl flex items-start gap-3 shadow-inner">
                  <span className="text-sm shrink-0">💡</span>
                  <p className="text-[10px] text-neutral-400 leading-normal font-medium">
                    <strong className="text-white font-bold">Paddock Pro Tip:</strong> For outdoor trackside use, print this on heavy cardstock and slide it into a plastic sleeve. This keeps the rain from melting your QR check-in code!
                  </p>
                </div>

                {/* Sign title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Custom Signage Title Header</label>
                  <input 
                    type="text" 
                    required
                    value={signTitle}
                    onChange={(e) => setSignTitle(e.target.value.toUpperCase())}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm font-bold placeholder:text-neutral-700"
                    placeholder="SIGN HEADER NAME"
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Footer Instructions Subtext</label>
                  <textarea 
                    rows={2}
                    value={signSubtext}
                    onChange={(e) => setSignSubtext(e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-xs placeholder:text-neutral-700 font-medium resize-none leading-relaxed"
                    placeholder="Instructions shown at the bottom of the sign..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 py-3 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDownloadSign}
                  disabled={generatingPrint}
                  className="flex-grow py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/10"
                >
                  {generatingPrint ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : (
                    <>
                      <Download className="w-4 h-4" /> Download high-DPI Sign (PNG)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Live Layout Preview (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-neutral-950/60 p-4 border border-neutral-900 rounded-[2rem] gap-4 relative overflow-hidden">
              <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest absolute top-3 left-4">Live Layout Preview</span>
              
              {/* Glass visual mockup box */}
              <div 
                className={`w-full aspect-[4/5] bg-[#060608] border-2 rounded-2xl p-4 flex flex-col justify-between items-center text-center transition-all duration-300 ${
                  signTheme === 'cyan' ? 'border-cyan-500/25 shadow-cyan-500/2 shadow-lg' :
                  signTheme === 'red' ? 'border-red-500/25 shadow-red-500/2 shadow-lg' :
                  'border-emerald-500/25 shadow-emerald-500/2 shadow-lg'
                }`}
              >
                {/* Mock header */}
                <div className="space-y-1 mt-2">
                  <span className="text-[8px] font-black tracking-widest text-neutral-500 uppercase block">G R I D P A S S</span>
                  <span className={`text-[7px] font-mono border px-1.5 py-0.5 rounded uppercase font-bold tracking-widest ${
                    signTheme === 'cyan' ? 'bg-cyan-500/10 border-cyan-800/30 text-cyan-400' :
                    signTheme === 'red' ? 'bg-red-500/10 border-red-800/30 text-red-400' :
                    'bg-emerald-500/10 border-emerald-800/30 text-emerald-400'
                  }`}>
                    {printAsset.type === 'vehicle' ? 'VEHICLE PASSPORT' : 'UNIVERSAL KEY'}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-xs font-black uppercase text-white truncate max-w-[200px] leading-tight pt-1">
                  {signTitle || 'SIGN HEADER'}
                </h4>

                {/* Mock QR */}
                <div className={`transition-all duration-300 ${signFormat === 'poster' ? 'w-40 h-40' : 'w-28 h-28'} border border-dashed rounded-xl flex items-center justify-center p-2 relative bg-neutral-950/60 ${
                  signTheme === 'cyan' ? 'border-cyan-500/30 text-cyan-400' :
                  signTheme === 'red' ? 'border-red-500/30 text-red-400' :
                  'border-emerald-500/30 text-emerald-400'
                }`}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=${
                      signTheme === 'cyan' ? '22d3ee' : signTheme === 'red' ? 'f43f5e' : '34d399'
                    }&bgcolor=060608&data=${encodeURIComponent(printAsset.url)}`} 
                    alt="Preview QR" 
                    className={`${signFormat === 'poster' ? 'w-32 h-32' : 'w-22 h-22'} object-contain rounded-lg`}
                  />
                  {/* Logo Overlay */}
                  <div className={`absolute ${signFormat === 'poster' ? 'w-8 h-8 p-0.5' : 'w-6 h-6 p-0.5'} bg-[#060608] border border-neutral-850 rounded-lg flex items-center justify-center shadow-md`}>
                    <Logo className={`${signFormat === 'poster' ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} textClassName="hidden" />
                  </div>
                  
                  {/* Bracket simulator */}
                  <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t border-l rounded-tl ${signTheme === 'cyan' ? 'border-cyan-400' : signTheme === 'red' ? 'border-red-400' : 'border-emerald-400'}`} />
                  <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t border-r rounded-tr ${signTheme === 'cyan' ? 'border-cyan-400' : signTheme === 'red' ? 'border-red-400' : 'border-emerald-400'}`} />
                  <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l rounded-bl ${signTheme === 'cyan' ? 'border-cyan-400' : signTheme === 'red' ? 'border-red-400' : 'border-emerald-400'}`} />
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r rounded-br ${signTheme === 'cyan' ? 'border-cyan-400' : signTheme === 'red' ? 'border-red-400' : 'border-emerald-400'}`} />
                </div>

                {/* Subtext */}
                <p className="text-[7px] text-neutral-400 leading-normal max-w-[200px] line-clamp-3">
                  {signSubtext || 'Instruction text details...'}
                </p>

                {/* Footer branding */}
                <div className="space-y-0.5 border-t border-neutral-900/60 pt-2 w-full">
                  <span className={`text-[8px] font-black uppercase ${
                    signTheme === 'cyan' ? 'text-cyan-400' :
                    signTheme === 'red' ? 'text-red-400' :
                    'text-emerald-400'
                  }`}>SCAN ME</span>
                  <span className="text-[5px] text-neutral-600 block uppercase font-mono tracking-widest">POWERED BY GRIDPASS</span>
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 font-medium leading-relaxed text-center px-4">
                * Hidden hidden-canvas high-DPI resolution compiles at 2400 x 3000 pixels (equivalent to 300 DPI at 8&quot; x 10&quot; size) ensuring professional sign print details.
              </div>
            </div>

          </div>
        </div>
      )}
      {/* MODAL 4: Peer-to-Peer Ownership Transfer */}
      {showTransferModal && transferVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020203]/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-md p-6 rounded-[2rem] border-blue-500/10 space-y-6 relative">
            <button 
              onClick={() => setShowTransferModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-blue-400" /> Transfer Identity
              </h3>
              <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest font-mono">
                P2P Ownership Transfer
              </p>
            </div>

            <div className="p-4 bg-neutral-950/80 border border-neutral-900 rounded-2xl space-y-2">
              <p className="text-xs text-neutral-400 font-bold uppercase">Vehicle to transfer:</p>
              <p className="text-sm font-extrabold text-white">
                {transferVehicle.year} {transferVehicle.make} {transferVehicle.model}
              </p>
              <p className="text-[10px] font-mono text-neutral-500">Tag ID: {transferVehicle.tag_id}</p>
            </div>

            {transferSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                <p className="text-xs font-bold text-emerald-400 uppercase">Transfer Initiated Successfully!</p>
                <p className="text-[11px] text-neutral-400">Ownership ledger has been updated cleanly.</p>
              </div>
            ) : (
              <form onSubmit={handleTransferVehicle} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                    Recipient Email Address
                  </label>
                  <input 
                    type="email" 
                    required
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:text-neutral-700 font-bold"
                    placeholder="e.g. buyer@gridpass.app"
                  />
                  <p className="text-[10px] text-neutral-500 leading-normal mt-1">
                    * The recipient must have a registered Gridpass account to receive the digital passport.
                  </p>
                </div>

                {transferError && (
                  <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                    {transferError}
                  </p>
                )}

                <button 
                  type="submit" 
                  disabled={transferring}
                  className="btn-glow w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
                >
                  {transferring ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    'Confirm Ownership Transfer'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
