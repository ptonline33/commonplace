/* Commonplace service worker.
 *  - App shell + post JSON: precached at install so the whole journal works
 *    offline from the very first launch (no signal needed on the subway).
 *  - Navigation + same-origin assets: network-first so new posts show up,
 *    with a cache fallback when you're offline.
 *  - /api/*: network-only. Cloud posts and claps are live data and should
 *    never be served from a stale cache.
 */
const VERSION = "commonplace-v1";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "config.js",
  "manifest.webmanifest",
  "fonts/atkinson-hyperlegible-latin-400-normal.woff2",
  "fonts/atkinson-hyperlegible-latin-700-normal.woff2",
  "fonts/literata-latin-400-normal.woff2",
  "fonts/literata-latin-700-normal.woff2",
  "fonts/lexend-latin-400-normal.woff2",
  "fonts/lexend-latin-700-normal.woff2",
  "fonts/lora-latin-400-normal.woff2",
  "fonts/lora-latin-700-normal.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "posts/index.json",
  "posts/best-pool-halls-gta.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // live data: network only

  const isAsset = /\.(woff2|png|webmanifest|css|js)$/.test(url.pathname) || url.pathname.includes("/posts/");
  if (isAsset) {
    event.respondWith(cacheFirst(req));
  } else {
    event.respondWith(networkFirst(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    // SPA fallback: any navigation we've never seen still opens the journal.
    if (req.mode === "navigate") return (await cache.match("index.html")) || Response.error();
    return Response.error();
  }
}
