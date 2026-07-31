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

  if (loading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col max-w-4xl mx-auto w-full p-4 space-y-6">
      
      {/* Title block */}
      <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-3xl space-y-2 text-left">
        <span className="text-[10px] font-mono font-bold text-[#ff3b30] uppercase tracking-widest bg-[#ff3b30]/5 border border-[#ff3b30]/15 px-3 py-1 rounded-full inline-flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" /> Registry Directory
        </span>
        <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight leading-none">
          Explore Vehicles
        </h1>
        <p className="text-[11px] text-neutral-500 max-w-xl">
          Browse and search public profile records for registered vehicles.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
          <Search className="w-4 h-4" />
        </span>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vehicles by make, model, year, or QR tag ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-bold text-neutral-900 placeholder-neutral-400"
        />
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((v) => (
            <div 
              key={v.id} 
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-3xl flex flex-col justify-between space-y-4 text-left"
            >
              <div className="space-y-3">
                {v.photo_url ? (
                  <div className="w-full h-36 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100">
                    <img src={v.photo_url} alt={v.model} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-36 rounded-2xl border border-neutral-200 bg-neutral-100/50 flex items-center justify-center">
                    <Car className="w-8 h-8 text-neutral-350" />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-mono font-bold text-[#ff3b30] uppercase bg-[#ff3b30]/5 border border-[#ff3b30]/15 px-2 py-0.5 rounded">
                      {v.tag_id}
                    </span>
                    {v.co_owners && (
                      <span className="text-[8px] font-mono font-bold text-blue-500 uppercase bg-blue-50 border border-blue-150 px-2 py-0.5 rounded">
                        Shared {v.ownership_split || 'Split'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase mt-2 leading-tight">
                    {v.year} {v.make} {v.model} {v.trim}
                  </h3>
                  {v.co_owners && (
                    <p className="text-[9px] text-neutral-500 mt-2 leading-none font-semibold">
                      Owner(s): <span className="text-neutral-700 font-bold">{Array.isArray(v.co_owners) ? v.co_owners.join(' & ') : v.co_owners}</span>
                    </p>
                  )}
                </div>
              </div>

              <Link
                href={`/v/${v.id}`}
                className="w-full py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center"
              >
                View Vehicle Profile
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-[10px] font-mono font-bold text-neutral-400 uppercase">
            No vehicles match your search
          </div>
        )}
      </div>

    </div>
  );
}
