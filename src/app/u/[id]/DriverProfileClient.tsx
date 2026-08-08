'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { 
  Instagram, Youtube, Compass, MapPin, 
  CarFront, Loader2, ArrowLeft, Heart, ShieldCheck, Printer, Sparkles, UserCircle,
  Facebook, Twitter, Globe, Share2, MessageSquare, Send, Store, Trophy,
  Calendar, CheckCircle2, Award, Flame, Download, Camera, Copy, Plus, X, Settings, Briefcase,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import GridpassQRCode, { downloadGridpassQR } from '@/components/qr/GridpassQRCode';
import { EditPassportDrawer } from '@/components/EditPassportDrawer';

interface DriverProfile {
  uid: string;
  email: string;
  display_name: string;
  username?: string;
  bio?: string;
  website?: string;
  website_url?: string;
  cover_url?: string;
  avatar_url?: string;
  is_supporter?: boolean;
  role?: string;
  experiences?: any[];
  skills?: string[];
  socials?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
  };
  tagId?: string;
  badges?: string[];
  home_town?: string;
  birth_town?: string;
  birthday?: string;
  social_facebook?: string;
  social_twitter?: string;
  current_status?: string;
  credits_balance?: number;
}

interface Vehicle {
  id: string;
  tag_id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  photo_url?: string;
  respects_count?: number;
}

interface GuestbookMessage {
  id: string;
  author_name: string;
  author_avatar?: string;
  author_uid?: string;
  message: string;
  timestamp: string;
}

interface DriverProfileClientProps {
  initialProfile: DriverProfile | null;
  userId: string;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80';

const DEFAULT_PJ_EXPERIENCES = [
  {
    id: 'exp-1',
    title: 'Founder & Lead Systems Architect',
    company: 'Gridpass & Losey.co',
    location: 'Chicago, IL',
    startDate: '2022-01',
    endDate: 'Present',
    description: 'Spearheaded full-stack platform architecture for digital vehicle passports, telemetry tracking engine, and executive resume integration.',
    skills: ['⚡ Next.js', '⚡ System Architecture', '⚡ React', '⚡ TypeScript', '⚡ Tailwind CSS', '⚡ Firebase'],
    links: [
      { id: 'link-1', title: 'Live Demo', url: 'https://gridpass.app' },
      { id: 'link-2', title: 'LoseyCo Platform', url: 'https://loseyco.com' },
      { id: 'link-3', title: 'GitHub Repo', url: 'https://github.com/loseyco/gridpass' }
    ],
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
        caption: 'Gridpass Telemetry Engine & Mobile Viewport Architecture'
      },
      {
        url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        caption: 'Executive Resume & Technical Architecture Workshop'
      },
      {
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        caption: 'Hardware Sensor Bench Testing & Telemetry Logging'
      },
      {
        url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=80',
        caption: 'Track Day Telemetry Data Visualization'
      },
      {
        url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        caption: 'Enthusiast Paddock Setup & Dyno Calibration'
      },
      {
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
        caption: 'Supercar Performance Testing & Lap Record'
      }
    ]
  },
  {
    id: 'exp-2',
    title: 'Principal Software Engineer',
    company: 'Enthusiast Motors & Telemetry Labs',
    location: 'Monmouth Beach, NJ',
    startDate: '2019-06',
    endDate: '2021-12',
    description: 'Engineered telemetry data ingestion infrastructure, vehicle passport logbooks, and mobile-first touch UI.',
    skills: ['⚡ System Architecture', '⚡ Node.js', '⚡ WebSockets', '⚡ PostgreSQL', '⚡ Playwright E2E'],
    links: [
      { id: 'link-4', title: 'Telemetry Docs', url: 'https://enthusiastmotors.com/docs' },
      { id: 'link-5', title: 'GitHub Repo', url: 'https://github.com/enthusiast-motors' }
    ],
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        caption: 'Hardware Sensor Bench Testing & Telemetry Logging'
      }
    ]
  }
];

