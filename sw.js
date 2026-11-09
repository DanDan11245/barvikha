/* Барвиха — обучалка: offline copy + updates. Version changes with every build. */
var VERSION = 'a2503d1dbf';
var CACHE = 'barvikha-' + VERSION;
var FONTS = 'barvikha-fonts';
var CORE = ['./', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'favicon-48.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(CORE.map(function (u) { return new Request(u, { cache: 'reload' }); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('barvikha-') === 0 && k !== CACHE && k !== FONTS;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      // the app is one page: always answer from the phone's copy (instant, works offline)
      e.respondWith(caches.open(CACHE).then(function (c) {
        return c.match('./').then(function (hit) {
          return hit || fetch(req).then(function (res) {
            if (res.ok) c.put('./', res.clone());
            return res;
          });
        });
      }).catch(function () { return fetch(req); }));
      return;
    }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || fetch(req); }));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          c.put(req, res.clone()).catch(function () {});
          return res;
        });
      });
    }));
  }
});
