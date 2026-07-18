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
    <div className="flex-1 bg-white text-neutral-900 flex flex-col max-w-4xl mx-auto w-full p-4 space-y-6">
      
      {/* Title block */}
      <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-3xl space-y-2 text-left">
        <span className="text-[10px] font-mono font-bold text-[#ff3b30] uppercase tracking-widest bg-[#ff3b30]/5 border border-[#ff3b30]/15 px-3 py-1 rounded-full inline-flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" /> Registry Directory
        </span>
        <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight leading-none">
          Explore Members
        </h1>
        <p className="text-[11px] text-neutral-500 max-w-xl">
          Browse and search public profiles for registered Gridpass members.
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
          placeholder="Search members by name, bio, or location..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-bold text-neutral-900 placeholder-neutral-400"
        />
      </div>

      {/* Grid of Members */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredPeople.length > 0 ? (
          filteredPeople.map((p) => (
            <div 
              key={p.id} 
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-3xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full p-0.5 shrink-0 flex items-center justify-center relative ${
                    p.is_supporter ? 'bg-gradient-to-tr from-[#ffe066] to-[#ff9900] gold-glow-ring' : 'bg-neutral-200 border border-neutral-300'
                  }`}>
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-1">
                      {p.display_name}
                      {p.is_supporter && (
                        <span className="text-[7px] bg-[#ffd60a] text-black font-black uppercase px-1.5 py-0.5 rounded shadow-sm">Supporter</span>
                      )}
                    </h3>
                    {p.location && (
                      <p className="text-[8px] text-neutral-400 font-mono font-bold flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-[#ff3b30]" /> {p.location}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-600 font-medium leading-relaxed">
                  {p.bio || 'No bio provided.'}
                </p>
              </div>

              <Link
                href={`/u/${p.id}`}
                className="w-full py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center"
              >
                View Profile
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-[10px] font-mono font-bold text-neutral-400 uppercase">
            No members match your search
          </div>
        )}
      </div>

    </div>
  );
}
