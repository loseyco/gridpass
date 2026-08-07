'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Search, User, MapPin, Loader2, Compass } from 'lucide-react';

interface ExploreUser {
  id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  is_supporter?: boolean;
}

export default function MembersPage() {
  const [people, setPeople] = useState<ExploreUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  useEffect(() => {
    let isMounted = true;

    async function loadMembers() {
      if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const mockPeople: ExploreUser[] = [
          {
            id: 'user-marcus-123',
            display_name: 'Marcus Mustang',
            bio: 'Mustang builder, track day enthusiast, and original backer.',
            location: 'Grayslake, IL',
            is_supporter: true
          },
          {
            id: 'user-kristina-456',
            display_name: 'Kristina',
            bio: 'Co-owner of the 2007 Sea-Doo GTI SE. Out on the water every weekend!',
            location: 'Round Lake Beach, IL',
            is_supporter: false
          },
          {
            id: 'user-mike-789',
            display_name: 'Mike Mechanic',
            bio: 'Performance engineer at Monmouth Marine Ford. Custom Dyno work is my specialty.',
            location: 'Freehold, NJ',
            is_supporter: false
          }
        ];
        if (isMounted) {
          setPeople(mockPeople);
          setLoading(false);
        }
        return;
      }

      try {
        const uSnap = await getDocs(query(collection(db, 'users'), limit(50)));
        const uList = uSnap.docs
          .map(uDoc => {
            const data = uDoc.data();
            return {
              id: uDoc.id,
              display_name: data.display_name || data.name || '',
              bio: data.bio || '',
              avatar_url: data.avatar_url || '',
              location: data.location || data.home_town || '',
              is_supporter: data.is_supporter === true
            } as ExploreUser;
          })
          .filter(u => u.display_name.trim() !== '' && u.display_name !== 'Anonymous Member');

        if (isMounted) {
          setPeople(uList);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load members directory:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadMembers();
    return () => { isMounted = false; };
  }, [isMock]);

  const filteredPeople = people.filter(p => {
    const term = searchQuery.toLowerCase();
    return (
      (p.display_name || '').toLowerCase().includes(term) ||
      (p.bio || '').toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term)
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
              Members Directory
            </h1>
            <span className="text-[10px] text-neutral-500 font-mono font-semibold">
              {filteredPeople.length} Active Member Profiles
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
            placeholder="Search name, bio, location..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#ff3b30] transition-colors"
          />
        </div>
      </div>

      {/* High-Density Compact Horizontal List Rows */}
      <div className="space-y-2 text-left">
        {filteredPeople.length > 0 ? (
          filteredPeople.map((p) => (
            <Link
              key={p.id}
              href={`/u/${p.id}`}
              className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
            >
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full p-0.5 shrink-0 ${p.is_supporter ? 'bg-gradient-to-tr from-[#ffe066] to-[#ff9900]' : 'bg-neutral-200'}`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border border-neutral-100">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
              </div>

              {/* Center Details */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-neutral-900 uppercase truncate group-hover:text-[#ff3b30] transition-colors">
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
                {p.bio && (
                  <p className="text-xs text-neutral-600 font-medium truncate">
                    {p.bio}
                  </p>
                )}
              </div>

              {/* Right Action Pill */}
              <div className="shrink-0">
                <span className="py-1 px-3 bg-neutral-900 group-hover:bg-[#ff3b30] text-white text-[9px] font-mono font-bold uppercase rounded-xl transition-colors inline-block shadow-2xs">
                  Profile →
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-16 text-center text-neutral-400 font-mono text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-2xl">
            No members match your search
          </div>
        )}
      </div>

    </div>
  );
}
