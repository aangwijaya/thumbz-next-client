/*
 * THUMBZ service worker — deliberately small and hand-written.
 *
 * - Hashed build assets (/_next/static), icons and images: cache-first.
 * - Public pages: network-first, falling back to the last copy, then /offline.
 * - Never cached: anything cross-origin (API, auth, payments, DRM licences,
 *   video segments), non-GET requests, and private routes (/me, /login, /auth, /api).
 */
const VERSION = "v1";
const STATIC_CACHE = "thumbz-static"; // content-hashed: safe to keep across versions
const PAGE_CACHE = `thumbz-pages-${VERSION}`;
const OFFLINE_URL = "/offline";
const MAX_PAGES = 40;
const PRIVATE_PATHS = ["/me", "/login", "/auth", "/api"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
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
            .filter((key) => key.startsWith("thumbz-pages-") && key !== PAGE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/")
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function trim(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_PAGES)).map((key) => cache.delete(key)));
}

async function networkFirstPage(request, cacheable) {
  try {
    const response = await fetch(request);
    if (cacheable && response.ok && response.type === "basic") {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(request, response.clone());
      trim(cache);
    }
    return response;
  } catch {
    const cached = cacheable ? await caches.match(request) : undefined;
    return cached ?? (await caches.match(OFFLINE_URL)) ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.mode === "navigate") {
    const cacheable = !PRIVATE_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
    event.respondWith(networkFirstPage(request, cacheable));
  }
});

/* ---------- Web Push: match reminders (API contract §18) ---------- */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "THUMBZ", body: event.data ? event.data.text() : "" };
  }
  // Same-origin paths only ("//host" would resolve to another site).
  const url = typeof data.url === "string" && /^\/(?!\/)/.test(data.url) ? data.url : "/";
  event.waitUntil(
    self.registration.showNotification(data.title || "THUMBZ", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag, // a newer reminder for the same match replaces the old one
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const resolved = new URL(event.notification.data?.url || "/", self.location.origin);
  const target = resolved.origin === self.location.origin ? resolved.href : self.location.origin + "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Reuse an open THUMBZ tab instead of stacking new ones.
      const open = windows.find((client) => client.url.startsWith(self.location.origin));
      if (open) return open.focus().then((client) => client?.navigate(target));
      return self.clients.openWindow(target);
    }),
  );
});
