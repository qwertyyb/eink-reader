export const dataService = {
  getBookList: () => {
    return [
      {
        id: '轮回乐园',
        title: '轮回乐园',
        cover: 'https://bookcover.yuewen.com/qdbimg/349573/1009817672/300',
        extraInfo: {
          url: 'https://m.01xs.com/xiaoshuo/106301/all.html',
          format: 'string',
          charset: 'utf8'
        }
      }
    ]
  },
  getCatalog: async (book) => {
    const { extraInfo } = book;
    const res = await jsonp({
      url: book.extraInfo.url,
      format: 'string',
      charset: 'utf8'
    })
    const html = document.createElement('html')
    html.innerHTML = res
    const els = Array.from(html.querySelectorAll('#chapterlist li'))
    const list = els
      .map(item => {
        return {
          id: 'https://m.01xs.com' + item.querySelector('a').getAttribute('href'),
          title: item.innerText,
        }
      })
      .reverse()
    console.log(list)
    return { catalog: list }
  },
  getContent: async (catalog) => {
    const res = await jsonp({
      url: catalog.id,
      format: 'string',
      charset: 'utf8'
    })
    const html = document.createElement('html')
    html.innerHTML = res
    const origin = html.querySelector('article#nr')
    Array.from(origin.children).forEach(item => {
      if (item.nodeName === 'SCRIPT') {
        item.parentNode.removeChild(item)
      }
    })
    const content = origin.innerHTML

    return { content: content }
  }
}