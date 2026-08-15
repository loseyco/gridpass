'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import {
  Article,
  NewsCategory,
  NEWS_CATEGORIES,
  CATEGORY_LABELS,
  CURATED_PADDOCK_ENTITIES,
  ENTITY_TYPE_LABELS,
} from '@/lib/types/news';
import {
  getFollowedEntities,
  toggleFollowEntity,
  FollowedEntity,
} from '@/lib/utils/paddockFollow';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/components/auth/AuthProvider';
import SocialFeedCard from '@/components/news/SocialFeedCard';
import PaddockPostComposer from '@/components/news/PaddockPostComposer';
import {
  Zap,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Plus,
  Check,
  X,
  Flame,
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  ChevronDown,
  Radio,
  Newspaper,
  LayoutList,
  Grid,
  Users,
  TrendingUp,
  MapPin,
  Compass,
  Bookmark,
} from 'lucide-react';

export default function NewsPortalPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = user?.email === 'loseyp@gmail.com' || (user as any)?.role === 'admin' || (user as any)?.role === 'super_admin';

  // Articles & Loading
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'timeline' (Facebook/Twitter style) vs 'magazine' (Classic 3-column blog grid)
  const [viewMode, setViewMode] = useState<'timeline' | 'magazine'>('timeline');

  // Filters: All, Followed, Community, Saved, Hidden (Admin Only)
  const [feedTab, setFeedTab] = useState<'all' | 'my_wire' | 'community' | 'saved' | 'hidden'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');

  // Follow, Read & Saved Bookmarks State
  const [followedEntities, setFollowedEntities] = useState<FollowedEntity[]>([]);
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalFilter, setFollowModalFilter] = useState<'all' | 'series' | 'team' | 'driver' | 'venue' | 'network'>('all');
  const [readHistory, setReadHistory] = useState<Record<string, string>>({});
  const [feedStatus, setFeedStatus] = useState<{
    last_checked_at?: string;
    total_active_feeds?: number;
  }>({});

  // Sync feed status from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'news_feed_status'), (snap) => {
      if (snap.exists()) {
        setFeedStatus(snap.data() as any);
      }
    });
    return () => unsub();
  }, []);

  // Sync follow state, saved bookmarks, read history, and view mode on mount
  useEffect(() => {
    setFollowedEntities(getFollowedEntities());

    try {
      const storedHistory = localStorage.getItem('gridpass_news_read_history');
      if (storedHistory) {
        setReadHistory(JSON.parse(storedHistory));
      }
      const storedSaves = localStorage.getItem('gridpass_saved_articles');
      if (storedSaves) {
        setSavedArticleIds(JSON.parse(storedSaves));
      }
      const storedMode = localStorage.getItem('gridpass_news_view_mode');
      if (storedMode === 'magazine' || storedMode === 'timeline') {
        setViewMode(storedMode);
      }
    } catch {}

    const handleFollowChange = () => {
      setFollowedEntities(getFollowedEntities());
      try {
        const storedSaves = localStorage.getItem('gridpass_saved_articles');
        if (storedSaves) setSavedArticleIds(JSON.parse(storedSaves));
      } catch {}
    };

    window.addEventListener('gridpass_follow_change', handleFollowChange);
    return () => {
      window.removeEventListener('gridpass_follow_change', handleFollowChange);
    };
  }, []);

  const handleSetViewMode = (mode: 'timeline' | 'magazine') => {
    setViewMode(mode);
    try {
      localStorage.setItem('gridpass_news_view_mode', mode);
    } catch {}
  };

  // Real-time Firestore listener for all public articles & posts
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'news_articles'),
      (snapshot) => {
        const list: Article[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Article;
          if (data.is_public !== false && data.status !== 'draft') {
            list.push({ ...data, id: docSnap.id });
          }
        });

        // Sort descending by published_at / created_at
        list.sort((a, b) => {
          const timeA = a.published_at || a.created_at || '';
          const timeB = b.published_at || b.created_at || '';
          return timeB.localeCompare(timeA);
        });

        setArticles(list);
        setLoading(false);
      },
      (err) => {
        console.warn('News listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Mark article as read
  const markArticleAsRead = (slug: string) => {
    try {
      const now = new Date().toISOString();
      const updated = { ...readHistory, [slug]: now };
      setReadHistory(updated);
      localStorage.setItem('gridpass_news_read_history', JSON.stringify(updated));
    } catch {}
  };

  // Mark all visible as read
  const markAllAsRead = () => {
    try {
      const now = new Date().toISOString();
      const updated = { ...readHistory };
      articles.forEach((a) => {
        if (a.slug) updated[a.slug] = now;
      });
      setReadHistory(updated);
      localStorage.setItem('gridpass_news_read_history', JSON.stringify(updated));
      showToast({
        title: 'All Stories Marked as Read',
        message: 'Your wire feed is fully up to date.',
        icon: '✓',
      });
    } catch {}
  };

  // Read status: 'unread' | 'updated' | 'read'
  const getArticleReadStatus = (art: Article): 'unread' | 'updated' | 'read' => {
    if (!art.slug) return 'read';
    const lastRead = readHistory[art.slug];
    if (!lastRead) return 'unread';

    if (art.updated_at) {
      const updatedAtTime = new Date(art.updated_at).getTime();
      const lastReadTime = new Date(lastRead).getTime();
      if (updatedAtTime > lastReadTime) return 'updated';
    }
    return 'read';
  };

  // Breaking news ticker items
  const breakingNews = useMemo(() => {
    return articles.filter(
      (a) => a.article_type === 'breaking' || a.article_type === '4_hour_wire'
    );
  }, [articles]);

  // Lead Hero article (top story)
  const heroArticle = useMemo(() => {
    const recap = articles.find((a) => a.article_type === '4_hour_wire');
    if (recap) return recap;
    return articles[0] || null;
  }, [articles]);

  // Helper date strings
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Counts for tabs
  const hiddenCount = useMemo(() => articles.filter((a) => (a as any).is_hidden === true).length, [articles]);
  const savedCount = useMemo(
    () => articles.filter((a) => savedArticleIds.includes(a.id) || savedArticleIds.includes(a.slug)).length,
    [articles, savedArticleIds]
  );

  // Relative last checked notice text
  const lastCheckedText = useMemo(() => {
    if (!feedStatus.last_checked_at) {
      if (articles.length > 0 && articles[0]?.created_at) {
        return 'Updated recently';
      }
      return 'Live';
    }
    try {
      const diffMs = Date.now() - new Date(feedStatus.last_checked_at).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Checked just now';
      if (diffMins === 1) return 'Checked 1m ago';
      if (diffMins < 60) return `Checked ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `Checked ${diffHours}h ago`;
    } catch {
      return 'Live';
    }
  }, [feedStatus.last_checked_at, articles]);

  // Helper to check if an article is unread
  const isArticleUnread = (art: Article) => {
    const key = art.slug || art.id;
    if (!key) return false;
    return !readHistory[key];
  };

  // Helper to check if an article matches followed topics/entities
  const articleMatchesFollowed = (art: Article) => {
    if (followedEntities.length === 0) return false;
    return followedEntities.some((followed) => {
      const slugMatch = followed.slug.toLowerCase();
      const nameMatch = followed.name.toLowerCase();

      const isCategoryMatch = art.category?.toLowerCase() === slugMatch;
      const hasEntity = art.entities?.some(
        (e) => e.slug.toLowerCase() === slugMatch || e.name.toLowerCase() === nameMatch
      );
      const hasTag = art.tags?.some(
        (t) =>
          t.toLowerCase().replace(/[^a-z0-9]/g, '') === slugMatch.replace(/[^a-z0-9]/g, '') ||
          t.toLowerCase().includes(slugMatch)
      );
      const hasDriver = art.related_drivers?.some(
        (d) => d.name.toLowerCase().includes(nameMatch) || d.id.toLowerCase() === slugMatch
      );
      const inText =
        art.title?.toLowerCase().includes(nameMatch) ||
        art.summary?.toLowerCase().includes(nameMatch) ||
        art.content?.toLowerCase().includes(nameMatch);

      return isCategoryMatch || hasEntity || hasTag || hasDriver || inText;
    });
  };

  // Unread counts across tabs
  const unreadAllCount = useMemo(() => {
    return articles.filter((a) => !(a as any).is_deleted && !(a as any).is_hidden && isArticleUnread(a)).length;
  }, [articles, readHistory]);

  const unreadFollowedCount = useMemo(() => {
    return articles.filter(
      (a) => !(a as any).is_deleted && !(a as any).is_hidden && articleMatchesFollowed(a) && isArticleUnread(a)
    ).length;
  }, [articles, followedEntities, readHistory]);

  const unreadCommunityCount = useMemo(() => {
    return articles.filter(
      (a) => !(a as any).is_deleted && !(a as any).is_hidden && (a as any).is_user_post === true && isArticleUnread(a)
    ).length;
  }, [articles, readHistory]);

  const unreadSavedCount = useMemo(() => {
    return articles.filter(
      (a) =>
        !(a as any).is_deleted &&
        (savedArticleIds.includes(a.id) || savedArticleIds.includes(a.slug)) &&
        isArticleUnread(a)
    ).length;
  }, [articles, savedArticleIds, readHistory]);

  // Unread count per category
  const categoryUnreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    NEWS_CATEGORIES.forEach((c) => {
      counts[c.id] = 0;
    });
    articles.forEach((art) => {
      if ((art as any).is_deleted || (art as any).is_hidden) return;
      if (isArticleUnread(art) && art.category) {
        counts[art.category] = (counts[art.category] || 0) + 1;
      }
    });
    return counts;
  }, [articles, readHistory]);

  // Filtered Articles Evaluation
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const artDate = (art.published_at || art.created_at || '').slice(0, 10);
      const isUserPost = (art as any).is_user_post === true;
      const isHidden = (art as any).is_hidden === true;

      const isDeleted = (art as any).is_deleted === true || (art as any).status === 'archived';
      if (isDeleted) return false;

      // 0. Hidden Post Filter (Public visitors never see hidden posts; Admins see them, or can filter to them)
      if (isHidden && !isSuperAdmin) return false;
      if (feedTab === 'hidden') {
        if (!isHidden) return false;
      } else if (feedTab === 'saved') {
        if (!savedArticleIds.includes(art.id) && !savedArticleIds.includes(art.slug)) return false;
      }

      // 1. Date Filter
      if (dateFilter === 'today' && artDate !== todayStr) return false;
      if (dateFilter === 'yesterday' && artDate !== yesterdayStr) return false;
      if (dateFilter === 'custom' && customDate && artDate !== customDate) return false;
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (new Date(art.published_at || art.created_at || '') < weekAgo) return false;
      }

      // 2. Feed Tab Filter
      if (feedTab === 'community') {
        if (!isUserPost) return false;
      } else if (feedTab === 'my_wire') {
        if (!articleMatchesFollowed(art)) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'all' && selectedCategory !== 'my_wire') {
        if (art.category !== selectedCategory) return false;
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = art.title?.toLowerCase().includes(q);
        const summaryMatch = art.summary?.toLowerCase().includes(q);
        const sourceMatch = art.source_name?.toLowerCase().includes(q);
        const authorMatch = art.author?.toLowerCase().includes(q);
        const entityMatch = art.entities?.some((e) => e.name.toLowerCase().includes(q));
        const tagMatch = art.tags?.some((t) => t.toLowerCase().includes(q));

        if (!titleMatch && !summaryMatch && !sourceMatch && !authorMatch && !entityMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    articles,
    dateFilter,
    customDate,
    feedTab,
    selectedCategory,
    followedEntities,
    searchQuery,
    todayStr,
    yesterdayStr,
  ]);

  // Check if active filters exist
  const hasActiveFilters =
    feedTab !== 'all' ||
    selectedCategory !== 'all' ||
    dateFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const resetAllFilters = () => {
    setFeedTab('all');
    setSelectedCategory('all');
    setDateFilter('all');
    setCustomDate('');
    setSearchQuery('');
  };

  // Follow Modal Entities
  const modalEntities = useMemo(() => {
    if (followModalFilter === 'all') return CURATED_PADDOCK_ENTITIES;
    return CURATED_PADDOCK_ENTITIES.filter((e) => e.type === followModalFilter);
  }, [followModalFilter]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 pb-20">
      {/* 1. TOP MARQUEE (Breaking Racing Wire Alert) */}
      {breakingNews.length > 0 && (
        <div className="bg-neutral-900 text-white text-xs border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#ff3b30] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Wire Alert</span>
            </div>
            <div className="overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-6">
              {breakingNews.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  onClick={() => markArticleAsRead(item.slug)}
                  className="hover:text-[#ff3b30] transition flex items-center gap-2 font-bold text-xs truncate max-w-md"
                >
                  <span className="text-neutral-400 font-mono text-[10px]">
                    {item.published_at ? new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                  </span>
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SUB-NAV / HEADER BANNER */}
      <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/news" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-black text-sm shadow-xs">
                🏁
              </div>
              <div>
                <h1 className="font-black text-base uppercase tracking-tight text-neutral-950 leading-none">
                  Paddock Wire & Feed
                </h1>
                <p className="text-[10px] text-neutral-500 font-mono">Real-Time Motorsport Intelligence</p>
              </div>
            </Link>

            <Link
              href="/news/directory"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-xl transition"
            >
              <Compass className="w-3.5 h-3.5 text-[#ff3b30]" />
              <span>Paddock Directory</span>
            </Link>
          </div>

          {/* DUAL VIEW MODE SWITCHER */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/80 shadow-2xs">
              <button
                onClick={() => handleSetViewMode('timeline')}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'timeline'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
                title="Facebook-Style Social Timeline"
              >
                <LayoutList className="w-3.5 h-3.5 text-[#ff3b30]" />
                <span>Timeline</span>
              </button>

              <button
                onClick={() => handleSetViewMode('magazine')}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'magazine'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
                title="Classic Editorial Magazine Grid"
              >
                <Grid className="w-3.5 h-3.5 text-[#ff3b30]" />
                <span>Magazine Grid</span>
              </button>
            </div>

            <button
              onClick={() => setShowFollowModal(true)}
              className="min-h-[34px] px-3 py-1 bg-white hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 border border-neutral-200 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff3b30]" />
              <span className="hidden sm:inline">Follow Topics</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* FILTER TOOLBAR */}
        <section className="bg-white border border-neutral-200/80 rounded-2xl p-3 shadow-xs space-y-3">
          {/* Row 1: Search & Category Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drivers, teams, series, tech setup..."
                className="w-full min-h-[42px] pl-10 pr-10 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-950 text-neutral-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="min-h-[42px] min-w-[42px] absolute right-0 top-0 text-xs font-bold text-neutral-400 hover:text-neutral-900 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="min-h-[42px] px-3 py-2 pr-7 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase tracking-wider rounded-xl border border-neutral-200 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#ff3b30] max-w-[150px] sm:max-w-[220px] truncate"
              >
                <option value="all">
                  All Categories {unreadAllCount > 0 ? `(${unreadAllCount} unread)` : ''}
                </option>
                {NEWS_CATEGORIES.map((c) => {
                  const unread = categoryUnreadCounts[c.id] || 0;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label} {unread > 0 ? `(${unread})` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 2: Feed Stream Sub-Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFeedTab('all')}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                  feedTab === 'all'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span>🏁 All Stories</span>
                {unreadAllCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#ff3b30] text-white rounded-full text-[9px] font-mono">
                    {unreadAllCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFeedTab('my_wire')}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                  feedTab === 'my_wire'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <Zap className="w-3 h-3 text-[#ff3b30] fill-[#ff3b30]" />
                <span>Followed</span>
                {unreadFollowedCount > 0 ? (
                  <span className="px-1.5 py-0.2 bg-[#ff3b30] text-white rounded-full text-[9px] font-mono animate-pulse">
                    {unreadFollowedCount}
                  </span>
                ) : followedEntities.length > 0 ? (
                  <span className="px-1.5 py-0.2 bg-neutral-200 text-neutral-700 rounded-full text-[9px] font-mono">
                    {followedEntities.length}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setFeedTab('community')}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                  feedTab === 'community'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#ff3b30]" />
                <span>Community Posts</span>
                {unreadCommunityCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#ff3b30] text-white rounded-full text-[9px] font-mono">
                    {unreadCommunityCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFeedTab('saved')}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                  feedTab === 'saved'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-[#ff3b30]" />
                <span>Saved</span>
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-neutral-200 text-neutral-800 rounded-full text-[9px] font-mono">
                    {savedCount}
                  </span>
                )}
              </button>

              {isSuperAdmin && hiddenCount > 0 && (
                <button
                  onClick={() => setFeedTab('hidden')}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    feedTab === 'hidden'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  <span>🔒 Hidden ({hiddenCount})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Feed Last Checked Notice */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100/90 rounded-xl text-[10px] font-mono text-neutral-600 border border-neutral-200 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-neutral-800 uppercase">
                  {feedStatus.total_active_feeds || 37} Wires:
                </span>
                <span>{lastCheckedText}</span>
              </div>

              <button
                onClick={markAllAsRead}
                className="min-h-[34px] px-2.5 py-1 bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 border border-neutral-200"
                title="Mark all as read"
              >
                <Check className="w-3.5 h-3.5 text-[#ff3b30]" />
                <span className="hidden sm:inline">Mark Read</span>
              </button>

              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="min-h-[34px] px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#ff3b30] hover:bg-red-50 rounded-xl transition flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 4. DUAL VIEW RENDERING */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#ff3b30] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black uppercase text-neutral-500 tracking-wider">
              Loading Live Motorsport News...
            </p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center bg-white border border-neutral-200 rounded-2xl space-y-3">
            <p className="text-sm font-black uppercase text-neutral-900">No Stories Found</p>
            <p className="text-xs text-neutral-500">Try adjusting your category filter or search query.</p>
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 bg-[#ff3b30] text-white text-xs font-black uppercase rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'timeline' ? (
          /* =========================================================
             A) SOCIAL TIMELINE VIEW (Facebook / Twitter Continuous Feed)
             ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left/Main Column: Top Composer + Continuous Social Cards */}
            <div className="lg:col-span-8 space-y-4">
              {/* Member Post Composer */}
              <PaddockPostComposer />

              {/* Feed Cards Stream */}
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <SocialFeedCard key={article.id} article={article} />
                ))}
              </div>
            </div>

            {/* Right Column: Trending Topics & Followed Hubs Sidebar */}
            <div className="lg:col-span-4 space-y-4 sticky top-20">
              {/* Trending Series & Disciplines Card */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-neutral-950">
                    <TrendingUp className="w-4 h-4 text-[#ff3b30]" />
                    <span>Popular Disciplines</span>
                  </div>
                  <Link href="/news/directory" className="text-[10px] font-black uppercase text-[#ff3b30] hover:underline">
                    Directory ➔
                  </Link>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {NEWS_CATEGORIES.slice(0, 8).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                        selectedCategory === cat.id
                          ? 'bg-neutral-950 text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Curated Paddock Hubs Quick Links */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-neutral-950">
                    <Compass className="w-4 h-4 text-[#ff3b30]" />
                    <span>Official Hubs</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {CURATED_PADDOCK_ENTITIES.slice(0, 5).map((e) => (
                    <Link
                      key={e.slug}
                      href={`/news/hub/${e.type}/${e.slug}`}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition border border-transparent hover:border-neutral-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px]">
                          🏁
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs uppercase text-neutral-900 truncate">{e.name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono uppercase">{e.type}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================
             B) EDITORIAL MAGAZINE / BLOG GRID VIEW
             ========================================================= */
          <div className="space-y-6">
            {/* Magazine 3-Column Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Cover Photo */}
                    <Link
                      href={`/news/${article.slug || article.id}`}
                      onClick={() => markArticleAsRead(article.slug || article.id)}
                      className="block relative aspect-16/10 overflow-hidden bg-neutral-100"
                    >
                      {article.cover_image || article.cover_image_url ? (
                        <img
                          src={article.cover_image || article.cover_image_url || ''}
                          alt={article.title}
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

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5">
                        <span className="px-2.5 py-1 bg-black/85 backdrop-blur-xs text-white text-[10px] font-black uppercase rounded-md shadow-xs">
                          {CATEGORY_LABELS[article.category] || article.category}
                        </span>
                      </div>
                    </Link>

                    {/* Metadata & Headline */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                        <span>{article.source_name || article.author || 'Gridpass'}</span>
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#ff3b30]" />
                          <span>
                            {article.published_at ? new Date(article.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Live'}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/news/${article.slug || article.id}`}
                        onClick={() => markArticleAsRead(article.slug || article.id)}
                        className="block font-black text-sm uppercase text-neutral-950 group-hover:text-[#ff3b30] transition leading-snug line-clamp-2"
                      >
                        {article.title}
                      </Link>

                      <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  {/* Read Story Action Footer */}
                  <div className="px-5 pb-4 pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <Link
                      href={`/news/${article.slug || article.id}`}
                      className="text-xs font-black uppercase tracking-wider text-[#ff3b30] hover:underline flex items-center gap-1"
                    >
                      <span>Read Story</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 5. TOPIC FOLLOW MODAL */}
      {showFollowModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm uppercase text-neutral-950">Follow Paddock Topics</h3>
                <p className="text-xs text-neutral-500">Personalize your custom &quot;Followed&quot; wire stream.</p>
              </div>
              <button
                onClick={() => setShowFollowModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-900 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {modalEntities.map((entity) => {
                const isFollowed = followedEntities.some((f) => f.slug === entity.slug);
                return (
                  <div
                    key={entity.slug}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-xs uppercase text-neutral-900 truncate">{entity.name}</p>
                      <p className="text-[10px] text-neutral-500 uppercase">{entity.type} • {entity.discipline}</p>
                    </div>
                    <button
                      onClick={() => toggleFollowEntity(entity)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                        isFollowed
                          ? 'bg-neutral-900 text-white'
                          : 'bg-[#ff3b30] text-white hover:bg-[#bd2925]'
                      }`}
                    >
                      {isFollowed ? 'Following' : '+ Follow'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setShowFollowModal(false)}
                className="px-5 py-2 bg-neutral-950 text-white font-black text-xs uppercase rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
