const CACHE_NAME = 'rad-tracker-v2';
const ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(err => console.log("Offline cache skipped external files:", err))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
