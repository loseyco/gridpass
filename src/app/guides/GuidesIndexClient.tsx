'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Search, BookOpen, Anchor, Compass, Navigation, 
  ShieldAlert, Sparkles, ChevronRight, Play, Share2, Clock
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GUIDES } from '@/lib/data/guides';

export default function GuidesIndex() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Guides', icon: BookOpen },
    { id: 'watercraft', label: 'Watercraft & PWC', icon: Anchor },
    { id: 'offroad', label: 'Off-Road & UTV/4x4', icon: Navigation },
    { id: 'motorcycle', label: 'Motorcycle & Moto', icon: Compass },
  ];

  // Sort guides by publishDate (latest first)
  const sortedGuides = [...GUIDES].sort((a, b) => {
    if (a.publishDate === 'Scheduled' && b.publishDate !== 'Scheduled') return -1;
    if (b.publishDate === 'Scheduled' && a.publishDate !== 'Scheduled') return 1;
    if (a.publishDate === 'Scheduled' && b.publishDate === 'Scheduled') return 0;

    const dateA = new Date(a.publishDate.split('(')[0].trim());
    const dateB = new Date(b.publishDate.split('(')[0].trim());
    return dateB.getTime() - dateA.getTime();
  });

  // Filter guides based on category and search query
  const filteredGuides = sortedGuides.filter(guide => {
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          guide.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Billboard is the Northern Illinois Lakes Registration Guide
  const billboardGuide = sortedGuides.find(g => g.slug === 'illinois-lakes-registration-launches-rules') || sortedGuides[0];
  // Trending contains all guides except the billboard guide, ordered logically
  const trendingGuides = sortedGuides.filter(g => g.slug !== billboardGuide.slug);

  const getCategoryButtonText = (category: string) => {
    switch (category) {
      case 'watercraft':
        return 'PWC Guide';
      case 'offroad':
        return 'Off-Road Guide';
      case 'motorcycle':
        return 'Moto Guide';
      default:
        return 'Handbook';
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden selection:bg-rose-500/30 flex flex-col justify-between">
      {/* Carbon/Crimson ambient background glow */}
      <div className="mesh-glow" />

      <Navbar />

      {/* Netflix-Style Cinematic Billboard */}
      {billboardGuide && !searchQuery && selectedCategory === 'all' && (
        <section className="pt-32 pb-6 px-6 max-w-5xl mx-auto w-full relative z-10">
          <div className="relative rounded-[2.5rem] border border-neutral-900 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-neutral-900/40 p-8 md:p-12 overflow-hidden shadow-2xl min-h-[380px] flex flex-col justify-end group">
            {/* Cinematic Background Glows */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#bd2925]/15 via-transparent to-transparent pointer-events-none z-0" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/15 transition-all duration-700 pointer-events-none z-0" />
            <div className="absolute inset-0 bg-neutral-950/20 z-0" />

            <div className="relative z-10 max-w-3xl space-y-5 text-left">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest bg-rose-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-rose-500/10">
                  <Sparkles className="w-3.5 h-3.5" /> Billboard Feature
                </span>
                <span className="text-xs font-mono font-bold text-neutral-400">{billboardGuide.readTime}</span>
                <span className="text-xs font-mono font-bold text-neutral-500">•</span>
                <span className="text-xs font-mono font-bold text-neutral-400">{billboardGuide.publishDate}</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight select-none">
                {billboardGuide.title}
              </h2>

              <p className="text-sm md:text-base text-neutral-400 leading-relaxed line-clamp-3">
                {billboardGuide.description}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link 
                  href={`/guides/${billboardGuide.slug}`}
                  aria-label={`Read handbook: ${billboardGuide.title}`}
                  className="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#bd2925] hover:bg-[#bd2925]/90 text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#bd2925]/20 scale-100 active:scale-98"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>Read Complete Lakes Handbook</span>
                </Link>
                
                <button 
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(`${window.location.origin}/guides/${billboardGuide.slug}`);
                      alert("Link copied to clipboard!");
                    }
                  }}
                  className="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-white flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-rose-500" />
                  <span>Share Link</span>
                </button>
              </div>
            </div>
            
            {/* Ambient graphical element */}
            <div className="absolute right-8 bottom-8 hidden lg:block opacity-20 group-hover:opacity-35 transition-all duration-500 z-0 group-hover:scale-105 group-hover:rotate-6">
              <BookOpen className="w-48 h-48 text-rose-500" />
            </div>
          </div>
        </section>
      )}

      {/* Netflix-Style Sideways Scrolling Row */}
      {trendingGuides.length > 0 && !searchQuery && selectedCategory === 'all' && (
        <section className="py-6 px-6 max-w-5xl mx-auto w-full relative z-10 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" /> Trending Releases
            </h3>
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider select-none animate-pulse">Swipe Sideways →</span>
          </div>

          {/* Horizontally scrollable row container */}
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 scroll-smooth no-scrollbar snap-x snap-mandatory">
            {trendingGuides.map((guide) => {
              const isComingSoon = guide.publishDate === 'Scheduled';
              
              const rowCardContent = (
                <div className="w-80 sm:w-96 h-52 shrink-0 glass-card rounded-3xl border border-neutral-900 hover:border-[#bd2925]/30 bg-neutral-950/20 hover:bg-neutral-950/40 p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group snap-start cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-[#bd2925]/5">
                  {/* Subtle red glow background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.02] to-transparent pointer-events-none" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono font-black uppercase tracking-widest text-[#bd2925] bg-[#bd2925]/5 border border-[#bd2925]/10 px-2 py-0.5 rounded">
                        {guide.category}
                      </span>
                      {!isComingSoon && (
                        <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-500">
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                          <span>{guide.readTime}</span>
                        </div>
                      )}
                      {isComingSoon && (
                        <span className="text-[8px] font-mono font-black uppercase bg-neutral-900 border border-neutral-850 text-neutral-500 px-2 py-0.5 rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-white uppercase group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                      {guide.title}
                    </h4>

                    <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-3">
                      {guide.description}
                    </p>
                  </div>

                  <div className="border-t border-neutral-900/60 pt-3 flex justify-between items-center text-[10px] font-mono">
                    <div className="flex gap-1.5 text-neutral-500">
                      {guide.tags.slice(0, 2).map((tag) => (
                        <span key={tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {!isComingSoon && (
                      <span className="font-bold text-neutral-400 group-hover:text-white flex items-center gap-1 transition-colors">
                        Read {getCategoryButtonText(guide.category)} <ChevronRight className="w-3.5 h-3.5 text-rose-500" />
                      </span>
                    )}
                  </div>
                </div>
              );

              return isComingSoon ? (
                <div key={guide.slug} className="opacity-75 pointer-events-none">
                  {rowCardContent}
                </div>
              ) : (
                <Link key={guide.slug} href={`/guides/${guide.slug}`} aria-label={`Read guide: ${guide.title}`}>
                  {rowCardContent}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Explorer section title (Search & filters) */}
      <section className="pt-8 pb-4 px-6 max-w-5xl mx-auto w-full relative z-10 text-left">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-rose-500" /> Guide Explorer
            </h3>
            <p className="text-xs text-neutral-500">
              Filter by category or search our library of action handbooks.
            </p>
          </div>
        </div>
      </section>

      {/* Controls: Search and Filters */}
      <section className="px-6 max-w-5xl mx-auto w-full relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-neutral-950/40 p-4 rounded-3xl border border-neutral-900 backdrop-blur-md">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search guides, gear, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-850 hover:border-neutral-750 focus:border-[#bd2925] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-500 transition-colors"
            />
          </div>

          {/* Categories Pill List */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[#bd2925] to-rose-600 text-white shadow-lg shadow-[#bd2925]/20 scale-[1.02]'
                      : 'bg-neutral-900 border border-neutral-850 text-neutral-400 hover:border-neutral-750 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid of Other Guides */}
      <section className="py-8 px-6 max-w-5xl mx-auto w-full relative z-10 mb-16">
        {filteredGuides.length === 0 ? (
          <div className="text-center py-16 bg-neutral-950/20 border border-neutral-900 rounded-3xl backdrop-blur-md space-y-4">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-black uppercase text-white">No Guides Found</h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">Try refining your search query or selecting a different category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => {
              const isComingSoon = guide.publishDate === 'Scheduled';
              const CardContent = (
                <div className={`glass-card p-6 rounded-3xl border flex flex-col justify-between h-full transition-all relative overflow-hidden ${
                  isComingSoon 
                    ? 'border-neutral-900 bg-neutral-950/10 opacity-70' 
                    : 'border-neutral-900 hover:border-[#bd2925]/30 bg-neutral-950/30 hover:scale-[1.01] hover:shadow-lg hover:shadow-[#bd2925]/5 cursor-pointer'
                }`}>
                  {isComingSoon && (
                    <div className="absolute top-4 right-4 bg-neutral-900 text-neutral-500 border border-neutral-800 text-[8px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded">
                      Coming Soon
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#bd2925] bg-[#bd2925]/5 border border-[#bd2925]/10 px-2 py-0.5 rounded">
                        {guide.category}
                      </span>
                      {!isComingSoon && (
                        <>
                          <span className="text-[9px] font-mono font-semibold text-neutral-600">•</span>
                          <span className="text-[9px] font-mono font-semibold text-neutral-500">{guide.readTime}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-black text-white uppercase group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                      {guide.title}
                    </h3>

                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                      {guide.description}
                    </p>
                  </div>

                  <div className="border-t border-neutral-900/60 pt-4 mt-6 flex justify-between items-center">
                    <div className="flex gap-1.5">
                      {guide.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[9px] font-mono text-neutral-505">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {!isComingSoon && (
                      <span className="text-[10px] font-mono font-bold text-neutral-400 hover:text-white flex items-center gap-1">
                        Read {getCategoryButtonText(guide.category)} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );

              return isComingSoon ? (
                <div key={guide.slug}>{CardContent}</div>
              ) : (
                <Link key={guide.slug} href={`/guides/${guide.slug}`} aria-label={`Read guide: ${guide.title}`}>
                  {CardContent}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
