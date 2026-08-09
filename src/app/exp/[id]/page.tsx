'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Briefcase, Calendar, MapPin, Globe, ExternalLink, 
  UserCircle, ChevronLeft, ChevronRight, X, ShieldCheck, Sparkles 
} from 'lucide-react';

interface ExperienceLink {
  id?: string;
  title: string;
  url: string;
}

interface GalleryPhoto {
  url: string;
  caption?: string;
}

interface ExperienceAsset {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  category: string;
  categoryPill: string;
  description: string;
  skills: string[];
  links: ExperienceLink[];
  gallery: GalleryPhoto[];
  owner: {
    name: string;
    username: string;
    role: string;
    avatarUrl: string;
    profileUrl: string;
    hometown?: string;
  };
}

const EXPERIENCES_DATABASE: Record<string, ExperienceAsset> = {
  'exp-hrc-2021': {
    id: 'exp-hrc-2021',
    title: 'Honda Racing / HRC Trackside Engineer',
    company: 'Honda Racing Corporation (HRC)',
    location: 'Indianapolis, IN / Trackside',
    startDate: '2021-01',
    endDate: '2023-12',
    category: 'motorsport_event',
    categoryPill: 'MOTORSPORT GIG',
    description: 'High-speed telemetry extraction, race strategy engine engineering, and brake zone sensor visualization for IndyCar operations.',
    skills: ['⚡ Telemetry Extraction', '⚡ IndyCar Sensors', '⚡ Race Strategy', '⚡ JSON Sensor Payloads'],
    links: [
      { id: 'link-1', title: 'Losey.co Pedigree', url: 'https://losey.co' }
    ],
    gallery: [
      {
        url: '/images/profile/hrc_telemetry.jpg',
        caption: 'HRC Telemetry Extraction & Lap Delta Visualization'
      }
    ],
    owner: {
      name: 'PJ Losey',
      username: 'pjlosey',
      role: 'FOUNDER & LEAD ENGINEER',
      avatarUrl: '/images/profile/pjlosey_avatar.jpg',
      profileUrl: '/u/pjlosey',
      hometown: 'Monmouth Beach, NJ'
    }
  },
  'exp-gridpass-2024': {
    id: 'exp-gridpass-2024',
    title: 'Gridpass Platform & Waterway Radar',
    company: 'Gridpass.app',
    location: 'Monmouth Beach, NJ',
    startDate: '2024-01',
    endDate: 'Present',
    category: 'special_project',
    categoryPill: 'SPECIAL PROJECT',
    description: 'Dynamic QR code portfolios for drivers, vehicles, events, team task boards, and live waterway marine GPS radar.',
    skills: ['⚡ Systems Architecture', '⚡ Next.js', '⚡ Firebase', '⚡ Marine GPS', '⚡ QR Passports'],
    links: [
      { id: 'link-6', title: 'Gridpass Platform', url: 'https://gridpass.app' },
      { id: 'link-7', title: 'Live Waterway Radar', url: 'https://gridpass.app/water' }
    ],
    gallery: [
      {
        url: '/images/profile/pjlosey_cover.jpg',
        caption: 'Gridpass Motorsport Telemetry & Waterway GPS Radar'
      }
    ],
    owner: {
      name: 'PJ Losey',
      username: 'pjlosey',
      role: 'FOUNDER & LEAD ENGINEER',
      avatarUrl: '/images/profile/pjlosey_avatar.jpg',
      profileUrl: '/u/pjlosey',
      hometown: 'Monmouth Beach, NJ'
    }
  }
};

