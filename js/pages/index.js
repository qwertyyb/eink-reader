import { services } from '../services/index.js'
import { importFile } from '../services/local-server.js'
import { showToast } from '../utils/index.js'
import { lastReadBook } from '../utils/last-read.js'

export default {
  template: document.querySelector('#components .route-index').outerHTML,
  data() {
    return {
      curTab: 'local', // local | online
      bookList: [],
      lastReadBook: lastReadBook.get()
    }
  },
  created() {
    this.refreshBookList()
  },
  methods: {
    async refreshBookList() {
      const bookList = await services[this.curTab].getBookList()
      this.bookList = bookList
    },
    changeTab(tab) {
      this.curTab = tab
      this.refreshBookList()
    },
    importLocalFile() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '*.txt'
      input.addEventListener('change', async e => {
        const [file] = input.files || []
        if(!file) return
        await importFile(file)
        this.refreshBookList()
      })
      input.style.display = 'none'
      input.click()
    },
    toLastReadBook() {
      this.$router.push({
        name: 'book',
        params: {
          server: this.lastReadBook.server,
          id: this.lastReadBook.bookId
        }
      })
    },
    async toReadBook(book, index, bookList) {
      if (book.downloaded) {
        this.$router.push({
          name: 'book',
          params: {
            server: this.curTab,
            id: book.id
          }
        })
      } else {
        showToast('开始下载...')
        await services[this.curTab].downloadRemoteBook(book)
        showToast(`${book.title}下载完成`)
        this.refreshBookList()
      }
    }
  }
}