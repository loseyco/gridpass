import { PaddockEntityType } from '@/lib/types/news';

export interface FollowedEntity {
  slug: string;
  name: string;
  type: PaddockEntityType;
}

const STORAGE_KEY = 'gridpass_followed_entities';

export function getFollowedEntities(): FollowedEntity[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading followed entities:', e);
  }
  return [];
}

export function isEntityFollowed(slug: string): boolean {
  const list = getFollowedEntities();
  return list.some((item) => item.slug.toLowerCase() === slug.toLowerCase());
}

export function toggleFollowEntity(entity: FollowedEntity): boolean {
  if (typeof window === 'undefined') return false;
  const current = getFollowedEntities();
  const exists = current.some((item) => item.slug.toLowerCase() === entity.slug.toLowerCase());
  let updated: FollowedEntity[];
  if (exists) {
    updated = current.filter((item) => item.slug.toLowerCase() !== entity.slug.toLowerCase());
  } else {
    updated = [...current, entity];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('gridpass_follow_change', { detail: updated }));
  } catch (e) {
    console.warn('Error saving followed entities:', e);
  }
  return !exists;
}
