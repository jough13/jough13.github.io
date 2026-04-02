const CACHE_NAME = 'rad-tracker-v1';
const ASSETS = [
  'index.html',
  'css/style.css',
  'js/app.js',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
