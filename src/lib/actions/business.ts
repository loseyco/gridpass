import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BusinessProfile } from '../types/business';

/**
 * Creates or overwrites a business profile in Firestore.
 * Uses the business's custom slug ID (e.g. "nielsens") as the document ID.
 */
export async function createBusinessProfile(business: BusinessProfile): Promise<void> {
  const ref = doc(db, 'businesses', business.id);
  
  // Clean undefined keys before saving
  const cleanData: any = {};
  for (const key of Object.keys(business)) {
    if ((business as any)[key] !== undefined) {
      cleanData[key] = (business as any)[key];
    }
  }

  await setDoc(ref, cleanData);
}

/**
 * Fetches a business profile by its slug ID.
 */
export async function getBusinessProfile(id: string): Promise<BusinessProfile | null> {
  const ref = doc(db, 'businesses', id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as BusinessProfile;
  }
  return null;
}

/**
 * Queries all business profiles managed/owned by a specific user.
 */
export async function getUserManagedBusinesses(ownerUid: string): Promise<BusinessProfile[]> {
  const ref = collection(db, 'businesses');
  const q = query(ref, where('owner_uid', '==', ownerUid));
  const snap = await getDocs(q);
  const list: BusinessProfile[] = [];
  snap.forEach(docSnap => {
    list.push(docSnap.data() as BusinessProfile);
  });
  return list;
}

/**
 * Updates properties on a business profile.
 */
export async function updateBusinessProfile(id: string, updates: Partial<BusinessProfile>): Promise<void> {
  const ref = doc(db, 'businesses', id);
  
  // Clean undefined keys before saving
  const cleanUpdates: any = {};
  for (const key of Object.keys(updates)) {
    if ((updates as any)[key] !== undefined) {
      cleanUpdates[key] = (updates as any)[key];
    }
  }

  await updateDoc(ref, cleanUpdates);
}
