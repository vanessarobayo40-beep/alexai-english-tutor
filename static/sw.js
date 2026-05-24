/* ThiagoEnglish Service Worker — v3 */
const CACHE = 'thiagoenglish-v3';
const ASSETS = [
  '/',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/manifest.json',
  '/static/icon-192.png',
  '/static/icon-512.png',
  '/static/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  // Never cache API calls
  if (request.url.includes('/api/')) return;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isMainAsset = url.pathname === '/' ||
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/style.css');

  if (isMainAsset) {
    // Network-first for main assets: always try to get fresh code
    e.respondWith(
      fetch(request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(request, copy));
        }
        return res;
      }).catch(() => caches.match(request))
    );
  } else {
    // Cache-first for images and other static assets
    e.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            caches.open(CACHE).then(c => c.put(request, res.clone()));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
