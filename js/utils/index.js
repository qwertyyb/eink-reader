export const showToast = (msg, duration = 1500) => {
  const toastEl = $(`<div style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100;border:1px solid #000;border-radius:4px;padding:4px 10px;background:#000;color:#fff;">${msg}</div>`)
  const body = $('body').append(toastEl)
  setTimeout(() => {
    toastEl.remove()
  }, duration)
}

const jsonp = (data) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: localStorage.getItem('proxyUrl'),
      dataType: 'jsonp',
      data: {
        format: 'string',
        charset: 'gbk',
        ...data
      },
      success: resolve,
      error: (xhr, textStatus, errMessage) => {
        alert('获取数据失败')
        if (window.confirm('清除代理URL?')) {
          localStorage.removeItem('proxyUrl')
        }
        reject(new Error('失败'))
      }
    })
  })
}

export const formatSize = (size) => {
  const kB = size / 1024
  const mB = kB / 1024

  if (kB < 512) {
    return kB.toFixed(2) + 'KB'
  }
  return mB.toFixed(2) + 'MB'
}

export const getNearestTopEl = (els) => {
  const el = Array.from(els)
    .reverse()
    .find((el) => {
      const { top, left } = el.getBoundingClientRect()
      return top < 0 || left < 0
    }) || els[0]
  if (!el) return null
  console.log(el, el.getBoundingClientRect())
  if (!el.children.length) return el
  return getNearestTopEl(el.children)
}
