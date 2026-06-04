import { db, auth } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type LogLevel = 'info' | 'warn' | 'error' | 'success';
export type LogCategory = 'auth' | 'scan' | 'payment' | 'system' | 'feedback';

interface LogPayload {
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string | null;
  userEmail?: string | null;
  metadata?: Record<string, unknown>;
  timestamp: string | object;
}

/**
 * Centrally log an application event directly to Firestore
 */
export async function logEvent(
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  
  // Dynamic attribution
  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    if (auth && auth.currentUser) {
      userId = auth.currentUser.uid;
      userEmail = auth.currentUser.email;
    }
  } catch (e) {
    // Auth might not be fully initialized or we are on server
  }

  // Construct structured payload
  const payload: LogPayload = {
    level,
    category,
    message,
    userId,
    userEmail,
    metadata: {
      ...metadata,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
    },
    timestamp: typeof window !== 'undefined' ? serverTimestamp() : timestamp
  };

  // Local console fallback for easy local debugging
  const logStyle = {
    info: '\x1b[36m%s\x1b[0m',     // Cyan
    warn: '\x1b[33m%s\x1b[0m',     // Yellow
    error: '\x1b[31m%s\x1b[0m',    // Red
    success: '\x1b[32m%s\x1b[0m',  // Green
  }[level];
  console.log(logStyle, `[${category.toUpperCase()}] ${message}`, payload.metadata || '');

  // Persist to Firestore (only runs on Client where db is initialized; can be expanded to dynamic server fetch if needed)
  if (typeof window !== 'undefined' && db) {
    try {
      const logsRef = collection(db, 'system_logs');
      await addDoc(logsRef, payload);
    } catch (err) {
      console.error('[Logger] Failed to persist log in Firestore:', err);
    }
  }
}
