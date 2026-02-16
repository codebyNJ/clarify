// Clarify PWA Service Worker
// Strategy: Network-first for everything Next.js generates,
// cache-first only for truly static assets in /public/

const CACHE_VERSION = 1;
const STATIC_CACHE = `clarify-static-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `clarify-runtime-v${CACHE_VERSION}`;

// Only precache truly static assets from /public/ — never Next.js routes
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ── Install: precache only static public assets ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ──
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !currentCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch handler ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip cross-origin (except Google Fonts which we cache)
  const isGoogleFont =
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !isGoogleFont) return;

  // Skip API calls, Firebase, auth-related — always network
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis.com") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // ── 1. Next.js build assets (/_next/) — NETWORK FIRST, short-lived cache ──
  // These paths contain hashed filenames that change per build.
  // Caching them cache-first causes 404s after redeployments.
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // ── 2. Navigation requests (HTML pages) — NETWORK FIRST ──
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline") || new Response("Offline", { status: 503 }))
        )
    );
    return;
  }

  // ── 3. Static assets from /public/ (icons, images, manifest) — CACHE FIRST ──
  // These are truly static and don't change between builds.
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── 4. Google Fonts — CACHE FIRST (they're immutable once fetched) ──
  if (isGoogleFont) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── 5. Everything else — NETWORK FIRST ──
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

// ── Strategy: Network First ──
// Try network, fall back to cache. Keeps cache fresh on success.
function networkFirst(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request));
}

// ── Strategy: Cache First ──
// Try cache, fall back to network (and cache the result).
function cacheFirst(request, cacheName) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}
