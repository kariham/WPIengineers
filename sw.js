const CACHE_NAME = 'wpi-qhse-v1';
const ASSETS = [
  './',
  './index.html',
  './styles/style.css',
  './js/main.js',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(response => response || fetch(e.request)));
});
