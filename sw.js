/**
 * Service Worker
 * 
 * /sw.js
 */
const swVersion = 6; // Version number
const staticCacheName = `the-bar-code-static-cache-${swVersion}`; // Cache name

/**
 * On install, cache the major assets
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(staticCacheName)
      .then(cache =>
        cache.addAll([
            // Main assets
            '/css/style.min.css',
            '/js/main.min.js',
            'index.html',
            '/images/bg.png',
            // Social icons
            '/images/linkedin.svg',
            '/images/twitter.svg',
            // Fonts
            '/fonts/Beradon-Frames.woff',
            '/fonts/Beradon-Script.woff',
            '/fonts/materialicons-regular.woff',
            '/fonts/Roboto-Condensed-Regular.woff',
            // Video
            '/video/cocktail-x-sm.mp4',
            // Pages
            '/news/index.html',
            '/news/article/index.html',
            '/random/index.html',
            '/popular/index.html',
            '/popular/cocktail/index.html',
            '/base/index.html',
            '/base/cocktails/index.html',
            '/base/cocktails/cocktail/index.html',
            '/virgin/index.html',
            '/virgin/cocktail/index.html',
            // JSON
            '/data/news.json'
        ])
      )
  );
});

/**
 * On activate, delete any old caches and use the new one
 */
self.addEventListener('activate', event => {
  const cacheWhitelist = [staticCacheName];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});