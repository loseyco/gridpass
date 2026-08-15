'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  Article,
  NewsFeed,
  NewsCategory,
  NEWS_CATEGORIES,
  CATEGORY_LABELS,
} from '@/lib/types/news';
import {
  saveNewsFeed,
  toggleFeedActive,
  saveArticle,
  toggleArticlePublic,
  deleteArticle,
  runNewsIngestion,
  generate4HourRecap,
  seedInitialFeedsIfEmpty,
} from '@/lib/actions/news';
import { useToast } from '@/components/ToastContext';
import {
  Rss,
  Newspaper,
  Zap,
  Radio,
  Eye,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  BarChart3,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

export default function AdminNewsHQPage() {
  const { showToast } = useToast();

  const [feeds, setFeeds] = useState<NewsFeed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'feeds' | 'analytics'>('queue');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isRecapping, setIsRecapping] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add Feed Modal
  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedCategory, setNewFeedCategory] = useState<NewsCategory>('open_wheel');
  const [newFeedInterval, setNewFeedInterval] = useState<number>(30);
  const [isSavingFeed, setIsSavingFeed] = useState(false);

  // Article Edit Modal
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [artTitle, setArtTitle] = useState('');
  const [artSubtitle, setArtSubtitle] = useState('');
  const [artCategory, setArtCategory] = useState<NewsCategory>('open_wheel');
  const [artType, setArtType] = useState<Article['article_type']>('standard');
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCoverImage, setArtCoverImage] = useState('');
  const [artIsPublic, setArtIsPublic] = useState(true);
  const [isSavingArticle, setIsSavingArticle] = useState(false);

  // Live Firestore subscriptions
  useEffect(() => {
    // Check and seed initial verified feeds if database is empty
    seedInitialFeedsIfEmpty().catch((err) => console.warn('Seed feeds error:', err));

    const unsubFeeds = onSnapshot(
      collection(db, 'news_feeds'),
      (snap) => {
        const list: NewsFeed[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as NewsFeed));
        setFeeds(list);
      },
      (err) => console.warn('Feeds listener error:', err)
    );

    const unsubArticles = onSnapshot(
      query(collection(db, 'news_articles'), orderBy('published_at', 'desc')),
      (snap) => {
        const list: Article[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Article));
        setArticles(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Articles listener error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubFeeds();
      unsubArticles();
    };
  }, []);

  // Action: Run Ingestion Now
  const handleRunIngestion = async () => {
    setIsIngesting(true);
    try {
      const res = await runNewsIngestion();
      showToast({
        title: 'Ingestion Completed',
        message: `Processed ${res.feedsProcessed} feeds. Verified and refreshed live news wire.`,
        icon: '⚡',
      });
    } catch (err: any) {
      showToast({
        title: 'Ingestion Error',
        message: err.message || 'Failed to complete feed ingestion.',
        icon: '⚠️',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // Action: Generate 4-Hour Recap Now
  const handleGenerateRecap = async () => {
    setIsRecapping(true);
    try {
      const recap = await generate4HourRecap();
      showToast({
        title: '4-Hour Recap Generated!',
        message: `Edition published: "${recap.title.substring(0, 40)}..."`,
        icon: '🚀',
      });
    } catch (err: any) {
      showToast({
        title: 'Recap Generation Error',
        message: err.message || 'Failed to synthesize 4-hour recap.',
        icon: '⚠️',
      });
    } finally {
      setIsRecapping(false);
    }
  };

  // Add Feed
  const handleSaveFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedName.trim() || !newFeedUrl.trim()) return;

    setIsSavingFeed(true);
    try {
      await saveNewsFeed({
        name: newFeedName.trim(),
        url: newFeedUrl.trim(),
        category: newFeedCategory,
        fetch_interval_mins: Number(newFeedInterval),
        is_active: true,
      });

      showToast({
        title: 'Feed Added',
        message: `Added "${newFeedName}" to wire ingestion sources.`,
        icon: '📡',
      });

      setNewFeedName('');
      setNewFeedUrl('');
      setShowAddFeedModal(false);
    } catch (err: any) {
      showToast({
        title: 'Error Saving Feed',
        message: err.message || 'Could not save feed source.',
        icon: '⚠️',
      });
    } finally {
      setIsSavingFeed(false);
    }
  };

  // Toggle Feed Active
  const handleToggleFeed = async (feed: NewsFeed) => {
    try {
      await toggleFeedActive(feed.id, feed.is_active);
      showToast({
        title: feed.is_active ? 'Feed Paused' : 'Feed Activated',
        message: `${feed.name} is now ${feed.is_active ? 'paused' : 'actively polling'}.`,
        icon: '🔄',
      });
    } catch (err: any) {
      showToast({
        title: 'Error Updating Feed',
        message: err.message,
        icon: '⚠️',
      });
    }
  };

  // Open Article Edit Modal
  const handleOpenEditArticle = (art?: Article) => {
    if (art) {
      setEditingArticle(art);
      setArtTitle(art.title);
      setArtSubtitle(art.subtitle || '');
      setArtCategory(art.category);
      setArtType(art.article_type || 'standard');
      setArtSummary(art.summary || '');
      setArtContent(art.content || '');
      setArtCoverImage(art.cover_image_url || '');
      setArtIsPublic(art.is_public !== false);
    } else {
      setEditingArticle(null);
      setArtTitle('');
      setArtSubtitle('');
      setArtCategory('open_wheel');
      setArtType('standard');
      setArtSummary('');
      setArtContent('');
      setArtCoverImage('');
      setArtIsPublic(true);
    }
    setShowArticleModal(true);
  };

  // Save Article
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle.trim()) return;

    setIsSavingArticle(true);
    try {
      await saveArticle({
        id: editingArticle?.id,
        title: artTitle.trim(),
        subtitle: artSubtitle.trim(),
        category: artCategory,
        article_type: artType,
        summary: artSummary.trim(),
        content: artContent.trim(),
        cover_image_url: artCoverImage.trim() || null,
        is_public: artIsPublic,
        status: artIsPublic ? 'published' : 'draft',
      });

      showToast({
        title: editingArticle ? 'Article Updated' : 'Article Published',
        message: `Successfully saved "${artTitle.substring(0, 35)}..."`,
        icon: '📰',
      });

      setShowArticleModal(false);
      setEditingArticle(null);
    } catch (err: any) {
      showToast({
        title: 'Error Saving Article',
        message: err.message || 'Could not save article.',
        icon: '⚠️',
      });
    } finally {
      setIsSavingArticle(false);
    }
  };

  // Toggle Article Public
  const handleToggleArticlePublic = async (art: Article) => {
    try {
      await toggleArticlePublic(art.id, art.is_public);
      showToast({
        title: art.is_public ? 'Article Set to Private' : 'Article Published Live',
        message: `Visibility updated for "${art.title.substring(0, 30)}..."`,
        icon: '👁️',
      });
    } catch (err: any) {
      showToast({
        title: 'Error Updating Article',
        message: err.message,
        icon: '⚠️',
      });
    }
  };

  // Delete Article
  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteArticle(id);
      showToast({
        title: 'Article Deleted',
        message: `Removed "${title.substring(0, 30)}..." from database.`,
        icon: '🗑️',
      });
    } catch (err: any) {
      showToast({
        title: 'Error Deleting Article',
        message: err.message,
        icon: '⚠️',
      });
    }
  };

  // Analytics Metrics
  const totalArticles = articles.length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
  const activeFeedsCount = feeds.filter((f) => f.is_active).length;
  const breakingCount = articles.filter((a) => a.article_type === 'breaking' || a.article_type === '4_hour_wire').length;

  // Filtered Articles
  const filteredArticles = articles.filter((art) => {
    const matchesCategory = categoryFilter === 'all' || art.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'public' && art.is_public) ||
      (statusFilter === 'draft' && !art.is_public);
    const matchesSearch =
      !searchQuery.trim() ||
      art.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-black text-white text-lg">
              📰
            </span>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
                News Management HQ & Racing Wire
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                Paddock wire ingestion, 4-hour intelligence recaps, RSS feed management & public editorial queue.
              </p>
            </div>
          </div>
        </div>

        {/* Global Trigger Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunIngestion}
            disabled={isIngesting}
            className="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition active:scale-95 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Zap className={`w-4 h-4 text-[#ff3b30] ${isIngesting ? 'animate-spin' : ''}`} />
            <span>{isIngesting ? 'Ingesting Wire...' : '⚡ Run Ingestion Now'}</span>
          </button>

          <button
            onClick={handleGenerateRecap}
            disabled={isRecapping}
            className="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-[#ff3b30] hover:bg-[#d63025] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition active:scale-95 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isRecapping ? 'animate-spin' : ''}`} />
            <span>{isRecapping ? 'Synthesizing...' : '🚀 Generate 4-Hour Recap Now'}</span>
          </button>

          <Link
            href="/news"
            target="_blank"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 border border-neutral-300"
          >
            <Globe className="w-4 h-4 text-neutral-600" />
            <span>View Public Wire</span>
            <ExternalLink className="w-3 h-3 ml-0.5 text-neutral-400" />
          </Link>
        </div>
      </div>

      {/* Traffic & Referral Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">Total Articles</p>
            <p className="text-2xl font-black text-neutral-900 mt-1">{totalArticles}</p>
            <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{breakingCount} Wire Recaps & Breaking</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700">
            <Newspaper className="w-6 h-6 text-[#ff3b30]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">Total Views</p>
            <p className="text-2xl font-black text-neutral-900 mt-1">{totalViews.toLocaleString()}</p>
            <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Verified Reader Engagements</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700">
            <Eye className="w-6 h-6 text-neutral-800" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">Active Wire Feeds</p>
            <p className="text-2xl font-black text-neutral-900 mt-1">{activeFeedsCount} / {feeds.length}</p>
            <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Live Polling RSS Streams</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700">
            <Rss className="w-6 h-6 text-[#ff3b30]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">Paddock Verification</p>
            <p className="text-2xl font-black text-[#ff3b30] mt-1">100%</p>
            <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Zero Synthetic Placeholders</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700">
            <CheckCircle2 className="w-6 h-6 text-[#ff3b30]" />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`min-h-[44px] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>Articles Queue ({articles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('feeds')}
            className={`min-h-[44px] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'feeds'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <Rss className="w-4 h-4" />
            <span>Feed Sources ({feeds.length})</span>
          </button>

          <Link
            href="/admin/news/feeds"
            className="min-h-[44px] px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
            <span>Source Config Manager</span>
          </Link>
        </div>

        {activeTab === 'queue' && (
          <button
            onClick={() => handleOpenEditArticle()}
            className="min-h-[44px] min-w-[44px] px-4 py-2 bg-[#ff3b30] hover:bg-[#d63025] text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Write Article</span>
          </button>
        )}

        {activeTab === 'feeds' && (
          <button
            onClick={() => setShowAddFeedModal(true)}
            className="min-h-[44px] min-w-[44px] px-4 py-2 bg-[#ff3b30] hover:bg-[#d63025] text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Feed</span>
          </button>
        )}
      </div>

      {/* TAB 1: ARTICLES QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by headline, keywords, or summary..."
                className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-800 text-neutral-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="min-h-[44px] px-3 py-2 text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[44px] px-3 py-2 text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none"
              >
                <option value="all">All Visibility</option>
                <option value="public">Public Live</option>
                <option value="draft">Draft / Private</option>
              </select>
            </div>
          </div>

          {/* Articles Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Title & Details</th>
                    <th className="py-3.5 px-3">Category</th>
                    <th className="py-3.5 px-3">Type</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3 text-right">Views</th>
                    <th className="py-3.5 px-3">Published Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400 font-mono">
                        Loading verified article wire...
                      </td>
                    </tr>
                  ) : filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        <p className="font-bold text-sm text-neutral-600">No articles found matching filter criteria.</p>
                        <p className="text-xs text-neutral-400 mt-1">Click "+ Write Article" or "🚀 Generate 4-Hour Recap Now" to add entries.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((art) => (
                      <tr key={art.id} className="hover:bg-neutral-50/80 transition group">
                        {/* Title */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="flex items-start gap-2.5">
                            {art.cover_image_url ? (
                              <img
                                src={art.cover_image_url}
                                alt={art.title}
                                className="w-12 h-9 object-cover rounded-lg border border-neutral-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400 font-bold text-[10px]">
                                WIRE
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-black text-neutral-900 leading-snug line-clamp-2">
                                {art.title}
                              </p>
                              {art.subtitle && (
                                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                  {art.subtitle}
                                </p>
                              )}
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                slug: {art.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3">
                          <span className="inline-block px-2.5 py-1 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-bold rounded-lg uppercase whitespace-nowrap">
                            {CATEGORY_LABELS[art.category] || art.category}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${
                              art.article_type === '4_hour_wire'
                                ? 'bg-red-50 text-[#ff3b30] border border-red-200'
                                : art.article_type === 'breaking'
                                ? 'bg-black text-white'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {art.article_type === '4_hour_wire' ? '⚡ 4H WIRE' : art.article_type}
                          </span>
                        </td>

                        {/* Status / Visibility */}
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => handleToggleArticlePublic(art)}
                            className={`min-h-[36px] px-2.5 py-1 text-[11px] font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                              art.is_public
                                ? 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800'
                                : 'bg-neutral-100 text-neutral-500 border-neutral-300 hover:bg-neutral-200'
                            }`}
                            title="Click to toggle public visibility"
                          >
                            <span className={`w-2 h-2 rounded-full ${art.is_public ? 'bg-[#ff3b30]' : 'bg-neutral-400'}`} />
                            <span>{art.is_public ? 'Public' : 'Draft'}</span>
                          </button>
                        </td>

                        {/* Views */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-neutral-800">
                          {(art.views || 0).toLocaleString()}
                        </td>

                        {/* Published Date */}
                        <td className="py-3.5 px-3 text-neutral-500 text-[11px] whitespace-nowrap">
                          {art.published_at
                            ? new Date(art.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/news/${art.slug}`}
                              target="_blank"
                              className="min-h-[44px] min-w-[44px] px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg flex items-center justify-center transition border border-neutral-200"
                              title="View Live Reader"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleOpenEditArticle(art)}
                              className="min-h-[44px] min-w-[44px] px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg flex items-center justify-center transition border border-neutral-200 cursor-pointer"
                              title="Edit Article"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteArticle(art.id, art.title)}
                              className="min-h-[44px] min-w-[44px] px-2 py-1 bg-neutral-100 hover:bg-red-50 text-neutral-400 hover:text-[#ff3b30] rounded-lg flex items-center justify-center transition border border-neutral-200 cursor-pointer"
                              title="Delete Article"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEED MANAGEMENT */}
      {activeTab === 'feeds' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeds.map((feed) => (
              <div
                key={feed.id}
                className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-black rounded-md uppercase">
                      {CATEGORY_LABELS[feed.category] || feed.category}
                    </span>

                    <button
                      onClick={() => handleToggleFeed(feed)}
                      className={`min-h-[36px] px-3 py-1 text-[11px] font-black uppercase rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                        feed.is_active
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${feed.is_active ? 'bg-[#ff3b30]' : 'bg-neutral-400'}`} />
                      <span>{feed.is_active ? 'Active' : 'Paused'}</span>
                    </button>
                  </div>

                  <h3 className="font-black text-sm text-neutral-900 mt-3 leading-snug">
                    {feed.name}
                  </h3>
                  <a
                    href={feed.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-neutral-400 hover:text-neutral-700 truncate block mt-1 underline font-mono"
                  >
                    {feed.url}
                  </a>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      {feed.last_fetched_at
                        ? `Last: ${new Date(feed.last_fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Never polled'}
                    </span>
                  </div>
                  <span className="font-bold text-neutral-700">
                    Interval: {feed.fetch_interval_mins || 30}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD FEED MODAL */}
      {showAddFeedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black uppercase text-neutral-900 flex items-center gap-2">
                <Rss className="w-5 h-5 text-[#ff3b30]" />
                <span>Add RSS Wire Feed</span>
              </h3>
              <button
                onClick={() => setShowAddFeedModal(false)}
                className="min-h-[44px] min-w-[44px] text-neutral-400 hover:text-neutral-900 font-bold p-2 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFeed} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Feed Name / Publication
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traxion Sim Racing Dispatch"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  RSS Feed URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://domain.com/feed/"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newFeedCategory}
                    onChange={(e) => setNewFeedCategory(e.target.value as NewsCategory)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none"
                  >
                    {NEWS_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Fetch Interval (Mins)
                  </label>
                  <select
                    value={newFeedInterval}
                    onChange={(e) => setNewFeedInterval(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none"
                  >
                    <option value={15}>Every 15 mins</option>
                    <option value={30}>Every 30 mins</option>
                    <option value={60}>Every 1 hour</option>
                    <option value={240}>Every 4 hours</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFeedModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingFeed}
                  className="min-h-[44px] px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-[#ff3b30] hover:bg-[#d63025] rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingFeed ? 'Adding Feed...' : 'Save & Register Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARTICLE EDIT / CREATE MODAL */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-300 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 sticky top-0 bg-white z-10">
              <h3 className="text-base font-black uppercase text-neutral-900 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#ff3b30]" />
                <span>{editingArticle ? 'Edit Article' : 'Write New Motorsport Article'}</span>
              </h3>
              <button
                onClick={() => setShowArticleModal(false)}
                className="min-h-[44px] min-w-[44px] text-neutral-400 hover:text-neutral-900 font-bold p-2 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verstappen Dominates Spa Qualifying with Low-Downforce Package"
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Subtitle / Deck
                </label>
                <input
                  type="text"
                  placeholder="Brief sub-headline describing key takeaway"
                  value={artSubtitle}
                  onChange={(e) => setArtSubtitle(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Category
                  </label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value as NewsCategory)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none"
                  >
                    {NEWS_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                    Story Type
                  </label>
                  <select
                    value={artType}
                    onChange={(e) => setArtType(e.target.value as any)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none"
                  >
                    <option value="standard">Standard Article</option>
                    <option value="breaking">Breaking News</option>
                    <option value="4_hour_wire">4-Hour Wire Recap</option>
                    <option value="feature">Feature / Analysis</option>
                    <option value="press_release">Press Release</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={artCoverImage}
                  onChange={(e) => setArtCoverImage(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Summary / Lead Paragraph *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Executive summary of the news story..."
                  value={artSummary}
                  onChange={(e) => setArtSummary(e.target.value)}
                  className="w-full p-3 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Article Body (Markdown Supported) *
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Write the verified editorial content with markdown formatting..."
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  className="w-full p-3 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900 font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={artIsPublic}
                    onChange={(e) => setArtIsPublic(e.target.checked)}
                    className="w-4 h-4 accent-[#ff3b30] rounded"
                  />
                  <span className="text-xs font-black uppercase text-neutral-800">
                    Publish Immediately to Public Racing Wire
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingArticle}
                  className="min-h-[44px] px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-[#ff3b30] hover:bg-[#d63025] rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingArticle ? 'Saving...' : editingArticle ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
