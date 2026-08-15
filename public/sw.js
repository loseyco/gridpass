// Gridpass PWA Service Worker with Auto-Update & Cache Busting
const CACHE_NAME = 'gridpass-v4.9.5';

self.addEventListener('install', (event) => {
  // Force active service worker to take control immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js' || url.pathname === '/manifest.json') {
    return;
  }
});
