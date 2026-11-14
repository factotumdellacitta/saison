/* Saison – service worker : coque en cache, données « réseau d'abord, cache en secours ». */
const V = "saison-2.0";
const SHELL = ["./", "index.html", "assets/app.js?v=2.0", "assets/literata.woff2", "assets/icon.svg", "assets/manifest.webmanifest", "assets/icon-192.png",
  "data/affiche.json", "data/journal.json", "data/lieux.json", "data/dispo.json", "data/liens.json"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
const networkFirst = async (req, key) => {
  const c = await caches.open(V);
  try {
    const r = await fetch(req, { cache: "no-cache" });
    if (r.ok) c.put(key || req, r.clone());
    return r;
  } catch (err) {
    const hit = await c.match(key || req, { ignoreSearch: !key });
    if (hit) return hit;
    throw err;
  }
};
const staleWhileRevalidate = async (req) => {
  const c = await caches.open(V), hit = await c.match(req);
  const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
};
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (/\.(enc|ics)$/.test(url.pathname)) return; // zone privée et flux : jamais en cache
  if (req.mode === "navigate") return e.respondWith(networkFirst(req, "index.html"));
  if (url.pathname.includes("/data/")) return e.respondWith(networkFirst(req));
  e.respondWith(staleWhileRevalidate(req));
});
