'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query } from 'firebase/firestore';
import { 
  Search, Car, User, Building2, Compass, ShieldCheck, 
  MapPin, Loader2, Calendar 
} from 'lucide-react';
import { SEEDED_VENUES } from '@/lib/data/venues';

interface ExploreVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  tag_id: string;
  photo_url?: string;
  owner_id?: string;
  specs?: { engine?: string; hp?: number | string };
  co_owners?: string[] | string;
  ownership_split?: string;
  mods?: Array<{ category: string; brand: string; name: string; cost?: number } | string>;
}

interface ExploreUser {
  id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  is_supporter?: boolean;
}

interface ExploreBusiness {
  id: string;
  name: string;
  type: string;
  location?: string;
  is_pro?: boolean;
  services?: string;
}

interface ExploreVenue {
  id: string;
  name: string;
  type: string;
  location?: string;
}

interface ExploreEvent {
  id: string;
  title: string;
  location?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  is_rescheduled?: boolean;
  rescheduled_date?: string;
  reschedule_notice?: string;
  cover_photo_url?: string;
  description?: string;
  type?: string;
}

function formatEventBadgeDate(dateStr?: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('Aug 7') || dateStr.includes('August 7')) return 'Fri, Aug 7, 2026';
  try {
    const cleaned = dateStr.replace(/\sat\s/i, ' ').trim();
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function parseEventTime(dateStr?: string): number | null {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/\sat\s/i, ' ').trim();
  const parsed = new Date(cleaned).getTime();
  if (!isNaN(parsed)) return parsed;

  const match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (match) {
    const fallbackTime = new Date(`${match[1]} ${match[2]}, ${match[3]}`).getTime();
    if (!isNaN(fallbackTime)) return fallbackTime;
  }
  return null;
}

