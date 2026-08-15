import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { UserNotification } from '../types/notifications';
import { getFollowedEntities } from './paddockFollow';

const LOCAL_NOTIFS_KEY = 'gridpass_member_notifications_v1';

export function getLocalNotifications(): UserNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalNotifications(notifs: UserNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new Event('gridpass_notifications_change'));
  } catch {}
}

export function generateLiveNewsDigest(unreadArticlesCount: number): UserNotification[] {
  const followed = getFollowedEntities();
  const notifs: UserNotification[] = [];

  if (followed.length > 0 && unreadArticlesCount > 0) {
    const followedNames = followed.slice(0, 3).map((f) => f.name).join(', ');
    notifs.push({
      id: `digest_followed_${Date.now()}`,
      type: 'news_digest',
      title: `${unreadArticlesCount} New Wire Stories`,
      message: `Fresh paddock reports published in topics you follow: ${followedNames}${followed.length > 3 ? ` +${followed.length - 3} more` : ''}.`,
      link_url: '/news?tab=my_wire',
      read: false,
      count: unreadArticlesCount,
      created_at: new Date().toISOString(),
    });
  }

  return notifs;
}
