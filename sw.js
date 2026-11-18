/* Factotum – service worker unique des deux sites (Factotum à la racine, Factotum Expo sous expo/) : coques en cache, données « réseau d'abord, cache en secours ». */
const V = "factotum-4.70";
// Le mode admin (assets/admin.js) n'est pas pré-chargé chez les visiteurs : il entre en cache à la première connexion.
const SHELL = ["./", "index.html", "expo/", "expo/index.html", "expo/manifest.webmanifest", "assets/app.js?v=4.70", "assets/expo.js?v=4.70", "assets/factotum.css?v=4.70", "assets/charte.js?v=4.70",
  "assets/fonts/schibsted-400.woff2", "assets/fonts/schibsted-500.woff2", "assets/fonts/schibsted-700.woff2", "assets/fonts/schibsted-800.woff2",
  "assets/icon.svg", "assets/manifest.webmanifest", "assets/icon-192.png", "assets/expo/icon.svg", "assets/expo/icon-192.png",
  "data/affiche.json", "data/journal.json", "data/lieux.json", "data/dispo.json", "data/liens.json", "data/envies.json", "data/deja-vu.json", "data/radar.json"];
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
  if (url.pathname.includes("/p/")) return; // pages de partage : laissées au réseau (elles renvoient vers le site)
  if (req.mode === "navigate") return e.respondWith(networkFirst(req, /\/expo\/(index\.html)?$/.test(url.pathname) ? "expo/index.html" : "index.html")); // chaque site a sa coque
  if (url.pathname.includes("/data/")) return e.respondWith(networkFirst(req));
  e.respondWith(staleWhileRevalidate(req));
});
