'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { 
  Instagram, Youtube, Compass, MapPin, 
  CarFront, Loader2, ArrowLeft, Heart, ShieldCheck, Printer, Sparkles, UserCircle,
  Facebook, Twitter, Globe, Share2
} from 'lucide-react';

interface DriverProfile {
  uid: string;
  email: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  is_supporter?: boolean;
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
}

interface Vehicle {
  id: string;
  tag_id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  photo_url?: string;
}

interface DriverProfileClientProps {
  initialProfile: DriverProfile | null;
  userId: string;
}

export function DriverProfileClient({ initialProfile, userId }: DriverProfileClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<DriverProfile | null>(initialProfile);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(!initialProfile);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [shareText, setShareText] = useState('Share Profile');

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

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
          className="w-10 h-10 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 flex items-center justify-center text-[#ff3b30] hover:text-[#bd2925] transition-all cursor-pointer shadow-sm hover:shadow"
          title={`View ${platform}: @${handle}`}
        >
          <IconComponent className="w-5 h-5" />
        </a>
      );
    }
    return (
      <div 
        className="w-10 h-10 rounded-xl bg-neutral-50/50 border border-neutral-100 flex items-center justify-center text-neutral-350 opacity-25 cursor-not-allowed"
        title={`${platform} not linked`}
      >
        <IconComponent className="w-5 h-5 text-neutral-400" />
      </div>
    );
  };

  const handleShare = async () => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name}'s Member Profile`,
          text: `Check out ${profile?.display_name}'s official Gridpass profile!`,
          url: profileUrl,
        });
        return;
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setShareText('Copied Link!');
      setTimeout(() => setShareText('Share Profile'), 2000);
    } catch (err) {
      console.error('Failed to copy profile link:', err);
    }
  };

  const handleBack = () => {
    const hasHistory = typeof document !== 'undefined' && document.referrer.includes(window.location.host);
    if (hasHistory) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handlePrint = () => {
    if (!profile) return;
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Badge - Gridpass</title>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: #ffffff;
                font-family: sans-serif;
              }
              .badge-container {
                text-align: center;
                max-width: 90%;
              }
              svg {
                width: 100%;
                max-width: 400px;
                height: auto;
              }
              .print-btn {
                margin-top: 20px;
                padding: 10px 20px;
                background: #ff3b30;
                color: #ffffff;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                text-transform: uppercase;
              }
              @media print {
                .print-btn {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div className="badge-container">
              ${getBadgeSVGMarkup()}
              <br />
              <button className="print-btn" onclick="window.print()">Print Badge</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getBadgeSVGMarkup = () => {
    if (!profile) return '';
    const tagId = profile.tagId || `GP-DRV-${profile.uid.slice(0, 6).toUpperCase()}`;
    const qrRedirectUrl = `${window.location.origin}/qr/${tagId}`;
    const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrRedirectUrl)}`;
    const escapedQrCodeImgSrc = qrCodeImgSrc.replace(/&/g, '&amp;');
    const badgeTitle = profile.display_name;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <defs>
          <linearGradient id="mGrad" x1="60" y1="22" x2="60" y2="70" gradientUnits="userSpaceOnUse">
            <stop stop-color="#ff3b30" />
            <stop offset="1" stop-color="#1c1c1f" />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="290" height="290" rx="20" fill="none" stroke="#ff3b30" stroke-width="8"/>
        <rect x="20" y="20" width="260" height="260" rx="12" fill="none" stroke="#e5e5ea" stroke-width="2" stroke-dasharray="8,4"/>
        <image href="${escapedQrCodeImgSrc}" x="85" y="75" width="130" height="130"/>
        
        <rect x="134" y="124" width="32" height="32" rx="4" fill="#ffffff" />
        <g transform="translate(136, 126) scale(${28/120}, ${28/100})">
          <path d="M10 70 L42 22 L65 52 L88 28 L110 70 Z" fill="url(#mGrad)" stroke="#1c1c1f" stroke-width="6" stroke-linejoin="round" />
          <path d="M42 22 L52 42 M88 28 L98 48" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
          <path d="M18 86 C 48 86, 56 59, 96 59" stroke="#ff3b30" stroke-width="12" stroke-linecap="round" />
        </g>

        <text x="150" y="52" fill="#1c1c1f" font-family="sans-serif" font-size="16" font-weight="900" letter-spacing="4" text-anchor="middle">GRIDPASS</text>
        <text x="150" y="235" fill="#ff3b30" font-family="monospace" font-size="12" font-weight="bold" letter-spacing="2" text-anchor="middle">${tagId}</text>
        <text x="150" y="260" fill="#1c1c1f" font-family="sans-serif" font-size="12" font-weight="800" letter-spacing="1" text-anchor="middle">${badgeTitle}</text>
      </svg>
    `;
  };

  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadDriverProfile() {
      if (isMock) {
        await new Promise(r => setTimeout(r, 100));
        
        const mockProfile: DriverProfile = {
          uid: userId || 'user-marcus-123',
          email: 'marcus@enthusiast.com',
          display_name: 'Marcus Mustang',
          bio: 'Everyday track hobbyist, Mustang enthusiast, carbon enthusiast.',
          is_supporter: true,
          socials: {
            instagram: 'marcus_stang_gt',
            youtube: 'MarcusTrackDays',
            tiktok: 'marcus_gt'
          },
          home_town: 'Grayslake, IL',
          birth_town: 'Chicago, IL',
          birthday: '1990-06-15',
          tagId: 'GP-MARCUS-ID'
        };

        const mockVehicles: Vehicle[] = [
          {
            id: 'mock-v1',
            tag_id: 'GP-MARCUS-GT',
            year: 2024,
            make: 'Ford',
            model: 'Mustang GT',
            trim: 'Premium',
            photo_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
          }
        ];

        if (isMounted) {
          setProfile(mockProfile);
          setVehicles(mockVehicles);
          setLoading(false);
        }
        return;
      }

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

        if (!uData) {
          const qDisplayName = query(collection(db, 'users'), where('display_name', '==', userId.toUpperCase()));
          const snapDisplayName = await getDocs(qDisplayName);
          if (!snapDisplayName.empty) {
            uDoc = snapDisplayName.docs[0];
            uData = uDoc.data() || null;
          }
        }

        if (!uData) {
          const qEmail = query(
            collection(db, 'users'), 
            where('email', '>=', userId.toLowerCase() + '@'), 
            where('email', '<=', userId.toLowerCase() + '@\uf8ff')
          );
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            uDoc = snapEmail.docs[0];
            uData = uDoc.data() || null;
          }
        }

        if (uDoc && uData) {
          if (uDoc.id === userId && uData.username && uData.username !== userId) {
            router.replace(`/u/${uData.username}`);
            return;
          }

          const loadedProfile: DriverProfile = {
            uid: uDoc.id,
            email: uData.email || '',
            display_name: uData.display_name || uData.name || 'Anonymous Member',
            bio: uData.bio,
            avatar_url: uData.avatar_url,
            is_supporter: uData.is_supporter === true,
            socials: {
              instagram: uData.social_instagram || uData.socials?.instagram || '',
              youtube: uData.social_youtube || uData.socials?.youtube || '',
              tiktok: uData.social_tiktok || uData.socials?.tiktok || '',
              facebook: uData.social_facebook || uData.socials?.facebook || '',
              twitter: uData.social_twitter || uData.socials?.twitter || ''
            },
            tagId: uData.tagId || uData.tag_id || `GP-DRV-${uDoc.id.slice(0, 6).toUpperCase()}`,
            badges: uData.badges || [],
            home_town: uData.home_town || '',
            birth_town: uData.birth_town || '',
            birthday: uData.birthday || '',
            social_facebook: uData.social_facebook || '',
            social_twitter: uData.social_twitter || ''
          };

          if (isMounted) {
            console.log("[DriverProfile] Setting profile:", loadedProfile.uid, loadedProfile.display_name);
            setProfile(loadedProfile);
          }

          console.log("[DriverProfile] Querying vehicles for owner_id:", uDoc.id);
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
              photo_url: vData.photo_url || vData.imageUrl || vData.image_url || vData.photoUrl || (vData.images && vData.images[0])
            } as Vehicle;
          });

          console.log("[DriverProfile] Loaded vehicles count:", vList.length, vList.map(v => v.make + " " + v.model));
          if (isMounted) setVehicles(vList);
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
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Member Profile Not Found</h2>
        <Link href="/" className="text-xs font-bold text-[#ff3b30] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Safety
        </Link>
      </div>
    );
  }

  const showE2EGarage = true;

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Breadcrumb & Sharing Header */}
        <div className="flex items-center justify-end w-full">
          <button 
            onClick={handleShare}
            className="text-[10px] font-mono font-bold text-[#ff3b30] hover:text-[#bd2925] flex items-center gap-1.5 uppercase transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> {shareText}
          </button>
        </div>

        {/* Unified Profile Info Card */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 text-center space-y-6">
          
          {/* Avatar and Support Border */}
          <div className="relative inline-block mx-auto">
            <div className={`w-24 h-24 rounded-full bg-white flex items-center justify-center text-neutral-400 border-2 overflow-hidden ${
              profile.is_supporter ? 'border-[#ffd60a] gold-glow-ring' : 'border-neutral-200'
            }`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-16 h-16 text-neutral-300" />
              )}
            </div>
            {profile.is_supporter && (
              <span className="absolute bottom-0 right-0 bg-[#ffd60a] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                GOLD
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">{profile.display_name}</h2>
            <span className="text-[10px] font-mono font-bold text-neutral-455 uppercase tracking-widest block">{profile.email}</span>
          </div>

          {profile.bio && (
            <p className="text-xs text-neutral-600 leading-relaxed font-semibold italic max-w-md mx-auto pt-3 border-t border-neutral-100">
              “{profile.bio}”
            </p>
          )}

          {/* Social Channels */}
          <div className="flex justify-center gap-3">
            {renderSocialIcon('Instagram', profile.socials?.instagram, `https://instagram.com/${profile.socials?.instagram}`, Instagram)}
            {renderSocialIcon('YouTube', profile.socials?.youtube, `https://youtube.com/@${profile.socials?.youtube}`, Youtube)}
            {renderSocialIcon('TikTok', profile.socials?.tiktok, `https://tiktok.com/@${profile.socials?.tiktok}`, Globe)}
            {renderSocialIcon(
              'Facebook', 
              profile.socials?.facebook, 
              profile.socials?.facebook?.startsWith('http') ? profile.socials.facebook : `https://facebook.com/${profile.socials?.facebook}`, 
              Facebook
            )}
            {renderSocialIcon('Twitter', profile.socials?.twitter, `https://twitter.com/${profile.socials?.twitter}`, Twitter)}
          </div>

        </div>

        {/* Member Profile Details Section */}
        {(profile.home_town || profile.birth_town || profile.birthday) && (
          <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-3xl text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h4 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                Member Details
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              {profile.home_town && (
                <div>
                  <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Home Town</span>
                  <span className="font-bold text-neutral-900 uppercase">{profile.home_town}</span>
                </div>
              )}
              {profile.birth_town && (
                <div>
                  <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Birth Town</span>
                  <span className="font-bold text-neutral-900 uppercase">{profile.birth_town}</span>
                </div>
              )}
              {profile.birthday && (
                <div className="col-span-2">
                  <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Birthday</span>
                  <span className="font-bold text-neutral-900 uppercase">
                    {(() => {
                      try {
                        const d = new Date(profile.birthday + 'T00:00:00');
                        if (isNaN(d.getTime())) return profile.birthday;
                        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                      } catch {
                        return profile.birthday;
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Temporarily hidden Achievements and Share Driver Identity blocks
        <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-3xl space-y-3.5">
          <h4 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-4 h-4 text-[#ff3b30]" /> Unlocked Achievements
          </h4>
          <div className="space-y-2">
            {profile.is_supporter && (
              <div className="flex items-center gap-3 p-3 bg-[#ffd60a]/5 border border-[#ffd60a]/20 rounded-xl">
                <span className="text-xl">🏅</span>
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-600">Original Supporter</div>
                  <div className="text-[8px] text-neutral-400 mt-1">Backed Gridpass Launch</div>
                </div>
              </div>
            )}
            {profile.badges?.includes('ramp-scout') && (
              <div className="flex items-center gap-3 p-3 bg-emerald-550/5 border border-emerald-500/20 rounded-xl">
                <span className="text-xl">🛶</span>
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Ramp Scout</div>
                  <div className="text-[8px] text-neutral-400 mt-1">Verified public boat launch</div>
                </div>
              </div>
            )}
            {(!profile.is_supporter && (!profile.badges || profile.badges.length === 0)) && (
              <div className="text-center py-2 text-[9px] font-mono font-bold text-neutral-450 uppercase">
                No badges earned yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-3xl text-center space-y-3">
          <h4 className="text-[10px] font-mono font-bold text-neutral-900 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-500" /> Share Driver Identity
          </h4>
          <p className="text-[10px] text-neutral-500 leading-normal max-w-xs mx-auto">
            Generate your personal Gridpass QR Badge to display on decals or link on external bio cards.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Show QR Badge
            </button>
            <Link 
              href={`/build-tag?profileId=${profile.uid}&type=person`}
              className="py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-[10px] font-bold uppercase rounded-xl transition-colors flex items-center justify-center"
            >
              Decal Customizer
            </Link>
          </div>
        </div>
        */}

        {/* E2E Playwright Garage Verification Column */}
        {showE2EGarage && (
          <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h3 className="text-[10px] font-mono font-bold text-neutral-455 uppercase tracking-wider flex items-center gap-1.5">
                <CarFront className="w-4 h-4 text-[#ff3b30]" /> Pilot Digital Garage
              </h3>
              <span className="text-[8px] font-mono font-bold text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded-full uppercase">
                {vehicles.length} Active Builds
              </span>
            </div>

            <div className="space-y-3">
              {vehicles.map((v) => (
                <Link 
                  key={v.id} 
                  href={`/v/${v.id}`}
                  className="p-3 bg-white border border-neutral-200 rounded-2xl hover:border-[#ff3b30] transition-colors flex items-center gap-4 cursor-pointer animate-fade-in"
                >
                  {v.photo_url ? (
                    <img 
                      src={v.photo_url} 
                      alt={`${v.year} ${v.make} ${v.model}`} 
                      className="w-16 h-16 object-cover rounded-xl border border-neutral-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 flex-shrink-0">
                      <CarFront className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                      {v.tag_id}
                    </span>
                    <h4 className="text-xs font-black text-neutral-900 uppercase mt-0.5 leading-snug truncate">
                      {v.year} {v.make} {v.model} {v.trim && <span className="text-neutral-500 font-bold">{v.trim}</span>}
                    </h4>
                    <span className="text-[9px] font-bold text-[#ff3b30] uppercase mt-1 block">
                      View Passport Details
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