function isEventActive(e: ExploreEvent): boolean {
  const now = Date.now();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  // 1. Rescheduled date precedence if rescheduled
  const effectiveDateStr = (e.is_rescheduled && e.rescheduled_date)
    ? e.rescheduled_date
    : (e.end_date || e.start_date || e.date || e.created_at);

  if (!effectiveDateStr) return true;

  const eventTime = parseEventTime(effectiveDateStr);
  if (eventTime === null) return true;

  // 2. Upcoming or Future Event: ALWAYS ACTIVE
  if (eventTime >= now) return true;

  // 3. Up to 48 hours post event end date: STILL ACTIVE
  return (now - eventTime) <= FORTY_EIGHT_HOURS_MS;
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'people' | 'businesses' | 'venues' | 'events'>('vehicles');
  const [eventViewMode, setEventViewMode] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [vehicles, setVehicles] = useState<ExploreVehicle[]>([]);
  const [people, setPeople] = useState<ExploreUser[]>([]);
  const [businesses, setBusinesses] = useState<ExploreBusiness[]>([]);
  const [venues, setVenues] = useState<ExploreVenue[]>([]);
  const [events, setEvents] = useState<ExploreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const mockVehicles: ExploreVehicle[] = [
          {
            id: 'mock-v1',
            year: 2024,
            make: 'Ford',
            model: 'Mustang GT',
            tag_id: 'GP-MARCUS-GT',
            photo_url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=400&q=80',
            specs: { engine: '5.0L Coyote V8', hp: 480 },
            mods: [
              { category: 'Exhaust', brand: 'Roush', name: 'Cat-Back Exhaust System', cost: 1200 },
              { category: 'Spoiler', brand: 'Roush', name: 'Roush spoiler', cost: 400 }
            ]
          },
          {
            id: 'seadoo-mock-v1',
            year: 2007,
            make: 'Sea-Doo',
            model: 'GTI SE',
            tag_id: 'GP-SEADOO-07',
            specs: { engine: 'Rotax 1503 NA', hp: 130 },
            co_owners: 'Kristina & PJ',
            ownership_split: '50/50'
          },
          {
            id: 'mock-v2',
            year: 2020,
            make: 'Ferrari',
            model: '488 Pista',
            tag_id: 'GP-FERRARI',
            specs: { engine: '3.9L Twin-Turbo V8', hp: 710 }
          },
          {
            id: 'mock-v3',
            year: 2020,
            make: 'Chevrolet',
            model: 'Silverado',
            tag_id: 'GP-BILLY-RIG',
            specs: { engine: '5.3L EcoTec3 V8', hp: 355 }
          }
        ];

        const mockPeople: ExploreUser[] = [
          {
            id: 'marcus-enthusiast',
            display_name: 'Marcus Enthusiast',
            bio: 'Tracking Coyote builds & water toys.',
            location: 'Grayslake, IL',
            is_supporter: true
          },
          {
            id: 'sarah-spotter',
            display_name: 'Sarah Spotter',
            bio: 'Capturing unique telemetry setups.',
            location: 'Lake Villa, IL',
            is_supporter: false
          }
        ];

        const mockBusinesses: ExploreBusiness[] = [
          {
            id: 'nielsens',
            name: 'Nielsen Enterprises',
            type: 'Dealership',
            location: 'Lake Villa, IL',
            is_pro: true
          },
          {
            id: 'blarney-island',
            name: 'Blarney Island',
            type: 'Track / Venue',
            location: 'Antioch, IL',
            is_pro: false
          }
        ];

        const mockVenues: ExploreVenue[] = SEEDED_VENUES.map(v => ({
          id: v.id,
          name: v.name,
          type: v.type === 'waterway' ? 'Waterway' : v.type === 'racetrack' ? 'Racetrack' : v.type === 'offroad_park' ? 'Offroad Park' : 'Event Center',
          location: v.location
        }));

        const mockEvents: ExploreEvent[] = [
          {
            id: 'mock-evt-1',
            title: 'Midwest Watercraft & Powerboat Rally',
            location: 'Grass Lake / Blarney Island, IL',
            date: 'Saturday, 10:00 AM',
            description: 'Annual gathering of powerboats, PWC, and enthusiasts on Grass Lake.',
            type: 'Waterway Meet'
          },
          {
            id: 'mock-evt-2',
            title: 'Chain O Lakes Night Cruise',
            location: 'Antioch, IL',
            date: 'Friday, 7:00 PM',
            description: 'Sunset cruise and social meet at local venues.',
            type: 'Car & Boat Meet'
          }
        ];

        if (isMounted) {
          setVehicles(mockVehicles);
          setPeople(mockPeople);
          setBusinesses(mockBusinesses);
          setVenues(mockVenues);
          setEvents(mockEvents);
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch public registry profiles from Firebase Firestore
        const vSnap = await getDocs(collection(db, 'vehicles'));
        const vList = vSnap.docs.map(docSnap => {
          const vData = docSnap.data();
          return {
            id: docSnap.id,
            year: vData.year || 2024,
            make: vData.make || '',
            model: vData.model || '',
            tag_id: vData.tag_id || '',
            photo_url: vData.photo_url || vData.imageUrl || vData.image_url || (vData.images && vData.images[0]) || '',
            owner_id: vData.owner_id || '',
            specs: vData.specs,
            co_owners: vData.co_owners,
            ownership_split: vData.ownership_split,
            mods: vData.mods || []
          } as ExploreVehicle;
        });

        const uSnap = await getDocs(collection(db, 'users'));
        const uList = uSnap.docs.map(docSnap => {
          const uData = docSnap.data();
          return {
            id: uData.username || docSnap.id,
            display_name: uData.display_name || uData.name || 'Anonymous Member',
            bio: uData.bio || '',
            avatar_url: uData.avatar_url || '',
            location: uData.home_town || uData.location || '',
            is_supporter: uData.is_supporter === true
          } as ExploreUser;
        });

        const bSnap = await getDocs(collection(db, 'businesses'));
        const bList = bSnap.docs.map(docSnap => {
          const bData = docSnap.data();
          const categoryLabels: Record<string, string> = {
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
          return {
            id: docSnap.id,
            name: bData.name || 'Anonymous Business',
            type: categoryLabels[bData.category] || bData.type || 'Partner Business',
            location: bData.address || bData.location_name || '',
            is_pro: bData.is_pro === true,
            services: bData.services || ''
          } as ExploreBusiness;
        });

        const eSnap = await getDocs(collection(db, 'events'));
        const eList = eSnap.docs.map(docSnap => {
          const eData = docSnap.data();
          return {
            id: docSnap.id,
            title: eData.title || eData.name || 'Untitled Event',
            location: eData.location || eData.venue || eData.location_name || '',
            date: eData.date || eData.eventDate || eData.start_date || '',
            start_date: eData.start_date || eData.date || '',
            end_date: eData.end_date || eData.endDate || eData.start_date || eData.date || '',
            created_at: eData.created_at || eData.createdAt || '',
            is_rescheduled: eData.is_rescheduled === true,
            rescheduled_date: eData.rescheduled_date || eData.rescheduledDate || '',
            reschedule_notice: eData.reschedule_notice || eData.rescheduleNotice || '',
            cover_photo_url: eData.cover_photo_url || eData.coverPhotoUrl || eData.exampleImageUrl || eData.photo_url || '',
            description: eData.description || '',
            type: eData.type || 'Gathering'
          } as ExploreEvent;
        });

        const finalVenues = SEEDED_VENUES.map(v => ({
          id: v.id,
          name: v.name,
          type: v.type === 'waterway' ? 'Waterway' : v.type === 'racetrack' ? 'Racetrack' : v.type === 'offroad_park' ? 'Offroad Park' : 'Event Center',
          location: v.location
        }));

        const mapleCityEvent: ExploreEvent = {
          id: 'maple-city-cruise',
          title: '26TH ANNUAL MONMOUTH CRUISE NIGHT (MAPLE CITY STREET MACHINES)',
          date: '2026-08-07T16:00:00.000Z',
          start_date: '2026-08-07T16:00:00.000Z',
          location: 'Monmouth Public Square & Main Street',
          cover_photo_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
          description: 'Annual gathering of custom street machines, classic cars, muscle builds, food trucks, and live music on Monmouth Public Square!',
          type: 'Gathering'
        };

        // Filter out junk test/placeholder events and deduplicate
        const cleanEList = eList.filter(e => 
          e.id !== 'maple-city-cruise' &&
          !e.title.toUpperCase().includes('AUTUMN SHOOTOUT') && 
          !e.title.toUpperCase().includes('UNTITLED')
        );

        const finalEvents = [mapleCityEvent, ...cleanEList];

        if (isMounted) {
          setVehicles(vList);
          setPeople(uList);
          setBusinesses(bList);
          setVenues(finalVenues);
          setEvents(finalEvents);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load explore directory data:", err);
        if (isMounted) {
          setVenues(SEEDED_VENUES.map(v => ({
            id: v.id,
            name: v.name,
            type: v.type === 'waterway' ? 'Waterway' : v.type === 'racetrack' ? 'Racetrack' : v.type === 'offroad_park' ? 'Offroad Park' : 'Event Center',
            location: v.location
          })));
          setEvents([
            {
              id: 'maple-city-cruise',
              title: '26TH ANNUAL MONMOUTH CRUISE NIGHT (MAPLE CITY STREET MACHINES)',
              date: 'Fri, Aug 7, 2026',
              location: 'Monmouth Public Square & Main Street'
            }
          ]);
          setLoading(false);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [isMock]);

  // Search Filter Functions
  const filteredVehicles = vehicles.filter(v => {
    const term = searchQuery.toLowerCase();
    const matchesMods = Array.isArray(v.mods) && v.mods.some((m: any) => {
      if (typeof m === 'string') {
        return m.toLowerCase().includes(term);
      }
      return (
        (m.category || '').toLowerCase().includes(term) ||
        (m.brand || '').toLowerCase().includes(term) ||
        (m.name || '').toLowerCase().includes(term)
      );
    });
    return (
      (v.make || '').toLowerCase().includes(term) ||
      (v.model || '').toLowerCase().includes(term) ||
      (v.tag_id || '').toLowerCase().includes(term) ||
      String(v.year).includes(term) ||
      (typeof v.co_owners === 'string' && v.co_owners.toLowerCase().includes(term)) ||
      matchesMods
    );
  });

  const filteredPeople = people.filter(p => {
    const term = searchQuery.toLowerCase();
    return (
      (p.display_name || '').toLowerCase().includes(term) ||
      (p.bio || '').toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term)
    );
  });

  const filteredBusinesses = businesses.filter(b => {
    const term = searchQuery.toLowerCase();
    return (
      (b.name || '').toLowerCase().includes(term) ||
      (b.type || '').toLowerCase().includes(term) ||
      (b.location || '').toLowerCase().includes(term) ||
      (b.services || '').toLowerCase().includes(term)
    );
  });

  const filteredVenues = venues.filter(v => {
    const term = searchQuery.toLowerCase();
    return (
      (v.name || '').toLowerCase().includes(term) ||
      (v.type || '').toLowerCase().includes(term) ||
      (v.location || '').toLowerCase().includes(term)
    );
  });

  const filteredEvents = events.filter(e => {
    const term = searchQuery.toLowerCase();
    const activeStatus = isEventActive(e);

    if (eventViewMode === 'active' && !activeStatus) return false;
    if (eventViewMode === 'archived' && activeStatus) return false;

    return (
      (e.title || '').toLowerCase().includes(term) ||
      (e.location || '').toLowerCase().includes(term) ||
      (e.type || '').toLowerCase().includes(term) ||
      (e.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <main className="min-h-screen bg-white text-neutral-900 font-sans relative flex flex-col">

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-16 pb-16 w-full flex-1 space-y-6">
        
        {/* Compact Top Header & Universal Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left border-b border-neutral-200 pb-4">
          <div>
            <h1 className="text-xl font-black text-neutral-900 uppercase tracking-tight flex items-center gap-1.5">
              <Compass className="w-5 h-5 text-[#ff3b30]" /> Explore Gridpass
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Search all vehicles, driver profiles, upcoming events, partner shops, and venues.
            </p>
          </div>

          {/* Universal Search Box */}
          <div className="relative max-w-sm w-full shrink-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicles, members, events, shops..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#ff3b30] transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-neutral-400 hover:text-neutral-700 bg-neutral-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* MODE A: UNCLUTTERED LAUNCHER MENU (Shown when Search Box is empty) */}
        {searchQuery.trim() === '' ? (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                Directory Categories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Link
                href="/vehicles"
                className="p-4 bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] rounded-2xl transition-all shadow-2xs hover:shadow-md group flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-neutral-900 group-hover:text-[#ff3b30]">
                    <Car className="w-5 h-5 text-[#ff3b30] shrink-0" />
                    <h2 className="text-sm font-black uppercase tracking-wider truncate">Vehicles Registry</h2>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium truncate">
                    Browse public vehicle passports, specs &amp; modifications.
                  </p>
                </div>
                <span className="text-xs font-mono font-black text-neutral-400 group-hover:text-[#ff3b30] shrink-0 bg-white border border-neutral-200 group-hover:border-[#ff3b30] px-2.5 py-1 rounded-xl">
                  {vehicles.length} →
                </span>
              </Link>

              <Link
                href="/members"
                className="p-4 bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] rounded-2xl transition-all shadow-2xs hover:shadow-md group flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-neutral-900 group-hover:text-[#ff3b30]">
                    <User className="w-5 h-5 text-[#ff3b30] shrink-0" />
                    <h2 className="text-sm font-black uppercase tracking-wider truncate">Members Directory</h2>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium truncate">
                    Explore active member drivers, supporters &amp; hometowns.
                  </p>
                </div>
                <span className="text-xs font-mono font-black text-neutral-400 group-hover:text-[#ff3b30] shrink-0 bg-white border border-neutral-200 group-hover:border-[#ff3b30] px-2.5 py-1 rounded-xl">
                  {people.length} →
                </span>
              </Link>

              <Link
                href="/events"
                className="p-4 bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] rounded-2xl transition-all shadow-2xs hover:shadow-md group flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-neutral-900 group-hover:text-[#ff3b30]">
                    <Calendar className="w-5 h-5 text-[#ff3b30] shrink-0" />
                    <h2 className="text-sm font-black uppercase tracking-wider truncate">Events &amp; Meets</h2>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium truncate">
                    Cruise nights, track days, water rallies &amp; gatherings.
                  </p>
                </div>
                <span className="text-xs font-mono font-black text-neutral-400 group-hover:text-[#ff3b30] shrink-0 bg-white border border-neutral-200 group-hover:border-[#ff3b30] px-2.5 py-1 rounded-xl">
                  {events.length} →
                </span>
              </Link>

              <Link
                href="/businesses"
                className="p-4 bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-blue-500 rounded-2xl transition-all shadow-2xs hover:shadow-md group flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-neutral-900 group-hover:text-blue-600">
                    <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <h2 className="text-sm font-black uppercase tracking-wider truncate">Businesses &amp; Tracks</h2>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium truncate">
                    Garages, dealerships, tracks &amp; vendors.
                  </p>
                </div>
                <span className="text-xs font-mono font-black text-neutral-400 group-hover:text-blue-600 shrink-0 bg-white border border-neutral-200 group-hover:border-blue-500 px-2.5 py-1 rounded-xl">
                  {businesses.length} →
                </span>
              </Link>
            </div>
          </div>
        ) : (
          /* MODE B: UNIVERSAL SEARCH RESULTS (Across Vehicles, People, Events, Shops, Venues) */
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-xs font-mono font-bold text-neutral-500 uppercase">
                Search Results for &ldquo;{searchQuery}&rdquo;
              </span>
              <span className="text-[10px] font-mono font-bold text-[#ff3b30] uppercase">
                {filteredVehicles.length + filteredPeople.length + filteredEvents.length + filteredBusinesses.length + filteredVenues.length} Matches Found
              </span>
            </div>

            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
              </div>
            ) : (filteredVehicles.length + filteredPeople.length + filteredEvents.length + filteredBusinesses.length + filteredVenues.length) === 0 ? (
              <div className="py-16 text-center text-neutral-500 font-mono text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-2xl p-8">
                No matches found across Gridpass for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. Vehicles Search Matches */}
                {filteredVehicles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-black text-neutral-800 uppercase">
                      <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-[#ff3b30]" /> Vehicles ({filteredVehicles.length})</span>
                      <Link href="/vehicles" className="text-[10px] text-[#ff3b30] hover:underline">View All Vehicles →</Link>
                    </div>
                    <div className="space-y-2">
                      {filteredVehicles.map(v => (
                        <Link
                          key={v.id}
                          href={`/v/${v.id}`}
                          className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
                        >
                          <div className="w-16 h-14 rounded-xl bg-neutral-200 border border-neutral-300 overflow-hidden shrink-0">
                            {v.photo_url ? (
                              <img src={v.photo_url} alt={v.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-5 h-5 text-neutral-400" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h3 className="text-xs font-black text-neutral-900 uppercase truncate group-hover:text-[#ff3b30] transition-colors">
                              {v.year} {v.make} {v.model}
                            </h3>
                            {v.specs?.engine && (
                              <p className="text-[10px] text-neutral-500 font-mono font-bold truncate">
                                Engine: {v.specs.engine}
                              </p>
                            )}
                          </div>

                          <span className="py-1 px-2.5 bg-neutral-900 group-hover:bg-[#ff3b30] text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-colors shrink-0">
                            Passport
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. People Search Matches */}
                {filteredPeople.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-black text-neutral-800 uppercase">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#ff3b30]" /> People &amp; Drivers ({filteredPeople.length})</span>
                      <Link href="/members" className="text-[10px] text-[#ff3b30] hover:underline">View All Members →</Link>
                    </div>
                    <div className="space-y-2">
                      {filteredPeople.map(p => (
                        <Link
                          key={p.id}
                          href={`/u/${p.id}`}
                          className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
                        >
                          <div className={`w-12 h-12 rounded-full p-0.5 shrink-0 ${p.is_supporter ? 'bg-gradient-to-tr from-[#ffe066] to-[#ff9900]' : 'bg-neutral-200'}`}>
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border border-neutral-100">
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-neutral-400" />
                              )}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-black text-neutral-900 uppercase truncate group-hover:text-[#ff3b30] transition-colors">
                                {p.display_name}
                              </h3>
                              {p.is_supporter && (
                                <span className="text-[8px] bg-yellow-400 text-black font-black uppercase px-1.5 py-0.2 rounded">Supporter</span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-500 font-mono font-bold truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#ff3b30] shrink-0" />
                              {p.location || 'Location Unspecified'}
                            </p>
                          </div>

                          <span className="py-1 px-2.5 bg-neutral-900 group-hover:bg-[#ff3b30] text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-colors shrink-0">
                            Profile
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Events Search Matches */}
                {filteredEvents.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-black text-neutral-800 uppercase">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#ff3b30]" /> Events &amp; Meets ({filteredEvents.length})</span>
                      <Link href="/events" className="text-[10px] text-[#ff3b30] hover:underline">View All Events →</Link>
                    </div>
                    <div className="space-y-2">
                      {filteredEvents.map(e => {
                        const coverImg = e.cover_photo_url || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80';
                        const formattedDate = formatEventBadgeDate(e.is_rescheduled && e.rescheduled_date ? e.rescheduled_date : e.date || e.start_date);

                        return (
                          <Link
                            key={e.id}
                            href={`/events/${e.id}`}
                            className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
                          >
                            <div className="w-16 h-14 rounded-xl bg-neutral-200 border border-neutral-300 overflow-hidden shrink-0">
                              <img src={coverImg} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {formattedDate && (
                                  <span className="text-[9px] font-mono font-extrabold text-neutral-800 bg-neutral-100 border border-neutral-200 px-1.5 py-0.2 rounded">
                                    {formattedDate}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xs font-black text-neutral-900 uppercase truncate group-hover:text-[#ff3b30] transition-colors">
                                {e.title}
                              </h3>
                              {e.location && (
                                <p className="text-[10px] text-neutral-500 font-mono font-bold truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#ff3b30] shrink-0" /> {e.location}
                                </p>
                              )}
                            </div>

                            <span className="py-1 px-2.5 bg-[#ff3b30] group-hover:bg-[#bd2925] text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-colors shrink-0">
                              View Event
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Shops Search Matches */}
                {filteredBusinesses.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-black text-neutral-800 uppercase">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-600" /> Partner Shops &amp; Dealerships ({filteredBusinesses.length})</span>
                      <Link href="/businesses" className="text-[10px] text-blue-600 hover:underline">View All Shops →</Link>
                    </div>
                    <div className="space-y-2">
                      {filteredBusinesses.map(b => (
                        <Link
                          key={b.id}
                          href={`/b/${b.id}`}
                          className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-blue-500 p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h3 className="text-xs font-black text-neutral-900 uppercase truncate group-hover:text-blue-600 transition-colors">
                              {b.name}
                            </h3>
                            {b.location && (
                              <p className="text-[10px] text-neutral-500 font-mono font-bold truncate">
                                {b.location}
                              </p>
                            )}
                          </div>

                          <span className="py-1 px-2.5 bg-blue-600 group-hover:bg-blue-700 text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-colors shrink-0">
                            Storefront
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>
      <Footer />
    </main>
  );
}
