const CACHE_NAME = 'cryptic-quest-v4-2-0-mission-expansion-20260815';
const APP_SHELL = [
  './',
  './index.html',
  './index.html?v=4.2.0-expansion',
  './styles.css?v=4.2.0-expansion',
  './js/app.js?v=4.2.0-expansion',
  './js/content.js',
  './js/crypto-utils.js',
  './js/question-engine.js',
  './js/learning-engine.js',
  './js/interactive-missions.js',
  './js/mission-experience.js',
  './js/mission-experience-advanced.js',
  './content/questions-v3.2.json',
  './manifest.webmanifest?v=4.2.0-expansion',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => (await caches.match(event.request)) || (await caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: false }).then(cached => {
      const network = fetch(event.request)
        .then(response => {
          if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
