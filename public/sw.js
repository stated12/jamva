// Jamva service worker: offline shell, cached static assets, and web-push notifications.
const CACHE = "jamva-v1";
const SHELL = ["/offline", "/logo-mark.svg", "/icons/icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url); if (u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  if (r.mode === "navigate") { e.respondWith(fetch(r).catch(() => caches.match("/offline"))); return; }
  if (/\.(?:png|jpg|jpeg|svg|webp|css|js|woff2?)$/.test(u.pathname) || u.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); return res; })));
  }
});
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || "Jamva", { body: d.body || "", icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { href: d.href || "/" }, vibrate: [200, 100, 200] }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close(); const href = (e.notification.data && e.notification.data.href) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => { for (const c of cs) { if ("focus" in c) { c.navigate(href); return c.focus(); } } return self.clients.openWindow(href); }));
});
