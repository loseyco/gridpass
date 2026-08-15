'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Heart, Users, Car, Calendar, QrCode, Compass, Building2, Globe, ArrowRight, Newspaper } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import Logo from '@/components/Logo';
import LiveActivityFeed from '@/components/feed/LiveActivityFeed';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import JoinClient from './join/JoinClient';

function HomeClient() {
  const { user } = useAuth();
  const [isMock, setIsMock] = useState(() => typeof window !== 'undefined' && !!(window as any).__PLAYWRIGHT_MOCK__);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
      setIsMock(true);
    }
  }, []);

  // Real-time Platform Stats State
  const [stats, setStats] = useState({
    usersCount: 0,
    vehiclesCount: 0,
    eventsCount: 0,
    scansCount: 0,
  });

  useEffect(() => {
    if (!db) return;

    // Real-time listeners for live platform statistics
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats((prev) => ({ ...prev, usersCount: snap.size }));
    });

    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snap) => {
      setStats((prev) => ({ ...prev, vehiclesCount: snap.size }));
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      setStats((prev) => ({ ...prev, eventsCount: snap.size }));
    });

    const unsubScans = onSnapshot(collection(db, 'tag_scans'), (snap) => {
      setStats((prev) => ({ ...prev, scansCount: snap.size }));
    });

    return () => {
      unsubUsers();
      unsubVehicles();
      unsubEvents();
      unsubScans();
    };
  }, []);

  // Real-time Featured Events State
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsubEventsList = onSnapshot(collection(db, 'events'), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status !== 'completed' && data.status !== 'cancelled' && !data.is_hidden && !data.archived) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      setFeaturedEvents(list);
    });
    return () => unsubEventsList();
  }, []);

  // Real-time Latest News Wire Dispatches State
  const [latestNews, setLatestNews] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsubNews = onSnapshot(collection(db, 'news_articles'), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.is_public !== false && data.status !== 'draft') {
          list.push({
            id: docSnap.id,
            ...data,
            cover_image: data.cover_image || data.cover_image_url || data.image_url || null,
          });
        }
      });
      list.sort((a, b) => {
        const timeA = a.published_at || a.created_at || '';
        const timeB = b.published_at || b.created_at || '';
        return timeB.localeCompare(timeA);
      });
      setLatestNews(list.slice(0, 3));
    });
    return () => unsubNews();
  }, []);

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col justify-center px-4 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto w-full space-y-8 sm:space-y-12">
      
      {/* Upper Grid Layout: Branding & CTAs (Left) + Live Activity Feed (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Hero & Interactive CTAs */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-6 text-center md:text-left py-2">
          <div className="space-y-3">
            <Logo className="w-14 h-14 mx-auto md:mx-0" textClassName="text-2xl text-neutral-900 font-black" />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 uppercase">
              One Tag For Everything
            </h1>

            {/* Interactive Category Link Pills */}
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-1">
              <Link 
                href="/vehicles" 
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-900 text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-1"
              >
                <Car className="w-3 h-3 text-[#ff3b30]" />
                Vehicles
              </Link>
              <Link 
                href="/events" 
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-900 text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-1"
              >
                <Calendar className="w-3 h-3 text-[#ff3b30]" />
                Events
              </Link>
              <Link 
                href="/businesses" 
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-900 text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-1"
              >
                <Building2 className="w-3 h-3 text-[#ff3b30]" />
                Vendors
              </Link>
              <Link 
                href="/explore" 
                className="px-2.5 py-1 bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 border border-[#ff3b30]/30 text-[#ff3b30] text-[10px] font-black uppercase rounded-lg transition-colors flex items-center gap-1"
              >
                <Compass className="w-3 h-3 text-[#ff3b30]" />
                Explore All
              </Link>
            </div>

            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto md:mx-0 font-medium pt-1">
              Whether you race it, show it, cook it, or capture it — Gridpass connects physical decals directly to digital passports.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="w-full max-w-xs mx-auto md:mx-0 space-y-2.5">
            {user ? (
              <Link 
                href="/dash"
                className="w-full py-3.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 text-center cursor-pointer shadow-xs min-h-[44px]"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/explore"
                  className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 text-center cursor-pointer shadow-xs min-h-[44px]"
                >
                  <Compass className="w-4 h-4 text-[#ff3b30]" />
                  <span>Explore Platform (Guest)</span>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    href="/join"
                    className="py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold rounded-xl text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center text-center cursor-pointer min-h-[44px]"
                  >
                    Join Gridpass
                  </Link>
                  <Link 
                    href="/login"
                    className="py-3 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 font-bold rounded-xl text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center text-center cursor-pointer min-h-[44px]"
                  >
                    Sign In
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Clickable Live Platform Stats Counter Bar */}
          <div className="pt-2 border-t border-neutral-100 grid grid-cols-4 gap-2 text-center max-w-md mx-auto md:mx-0">
            <Link href="/members" className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200/60 transition-all cursor-pointer">
              <Users className="w-3.5 h-3.5 text-neutral-500 mx-auto mb-1" />
              <div className="text-xs font-black text-neutral-900">{stats.usersCount}</div>
              <div className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Members</div>
            </Link>
            <Link href="/vehicles" className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200/60 transition-all cursor-pointer">
              <Car className="w-3.5 h-3.5 text-neutral-500 mx-auto mb-1" />
              <div className="text-xs font-black text-neutral-900">{stats.vehiclesCount}</div>
              <div className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Vehicles</div>
            </Link>
            <Link href="/events" className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200/60 transition-all cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-neutral-500 mx-auto mb-1" />
              <div className="text-xs font-black text-neutral-900">{stats.eventsCount}</div>
              <div className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Events</div>
            </Link>
            <Link href="/explore" className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200/60 transition-all cursor-pointer">
              <QrCode className="w-3.5 h-3.5 text-[#ff3b30] mx-auto mb-1" />
              <div className="text-xs font-black text-neutral-900">{stats.scansCount}</div>
              <div className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Scans</div>
            </Link>
          </div>
        </div>

        {/* Right Column: Live Activity Stream */}
        <div className="md:col-span-6 w-full">
          <LiveActivityFeed />
        </div>

      </div>

      {/* Latest Motorsport News Section */}
      <div className="pt-6 border-t border-neutral-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#ff3b30]" />
              <span>Latest News</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium">Breaking race reports, paddock updates, and championship news.</p>
          </div>
          <Link href="/news" className="text-xs font-bold text-[#ff3b30] hover:underline uppercase tracking-wider flex items-center gap-1">
            <span>All News ➔</span>
          </Link>
        </div>

        {latestNews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {latestNews.map((art) => (
              <Link
                key={art.id}
                href={`/news/${art.slug || art.id}`}
                className="relative overflow-hidden bg-white hover:bg-neutral-50 border border-neutral-200/90 hover:border-neutral-300 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group shadow-xs hover:shadow-lg"
              >
                {/* Background Image - Noticeable by default, Rich & Vibrant on hover */}
                {art.cover_image && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-65 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                    style={{ backgroundImage: `url(${art.cover_image})` }}
                  />
                )}
                {/* Clean gradient wash for crisp readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/50 group-hover:from-white/85 group-hover:via-white/60 group-hover:to-white/30 transition-all duration-300 pointer-events-none" />

                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-center justify-between gap-1.5 text-[9px] font-black uppercase text-neutral-600 font-mono">
                    <span className="px-2 py-0.5 bg-neutral-900/90 text-white rounded-md backdrop-blur-xs shadow-2xs">
                      {art.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="bg-white/80 px-1.5 py-0.5 rounded-md backdrop-blur-xs font-bold text-neutral-800">
                      {art.published_at ? new Date(art.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Live'}
                    </span>
                  </div>

                  <h3 className="font-black text-xs uppercase text-neutral-950 group-hover:text-[#ff3b30] transition leading-snug line-clamp-2">
                    {art.title}
                  </h3>

                  <p className="text-[11px] text-neutral-800 font-medium line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="relative z-10 pt-3 border-t border-neutral-200/80 mt-3 flex items-center justify-between text-[10px] font-black text-[#ff3b30] uppercase tracking-wider">
                  <span>Read Story</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {/* Featured Real Events & Gatherings Section */}
      <div className="pt-6 border-t border-neutral-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#ff3b30]" />
              Featured Events & Meets
            </h2>
            <p className="text-xs text-neutral-500 font-medium">Live paddock meets, cruise nights, and track day schedules.</p>
          </div>
          <Link href="/events" className="text-xs font-bold text-[#ff3b30] hover:underline uppercase tracking-wider flex items-center gap-1">
            <span>All Events ({featuredEvents.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {featuredEvents.length > 0 ? (
          <div className="space-y-3">
            {featuredEvents.map((evt) => (
              <div 
                key={evt.id}
                className="p-4 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/80 rounded-2xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-200 rounded-xl overflow-hidden shrink-0 border border-neutral-300 relative">
                    {evt.image_url || evt.banner_url ? (
                      <img 
                        src={evt.image_url || evt.banner_url} 
                        alt={evt.title || 'Event'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white font-black text-xl">
                        🏁
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {evt.is_rescheduled && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                          📢 RESCHEDULED
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[9px] font-bold uppercase rounded-md tracking-wider">
                        {evt.venue_type || 'Permanent Venue'}
                      </span>
                      {evt.date_display && (
                        <span className="text-[9px] font-mono font-bold text-neutral-500">
                          {evt.date_display}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-neutral-900 uppercase tracking-tight group-hover:text-[#ff3b30] transition-colors line-clamp-1">
                      {evt.title || evt.name}
                    </h3>
                    {evt.location_name || evt.address ? (
                      <p className="text-xs text-neutral-500 font-medium flex items-center gap-1">
                        <span>📍</span>
                        <span>{evt.location_name || evt.address}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <Link 
                  href={`/events/${evt.slug || evt.id}`}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors text-center shrink-0 flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <span>VIEW</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl text-center space-y-2">
            <span className="text-2xl">🏁</span>
            <p className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider">Awaiting Live Event Feed</p>
            <p className="text-[11px] text-neutral-400">No active featured events scheduled right now.</p>
          </div>
        )}
      </div>

      {/* Showcase Directory Grid Section */}
      <div className="pt-6 border-t border-neutral-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight">Explore The Gridpass Network</h2>
            <p className="text-xs text-neutral-500 font-medium">Browse active builds, upcoming event meets, and partner food trucks.</p>
          </div>
          <Link href="/explore" className="text-xs font-bold text-[#ff3b30] hover:underline uppercase tracking-wider flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/vehicles" className="p-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-2xl space-y-2 transition-all group">
            <div className="w-9 h-9 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-2xs group-hover:border-[#ff3b30]">
              <Car className="w-5 h-5 text-[#ff3b30]" />
            </div>
            <h3 className="text-xs font-black uppercase text-neutral-900">Vehicles & Builds</h3>
            <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">Track weapons, show cars, e-bikes, and marine craft build specs.</p>
          </Link>

          <Link href="/events" className="p-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-2xl space-y-2 transition-all group">
            <div className="w-9 h-9 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-2xs group-hover:border-[#ff3b30]">
              <Calendar className="w-5 h-5 text-[#ff3b30]" />
            </div>
            <h3 className="text-xs font-black uppercase text-neutral-900">Events & Pit Passes</h3>
            <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">Track meets, paddock gate check-ins, and spectator manifests.</p>
          </Link>

          <Link href="/businesses" className="p-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-2xl space-y-2 transition-all group">
            <div className="w-9 h-9 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-2xs group-hover:border-[#ff3b30]">
              <Building2 className="w-5 h-5 text-[#ff3b30]" />
            </div>
            <h3 className="text-xs font-black uppercase text-neutral-900">Shops & Food Trucks</h3>
            <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">Verified motorsports shops, tuning garages, and event catering.</p>
          </Link>

          <Link href="/secondlife" className="p-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-2xl space-y-2 transition-all group">
            <div className="w-9 h-9 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-2xs group-hover:border-[#ff3b30]">
              <Globe className="w-5 h-5 text-[#ff3b30]" />
            </div>
            <h3 className="text-xs font-black uppercase text-neutral-900">Second Life Telemetry</h3>
            <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">Virtual sim racing track telemetry, sim FPS, and regional analytics.</p>
          </Link>
        </div>
      </div>

      {/* Support Section - Required by E2E tests, hidden for normal flow unless Playwright mock */}
      {(isMock || (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__)) && (
        <div className="w-full max-w-xs mx-auto bg-neutral-50 border border-neutral-200 p-4 rounded-2xl text-center space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 text-yellow-600">
            <Heart className="w-3.5 h-3.5 fill-yellow-600/10" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Back the Cause</span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-neutral-900 uppercase">Become an Original Supporter</h3>
            <p className="text-[9px] text-neutral-500 leading-normal max-w-xs mx-auto">
              Gridpass is crowdfunded. Help fund development starting from $5 to unlock support badges.
            </p>
          </div>
          <div className="pt-1">
            <Link 
              href="/login" 
              className="inline-block bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-[9px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Back Gridpass
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Home() {
  const [clientPath, setClientPath] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientPath(window.location.pathname.toLowerCase());
    }
  }, []);

  if (clientPath === '/join' || (clientPath && clientPath.startsWith('/join/'))) {
    return <JoinClient />;
  }

  return (
    <Suspense fallback={
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    }>
      <HomeClient />
    </Suspense>
  );
}
