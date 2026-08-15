'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { Article, NEWS_CATEGORIES, NewsCategory } from '@/lib/types/news';
import { X, Edit3, Camera, Save, Eye, EyeOff, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  article: Article;
  onUpdated?: () => void;
}

export default function EditPostModal({ isOpen, onClose, article, onUpdated }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = user?.email === 'loseyp@gmail.com' || (user as any)?.role === 'admin' || (user as any)?.role === 'super_admin';
  const canDelete = isSuperAdmin || (user && user.uid === article.author_id);

  const [title, setTitle] = useState(article.title || '');
  const [category, setCategory] = useState<NewsCategory>(article.category || 'stock_car');
  const [content, setContent] = useState(article.content || article.summary || '');
  const [photoBase64, setPhotoBase64] = useState<string | null>(article.cover_image || article.cover_image_url || null);
  const [isHidden, setIsHidden] = useState<boolean>(article.is_hidden || false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const articleId = article.id || article.slug;

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

  const handleDelete = async () => {
    if (!articleId) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'news_articles', articleId), {
        is_hidden: true,
        is_deleted: true,
        status: 'archived',
        deleted_at: new Date().toISOString(),
        deleted_by: user?.email || 'admin',
      });

      showToast({
        title: 'Post Deleted',
        message: 'This post has been permanently removed from public feeds.',
        icon: '🗑️',
      });

      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error deleting post:', err);
      showToast({
        title: 'Delete Failed',
        message: err.message || 'Could not delete post.',
        icon: '❌',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleId) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'news_articles', articleId), {
        title: title.trim(),
        category,
        content: content.trim(),
        summary: content.slice(0, 200).trim(),
        cover_image: photoBase64,
        cover_image_url: photoBase64,
        is_hidden: isHidden,
        updated_at: new Date().toISOString(),
      });

      showToast({
        title: 'Post Updated!',
        message: 'Your edits have been saved to Cloud Firestore.',
        icon: '💾',
      });

      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating post:', err);
      showToast({
        title: 'Save Failed',
        message: err.message || 'Could not update post.',
        icon: '❌',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-neutral-950 tracking-tight">
                Edit Paddock Post
              </h3>
              <p className="text-[11px] text-neutral-500">Super Admin & Author Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Visibility Switch */}
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isHidden ? (
                <EyeOff className="w-4 h-4 text-amber-600" />
              ) : (
                <Eye className="w-4 h-4 text-emerald-600" />
              )}
              <div>
                <p className="text-xs font-black uppercase text-neutral-900">
                  {isHidden ? '🔒 Hidden from Public' : '🌐 Publicly Visible'}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {isHidden ? 'Only admins can view this post' : 'Visible to all visitors in feed'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsHidden(!isHidden)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                isHidden
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isHidden ? 'Make Public' : 'Hide Post'}
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-neutral-500">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NewsCategory)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
            >
              {NEWS_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-neutral-500">Headline / Topic:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              placeholder="Post headline"
            />
          </div>

          {/* Content */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-neutral-500">Body Content:</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              placeholder="Post message..."
            />
          </div>

          {/* Photo Preview / Replace */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-neutral-500">Attached Photo:</label>
            {photoBase64 ? (
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200 aspect-16/9 bg-neutral-100 max-h-40">
                <img src={photoBase64} alt="Attached Photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoBase64(null)}
                  className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-white rounded-lg text-xs"
                  title="Remove Photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 bg-neutral-50 hover:bg-neutral-100 border border-dashed border-neutral-300 rounded-xl text-xs font-bold text-neutral-600 cursor-pointer transition">
                <Camera className="w-4 h-4 text-neutral-400" />
                <span>Upload New Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-100 flex-wrap">
            {/* Delete / Archive Button for Admin & Author */}
            {canDelete && (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                    <span className="text-[10px] font-black uppercase text-red-600 pl-1">Delete Post?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 bg-white hover:bg-neutral-100 text-neutral-600 rounded-lg text-[10px] font-bold uppercase transition border border-neutral-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5"
                    title="Permanently remove post from feed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