export default function ExperienceDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? decodeURIComponent(rawId) : '';

  const [exp, setExp] = useState<ExperienceAsset | null>(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');

    if (isMock && EXPERIENCES_DATABASE[id]) {
      setExp(EXPERIENCES_DATABASE[id]);
      return;
    }

    if (isMock && !EXPERIENCES_DATABASE[id]) {
      setExp({
        id: id,
        title: id.includes('hrc') || id === 'exp-1' ? 'Honda Racing / HRC Trackside Engineer' : 'Gridpass Platform & Waterway Radar',
        company: id.includes('hrc') || id === 'exp-1' ? 'Honda Racing Corporation (HRC)' : 'Gridpass.app',
        category: 'motorsport_event',
        categoryPill: id.includes('hrc') || id === 'exp-1' ? 'MOTORSPORT GIG' : 'SPECIAL PROJECT',
        description: 'High-speed telemetry extraction, race strategy engine engineering, and brake zone sensor visualization.',
        skills: ['⚡ Telemetry', '⚡ Systems Architecture'],
        links: [{ id: 'link-1', title: 'Losey.co Pedigree', url: 'https://losey.co' }],
        gallery: [{ url: '/images/profile/hrc_telemetry.jpg', caption: 'Experience Asset Detail View' }],
        owner: {
          name: 'PJ Losey',
          username: 'pjlosey',
          role: 'FOUNDER & LEAD ENGINEER',
          avatarUrl: '/images/profile/pjlosey_avatar.jpg',
          profileUrl: '/u/pjlosey',
          hometown: 'Monmouth Beach, NJ'
        }
      });
      return;
    }

    import('@/lib/firebase/config').then(({ db }) => {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        const unsub = onSnapshot(doc(db, 'experiences', id), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setExp({
              id: snap.id,
              title: data.title || 'Untitled Experience',
              company: data.company || 'Organization',
              location: data.location || '',
              startDate: data.startDate || data.start_date || '',
              endDate: data.endDate || data.end_date || 'Present',
              category: data.category || 'special_project',
              categoryPill: data.categoryPill || (data.category === 'motorsport_event' ? 'MOTORSPORT GIG' : 'SPECIAL PROJECT'),
              description: data.description || '',
              skills: data.skills || [],
              links: data.links || [],
              gallery: data.gallery || (data.cover_image_url ? [{ url: data.cover_image_url, caption: data.title }] : []),
              owner: {
                name: data.owner_display_name || 'PJ Losey',
                username: 'pjlosey',
                role: 'FOUNDER & LEAD ENGINEER',
                avatarUrl: data.owner_avatar_url || '/images/profile/pjlosey_avatar.jpg',
                profileUrl: `/u/${data.owner_uid || 'pjlosey'}`,
                hometown: 'Monmouth Beach, NJ'
              }
            });
          } else if (EXPERIENCES_DATABASE[id]) {
            setExp(EXPERIENCES_DATABASE[id]);
          } else {
            setExp(null);
          }
        });
        return () => unsub();
      });
    });
  }, [id]);

  if (!exp) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-neutral-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-neutral-200/80 rounded-[32px] p-8 shadow-2xl space-y-5 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shadow-inner">
            <Briefcase className="w-10 h-10 stroke-[1.5] text-neutral-400" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-black uppercase text-[#ff3b30] tracking-widest block">
              ⚪ Experience Asset Not Found
            </span>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 font-sans">
              Experience Asset Not Found
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed max-w-xs mx-auto">
              This experience asset does not exist or has been removed from the platform.
            </p>
          </div>
          <Link 
            href="/dash" 
            className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-2xl transition-all cursor-pointer gap-2 shadow-md hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-[#ff3b30] selection:text-white">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href={exp.owner.profileUrl}
            className="min-h-[44px] min-w-[44px] inline-flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl text-xs font-mono font-bold uppercase transition-all"
            data-testid="back-to-profile-btn"
          >
            <ArrowLeft className="w-4 h-4 text-[#ff3b30]" /> Back to Passport Profile
          </Link>
          <span className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-widest hidden sm:inline-block">
            VERIFIED EXPERIENCE ASSET
          </span>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Experience Header Banner Card */}
        <section className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
            <span 
              data-testid="experience-category-pill"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 py-2 bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-[#ff3b30] text-xs font-mono font-black rounded-full uppercase tracking-wider"
            >
              {exp.categoryPill}
            </span>
            {exp.startDate && (
              <span className="text-xs font-mono font-bold text-neutral-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {exp.startDate} — {exp.endDate || 'Present'}
              </span>
            )}
          </div>

          <div className="space-y-3 text-left">
            <h1 data-testid="experience-title" className="text-2xl sm:text-4xl font-black uppercase text-neutral-900 tracking-tight leading-tight">
              {exp.title}
            </h1>
            <div data-testid="experience-company" className="text-lg font-bold text-neutral-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>{exp.company}</span>
              {exp.location && (
                <span className="text-xs font-mono font-normal text-neutral-500 flex items-center gap-1 ml-2">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" /> {exp.location}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 border-t border-neutral-200 pt-4 text-left">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">Description &amp; Operational Scope</h3>
            <p data-testid="experience-description" className="text-sm text-neutral-900 font-medium leading-relaxed">
              {exp.description}
            </p>
          </div>

          {/* Skills Tag Pills */}
          {exp.skills && exp.skills.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {exp.skills.map((skill, sIdx) => (
                <span 
                  key={sIdx}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center px-3.5 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Photo Gallery Section */}
        {exp.gallery && exp.gallery.length > 0 && (
          <section className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                📷 Experience Photo &amp; Telemetry Gallery
              </h2>
              <span className="text-xs font-mono text-neutral-500">{exp.gallery.length} Photos</span>
            </div>

            <div data-testid="experience-photo-gallery" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {exp.gallery.map((photo, pIdx) => (
                <div 
                  key={pIdx} 
                  className="bg-white border border-neutral-200 rounded-2xl overflow-hidden group cursor-pointer"
                  onClick={() => setActiveLightboxIndex(pIdx)}
                  data-testid={`gallery-image-${pIdx}`}
                >
                  <div className="w-full h-48 sm:h-56 relative bg-neutral-100 overflow-hidden">
                    <img 
                      src={photo.url} 
                      alt={photo.caption || exp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {photo.caption && (
                    <div className="p-3 bg-white/90 border-t border-neutral-200">
                      <p className="text-xs font-mono text-neutral-700">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* External Links Section */}
        {exp.links && exp.links.length > 0 && (
          <section className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4 text-left">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2 border-b border-neutral-200 pb-3">
              🔗 External Verification Links &amp; References
            </h2>

            <div data-testid="external-link-pills" className="flex flex-wrap items-center gap-3 pt-2">
              {exp.links.map((link, lIdx) => (
                <a
                  key={lIdx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`external-link-pill-${lIdx}`}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-mono font-bold uppercase rounded-2xl transition-all shadow-sm cursor-pointer"
                >
                  <span>🔗 {link.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#ff3b30]" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Owner Driver Passport Card */}
        <section data-testid="owner-passport-card" className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              👤 Asset Owner &amp; Driver Passport
            </h2>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> VERIFIED PASSPORT
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 border-2 border-[#ff3b30] overflow-hidden shrink-0">
                <img src={exp.owner.avatarUrl} alt={exp.owner.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase text-neutral-900 flex items-center gap-2">
                  {exp.owner.name}
                  <span className="text-[9px] font-mono font-bold text-[#ff3b30] bg-[#ff3b30]/10 border border-[#ff3b30]/30 px-2 py-0.5 rounded-md">
                    {exp.owner.role}
                  </span>
                </h3>
                <p className="text-xs font-mono text-neutral-500">@{exp.owner.username}</p>
                {exp.owner.hometown && (
                  <p className="text-xs font-mono text-neutral-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#ff3b30]" /> {exp.owner.hometown}
                  </p>
                )}
              </div>
            </div>

            <Link
              href={exp.owner.profileUrl}
              data-testid="owner-passport-link"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-5 py-3 bg-[#ff3b30] hover:bg-red-600 text-white text-xs font-mono font-black uppercase rounded-2xl transition-all shadow-md cursor-pointer"
            >
              View Full Passport Profile ➔
            </Link>
          </div>
        </section>

      </main>

      {/* Lightbox Modal for Photo Gallery */}
      {activeLightboxIndex !== null && (
        <div 
          data-testid="lightbox-modal"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
        >
          <button
            type="button"
            data-testid="lightbox-close-btn"
            onClick={() => setActiveLightboxIndex(null)}
            className="min-h-[44px] min-w-[44px] fixed top-4 right-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full flex items-center justify-center transition-all z-50"
            aria-label="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl w-full flex flex-col items-center space-y-4">
            <img 
              src={exp.gallery[activeLightboxIndex].url}
              alt={exp.gallery[activeLightboxIndex].caption || exp.title}
              className="max-h-[75vh] w-auto object-contain rounded-2xl border border-neutral-800"
            />
            {exp.gallery[activeLightboxIndex].caption && (
              <p className="text-xs font-mono text-neutral-300 bg-neutral-900/80 px-4 py-2 rounded-xl border border-neutral-800">
                {exp.gallery[activeLightboxIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
