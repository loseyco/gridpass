'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Search, Car, Loader2, Compass } from 'lucide-react';

interface ExploreVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  tag_id: string;
  photo_url?: string;
  specs?: { engine?: string; hp?: number | string };
  co_owners?: string[] | string;
  ownership_split?: string;
  trim?: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<ExploreVehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  useEffect(() => {
    let isMounted = true;

    async function loadVehicles() {
      if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const mockVehicles: ExploreVehicle[] = [
          {
            id: 'mock-v1',
            year: 2024,
            make: 'Ford',
            model: 'Mustang GT',
            tag_id: 'GP-MARCUS-GT',
            photo_url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=400&q=80',
            specs: { engine: '5.0L Coyote V8', hp: 480 },
            trim: 'Premium'
          },
          {
            id: 'seadoo-mock-v1',
            year: 2007,
            make: 'Sea-Doo',
            model: 'GTI SE',
            tag_id: 'GP-SEADOO-07',
            specs: { engine: 'Rotax 1503 NA', hp: 130 },
            co_owners: 'Kristina & PJ',
            ownership_split: '50/50',
            trim: 'SE'
          },
          {
            id: 'mock-v2',
            year: 2020,
            make: 'Ferrari',
            model: '488 Pista',
            tag_id: 'GP-FERRARI',
            specs: { engine: '3.9L Twin-Turbo V8', hp: 710 },
            trim: 'Pista'
          }
        ];
        if (isMounted) {
          setVehicles(mockVehicles);
          setLoading(false);
        }
        return;
      }

      try {
        const vSnap = await getDocs(query(collection(db, 'vehicles'), limit(50)));
        const vList = vSnap.docs
          .map(vDoc => {
            const data = vDoc.data();
            return {
              id: vDoc.id,
              year: data.year || 2024,
              make: data.make || '',
              model: data.model || '',
              tag_id: data.tag_id || `GP-${vDoc.id.slice(0, 6).toUpperCase()}`,
              photo_url: data.photo_url || data.imageUrl || data.image_url || data.photoUrl || (data.images && data.images[0]) || '',
              specs: {
                engine: data.specs?.engine || data.engine || '',
                hp: data.specs?.hp || data.power || ''
              },
              co_owners: data.co_owners || '',
              ownership_split: data.ownership_split || '',
              trim: data.trim || ''
            } as ExploreVehicle;
          })
          .filter(v => v.make.trim() !== '' && v.model.trim() !== '');

        if (isMounted) {
          setVehicles(vList);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load vehicles directory:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadVehicles();
    return () => { isMounted = false; };
  }, [isMock]);

  const filteredVehicles = vehicles.filter(v => {
    const term = searchQuery.toLowerCase();
    return (
      (v.make || '').toLowerCase().includes(term) ||
      (v.model || '').toLowerCase().includes(term) ||
      (v.tag_id || '').toLowerCase().includes(term) ||
      String(v.year).includes(term)
    );
  });

  // Safe helper to format co_owners array, object, or string
  const formatOwnerNames = (co_owners: any): string => {
    if (!co_owners) return '';
    if (typeof co_owners === 'string') return co_owners;
    if (Array.isArray(co_owners)) {
      return co_owners
        .map(o => (typeof o === 'object' && o !== null ? (o.name || o.display_name || o.id || '') : String(o)))
        .filter(Boolean)
        .join(' & ');
    }
    if (typeof co_owners === 'object' && co_owners !== null) {
      return co_owners.name || co_owners.display_name || co_owners.owner || '';
    }
    return String(co_owners);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-[400px]">
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
              Vehicles Registry
            </h1>
            <span className="text-[10px] text-neutral-500 font-mono font-semibold">
              {filteredVehicles.length} Verified Passports
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search make, model, year, tag ID..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#ff3b30] transition-colors"
          />
        </div>
      </div>

      {/* High-Density Compact Horizontal List Rows */}
      <div className="space-y-2 text-left">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((v) => {
            const ownerStr = formatOwnerNames(v.co_owners);

            return (
              <Link 
                key={v.id}
                href={`/v/${v.id}`}
                className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
              >
                {/* Left Thumbnail Photo */}
                <div className="w-20 h-16 rounded-xl bg-neutral-200 border border-neutral-300 overflow-hidden shrink-0">
                  {v.photo_url ? (
                    <img src={v.photo_url} alt={v.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-neutral-400" />
                    </div>
                  )}
                </div>

                {/* Center Details */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h3 className="text-sm font-black text-neutral-900 uppercase truncate group-hover:text-[#ff3b30] transition-colors">
                    {v.year} {v.make} {v.model} {v.trim || ''}
                  </h3>

                  <p className="text-[10px] text-neutral-500 font-mono font-bold truncate">
                    {v.specs?.engine ? `Engine: ${v.specs.engine}${v.specs.hp ? ` (${v.specs.hp} HP)` : ''}` : 'Build Specs & Passport'}
                  </p>
                </div>

                {/* Right Action Button */}
                <div className="shrink-0">
                  <span className="py-1 px-3 bg-neutral-900 group-hover:bg-[#ff3b30] text-white text-[9px] font-mono font-bold uppercase rounded-xl transition-colors inline-block shadow-2xs">
                    Passport →
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="py-16 text-center text-neutral-400 font-mono text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-2xl">
            No vehicles match your search
          </div>
        )}
      </div>

    </div>
  );
}
