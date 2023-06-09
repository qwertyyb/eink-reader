const createLastReadBooks = () => ({
  get(bookId) {
    const lastReadInfo = JSON.parse(localStorage.getItem('lastReadBooks') || '{}')
    return lastReadInfo[bookId]
  },
  saveRead(bookId, { catalogId, cursor }) {
    const lastReadInfo = JSON.parse(localStorage.getItem('lastReadBooks') || '{}')
    lastReadInfo[bookId] = { catalogId, cursor }
    localStorage.setItem('lastRead', JSON.stringify(lastReadInfo))
  }
})

const createLastReadBook = () => ({
  getBookId() {
    return (localStorage.getItem('lastReadBookId') || {}).bookId
  },
  setBookId(bookId) {
    return localStorage.setItem('lastReadBookId', JSON.stringify({ bookId }))
  }
})

export const lastReadBooks = createLastReadBooks()

export const lastReadBook = createLastReadBook()