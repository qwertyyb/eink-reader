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

export const getNodeOffset = ({ textOffset, paragrahp } = {}) => {
  let lastOffset = 0;
  for(let i = 0; i < paragrahp.childNodes.length; i += 1) {
    const node = paragrahp.childNodes[i]
    const endOffset = lastOffset + node.textContent.length
    if (lastOffset <= textOffset && textOffset <= endOffset) {
      return {
        offset: textOffset - lastOffset,
        node
      }
    }
    lastOffset = endOffset
  }
}

const getPreviousOffset = (node, stopEl) => {
  if (!node) return 0

  if (stopEl === node) return 0

  const length = node.textContent.length

  if (node.previousSibling) {
    return length + getPreviousOffset(node.previousSibling, stopEl)
  }
  return length + getPreviousOffset(node.parentNode, stopEl)
}

export const getClosest = (node, selector) => {
  return node?.closest?.(selector) || node?.parentElement?.closest?.(selector)
}

export const getParagraphOffset = ({ node, offset } = {}) => {
  const p = getClosest(node, 'p[data-chapter-text-offset]')
  return offset + getPreviousOffset(node.previousSibling, p)
}

export const getChapterOffset = ({ node, offset } = {}) => {
  const p = getClosest(node, 'p[data-chapter-text-offset]')
  return getParagraphOffset({ node, offset }) + parseInt(p.dataset.chapterTextOffset, 10)
}

export const getParagraphPoint = ({ node, offset } = {}) => {
  const p = getClosest(node, 'p[data-chapter-text-offset]')
  return {
    offset: getParagraphOffset({ node, offset }),
    cursor: parseInt(p.dataset.cursor, 10)
  }
}