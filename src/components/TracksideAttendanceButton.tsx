'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  getDoc,
} from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import { TracksideAttendance } from '@/lib/types/news';
import { MapPin, Check, UserCheck, Loader2, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface TracksideAttendanceButtonProps {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  initialAttendeesCount?: number;
}

export function TracksideAttendanceButton({
  articleId,
  articleSlug,
  articleTitle,
  initialAttendeesCount = 0,
}: TracksideAttendanceButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [attendances, setAttendances] = useState<TracksideAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [userProfile, setUserProfile] = useState<{ username?: string; avatar_url?: string; name?: string } | null>(null);

  // Fetch current user's profile info if logged in
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    async function loadUserProfile() {
      try {
        const uDoc = await getDoc(doc(db, 'users', user!.uid));
        if (uDoc.exists()) {
          const data = uDoc.data();
          setUserProfile({
            username: data.username || user!.email?.split('@')[0] || user!.uid,
            avatar_url: data.avatar_url || user!.photoURL || '',
            name: data.display_name || data.name || user!.displayName || 'Driver',
          });
        } else {
          setUserProfile({
            username: user!.email?.split('@')[0] || user!.uid,
            avatar_url: user!.photoURL || '',
            name: user!.displayName || 'Driver',
          });
        }
      } catch (err) {
        console.warn('Could not load user profile for attendance:', err);
      }
    }

    loadUserProfile();
  }, [user]);

  // Real-time listener for attendance on this article
  useEffect(() => {
    if (!articleId) return;

    const q = query(collection(db, 'user_attendance'), where('article_id', '==', articleId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: TracksideAttendance[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as TracksideAttendance);
        });
        // Sort descending by attendance check-in timestamp
        list.sort((a, b) => (b.attended_at || '').localeCompare(a.attended_at || ''));
        setAttendances(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Trackside attendance listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [articleId]);

  // Check if current user is marked as attended
  const isMarked = Boolean(user && attendances.some((a) => a.user_id === user.uid));

  const handleToggleAttendance = async () => {
    if (!user) {
      setShowGuestModal(true);
      return;
    }

    setSubmitting(true);
    const attendanceDocId = `${user.uid}_${articleId}`;
    const attendanceRef = doc(db, 'user_attendance', attendanceDocId);
    const articleRef = doc(db, 'news_articles', articleId);

    try {
      if (isMarked) {
        // Remove attendance
        await deleteDoc(attendanceRef);
        try {
          await updateDoc(articleRef, {
            attendees_count: increment(-1),
          });
        } catch {
          // Ignore article update error if missing
        }

        showToast({
          title: 'Check-in Removed',
          message: 'Your trackside attendance check-in has been cleared.',
          icon: '📍',
        });
      } else {
        // Add attendance
        const username = userProfile?.username || user.email?.split('@')[0] || user.uid;
        const displayName = userProfile?.name || user.displayName || user.email?.split('@')[0] || 'Driver';
        const avatarUrl = userProfile?.avatar_url || user.photoURL || null;

        const attendanceData: TracksideAttendance = {
          id: attendanceDocId,
          article_id: articleId,
          article_slug: articleSlug,
          article_title: articleTitle,
          user_id: user.uid,
          user_name: displayName,
          user_username: username,
          user_avatar: avatarUrl,
          attended_at: new Date().toISOString(),
        };

        await setDoc(attendanceRef, attendanceData, { merge: true });

        try {
          await updateDoc(articleRef, {
            attendees_count: increment(1),
          });
        } catch {
          // Ignore article update error if missing
        }

        showToast({
          title: '🏁 Trackside Attendance Marked!',
          message: 'Verified attendance recorded to your official Driver Passport.',
          icon: '🛡️',
        });
      }
    } catch (err) {
      console.error('Error toggling trackside attendance:', err);
      showToast({
        title: 'Action Error',
        message: 'Could not record trackside attendance. Please try again.',
        icon: '⚠️',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalCount = Math.max(attendances.length, initialAttendeesCount);

  return (
    <div className="bg-neutral-50 rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Headline & Verified Note */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff3b30] animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <span>Trackside Attendance &amp; Paddock Check-In</span>
            </h3>
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            Were you at the circuit? Verify your trackside presence on your official Driver Passport.
          </p>
        </div>

        {/* Action Button (>=44px touch target) */}
        <button
          type="button"
          onClick={handleToggleAttendance}
          disabled={submitting || loading}
          className={`min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            isMarked
              ? 'bg-neutral-900 text-white border border-neutral-800 hover:bg-neutral-800'
              : 'bg-[#ff3b30] hover:bg-[#d63025] text-white shadow-md shadow-red-500/20 active:scale-95'
          } disabled:opacity-60`}
          aria-label={isMarked ? 'Marked Trackside Attendance' : 'I Was Trackside / I Attended'}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Updating Passport...</span>
            </>
          ) : isMarked ? (
            <>
              <Check className="w-4 h-4 text-[#ff3b30]" />
              <span>✓ Marked Trackside Attendance</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 text-white" />
              <span>📍 I Was Trackside / I Attended</span>
            </>
          )}
        </button>
      </div>

      {/* Verified Attendees Facepile & Counter */}
      <div className="pt-3 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {attendances.length > 0 ? (
            <div className="flex items-center -space-x-2 overflow-hidden py-1">
              {attendances.slice(0, 7).map((att) => (
                <Link
                  key={att.id}
                  href={`/u/${att.user_username || att.user_id}`}
                  title={`${att.user_name} (@${att.user_username}) — Verified Trackside`}
                  className="relative inline-block w-8 h-8 rounded-full ring-2 ring-white overflow-hidden bg-neutral-900 hover:scale-110 hover:z-10 transition-transform shrink-0"
                >
                  {att.user_avatar ? (
                    <img
                      src={att.user_avatar}
                      alt={att.user_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white bg-neutral-800">
                      {att.user_name ? att.user_name.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs text-neutral-500">
              🏁
            </div>
          )}

          <div className="text-xs">
            <span className="font-bold text-neutral-900">
              {totalCount > 0
                ? `${totalCount} Verified Driver${totalCount === 1 ? '' : 's'} & Spectator${totalCount === 1 ? '' : 's'}`
                : 'Be the first to record trackside attendance'}
            </span>
            {attendances.length > 0 && (
              <span className="text-[10px] text-neutral-400 font-mono block">
                Logged to Driver Passport credentials
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 bg-white border border-neutral-200 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-[#ff3b30]" />
          <span>Verified GPS / Paddock Check-In</span>
        </div>
      </div>

      {/* Guest Sign-In Modal Prompt */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 space-y-5 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-14 h-14 bg-red-50 text-[#ff3b30] rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner">
              📍
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-black uppercase text-[#ff3b30] tracking-widest block">
                DRIVER PASSPORT CREDENTIAL
              </span>
              <h3 className="text-lg font-black uppercase text-neutral-900 tracking-tight">
                Record Trackside Attendance
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed max-w-xs mx-auto">
                Sign in or create your Gridpass driver account to record verified event check-ins on your official passport.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href={`/login?redirect=/news/${articleSlug}`}
                className="min-h-[44px] w-full py-3 bg-[#ff3b30] hover:bg-[#d63025] text-white text-xs font-mono font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-red-500/20"
              >
                <span>Sign In to Record Check-In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`/register?redirect=/news/${articleSlug}`}
                className="min-h-[44px] w-full py-3 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
              >
                <span>Create Free Driver Passport</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowGuestModal(false)}
                className="min-h-[44px] w-full py-2.5 text-neutral-500 hover:text-neutral-900 text-xs font-bold transition cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
