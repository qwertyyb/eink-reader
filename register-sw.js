import { showToast } from './js/utils/index.js'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => {
      console.log('service worker register successfully: ', reg)
    })
    .catch(err => {
      console.error('service worker register failed: ', err)
    })
  navigator.serviceWorker.addEventListener('controllerchange', (e) => {
    console.log('controllerchange', e)
    showToast('已更新, 刷新页面后可应用')
  })

  if (location.search.includes('cache=1')) {
    navigator.serviceWorker.ready.then(async reg => {
      if (!reg.active) return;
      const res = await bridge.invoke('deleteAllCache')
      console.log('deleteAllCache', res)
    })
  }
}

export const createBridge = (calls = {}) => {
  if (!navigator.serviceWorker) {
    return {
      invoke() {}
    }
  }
  const callbacks = new Map()

  navigator.serviceWorker.addEventListener('message', async event => {
    const { type, method, args, returnValue, callback } = event.data
    if (type === 'invoke') {
      const result = await calls[method] && calls[method](...args)
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
        navigator.serviceWorker.ready.then(reg => {
          reg.active && reg.active.postMessage({
            type: 'invoke',
            callback,
            method,
            args
          })
        })
      })
    }
  }
}

export const bridge = createBridge({
  toast: (...args) => showToast(...args),
  prompt: window.prompt
})
