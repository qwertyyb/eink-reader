import { books } from './storage.js'
import { render } from './txt-file.js'

export const dataService = {
  async getBookList () {
    const list = await books.getList()
    const bookList = list.map(item => {
      return {
        ...item,
        cover: 'https://via.placeholder.com/300x400?text=cover',
        catalog: item.catalog.map(item => {
          return {
            ...item,
            id: item.cursor + '',
          }
        })
      }
    })
    return bookList
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
    return { content: render(content, startCursor, next.cursor) }
  }
}