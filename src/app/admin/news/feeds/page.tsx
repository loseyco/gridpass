'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { NewsFeed, NewsCategory, NEWS_CATEGORIES, CATEGORY_LABELS } from '@/lib/types/news';
import {
  saveNewsFeed,
  deleteNewsFeed,
  toggleFeedActive,
  seedInitialFeedsIfEmpty,
  INITIAL_VERIFIED_FEEDS,
} from '@/lib/actions/news';
import { useToast } from '@/components/ToastContext';
import {
  Rss,
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function AdminFeedSourcesPage() {
  const { showToast } = useToast();
  const [feeds, setFeeds] = useState<NewsFeed[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for Add / Edit
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedCategory, setFeedCategory] = useState<NewsCategory>('open_wheel');
  const [fetchIntervalMins, setFetchIntervalMins] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    seedInitialFeedsIfEmpty().catch((err) => console.warn('Seed initial feeds error:', err));

    const unsubscribe = onSnapshot(
      collection(db, 'news_feeds'),
      (snapshot) => {
        const list: NewsFeed[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as NewsFeed);
        });
        setFeeds(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Feed sources listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleEditClick = (feed: NewsFeed) => {
    setEditingFeedId(feed.id);
    setFeedName(feed.name);
    setFeedUrl(feed.url);
    setFeedCategory(feed.category);
    setFetchIntervalMins(feed.fetch_interval_mins || 30);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingFeedId(null);
    setFeedName('');
    setFeedUrl('');
    setFeedCategory('open_wheel');
    setFetchIntervalMins(30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName.trim() || !feedUrl.trim()) return;

    setIsSubmitting(true);
    try {
      await saveNewsFeed({
        id: editingFeedId || undefined,
        name: feedName.trim(),
        url: feedUrl.trim(),
        category: feedCategory,
        fetch_interval_mins: Number(fetchIntervalMins),
        is_active: true,
      });

      showToast({
        title: editingFeedId ? 'Feed Source Updated' : 'Feed Source Registered',
        message: `Saved "${feedName}" for automatic wire polling.`,
        icon: '📡',
      });

      handleCancelEdit();
    } catch (err: any) {
      showToast({
        title: 'Error Saving Feed',
        message: err.message || 'Could not save feed source.',
        icon: '⚠️',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (feed: NewsFeed) => {
    try {
      await toggleFeedActive(feed.id, feed.is_active);
      showToast({
        title: feed.is_active ? 'Feed Paused' : 'Feed Resumed',
        message: `${feed.name} is now ${feed.is_active ? 'paused' : 'actively polling'}.`,
        icon: '🔄',
      });
    } catch (err: any) {
      showToast({
        title: 'Toggle Failed',
        message: err.message,
        icon: '⚠️',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete feed "${name}"?`)) return;

    try {
      await deleteNewsFeed(id);
      showToast({
        title: 'Feed Deleted',
        message: `Removed ${name} from ingestion network.`,
        icon: '🗑️',
      });
    } catch (err: any) {
      showToast({
        title: 'Delete Failed',
        message: err.message,
        icon: '⚠️',
      });
    }
  };

  const handleQuickAddTemplate = async (template: Omit<NewsFeed, 'id'>) => {
    try {
      await saveNewsFeed(template);
      showToast({
        title: 'Verified Feed Added',
        message: `Registered ${template.name} directly to your polling list.`,
        icon: '⚡',
      });
    } catch (err: any) {
      showToast({
        title: 'Error',
        message: err.message,
        icon: '⚠️',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/news"
              className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-neutral-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>News HQ</span>
            </Link>
            <span className="text-neutral-400">/</span>
            <span className="text-xs font-black uppercase text-neutral-500">Wire Sources</span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
            RSS Wire Source Manager
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Configure live RSS feeds, polling frequencies, and categorization for the Gridpass Racing Wire.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/news"
            className="min-h-[44px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2"
          >
            <span>Back to News HQ</span>
          </Link>
        </div>
      </div>

      {/* Grid: Left Column Form, Right Column Feed List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Add / Edit Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-neutral-900 flex items-center gap-2">
                <Rss className="w-4 h-4 text-[#ff3b30]" />
                <span>{editingFeedId ? 'Edit Feed Configuration' : 'Register New Wire Feed'}</span>
              </h2>
              {editingFeedId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-[#ff3b30] hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Source Publication Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RACER Magazine Wire"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  RSS Feed URL Endpoint *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/feed/"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Motorsport Category *
                </label>
                <select
                  value={feedCategory}
                  onChange={(e) => setFeedCategory(e.target.value as NewsCategory)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none"
                >
                  {NEWS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Automated Fetch Interval *
                </label>
                <select
                  value={fetchIntervalMins}
                  onChange={(e) => setFetchIntervalMins(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none"
                >
                  <option value={15}>Every 15 Minutes (Ultra Breaking)</option>
                  <option value={30}>Every 30 Minutes (Recommended)</option>
                  <option value={60}>Every 1 Hour (Standard)</option>
                  <option value={120}>Every 2 Hours (Low Volume)</option>
                  <option value={240}>Every 4 Hours (Daily Digest)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-2.5 px-4 bg-[#ff3b30] hover:bg-[#d63025] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition active:scale-95 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Source...' : editingFeedId ? 'Update Wire Source' : 'Add Wire Source'}</span>
              </button>
            </form>
          </div>

          {/* Quick-Add Verified Source Suggestions */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff3b30]" />
              <span>Verified Paddock Wire Templates</span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              One-click add verified motorsport RSS feeds to your ingestion network:
            </p>

            <div className="space-y-2 pt-1">
              {INITIAL_VERIFIED_FEEDS.slice(0, 4).map((template, idx) => {
                const alreadyExists = feeds.some((f) => f.url === template.url);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-neutral-900 truncate">{template.name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono truncate">{template.url}</p>
                    </div>

                    <button
                      onClick={() => handleQuickAddTemplate(template)}
                      disabled={alreadyExists}
                      className={`min-h-[44px] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition shrink-0 ${
                        alreadyExists
                          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                          : 'bg-neutral-900 hover:bg-[#ff3b30] text-white cursor-pointer'
                      }`}
                    >
                      {alreadyExists ? 'Active' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Feed Source List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-sm font-black uppercase text-neutral-900">
                  Registered Feeds ({feeds.length})
                </h2>
                <p className="text-[11px] text-neutral-500">
                  Live Firestore feeds evaluated on schedule.
                </p>
              </div>

              <span className="text-[11px] font-bold text-neutral-500 font-mono">
                {feeds.filter((f) => f.is_active).length} Active
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-neutral-400 font-mono text-xs">
                Connecting to live feed registry...
              </div>
            ) : feeds.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 space-y-2">
                <p className="font-bold text-sm text-neutral-700">No wire feeds registered.</p>
                <p className="text-xs text-neutral-500">Use the form on the left to add your first RSS endpoint.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feeds.map((feed) => (
                  <div
                    key={feed.id}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      feed.is_active
                        ? 'bg-white border-neutral-200 shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 opacity-70'
                    }`}
                  >
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-black rounded-md uppercase">
                          {CATEGORY_LABELS[feed.category] || feed.category}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          Interval: {feed.fetch_interval_mins || 30}m
                        </span>
                      </div>

                      <h3 className="font-black text-sm text-neutral-900 leading-snug">
                        {feed.name}
                      </h3>

                      <a
                        href={feed.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-neutral-500 hover:text-neutral-800 truncate block underline font-mono"
                      >
                        {feed.url}
                      </a>

                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {feed.last_fetched_at
                            ? `Last polled: ${new Date(feed.last_fetched_at).toLocaleString()}`
                            : 'Not yet polled'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <button
                        onClick={() => handleToggleActive(feed)}
                        className={`min-h-[44px] px-3 py-1.5 text-xs font-black uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                          feed.is_active
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                            : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${feed.is_active ? 'bg-[#ff3b30]' : 'bg-neutral-400'}`} />
                        <span>{feed.is_active ? 'Active' : 'Paused'}</span>
                      </button>

                      <button
                        onClick={() => handleEditClick(feed)}
                        className="min-h-[44px] min-w-[44px] p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition flex items-center justify-center border border-neutral-200 cursor-pointer"
                        title="Edit Feed"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(feed.id, feed.name)}
                        className="min-h-[44px] min-w-[44px] p-2 bg-neutral-100 hover:bg-red-50 text-neutral-400 hover:text-[#ff3b30] rounded-xl transition flex items-center justify-center border border-neutral-200 cursor-pointer"
                        title="Delete Feed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
