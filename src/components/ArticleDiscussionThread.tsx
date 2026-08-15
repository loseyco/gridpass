'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  increment,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import { NewsComment } from '@/lib/types/news';
import {
  ThumbsUp,
  MessageSquare,
  Send,
  Camera,
  ShieldCheck,
  User,
  Loader2,
  X,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface ArticleDiscussionThreadProps {
  articleId: string;
  articleSlug: string;
  initialLikesCount?: number;
  initialCommentsCount?: number;
}

export function ArticleDiscussionThread({
  articleId,
  articleSlug,
  initialLikesCount = 0,
  initialCommentsCount = 0,
}: ArticleDiscussionThreadProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [comments, setComments] = useState<NewsComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Article Like State
  const [articleLikes, setArticleLikes] = useState<number>(initialLikesCount);
  const [hasLikedArticle, setHasLikedArticle] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());

  // Form Inputs
  const [guestNickname, setGuestNickname] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [spamError, setSpamError] = useState<string | null>(null);

  // User Profile
  const [driverProfile, setDriverProfile] = useState<{
    username: string;
    avatar_url: string | null;
    display_name: string;
    is_driver: boolean;
  } | null>(null);

  // Load liked status from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const likedArt = localStorage.getItem(`gp_liked_art_${articleId}`);
      if (likedArt) setHasLikedArticle(true);

      const savedLikedComments = localStorage.getItem(`gp_liked_comments_${articleId}`);
      if (savedLikedComments) {
        try {
          setLikedCommentIds(new Set(JSON.parse(savedLikedComments)));
        } catch {
          // ignore
        }
      }
    }
  }, [articleId]);

  // Load driver profile if logged in
  useEffect(() => {
    if (!user) {
      setDriverProfile(null);
      return;
    }

    async function loadDriver() {
      try {
        const uDoc = await getDoc(doc(db, 'users', user!.uid));
        if (uDoc.exists()) {
          const d = uDoc.data();
          setDriverProfile({
            username: d.username || user!.email?.split('@')[0] || user!.uid,
            avatar_url: d.avatar_url || user!.photoURL || null,
            display_name: d.display_name || d.name || user!.displayName || 'Driver',
            is_driver: true,
          });
        } else {
          setDriverProfile({
            username: user!.email?.split('@')[0] || user!.uid,
            avatar_url: user!.photoURL || null,
            display_name: user!.displayName || user!.email?.split('@')[0] || 'Driver',
            is_driver: true,
          });
        }
      } catch (err) {
        console.warn('Could not load driver profile for discussion:', err);
      }
    }

    loadDriver();
  }, [user]);

  // Listen to article likes count
  useEffect(() => {
    if (!articleId) return;
    const unsub = onSnapshot(doc(db, 'news_articles', articleId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.likes_count === 'number') {
          setArticleLikes(data.likes_count);
        }
      }
    });
    return () => unsub();
  }, [articleId]);

  // Real-time listener for comments on this article
  useEffect(() => {
    if (!articleId) return;

    const q = query(collection(db, 'news_comments'), where('article_id', '==', articleId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: NewsComment[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as NewsComment);
        });
        // Sort descending by created_at
        list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        setComments(list);
        setLoading(false);
      },
      (err) => {
        console.warn('News comments listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [articleId]);

  // 1-Tap Article Like Handler
  const handleToggleArticleLike = async () => {
    const nextState = !hasLikedArticle;
    setHasLikedArticle(nextState);
    setArticleLikes((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    if (typeof window !== 'undefined') {
      if (nextState) {
        localStorage.setItem(`gp_liked_art_${articleId}`, 'true');
      } else {
        localStorage.removeItem(`gp_liked_art_${articleId}`);
      }
    }

    try {
      await updateDoc(doc(db, 'news_articles', articleId), {
        likes_count: increment(nextState ? 1 : -1),
      });
      if (nextState) {
        showToast({
          title: '👍 Story Liked',
          message: 'Thanks for supporting verified paddock journalism!',
          icon: '🏁',
        });
      }
    } catch (err) {
      console.warn('Could not increment article likes:', err);
    }
  };

  // 1-Tap Comment Like Handler
  const handleToggleCommentLike = async (commentId: string) => {
    const isLiked = likedCommentIds.has(commentId);
    const newSet = new Set(likedCommentIds);
    if (isLiked) {
      newSet.delete(commentId);
    } else {
      newSet.add(commentId);
    }
    setLikedCommentIds(newSet);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`gp_liked_comments_${articleId}`, JSON.stringify(Array.from(newSet)));
    }

    try {
      await updateDoc(doc(db, 'news_comments', commentId), {
        likes_count: increment(isLiked ? -1 : 1),
      });
    } catch (err) {
      console.warn('Could not update comment likes:', err);
    }
  };

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        title: 'Image Too Large',
        message: 'Please upload an image smaller than 5MB.',
        icon: '⚠️',
      });
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Anti-Spam Check for Guest URLs
  const containsUrl = (text: string): boolean => {
    const urlPattern = /(https?:\/\/|www\.|bit\.ly|t\.co|\.com|\.org|\.net|\.io|\.app|\.cc|\.gg|\.xyz)/i;
    return urlPattern.test(text);
  };

  // Submit Comment Form
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpamError(null);

    const trimmed = commentContent.trim();
    if (!trimmed) return;

    // Check Guest Restrictions
    if (!user) {
      if (!guestNickname.trim()) {
        showToast({
          title: 'Nickname Required',
          message: 'Please enter a paddock nickname for your guest comment.',
          icon: '⚠️',
        });
        return;
      }

      if (trimmed.length > 280) {
        showToast({
          title: 'Character Limit',
          message: 'Guest comments are limited to 280 characters.',
          icon: '⚠️',
        });
        return;
      }

      if (containsUrl(trimmed) || containsUrl(guestNickname)) {
        setSpamError('URLs & external links are restricted for guest comments to prevent spam. Sign in to link verified assets.');
        showToast({
          title: 'Link Blocked',
          message: 'Guest comments cannot contain hyperlinks.',
          icon: '🛡️',
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      let uploadedPhotoUrl: string | null = null;

      if (photoFile && user) {
        setUploadingPhoto(true);
        try {
          const photoStorageRef = ref(storage, `news_comments/${articleId}/${user.uid}_${Date.now()}_${photoFile.name}`);
          const snap = await uploadBytes(photoStorageRef, photoFile);
          uploadedPhotoUrl = await getDownloadURL(snap.ref);
        } catch (uploadErr) {
          console.warn('Photo upload failed, continuing with comment:', uploadErr);
        } finally {
          setUploadingPhoto(false);
        }
      }

      const authorName = user
        ? driverProfile?.display_name || user.displayName || user.email?.split('@')[0] || 'Verified Driver'
        : guestNickname.trim();

      const authorUsername = user
        ? driverProfile?.username || user.email?.split('@')[0] || null
        : null;

      const authorAvatar = user
        ? driverProfile?.avatar_url || user.photoURL || null
        : null;

      const newCommentData: Omit<NewsComment, 'id'> = {
        article_id: articleId,
        user_id: user ? user.uid : null,
        author_name: authorName,
        author_avatar: authorAvatar,
        author_username: authorUsername,
        is_verified_driver: Boolean(user),
        content: trimmed,
        photo_url: uploadedPhotoUrl,
        likes_count: 0,
        created_at: new Date().toISOString(),
      };

      await addDoc(collection(db, 'news_comments'), newCommentData);

      // Increment comments_count on article
      try {
        await updateDoc(doc(db, 'news_articles', articleId), {
          comments_count: increment(1),
        });
      } catch {
        // ignore
      }

      showToast({
        title: '💬 Comment Published',
        message: user ? 'Your verified driver comment has been posted!' : 'Your guest comment has been posted to the wire.',
        icon: '✅',
      });

      setCommentContent('');
      if (!user) setGuestNickname('');
      handleRemovePhoto();
    } catch (err: any) {
      console.error('Error posting comment:', err);
      showToast({
        title: 'Error Posting',
        message: err.message || 'Could not post your comment. Please try again.',
        icon: '⚠️',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalComments = Math.max(comments.length, initialCommentsCount);

  return (
    <section className="space-y-6 pt-6 border-t border-neutral-200 text-left">
      {/* Header & 1-Tap Reaction Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-black text-sm uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#ff3b30]" />
            <span>Paddock Discussion &amp; Comments ({totalComments})</span>
          </h3>
          <p className="text-xs text-neutral-500 font-medium">
            Join the conversation. All motorsport disciplines, track days, and car chat welcome.
          </p>
        </div>

        {/* 1-Tap 👍 Reaction Button (>=44px touch target) */}
        <button
          type="button"
          onClick={handleToggleArticleLike}
          className={`min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            hasLikedArticle
              ? 'bg-[#ff3b30] text-white shadow-md shadow-red-500/20'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
          }`}
          aria-label={hasLikedArticle ? 'Unlike Story' : 'Like Story'}
        >
          <ThumbsUp className={`w-4 h-4 ${hasLikedArticle ? 'fill-white text-white' : 'text-neutral-700'}`} />
          <span>{hasLikedArticle ? 'Liked' : 'Like Story'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${hasLikedArticle ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-800'}`}>
            {articleLikes}
          </span>
        </button>
      </div>

      {/* Comment Composition Box */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center text-white text-xs font-black">
                  {driverProfile?.avatar_url ? (
                    <img src={driverProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    '🏎️'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs uppercase text-neutral-900">
                      {driverProfile?.display_name || user.displayName || 'Driver'}
                    </span>
                    <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-[#ff3b30] text-[9px] font-black uppercase rounded-md flex items-center gap-1">
                      🏎️ Verified Driver
                    </span>
                  </div>
                  {driverProfile?.username && (
                    <Link
                      href={`/u/${driverProfile.username}`}
                      className="text-[10px] text-neutral-500 hover:text-[#ff3b30] font-mono block"
                    >
                      /u/{driverProfile.username}
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-neutral-800">Guest Paddock Wire Tier</span>
                  <p className="text-[10px] text-neutral-400">
                    <Link href={`/login?redirect=/news/${articleSlug}`} className="text-[#ff3b30] font-bold hover:underline">
                      Sign in
                    </Link>{' '}
                    for verified driver badges, photo uploads &amp; unlimited length.
                  </p>
                </div>
              </div>
            )}
          </div>

          <span className="text-[10px] font-mono text-neutral-400">
            {user ? 'Member' : 'Guest (Max 280 chars)'}
          </span>
        </div>

        <form onSubmit={handleSubmitComment} className="space-y-3">
          {/* Guest Nickname Input */}
          {!user && (
            <div>
              <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                Your Name / Handle *
              </label>
              <input
                type="text"
                required
                maxLength={40}
                placeholder="e.g. ApexHunter or Alex"
                value={guestNickname}
                onChange={(e) => setGuestNickname(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-900 text-neutral-900 outline-none"
              />
            </div>
          )}

          {/* Comment Textarea */}
          <div className="relative">
            <textarea
              required
              rows={user ? 3 : 2}
              maxLength={user ? 1000 : 280}
              placeholder={
                user
                  ? 'Share your thoughts or leave a comment...'
                  : 'Write a comment (max 280 chars)...'
              }
              value={commentContent}
              onChange={(e) => {
                setCommentContent(e.target.value);
                if (spamError) setSpamError(null);
              }}
              className="w-full p-3.5 text-xs bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:border-[#ff3b30] text-neutral-900 outline-none resize-none transition"
            />
            <span className="absolute bottom-3 right-3 text-[10px] font-mono text-neutral-400">
              {commentContent.length}/{user ? 1000 : 280}
            </span>
          </div>

          {/* Spam Error Alert */}
          {spamError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#ff3b30] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{spamError}</span>
            </div>
          )}

          {/* Photo Preview (Logged-In Drivers) */}
          {photoPreview && (
            <div className="relative inline-block border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-100">
              <img src={photoPreview} alt="Upload preview" className="max-h-36 max-w-xs object-cover" />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="min-h-[44px] min-w-[44px] absolute top-1 right-1 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition cursor-pointer"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {/* Photo Upload */}
              {user ? (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                    id="comment-photo-upload"
                  />
                  <label
                    htmlFor="comment-photo-upload"
                    className="min-h-[44px] px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-neutral-200"
                  >
                    <Camera className="w-4 h-4 text-[#ff3b30]" />
                    <span>{photoFile ? 'Change Photo' : '📷 Attach Photo'}</span>
                  </label>
                </>
              ) : (
                <span className="text-[10px] text-neutral-400 font-mono">
                  Links blocked to prevent spam
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploadingPhoto || !commentContent.trim()}
              className="min-h-[44px] min-w-[44px] px-6 py-2.5 bg-[#ff3b30] hover:bg-[#d63025] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {submitting || uploadingPhoto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Real-time Comments Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-neutral-400 font-mono text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff3b30]" />
            Loading live discussion...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-3xl text-center space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
            <h4 className="text-xs font-black uppercase text-neutral-800">No comments posted yet</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Start the discussion! Share your race telemetry notes or opinion on this wire report.
            </p>
          </div>
        ) : (
          comments.map((cmt) => {
            const isLiked = likedCommentIds.has(cmt.id);

            return (
              <div
                key={cmt.id}
                className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2.5 transition"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center text-white text-xs font-black shrink-0">
                      {cmt.author_avatar ? (
                        <img src={cmt.author_avatar} alt={cmt.author_name} className="w-full h-full object-cover" />
                      ) : (
                        cmt.author_name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cmt.author_username ? (
                          <Link
                            href={`/u/${cmt.author_username}`}
                            className="font-black text-xs uppercase text-neutral-900 hover:text-[#ff3b30] transition truncate"
                          >
                            {cmt.author_name}
                          </Link>
                        ) : (
                          <span className="font-black text-xs uppercase text-neutral-900 truncate">
                            {cmt.author_name}
                          </span>
                        )}

                        {cmt.is_verified_driver && (
                          <span className="px-2 py-0.2 bg-red-50 border border-red-200 text-[#ff3b30] text-[9px] font-black uppercase rounded-md flex items-center gap-0.5">
                            🏎️ Driver
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-neutral-400 block">
                        {cmt.created_at
                          ? new Date(cmt.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>

                  {/* 1-Tap Comment Like Button (>=44px touch target) */}
                  <button
                    type="button"
                    onClick={() => handleToggleCommentLike(cmt.id)}
                    className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isLiked
                        ? 'bg-red-50 text-[#ff3b30] border border-red-200'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-200'
                    }`}
                    aria-label={isLiked ? 'Unlike Comment' : 'Like Comment'}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#ff3b30] text-[#ff3b30]' : 'text-neutral-500'}`} />
                    <span>{(cmt.likes_count || 0) + (isLiked ? 1 : 0)}</span>
                  </button>
                </div>

                {/* Comment Body */}
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed pl-10 whitespace-pre-line">
                  {cmt.content}
                </p>

                {/* Attached Photo */}
                {cmt.photo_url && (
                  <div className="pl-10 pt-1">
                    <a
                      href={cmt.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block max-w-sm rounded-2xl overflow-hidden border border-neutral-200 group"
                    >
                      <img
                        src={cmt.photo_url}
                        alt="Attached telemetry photo"
                        className="w-full max-h-60 object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
