import { computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { services } from '../js/services/index.js'
import { env } from '../js/utils/env.js'
import { lastReadBooks, lastReadBook } from '../js/utils/last-read.js'
import { showToast } from '../js/utils/index.js'
import CatalogDialog from '../components/book/catalog-dialog.js'
import ControlWrapper from '../components/book/control-wrapper.js'
import { books } from '../js/storage.js'

export default {
  template: /*html*/`
    <div class="page-container detail-page route-book">
      <control-wrapper ref="control-wrapper"
        @prev-page="pageHandler('prev')"
        @next-page="pageHandler('next')"
        @scroll-vertical="scrollVertical">
        <template v-slot:catalog>
          <header class="catalog-header">
            <div class="search-input">
              <input type="text" v-model.trim="search.keyword" />
              <span class="material-symbols-outlined regexp-icon"
                :class="{active: search.isRegexp}"
                @click="search.isRegexp = !search.isRegexp">regular_expression</span>
            </div>
            <button class="action-btn search-btn" @click="searchContent">
              <span class="material-symbols-outlined action-icon">search</span>
            </button>
            <button class="action-btn close-btn" @click="clearSearch" v-if="search.completed">
              <span class="material-symbols-outlined action-icon">close</span>
            </button>
          </header>
          <div class="search-empty-results" v-if="search.completed && search.results.length <= 0">
            <span class="material-symbols-outlined icon">find_in_page</span>
            <p class="empty-title">未找到结果</p>
          </div>
          <virtual-list
            v-else
            class="catalog-content-wrapper"
            data-key="id"
            :data-sources="list"
            ref="catalog"
            :estimate-size="48">
            <template #="{ source, index }">
              <div class="catalog-item"
                @click="readChapter(source, index)"
                :class="{active: index === curChapterIndex}"
                :data-catalog-id="source.id">
                <div class="catalog-label">{{ source.title }}</div>
              </div>
            </template>
          </virtual-list>
        </template>
        <template v-slot="{ settings }">
          <div class="content-wrapper" ref="contentWrapper" @scroll="vScrollHandler">
            <div class="content" :data-font="settings.fontFamily"
              :style="{
                fontSize: settings.fontSize + 'px',
                fontWeight: settings.fontWeight
              }"
              :class="{ column: isInk }"
              ref="content"
              @scroll="hScrollHandler"
              v-html="content">
            </div>
          </div>
        </template>
      </control-wrapper>
    </div>
  `,
  components: {
    CatalogDialog,
    ControlWrapper,
  },
  props: {
    server: String,
    id: [String, Number],
    close: Function
  },
  provide() {
    return {
      book: computed(() => this.book),
      chapter: computed(() => this.chapter),
      chapterList: computed(() => this.chapterList)
    }
  },
  data() {
    return {
      inited: false,

      book: null,
      chapterList: [],
      startChapterIndex: 0,
      curChapterIndex: 0,
      isInk: env.isInk(),

      search: {
        keyword: '',
        isRegexp: false,
        completed: false,
        results: [],
      }
    }
  },
  computed: {
    list () {
      if (this.search.keyword.trim()) return this.search.results
      return this.chapterList
    },
    chapter() {
      return this.chapterList[this.curChapterIndex]
    },
    contentChapterList() {
      let chapterList = []
      for(let i = this.startChapterIndex; i < this.chapterList.length; i += 1) {
        const chapter = this.chapterList[i]
        if (chapter.status === 'loaded') {
          chapterList.push(chapter)
        } else {
          break
        }
      }
      return chapterList
    },
    content() {
      return this.contentChapterList.map(chapter => chapter.content).filter(i => i).join('\n') || '<div class="placeholder">正在加载</div>'
    },
  },
  async created() {
    await this.fetchBook()
    await this.startRead()
    lastReadBook.set({
      server: this.server,
      bookId: this.id
    })
    books.updateLastReadTime(this.id)
  },
  async beforeRouteLeave(to, from, next) {
    this.$refs['control-wrapper']?.closePanel?.()
    this.close && await this.close()
    next()
  },
  watch: {
    curChapterIndex() {
      this.$refs.catalog?.scrollToIndex(Math.max(0, this.curChapterIndex - 2))
    }
  },
  methods: {
    async searchContent() {
      if (!this.search.keyword.trim()) return;
      const { content } = await services[this.server].getBook(Number(this.id))
      const results = []
      const reg = this.search.isRegexp ? new RegExp(this.search.keyword) : null
      content.split('\n').forEach((line, index) => {
        const match = this.search.isRegexp ? reg.test(line.trim()) : line.trim().includes(this.search.keyword)
        if (match) {
          results.push({
            title: line.trim(),
            cursor: index,
            id: index,
          })
        }
      })
      this.search.completed = true
      this.search.results = results
    },
    async clearSearch() {
      this.search.completed = false
      this.search.keyword = ''
      this.search.results = []
      this.search.isRegexp = false
    },
    async fetchBook() {
      const book = await services[this.server].getBookList().then(bookList => bookList.find(book => `${book.id}` === `${this.id}`))
      if (!book) {
        return showToast(`获取book失败: ${this.server}/${this.id}`)
      }
      const { catalog } = await services[this.server].getCatalog(book)
      if (!catalog) {
        return showToast(`获取目录失败: ${this.server}/${this.id}`)
      }
      this.chapterList = catalog.map(item => ({
        ...item,
        status: 'default', // default | loading | loaded
        content: '',
      }))
      console.log(book)
      this.book = book
    },
    async startRead() {
      const { catalogId = this.chapterList[0].id, cursor = 0 } = lastReadBooks.get(this.id) || {}
      
      let index = this.chapterList.findIndex(item => `${item.id}` === `${catalogId}`)
      index = index >= 0 ? index : 0
      await this.readChapter(this.chapterList[index], index)

      await this.$nextTick()

      const el = document.querySelector(`.content [data-cursor="${cursor}"]`)

      if (el) {
        el.scrollIntoView()
      }
      // 等待滚动到位置后再监听滚动事件
      setTimeout(() => {
        this.inited = true
      }, 300)
    },
    async readChapter(item, index) {
      this.startChapterIndex = index
      this.curChapterIndex = index
      await this.loadChapter(this.curChapterIndex)
      await this.$nextTick()
      this.$refs.contentWrapper.scrollTo(0, 0)
      this.updateProgress()
    },
    async loadChapter(chapterIndex) {
      const chapter = this.chapterList[chapterIndex]
      chapter.status = 'loading'
      const { content } = await services[this.server].getChapter(chapter, chapterIndex, this.book)
      chapter.content = content
      chapter.status = 'loaded'
    },
    getCurrentProgress() {
      // 1. 找到当前的章节
      const chapterEls = this.$refs.content.querySelectorAll('.chapter')
      const chapterEl = Array.from(chapterEls)
        .reverse()
        .find((el) => {
          const { top, left } = el.getBoundingClientRect()
          return top < 0 || left < 0
        }) || chapterEls[0]
      if (!chapterEl) return

      // 2. 找到章节中最靠近上方的段落
      const els = Array.from(chapterEl.querySelectorAll('.content [data-cursor]'))
      const screenRect = document.documentElement.getBoundingClientRect()
      let minLeft = Number.MAX_SAFE_INTEGER
      let minTop = Number.MAX_SAFE_INTEGER
      let target = null
      els.forEach(el => {
        const rect = el.getBoundingClientRect()
        if (rect.top >= screenRect.top
          && rect.left >= screenRect.left
          && rect.bottom <= screenRect.bottom
          && rect.right <= screenRect.right) {
            // 在屏幕内
            if (rect.left < minLeft || rect.top < minTop) {
              minTop = rect.top
              minLeft = rect.left
              target = el
            }
          }
      })
      return {
        chapterIndex: +chapterEl.dataset.chapterIndex,
        chapter: this.chapterList[+chapterEl.dataset.chapterIndex],
        cursor: target?.dataset.cursor
      }
    },
    scrollVertical(distance) {
      this.$refs.contentWrapper.scrollTop += distance
    },
    pageHandler (direction) {
      const content = this.$refs.content
      const pageWidth = content.getBoundingClientRect().width
      const curPage = Math.round(content.scrollLeft / pageWidth)
      const originScroll = content.scrollLeft;
      if (direction === 'prev') {
        content.scrollLeft = (curPage - 1) * pageWidth;
        if (content.scrollLeft === originScroll) {
          showToast('已是第一页')
        }
      } else if (direction === 'next') {
        content.scrollLeft = (curPage + 1) * pageWidth;
        if (content.scrollLeft === originScroll) {
          showToast('已是最后一页')
        }
      }
    },
    updateProgress() {
      if (!this.inited) return;
      const { chapter, cursor, chapterIndex } = this.getCurrentProgress() || {}
      if (!chapter || !cursor) return;

      this.curChapterIndex = chapterIndex
      
      lastReadBooks.set(this.book.id, { catalogId: chapter.id, cursor })
    },
    needAppendNextChapter() {
      if (env.isInk()) {
        const content = this.$refs.content
        const pageWidth = content.getBoundingClientRect().width
        const curPage = Math.round(content.scrollLeft / pageWidth)
        const totalPage = Math.round(content.scrollWidth / pageWidth)
        return totalPage - curPage <= 2
      }
      const contentWrapper = this.$refs.contentWrapper
      return contentWrapper.scrollHeight - contentWrapper.scrollTop - contentWrapper.clientHeight <= 50
    },
    async appendNextChapter() {
      let nextIndex = -1
      for (let i = this.curChapterIndex; i < this.chapterList.length; i += 1) {
        if (this.chapterList[i].status === 'loading') {
          break;
        }
        if (this.chapterList[i].status === 'default') {
          nextIndex = i;
          break;
        }
      }
      if (nextIndex < 0) return;

      await this.loadChapter(nextIndex)
    },
    hScrollHandler() {
      if (env.isInk()) {
        this.updateProgress()
        if (this.needAppendNextChapter()) {
          this.appendNextChapter()
        }
      }
    },
    vScrollHandler() {
      this.updateProgress()
      if (this.needAppendNextChapter()) {
        this.appendNextChapter()
      }
    },
  }
}