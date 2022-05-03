// test
const CACHE_NAME = 'v2';

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

const bridge = {
  invoke: (() => {
    const callbacks = new Map();

    self.addEventListener('message', event => {
      const { type, callback, result } = event.data;
      if (type === 'callback') {
        const cb = callbacks.get(callback);
        if (cb) {
          cb(result);
          callbacks.delete(callback);
        }
      }
    })
    return (method, ...args) => {
      return new Promise(resolve => {
        const callback = `callback_${Math.random()}`;
        callbacks.set(callback, resolve);
        self.postMessage({
          type: 'invoke',
          method,
          callback,
          payload: args,
        });
      })
    }
  })()
}

self.addEventListener('install', function(event) {
  console.log('install')
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(resources);
    })
  )
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
  event.waitUntil(clients.claim());
})

const resourceNeedCache = (request, response) => {
  const url = new URL(request.url);
  const isApi = url.host === 'proxy.qwertyyb.cn'
  if (isApi) return false;
  return true;
}

const notUseCache = (request) => {
  const isNoCache = request.url.includes('no-cache=1') || request.referrer.includes('no-cache=1')
  return isNoCache
}

self.addEventListener('fetch', function(event) {
  if (notUseCache(event.request)) return;
  console.log('fetch', event.request)
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


