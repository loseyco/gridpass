'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ToastContext';
import { NEWS_CATEGORIES, CATEGORY_LABELS, NewsCategory } from '@/lib/types/news';
import {
  Camera,
  Image as ImageIcon,
  Send,
  X,
  Sparkles,
  Tag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  onPostCreated?: () => void;
}

export default function PaddockPostComposer({ onPostCreated }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NewsCategory>('stock_car');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        title: 'Photo Too Large',
        message: 'Please choose an image under 5MB.',
        icon: '⚠️',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast({
        title: 'Sign In Required',
        message: 'Please sign in to share a paddock update.',
        icon: '🔒',
      });
      return;
    }

    if (!content.trim()) {
      showToast({
        title: 'Message Required',
        message: 'Please write a brief message or race update.',
        icon: '⚠️',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = (headline || content.slice(0, 40))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

      await addDoc(collection(db, 'news_articles'), {
        title: headline.trim() || `${user.displayName || 'Member'} Paddock Update`,
        summary: content.slice(0, 200).trim(),
        content: content.trim(),
        category,
        cover_image_url: photoBase64 || null,
        cover_image: photoBase64 || null,
        author: user.displayName || user.email?.split('@')[0] || 'Gridpass Member',
        author_id: user.uid,
        author_photo: user.photoURL || null,
        source_name: 'Member Post',
        source_url: `https://gridpass.app/u/${user.uid}`,
        is_user_post: true,
        is_public: true,
        status: 'published',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        slug,
        likes_count: 0,
        comments_count: 0,
        checkins_count: 0,
        entities: [],
      });

      showToast({
        title: 'Post Published!',
        message: 'Your update is now live on the paddock timeline.',
        icon: '🏁',
      });

      // Reset
      setHeadline('');
      setContent('');
      setPhotoBase64(null);
      setIsOpen(false);
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      console.error('Error publishing member post:', err);
      showToast({
        title: 'Publish Error',
        message: err.message || 'Failed to post update. Please try again.',
        icon: '❌',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 font-bold text-sm">
            🏁
          </div>
          <div>
            <p className="text-xs font-black uppercase text-neutral-900">Share Your Paddock Update</p>
            <p className="text-[11px] text-neutral-500">Post race results, car builds, and trackside photos.</p>
          </div>
        </div>
        <Link
          href="/login?redirect=/news"
          className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs space-y-3">
      {/* Top collapsed row */}
      {!isOpen ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ff3b30] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              (user.displayName || user.email || 'U')[0].toUpperCase()
            )}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 bg-neutral-100/80 hover:bg-neutral-100 text-left px-4 py-2.5 rounded-full text-xs text-neutral-500 font-medium transition cursor-text"
          >
            What&apos;s happening in your paddock, shop, or track?
          </button>
          <button
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
            className="p-2 text-neutral-500 hover:text-[#ff3b30] hover:bg-neutral-50 rounded-xl transition"
            title="Attach Photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* Expanded composer form */
        <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff3b30] animate-pulse" />
              <span className="text-xs font-black uppercase text-neutral-900 tracking-wider">
                Create Paddock Post
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Discipline Selector */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase text-neutral-500">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NewsCategory)}
              className="px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#ff3b30]"
            >
              {NEWS_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Headline (Optional) */}
          <input
            type="text"
            placeholder="Headline / Topic (Optional)"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#ff3b30]"
          />

          {/* Main Body */}
          <textarea
            placeholder="Share your track times, chassis setup, race recap, or paddock questions..."
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#ff3b30] resize-none"
            autoFocus
          />

          {/* Photo Preview */}
          {photoBase64 && (
            <div className="relative rounded-xl overflow-hidden border border-neutral-200 max-h-56 bg-neutral-900">
              <img src={photoBase64} alt="Attached" className="w-full h-full object-cover max-h-56" />
              <button
                type="button"
                onClick={() => setPhotoBase64(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition backdrop-blur-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition"
              >
                <ImageIcon className="w-4 h-4 text-[#ff3b30]" />
                <span>{photoBase64 ? 'Change Photo' : 'Add Photo'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#ff3b30] hover:bg-[#bd2925] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-xs"
              >
                {isSubmitting ? (
                  <span>Publishing...</span>
                ) : (
                  <>
                    <span>Post</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
