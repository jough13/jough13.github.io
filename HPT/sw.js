const CACHE_NAME = 'rad-tools-v2';

const urlsToCache = [
  // --- Local App Files ---
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/state.js',
  './js/utils.js',
  './js/constants.js',
  './js/radionuclide-data.js',
  './js/components-ui.js',
  './js/marssim.js',
  './js/calculators.js',
  './js/views.js',
  './apple-touch-icon.png',
  './icon-transparent.png',
  './manifest.json',
  
  // --- Core Libraries ---
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  
  // --- Math & Charts ---
  'https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.2/math.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  
  // --- Fonts & Math Typesetting ---
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js',
  
  // --- Leaflet Mapping Tools ---
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js',
  'https://unpkg.com/leaflet-geosearch@3/dist/geosearch.css',
  'https://unpkg.com/leaflet-geosearch@3/dist/geosearch.umd.js'
];

// Install the Service Worker and Cache the Files
self.addEventListener('install', event => {
  // Skip the 'waiting' lifecycle phase, to immediately activate the new service worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercept network requests and serve from the Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached version if found, otherwise fetch from the network
        return response || fetch(event.request);
      })
  );
});
