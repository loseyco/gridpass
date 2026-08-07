'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { BusinessProfile } from '@/lib/types/business';
import { 
  Building2, MapPin, Globe, Loader2, Search, ArrowRight, ShieldCheck 
} from 'lucide-react';

export default function BusinessesDirectoryPage() {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if we are running in the Playwright mock sandbox
  const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);

      if (isMock) {
        // Preseed mock businesses list for E2E sandbox verification
        const mockBusinesses: BusinessProfile[] = [
          {
            id: 'nielsens',
            owner_uid: 'user-steve-456',
            name: 'NIELSEN ENTERPRISES',
            description: 'Your premier powersports and marine dealership in Lake Villa, IL. Specializing in wave runners, PWCs, and off-road vehicles.',
            category: 'dealership',
            location_name: 'Lake Villa, IL',
            physical_address: '130 S Route 83, Lake Villa, IL 60046',
            website_url: 'https://www.nielsens.com',
            contact_email: 'sales@nielsens.com'
          },
          {
            id: 'blarney-island',
            owner_uid: 'vendor-2',
            name: 'BLARNEY ISLAND',
            description: 'Unique entertainment venue located on the Chain O Lakes in Antioch, IL. Hosting drag boat races and check-ins.',
            category: 'track_venue',
            location_name: 'Antioch, IL',
            physical_address: '27843 W Grass Lake Rd, Antioch, IL 60002',
            website_url: 'https://www.blarneyisland.com',
            contact_email: 'info@blarneyisland.com'
          },
          {
            id: 'monmouth-marine-demo',
            owner_uid: 'user-steve-456',
            name: 'Monmouth Marine Ford & Boats',
            description: 'Verified Gridpass partner dealership located in Monmouth Beach, NJ.',
            category: 'dealership',
            location_name: 'Monmouth Beach, NJ',
            physical_address: '250 State Highway 35, Monmouth Beach, NJ 07750',
            website_url: 'https://www.monmouthmarine.com',
            contact_email: 'sales@monmouthmarine.com'
          }
        ];
        setBusinesses(mockBusinesses);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDocs(collection(db, 'businesses'));
        const list: BusinessProfile[] = [];
        snap.forEach(docSnap => {
          list.push({
            id: docSnap.id,
            ...docSnap.data()
          } as BusinessProfile);
        });

        // Fallback if empty to have seeded items
        if (list.length === 0) {
          list.push({
            id: 'nielsens',
            owner_uid: 'seeded-owner-id',
            name: 'NIELSEN ENTERPRISES',
            description: 'Motorsports, marine, PWC, and powersports dealership in Lake Villa, IL.',
            category: 'dealership',
            location_name: 'Lake Villa, IL',
            physical_address: '130 S Route 83, Lake Villa, IL 60046',
            website_url: 'https://www.nielsens.com',
            contact_email: 'sales@nielsens.com'
          });
        }

        setBusinesses(list);
      } catch (err) {
        console.error("Failed to fetch businesses directory:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [isMock]);

  // Filter businesses by search term
  const filteredBusinesses = businesses.filter(biz => {
    const term = searchQuery.toLowerCase();
    return (
      biz.name.toLowerCase().includes(term) ||
      biz.location_name.toLowerCase().includes(term) ||
      (biz.description || '').toLowerCase().includes(term)
    );
  });

  const categoryLabels: Record<string, string> = {
    dealership: 'Motorsport Dealership',
    track_venue: 'Motorsport Track / Venue',
    club_organizer: 'Club / Event Organizer',
    shop_garage: 'Service Garage / Tuning Shop',
    detailing_wrap: 'Detailing & Wrap Shop',
    parts_accessories: 'Parts & Accessories',
    food_beverage: 'Food & Beverage',
    catering: 'Catering Services',
    photography_media: 'Photography & Media',
    website_tech: 'Tech & Marketing Services',
    other: 'Partner Business'
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col max-w-4xl mx-auto w-full px-3 sm:px-6 pt-16 pb-12 space-y-4">
      
      {/* Top Header & Search Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-left border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="py-1 px-3 bg-neutral-900 hover:bg-[#ff3b30] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-colors inline-flex items-center gap-1 shrink-0 shadow-2xs"
          >
            ← Explore
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-neutral-900 uppercase tracking-tight leading-none">
              Businesses &amp; Tracks
            </h1>
            <span className="text-[10px] text-neutral-500 font-mono font-semibold">
              {filteredBusinesses.length} Listed Garages &amp; Venues
            </span>
          </div>
        </div>

        {/* Search & Add Action */}
        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, category, city..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#ff3b30] transition-colors"
            />
          </div>

          <Link
            href="/b/create"
            className="py-1.5 px-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-colors inline-flex items-center gap-1 shrink-0 shadow-2xs"
          >
            + Add
          </Link>
        </div>
      </div>

      {/* High-Density Compact Horizontal List Rows */}
      <div className="space-y-2 text-left">
        {filteredBusinesses.length > 0 ? (
          filteredBusinesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/b/${biz.id}`}
              className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-blue-500 p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
            >
              {/* Icon / Thumbnail */}
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>

              {/* Center Details */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-mono font-bold text-blue-600 uppercase bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded">
                    {categoryLabels[biz.category] || 'Business'}
                  </span>
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase tracking-wider inline-flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                </div>

                <h3 className="text-sm font-black text-neutral-900 uppercase truncate group-hover:text-blue-600 transition-colors">
                  {biz.name}
                </h3>

                {biz.location_name && (
                  <p className="text-[10px] text-neutral-500 font-mono font-bold truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-400 shrink-0" /> {biz.location_name}
                  </p>
                )}
              </div>

              {/* Right Action Pill */}
              <div className="shrink-0">
                <span className="py-1 px-3 bg-blue-600 group-hover:bg-blue-700 text-white text-[9px] font-mono font-bold uppercase rounded-xl transition-colors inline-block shadow-2xs">
                  Storefront →
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-16 text-center text-neutral-400 font-mono text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-2xl">
            No businesses match your search criteria.
          </div>
        )}
      </div>

    </div>
  );
}
