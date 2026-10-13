// Bellarej offline helper (Phase 7).
// Keeps a copy of the game on the device so it opens and plays without internet.
// - The game page itself: always asks the internet first (so new versions arrive on the next
//   launch), and uses the saved copy when offline or when the network is too slow.
// - Font and icons: served from the saved copy (they rarely change).
// Change VERSION with every release so old copies are cleared.
const VERSION = 'bellarej-7.1.0';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './fonts/baloo-bhaijaan-2.woff',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png',
];
const PAGE_TIMEOUT_MS = 3500;   // slow network: after this long, open the saved copy instead

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(CORE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bellarej-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function pageFromNetwork(request) {
  return fetch(request, { cache: 'no-cache' }).then((response) => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put('./index.html', copy));
    }
    return response;
  });
}

function savedPage() {
  return caches.open(VERSION).then((cache) => cache.match('./index.html'));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // nothing outside the game's own address

  if (request.mode === 'navigate') {
    event.respondWith(new Promise((resolve) => {
      let settled = false;
      const useSaved = () => savedPage().then((r) => r || pageFromNetwork(request));
      const timer = setTimeout(() => {
        savedPage().then((r) => { if (r && !settled) { settled = true; resolve(r); } });
      }, PAGE_TIMEOUT_MS);
      pageFromNetwork(request)
        .then((r) => { clearTimeout(timer); if (!settled) { settled = true; resolve(r); } })
        .catch(() => { clearTimeout(timer); if (!settled) { settled = true; resolve(useSaved()); } });
    }));
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => hit || fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
