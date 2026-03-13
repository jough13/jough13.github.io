const CACHE_NAME = 'rad-tools-v1';

const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './state.js',
  './utils.js',
  './constants.js',
  './radionuclide-data.js',
  './components-ui.js',
  './marssim.js',
  './calculators.js',
  './views.js', 
  './apple-touch-icon.png',
  './manifest.json',
  
  // --- Core Libraries ---
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://cdn.tailwindcss.com',
  
  // --- Missing Essential CDNs ---
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 
  
  // --- Math & Charts ---
  'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install the Service Worker and Cache the Files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
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
