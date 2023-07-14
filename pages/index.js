import { services } from '../js/services/index.js'
import { importFile } from '../js/services/local-server.js'
import { formatSize, showToast } from '../js/utils/index.js'
import { lastReadBook } from '../js/utils/last-read.js'
import MenuDialog from '../components/home/menu-dialog.js'
import BookCover from '../components/common/book-cover.js'

export default {
  components: {
    MenuDialog,
    BookCover
  },
  template: /*html*/`
    <div class="page-container shelf-page route-index">
      <div class="header">
        <img class="logo"
          @click="menuDialogVisible=true"
          src="https://cdn.jsdelivr.net/gh/qwertyyb/eink-reader/assets/icons/128.png" />
        <span class="select" @click="mode='select'" v-if="mode==='read'">选择</span>
        <span class="select" @click="mode='read'" v-if="mode==='select'">取消</span>
        <span id="import-file"
          @click="importLocalFile"
          class="material-icons">add</span>
      </div>
      <div class="shelf">
        <div class="book-list">
          <div class="book-item"
            v-for="(book, index) in bookList"
            :class="{'is-reading': \`\${book.id}\` === \`\${$route.params.id}\`}"
            :key="index"
            :data-book-id="book.id">
            <book-cover :book="book"
              @click="toReadBook(book, index, bookList)"></book-cover>
            <div class="book-title">
              <span class="material-icons-outlined remote-icon" v-if="!book.downloaded">cloud</span>
              <div class="download-progress-percent" v-else-if="!book.downloaded && book.total && book.progress">
                ({{ Math.round(book.progress/book.total * 100) + '%' }})
              </div>
              <span class="title">{{ book.title }}</span>
            </div>
            <div class="action-mask"
              @click="removeLocalBook(book, index)"
              v-if="mode==='select' && book.downloaded">
              <div class="action-label">点击删除本地缓存</div>
            </div>
          </div>
        </div>
      </div>
      <div class="type-tabs">
        <div class="tab-item" id="local-books" @click="changeTab('local')">
          <span class="material-icons">menu_book</span>
          本地
        </div>
        <div class="tab-item center" @click="toLastReadBook" v-if="lastReadBook">
          <span class="material-icons">book</span>
        </div>
        <div class="tab-item" id="online-books" @click="changeTab('online')">
          <span class="material-icons">cloud</span>
          在线
        </div>
      </div>
      <menu-dialog :visible="menuDialogVisible" @close="menuDialogVisible=false"></menu-dialog>
      <router-view :book="book" :book-position="curBookPos" v-if="book && curBookPos"></router-view>
    </div>
  `,
  data() {
    return {
      curTab: 'local', // local | online
      bookList: [],
      curBookPos: null,
      lastReadBook: lastReadBook.get(),
      menuDialogVisible: false,
      mode: 'read' // read | select
    }
  },
  computed: {
    book() {
      return this.bookList.find(item => `${item.id}` === `${this.$route.params.id}`)
    }
  },
  async created() {
    await this.refreshBookList()
    if (!this.$route.params.id) return;
    await this.$nextTick()
    const { top, left } = this.$el.querySelector(`.book-list .book-item[data-book-id="${this.$route.params.id}"]`).getBoundingClientRect()
    this.curBookPos = { top, left }
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
        const { top, left } = this.$el.querySelector(`.book-list .book-item[data-book-id="${book.id}"]`).getBoundingClientRect()
        this.curBookPos = { top, left }
        this.$router.push({
          name: 'book',
          params: {
            server: this.curTab,
            id: book.id
          },
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
    },
    async removeLocalBook(book, index) {
      await services.local.removeLocalBook(book)
      this.refreshBookList()
    }
  }
}