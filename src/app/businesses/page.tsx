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
    <div className="min-h-screen bg-white text-neutral-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Directory Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1 text-left">
            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Gridpass Partner Network</span>
            <h1 className="text-xl md:text-2xl font-black uppercase text-neutral-900 tracking-tight leading-none">Dealerships & Venues</h1>
          </div>

          <Link
            href="/dash/businesses/edit?id=new"
            className="py-2.5 px-5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
          >
            Add Your Business
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners by name, category, or city..."
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-950 placeholder-neutral-450 focus:outline-none focus:border-[#ff3b30] transition-colors"
          />
        </div>

        {/* Directory Rows */}
        <div className="space-y-3">
          {filteredBusinesses.length > 0 ? (
            filteredBusinesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/b/${biz.id}`}
                className="p-4 bg-neutral-50 border border-neutral-200 hover:border-[#ff3b30] hover:shadow-sm rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all group cursor-pointer text-left"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 uppercase tracking-widest">
                      {categoryLabels[biz.category] || 'Partner'}
                    </span>
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase tracking-wider flex items-center gap-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>

                  <h3 className="text-sm font-black uppercase text-neutral-900 group-hover:text-[#ff3b30] transition-colors truncate tracking-tight">
                    {biz.name}
                  </h3>

                  <p className="text-xs text-neutral-550 leading-relaxed font-medium line-clamp-2 max-w-2xl">
                    {biz.description}
                  </p>

                  <div className="text-[9px] font-mono font-bold text-neutral-450 uppercase flex flex-col sm:flex-row sm:gap-4 gap-1 pt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-neutral-450" /> {biz.location_name}</span>
                    {biz.website_url && (
                      <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-neutral-450" /> {biz.website_url.replace(/(^\w+:|^)\/\//, '')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-wider self-end md:self-center shrink-0 group-hover:translate-x-1 transition-transform">
                  View Profile <ArrowRight className="w-3.5 h-3.5" />
                </div>

              </Link>
            ))
          ) : (
            <div className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl text-neutral-400 space-y-2 bg-neutral-50/50">
              <Building2 className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs uppercase font-mono font-bold">No registered businesses found matching search criteria.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
