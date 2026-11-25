const CACHE_NAME = 'waghor-hub-v2.0.7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/Logo.png?v=3',
  './icons/icon-192.png?v=3',
  './icons/icon-512.png?v=3',
  './icons/apple-touch-icon.png?v=3',
  './icons/favicon.png?v=3',
  './icons/app-aqua-quest.png?v=5',
  './icons/app-daily-check.png?v=5',
  './icons/app-maintenance.png?v=2',
  './icons/app-schedule.png?v=5',
  './icons/app-best-tank.png?v=5',
  './icons/app-saraban.png?v=5',
  './icons/app-heic-jpg.png?v=1',
  './icons/app-fish-manager.png?v=1',
  'https://fonts.googleapis.com/css2?family=Anuphan:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache assets safely without failing the whole install if one remote font fails
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('SW pre-cache notice:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Network-First for HTML navigation (always get freshest content), Cache-First for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    }).catch(() => {
      // offline fallback
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
