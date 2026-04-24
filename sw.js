const CACHE_NAME = 'mony-app-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css?v=2.0'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Network-first for API calls, cache-first for static
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-expenses') {
    event.waitUntil((async () => {
      // Try to notify any open client to run sync; otherwise open app
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (all && all.length) {
        for (const client of all) {
          client.postMessage({ type: 'sync-now' });
        }
      } else {
        try {
          await self.clients.openWindow('/');
        } catch (e) {
          console.warn('Failed to open window for sync', e);
        }
      }
    })());
  }
});

self.addEventListener('message', (e) => {
  // allow clients to ping the worker
  if (e.data && e.data.type === 'PING') {
    e.ports && e.ports[0] && e.ports[0].postMessage({ ok: true });
  }
});
