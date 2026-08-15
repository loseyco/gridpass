'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, Zap } from 'lucide-react';

export default function PWAForceUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  // Auto-reload and purge stale cache when old JS chunk loading fails (Unexpected token '<')
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || '';
      const isChunkError = msg.includes("Unexpected token '<'") || msg.includes("Loading chunk") || msg.includes("SyntaxError");
      if (isChunkError) {
        const lastAutoReload = sessionStorage.getItem('gp_chunk_auto_reload');
        const now = Date.now();
        if (!lastAutoReload || (now - parseInt(lastAutoReload, 10) > 10000)) {
          sessionStorage.setItem('gp_chunk_auto_reload', now.toString());
          if (typeof window !== 'undefined' && 'caches' in window) {
            caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
          }
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  // Check remote version against local stored build ID
  const checkForAppUpdate = async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
        return; // Skip if response is HTML fallback
      }

      const data = await res.json();
      const currentBuildId = data.build_id;
      if (!currentBuildId) return;
      const storedBuildId = typeof window !== 'undefined' ? localStorage.getItem('gp_app_build_id') : null;

      if (!storedBuildId) {
        // First install/run - store current build ID
        localStorage.setItem('gp_app_build_id', currentBuildId);
      } else if (storedBuildId !== currentBuildId) {
        // Build ID changed! Production deploy detected!
        setNewVersion(data.version || 'v4.9.9');
        setUpdateAvailable(true);

        // Clear Service Worker Caches
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }

        // Update stored build ID
        localStorage.setItem('gp_app_build_id', currentBuildId);
      }
    } catch {
      // Silently ignore version check failures on offline or non-JSON responses
    }
  };

  const handleForceReload = () => {
    setReloading(true);
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        window.caches.keys().then((keys) => {
          return Promise.all(keys.map((k) => window.caches.delete(k)));
        }).finally(() => {
          globalThis.location.reload();
        });
      } else {
        globalThis.location.reload();
      }
    } catch {
      globalThis.location.reload();
    }
  };

  useEffect(() => {
    // 1. Register Service Worker with skipWaiting
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      }).catch((err) => console.warn('ServiceWorker registration skipped:', err));
    }

    // 2. Initial Version Check
    checkForAppUpdate();

    // 3. iPhone PWA Wakeup / Focus Event Listeners
    const handleFocusOrWakeup = () => {
      checkForAppUpdate();
    };

    window.addEventListener('focus', handleFocusOrWakeup);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocusOrWakeup();
      }
    });
    window.addEventListener('pageshow', handleFocusOrWakeup);

    // 4. Polling interval (every 60s)
    const interval = setInterval(checkForAppUpdate, 60000);

    return () => {
      window.removeEventListener('focus', handleFocusOrWakeup);
      window.removeEventListener('pageshow', handleFocusOrWakeup);
      clearInterval(interval);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] animate-in slide-in-from-top-4 duration-200">
      <div className="bg-neutral-900/95 backdrop-blur-md text-white border-2 border-[#ff3b30] p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ff3b30] text-white flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 animate-spin duration-1000" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
              <span>🚀 App Update Ready</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white/20 rounded-md text-amber-300">
                {newVersion || 'New'}
              </span>
            </h4>
            <p className="text-[10px] font-mono text-neutral-300 leading-tight">
              Tap to pull latest live updates
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleForceReload}
          disabled={reloading}
          className="min-h-[40px] px-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
          {reloading ? 'Updating...' : 'Reload App'}
        </button>
      </div>
    </div>
  );
}
