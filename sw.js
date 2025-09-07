/* Simple cache-first service worker for offline use */
const VERSION = 'v1';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './db/dexie.js',
  './db/repo.js',
  './util/format.js',
  './util/id.js',
  './views/createMeet.js',
  './views/editActivities.js',
  './views/liveSession.js',
  './views/timeline.js',
  './views/summary.js',
  './views/dashboard.js',
  './logic/logic.js',
  './AICommunications.txt',
  'https://cdn.jsdelivr.net/npm/dexie@4/+esm',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k === VERSION ? null : caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Only handle GET
  if (request.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const res = await fetch(request);
      if (res && (res.status === 200 || res.type === 'opaqueredirect' || res.type === 'basic')) {
        cache.put(request, res.clone()).catch(()=>{});
      }
      return res;
    } catch (err) {
      // Fallback to cache for navigation requests
      if (request.mode === 'navigate') {
        return cache.match('./index.html');
      }
      throw err;
    }
  })());
});
