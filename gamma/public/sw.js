const CACHE_NAME = 'rad-tracker-v4'; // Bumped version to force cache refresh
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
  self.skipWaiting(); // Forces the browser to immediately install the new worker
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(err => console.log("Offline cache skipped external files:", err))
  );
});

self.addEventListener('activate', (e) => {
    // Automatically delete old versions of the cache when updated
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
        })
    );
});

self.addEventListener('fetch', (e) => {
  // Network-First Strategy: Try the internet first, fall back to cache if offline
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
