// UrbanIQ Service Worker
const CACHE = "tgg-v3";
const ASSETS = ["/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Never cache the HTML shell — always fetch fresh so JS bundle references stay current
  const url = new URL(e.request.url);
  if (url.pathname === "/" || url.pathname.endsWith(".html")) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // For hashed JS/CSS assets: network-first, then cache
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
