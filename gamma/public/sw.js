const CACHE_NAME = 'rad-tracker-v5'; // App Shell Cache
const DOC_CACHE = 'rad-documents-v1'; // Dedicated Offline Vault for PDFs/Images

const ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/auth.js',
  'js/data.js',
  'js/ui.js',
  'js/analytics.js',
  'js/firebase-config.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DOC_CACHE).map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
  // 1. THE VAULT INTERCEPTOR: Handle Firebase Storage Files
  if (e.request.url.includes('firebasestorage.googleapis.com')) {
      e.respondWith(
          caches.open(DOC_CACHE).then(async (cache) => {
              const cachedResponse = await cache.match(e.request);
              if (cachedResponse) {
                  return cachedResponse; // Instantly return from the offline vault
              }
              // If not in vault, fetch from internet and save a copy for later
              try {
                  const networkResponse = await fetch(e.request);
                  cache.put(e.request, networkResponse.clone());
                  return networkResponse;
              } catch (err) {
                  console.warn("Document not available offline.");
                  return new Response("Offline: Document not synced to vault.", { status: 503 });
              }
          })
      );
      return; 
  }

  // 2. STANDARD APP LOGIC: Network-First for live database data and HTML/JS
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
