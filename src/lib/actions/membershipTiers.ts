import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface MembershipTierConfig {
  id: string;
  name: string;
  code: string;
  icon: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
  description: string;
  isSystem?: boolean;
}

export const DEFAULT_MEMBERSHIP_TIERS: MembershipTierConfig[] = [
  {
    id: 'tier-founder',
    name: 'Founder Member',
    code: 'founder',
    icon: '👑',
    borderColor: '#ff3b30',
    textColor: '#ff3b30',
    bgColor: '#fef2f2',
    description: 'Platform Founder & Executive Backer',
    isSystem: true
  },
  {
    id: 'tier-gold',
    name: 'Gold Member',
    code: 'gold',
    icon: '🏆',
    borderColor: '#d97706',
    textColor: '#b45309',
    bgColor: '#fffbeb',
    description: 'VIP Gold Passport Member',
    isSystem: true
  },
  {
    id: 'tier-pro',
    name: 'Pro Member',
    code: 'pro',
    icon: '⚡',
    borderColor: '#2563eb',
    textColor: '#1d4ed8',
    bgColor: '#eff6ff',
    description: 'Pro Builder & Team Supporter',
    isSystem: true
  },
  {
    id: 'tier-member',
    name: 'Member',
    code: 'member',
    icon: '🥈',
    borderColor: '#94a3b8',
    textColor: '#475569',
    bgColor: '#f8fafc',
    description: 'Standard Verified Passport Member',
    isSystem: true
  }
];

export async function fetchMembershipTiers(): Promise<MembershipTierConfig[]> {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('gp_membership_tiers');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }
  try {
    const docRef = doc(db, 'system_settings', 'membership_tiers');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().tiers) {
      const tiers = snap.data().tiers as MembershipTierConfig[];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('gp_membership_tiers', JSON.stringify(tiers)); } catch (e) {}
      }
      return tiers;
    }
  } catch (err) {
    // Silent fallback to system default presets when unauthenticated or live rules pending deploy
  }
  return DEFAULT_MEMBERSHIP_TIERS;
}

export async function saveMembershipTiers(tiers: MembershipTierConfig[]): Promise<boolean> {
  try {
    const docRef = doc(db, 'system_settings', 'membership_tiers');
    await setDoc(docRef, { tiers, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[MembershipTiers] Failed to save tiers:', err);
    return false;
  }
}

export function resolveMemberTierConfig(roleOrTier?: string, customTiers?: MembershipTierConfig[]): MembershipTierConfig {
  const tiers = customTiers && customTiers.length > 0 ? customTiers : DEFAULT_MEMBERSHIP_TIERS;
  const key = (roleOrTier || '').toLowerCase();

  if (key.includes('founder')) {
    return tiers.find(t => t.code === 'founder') || DEFAULT_MEMBERSHIP_TIERS[0];
  }
  if (key.includes('gold')) {
    return tiers.find(t => t.code === 'gold') || DEFAULT_MEMBERSHIP_TIERS[1];
  }
  if (key.includes('pro')) {
    return tiers.find(t => t.code === 'pro') || DEFAULT_MEMBERSHIP_TIERS[2];
  }

  return tiers.find(t => t.code === 'member') || DEFAULT_MEMBERSHIP_TIERS[3];
}
