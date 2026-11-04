// Service worker de El Ancla.
// Hace que la app sea instalable. Los datos (productos, caja...) se piden siempre
// a Supabase en directo: aquí NO se guardan copias, para no enseñar nunca datos viejos.
const CACHE = 'elancla-v1';
const SHELL = ['./', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Supabase, fuentes y librerías: directo a internet
  // Primero internet (siempre la versión más nueva); si no hay conexión, la última copia guardada
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copia = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
      }
      return res;
    }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('./'); }); })
  );
});
