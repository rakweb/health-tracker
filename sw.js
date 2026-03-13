// sw.js – clean & safe version

const CACHE_NAME = 'health-tracker-static-v2';
const OFFLINE_FALLBACK = '/index.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  // add other static files if you split CSS/JS later
];

// Install → cache essentials
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate → clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch – network-first + offline fallback + skip bad schemes
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache or handle chrome-extension / moz-extension resources
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Don't cache non-200 or non-basic responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone));

        return networkResponse;
      })
      .catch(() => {
        // Offline fallback – only for page navigations
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_FALLBACK);
        }
        return new Response('Offline – content not available', { status: 503 });
      })
  );
});
