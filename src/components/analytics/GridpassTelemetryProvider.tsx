'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, addDoc } from 'firebase/firestore';

interface GridpassTelemetryProviderProps {
  children: React.ReactNode;
}

export function GridpassTelemetryProvider({ children }: GridpassTelemetryProviderProps) {
  const pathname = usePathname();
  const clickHistoryRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const loggedScrollDepthsRef = useRef<Set<number>>(new Set());
  const sessionIdRef = useRef<string>('');

  // Generate or retrieve persistent session ID for the tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    }
  }, []);

  // Helper to check if current environment is localhost or dev mode
  const checkIsLocalhost = () => {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.') ||
      (window as any).__PLAYWRIGHT_MOCK__ === true
    );
  };

  // 1. Automatic Page View & Live Active Session Telemetry
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isLocalhost = checkIsLocalhost();

    // Reset scroll depths on route change
    loggedScrollDepthsRef.current.clear();

    const width = window.innerWidth;
    const height = window.innerHeight;

    let deviceCategory: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (width < 640) deviceCategory = 'mobile';
    else if (width < 1024) deviceCategory = 'tablet';

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const referrer = document.referrer || 'direct';

    const pageViewData = {
      category: 'USER',
      action: 'PAGE_VIEW',
      actor: isLocalhost ? 'Localhost Developer / Admin' : 'Visitor Member',
      actor_role: 'member',
      target_path: pathname,
      details: `Viewed route ${pathname} on ${deviceCategory} viewport (${width}x${height}).`,
      type: 'page_view',
      session_id: sessionIdRef.current,
      path: pathname,
      viewport_width: width,
      viewport_height: height,
      device_category: deviceCategory,
      timezone,
      referrer,
      user_agent: navigator.userAgent.slice(0, 100),
      is_localhost: isLocalhost,
      environment: isLocalhost ? 'development' : 'production',
      timestamp: new Date().toISOString(),
    };

    addDoc(collection(db, 'system_logs'), pageViewData).catch((err) => {
      console.warn('Telemetry page view write fallback:', err);
    });
  }, [pathname]);

  // 2. Click Stream & Clarity Rage Click Tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClick = (e: MouseEvent) => {
      const isLocalhost = checkIsLocalhost();
      if (isLocalhost && !(window as any).__ENABLE_LOCAL_TELEMETRY__) return;

      const now = Date.now();
      const click = { x: e.clientX, y: e.clientY, time: now };

      const target = e.target as HTMLElement | null;
      const targetTag = target ? target.tagName.toLowerCase() : 'unknown';
      const targetText = target ? (target.innerText || target.getAttribute('aria-label') || '').slice(0, 40) : '';

      // Log Individual Click Stream Event
      const clickStreamData = {
        type: 'ux_click',
        session_id: sessionIdRef.current,
        path: window.location.pathname,
        x: e.clientX,
        y: e.clientY,
        target_tag: targetTag,
        target_text: targetText,
        viewport_width: window.innerWidth,
        is_localhost: isLocalhost,
        timestamp: new Date().toISOString(),
      };

      addDoc(collection(db, 'system_logs'), clickStreamData).catch(() => {});

      // Rage Click Detection (3+ clicks within 50px in 1s)
      const recentClicks = clickHistoryRef.current.filter((c) => now - c.time < 1000);
      recentClicks.push(click);
      clickHistoryRef.current = recentClicks;

      if (recentClicks.length >= 3) {
        const first = recentClicks[0];
        const distance = Math.hypot(e.clientX - first.x, e.clientY - first.y);

        if (distance < 50) {
          const rageClickData = {
            type: 'ux_rage_click',
            session_id: sessionIdRef.current,
            path: window.location.pathname,
            x: e.clientX,
            y: e.clientY,
            target_text: targetText,
            viewport_width: window.innerWidth,
            is_localhost: isLocalhost,
            timestamp: new Date().toISOString(),
          };

          addDoc(collection(db, 'system_logs'), rageClickData).catch(() => {});
          clickHistoryRef.current = [];
        }
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // 3. Scroll Depth Percentage Tracker (25%, 50%, 75%, 100%)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const isLocalhost = checkIsLocalhost();
      if (isLocalhost && !(window as any).__ENABLE_LOCAL_TELEMETRY__) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight <= 0) return;

      const percent = Math.round((scrollTop / scrollHeight) * 100);

      // Check milestones
      [25, 50, 75, 100].forEach((milestone) => {
        if (percent >= milestone && !loggedScrollDepthsRef.current.has(milestone)) {
          loggedScrollDepthsRef.current.add(milestone);

          const scrollData = {
            type: 'ux_scroll',
            session_id: sessionIdRef.current,
            path: window.location.pathname,
            scroll_depth_percent: milestone,
            is_localhost: isLocalhost,
            timestamp: new Date().toISOString(),
          };

          addDoc(collection(db, 'system_logs'), scrollData).catch(() => {});
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  return <>{children}</>;
}
