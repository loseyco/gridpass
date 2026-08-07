import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export async function syncAndLinkUserAccount(authUser: User) {
  if (!authUser || !authUser.uid) return;

  try {
    const userRef = doc(db, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);

    const isSuperAdmin = authUser.email === 'loseyp@gmail.com';
    const email = authUser.email || '';
    const displayName = authUser.displayName || email.split('@')[0] || 'DRIVER';

    const userData = {
      uid: authUser.uid,
      email: email,
      display_name: displayName,
      displayName: displayName,
      role: isSuperAdmin ? 'admin' : (userSnap.exists() && userSnap.data().role) || 'member',
      is_gold: isSuperAdmin ? true : (userSnap.exists() && userSnap.data().is_gold) || false,
      is_supporter: isSuperAdmin ? true : (userSnap.exists() && userSnap.data().is_supporter) || false,
      photoUrl: authUser.photoURL || (userSnap.exists() && userSnap.data().photoUrl) || '',
      updated_at: new Date().toISOString(),
    };

    await setDoc(userRef, userData, { merge: true });

    // Re-link vehicles matching user's email if owned under an orphaned UID
    if (email) {
      const vQuery = query(collection(db, 'vehicles'), where('owner_email', '==', email));
      const vSnap = await getDocs(vQuery);

      for (const vDoc of vSnap.docs) {
        if (vDoc.data().owner_id !== authUser.uid) {
          await updateDoc(doc(db, 'vehicles', vDoc.id), {
            owner_id: authUser.uid,
            owner_uid: authUser.uid,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Sync and link account error:', err);
  }
}
