/* Wafflr offline shell — Phase 6 */
const CACHE = "wafflr-shell-v2";
const PRECACHE = [
  "/",
  "/create",
  "/join",
  "/rooms",
  "/manifest.json",
  "/wafflr-mark.svg",
  "/characters/butters/hero.svg",
  "/characters/butters/chill.svg",
  "/characters/butters/anxious.svg",
  "/characters/butters/nav-head.svg",
  "/characters/barron-bacon/error.svg",
  "/characters/hugh-blueberry/loading-sheet.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache Supabase / API — network only
  if (url.hostname.includes("supabase") || url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(req).catch(
        () =>
          new Response(JSON.stringify({ offline: true }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
      )
    );
    return;
  }

  // Same-origin: cache-first for static, network-first for navigations
  if (url.origin === self.location.origin) {
    const isNav = req.mode === "navigate";
    if (isNav) {
      event.respondWith(
        fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() =>
            caches.match(req).then((c) => c || caches.match("/") || offlinePage())
          )
      );
      return;
    }

    event.respondWith(
      caches.match(req).then((cached) => {
        const fetched = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    );
  }
});

function offlinePage() {
  return new Response(
    "<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><title>Wafflr offline</title></head><body style=\"font-family:system-ui;background:#FFFBEB;color:#0F172A;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0;text-align:center;padding:1.5rem\"><div><h1 style=\"font-size:1.5rem\">You're offline</h1><p>Shell is cached — reconnect to sync votes.</p><a href=\"/\" style=\"color:#F59E0B;font-weight:700\">Home</a></div></body></html>",
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
