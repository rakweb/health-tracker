/* eslint-disable no-restricted-globals */
const CACHE_VERSION = 'v2026-03-11-01';
const CACHE_NAME = `ht-cache-${CACHE_VERSION}`;

// Adjust these if your structure changes
const ORIGIN = self.location.origin;
const BASE = '/health-tracker/';

const CORE_ASSETS = [
  BASE,
  `${BASE}index.html`,
  `${BASE}manifest.webmanifest`
  // Add icons if you have them:
  // `${BASE}icons/icon-192.png`,
  // `${BASE}icons/icon-512.png`,
  // `${BASE}icons/maskable-512.png`,
];

// ----- Install: pre-cache basic shell -----
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(CORE_ASSETS);
      } catch (err) {
        // If addAll fails while offline, keep going with partial cache
        console.warn('[SW] addAll failed (likely offline during first install):', err);
      }
      await self.skipWaiting();
    })()
  );
});

// ----- Activate: cleanup old caches -----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('ht-cache-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ----- Fetch strategy -----
// - Navigations (HTML): network-first, fallback to cache (offline)
// - Same-origin assets: stale-while-revalidate
// - Cross-origin assets (e.g., CDN): stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isHTMLNav =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  // HTML navigations: network-first
  if (isHTMLNav) {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, net.clone());
          return net;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request) || await cache.match(`${BASE}index.html`);
          if (cached) return cached;
          // Last resort: a tiny offline page
          return new Response('<h1>Offline</h1><p>Please check your connection.</p>', {
            headers: { 'Content-Type': 'text/html; charset=UTF-8' },
            status: 200
          });
        }
      })()
    );
    return;
  }

  // sw.js – add this check before cache.put()
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Skip caching chrome-extension resources
        if (event.request.url.startsWith('chrome-extension://')) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open('health-tracker-cache-v1').then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
  
  // Same-origin & cross-origin assets: stale-while-revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const fetchPromise = (async () => {
        try {
          const net = await fetch(request);
          // Only cache OK responses
          if (net && net.status === 200) {
            cache.put(request, net.clone());
          }
          return net;
        } catch (e) {
          // Network failed; fall back to cached if present
          if (cached) return cached;
          throw e;
        }
      })();
      // Return cached immediately if present; otherwise wait for network
      return cached || fetchPromise;
    })()
  );
});

// ----- Messages: for UI update flow -----
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'GET_VERSION') {
    event.source?.postMessage({ type: 'VERSION', cache: CACHE_NAME });
  } else if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

