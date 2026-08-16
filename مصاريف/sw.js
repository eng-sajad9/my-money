const CACHE_NAME = 'mony-app-v4.1';
const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'style.css?v=4.0',
  'ai-assistant.js?v=4.0',
  'sync-system.js?v=4.0',
  'manifest.json',
  'photo_2026-03-03_11-01-38.jpg'
];

// التثبيت وحفظ الملفات في الكاش
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// التفعيل وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// استراتيجية الاستجابة: الشبكة أولاً مع الرجوع للكاش
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // إذا نجح الاتصال بالشبكة، قم بتحديث الكاش
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // إذا فشل الاتصال، حاول البحث في الكاش
        return caches.match(event.request).then((response) => {
          if (response) return response;
          // إذا لم يوجد في الكاش وكان الطلب لصفحة HTML، ارجع لـ index.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});

// المزامنة في الخلفية
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-expenses') {
    console.log('[Service Worker] Background Syncing...');
    event.waitUntil((async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (all && all.length) {
        for (const client of all) {
          client.postMessage({ type: 'sync-now' });
        }
      } else {
        try {
          // إذا لم تكن هناك نافذة مفتوحة، يمكن فتح التطبيق (اختياري حسب الحاجة)
          // await self.clients.openWindow('/');
        } catch (e) {
          console.warn('Failed to open window for sync', e);
        }
      }
    })());
  }
});

// استقبال الرسائل من الواجهة البرمجية
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PING') {
    event.ports && event.ports[0] && event.ports[0].postMessage({ ok: true });
  }
});
