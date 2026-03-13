const CACHE_NAME = 'health-tracker-v1';
const OFFLINE_URL = '/index.html'; // fallback page

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        OFFLINE_URL,
        './index.html',
        // add other static assets if needed
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Skip caching chrome-extension resources
  if (e.request.url.startsWith('chrome-extension://')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(resp => {
      return resp || fetch(e.request).then(netResp => {
        if (!netResp || netResp.status !== 200 || netResp.type !== 'basic') {
          return netResp;
        }

        const respToCache = netResp.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, respToCache);
        });

        return netResp;
      }).catch(() => {
        // Offline fallback
        if (e.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
