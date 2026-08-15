'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  CURATED_PADDOCK_ENTITIES,
  PaddockEntityRef,
  ENTITY_TYPE_LABELS,
  PaddockEntityType,
} from '@/lib/types/news';
import {
  getFollowedEntities,
  toggleFollowEntity,
  FollowedEntity,
} from '@/lib/utils/paddockFollow';
import { useToast } from '@/components/ToastContext';
import {
  Search,
  Flame,
  Check,
  Plus,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  Rss,
  Radio,
} from 'lucide-react';

const DIRECTORY_TABS: { id: 'all' | PaddockEntityType; label: string; icon: string }[] = [
  { id: 'all', label: 'All Entities', icon: '⚡' },
  { id: 'series', label: 'Championship Series', icon: '🏆' },
  { id: 'team', label: 'Race Teams', icon: '🏎️' },
  { id: 'driver', label: 'Drivers & Athletes', icon: '🏁' },
  { id: 'venue', label: 'Iconic Venues & Tracks', icon: '📍' },
  { id: 'network', label: 'Broadcast Networks', icon: '📡' },
];

export default function PaddockDirectoryPage() {
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState<'all' | PaddockEntityType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [followedEntities, setFollowedEntities] = useState<FollowedEntity[]>([]);
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});

  // Sync followed topics
  useEffect(() => {
    setFollowedEntities(getFollowedEntities());

    const handleFollowChange = () => {
      setFollowedEntities(getFollowedEntities());
    };

    window.addEventListener('gridpass_follow_change', handleFollowChange);
    return () => window.removeEventListener('gridpass_follow_change', handleFollowChange);
  }, []);

  // Listen to articles to compute real-time story counts per entity
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'news_articles'), (snap) => {
      const counts: Record<string, number> = {};

      snap.forEach((docSnap) => {
        const art = docSnap.data();
        if (art.is_public !== false) {
          const entities = art.entities || [];
          entities.forEach((ent: any) => {
            if (ent.slug) {
              counts[ent.slug] = (counts[ent.slug] || 0) + 1;
            }
          });
        }
      });

      setArticleCounts(counts);
    });

    return () => unsub();
  }, []);

  const isFollowed = (slug: string) => {
    return followedEntities.some((f) => f.slug.toLowerCase() === slug.toLowerCase());
  };

  const handleToggleFollow = (ent: PaddockEntityRef) => {
    const isNowFollowing = toggleFollowEntity(ent);
    setFollowedEntities(getFollowedEntities());

    showToast({
      title: isNowFollowing ? 'Following Entity' : 'Unfollowed Entity',
      message: isNowFollowing
        ? `Added "${ent.name}" to your personal news wire.`
        : `Removed "${ent.name}" from followed topics.`,
      icon: isNowFollowing ? '⚡' : '📌',
    });
  };

  // Filtered & Sorted Entities
  const filteredEntities = useMemo(() => {
    return CURATED_PADDOCK_ENTITIES.filter((ent) => {
      if (selectedType !== 'all' && ent.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ent.name.toLowerCase().includes(q);
        const matchesBio = ent.bio?.toLowerCase().includes(q);
        const matchesSlug = ent.slug.toLowerCase().includes(q);
        return matchesName || matchesBio || matchesSlug;
      }
      return true;
    }).sort((a, b) => {
      // Pinned followed entities first
      const aFollowed = isFollowed(a.slug);
      const bFollowed = isFollowed(b.slug);
      if (aFollowed && !bFollowed) return -1;
      if (!aFollowed && bFollowed) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [selectedType, searchQuery, followedEntities]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pb-24">
      {/* 1. Header Banner */}
      <div className="bg-neutral-950 text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/80 border border-red-800/80 rounded-full text-[#ff3b30] text-[11px] font-black uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                <span>Paddock Entities &amp; Championship Directory</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                Motorsport Hubs Directory
              </h1>
              <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
                Follow your favorite racing championships, factory teams, drivers, and iconic circuits to curate your continuous personalized news wire.
              </p>
            </div>

            <Link
              href="/news"
              className="min-h-[44px] px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
            >
              <span>← Back to All News</span>
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search series, teams, drivers, tracks (e.g. NASCAR, Hendrick, Road America)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[48px] pl-11 pr-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-[#ff3b30] transition"
              />
            </div>

            <div className="sm:col-span-4 flex items-center justify-end font-mono text-xs text-neutral-400">
              <span>{followedEntities.length} Topics Followed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Directory Tabs */}
      <div className="border-b border-neutral-200 bg-neutral-50 sticky top-0 z-30 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2">
          {DIRECTORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                selectedType === tab.id
                  ? 'bg-neutral-900 text-white font-black shadow-xs'
                  : 'bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Entities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
          <span>Showing {filteredEntities.length} Paddock Hubs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntities.map((ent) => {
            const following = isFollowed(ent.slug);
            const meta = ENTITY_TYPE_LABELS[ent.type];
            const storyCount = articleCounts[ent.slug] || 0;

            return (
              <div
                key={ent.slug}
                className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-md ${
                  following ? 'border-neutral-900 ring-1 ring-neutral-900/10' : 'border-neutral-200'
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Top Row: Logo & Follow Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 p-2.5 flex items-center justify-center shrink-0 shadow-inner">
                      {ent.image_url ? (
                        <img
                          src={ent.image_url}
                          alt={ent.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-2xl">{meta.icon}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(ent)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        following
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                          : 'bg-[#ff3b30] hover:bg-[#d63025] text-white shadow-xs'
                      }`}
                    >
                      {following ? (
                        <>
                          <Check className="w-4 h-4 text-[#ff3b30]" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>+ Follow</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Name & Bio */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-black uppercase rounded-md">
                        {meta.label}
                      </span>
                      {storyCount > 0 && (
                        <span className="text-[10px] font-mono font-bold text-[#ff3b30] flex items-center gap-1">
                          <Rss className="w-3 h-3" />
                          {storyCount} Stories
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-lg text-neutral-900 uppercase leading-snug group-hover:text-[#ff3b30] transition">
                      <Link href={`/news/hub/${ent.type}/${ent.slug}`}>
                        {ent.name}
                      </Link>
                    </h3>

                    {ent.bio && (
                      <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                        {ent.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Hub Page Link */}
                <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                  <Link
                    href={`/news/hub/${ent.type}/${ent.slug}`}
                    className="text-xs font-black uppercase tracking-wider text-neutral-900 hover:text-[#ff3b30] transition flex items-center gap-1.5"
                  >
                    <span>View Hub Page</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#ff3b30]" />
                  </Link>

                  {ent.official_website && (
                    <a
                      href={ent.official_website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-neutral-900 transition p-1"
                      title="Official Website"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
