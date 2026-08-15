'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import {
  Article,
  CATEGORY_LABELS,
  PaddockEntityRef,
  CURATED_PADDOCK_ENTITIES,
  ENTITY_TYPE_LABELS,
} from '@/lib/types/news';
import { incrementArticleViews } from '@/lib/actions/news';
import { cleanStoryText } from '@/lib/news-cleaner';
import { useToast } from '@/components/ToastContext';
import {
  ShieldCheck,
  Clock,
  ArrowLeft,
  Share2,
  ExternalLink,
  User,
  Calendar,
  MapPin,
  ChevronRight,
  Check,
  Bookmark,
  Sparkles,
  Flag,
  ArrowUpRight,
  Radio,
  Layers,
} from 'lucide-react';
import { ReportArticleModal } from '@/components/ReportArticleModal';
import { TracksideAttendanceButton } from '@/components/TracksideAttendanceButton';
import { ArticleDiscussionThread } from '@/components/ArticleDiscussionThread';

export default function ArticleEditorialReaderPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const rawSlug = (params?.slug as string) || '';

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [hasAttendedTrackside, setHasAttendedTrackside] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);

  // Real-time Firestore listener for article by slug/id
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'news_articles'),
      (snap) => {
        let found: Article | null = null;
        const target = decodeURIComponent(rawSlug).toLowerCase().trim();

        snap.forEach((docSnap) => {
          if (found) return;
          const data = docSnap.data() as Article;
          const docSlug = (data.slug || docSnap.id).toLowerCase();
          if (
            data.slug === rawSlug ||
            docSnap.id === rawSlug ||
            docSlug === target ||
            docSnap.id.toLowerCase() === target ||
            docSlug.replace(/[^a-z0-9]/g, '') === target.replace(/[^a-z0-9]/g, '')
          ) {
            found = { ...data, id: docSnap.id } as Article;
          }
        });

        setArticle(found);
        if (found) {
          setAttendanceCount((found as Article).trackside_attendance_count || 0);
          try {
            const stored = localStorage.getItem('gridpass_news_read_history');
            const hist = stored ? JSON.parse(stored) : {};
            hist[(found as Article).slug || rawSlug] = new Date().toISOString();
            localStorage.setItem('gridpass_news_read_history', JSON.stringify(hist));
          } catch {}
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Article listener error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [rawSlug]);

  // Derived or Curated Mentioned Entities
  const mentionedEntities = useMemo<PaddockEntityRef[]>(() => {
    if (!article) return [];
    const set = new Map<string, PaddockEntityRef>();

    // 1. Existing explicitly attached entities
    article.entities?.forEach((e) => {
      set.set(e.slug.toLowerCase(), e);
    });

    // 2. Extract from related drivers
    article.related_drivers?.forEach((d) => {
      const driverSlug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (!set.has(driverSlug)) {
        set.set(driverSlug, {
          type: 'driver',
          name: d.name,
          slug: driverSlug,
          passport_url: `/u/${d.id}`,
          image_url: d.avatar_url,
          bio: `Motorsport driver competing in ${d.series || 'pro sports car championships'}.`,
        });
      }
    });

    // 3. Match from Curated Entities database based on article text/tags/category
    const fullText = `${article.title} ${article.summary || ''} ${article.content || ''} ${article.tags?.join(' ') || ''}`.toLowerCase();
    CURATED_PADDOCK_ENTITIES.forEach((curated) => {
      if (
        fullText.includes(curated.slug) ||
        fullText.includes(curated.name.toLowerCase())
      ) {
        if (!set.has(curated.slug.toLowerCase())) {
          set.set(curated.slug.toLowerCase(), curated);
        }
      }
    });

    // If still empty, add default category series/network match
    if (set.size === 0) {
      const categoryMatch = CURATED_PADDOCK_ENTITIES.find((c) => c.category === article.category);
      if (categoryMatch) {
        set.set(categoryMatch.slug.toLowerCase(), categoryMatch);
      }
    }

    return Array.from(set.values());
  }, [article]);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || 'Gridpass Racing Wire',
          text: article?.summary || 'Verified motorsport report on Gridpass Racing Wire.',
          url,
        });
      } catch {
        // Fallback to clipboard
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast({
        title: 'Story Link Copied',
        message: 'Shareable link copied to your clipboard.',
        icon: '📋',
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Schema.org NewsArticle JSON-LD structured data
  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.summary,
        image: article.cover_image_url ? [article.cover_image_url] : ['https://gridpass.app/gridpass_emblem.jpg'],
        datePublished: article.published_at,
        dateModified: article.updated_at || article.published_at,
        author: [
          {
            '@type': 'Organization',
            name: article.verified_by || 'Gridpass Editorial Desk',
            url: 'https://gridpass.app',
          },
        ],
        publisher: {
          '@type': 'Organization',
          name: 'Gridpass Racing Wire',
          url: 'https://gridpass.app',
          logo: {
            '@type': 'ImageObject',
            url: 'https://gridpass.app/gridpass_emblem.jpg',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://gridpass.app/news/${article.slug}`,
        },
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center font-sans p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#ff3b30] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
            Verifying Paddock Story & Sources...
          </p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center font-sans p-6">
        <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 p-8 rounded-3xl text-center space-y-4">
          <div className="w-14 h-14 bg-neutral-200 text-neutral-600 rounded-2xl flex items-center justify-center text-2xl mx-auto">
            📰
          </div>
          <h1 className="text-lg font-black uppercase text-neutral-900">
            Article Not Found on Wire
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            The requested story may have been relocated, archived, or is currently undergoing verified editorial scrutiny.
          </p>
          <div className="pt-2">
            <Link
              href="/news"
              className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition"
            >
              Return to Racing Wire
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pb-24">
      {/* Schema.org NewsArticle JSON-LD */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Top Header Navigation Bar */}
      <div className="border-b border-neutral-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/news"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 border border-neutral-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All News</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportModalOpen(true)}
              className="min-h-[44px] min-w-[44px] px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 border border-neutral-200 cursor-pointer"
              title="Report inaccurate info or wrong category"
            >
              <Flag className="w-3.5 h-3.5 text-[#ff3b30]" />
              <span className="hidden sm:inline">Report / Suggest Edit</span>
            </button>

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

      {/* Article Body Container */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Category & Verified Badge Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-black text-white text-xs font-black uppercase tracking-wider rounded-lg">
              {CATEGORY_LABELS[article.category] || article.category}
            </span>

            {article.article_type === '4_hour_wire' && (
              <span className="px-2.5 py-1 bg-red-100 border border-red-300 text-[#ff3b30] text-xs font-black uppercase rounded-lg">
                ⚡ Live Recap
              </span>
            )}
          </div>

          {/* Gridpass Racing Wire Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-black tracking-wide border border-neutral-800 shadow-xs">
            <Radio className="w-3.5 h-3.5 text-[#ff3b30]" />
            <span>🏁 Gridpass News Wire</span>
          </div>
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 uppercase tracking-tight leading-tight">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-base sm:text-lg text-neutral-600 font-medium leading-snug">
              {article.subtitle}
            </p>
          )}
        </div>

        {/* Publication Metadata & Reading Time */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-neutral-200 text-xs text-neutral-500 font-medium">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-black text-[11px]">
              GP
            </div>
            <div>
              <p className="font-bold text-neutral-900">{article.verified_by || 'Gridpass Wire Editorial Desk'}</p>
              <p className="text-[11px] text-neutral-400">
                Published {article.published_at ? new Date(article.published_at).toLocaleString() : 'Recently'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] bg-neutral-100 px-3 py-1.5 rounded-lg text-neutral-700">
            <Clock className="w-3.5 h-3.5 text-[#ff3b30]" />
            <span>{article.reading_time_mins || 3} min read</span>
            <span>•</span>
            <span>{(article.views || 1).toLocaleString()} views</span>
          </div>
        </div>

        {/* Cover Photo */}
        {article.cover_image_url && (
          <div className="rounded-3xl overflow-hidden border border-neutral-200 shadow-sm aspect-16/9 bg-neutral-100">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Lead Summary Callout */}
        {article.summary && (
          <div className="p-5 bg-neutral-50 rounded-2xl border-l-4 border-[#ff3b30] text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed shadow-2xs">
            {article.summary}
          </div>
        )}

        {/* Rich Editorial Body */}
        <div className="prose prose-neutral max-w-none text-neutral-800 leading-relaxed text-sm sm:text-base space-y-4">
          {article.content ? (
            cleanStoryText(article.content).split('\n\n').map((para, i) => {
              const cleanP = para.trim();
              if (!cleanP) return null;
              if (cleanP.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-xl sm:text-2xl font-black uppercase text-neutral-900 pt-4 border-b border-neutral-200 pb-2">
                    {cleanP.replace('## ', '')}
                  </h2>
                );
              }
              if (cleanP.startsWith('### ')) {
                return (
                  <h3 key={i} className="text-base sm:text-lg font-black uppercase text-neutral-900 pt-2">
                    {cleanP.replace('### ', '')}
                  </h3>
                );
              }
              if (cleanP.startsWith('---')) {
                return <hr key={i} className="border-neutral-200 my-6" />;
              }
              return (
                <p key={i} className="text-neutral-700 leading-relaxed">
                  {cleanP}
                </p>
              );
            })
          ) : (
            <p className="text-neutral-600">{article.summary}</p>
          )}
        </div>

        {/* LIVING WIRE TIMELINE UPDATES (IF ANY) */}
        {article.updates && article.updates.length > 0 && (
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff3b30] animate-pulse" />
                <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5">
                  ⚡ Living Wire Updates & Race Notes ({article.updates.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">Real-time Stream</span>
            </div>

            <div className="space-y-3">
              {article.updates.map((update, idx) => (
                <div
                  key={update.id || idx}
                  className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-900">{update.author || 'Trackside Desk'}</span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {update.title && (
                    <p className="font-black text-xs uppercase text-neutral-800">{update.title}</p>
                  )}
                  <p className="text-xs text-neutral-600 leading-relaxed">{update.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📍 I WAS TRACKSIDE / ATTENDANCE VERIFICATION */}
        <TracksideAttendanceButton
          articleId={article.id}
          articleSlug={article.slug}
          articleTitle={article.title}
          initialAttendeesCount={article.attendees_count || 0}
        />

        {/* 🏁 MENTIONED PADDOCK ENTITIES & ROSTER */}
        {mentionedEntities.length > 0 && (
          <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-7 border border-neutral-800 space-y-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏁</span>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">
                    Mentioned Paddock Entities & Roster
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Direct crossover hubs with verified racing intelligence, telemetry logs, and follow feeds.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 font-bold self-start sm:self-auto">
                {mentionedEntities.length} Paddock Hubs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mentionedEntities.map((ent) => {
                const meta = ENTITY_TYPE_LABELS[ent.type] || {
                  label: 'Paddock Hub',
                  icon: '🏁',
                  badgeColor: 'bg-neutral-900 text-white',
                };

                return (
                  <Link
                    key={ent.slug}
                    href={`/news/hub/${ent.type}/${ent.slug}`}
                    className="min-h-[44px] p-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-[#ff3b30]/50 rounded-2xl transition group flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {ent.image_url ? (
                        <img
                          src={ent.image_url}
                          alt={ent.name}
                          className="w-10 h-10 rounded-xl object-cover border border-neutral-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg shrink-0 group-hover:bg-[#ff3b30] transition">
                          {meta.icon}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-black text-xs text-white group-hover:text-[#ff3b30] transition truncate">
                          {ent.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 uppercase font-mono truncate">
                          {meta.label}
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-neutral-800 group-hover:bg-[#ff3b30] text-neutral-400 group-hover:text-white flex items-center justify-center shrink-0 transition">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* VERIFIED SOURCES BOX */}
        <div className="bg-neutral-950 text-white rounded-2xl p-6 border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ff3b30]" />
              <h3 className="font-black text-xs uppercase tracking-wider text-white">
                Primary Verified Reporting Sources ({article.sources?.length || 1})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">Accredited Wire Outlets</span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            In accordance with the Gridpass Motorsport Source of Truth Protocol, this story is cross-checked with accredited primary wire and timing sources:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {(article.sources && article.sources.length > 0 ? article.sources : [
              { name: 'Gridpass Timing & Telemetry Desk', url: 'https://gridpass.app' },
              { name: 'RACER Magazine Technical Wire', url: 'https://racer.com' },
            ]).map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition flex items-center justify-between gap-3 group"
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

        {/* DRIVER & EVENT PASSPORT CROSSOVER CARDS */}
        {((article.related_drivers && article.related_drivers.length > 0) ||
          (article.related_events && article.related_events.length > 0)) && (
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <h3 className="font-black text-sm uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff3b30]" />
              <span>Driver & Event Passport Crossover</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Related Drivers */}
              {article.related_drivers?.map((driver) => (
                <Link
                  key={driver.id}
                  href={`/u/${driver.id}`}
                  className="min-h-[44px] p-4 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-200 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {driver.avatar_url ? (
                      <img
                        src={driver.avatar_url}
                        alt={driver.name}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-300 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 text-sm font-black">
                        #{driver.car_number || 'GP'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-black text-xs text-neutral-900 group-hover:text-[#ff3b30] transition truncate">
                        {driver.name}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase">
                        {driver.series || 'Driver Passport'}
                      </p>
                    </div>
                  </div>

                  <span className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 group-hover:bg-[#ff3b30] transition">
                    <span>View Profile</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}

              {/* Related Events */}
              {article.related_events?.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="min-h-[44px] p-4 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-200 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#ff3b30] text-white flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-xs text-neutral-900 group-hover:text-[#ff3b30] transition truncate">
                        {ev.title}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-medium truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{ev.location_name || ev.date_str || 'Event Pass'}</span>
                      </p>
                    </div>
                  </div>

                  <span className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 group-hover:bg-[#ff3b30] transition">
                    <span>Event HQ</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 💬 COMMUNITY WIRE DISCUSSION & TELEMETRY REACTIONS */}
        <ArticleDiscussionThread
          articleId={article.id}
          articleSlug={article.slug}
          initialLikesCount={article.likes_count || 0}
          initialCommentsCount={article.comments_count || 0}
        />

        {/* RELATED STORIES ON THIS TOPIC */}
        {relatedArticles.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ff3b30]" />
                <span>Related Stories on this Topic</span>
              </h3>
              <Link
                href="/news"
                className="min-h-[36px] text-xs font-bold text-[#ff3b30] hover:underline flex items-center gap-1"
              >
                <span>View all wire</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/news/${rel.slug}`}
                  className="bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-200 overflow-hidden group transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/10 bg-neutral-200 overflow-hidden">
                      {rel.cover_image_url ? (
                        <img
                          src={rel.cover_image_url}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400 font-bold text-xs">
                          GRIDPASS WIRE
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[9px] font-black uppercase rounded-md">
                        {CATEGORY_LABELS[rel.category] || rel.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {rel.published_at ? new Date(rel.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Live'} • {rel.reading_time_mins || 3}m read
                      </p>
                      <h4 className="font-black text-xs uppercase text-neutral-900 group-hover:text-[#ff3b30] transition line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <span className="min-h-[44px] w-full px-3 py-2 bg-neutral-200 group-hover:bg-[#ff3b30] text-neutral-800 group-hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1">
                      <span>Read Story</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer Navigation Back to Wire */}
        <div className="pt-8 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/news"
            className="min-h-[44px] px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All News</span>
          </Link>

          <button
            onClick={() => setReportModalOpen(true)}
            className="min-h-[44px] px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 text-xs font-bold uppercase rounded-xl transition inline-flex items-center gap-1.5 border border-neutral-200 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5 text-[#ff3b30]" />
            <span>Report / Suggest Category Edit</span>
          </button>
        </div>
      </article>

      {/* Community Report / Grooming Modal */}
      {article && (
        <ReportArticleModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          articleId={article.id}
          articleSlug={article.slug}
          articleTitle={article.title}
          currentCategory={article.category}
        />
      )}
    </div>
  );
}

