// service-worker.js
// Minimal safe Service Worker for Health Tracker

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients
  event.waitUntil(self.clients.claim());
});

// Network-first strategy (no caching yet)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
``
