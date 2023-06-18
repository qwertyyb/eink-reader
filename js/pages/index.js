import { services } from '../services/index.js'
import { importFile } from '../services/local-server.js'
import { formatSize, showToast } from '../utils/index.js'
import { lastReadBook } from '../utils/last-read.js'
import AboutDialog from '../components/about-dialog.js'

export default {
  components: {
    AboutDialog
  },
  template: document.querySelector('#components .route-index').outerHTML,
  data() {
    return {
      curTab: 'local', // local | online
      bookList: [],
      lastReadBook: lastReadBook.get(),
      aboutDialogVisible: false
    }
  },
  created() {
    this.refreshBookList()
  },
  methods: {
    async refreshBookList() {
      const bookList = await services[this.curTab].getBookList()
      this.bookList = bookList.map(book => {
        return {
          ...book,
          total: 0,
          progress: 0
        }
      })
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
        let timeout = null
        let lastExecTime = Date.now()
        await services[this.curTab].downloadRemoteBook(book, (length, total) => {
          timeout && clearTimeout(timeout)
          if (Date.now() - lastExecTime > 200) {
            lastExecTime = Date.now()
            book.total = total
            book.progress = length
            book.fProgress = `${formatSize(length)}/${formatSize(total)}`
            return;
          }
          timeout = setTimeout(() => {
            book.total = total
            book.progress = length
            book.fProgress = `${formatSize(length)}/${formatSize(total)}`
          }, 200)
        })
        showToast(`${book.title}下载完成`)
        this.refreshBookList()
      }
    }
  }
}