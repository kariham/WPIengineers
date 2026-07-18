const CACHE = "wpi-cache-v1"; const ASSETS = [ "./", "./index.html", "./manifest.webmanifest", "./styles/main.css", "./js/app.js", "./js/forms.js", "./js/pdf.js", "./js/db.js", "./js/pwa.js", "./assets/logo.png" ];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); });

self.addEventListener("activate", (e) => { e.waitUntil( caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))) ) ); });

self.addEventListener("fetch", (e) => { e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request))); });
