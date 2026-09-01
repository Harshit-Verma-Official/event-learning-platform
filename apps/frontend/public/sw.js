/* ==================================================================
 * sw.js — a minimal, educational Service Worker
 * ==================================================================
 *
 * WHAT IS A SERVICE WORKER?
 * -------------------------
 * A service worker is a JS file that runs in its OWN thread, separate
 * from the page. It sits between the browser and the network, acting
 * as a programmable proxy. It gives you 3 superpowers:
 *
 *   1. OFFLINE SUPPORT  – cache assets, serve them when offline
 *   2. NETWORK CONTROL  – intercept & rewrite every fetch request
 *   3. BACKGROUND TASKS – push notifications, background sync
 *
 * LIFE CYCLE
 * ----------
 *   register() ──> install ──> activate ──> (idle) ──> fetch events
 *   (once)         (once)      (once)        ...       (every request)
 *
 * A page can only be controlled by ONE service worker at a time, and
 * the browser will only serve the new worker after the old one is
 * gone (that's the "waiting" state).
 *
 * This worker demonstrates the 4 core events with minimal code.
 * ================================================================== */

const CACHE_NAME = "sw-demo-v1";

// The "app shell" — the minimal set of URLs we want available the
// instant the worker installs (so a fresh user can go offline fast).
const PRECACHE_URLS = [
  "/",          // home page
  "/sw-demo",   // this demo page
  "/login",     // another route to try offline
  "/manifest.json",
  "/sw-icon.svg",
];

/* ------------------------- 1. INSTALL ----------------------------
 * Fires ONCE, the first time this worker is registered.
 * Perfect place to pre-cache the app shell with cache.addAll().
 * If anything throws, install() fails and the worker is discarded
 * (the browser silently retries on the next page load).
 * ----------------------------------------------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Don't wait for old tabs to close — take control asap.
  self.skipWaiting();
});

/* ------------------------- 2. ACTIVATE ---------------------------
 * Fires once, right after install, when this worker replaces the old
 * one. This is where you clean up stale caches from previous versions
 * — bumping CACHE_NAME is how you "invalidate" everything.
 * ----------------------------------------------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  // Immediately control already-open pages without a reload.
  self.clients.claim();
});

/* -------------------------- 3. FETCH -----------------------------
 * The heart of the worker. Fires for EVERY request made by pages we
 * control. Here we implement two classic caching strategies:
 *
 *   NAVIGATION  → "network-first, cache fallback"
 *                 Always try the network for fresh HTML; if the
 *                 network is down, serve the cached copy. Best for
 *                 pages, because you want the latest content.
 *
 *   STATIC FILES → "cache-first, network fallback"
 *                 Serve from cache instantly (fast!), and only hit
 *                 the network on a cache miss. Best for hashed
 *                 css/js/images that rarely change.
 * ----------------------------------------------------------------- */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests. Skip POST and cross-origin
  // requests (APIs, CDNs, etc.) so we never interfere with them.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* ---- Page navigation: network-first ----------------------- */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Save a copy of the fresh HTML for offline use.
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          // Offline! Fall back to the cached page, then to the demo
          // page as a last resort so the app never shows a blank tab.
          caches
            .match(request)
            .then((cached) => cached || caches.match("/sw-demo"))
        )
    );
    return;
  }

  /* ---- Static assets: cache-first --------------------------- */
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached; // hit! instant + offline-friendly
      return fetch(request).then((response) => {
        // Cache successful, cacheable responses for next time.
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

/* -------------------------- 4. MESSAGE ---------------------------
 * Bonus event: lets the page talk to this worker with
 *   navigator.serviceWorker.controller.postMessage(...)
 * The demo page uses this to list, clear, and warm the cache.
 * ----------------------------------------------------------------- */
self.addEventListener("message", (event) => {
  const { data } = event;
  if (!data) return;
  const reply = (payload) => event.ports[0]?.postMessage(payload);

  if (data.type === "CLEAR_CACHE") {
    caches.delete(CACHE_NAME).then(() => reply({ type: "CACHE_CLEARED" }));
  }

  if (data.type === "LIST_CACHE") {
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.keys())
      .then((keys) => reply({ type: "CACHE_LIST", urls: keys.map((k) => k.url) }))
      .catch(() => reply({ type: "CACHE_LIST", urls: [] }));
  }

  if (data.type === "CACHE_URL" && data.url) {
    fetch(data.url, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return caches.open(CACHE_NAME).then((cache) => cache.put(data.url, res));
      })
      .then(() => reply({ type: "URL_CACHED", url: data.url }))
      .catch((err) =>
        reply({ type: "URL_CACHE_ERROR", message: String(err.message || err) })
      );
  }
});
