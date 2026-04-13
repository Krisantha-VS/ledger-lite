// LedgerLite Service Worker — cache-first for static, network-first for API
const CACHE = "ll-v1";

const STATIC = [
  "/",
  "/login",
  "/offline",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API calls: network-first, no offline fallback
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ success: false, error: "offline" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }))
    );
    return;
  }

  // Navigation requests: network-first, fallback to cached page or /offline
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? (await caches.match("/offline")) ?? new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      });
    })
  );
});
