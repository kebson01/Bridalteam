/*
 * Minimal service worker. Chrome will not offer "Install" without one that has
 * a fetch handler, so the goal here is installability plus a usable offline
 * fallback — not aggressive caching, which would serve stale pages on a site
 * that still changes daily.
 */

const VERSION = "v3";
const STATIC_CACHE = `bt-static-${VERSION}`;
const PAGE_CACHE = `bt-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Same-origin only; never touch Supabase or other third parties.
  if (url.origin !== self.location.origin) return;

  // API and auth routes must always hit the network untouched — caching them
  // would serve stale data, and auth flows are redirect-heavy.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Navigations: network first, fall back to cache, then the offline page.
  //
  // IMPORTANT: a *redirected* response can never be handed back for a
  // navigation — the browser rejects it outright ("This page couldn't load"),
  // which broke login/confirm flows (any page that server-side redirect()s,
  // e.g. /dashboard -> /onboarding after sign-in). It is not enough to skip
  // *caching* redirected responses; we must also rebuild them into a fresh,
  // non-redirected response before returning. Only plain 200s are cached.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.redirected) {
            const body = await response.arrayBuffer();
            return new Response(body, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          }
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? (await caches.match(OFFLINE_URL)) ?? Response.error();
        }),
    );
    return;
  }

  // Build output under /_next/static is content-hashed, so cache-first is safe.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
