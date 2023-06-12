import { books } from '../storage.js'
import { render, parseTxtFile, download } from '../txt-file.js'
import { remoteBooks } from '../../books/index.js'

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
  async downloadRemoteBook(book) {
    const { id, title, cover, content, catalog } = await download(book)
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
  async getContent (catalogItem, book) {
    const { content } = await books.get(book.id)
    const index = book.catalog.findIndex(item => item.cursor === catalogItem.cursor)
    const next = book.catalog[index + 1]
    const startCursor = catalogItem.cursor
    return { content: render(content, startCursor, next && next.cursor || undefined) }
  }
}

export const importFile = async (file) => {
  const info = await parseTxtFile(file)
  await books.add(info)
  return info
}