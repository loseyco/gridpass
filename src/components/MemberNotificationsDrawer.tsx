'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { UserNotification, NotificationTab } from '@/lib/types/notifications';
import { getFollowedEntities } from '@/lib/utils/paddockFollow';
import {
  Bell,
  X,
  CheckCheck,
  Flame,
  MessageSquare,
  Trophy,
  Zap,
  ArrowRight,
  ThumbsUp,
  Car,
  MapPin,
  Clock,
  Radio,
} from 'lucide-react';

const TABS: NotificationTab[] = [
  { id: 'all', label: 'All', icon: '⚡' },
  { id: 'news', label: 'News Digest', icon: '📰' },
  { id: 'comments', label: 'Replies & Likes', icon: '💬' },
  { id: 'events', label: 'Vehicles & Votes', icon: '🏆' },
];

export default function MemberNotificationsDrawer() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'comments' | 'events'>('all');
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadNewsCount, setUnreadNewsCount] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Listen for followed topics and calculate unread wire stories
  useEffect(() => {
    const followed = getFollowedEntities();
    if (followed.length === 0) return;

    const unsub = onSnapshot(collection(db, 'news_articles'), (snap) => {
      let readHistory: Record<string, string> = {};
      try {
        const stored = localStorage.getItem('gridpass_news_read_history');
        if (stored) readHistory = JSON.parse(stored);
      } catch {}

      let unread = 0;
      snap.forEach((d) => {
        const art = d.data();
        if (art.is_public !== false && !readHistory[art.slug || d.id]) {
          const matchesFollowed = followed.some((f) => {
            const nameMatch = f.name.toLowerCase();
            const slugMatch = f.slug.toLowerCase();
            return (
              art.entities?.some((e: any) => e.slug?.toLowerCase() === slugMatch) ||
              art.title?.toLowerCase().includes(nameMatch)
            );
          });
          if (matchesFollowed) unread++;
        }
      });

      setUnreadNewsCount(unread);
    });

    return () => unsub();
  }, []);

  // 2. Real-time Firestore listener for user-specific notifications (if logged in)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'user_notifications'),
      where('user_id', '==', user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: UserNotification[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        setNotifications(list);
      },
      (err) => {
        console.warn('Notifications listener:', err);
      }
    );

    return () => unsub();
  }, [user]);

  // 3. Combined notifications (Firestore alerts + Dynamic News Digest)
  const allNotifications = useMemo(() => {
    const list = [...notifications];

    // If there are unread stories in followed topics, inject the live News Digest banner at the top
    if (unreadNewsCount > 0) {
      const followed = getFollowedEntities();
      const names = followed.slice(0, 2).map((f) => f.name).join(', ');

      list.unshift({
        id: 'dynamic_news_digest',
        type: 'news_digest',
        title: `${unreadNewsCount} New Stories In Followed Topics`,
        message: `Fresh paddock dispatches published for ${names}${followed.length > 2 ? ` +${followed.length - 2} more` : ''}.`,
        link_url: '/news',
        read: false,
        count: unreadNewsCount,
        created_at: new Date().toISOString(),
      });
    }

    return list;
  }, [notifications, unreadNewsCount]);

  // Unread Count
  const totalUnread = useMemo(() => {
    return allNotifications.filter((n) => !n.read).length;
  }, [allNotifications]);

  // Filtered List based on Active Tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return allNotifications;
    if (activeTab === 'news') return allNotifications.filter((n) => n.type === 'news_digest');
    if (activeTab === 'comments') return allNotifications.filter((n) => n.type === 'comment_reply' || n.type === 'comment_like');
    if (activeTab === 'events') return allNotifications.filter((n) => n.type === 'vehicle_vote' || n.type === 'event_pass' || n.type === 'trackside_attendance');
    return allNotifications;
  }, [allNotifications, activeTab]);

  // Mark single notification as read and navigate
  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.read && notif.id !== 'dynamic_news_digest' && user) {
      try {
        await updateDoc(doc(db, 'user_notifications', notif.id), {
          read: true,
        });
      } catch {}
    }

    setIsOpen(false);
    if (notif.link_url) {
      router.push(notif.link_url);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      const unreadDocs = notifications.filter((n) => !n.read);
      const batch = writeBatch(db);
      unreadDocs.forEach((n) => {
        batch.update(doc(db, 'user_notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.warn('Mark all read error:', err);
    }
  };

  const getNotificationIcon = (type: UserNotification['type']) => {
    switch (type) {
      case 'news_digest':
        return <Radio className="w-4 h-4 text-[#ff3b30]" />;
      case 'comment_reply':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'comment_like':
        return <ThumbsUp className="w-4 h-4 text-emerald-500" />;
      case 'vehicle_vote':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'trackside_attendance':
        return <MapPin className="w-4 h-4 text-red-500" />;
      default:
        return <Zap className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <>
      {/* 🔔 Universal Bell Trigger with Live Unread Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative min-h-[44px] min-w-[44px] p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition flex items-center justify-center cursor-pointer"
        aria-label="Member Notifications & Digest"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#ff3b30] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* 📋 Slide-Over Notifications Drawer Portaled to Document Body */}
      {mounted && isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex justify-end">
              <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-neutral-200 animate-in slide-in-from-right duration-200">
                
                {/* Header */}
                <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                      <Bell className="w-4 h-4 text-[#ff3b30]" />
                    </div>
                    <div>
                      <h2 className="font-black text-sm uppercase text-neutral-900 flex items-center gap-2">
                        <span>Notifications &amp; Digest</span>
                        {totalUnread > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-[#ff3b30] text-[10px] rounded-full font-mono font-black">
                            {totalUnread} NEW
                          </span>
                        )}
                      </h2>
                      <p className="text-[11px] text-neutral-500">Your live paddock activity &amp; news digests</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {totalUnread > 0 && user && (
                      <button
                        onClick={handleMarkAllRead}
                        className="min-h-[44px] px-2.5 py-1 text-[11px] font-bold text-neutral-600 hover:text-neutral-900 rounded-lg flex items-center gap-1 cursor-pointer transition"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Read All</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="min-h-[44px] min-w-[44px] p-2 text-neutral-400 hover:text-neutral-900 rounded-xl flex items-center justify-center cursor-pointer transition"
                      aria-label="Close notifications"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-4 py-2 border-b border-neutral-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        activeTab === tab.id
                          ? 'bg-neutral-900 text-white font-black'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.id === 'news' && unreadNewsCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[#ff3b30] animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Notifications List Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {filteredNotifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-2xl text-neutral-400">
                        🏁
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase text-neutral-800">All Caught Up!</p>
                        <p className="text-xs text-neutral-500 max-w-xs">
                          No new unread alerts. You will receive notifications when articles publish in your followed topics, someone replies to your comments, or your vehicles receive event votes.
                        </p>
                      </div>
                      <Link
                        href="/news"
                        onClick={() => setIsOpen(false)}
                        className="min-h-[44px] px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase transition hover:bg-neutral-800"
                      >
                        Browse All News ➔
                      </Link>
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                          notif.read
                            ? 'bg-white border-neutral-200 hover:border-neutral-300'
                            : 'bg-red-50/40 border-red-200/80 hover:border-red-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white border border-neutral-200 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                            {getNotificationIcon(notif.type)}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-xs uppercase tracking-tight leading-snug truncate ${notif.read ? 'font-bold text-neutral-800' : 'font-black text-neutral-900'}`}>
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-[#ff3b30] shrink-0" />
                              )}
                            </div>

                            <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                              {notif.message}
                            </p>

                            <div className="flex items-center gap-2 pt-1 text-[10px] text-neutral-400 font-mono">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              <span>
                                {notif.created_at
                                  ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'Live'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#ff3b30] group-hover:translate-x-0.5 transition shrink-0 mt-2" />
                      </div>
                    ))
                  )}
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
                  <Link
                    href="/news"
                    onClick={() => setIsOpen(false)}
                    className="font-bold text-neutral-700 hover:text-[#ff3b30] flex items-center gap-1 transition"
                  >
                    <span>Followed Topics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <span className="text-[10px] font-mono text-neutral-400">
                    Gridpass News &amp; Updates
                  </span>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
