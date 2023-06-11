const createLastReadBooks = () => ({
  get(bookId) {
    const lastReadInfo = JSON.parse(localStorage.getItem('lastReadBooks') || '{}')
    return lastReadInfo[bookId]
  },
  set(bookId, { catalogId, cursor }) {
    const lastReadInfo = JSON.parse(localStorage.getItem('lastReadBooks') || '{}')
    lastReadInfo[bookId] = { catalogId, cursor }
    localStorage.setItem('lastReadBooks', JSON.stringify(lastReadInfo))
  }
})

const createLastReadBook = () => ({
  get() {
    try {
      return JSON.parse(localStorage.getItem('lastReadBook'))
    } catch(err) {
      return null
    }
  },
  set({ bookId, server }) {
    return localStorage.setItem('lastReadBook', JSON.stringify({ bookId, server }))
  }
})

export const lastReadBooks = createLastReadBooks()

export const lastReadBook = createLastReadBook()