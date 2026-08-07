'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useToast } from '../ToastContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

export default function DailyRewardChecker() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user || checkedRef.current) return;
    checkedRef.current = true;

    async function checkDailyBonus() {
      if (!user) return;
      const currentUser = user;

      try {
        const q = query(
          collection(db, 'points_logs'),
          where('userId', '==', currentUser.uid),
          where('actionKey', '==', 'achievement_daily_login'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );

        const snap = await getDocs(q);
        const now = Date.now();
        let canClaim = true;

        if (!snap.empty) {
          const lastLog = snap.docs[0].data();
          const lastTime = lastLog.timestamp?.toDate ? lastLog.timestamp.toDate().getTime() : 0;
          const hoursDiff = (now - lastTime) / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            canClaim = false;
          }
        }

        if (canClaim) {
          const points = 10; // $0.10 USD value per daily visit
          const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'MEMBER';

          await addDoc(collection(db, 'points_logs'), {
            userId: currentUser.uid,
            userName: userName,
            userEmail: currentUser.email || '',
            actionKey: 'achievement_daily_login',
            ruleTitle: '🔥 Daily Visit Login Bonus',
            pointsAwarded: points,
            status: 'approved',
            notes: 'Daily visit login credit bonus',
            timestamp: serverTimestamp(),
          });

          // Fetch user's updated total points balance
          const allUserLogsQ = query(
            collection(db, 'points_logs'),
            where('userId', '==', currentUser.uid),
            where('status', '==', 'approved')
          );

          const allUserLogsSnap = await getDocs(allUserLogsQ);
          const totalCredits = allUserLogsSnap.docs.reduce(
            (sum, doc) => sum + (doc.data().pointsAwarded || 0),
            0
          );

          // Trigger System-Wide Toast Notification
          showToast({
            title: '🔥 Daily Visit Reward!',
            message: 'You earned 10 Grid Credits ($0.10 value) for visiting Gridpass today!',
            creditsAwarded: points,
            totalCredits: totalCredits,
            icon: '🔥',
            type: 'credit',
          });
        }
      } catch (err) {
        console.warn('Daily reward check error:', err);
      }
    }

    checkDailyBonus();
  }, [user, showToast]);

  return null;
}
