//==============================================================================
// --- Progressive Web App Service Worker Engine
//==============================================================================

const CACHE_NAME = 'rad-tools-v0.9.6'; // Bump this version!

const urlsToCache = [
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
  
  // --- Localized Core Styles (True Offline Independence) ---
  './js/tailwindcss.js', // Tracks your local tailwindcss.js asset
  
  // --- Remote Core Libraries (Version-Pinned) ---
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.23.9/babel.min.js',
  
  // --- Math & Charts ---
  'https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.2/math.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.js',
  
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

// Install Phase: Open cache layer and inject the static files baseline
self.addEventListener('install', event => {
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Ingesting static assets to cache storage...');
        
        // Map URLs to Request objects that strictly bypass the HTTP cache
        const noCacheRequests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(noCacheRequests);
      })
      .catch(err => {
        console.error('Service Worker: Fatal caching crash during install sequence!', err);
      })
  );
});

// Activate Phase: Clean out old legacy cache variations to preserve local disk space
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Purging deprecated legacy cache wrapper:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Phase: Stale-While-Revalidate for local assets, Cache-First for CDNs
self.addEventListener('fetch', event => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // External CDNs (React, Tailwind, Leaflet): Cache-First Strategy
  // These rarely change and save significant bandwidth
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }).catch(err => {
          console.warn(`Service Worker: Network fetch failed for CDN ${url.href}`, err);
        });
      })
    );
    return;
  }

  // Local Assets (HTML, JS, CSS): Stale-While-Revalidate Strategy
  // Returns cached version immediately for speed, but updates cache in background
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(err => {
         console.warn(`Service Worker: Offline, using cached version for ${event.request.url}`);
      });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
