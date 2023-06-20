import { books } from '../storage.js'
import { parseTxtFile, download } from '../txt-file.js'
import { remoteBooks } from '../../books/index.js'

const render = (content, chapterIndex, startCursor, endCursor) => {
  return `<div class="chapter" data-chapter-index=${JSON.stringify(chapterIndex)}>` + content.split('\n')
    .slice(startCursor, endCursor)
    .map((line, i) => {
      const str = line.trim()
      if (i === 0) return `<h4 data-cursor=${JSON.stringify(startCursor + i)} data-chapter-index=${JSON.stringify(chapterIndex)} class="chapter-title">${str}</h4>`
      return `<p data-cursor=${JSON.stringify(startCursor + i)}>${line.trim()}</p>`
    })
    .join('\n') + '</div>'
}

export const dataService = {
  async getBookList () {
    const list = await books.getList()
    const bookList = remoteBooks.map(item => {
      const local = list.find(localBook => localBook.id === item.id)
      return {
        ...item,
        cover: 'https://via.placeholder.com/300x400?text=cover',
        downloaded: !!local,
        catalog: (local && local.catalog || []).map(item => {
          return {
            ...item,
            id: item.cursor + '',
          }
        })
      }
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
    return { content: render(content, chapterIndex, startCursor, next && next.cursor || undefined) }
  }
}

export const importFile = async (file) => {
  const info = await parseTxtFile(file)
  await books.add(info)
  return info
}