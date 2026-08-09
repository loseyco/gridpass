'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Car, Plus, Wrench, Heart, ShieldCheck, Loader2, User, MapPin, 
  Printer, Sparkles, CheckCircle, Share2, Compass, QrCode, 
  Building2, Calendar, Briefcase, Warehouse, Trash2, Edit3, Eye, X, ExternalLink
} from 'lucide-react';
import { BusinessProfile } from '@/lib/types/business';
import { GridpassEvent } from '@/lib/types/events';

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

interface ExperienceAsset {
  id: string;
  owner_uid?: string;
  title: string;
  company: string;
  category: string;
  description: string;
  date_range?: string;
  photos?: string[];
  external_links?: { title: string; url: string }[];
}

interface PhysicalSpace {
  id: string;
  owner_uid?: string;
  name: string;
  type: string;
  location: string;
  sqft?: string;
  item_count?: number;
  notes?: string;
  photo_url?: string;
}

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');

  const [activeTab, setActiveTab] = useState<string>('vehicles');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [events, setEvents] = useState<GridpassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Experience Assets State
  const [experiences, setExperiences] = useState<ExperienceAsset[]>([]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceAsset | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expCategory, setExpCategory] = useState('MOTORSPORT GIG');
  const [expDesc, setExpDesc] = useState('');

  // Physical Spaces State
  const [spaces, setSpaces] = useState<PhysicalSpace[]>([]);
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<PhysicalSpace | null>(null);
  const [spaceName, setSpaceName] = useState('');
  const [spaceType, setSpaceType] = useState('Residential Workshop');
  const [spaceLocation, setSpaceLocation] = useState('Grayslake, IL');
  const [spaceSqft, setSpaceSqft] = useState('500');

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user && !isMock) {
      router.push('/login');
    }
  }, [user, authLoading, router, isMock]);

  useEffect(() => {
    if (!user && !isMock) return;

    if (isMock) {
      setProfile({
        display_name: 'PJ LOSEY',
        bio: 'Founder of Gridpass. From Engines to Protons, if it has an engine or motor, I\'m involved.',
        is_supporter: true,
        location: 'Grayslake, IL'
      });
      
      const storedVehicles = localStorage.getItem('__mock_vehicles__');
      if (storedVehicles) {
        setVehicles(JSON.parse(storedVehicles));
      } else {
        const defaultMock = [
          {
            id: 'v1',
            year: 2023,
            make: 'Chevrolet',
            model: 'Corvette Z06',
            trim: 'Z06 Coupe',
            photo_url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=400&q=80',
            specs: { engine: '5.5L V8', hp: 670 }
          }
        ];
        localStorage.setItem('__mock_vehicles__', JSON.stringify(defaultMock));
        setVehicles(defaultMock);
      }

      const storedBusinesses = localStorage.getItem('__mock_businesses__');
      if (storedBusinesses) {
        const parsed = JSON.parse(storedBusinesses);
        setBusinesses(parsed.filter((b: any) => !b.is_unclaimed && b.status !== 'unclaimed'));
      } else {
        const defaultBusinesses: (BusinessProfile & { is_unclaimed?: boolean })[] = [
          {
            id: 'nielsens',
            owner_uid: user?.uid || 'pjlosey',
            name: 'NIELSEN ENTERPRISES',
            description: 'Powersports and Marine Dealership',
            category: 'dealership',
            location_name: 'Lake Villa, IL'
          },
          {
            id: 'monarch-defender',
            owner_uid: user?.uid || 'pjlosey',
            name: 'Monarch Defender',
            description: 'Custom Land Rover & Utility Vehicle Restoration',
            category: 'shop_garage',
            location_name: 'Monmouth, IL',
            is_unclaimed: true
          },
          {
            id: 'shaw-daddys-bbq',
            owner_uid: user?.uid || 'pjlosey',
            name: "Shaw Daddy's BBQ",
            description: 'Trackside Catering & Event Food Service',
            category: 'food_truck',
            location_name: 'Monmouth, IL'
          }
        ];
        localStorage.setItem('__mock_businesses__', JSON.stringify(defaultBusinesses));
        setBusinesses(defaultBusinesses.filter((b: any) => !b.is_unclaimed && b.status !== 'unclaimed'));
      }

      setEvents([
        {
          id: 'maple-city-cruise',
          host_uid: user?.uid || 'pjlosey',
          title: '27TH ANNUAL CRUISE NIGHT IN THE MAPLE CITY',
          description: 'Monmouth\'s legendary Cruise Night!',
          frequency: 'one_time',
          location_name: 'Monmouth Public Square',
          require_waiver: true,
          require_tech_check: false,
          staging_groups: ['Classics', 'Muscle']
        }
      ]);

      setExperiences([
        {
          id: 'exp-hrc-2021',
          owner_uid: user?.uid || 'pjlosey',
          title: 'Honda Racing / HRC Trackside Engineer',
          company: 'Honda Racing Corporation',
          category: 'Engineering',
          date_range: '2021 - Present',
          description: 'Trackside telemetry, engine tuning, and ECU calibration.'
        },
        {
          id: 'exp-water-mobile',
          owner_uid: user?.uid || 'pjlosey',
          title: 'Gridpass Platform & Waterway Radar',
          company: 'Losey Tech Solutions',
          category: 'Driver',
          date_range: '2023 - Present',
          description: 'Full-stack platform architecture and marine navigation engines.'
        },
        {
          id: 'exp-siemens-2020',
          owner_uid: user?.uid || 'pjlosey',
          title: 'Siemens Healthineers Project Engineer',
          company: 'Siemens Healthineers',
          category: 'Engineering',
          date_range: '2019 - 2023',
          description: 'Proton therapy equipment installation and precision alignment.'
        }
      ]);

      const storedSpaces = localStorage.getItem('__mock_spaces__');
      if (storedSpaces) {
        setSpaces(JSON.parse(storedSpaces));
      } else {
        const defaultSpaces = [
          {
            id: 'space-1',
            owner_uid: user?.uid || 'pjlosey',
            name: "Kristina's Garage",
            type: 'Residential Garage',
            location: 'Grayslake, IL',
            sqft: '600',
            photo_url: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&w=300&q=80'
          },
          {
            id: 'space-2',
            owner_uid: user?.uid || 'pjlosey',
            name: 'Monmouth Beach Self-Storage Unit #402',
            type: 'Storage Unit',
            location: 'Monmouth Beach, NJ',
            sqft: '200',
            photo_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80'
          },
          {
            id: 'space-3',
            owner_uid: user?.uid || 'pjlosey',
            name: 'Rented Workshop Room',
            type: 'Rented Room',
            location: 'Chicago, IL',
            sqft: '400',
            photo_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80'
          },
          {
            id: 'space-4',
            owner_uid: user?.uid || 'pjlosey',
            name: "7'x14' Enclosed Utility Trailer",
            type: 'Utility Trailer',
            location: 'Grayslake, IL',
            sqft: '98',
            photo_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=300&q=80'
          },
          {
            id: 'space-5',
            owner_uid: user?.uid || 'pjlosey',
            name: "Kristina's House",
            type: 'Residence',
            location: 'Grayslake, IL',
            sqft: '2400',
            photo_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&q=80'
          }
        ];
        localStorage.setItem('__mock_spaces__', JSON.stringify(defaultSpaces));
        setSpaces(defaultSpaces);
      }

      setLoading(false);
      return;
    }

    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile({
          display_name: user.email?.split('@')[0].toUpperCase() || 'MEMBER',
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
        const vData = docSnap.data();
        list.push({ 
          id: docSnap.id, 
          ...vData,
          photo_url: vData.photo_url || vData.imageUrl || vData.image_url || vData.photoUrl || (vData.images && vData.images[0])
        } as DashboardVehicle);
      });
      setVehicles(list);
    }, (err) => {
      console.error("Error loading vehicles snapshot:", err);
    });

    const businessesQuery = collection(db, 'businesses');
    const unsubBusinesses = onSnapshot(businessesQuery, (snap) => {
      const list: BusinessProfile[] = [];
      snap.forEach((docSnap) => {
        const bData = docSnap.data();
        // Ignore unclaimed directory listings
        if (bData.is_unclaimed || bData.status === 'unclaimed') return;

        const matchesUser = 
          bData.owner_uid === user.uid ||
          bData.owner_id === user.uid ||
          bData.user_id === user.uid ||
          (bData.created_by === user.uid && !bData.is_unclaimed);

        if (matchesUser && !bData.is_hidden) {
          list.push({ 
            id: docSnap.id, 
            ...bData 
          } as BusinessProfile);
        }
      });
      setBusinesses(list);
    }, (err) => {
      console.error("Error loading businesses snapshot:", err);
    });

    const eventsQuery = collection(db, 'events');
    const unsubEvents = onSnapshot(eventsQuery, (snap) => {
      const list: GridpassEvent[] = [];
      snap.forEach((docSnap) => {
        const eData = docSnap.data();
        if (eData.host_uid === user.uid || eData.host_id === user.uid) {
          list.push({ 
            id: docSnap.id, 
            ...eData 
          } as GridpassEvent);
        }
      });
      setEvents(list);
      setLoading(false);
    }, (err) => {
      console.error("Error loading events snapshot:", err);
      setLoading(false);
    });

    const spacesQuery = collection(db, 'garage_spaces');
    const unsubSpaces = onSnapshot(spacesQuery, (snap) => {
      const list: PhysicalSpace[] = [];
      snap.forEach((docSnap) => {
        const sData = docSnap.data();
        if (!sData.is_hidden && (sData.user_id === user.uid || sData.owner_uid === user.uid)) {
          list.push({
            id: docSnap.id,
            ...sData,
          } as PhysicalSpace);
        }
      });
      setSpaces(list);
    }, (err) => {
      console.error("Error loading spaces snapshot:", err);
    });

    const unsubExp = onSnapshot(collection(db, 'experiences'), (snap) => {
      const list: ExperienceAsset[] = [];
      snap.forEach((docSnap) => {
        const expData = docSnap.data();
        if (expData.user_id === user.uid || expData.owner_uid === user.uid) {
          list.push({
            id: docSnap.id,
            ...expData,
          } as ExperienceAsset);
        }
      });
      if (list.length > 0) setExperiences(list);
    }, (err) => {
      console.error("Error loading experiences snapshot:", err);
    });

    return () => {
      unsubProfile();
      unsubVehicles();
      unsubBusinesses();
      unsubEvents();
    };
  }, [user, isMock]);

  const handleTabSelect = (tabKey: string) => {
    setActiveTab(tabKey);
    router.push(`/dash?tab=${tabKey}`);
  };

  const handleCreateExperience = () => {
    setEditingExp(null);
    setExpTitle('');
    setExpCompany('');
    setExpCategory('MOTORSPORT GIG');
    setExpDesc('');
    setShowExpModal(true);
  };

  const handleSaveExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) return;

    if (editingExp) {
      setExperiences(prev => prev.map(exp => exp.id === editingExp.id ? {
        ...exp,
        title: expTitle,
        company: expCompany,
        category: expCategory,
        description: expDesc
      } : exp));
    } else {
      const newExp: ExperienceAsset = {
        id: `exp-${Date.now()}`,
        title: expTitle,
        company: expCompany || 'Gridpass Member',
        category: expCategory,
        description: expDesc
      };
      setExperiences(prev => [newExp, ...prev]);
    }
    setShowExpModal(false);
  };

  const handleDeleteExperience = (id: string) => {
    setExperiences(prev => prev.filter(e => e.id !== id));
  };

  const handleCreateSpace = () => {
    setEditingSpace(null);
    setSpaceName('');
    setSpaceType('Residential Workshop');
    setSpaceLocation('Grayslake, IL');
    setSpaceSqft('500');
    setShowSpaceModal(true);
  };

  const handleSaveSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;

    if (editingSpace) {
      setSpaces(prev => prev.map(sp => sp.id === editingSpace.id ? {
        ...sp,
        name: spaceName,
        type: spaceType,
        location: spaceLocation,
        sqft: `${spaceSqft} sq ft`
      } : sp));
    } else {
      const newSpace: PhysicalSpace = {
        id: `space-${Date.now()}`,
        name: spaceName,
        type: spaceType,
        location: spaceLocation,
        sqft: `${spaceSqft} sq ft`,
        item_count: 0
      };
      setSpaces(prev => [...prev, newSpace]);
    }
    setShowSpaceModal(false);
  };

  const handleDeleteSpace = (id: string) => {
    setSpaces(prev => prev.filter(s => s.id !== id));
  };

  const handleBecomeSupporter = async () => {
    if (!user) return;
    if (isMock) {
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

  if (authLoading || loading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  const isSupporter = profile?.is_supporter === true;

  const businessCategoryLabels: Record<string, string> = {
    dealership: 'Dealership',
    track_venue: 'Track / Venue',
    club_organizer: 'Club / Organizer',
    shop_garage: 'Service Garage',
    detailing_wrap: 'Detailing & Wrap Shop',
    parts_accessories: 'Parts & Accessories',
    food_beverage: 'Food & Beverage',
    catering: 'Catering Services',
    photography_media: 'Photography & Media',
    website_tech: 'Tech & Marketing Services',
    other: 'Partner Business'
  };

  const tabsList = [
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'experiences', label: 'Experiences', icon: Briefcase },
    { id: 'spaces', label: 'Spaces', icon: Warehouse },
    { id: 'businesses', label: 'Businesses', icon: Building2 },
    { id: 'events', label: 'Hosted Events', icon: Calendar },
    { id: 'membership', label: 'Membership', icon: ShieldCheck },
  ];

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

        <div className="space-y-1.5 min-w-0 flex-1 text-left">
          <h1 className="text-base font-extrabold uppercase text-neutral-900 truncate">
            {profile?.display_name || user?.displayName || 'MEMBER'}
          </h1>
          <div className="text-[9px] font-mono font-bold text-[#ff3b30] flex gap-3 items-center">
            <Link 
              href="/dash/edit-profile"
              className="hover:underline uppercase tracking-wider text-neutral-500 font-bold min-h-[44px] flex items-center"
            >
              Edit Profile
            </Link>
            <span className="text-neutral-300">|</span>
            <Link href={profile?.username ? `/u/${profile.username}` : `/u/${user?.uid || ''}`} className="hover:underline uppercase tracking-wider text-[#ff3b30] font-bold min-h-[44px] flex items-center">
              Public Profile
            </Link>
          </div>
        </div>
      </div>

      {/* 6 DASHBOARD TAB PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200 no-scrollbar" data-testid="dashboard-tab-pills">
        {tabsList.map(t => {
          const IconComp = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`dash-tab-${t.id}`}
              onClick={() => handleTabSelect(t.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-mono font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#ff3b30] text-white shadow-md shadow-red-500/20'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VEHICLES (DIGITAL GARAGE) */}
      {activeTab === 'vehicles' && (
        <section className="space-y-4 text-left animate-in fade-in duration-200" data-testid="dashboard-vehicles-manager">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
              Digital Garage
            </h2>
            <button 
              onClick={() => router.push('/v/create')}
              className="min-h-[44px] flex items-center gap-1.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-bold uppercase px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-2xl text-center space-y-3">
              <Car className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase">Your garage is empty</h3>
              <p className="text-[10px] text-neutral-500 max-w-xs mx-auto leading-normal">
                Add vehicles to configure digital mod catalogs and generate printable decals.
              </p>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200 shadow-sm">
              {vehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors gap-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      {v.photo_url ? (
                        <img src={v.photo_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>

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

                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/v/${v.id}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-mono font-bold border border-neutral-200 hover:border-neutral-350 bg-white text-neutral-800 px-4 rounded-xl transition-colors uppercase"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dash/vehicles/edit?id=${v.id}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-mono font-bold border border-[#ff3b30] hover:bg-[#ff3b30]/5 text-[#ff3b30] px-4 rounded-xl transition-colors uppercase"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: EXPERIENCES (DASHBOARD EXPERIENCE MANAGER) */}
      {activeTab === 'experiences' && (
        <section className="space-y-4 text-left animate-in fade-in duration-200" data-testid="dashboard-experience-manager">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase text-neutral-900 tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#ff3b30]" /> Experience Assets
              </h2>
              <p className="text-[10px] text-neutral-500 font-mono">Manage motorsport gigs, roles, and engineering projects</p>
            </div>
            <Link
              href="/exp/new"
              data-testid="create-experience-asset-btn"
              className="min-h-[44px] flex items-center gap-1.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-bold uppercase px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" /> + Create New Experience Asset
            </Link>
          </div>

          <div className="space-y-3">
            {experiences.map((exp) => (
              <div 
                key={exp.id} 
                className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                data-testid={`experience-asset-card-${exp.id}`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-neutral-900 text-white rounded-md">
                      {exp.category}
                    </span>
                    <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">
                      {exp.title}
                    </h3>
                  </div>
                  <p className="text-xs font-bold text-neutral-600 uppercase">
                    {exp.company} • <span className="font-mono text-neutral-400">{exp.date_range}</span>
                  </p>
                  <p className="text-xs text-neutral-500 line-clamp-2">
                    {exp.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    href={`/exp/${exp.id}`}
                    data-testid={`view-exp-${exp.id}`}
                    className="min-h-[44px] min-w-[44px] px-4 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center gap-1 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </Link>
                  <Link
                    href={`/exp/${exp.id}/edit`}
                    data-testid={`edit-exp-${exp.id}`}
                    className="min-h-[44px] min-w-[44px] px-4 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center gap-1 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    type="button"
                    data-testid={`delete-exp-${exp.id}`}
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="min-h-[44px] min-w-[44px] p-3 text-neutral-400 hover:text-red-600 transition-all rounded-xl border border-neutral-200 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: SPACES (DASHBOARD SPACE MANAGER) */}
      {activeTab === 'spaces' && (
        <section className="space-y-4 text-left animate-in fade-in duration-200" data-testid="dashboard-space-manager">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase text-neutral-900 tracking-wider flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-[#ff3b30]" /> Registered Physical Spaces
              </h2>
              <p className="text-[10px] text-neutral-500 font-mono">Manage workshops, garages, trailers, and storage locations</p>
            </div>
            <Link
              href="/dash/space/new"
              data-testid="add-physical-space-btn"
              className="min-h-[44px] flex items-center gap-1.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-bold uppercase px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" /> + Add Physical Space
            </Link>
          </div>

          <div className="space-y-3">
            {spaces.map((space) => (
              <div 
                key={space.id} 
                className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                data-testid={`physical-space-card-${space.id}`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Far Left Space Photo Thumbnail */}
                  <div 
                    className="w-16 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-100 border border-neutral-200 flex items-center justify-center"
                    data-testid={`space-thumbnail-container-${space.id}`}
                  >
                    {space.photo_url ? (
                      <img 
                        src={space.photo_url} 
                        alt={space.name} 
                        className="w-full h-full object-cover"
                        data-testid={`space-thumbnail-img-${space.id}`} 
                      />
                    ) : (
                      <Warehouse className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-amber-500 text-neutral-950 rounded-md" data-testid={`space-badge-${space.id}`}>
                        {space.type}
                      </span>
                      <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight" data-testid={`space-title-${space.id}`}>
                        {space.name}
                      </h3>
                    </div>
                    <div className="text-xs font-mono text-neutral-500 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#ff3b30]" /> {space.location}</span>
                      {space.sqft && <span>• {space.sqft}</span>}
                      {space.item_count !== undefined && <span>• {space.item_count} items staged</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <Link
                    href="/dash/garage"
                    data-testid={`manage-space-${space.id}`}
                    className="min-h-[44px] min-w-[44px] px-4 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center gap-1 transition-all"
                  >
                    Inventory →
                  </Link>
                  <Link
                    href={`/dash/space/${space.id}/edit`}
                    data-testid={`edit-space-${space.id}`}
                    className="min-h-[44px] min-w-[44px] px-4 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center gap-1 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    type="button"
                    data-testid={`delete-space-${space.id}`}
                    onClick={() => handleDeleteSpace(space.id)}
                    className="min-h-[44px] min-w-[44px] p-3 text-neutral-400 hover:text-red-600 transition-all rounded-xl border border-neutral-200 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: BUSINESSES */}
      {activeTab === 'businesses' && (
        <section className="space-y-4 text-left animate-in fade-in duration-200" data-testid="dashboard-businesses-manager">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#ff3b30]" />
              My Businesses
            </h2>
            <button 
              onClick={() => router.push('/b/create')}
              className="min-h-[44px] flex items-center gap-1.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-bold uppercase px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Business
            </button>
          </div>

          {businesses.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-2xl text-center space-y-3">
              <Building2 className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase">No businesses added</h3>
              <p className="text-[10px] text-neutral-500 max-w-xs mx-auto leading-normal">
                Add powersport dealerships, service shops, or tracks to start hosting digital event staging.
              </p>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200 shadow-sm">
              {businesses.map((biz) => (
                <div key={biz.id} data-testid={`business-card-${biz.id}`} className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors gap-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      {biz.logo_url ? (
                        <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[8px] font-mono font-bold text-[#ff3b30] uppercase">
                          {businessCategoryLabels[biz.category] || 'Biz'}
                        </span>
                        <h3 className="text-xs font-extrabold text-neutral-900 uppercase truncate">
                          {biz.name}
                        </h3>
                      </div>
                      <div className="text-[9px] font-mono text-neutral-400 font-bold uppercase flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-neutral-400" /> {biz.location_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/b/${biz.id}`}
                      data-testid={`view-business-${biz.id}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-mono font-bold border border-neutral-200 hover:border-neutral-350 bg-white text-neutral-800 px-4 rounded-xl transition-colors uppercase"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dash/businesses/edit?id=${biz.id}`}
                      data-testid={`edit-business-${biz.id}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-mono font-bold border border-[#ff3b30] hover:bg-[#ff3b30]/5 text-[#ff3b30] px-4 rounded-xl transition-colors uppercase"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 5: HOSTED EVENTS */}
      {activeTab === 'events' && (
        <section className="space-y-4 text-left animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
              My Hosted Events
            </h2>
            <button 
              onClick={() => router.push('/events/create')}
              className="min-h-[44px] flex items-center gap-1.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-bold uppercase px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Host Event
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-2xl text-center space-y-3">
              <Calendar className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase">No active events hosted</h3>
              <p className="text-[10px] text-neutral-500 max-w-xs mx-auto leading-normal">
                Publish single meets, repeating autocrosses, or offroad park times and track staging rosters.
              </p>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200 shadow-sm">
              {events.map((evt) => (
                <div key={evt.id} className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors gap-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#ff3b30]" />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[8px] font-mono font-bold text-[#ff3b30] uppercase">
                          {evt.frequency === 'one_time' ? 'One-Time' : evt.frequency === 'repeating' ? 'Repeating' : 'Venue'}
                        </span>
                        <h3 className="text-xs font-extrabold text-neutral-900 uppercase truncate">
                          {evt.title}
                        </h3>
                      </div>
                      <div className="text-[9px] font-mono text-neutral-400 font-bold uppercase flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-neutral-400" /> {evt.location_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/events/${evt.id}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-mono font-bold border border-neutral-200 hover:border-neutral-350 bg-white text-neutral-800 px-4 rounded-xl transition-colors uppercase"
                    >
                      View
                    </Link>
                    <Link
                      href={`/events/create?id=${evt.id}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-mono font-bold border border-[#ff3b30] hover:bg-[#ff3b30]/5 text-[#ff3b30] px-4 rounded-xl transition-colors uppercase"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 6: MEMBERSHIP & ACHIEVEMENTS */}
      {activeTab === 'membership' && (
        <section className="space-y-6 text-left animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <Link
              href="/dash/achievements"
              className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 shadow-md flex items-center justify-between hover:bg-black transition-all group min-h-[44px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff3b30] text-white flex items-center justify-center text-xl font-black shrink-0">
                  🏆
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-xs uppercase text-white tracking-wider">
                      Achievements & Credits HQ
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    Earn Grid Credits, unlock Feats & claim Perks!
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-[#ff3b30] group-hover:translate-x-1 transition-transform shrink-0">HQ →</span>
            </Link>

            <Link
              href="/leaderboard"
              className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 shadow-md flex items-center justify-between hover:bg-black transition-all group min-h-[44px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center text-xl font-black shrink-0">
                  🥇
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-xs uppercase text-white tracking-wider">
                      Member Leaderboard
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    Compare Grid Credits, top Feats, and Garage builds!
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-400 group-hover:translate-x-1 transition-transform shrink-0">View →</span>
            </Link>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider">Membership Perks</h3>
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl divide-y divide-neutral-200 overflow-hidden">
              {isMock && (
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wide">Supporter Tier</span>
                    <span className={`text-[9px] font-mono font-bold uppercase ${isSupporter ? 'text-amber-600' : 'text-neutral-400'}`}>
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
                      className="min-h-[44px] mt-1 w-full py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-bold uppercase rounded-xl transition-colors"
                    >
                      Pledge Support
                    </button>
                  )}
                </div>
              )}

              <div className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wide block">Invite Member</span>
                  <p className="text-[9px] text-neutral-500 truncate">Share your invite link with other members</p>
                </div>
                <button 
                  onClick={handleCopyInviteLink}
                  className="min-h-[44px] min-w-[44px] px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-xl transition-colors shrink-0"
                >
                  {copied ? 'Copied' : 'Invite'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CREATE / EDIT EXPERIENCE MODAL */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl text-left border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black uppercase text-neutral-900">
                {editingExp ? 'Edit Experience Asset' : '+ Create New Experience Asset'}
              </h3>
              <button 
                onClick={() => setShowExpModal(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveExperience} className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-neutral-600 uppercase block mb-1">Title</label>
                <input
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Trackside Engineer"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-neutral-600 uppercase block mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  placeholder="e.g. Honda Racing Corporation"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-neutral-600 uppercase block mb-1">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                >
                  <option value="MOTORSPORT GIG">MOTORSPORT GIG</option>
                  <option value="SPECIAL PROJECT">SPECIAL PROJECT</option>
                  <option value="FULL-TIME ROLE">FULL-TIME ROLE</option>
                  <option value="VENDOR SERVICE">VENDOR SERVICE</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-neutral-600 uppercase block mb-1">Description</label>
                <textarea
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Describe your responsibilities and achievements..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpModal(false)}
                  className="min-h-[44px] px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-bold uppercase rounded-xl shadow-md"
                >
                  Save Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PHYSICAL SPACE MODAL */}
      {showSpaceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl text-left border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black uppercase text-neutral-900">
                {editingSpace ? 'Edit Physical Space' : '+ Add Physical Space'}
              </h3>
              <button 
                onClick={() => setShowSpaceModal(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSpace} className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-neutral-600 uppercase block mb-1">Space Name</label>
                <input
                  type="text"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder="e.g. Kristina's Garage"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-neutral-600 uppercase block mb-1">Space Type</label>
                <select
                  value={spaceType}
                  onChange={(e) => setSpaceType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                >
                  <option value="Residential Workshop">Residential Workshop</option>
                  <option value="Storage Unit">Storage Unit</option>
                  <option value="Commercial Bay">Commercial Bay</option>
                  <option value="Mobile Enclosed Trailer">Mobile Enclosed Trailer</option>
                  <option value="Staging & Storage">Staging & Storage</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-neutral-600 uppercase block mb-1">Location</label>
                <input
                  type="text"
                  value={spaceLocation}
                  onChange={(e) => setSpaceLocation(e.target.value)}
                  placeholder="e.g. Grayslake, IL"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-neutral-600 uppercase block mb-1">Approx Size (sq ft)</label>
                <input
                  type="text"
                  value={spaceSqft}
                  onChange={(e) => setSpaceSqft(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                />
              </div>
              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSpaceModal(false)}
                  className="min-h-[44px] px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-bold uppercase rounded-xl shadow-md"
                >
                  Save Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
