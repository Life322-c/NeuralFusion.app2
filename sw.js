const CACHE_NAME = 'neuralfusion-v5';

// Core assets to precache on install — includes app.js so it's always ready
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
];

// CDN assets — cache aggressively (they're versioned/immutable)
const CDN_CACHE = 'neuralfusion-cdn-v5';
const CDN_ORIGINS = [
  'cdn.jsdelivr.net',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'api.fontshare.com',
];

// Install — precache all core assets atomically
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — delete ALL old caches, claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== CDN_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never intercept blog pages
  if (url.pathname.startsWith('/blog')) return;

  // Never intercept HTML navigation — always go to network for fresh HTML
  if (event.request.mode === 'navigate') return;

  // CDN assets: cache-first (versioned, safe to cache indefinitely)
  if (CDN_ORIGINS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CDN_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Own-origin assets: cache-first with background revalidation
  // Returns cached version INSTANTLY, fetches fresh copy in background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          // Always revalidate in background regardless of cache hit
          const networkFetch = fetch(event.request).then(response => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => null);

          // Return cache immediately if available, else wait for network
          return cached ?? networkFetch;
        })
      )
    );
  }
});