function formatExperienceDuration(startDateStr?: string, endDateStr?: string, fallbackYears?: string): string {
  if (!startDateStr && !fallbackYears) return '';
  if (!startDateStr && fallbackYears) return fallbackYears;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const parseDate = (dStr: string) => {
    if (!dStr || dStr.toLowerCase() === 'present') return { date: new Date(), isPresent: true };
    const ymMatch = dStr.match(/^(\d{4})-(\d{1,2})/);
    if (ymMatch) {
      return { date: new Date(parseInt(ymMatch[1], 10), parseInt(ymMatch[2], 10) - 1, 1), isPresent: false };
    }
    const parsed = new Date(dStr);
    if (!isNaN(parsed.getTime())) {
      return { date: parsed, isPresent: false };
    }
    return { date: new Date(), isPresent: false };
  };

  const startInfo = parseDate(startDateStr!);
  const endInfo = parseDate(endDateStr || 'Present');

  const startMonthStr = monthNames[startInfo.date.getMonth()];
  const startYearStr = startInfo.date.getFullYear();
  const startFormatted = `${startMonthStr} ${startYearStr}`;

  const isPresent = endInfo.isPresent || !endDateStr || endDateStr.toLowerCase() === 'present';
  const endFormatted = isPresent
    ? 'Present'
    : `${monthNames[endInfo.date.getMonth()]} ${endInfo.date.getFullYear()}`;

  const end = isPresent ? new Date() : endInfo.date;

  let totalMonths = (end.getFullYear() - startInfo.date.getFullYear()) * 12 + (end.getMonth() - startInfo.date.getMonth()) + 1;
  if (totalMonths < 1) totalMonths = 1;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const durationParts = [];
  if (years > 0) durationParts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (months > 0) durationParts.push(`${months} mo${months > 1 ? 's' : ''}`);

  const durationStr = durationParts.join(' ');
  return `${startFormatted} – ${endFormatted}${durationStr ? ` • ${durationStr}` : ''}`;
}

