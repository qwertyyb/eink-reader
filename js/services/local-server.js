import { books } from '../storage.js'
import { parseTxtFile, download } from '../txt-file.js'
import { remoteBooks } from '../../books/index.js'

const render = async (book, chapter, content, chapterIndex, startCursor, endCursor) => {
  let chapterEl = document.createElement('div')
  chapterEl.classList.add('chapter')
  chapterEl.dataset.id = chapter.id
  chapterEl.dataset.chapterIndex = JSON.stringify(chapterIndex)
  let chapterTextOffset = 0
  content.split('\n').slice(startCursor, endCursor).forEach((line, i) => {
    const str = line.trim()
    if (i === 0) {
      const h4 = document.createElement('h4')
      h4.dataset.chapterIndex = JSON.stringify(chapterIndex)
      h4.dataset.cursor = JSON.stringify(startCursor + i)
      h4.dataset.chapterTextOffset = chapterTextOffset
      h4.classList.add('chapter-title')
      h4.textContent = str
      chapterEl.appendChild(h4)
    } else {
      const p = document.createElement('p')
      p.dataset.cursor = JSON.stringify(startCursor + i)
      p.dataset.chapterTextOffset = chapterTextOffset
      p.textContent = str
      chapterEl.appendChild(p)
    }
    chapterTextOffset += str.length
  })

  // chapterEl = await renderMarks(book.id, chapter.id, chapterEl)

  return chapterEl.outerHTML
}

export const dataService = {
  async getBookList () {
    const list = await books.getList()
    const bookList = remoteBooks.map(item => {
      const local = list.find(localBook => localBook.id === item.id)
      return {
        ...local,
        ...item,
        downloaded: !!local,
        catalog: (local && local.catalog || []).map(item => {
          return {
            ...item,
            id: item.cursor + '',
          }
        })
      }
    }).sort((prev, next) => {
      return next.downloaded - prev.downloaded || (next.lastReadTime || 0) - (prev.lastReadTime || 0) || 0
    })
    return bookList
  },
  async removeLocalBook(book) {
    return books.remove(book.id)
  },
  async downloadRemoteBook(book, onUpdate) {
    const { id, title, cover, content, catalog } = await download(book, onUpdate)
    books.add({ id, title, cover, title, content, catalog })
    return {
      id, title, cover
    }
  },
  getCatalog (book) {
    const catalog = book.catalog.map(item => {
      return {
        ...item,
        id: item.cursor + ''
      }
    })
    return { catalog }
  },
  async getContent (chapter, chapterIndex, book) {
    const { content } = await books.get(book.id)
    const index = book.catalog.findIndex(item => item.cursor === chapter.cursor)
    const next = book.catalog[index + 1]
    const startCursor = chapter.cursor
    return { content: await render(book, chapter, content, chapterIndex, startCursor, next && next.cursor || undefined) }
  }
}

export const importFile = async (file) => {
  const info = await parseTxtFile(file)
  await books.add(info)
  return info
}