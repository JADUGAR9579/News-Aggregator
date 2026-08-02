/**
 * Service worker for the News Aggregator PWA.
 *
 * Hand-written (no vite-plugin-pwa/Workbox) to stay within the project's
 * locked tech stack. Strategy:
 *  - Precache the app shell (/, index.html) on install
 *  - Cache-first for built static assets (/assets/*) — they're
 *    content-hashed by Vite, so a cached copy is always valid
 *  - Network-first, falling back to cache, for navigation requests — lets
 *    previously visited pages open while offline (Offline Reading)
 *  - Everything else (API calls) goes straight to the network; article
 *    data isn't meaningfully "offline-able" from a free news API, and we
 *    don't want to serve stale headlines silently
 */

const CACHE_NAME = "news-aggregator-v1";
const APP_SHELL = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin requests; let cross-origin API calls pass through untouched.
  if (url.origin !== self.location.origin) return;

  // Built static assets: cache-first (content-hashed filenames are immutable).
  // includes() rather than startsWith(): under a GitHub Pages subpath base
  // (e.g. /repo-name/assets/...), the path won't start with /assets/, but
  // it will contain it.
  if (url.pathname.includes("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Navigations (page loads/route changes): network-first, cache fallback for offline reading.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
    );
  }
});
