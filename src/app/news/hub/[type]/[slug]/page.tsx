'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  Article,
  ArticleUpdate,
  PaddockEntityType,
  PaddockEntityRef,
  CURATED_PADDOCK_ENTITIES,
  ENTITY_TYPE_LABELS,
  CATEGORY_LABELS,
} from '@/lib/types/news';
import {
  isEntityFollowed,
  toggleFollowEntity,
  getFollowedEntities,
} from '@/lib/utils/paddockFollow';
import { useToast } from '@/components/ToastContext';
import {
  ShieldCheck,
  Clock,
  ArrowLeft,
  Share2,
  ExternalLink,
  Check,
  Rss,
  Flame,
  Radio,
  Image as ImageIcon,
  Sparkles,
  ArrowUpRight,
  Bookmark,
  Layers,
  ChevronRight,
  Info,
  Calendar,
} from 'lucide-react';

export default function DynamicEntityHubPage() {
  const params = useParams();
  const rawType = (params?.type as string) || 'series';
  const rawSlug = (params?.slug as string) || '';
  const { showToast } = useToast();

  const type = (['series', 'team', 'driver', 'venue', 'network'].includes(rawType)
    ? rawType
    : 'series') as PaddockEntityType;
  const slug = rawSlug.toLowerCase();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'timeline' | 'gallery' | 'sources'>('feed');
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);

  // 1. Resolve Entity Definition (Curated or Dynamic)
  const entity: PaddockEntityRef = useMemo(() => {
    const found = CURATED_PADDOCK_ENTITIES.find(
      (e) => e.slug.toLowerCase() === slug.toLowerCase() && e.type === type
    );
    if (found) return found;

    // Alternative match by slug only
    const foundBySlug = CURATED_PADDOCK_ENTITIES.find(
      (e) => e.slug.toLowerCase() === slug.toLowerCase()
    );
    if (foundBySlug) return { ...foundBySlug, type };

    // Format human-readable fallback name from slug
    const formattedName = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      type,
      name: formattedName,
      slug,
      bio: `Verified intelligence stream, paddock telemetry, and reporting wire for ${formattedName}.`,
    };
  }, [slug, type]);

  // 2. Initialize Follow State
  useEffect(() => {
    setIsFollowing(isEntityFollowed(slug));

    const handleFollowChange = () => {
      setIsFollowing(isEntityFollowed(slug));
    };

    window.addEventListener('gridpass_follow_change', handleFollowChange);
    return () => {
      window.removeEventListener('gridpass_follow_change', handleFollowChange);
    };
  }, [slug]);

  // 3. Firestore Real-Time Query for Articles mentioning this entity
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'news_articles'),
      (snap) => {
        const list: Article[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Article;
          if (data.is_public !== false && data.status !== 'draft') {
            list.push({ ...data, id: docSnap.id });
          }
        });

        // Filter articles strictly and accurately mentioning this entity
        const matched = list.filter((art) => {
          // 1. Explicit entity reference
          const mentionsInEntities = art.entities?.some(
            (e) =>
              e.slug.toLowerCase() === slug.toLowerCase() ||
              e.name.toLowerCase() === entity.name.toLowerCase()
          );

          // 2. Explicit tag reference
          const mentionsInTags = art.tags?.some(
            (t) =>
              t.toLowerCase().replace(/[^a-z0-9]/g, '') === slug.replace(/[^a-z0-9]/g, '') ||
              t.toLowerCase().includes(slug)
          );

          // 3. Related driver reference
          const mentionsInDrivers = art.related_drivers?.some(
            (d) =>
              d.name.toLowerCase().includes(slug.replace(/-/g, ' ')) ||
              d.id.toLowerCase() === slug
          );

          // 4. Headline or Summary Match (Title & Summary are intentional, high-signal)
          const searchPattern = new RegExp(`\\b${slug.replace(/-/g, '[ -]?')}\\b`, 'i');
          const titleOrSummaryMatch =
            (art.title && searchPattern.test(art.title)) ||
            (art.summary && searchPattern.test(art.summary));

          // 5. Discipline Guardrail: If this entity belongs to a specific category (e.g. IndyCar is open_wheel),
          // reject stories that belong to completely different disciplines (e.g. stock_car) unless explicitly tagged in art.entities.
          if (entity.category && art.category && entity.category !== art.category) {
            return mentionsInEntities; // Only allow if explicitly tagged as a crossover
          }

          return mentionsInEntities || mentionsInTags || mentionsInDrivers || titleOrSummaryMatch;
        });

        // Sort descending by published_at
        matched.sort((a, b) => {
          const tA = a.published_at || a.created_at || '';
          const tB = b.published_at || b.created_at || '';
          return tB.localeCompare(tA);
        });

        setArticles(matched);
        setLoading(false);
      },
      (err) => {
        console.warn('Entity hub query error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [slug, entity.name]);

  // Extract all Living Wire Updates across matching articles
  const entityUpdates: Array<ArticleUpdate & { articleTitle: string; articleSlug: string }> = useMemo(() => {
    const updates: Array<ArticleUpdate & { articleTitle: string; articleSlug: string }> = [];
    articles.forEach((art) => {
      if (art.updates && Array.isArray(art.updates)) {
        art.updates.forEach((u) => {
          updates.push({
            ...u,
            articleTitle: art.title,
            articleSlug: art.slug,
          });
        });
      }
    });

    // Sort by timestamp descending
    return updates.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [articles]);

  // Extract Gallery Images
  const galleryImages = useMemo(() => {
    const images: string[] = [];
    if (entity.image_url) images.push(entity.image_url);
    articles.forEach((art) => {
      if (art.cover_image_url && !images.includes(art.cover_image_url)) {
        images.push(art.cover_image_url);
      }
      if (art.gallery_urls && Array.isArray(art.gallery_urls)) {
        art.gallery_urls.forEach((url) => {
          if (url && !images.includes(url)) images.push(url);
        });
      }
    });
    return images;
  }, [articles, entity.image_url]);

  // Extract Unique Sources
  const distinctSources = useMemo(() => {
    const map = new Map<string, { name: string; url: string }>();
    if (entity.official_website) {
      map.set(entity.official_website, {
        name: `${entity.name} Official Portal`,
        url: entity.official_website,
      });
    }
    articles.forEach((art) => {
      art.sources?.forEach((s) => {
        if (s.url && !map.has(s.url)) {
          map.set(s.url, s);
        }
      });
    });
    return Array.from(map.values());
  }, [articles, entity]);

  // Toggle Follow
  const handleToggleFollow = () => {
    const newState = toggleFollowEntity({
      slug: entity.slug,
      name: entity.name,
      type: entity.type,
    });
    setIsFollowing(newState);

    showToast({
      title: newState ? 'Following Paddock Entity' : 'Unfollowed Entity',
      message: newState
        ? `Added "${entity.name}" to your personalized My Paddock Wire.`
        : `Removed "${entity.name}" from your followed wire.`,
      icon: newState ? '⚡' : '📌',
    });
  };

  // Share Hub
  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${entity.name} — Paddock Wire Hub`,
          text: entity.bio || `Explore verified motorsport reports and telemetry on ${entity.name}.`,
          url,
        });
      } catch {
        // Fallback
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast({
        title: 'Hub Link Copied',
        message: 'Shareable entity hub URL copied to clipboard.',
        icon: '📋',
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const typeMeta = ENTITY_TYPE_LABELS[entity.type] || {
    label: 'Paddock Entity',
    icon: '🏁',
    badgeColor: 'bg-neutral-900 text-white',
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pb-24">
      {/* Top Header Bar */}
      <div className="border-b border-neutral-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/news"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 border border-neutral-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All News</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 border border-neutral-200 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#ff3b30]" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* 1. HERO BANNER */}
        <section className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-neutral-800 relative overflow-hidden shadow-2xl">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff3b30]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              {/* Type Badge & Status */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-800/80 rounded-full text-[#ff3b30] text-[11px] font-black uppercase tracking-wider">
                  <span>{typeMeta.icon}</span>
                  <span>{typeMeta.label}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-300 text-[11px] font-black uppercase tracking-wider">
                  <span>Paddock Hub</span>
                </span>
              </div>

              {/* Entity Headline Name */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                {entity.name}
              </h1>

              {/* Bio / Description */}
              {entity.bio && (
                <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl">
                  {entity.bio}
                </p>
              )}

              {/* Action Buttons: Follow Toggle & External / Passport links */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  onClick={handleToggleFollow}
                  className={`min-h-[44px] px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center gap-2 shadow-lg cursor-pointer ${
                    isFollowing
                      ? 'bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700'
                      : 'bg-[#ff3b30] hover:bg-[#d63025] text-white'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 text-[#ff3b30]" />
                      <span>✓ Following</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>+ Follow</span>
                    </>
                  )}
                </button>

                {entity.official_website && (
                  <a
                    href={entity.official_website}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 border border-neutral-800"
                  >
                    <span>Official Website</span>
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                  </a>
                )}
              </div>

              {/* Meta metrics bar */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-neutral-400 font-mono">
                <div className="flex items-center gap-1.5 font-bold text-neutral-300">
                  <Rss className="w-3.5 h-3.5 text-[#ff3b30]" />
                  <span>{articles.length} Stories</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Radio className="w-3.5 h-3.5 text-[#ff3b30]" />
                  <span>{entityUpdates.length} Live Updates</span>
                </div>
              </div>
            </div>

            {/* Entity Visual Banner / Emblem */}
            <div className="lg:col-span-4">
              <div className="relative rounded-2xl overflow-hidden border border-neutral-800 aspect-square sm:aspect-4/3 lg:aspect-square bg-neutral-900 flex items-center justify-center shadow-2xl p-6">
                {entity.image_url ? (
                  <img
                    src={entity.image_url}
                    alt={entity.name}
                    className="w-full h-full object-contain max-h-[160px] drop-shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-4xl mx-auto shadow-inner">
                      {typeMeta.icon}
                    </div>
                    <p className="font-black text-sm uppercase text-white tracking-wider">{entity.name}</p>
                    <p className="text-xs text-neutral-400 font-mono uppercase">{typeMeta.label}</p>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-black/90 backdrop-blur-xs border border-neutral-700 text-white text-[10px] font-black uppercase rounded-md">
                    {entity.slug}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-neutral-300">
                    Live News
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. NAVIGATION TABS FOR HUB */}
        <section className="border-b border-neutral-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
            <button
              onClick={() => setActiveTab('feed')}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'feed'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
              }`}
            >
              <Rss className="w-3.5 h-3.5 text-[#ff3b30]" />
              <span>Articles & Wire Reports ({articles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'timeline'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-[#ff3b30]" />
              <span>Living Wire Timeline ({entityUpdates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'gallery'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#ff3b30]" />
              <span>Photo Gallery ({galleryImages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'sources'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#ff3b30]" />
              <span>Primary Sources ({distinctSources.length})</span>
            </button>
          </div>
        </section>

        {/* 4. TAB CONTENTS */}
        {/* TAB A: ARTICLES FEED */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center text-neutral-400 font-mono text-xs">
                <div className="w-8 h-8 border-3 border-[#ff3b30] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Querying verified wire reports for {entity.name}...
              </div>
            ) : articles.length === 0 ? (
              <div className="py-16 text-center bg-neutral-50 border border-neutral-200 rounded-3xl p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-200 text-neutral-700 flex items-center justify-center text-xl mx-auto">
                  📰
                </div>
                <h3 className="font-black text-sm uppercase text-neutral-900">
                  No Dedicated Stories Yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Follow <strong>{entity.name}</strong> to receive automatic updates on your personal wire as new race reports and telemetry are ingested.
                </p>
                <button
                  onClick={handleToggleFollow}
                  className="min-h-[44px] px-5 py-2.5 bg-[#ff3b30] text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {isFollowing ? '✓ Following on Wire' : '+ Follow Entity'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((art) => (
                  <article
                    key={art.id}
                    className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image */}
                      <Link href={`/news/${art.slug}`} className="block relative aspect-16/10 overflow-hidden bg-neutral-100">
                        {art.cover_image_url ? (
                          <img
                            src={art.cover_image_url}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400 font-bold text-xs">
                            GRIDPASS WIRE
                          </div>
                        )}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-black/85 backdrop-blur-xs text-white text-[10px] font-black uppercase rounded-md">
                            {CATEGORY_LABELS[art.category] || art.category}
                          </span>
                          {art.article_type === '4_hour_wire' && (
                            <span className="px-2 py-0.5 bg-[#ff3b30] text-white text-[10px] font-black uppercase rounded-md">
                              4H WIRE
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>
                            {art.published_at
                              ? new Date(art.published_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Live'}
                          </span>
                          <span>•</span>
                          <span>{art.reading_time_mins || 3} min read</span>
                        </div>

                        <h2 className="font-black text-base text-neutral-900 leading-snug group-hover:text-[#ff3b30] transition line-clamp-2">
                          <Link href={`/news/${art.slug}`}>
                            {art.title}
                          </Link>
                        </h2>

                        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                          {art.summary}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 pt-0 border-t border-neutral-100 mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-neutral-600">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#ff3b30]" />
                        <span>{art.sources?.length || 1} Source{(art.sources?.length || 1) > 1 ? 's' : ''}</span>
                      </div>

                      <Link
                        href={`/news/${art.slug}`}
                        className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-neutral-100 hover:bg-[#ff3b30] text-neutral-800 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-1"
                        aria-label={`Read story: ${art.title}`}
                      >
                        <span>Read</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB B: LIVING WIRE TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff3b30] animate-pulse" />
                <h3 className="font-black text-xs uppercase text-neutral-900">
                  Living Paddock Wire Telemetry & Live Notes
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 font-bold">Chronological Stream</span>
            </div>

            {entityUpdates.length === 0 ? (
              <div className="py-16 text-center bg-neutral-50 border border-neutral-200 rounded-3xl p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-200 text-neutral-700 flex items-center justify-center text-xl mx-auto">
                  📡
                </div>
                <p className="text-xs font-black uppercase text-neutral-900">
                  No Live Updates Recorded
                </p>
                <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                  Live timing updates and trackside race notes for this entity will stream here in real time during race weekends.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-neutral-200 ml-4 space-y-6 pl-6">
                {entityUpdates.map((update, index) => (
                  <div key={update.id || index} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#ff3b30] border-4 border-white shadow-xs" />

                    <div className="bg-neutral-50 hover:bg-neutral-100/80 p-5 rounded-2xl border border-neutral-200 transition space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">
                            {update.author || 'Paddock Telemetry Desk'}
                          </span>
                          <span className="text-neutral-400 font-mono text-[10px]">
                            {new Date(update.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <Link
                          href={`/news/${update.articleSlug}`}
                          className="min-h-[36px] text-[10px] font-black uppercase text-[#ff3b30] hover:underline flex items-center gap-1"
                        >
                          <span>From: {update.articleTitle}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {update.title && (
                        <h4 className="font-black text-sm text-neutral-900">
                          {update.title}
                        </h4>
                      )}

                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {update.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB C: PHOTO GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {galleryImages.length === 0 ? (
              <div className="py-16 text-center bg-neutral-50 border border-neutral-200 rounded-3xl p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-200 text-neutral-700 flex items-center justify-center text-xl mx-auto">
                  🖼️
                </div>
                <h3 className="font-black text-sm uppercase text-neutral-900">
                  No Gallery Photos Available
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  High-resolution paddock photography and shakedown imagery will be uploaded as articles are verified.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((imgUrl, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedGalleryImg(imgUrl)}
                    className="relative aspect-4/3 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 group cursor-pointer shadow-xs hover:shadow-md transition"
                  >
                    <img
                      src={imgUrl}
                      alt={`${entity.name} gallery image ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <span className="min-h-[44px] px-3 py-1.5 bg-black/80 rounded-xl text-xs font-black uppercase tracking-wider">
                        Expand
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gallery Fullscreen Modal */}
            {selectedGalleryImg && (
              <div
                onClick={() => setSelectedGalleryImg(null)}
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
              >
                <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
                  <img
                    src={selectedGalleryImg}
                    alt="Gallery expanded preview"
                    className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-neutral-800 shadow-2xl"
                  />
                  <button
                    onClick={() => setSelectedGalleryImg(null)}
                    className="min-h-[44px] min-w-[44px] absolute top-4 right-4 bg-black/80 text-white rounded-full p-2.5 font-bold hover:bg-[#ff3b30] transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB D: PRIMARY SOURCES */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            <div className="bg-neutral-950 text-white rounded-2xl p-6 border border-neutral-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#ff3b30]" />
                  <h3 className="font-black text-xs uppercase tracking-wider text-white">
                    Accredited Reporting & Official Outlets ({distinctSources.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">Verified Paddock Links</span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                All articles and telemetry updates for <strong>{entity.name}</strong> are synthesized from accredited primary wire sources, official timing desks, and sanctioning body communications:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {distinctSources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] p-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-white group-hover:text-[#ff3b30] transition truncate">
                        {source.name}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono truncate">
                        {source.url.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
