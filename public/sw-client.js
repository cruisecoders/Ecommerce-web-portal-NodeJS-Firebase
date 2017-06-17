var cacheName = 'coveda-v32';
var filesToCache = [
        '/home',
        "/home-m",
        '/adminHome',
        '/js/login.js',
        '/js/home-md.js',
        '/css/bootstrap.min.css',
        '/css/bootstrap-theme.min.css',
        '/js/jquery.min.js',
        '/js/bootstrap.min.js',
        '/img/coveda-logo.png',
        '/js/3-6-10-firebase.js',
        '/font-awesome-4.7.0/css/font-awesome.min.css'     
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );

  return self.clients.claim();
});


self.addEventListener('fetch', function(e) {

  //console.log('[Service Worker] Fetch', e.request.url);
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  
});

