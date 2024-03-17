const CACHE_NAME = 'v4';

console.log('self', self)

const resources = [
]

const createBridge = (calls = {}) => {
  const callbacks = new Map()

  self.addEventListener('message', async event => {
    logger.info('message received', event.data)
    const { type, method, args, returnValue, callback } = event.data
    if (type === 'invoke') {
      const result = await (calls[method] && calls[method](...args))
      return event.source.postMessage({
        type: 'callback',
        callback,
        returnValue: result
      })
    }
    if (type === 'callback') {
      const cb = callbacks.get(callback);
      if (cb) {
        cb(returnValue);
        callbacks.delete(callback);
      }
    }
  })

  return {
    invoke (method, ...args) {
      return new Promise(resolve => {
        const callback = `callback_${Math.random()}`;
        callbacks.set(callback, resolve);
        clients.matchAll()
          .then(clients => clients
            .forEach(client => client
              .postMessage({
                type: 'invoke',
                method,
                callback,
                args: args,
              })
            )
          );
      })
    }
  }
}

const bridge = createBridge({
  async deleteAllCache() {
    const cacheNames = await caches.keys()
    return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
  },
  async checkCachedUrls(urls) {
    const results = await Promise.all(urls.map(async url => {
      const response = await caches.match(url)
      return !!response
    }))
    return urls.reduce((obj, url, index) => ({
      ...obj,
      [url]: results[index]
    }), {})
  },
  async checkUpdates() {
    const updateUrl = self.origin + (self.origin.includes('localhost') ? '/constant.js' : '/eink-reader/constant.js')
    const cachedResponse = await caches.match(updateUrl)
    const localVersion = (await cachedResponse?.text())?.match(/export\sconst\sversion\s=\s'(.*)'/)?.[1]
    const response = await fetch(updateUrl)
    const text = await response.text()
    const remoteVersion = text.match(/export\sconst\sversion\s=\s'(.*)'/)?.[1]
    logger.info('checkUpdates', remoteVersion, localVersion)
    if (remoteVersion && localVersion && remoteVersion !== localVersion) {
      return {
        hasUpdates: true,
        version: remoteVersion,
        changelog: ''
      }
    }
    return {
      hasUpdates: false,
      version: localVersion,
    }
  }
})

const logger = {
  info: (...args) => console.info('[sw]', ...args),
  warn: (...args) => console.warn('[sw]', ...args),
  error: (...args) => console.error('[sw]', ...args),
}

self.addEventListener('install', function(event) {
  logger.info('service worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(resources);
      })
      .then(() => {
        logger.info('service worker installed')
      })
  )
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  logger.info('active')
  caches.keys().then(function(keyList) {
    return Promise.all(keyList.map(function(key) {
      if (key !== CACHE_NAME) {
        logger.info('delete cache', key)
        return caches.delete(key);
      }
    }));
  })
  event.waitUntil(
    clients.claim().then(() => {
      bridge.invoke('toast', '已更新，刷新页面即可使用新版本')
    })
  );
})

const resourceNeedCache = (request, response) => {
  const url = new URL(request.url);
  const isApi = url.host === 'proxy.qwertyyb.cn'
  if (isApi) return false;
  return true;
}


self.addEventListener('fetch', function(event) {
  if (!resourceNeedCache(event.request)) return;
  logger.info('fetch', event.request.url)
  event.respondWith(
    self.clients.get(event.clientId)
      .then(client => {
        const disableCache = client && client.url.includes('cache=0')
        if (disableCache) return fetch(event.request);
        return caches.match(event.request).then(function(cachedResp) {
          if (cachedResp) {
            logger.info('cache hit', event.request.url)
            return cachedResp
          }
          return fetch(event.request).then(function(response) {
            return caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, response.clone());
              return response;
            });
          });
        })
      })
  );
});
