'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Article, CATEGORY_LABELS } from '@/lib/types/news';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { useToast } from '@/components/ToastContext';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Flag,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Plus,
  Send,
  Sparkles,
  ShieldCheck,
  MoreHorizontal,
  Flame,
  Radio,
  Eye,
  EyeOff,
  Edit3,
} from 'lucide-react';
import { isEntityFollowed, toggleFollowEntity } from '@/lib/utils/paddockFollow';
import { cleanStoryText } from '@/lib/news-cleaner';
import RichLinkPreview from './RichLinkPreview';
import ReportContentModal, { ReportTargetType } from './ReportContentModal';
import EditPostModal from './EditPostModal';

interface Props {
  article: Article;
  onFollowChange?: () => void;
  isSeen?: boolean;
  isRead?: boolean;
  onSeen?: (key: string) => void;
  onRead?: (key: string) => void;
}

interface CommentItem {
  id: string;
  author_name: string;
  author_photo?: string;
  author_id?: string;
  text: string;
  created_at: string;
}

export default function SocialFeedCard({
  article,
  onFollowChange,
  isSeen = false,
  isRead = false,
  onSeen,
  onRead,
}: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = user?.email === 'loseyp@gmail.com' || (user as any)?.role === 'admin' || (user as any)?.role === 'super_admin';
  const canModerate = isSuperAdmin || (user && user.uid === article.author_id);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Hidden State & Edit Modal
  const [isHidden, setIsHidden] = useState<boolean>(article.is_hidden || false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Optimistic like state
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(article.likes_count || 0);

  // Optimistic save / bookmark state (Fully toggleable on/off)
  const [hasSaved, setHasSaved] = useState(false);

  // Reporting Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType;
    id: string;
    title?: string;
    author?: string;
  }>({
    type: 'post',
    id: '',
  });

  const articleId = article.id || article.slug;
  const cardRef = React.useRef<HTMLElement>(null);

  // Viewport IntersectionObserver to mark story as SEEN when scrolled into view
  useEffect(() => {
    if (!cardRef.current || !onSeen || isSeen) return;

    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // Mark seen after 700ms visible in viewport
          timer = setTimeout(() => {
            onSeen(article.slug || article.id);
          }, 700);
        } else {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [article.slug, article.id, isSeen, onSeen]);

  // Topic Following State
  const topicSlug = article.category || 'general';
  const topicLabel = CATEGORY_LABELS[article.category] || article.category?.replace(/_/g, ' ') || 'Topic';
  const [isTopicFollowed, setIsTopicFollowed] = useState(false);

  useEffect(() => {
    if (!topicSlug) return;
    setIsTopicFollowed(isEntityFollowed(topicSlug));

    const handleFollowChange = () => {
      setIsTopicFollowed(isEntityFollowed(topicSlug));
    };

    window.addEventListener('gridpass_follow_change', handleFollowChange);
    return () => {
      window.removeEventListener('gridpass_follow_change', handleFollowChange);
    };
  }, [topicSlug]);

  const handleToggleFollowTopic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowFollowing = toggleFollowEntity({
      slug: topicSlug,
      name: topicLabel,
      type: 'series',
    });
    setIsTopicFollowed(isNowFollowing);
    showToast({
      title: isNowFollowing ? `Following ${topicLabel}` : `Unfollowed ${topicLabel}`,
      message: isNowFollowing
        ? `Posts in "${topicLabel}" will now appear in your Followed Feed!`
        : `Removed "${topicLabel}" from your followed topics.`,
      icon: isNowFollowing ? '⚡' : '👋',
    });
    if (onFollowChange) onFollowChange();
  };

  // Toggle Hide/Unhide for Admin / Author
  const handleToggleHide = async () => {
    const nextHidden = !isHidden;
    setIsHidden(nextHidden);
    if (!articleId) return;

    try {
      await updateDoc(doc(db, 'news_articles', articleId), {
        is_hidden: nextHidden,
        hidden_at: nextHidden ? new Date().toISOString() : null,
        hidden_by: user?.email || 'admin',
      });

      showToast({
        title: nextHidden ? 'Post Hidden from Public' : 'Post Restored to Public',
        message: nextHidden
          ? 'This post is hidden from the public feed so you can edit and fix it.'
          : 'This post is now live and visible to everyone.',
        icon: nextHidden ? '🔒' : '🌐',
      });

      if (onFollowChange) onFollowChange();
    } catch (err: any) {
      console.error('Error updating post visibility:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Could not update visibility.',
        icon: '❌',
      });
    }
  };

  // Initialize liked and saved state from localStorage & user data
  useEffect(() => {
    if (!articleId) return;
    try {
      // 1. Check Likes
      const storedLikes = localStorage.getItem('gridpass_liked_articles');
      const likedList: string[] = storedLikes ? JSON.parse(storedLikes) : [];
      const userLikedInDoc = (article as any).liked_by?.includes(user?.uid);
      if (likedList.includes(articleId) || userLikedInDoc) {
        setHasLiked(true);
      }

      // 2. Check Saved / Bookmarks
      const storedSaves = localStorage.getItem('gridpass_saved_articles');
      const savedList: string[] = storedSaves ? JSON.parse(storedSaves) : [];
      if (savedList.includes(articleId)) {
        setHasSaved(true);
      }
    } catch {}
  }, [articleId, user?.uid, article]);

  // Real-time comments listener when comments drawer is opened
  useEffect(() => {
    if (!showComments || !articleId) return;

    const q = query(
      collection(db, 'news_articles', articleId, 'comments'),
      orderBy('created_at', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: CommentItem[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setComments(list);
      },
      (err) => console.warn('Comments listener error:', err)
    );

    return () => unsub();
  }, [showComments, articleId]);

  // Handle Like Toggle (Strict 1 like max per user / device)
  const handleLike = async () => {
    const nextState = !hasLiked;
    setHasLiked(nextState);
    setLikesCount((prev: number) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    // Persist to localStorage
    try {
      const storedLikes = localStorage.getItem('gridpass_liked_articles');
      let likedList: string[] = storedLikes ? JSON.parse(storedLikes) : [];
      if (nextState) {
        if (!likedList.includes(articleId)) likedList.push(articleId);
      } else {
        likedList = likedList.filter((id) => id !== articleId);
      }
      localStorage.setItem('gridpass_liked_articles', JSON.stringify(likedList));
    } catch {}

    if (!articleId) return;
    try {
      await updateDoc(doc(db, 'news_articles', articleId), {
        likes_count: increment(nextState ? 1 : -1),
      });
    } catch (err) {
      console.warn('Like update error:', err);
    }
  };

  // Handle Bookmark / Save Toggle (Back out / untoggle anytime)
  const handleToggleSave = () => {
    const nextState = !hasSaved;
    setHasSaved(nextState);

    try {
      const storedSaves = localStorage.getItem('gridpass_saved_articles');
      let savedList: string[] = storedSaves ? JSON.parse(storedSaves) : [];
      if (nextState) {
        if (!savedList.includes(articleId)) savedList.push(articleId);
        showToast({
          title: 'Saved to Bookmarks',
          message: 'Story added to your saved list.',
          icon: '🔖',
        });
      } else {
        savedList = savedList.filter((id) => id !== articleId);
        showToast({
          title: 'Bookmark Removed',
          message: 'Story removed from your saved list.',
          icon: '🗑️',
        });
      }
      localStorage.setItem('gridpass_saved_articles', JSON.stringify(savedList));
    } catch {}
  };

  // Handle Comment Submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast({
        title: 'Sign In Required',
        message: 'Please sign in to join the discussion.',
        icon: '🔒',
      });
      return;
    }

    if (!newCommentText.trim() || !articleId) return;

    setIsPostingComment(true);
    try {
      await addDoc(collection(db, 'news_articles', articleId, 'comments'), {
        author_name: user.displayName || user.email?.split('@')[0] || 'Member',
        author_photo: user.photoURL || null,
        author_id: user.uid,
        text: newCommentText.trim(),
        created_at: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'news_articles', articleId), {
        comments_count: increment(1),
      });

      setNewCommentText('');
      showToast({
        title: 'Comment Posted!',
        message: 'Your thought was added to the paddock debate.',
        icon: '💬',
      });
    } catch (err: any) {
      console.error('Comment error:', err);
      showToast({
        title: 'Failed to post',
        message: err.message || 'Error adding comment.',
        icon: '❌',
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  // Share link to clipboard
  const handleShare = () => {
    const url = `https://gridpass.app/news/${article.slug || article.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast({
        title: 'Link Copied!',
        message: 'Share URL copied to clipboard.',
        icon: '🔗',
      });
    }
  };

  // Relative timestamp formatting
  const formattedTime = (() => {
    const raw = article.published_at || article.created_at;
    if (!raw) return 'Live';
    try {
      const diffMs = Date.now() - new Date(raw).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(raw).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Live';
    }
  })();

  const isUserPost = (article as any).is_user_post === true;
  const authorName = article.author || article.source_name || 'Gridpass News';
  const authorPhoto = (article as any).author_photo;
  const coverImage = article.cover_image || article.cover_image_url;

  return (
    <>
      {/* Universal Report Modal */}
      <ReportContentModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType={reportTarget.type}
        targetId={reportTarget.id}
        targetTitle={reportTarget.title}
        targetAuthor={reportTarget.author}
      />

      {/* Edit Post Modal (Super Admin & Author) */}
      <EditPostModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        article={article}
        onUpdated={() => {
          if (onFollowChange) onFollowChange();
        }}
      />

      <article
        ref={cardRef}
        className={`bg-white border rounded-2xl shadow-xs overflow-hidden transition duration-200 ${
          isHidden ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300' : 'border-neutral-200/90 hover:border-neutral-300'
        }`}
      >
        {/* Hidden Post Admin Banner */}
        {isHidden && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs font-black text-amber-800 flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <span>🔒</span>
              <span>HIDDEN FROM PUBLIC (Admin Review & Edit Mode)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditModalOpen(true)}
                className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-50 transition text-[10px] uppercase font-black flex items-center gap-1 shadow-2xs"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit & Fix</span>
              </button>
              <button
                onClick={handleToggleHide}
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-[10px] uppercase font-black flex items-center gap-1 shadow-2xs"
              >
                <Eye className="w-3 h-3" />
                <span>Make Public</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. Header: Author / Outlet Identity + Metadata */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-black text-xs shrink-0 overflow-hidden shadow-2xs">
              {authorPhoto ? (
                <img src={authorPhoto} alt={authorName} className="w-full h-full object-cover" />
              ) : isUserPost ? (
                authorName[0]?.toUpperCase() || 'U'
              ) : (
                <span className="text-[#ff3b30] font-black text-sm">🏁</span>
              )}
            </div>

            {/* Name & Source */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-neutral-950 uppercase tracking-tight truncate">
                  {authorName}
                </span>
                {!isUserPost && (
                  <span title="Accredited Press Wire">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#ff3b30] shrink-0" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-medium font-mono flex-wrap">
                <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-800 rounded-md font-bold uppercase">
                  {topicLabel}
                </span>

                {/* Follow / Following Topic Pill */}
                <button
                  type="button"
                  onClick={handleToggleFollowTopic}
                  className={`px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px] transition flex items-center gap-1 shadow-2xs ${
                    isTopicFollowed
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                      : 'bg-red-50 text-[#ff3b30] hover:bg-red-100 hover:text-[#bd2925] border border-red-200/60'
                  }`}
                  title={isTopicFollowed ? `Unfollow ${topicLabel}` : `Follow ${topicLabel}`}
                >
                  {isTopicFollowed ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-2.5 h-2.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <span>•</span>
                <span>{formattedTime}</span>

                {/* Seen / Unseen Status Badge */}
                {!isSeen && (
                  <span className="px-1.5 py-0.2 bg-[#ff3b30] text-white rounded text-[8px] font-black uppercase tracking-wider animate-pulse">
                    New
                  </span>
                )}
                {isRead && (
                  <span className="text-[9px] text-neutral-400 font-bold uppercase flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5 text-emerald-500" /> Read
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Menu (Admin Controls, Share + Report) */}
          <div className="flex items-center gap-1">
            {/* Super Admin / Author Edit & Hide Controls */}
            {canModerate && (
              <>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition"
                  title="Edit Post"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggleHide}
                  className={`p-1.5 rounded-xl transition ${
                    isHidden
                      ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                      : 'text-neutral-500 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                  title={isHidden ? 'Restore to Public' : 'Hide from Public (Admin Edit)'}
                >
                  {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </>
            )}

            <button
              onClick={handleShare}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-xl transition hover:bg-neutral-100"
              title="Share Post"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setReportTarget({
                  type: 'post',
                  id: articleId,
                  title: article.title || article.summary || 'Paddock Post',
                  author: authorName,
                });
                setReportModalOpen(true);
              }}
              className="p-1.5 text-neutral-300 hover:text-[#ff3b30] hover:bg-red-50 rounded-xl transition"
              title="Report Post or Photo"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Main Content & Headlines */}
        <div className="px-4 pb-3 space-y-2">
          {article.title && (
            <Link
              href={`/news/${article.slug || article.id}`}
              onClick={() => onRead?.(article.slug || article.id)}
              className="block font-black text-sm uppercase text-neutral-950 hover:text-[#ff3b30] transition leading-snug tracking-tight"
            >
              {article.title}
            </Link>
          )}

          {/* Lead summary or post text */}
          <p className="text-xs text-neutral-700 leading-relaxed">
            {article.summary || article.content?.slice(0, 240)}
          </p>

          {/* Rich Link / Entity Preview (Vehicles, Drivers, Events, YouTube, etc.) */}
          <RichLinkPreview text={`${article.title || ''} ${article.summary || ''} ${article.content || ''}`} />

          {/* Inline Expandable Full 3-Tier Story */}
          {article.content && article.content.length > 250 && (
            <div className="pt-1">
              {!isExpanded ? (
                <button
                  onClick={() => {
                    setIsExpanded(true);
                    onRead?.(article.slug || article.id);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-[#ff3b30] hover:text-[#bd2925] tracking-wider ml-1 hover:underline cursor-pointer"
                >
                  <span>Read Full Story</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="mt-3 pt-3 border-t border-neutral-100 space-y-3 animate-in fade-in duration-200">
                  <div className="prose prose-xs max-w-none text-neutral-800 space-y-3 text-xs leading-relaxed">
                    {cleanStoryText(article.content).split('\n\n').map((paragraph, idx) => {
                      const cleanP = paragraph.trim();
                      if (!cleanP) return null;
                      if (cleanP.startsWith('###')) {
                        return (
                          <h4 key={idx} className="font-black uppercase text-xs text-neutral-950 pt-2 border-b border-neutral-100 pb-1">
                            {cleanP.replace(/###/g, '').trim()}
                          </h4>
                        );
                      }
                      if (cleanP.startsWith('>') || cleanP.startsWith('"')) {
                        return (
                          <blockquote key={idx} className="border-l-2 border-[#ff3b30] pl-3 italic text-neutral-900 bg-neutral-50 py-1.5 rounded-r-md">
                            {cleanP.replace(/^>\s*/, '')}
                          </blockquote>
                        );
                      }
                      return <p key={idx}>{cleanP}</p>;
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[10px] font-bold text-neutral-500">
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="text-[#ff3b30] hover:underline flex items-center gap-1 uppercase tracking-wider"
                    >
                      <span>Collapse</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      href={`/news/${article.slug || article.id}`}
                      onClick={() => onRead?.(article.slug || article.id)}
                      className="hover:text-neutral-900 flex items-center gap-1 uppercase"
                    >
                      <span>Dedicated Reader</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Media Image Attachment */}
        {coverImage && (
          <div className="relative aspect-16/9 bg-neutral-900 overflow-hidden group/media">
            <img
              src={coverImage}
              alt={article.title || 'Paddock Photo'}
              className="w-full h-full object-cover hover:scale-101 transition duration-300"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Quick Report Photo Overlay button */}
            <button
              onClick={() => {
                setReportTarget({
                  type: 'photo',
                  id: articleId,
                  title: `Photo on ${article.title || 'Post'}`,
                  author: authorName,
                });
                setReportModalOpen(true);
              }}
              className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg text-[10px] font-bold opacity-0 group-hover/media:opacity-100 transition shadow-xs flex items-center gap-1 backdrop-blur-xs"
              title="Report Inappropriate Photo"
            >
              <Flag className="w-3 h-3 text-[#ff3b30]" />
              <span>Report Photo</span>
            </button>
          </div>
        )}

        {/* 4. Social Engagement Action Bar */}
        <div className="px-4 py-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600 bg-neutral-50/50">
          {/* Like / Respect */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 font-bold transition px-2.5 py-1 rounded-xl ${
              hasLiked ? 'text-[#ff3b30] bg-red-50' : 'hover:bg-neutral-100 text-neutral-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
            <span>{likesCount > 0 ? likesCount : 'Respect'}</span>
          </button>

          {/* Comment / Discuss */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 font-bold transition px-2.5 py-1 rounded-xl ${
              showComments ? 'text-neutral-950 bg-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{comments.length || article.comments_count || 'Discuss'}</span>
          </button>

          {/* Bookmark / Save (Clean toggleable on/off) */}
          <button
            onClick={handleToggleSave}
            className={`flex items-center gap-1.5 font-bold transition px-2.5 py-1 rounded-xl ${
              hasSaved ? 'text-[#ff3b30] bg-red-50' : 'hover:bg-neutral-100 text-neutral-700'
            }`}
            title={hasSaved ? 'Remove from Saved' : 'Save Story'}
          >
            <Bookmark className={`w-4 h-4 ${hasSaved ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{hasSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 font-bold hover:bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-xl transition"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* 5. Expandable Inline Comment Drawer */}
        {showComments && (
          <div className="p-4 bg-neutral-50/80 border-t border-neutral-100 space-y-3 animate-in fade-in duration-200">
            {/* Comment Composer */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={user ? "Add to the paddock discussion..." : "Sign in to join the debate..."}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                disabled={!user || isPostingComment}
                className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#ff3b30]"
              />
              <button
                type="submit"
                disabled={!user || !newCommentText.trim() || isPostingComment}
                className="p-2 bg-[#ff3b30] hover:bg-[#bd2925] disabled:opacity-40 text-white rounded-xl transition shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Comments List with inline Report comment button */}
            {comments.length > 0 ? (
              <div className="space-y-2 pt-1">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-neutral-200/60 shadow-2xs group/comment">
                    <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 overflow-hidden">
                      {c.author_photo ? (
                        <img src={c.author_photo} alt={c.author_name} className="w-full h-full object-cover" />
                      ) : (
                        c.author_name[0]?.toUpperCase() || 'M'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-black text-neutral-900">{c.author_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 font-mono">
                            {c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          <button
                            onClick={() => {
                              setReportTarget({
                                type: 'comment',
                                id: c.id,
                                title: c.text,
                                author: c.author_name,
                              });
                              setReportModalOpen(true);
                            }}
                            className="opacity-0 group-hover/comment:opacity-100 text-neutral-300 hover:text-[#ff3b30] transition p-0.5"
                            title="Report Comment"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-700 mt-0.5 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 text-center py-2 italic font-medium">
                No comments yet. Start the paddock debate!
              </p>
            )}
          </div>
        )}
      </article>
    </>
  );
}
