const CACHE_NAME = 'v1';

const resources = [
  '/eink-reader/',
  '/eink-reader/index.html',
  '/eink-reader/css/fonts/FZFSSC.ttf',
  '/eink-reader/css/fonts/FZHTSC.ttf',
  '/eink-reader/css/fonts/FZKTSC.ttf',
  '/eink-reader/css/fonts/FZSSSC.ttf',
  '/eink-reader/css/fonts/SourceHanSerifCN-VF.otf',
  '/eink-reader/css/fonts/SourceHanSerifCN-VF.otf.woff2',
  '/eink-reader/js/vlist.js',
  '/eink-reader/js/lib/zepto.min.js',
  '/eink-reader/js/lib/vconsole.min.js',
  '/eink-reader/js/lib/hammer.min.js',
]

self.addEventListener('install', function(event) {
  console.log('install')
  event.waitUntil(
    caches.open('v1').then(function(cache) {
      return cache.addAll(resources);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  caches.keys().then(function(keyList) {
    return Promise.all(keyList.map(function(key) {
      if (key !== CACHE_NAME) {
        return caches.delete(key);
      }
    }));
  })
  event.waitUntil(
    clients.claim()
  );
})

const resourceNeedCache = (request, response) => {
  const url = new URL(request.url);
  const isApi = url.host === 'proxy.qwertyyb.cn'
  if (isApi) return false;
  return true;
}

self.addEventListener('fetch', function(event) {
  console.log('fetch', event.request.url)
  if (!resourceNeedCache(event.request)) return;
  event.respondWith(
    caches.match(event.request).then(function(cachedResp) {
      return cachedResp || fetch(event.request).then(function(response) {
        if (!resourceNeedCache(event.request, response)) {
          return response;
        }
        return caches.open('v1').then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});