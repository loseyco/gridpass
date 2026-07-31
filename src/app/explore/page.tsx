'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query } from 'firebase/firestore';
import { 
  Search, Car, User, Building2, Compass, ShieldCheck, 
  MapPin, Loader2 
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

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'people' | 'businesses' | 'venues'>('vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [vehicles, setVehicles] = useState<ExploreVehicle[]>([]);
  const [people, setPeople] = useState<ExploreUser[]>([]);
  const [businesses, setBusinesses] = useState<ExploreBusiness[]>([]);
  const [venues, setVenues] = useState<ExploreVenue[]>([]);
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

        if (isMounted) {
          setVehicles(mockVehicles);
          setPeople(mockPeople);
          setBusinesses(mockBusinesses);
          setVenues(mockVenues);
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

        const finalVenues = SEEDED_VENUES.map(v => ({
          id: v.id,
          name: v.name,
          type: v.type === 'waterway' ? 'Waterway' : v.type === 'racetrack' ? 'Racetrack' : v.type === 'offroad_park' ? 'Offroad Park' : 'Event Center',
          location: v.location
        }));

        if (isMounted) {
          setVehicles(vList);
          setPeople(uList);
          setBusinesses(bList);
          setVenues(finalVenues);
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

  return (
    <main className="min-h-screen bg-white text-neutral-900 font-sans relative flex flex-col">

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-16 w-full flex-1 space-y-8">
        
        {/* Title Block */}
        <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-2xl space-y-3 text-left">
          <span className="text-[10px] font-mono font-bold text-[#ff3b30] uppercase bg-[#ff3b30]/5 border border-[#ff3b30]/15 px-3 py-1 rounded-full inline-flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Registry Directory
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 uppercase tracking-tight leading-none">
            Explore Gridpass
          </h1>
          <p className="text-sm text-neutral-500 max-w-xl">
            Browse and search public passports for vehicles, registered drivers, verified B2B local partner businesses, and active geofenced venues.
          </p>
        </div>

        {/* Search & Tabs Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 pb-6">
          {/* Tabs */}
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => { setActiveTab('vehicles'); setSearchQuery(''); }}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'vehicles' ? 'border-[#ff3b30] text-[#ff3b30] font-black' : 'border-transparent text-neutral-500 hover:text-neutral-850'
              }`}
            >
              <Car className="w-4 h-4" /> Vehicles ({filteredVehicles.length})
            </button>
            <button 
              onClick={() => { setActiveTab('people'); setSearchQuery(''); }}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'people' ? 'border-[#ff3b30] text-[#ff3b30] font-black' : 'border-transparent text-neutral-500 hover:text-neutral-850'
              }`}
            >
              <User className="w-4 h-4" /> People ({filteredPeople.length})
            </button>
            <button 
              onClick={() => { setActiveTab('businesses'); setSearchQuery(''); }}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'businesses' ? 'border-[#ff3b30] text-[#ff3b30] font-black' : 'border-transparent text-neutral-500 hover:text-neutral-850'
              }`}
            >
              <Building2 className="w-4 h-4" /> Businesses ({filteredBusinesses.length})
            </button>
            <button 
              onClick={() => { setActiveTab('venues'); setSearchQuery(''); }}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'venues' ? 'border-[#ff3b30] text-[#ff3b30] font-black' : 'border-transparent text-neutral-500 hover:text-neutral-850'
              }`}
            >
              <Compass className="w-4 h-4" /> Venues ({filteredVenues.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-sm w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-55 border border-neutral-205 text-xs font-bold text-neutral-900 placeholder-neutral-450 focus:outline-none focus:border-[#ff3b30] transition-colors"
            />
          </div>
        </div>

        {/* Results Container */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            
            {/* Vehicles Render */}
            {activeTab === 'vehicles' && (
              filteredVehicles.length > 0 ? (
                filteredVehicles.map(v => (
                  <div key={v.id} className="bg-neutral-50 border border-neutral-200 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-[#ff3b30] hover:bg-[#ff3b30]/5 transition-all">
                    <div className="space-y-3">
                      {v.photo_url ? (
                        <div className="w-full h-36 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                          <img src={v.photo_url} alt={v.model} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-36 rounded-xl border border-neutral-200 bg-white flex items-center justify-center">
                          <Car className="w-10 h-10 text-neutral-300" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold text-[#ff3b30] uppercase bg-[#ff3b30]/5 border border-[#ff3b30]/10 px-2 py-0.5 rounded">
                            {v.tag_id}
                          </span>
                          {v.co_owners && (
                            <span className="text-[9px] font-mono font-bold text-blue-650 uppercase bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                              Shared {v.ownership_split || 'Split'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-neutral-900 uppercase mt-2">{v.year} {v.make} {v.model}</h3>
                        {v.specs?.engine && (
                          <p className="text-[11px] text-neutral-500 font-bold uppercase mt-1">Engine: {v.specs.engine}</p>
                        )}
                        {v.co_owners && (
                          <p className="text-[10px] text-neutral-500 mt-2">Owners: <span className="font-bold text-neutral-700">{Array.isArray(v.co_owners) ? v.co_owners.join(' & ') : v.co_owners}</span></p>
                        )}
                      </div>
                    </div>
                    
                    <Link
                      href={`/v/${v.id}`}
                      className="w-full py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 min-h-[40px]"
                    >
                      View Vehicle Passport
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-neutral-500">No vehicles match your search.</div>
              )
            )}

            {/* People Render */}
            {activeTab === 'people' && (
              filteredPeople.length > 0 ? (
                filteredPeople.map(p => (
                  <div key={p.id} className="bg-neutral-50 border border-neutral-200 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-[#ff3b30] hover:bg-[#ff3b30]/5 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full p-0.5 shrink-0 ${
                          p.is_supporter ? 'bg-gradient-to-tr from-[#ffe066] to-[#ff9900] gold-glow-ring' : 'bg-neutral-205'
                        }`}>
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border border-neutral-100">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-neutral-300" />
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base font-black text-neutral-900 uppercase flex items-center gap-1.5">
                            {p.display_name}
                            {p.is_supporter && (
                              <span className="text-[8px] bg-yellow-400 text-black font-black uppercase px-1.5 py-0.5 rounded shadow-sm">Supporter</span>
                            )}
                          </h3>
                          {p.location && (
                            <p className="text-[10px] text-neutral-500 font-mono font-bold flex items-center gap-0.5 mt-0.5"><MapPin className="w-3 h-3 text-[#ff3b30]" /> {p.location}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-600 font-medium leading-relaxed mt-2">{p.bio || 'No bio provided.'}</p>
                    </div>

                    <Link
                      href={`/u/${p.id}`}
                      className="w-full py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 min-h-[40px]"
                    >
                      View Driver Profile
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-neutral-500">No members match your search.</div>
              )
            )}

            {/* Businesses Render */}
            {activeTab === 'businesses' && (
              filteredBusinesses.length > 0 ? (
                filteredBusinesses.map(b => (
                  <div key={b.id} className="bg-neutral-50 border border-neutral-200 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-[#ff3b30] hover:bg-[#ff3b30]/5 transition-all">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold text-[#ff3b30] uppercase bg-[#ff3b30]/5 border border-[#ff3b30]/10 px-2 py-0.5 rounded">
                            {b.type}
                          </span>
                          {b.is_pro && (
                            <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Verified Partner
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-neutral-900 uppercase mt-2">{b.name}</h3>
                        {b.location && (
                          <p className="text-[10px] text-neutral-500 font-mono font-bold flex items-center gap-0.5 mt-1"><MapPin className="w-3 h-3 text-[#ff3b30]" /> {b.location}</p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/b/${b.id}`}
                      className="w-full py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 min-h-[40px]"
                    >
                      View Storefront
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-neutral-500">No partners match your search.</div>
              )
            )}

            {/* Venues Render */}
            {activeTab === 'venues' && (
              filteredVenues.length > 0 ? (
                filteredVenues.map(v => (
                  <div key={v.id} className="bg-neutral-50 border border-neutral-200 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-[#ff3b30] hover:bg-[#ff3b30]/5 transition-all">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold text-cyan-600 bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded">
                            {v.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-neutral-900 uppercase mt-2">{v.name}</h3>
                        {v.location && (
                          <p className="text-[10px] text-neutral-500 font-mono font-bold flex items-center gap-0.5 mt-1"><MapPin className="w-3 h-3 text-[#ff3b30]" /> {v.location}</p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/venue/${v.id}`}
                      className="w-full py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 min-h-[40px]"
                    >
                      Enter Venue Portal
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-neutral-500">No venues match your search.</div>
              )
            )}

          </div>
        )}

      </div>
      <Footer />
    </main>
  );
}