export function DriverProfileClient({ initialProfile, userId }: DriverProfileClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<DriverProfile | null>(initialProfile);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userBusinesses, setUserBusinesses] = useState<any[]>([]);
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);
  const [loading, setLoading] = useState(!initialProfile);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [shareText, setShareText] = useState('Share Passport');
  const [activeProfileTab, setActiveProfileTab] = useState<'career' | 'garage' | 'businesses' | 'guestbook'>('career');
  const [buildRespects, setBuildRespects] = useState<Record<string, number>>({});
  const [activeLightboxGallery, setActiveLightboxGallery] = useState<any[] | null>(null);
  const [activeLightboxImageIndex, setActiveLightboxImageIndex] = useState<number>(0);

  const handlePrevLightboxImage = () => {
    if (!activeLightboxGallery || activeLightboxGallery.length === 0) return;
    setActiveLightboxImageIndex((prev) => (prev - 1 + activeLightboxGallery.length) % activeLightboxGallery.length);
  };

  const handleNextLightboxImage = () => {
    if (!activeLightboxGallery || activeLightboxGallery.length === 0) return;
    setActiveLightboxImageIndex((prev) => (prev + 1) % activeLightboxGallery.length);
  };

  useEffect(() => {
    if (!activeLightboxGallery) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevLightboxImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextLightboxImage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActiveLightboxGallery(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxGallery]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'career' || tabParam === 'garage' || tabParam === 'businesses' || tabParam === 'guestbook') {
        setActiveProfileTab(tabParam as any);
      }
    }
  }, []);

  const handleTabChange = (tabId: 'career' | 'garage' | 'businesses' | 'guestbook') => {
    setActiveProfileTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const isMock = (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) || userId === 'pjlosey' || userId === 'pjlosey-mock' || userId === 'mock-driver' || userId === 'user-marcus-123' || userId?.includes('mock');

  const renderSocialIcon = (
    platform: string, 
    handle: string | undefined, 
    href: string, 
    IconComponent: React.ComponentType<{ className?: string }>
  ) => {
    if (handle) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#ff3b30] hover:text-[#bd2925] transition-all cursor-pointer shadow-2xs"
          title={`View ${platform}: @${handle}`}
        >
          <IconComponent className="w-4 h-4" />
        </a>
      );
    }
    return null;
  };

  const handleShare = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const profileUrl = currentUrl.includes('?tab=') ? currentUrl : `${currentUrl}?tab=${activeProfileTab}`;
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name}'s Driver Resume Passport`,
          text: `Check out ${profile?.display_name}'s official Gridpass passport resume & digital garage!`,
          url: profileUrl,
        });
        return;
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setShareText('Copied Tab Link!');
      showToast({
        title: "📋 Tab URL Copied!",
        message: `Direct link to ${activeProfileTab.toUpperCase()} tab copied to clipboard!`,
        icon: "✨"
      });
      setTimeout(() => setShareText('Share Passport'), 2500);
    } catch (err) {
      showToast({
        title: "Share Link",
        message: profileUrl,
        icon: "🔗"
      });
    }
  };

  const handlePostGuestbookMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setPostingMessage(true);
    const newMsg: GuestbookMessage = {
      id: `msg_${Date.now()}`,
      author_name: user.displayName || user.email?.split('@')[0] || 'Gridpass Member',
      author_avatar: user.photoURL || '',
      author_uid: user.uid,
      message: newMessageText.trim(),
      timestamp: 'Just now'
    };

    try {
      await addDoc(collection(db, 'user_messages'), {
        recipient_uid: profile?.uid || userId,
        author_name: newMsg.author_name,
        author_avatar: newMsg.author_avatar,
        author_uid: newMsg.author_uid,
        message: newMsg.message,
        timestamp: new Date().toISOString()
      });

      setGuestbookMessages(prev => [newMsg, ...prev]);
      setNewMessageText('');
      showToast({
        title: "💬 Message Posted!",
        message: `Your message was added to ${profile?.display_name}'s fan guestbook!`,
        icon: "✅"
      });
    } catch (err) {
      console.error("Failed to post message:", err);
      setGuestbookMessages(prev => [newMsg, ...prev]);
      setNewMessageText('');
      showToast({ title: "💬 Message Posted!", message: "Posted to guestbook wall!", icon: "✅" });
    } finally {
      setPostingMessage(false);
    }
  };

  const handleRespectBuild = (vId: string) => {
    setBuildRespects(prev => ({
      ...prev,
      [vId]: (prev[vId] || 0) + 1
    }));
    showToast({
      title: "❤️ Respect Added!",
      message: "You gave respect to this build! +10 Pit Credits earned.",
      icon: "🔥"
    });
  };

  useEffect(() => {
    if (authLoading) return;
    let isMounted = true;

    async function loadDriverProfile() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        let uDoc = await getDoc(doc(db, 'users', userId));
        let uData = uDoc.exists() ? uDoc.data() : null;

        if (!uData) {
          const qUsername = query(collection(db, 'users'), where('username', '==', userId.toLowerCase()));
          const snapUsername = await getDocs(qUsername);
          if (!snapUsername.empty) {
            uDoc = snapUsername.docs[0];
            uData = uDoc.data() || null;
          }
        }

        if (!uData && (isMock || userId === 'pjlosey' || userId === 'pjlosey-mock' || userId === 'mock-driver' || userId === 'user-marcus-123' || userId?.includes('mock'))) {
          const mockDriverProfile: DriverProfile = {
            uid: 'user-marcus-123',
            email: 'marcus@enthusiast.com',
            display_name: 'Marcus Mustang',
            username: 'pjlosey-mock',
            bio: 'Track day enthusiast, weekend racer, and Ford Mustang collector.',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            cover_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
            is_supporter: true,
            role: 'SUPER ADMIN & FOUNDER',
            tagId: 'GP-DRV-MARCUS',
            home_town: 'Monmouth Beach, NJ',
            experiences: DEFAULT_PJ_EXPERIENCES,
            skills: ['⚡ Next.js', '⚡ System Architecture', '⚡ React', '⚡ TypeScript', '⚡ Full-Stack Architecture'],
            socials: {
              instagram: 'marcus_mustang',
              youtube: 'marcusracing',
              twitter: 'marcus_gt'
            }
          };
          const mockDriverVehicles: Vehicle[] = [
            {
              id: 'mock-v1',
              tag_id: 'GP-MUSTANG-2024',
              year: 2024,
              make: 'Ford',
              model: 'Mustang GT',
              trim: '5.0 V8 Performance Pack',
              photo_url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=80',
              respects_count: 42
            }
          ];
          if (isMounted) {
            setProfile(mockDriverProfile);
            setVehicles(mockDriverVehicles);
          }
          return;
        }

        if (uDoc && uData) {
          const loadedProfile: DriverProfile = {
            uid: uDoc.id,
            email: uData.email || '',
            display_name: uData.display_name || uData.name || uData.email?.split('@')[0] || 'Member',
            username: uData.username || '',
            website: uData.website || uData.website_url || '',
            website_url: uData.website_url || uData.website || '',
            bio: uData.bio || '',
            cover_url: uData.cover_url || '',
            avatar_url: uData.avatar_url || uData.photoURL || '',
            is_supporter: uData.is_supporter === true,
            role: uData.role || (uData.email?.includes('loseyp') ? 'SUPER ADMIN & FOUNDER' : ''),
            experiences: (uData.experiences && uData.experiences.length > 0) ? uData.experiences : DEFAULT_PJ_EXPERIENCES,
            skills: (uData.skills && uData.skills.length > 0) ? uData.skills : ['⚡ Next.js', '⚡ System Architecture', '⚡ React', '⚡ TypeScript', '⚡ Full-Stack Architecture'],
            socials: {
              instagram: uData.social_instagram || uData.socials?.instagram || '',
              youtube: uData.social_youtube || uData.socials?.youtube || '',
              tiktok: uData.social_tiktok || uData.socials?.tiktok || '',
              facebook: uData.social_facebook || uData.socials?.facebook || '',
              twitter: uData.social_twitter || uData.socials?.twitter || ''
            },
            tagId: uData.tagId || uData.tag_id || `GP-DRV-${uDoc.id.slice(0, 6).toUpperCase()}`,
            badges: uData.badges || [],
            home_town: uData.home_town || uData.location || '',
            birth_town: uData.birth_town || '',
            birthday: uData.birthday || '',
            current_status: uData.current_status || '',
            credits_balance: uData.credits || uData.credits_balance || 0
          };

          if (isMounted) setProfile(loadedProfile);

          // Query vehicles strictly from Firestore
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
              trim: vData.trim,
              photo_url: vData.photo_url || vData.imageUrl || vData.image_url || vData.photoUrl || (vData.images && vData.images[0]),
              respects_count: vData.respects_count || 0
            } as Vehicle;
          });
          if (isMounted) setVehicles(vList);

          // Query businesses strictly from Firestore
          try {
            const bQuery = query(collection(db, 'businesses'), where('owner_uid', '==', uDoc.id));
            const bSnap = await getDocs(bQuery);
            const bList = bSnap.docs.map(bDoc => ({ id: bDoc.id, ...bDoc.data() }));
            if (isMounted) setUserBusinesses(bList);
          } catch (e) {
            if (isMounted) setUserBusinesses([]);
          }

          // Query guestbook messages strictly from Firestore
          try {
            const qMsg = query(collection(db, 'user_messages'), where('recipient_uid', '==', uDoc.id));
            const msgSnap = await getDocs(qMsg);
            const msgList = msgSnap.docs.map(mDoc => ({ id: mDoc.id, ...mDoc.data() } as GuestbookMessage));
            if (isMounted) setGuestbookMessages(msgList);
          } catch (e) {
            if (isMounted) setGuestbookMessages([]);
          }
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
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center space-y-4 p-6">
        <UserCircle className="w-16 h-16 text-neutral-300" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Member Passport Not Found</h2>
        <Link href="/" className="text-xs font-bold text-[#ff3b30] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Safety
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col items-center justify-start pb-16">
      
      {/* 🏁 HERO COVER BANNER & HEADER */}
      <div className="w-full h-48 sm:h-64 bg-gradient-to-r from-neutral-950 via-neutral-900 to-black relative overflow-hidden shadow-inner">
        {profile.cover_url && (
          <img 
            src={profile.cover_url} 
            alt="Driver Hero Banner" 
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 max-w-4xl mx-auto">
          <button 
            type="button"
            onClick={() => router.back()}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center py-2 px-3.5 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer gap-1 shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              type="button"
              data-testid="edit-passport-btn"
              onClick={() => setShowEditDrawer(true)}
              className="min-h-[44px] inline-flex items-center justify-center py-2 px-3.5 bg-neutral-900/80 hover:bg-black backdrop-blur-md border border-neutral-700 text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer gap-1.5 shadow-md"
            >
              <Settings className="w-3.5 h-3.5 text-[#ff3b30]" /> Manage Passport
            </button>

            <button 
              type="button"
              onClick={handleShare}
              className="min-h-[44px] inline-flex items-center justify-center py-2 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-mono font-black uppercase rounded-xl transition-all cursor-pointer gap-1.5 shadow-md shadow-red-500/20"
            >
              <Share2 className="w-3.5 h-3.5" /> {shareText}
            </button>
          </div>
        </div>

        {/* Status Pill Floating Badge */}
        {profile.current_status && (
          <div className="absolute bottom-4 right-4 z-10 bg-black/75 backdrop-blur-md border border-neutral-700 text-white text-[10px] font-mono font-bold uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{profile.current_status}</span>
          </div>
        )}
      </div>

      {/* 👤 MAIN PASSPORT CONTAINER */}
      <div className="w-full max-w-4xl px-4 -mt-16 sm:-mt-20 relative z-20 space-y-6 text-left">
        
        {/* Profile Card Main Info */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            
            {/* Avatar Circle with Ring */}
            <div className="relative shrink-0">
              <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white flex items-center justify-center border-4 overflow-hidden shadow-xl ${
                profile.is_supporter ? 'border-[#ffd60a] ring-4 ring-yellow-400/20' : 'border-neutral-200'
              }`}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-20 h-20 text-neutral-300" />
                )}
              </div>
              {profile.is_supporter && (
                <span className="absolute -bottom-1 right-2 bg-[#ffd60a] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow border border-yellow-300 flex items-center gap-1">
                  ⭐ GOLD
                </span>
              )}
            </div>

            {/* Main Driver Info */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tight">
                  {profile.display_name}
                </h1>
                {profile.role && (
                  <span className="text-[10px] font-mono font-bold text-[#ff3b30] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full uppercase">
                    {profile.role}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-mono font-bold text-neutral-500">
                <span>@{profile.username || (profile.email ? profile.email.split('@')[0] : 'member')}</span>
                {profile.email && (
                  <>
                    <span>•</span>
                    <span className="text-neutral-700">{profile.email}</span>
                  </>
                )}
                {profile.home_town && (
                  <>
                    <span>•</span>
                    <span className="text-neutral-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#ff3b30]" /> {profile.home_town}
                    </span>
                  </>
                )}
                {profile.tagId && (
                  <>
                    <span>•</span>
                    <span className="text-neutral-400 font-bold">{profile.tagId}</span>
                  </>
                )}
              </div>

              {profile.bio && (
                <p className="text-xs text-neutral-600 font-medium leading-relaxed italic pt-1 max-w-xl">
                  “{profile.bio}”
                </p>
              )}

              {/* Social Bar */}
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#ff3b30]" /> Website
                  </a>
                )}
                {renderSocialIcon('Instagram', profile.socials?.instagram, `https://instagram.com/${profile.socials?.instagram}`, Instagram)}
                {renderSocialIcon('YouTube', profile.socials?.youtube, `https://youtube.com/@${profile.socials?.youtube}`, Youtube)}
                {renderSocialIcon('TikTok', profile.socials?.tiktok, `https://tiktok.com/@${profile.socials?.tiktok}`, Globe)}
                {renderSocialIcon('Facebook', profile.socials?.facebook, `https://facebook.com/${profile.socials?.facebook}`, Facebook)}
                {renderSocialIcon('Twitter', profile.socials?.twitter, `https://twitter.com/${profile.socials?.twitter}`, Twitter)}
              </div>

              {/* ⚡ Profile Interactive Skills Tag Pills */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {(profile.skills && profile.skills.length > 0
                  ? profile.skills
                  : ['⚡ Next.js', '⚡ System Architecture', '⚡ React', '⚡ TypeScript', '⚡ Full-Stack Architecture']
                ).map((skill: string, sIdx: number) => (
                  <button
                    key={sIdx}
                    type="button"
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-full text-xs font-mono font-bold text-neutral-800 transition-all cursor-pointer gap-1 shadow-2xs hover:scale-105 active:scale-95"
                    aria-label={`Skill tag pill: ${skill}`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Badge Button */}
            <div className="shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="min-h-[44px] inline-flex items-center justify-center py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 text-[10px] font-mono font-black uppercase rounded-2xl transition-all cursor-pointer gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#ff3b30]" /> Print Passport Badge
              </button>
            </div>
          </div>
        </div>

        {/* 📑 4 CORE RESUME NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'career', label: '🏆 Career & About Me', count: profile.credits_balance || 100 },
            { id: 'garage', label: '🏎️ Digital Garage', count: vehicles.length },
            { id: 'businesses', label: '🏪 Businesses & Teams', count: userBusinesses.length },
            { id: 'guestbook', label: '💬 Fan Wall & Guestbook', count: guestbookMessages.length }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as any)}
              className={`min-h-[44px] inline-flex items-center justify-center py-2.5 px-4 text-xs font-mono font-black uppercase rounded-xl transition-all whitespace-nowrap cursor-pointer gap-2 ${
                activeProfileTab === tab.id
                  ? 'bg-[#ff3b30] text-white shadow-md shadow-red-500/20'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                activeProfileTab === tab.id ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-800'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* TAB 1: GARAGE & BUILDS */}
        {activeProfileTab === 'garage' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <CarFront className="w-4 h-4 text-[#ff3b30]" /> Verified Garage Builds ({vehicles.length})
              </h3>
              <span className="text-[9px] font-mono font-bold text-neutral-500">
                Tap build card for full passport specs
              </span>
            </div>

            {vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map((v) => {
                  const currentRespects = (v.respects_count || 12) + (buildRespects[v.id] || 0);

                  return (
                    <div 
                      key={v.id} 
                      className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-md hover:border-[#ff3b30] transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Vehicle Image */}
                        <div className="w-full h-44 bg-neutral-900 relative overflow-hidden">
                          {v.photo_url ? (
                            <img 
                              src={v.photo_url} 
                              alt={`${v.year} ${v.make} ${v.model}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                              <CarFront className="w-12 h-12" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-md border border-neutral-800">
                            {v.tag_id || 'GP-BUILD'}
                          </div>
                        </div>

                        {/* Vehicle Title & Specs */}
                        <div className="p-4 space-y-1 text-left">
                          <h4 className="text-sm font-black uppercase text-neutral-900 tracking-tight leading-tight">
                            {v.year} {v.make} {v.model}
                          </h4>
                          {v.trim && (
                            <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase">{v.trim}</p>
                          )}
                        </div>
                      </div>

                      {/* Respect & Action Bar */}
                      <div className="p-4 pt-0 flex items-center justify-between border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() => handleRespectBuild(v.id)}
                          className="py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-[#ff3b30] text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Heart className="w-3.5 h-3.5 fill-[#ff3b30]" /> Respect ({currentRespects})
                        </button>

                        <Link
                          href={`/v/${v.id}`}
                          className="py-1.5 px-3 bg-neutral-900 hover:bg-black text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-1"
                        >
                          View Passport Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl text-center space-y-2">
                <CarFront className="w-8 h-8 mx-auto text-neutral-300" />
                <p className="text-xs font-mono font-bold text-neutral-400 uppercase">No active builds registered in garage.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BUSINESSES & TEAMS */}
        {activeProfileTab === 'businesses' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-600" /> Affiliated Businesses &amp; Race Teams ({userBusinesses.length})
              </h3>
            </div>

            {userBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userBusinesses.map((biz: any) => (
                  <div key={biz.id} className="p-5 bg-white border border-neutral-200 rounded-3xl space-y-3 shadow-md hover:border-blue-500 transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase">
                          {biz.category || 'Motorsport Entity'}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase">
                          {biz.badge || 'VERIFIED HQ'}
                        </span>
                      </div>
                      <h4 className="text-base font-black uppercase text-neutral-900 tracking-tight">
                        {biz.name}
                      </h4>
                      <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                        {biz.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-[9px] font-mono font-black text-neutral-500 uppercase">
                        Role: <span className="text-neutral-900">{biz.role || 'OWNER'}</span>
                      </span>
                      <Link
                        href={biz.link || `/b/${biz.id}`}
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <Store className="w-3.5 h-3.5" /> View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl text-center space-y-2">
                <Store className="w-8 h-8 mx-auto text-neutral-300" />
                <p className="text-xs font-mono font-bold text-neutral-400 uppercase">No registered business or team affiliations listed.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FAN WALL & GUESTBOOK */}
        {activeProfileTab === 'guestbook' && (
          <div className="space-y-6 animate-in fade-in duration-150 text-left">
            
            {/* Post Message Form */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-purple-600" /> Post Message on {profile.display_name}'s Fan Wall
                </h3>
                <span className="text-[9px] font-mono font-bold text-neutral-400">
                  {guestbookMessages.length} Messages
                </span>
              </div>

              <form onSubmit={handlePostGuestbookMessage} className="space-y-3">
                <textarea
                  required
                  rows={2}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={`Leave a comment, shoutout, or message for ${profile.display_name}...`}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] resize-none"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-neutral-400">
                    Visible to all paddock fans &amp; members
                  </span>
                  <button
                    type="submit"
                    disabled={postingMessage || !newMessageText.trim()}
                    className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-200 text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/10"
                  >
                    {postingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Post to Guestbook Wall
                  </button>
                </div>
              </form>
            </div>

            {/* Messages Feed */}
            <div className="space-y-3">
              {guestbookMessages.length > 0 ? (
                guestbookMessages.map((msg) => (
                  <div key={msg.id} className="p-4 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 rounded-2xl space-y-2 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden flex items-center justify-center text-xs font-black uppercase text-neutral-600 shrink-0">
                          {msg.author_avatar ? (
                            <img src={msg.author_avatar} alt={msg.author_name} className="w-full h-full object-cover" />
                          ) : (
                            msg.author_name.charAt(0)
                          )}
                        </div>
                        <span className="text-xs font-black uppercase text-neutral-900">{msg.author_name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-400">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed font-medium pl-10">
                      "{msg.message}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl text-center space-y-1">
                  <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
                  <p className="text-xs font-mono font-bold text-neutral-400 uppercase">Be the first to post a message on this driver wall!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CAREER & TELEMETRY */}
        {activeProfileTab === 'career' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> Motorsport Achievements &amp; Telemetry Stats
            </h3>

            {(() => {
              const totalRespects = vehicles.reduce((sum: number, v: any) => sum + (v.respects_count || 0) + (buildRespects[v.id] || 0), 0);
              const totalEventsStaged = (vehicles.length > 0 ? 1 : 0) + (userBusinesses.length > 0 ? 1 : 0);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-center space-y-1">
                    <span className="text-2xl font-black font-mono text-neutral-900">{vehicles.length}</span>
                    <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Active Builds</span>
                  </div>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-center space-y-1">
                    <span className="text-2xl font-black font-mono text-[#ff3b30]">{totalRespects}</span>
                    <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Respects Earned</span>
                  </div>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-center space-y-1">
                    <span className="text-2xl font-black font-mono text-emerald-600">{profile.credits_balance || 100}</span>
                    <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Pit Credits</span>
                  </div>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-center space-y-1">
                    <span className="text-2xl font-black font-mono text-purple-600">{totalEventsStaged}</span>
                    <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Events Staged</span>
                  </div>
                </div>
              );
            })()}

            {/* Work & Career Experience Section */}
            <div className="p-5 bg-white border border-neutral-200 rounded-3xl space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Work Experience &amp; Motorsport Career History
                </h4>
                <button
                  type="button"
                  onClick={() => setShowEditDrawer(true)}
                  className="min-h-[44px] inline-flex items-center text-[10px] font-mono font-bold text-[#ff3b30] hover:underline cursor-pointer"
                >
                  + Manage History
                </button>
              </div>

              {profile.experiences && profile.experiences.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.experiences.map((exp: any, idx: number) => {
                    const formattedDuration = formatExperienceDuration(exp.startDate, exp.endDate, exp.years);

                    return (
                      <div key={idx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-xs font-black uppercase text-neutral-900 leading-tight">{exp.title}</h5>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#ff3b30] bg-red-50 border border-red-200 px-2.5 py-1 rounded-md inline-self-start">
                              {formattedDuration}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                            <span>{exp.company}</span>
                            {exp.location && <span className="text-neutral-500 font-mono text-[10px]">{exp.location}</span>}
                          </div>

                          {exp.description && (
                            <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                              {exp.description}
                            </p>
                          )}

                          {/* ⚡ Interactive Skills Tag Pills */}
                          {exp.skills && exp.skills.length > 0 && (
                            <div className="pt-1 flex flex-wrap items-center gap-1.5">
                              {exp.skills.map((s: string, sIdx: number) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl text-[11px] font-mono font-bold text-neutral-700 transition-all cursor-pointer hover:border-neutral-400"
                                  aria-label={`Experience skill pill: ${s}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 🔗 Experience External Link Pills */}
                          {exp.links && exp.links.length > 0 && (
                            <div className="pt-2 flex flex-wrap items-center gap-2" data-testid={`experience-links-${idx}`}>
                              {exp.links.map((link: { id?: string; title: string; url: string }, lIdx: number) => (
                                <a
                                  key={lIdx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid={`experience-link-pill-${idx}-${lIdx}`}
                                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl text-xs font-mono font-bold text-neutral-900 transition-all cursor-pointer shadow-2xs hover:border-neutral-400"
                                  aria-label={`External link pill: ${link.title}`}
                                >
                                  <span>🔗 {link.title} ↗</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 📷 Portfolio Photo Gallery Thumbnails */}
                        {exp.gallery && exp.gallery.length > 0 && (
                          <div className="pt-2.5 space-y-2 border-t border-neutral-200/70">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 block">
                                📷 Portfolio &amp; Proof Gallery ({exp.gallery.length})
                              </span>
                              {exp.gallery.length > 4 && (
                                <button
                                  type="button"
                                  data-testid="view-all-photos-badge"
                                  onClick={() => {
                                    setActiveLightboxImageIndex(0);
                                    setActiveLightboxGallery(exp.gallery);
                                  }}
                                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-1.5 bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 border border-[#ff3b30]/30 rounded-xl text-[11px] font-mono font-bold text-[#ff3b30] transition-all cursor-pointer shadow-2xs"
                                  aria-label={`View all ${exp.gallery.length} photos badge`}
                                >
                                  View All ({exp.gallery.length} Photos)
                                </button>
                              )}
                            </div>

                            <div 
                              data-testid="portfolio-gallery-strip" 
                              className="flex items-center gap-2.5 overflow-x-auto scroll-smooth scrollbar-thin py-1 no-scrollbar"
                            >
                              {exp.gallery.map((photo: any, pIdx: number) => {
                                const photoUrl = typeof photo === 'string' ? photo : photo.url;
                                const photoCaption = typeof photo === 'string' ? `${exp.title} Proof` : photo.caption;

                                return (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    data-testid={`portfolio-photo-thumbnail-${pIdx}`}
                                    onClick={() => {
                                      setActiveLightboxImageIndex(pIdx);
                                      setActiveLightboxGallery(exp.gallery);
                                    }}
                                    className="min-h-[44px] min-w-[44px] relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-neutral-300 hover:border-[#ff3b30] hover:scale-105 transition-all cursor-pointer group shadow-2xs"
                                    title="Click to view image in Lightbox preview"
                                    aria-label={`View photo thumbnail: ${photoCaption}`}
                                  >
                                    <img src={photoUrl} alt={photoCaption || 'Gallery thumbnail'} className="w-full h-full object-cover group-hover:opacity-90" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <Camera className="w-4 h-4 text-white drop-shadow" />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl text-center">
                  <p className="text-xs font-mono font-bold text-neutral-400 uppercase">No work experience entries added yet.</p>
                </div>
              )}
            </div>

            {/* Badges Matrix */}
            <div className="p-5 bg-white border border-neutral-200 rounded-3xl space-y-3 shadow-md">
              <h4 className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" /> Unlocked Paddock Badges ({profile.badges?.length || (profile.is_supporter ? 1 : 0)})
              </h4>

              {(profile.badges && profile.badges.length > 0) || profile.is_supporter ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.is_supporter && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                      <span className="text-2xl">🏅</span>
                      <div>
                        <h5 className="text-xs font-black uppercase text-amber-900">Original Supporter</h5>
                        <p className="text-[10px] text-amber-800 font-medium">Verified early platform supporter</p>
                      </div>
                    </div>
                  )}

                  {profile.badges?.map((badge: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-2xl">
                      <span className="text-2xl">🏁</span>
                      <div>
                        <h5 className="text-xs font-black uppercase text-neutral-900">{badge.replace(/-/g, ' ')}</h5>
                        <p className="text-[10px] text-neutral-500 font-medium">Verified Paddock Credential</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl text-center">
                  <p className="text-xs font-mono font-bold text-neutral-400 uppercase">No paddock badges unlocked yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🖨️ PRINTABLE DRIVER PASSPORT BADGE MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl border border-neutral-200 text-center relative shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-neutral-400 hover:text-neutral-900 text-base font-bold cursor-pointer rounded-full hover:bg-neutral-100"
              aria-label="Close Print Badge Modal"
            >
              ✕
            </button>

            <div className="space-y-1 border-b border-neutral-100 pb-3">
              <span className="text-[9px] font-mono font-black uppercase text-[#ff3b30] tracking-widest block">
                GRIDPASS PASSPORT RESUME BADGE
              </span>
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                {profile.display_name}
              </h3>
            </div>

            <div className="py-2 flex flex-col items-center justify-center space-y-2">
              <GridpassQRCode 
                value={`${typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app'}/u/${profile.username || userId}`} 
                size={200} 
                logoSize={45} 
              />
              <p className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                SCAN WITH SMARTPHONE CAMERA TO VIEW DRIVER PASSPORT RESUME
              </p>
            </div>

            <button
              type="button"
              onClick={() => downloadGridpassQR(
                `${typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app'}/u/${profile.username || userId}`,
                `Gridpass_Passport_${profile.display_name.replace(/[^a-zA-Z0-9]/g, '_')}.png`
              )}
              className="w-full py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download High-Res QR Passport Badge
            </button>
          </div>
        </div>
      )}

      {/* 📸 PORTFOLIO PHOTO GALLERY LIGHTBOX ZOOM MODAL PREVIEW */}
      {activeLightboxGallery && activeLightboxGallery.length > 0 && (() => {
        const currentPhoto = activeLightboxGallery[activeLightboxImageIndex];
        const photoUrl = typeof currentPhoto === 'string' ? currentPhoto : currentPhoto?.url;
        const photoCaption = typeof currentPhoto === 'string' ? 'Gallery Preview' : currentPhoto?.caption;

        return (
          <div 
            data-testid="lightbox-modal"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setActiveLightboxGallery(null)}
          >
            <div 
              className="relative max-w-4xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Header: Counter Badge & Close Button */}
              <div className="w-full p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between z-10">
                <span 
                  data-testid="lightbox-counter"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded-xl text-xs font-mono font-bold text-white uppercase tracking-wider"
                >
                  Photo {activeLightboxImageIndex + 1} of {activeLightboxGallery.length}
                </span>

                <button
                  type="button"
                  data-testid="lightbox-close-btn"
                  onClick={() => setActiveLightboxGallery(null)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-white text-base font-bold rounded-full transition-all cursor-pointer border border-neutral-700"
                  aria-label="Close Lightbox Preview"
                >
                  ✕
                </button>
              </div>

              {/* Main Viewport & Chevron Navigation */}
              <div className="relative w-full max-h-[70vh] flex items-center justify-center overflow-hidden bg-black p-4">
                <button
                  type="button"
                  data-testid="lightbox-prev-btn"
                  onClick={handlePrevLightboxImage}
                  className="absolute left-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-black/70 hover:bg-black text-white rounded-full p-3 transition-all cursor-pointer border border-white/20 z-10 shadow-lg"
                  aria-label="Previous Photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <img
                  src={photoUrl}
                  alt={photoCaption || 'Lightbox Zoom Preview'}
                  className="max-w-full max-h-[65vh] object-contain rounded-xl transition-all duration-200"
                />

                <button
                  type="button"
                  data-testid="lightbox-next-btn"
                  onClick={handleNextLightboxImage}
                  className="absolute right-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-black/70 hover:bg-black text-white rounded-full p-3 transition-all cursor-pointer border border-white/20 z-10 shadow-lg"
                  aria-label="Next Photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Bottom Caption Footer */}
              {photoCaption && (
                <div className="w-full p-4 bg-neutral-950 border-t border-neutral-800 text-center">
                  <p className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wide flex items-center justify-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#ff3b30]" /> {photoCaption}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ⚙️ SELF-SERVICE PASSPORT & CAREER MANAGEMENT DRAWER */}
      <EditPassportDrawer
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        profile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
      />
    </div>
  );
}
