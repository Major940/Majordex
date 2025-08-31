// Simple SW cache
const APP_CACHE = 'tcgdex-collection-v1'
const APP_ASSETS = ['/', '/index.html', '/placeholder.svg']
self.addEventListener('install', e => { e.waitUntil(caches.open(APP_CACHE).then(c=>c.addAll(APP_ASSETS)).then(()=>self.skipWaiting())) })
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (APP_ASSETS.includes(url.pathname)) {
    e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)))
  }
})
