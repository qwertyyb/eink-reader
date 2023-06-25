
import { services } from '../services/index.js'
import { createAutoPlay, darkMode, fullscreen, readSpeak } from '../actions/index.js'
import { getSettings, saveAllSettings } from '../utils/settings.js'
import { env } from '../utils/env.js'
import { lastReadBooks, lastReadBook } from '../utils/last-read.js'
import { showToast } from '../utils/index.js'
import CatalogDialog from '../components/catalog-dialog.js'
import CSelect from '../components/c-select.js'
import COption from '../components/c-option.js'
import CProgress from '../components/c-progress.js'

export default {
  template: document.querySelector('#components .route-book').outerHTML,
  components: {
    CatalogDialog,
    CSelect,
    COption,
    CProgress
  },
  props: {
    server: String,
    id: [String, Number],
    close: Function
  },
  data() {
    return {
      inited: false,

      book: null,
      chapterList: [],
      startChapterIndex: 0,
      curChapterIndex: 0,
      panelVisible: false,
      visiblePanel: null,

      controlState: {
        fullscreen: false,
        darkMode: false,
        readSpeak: false,
        autoPlay: false
      },

      settings: getSettings(),
      isBooxLeaf: env.isBooxLeaf()
    }
  },
  computed: {
    chapter() {
      return this.chapterList[this.curChapterIndex]
    },
    content() {
      return this.chapterList.slice(this.startChapterIndex, this.curChapterIndex + 20).map(chapter => chapter.content).filter(i => i).join('\n') || '<div class="placeholder">正在加载</div>';
    },
    rect() {
      return this.$route.query && this.$route.query.rect && JSON.parse(this.$route.query.rect)
    }
  },
  watch: {
    settings: {
      deep: true,
      handler() {
        saveAllSettings(this.settings)
      }
    }
  },
  async created() {
    await this.fetchBook()
    await this.startRead()
    lastReadBook.set({
      server: this.server,
      bookId: this.id
    })
  },
  beforeUnmount() {
    this.hammer && this.hammer.destroy()
    this.actions && this.actions.autoPlay && this.actions.autoPlay.stop()
    fullscreen.exit()
    darkMode.exit()
  },
  async beforeRouteLeave(to, from, next) {
    this.panelVisible = false
    this.close && await this.close()
    next()
  },
  methods: {
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
      this.book = book
    },
    async startRead() {
      const { catalogId = this.chapterList[0].id, cursor = 0 } = lastReadBooks.get(this.id) || {}
      
      let index = this.chapterList.findIndex(item => `${item.id}` === `${catalogId}`)
      index = index >= 0 ? index : 0
      await this.toCatalogItem(this.chapterList[index], index)

      await this.$nextTick()

      const el = document.querySelector(`.content [data-cursor="${cursor}"]`)

      console.log(el)
      if (el) {
        el.scrollIntoView()
      }
      this.initHammer()
      this.initAction()
      // 等待滚动到位置后再监听滚动事件
      setTimeout(() => {
        this.inited = true
      }, 300)
    },
    async toCatalogItem(item, index) {
      this.startChapterIndex = index
      this.curChapterIndex = index
      this.chapterList[this.curChapterIndex].status = 'loading'
      const { content } = await services[this.server].getContent(item, this.curChapterIndex, this.book)
      this.chapterList[this.curChapterIndex].status = 'loaded'
      this.chapterList[this.curChapterIndex].content = content
      this.visiblePanel = null
      this.panelVisible = false
      await this.$nextTick()
      this.$refs.contentWrapper.scrollTo(0, 0)
      this.updateProgress()
    },
    changeFontWeight(action) {
      if (action === 'dec') {
        this.settings.fontWeight = Math.max(100, this.settings.fontWeight - 100)
      } else if (action === 'inc') {
        this.settings.fontWeight = Math.min(900, this.settings.fontWeight + 100)
      }
    },
    changeAutoPlayDuration(duration) {
      this.settings.autoPlayDuration = duration
      this.actions.autoPlay.updateInterval(duration)
    },
    initHammer() {
      const contentTapHandler = (event) => {
        if (env.isBooxLeaf()) {
          // 左、中、右
          const { x } = event.center
          const centerLeft = window.innerWidth / 3
          const centerRight = 2 * centerLeft
          const isLeft = x < centerLeft
          const isRight = x > centerRight
          if (isLeft) return this.pageHandler('prev')
          if (isRight) return this.pageHandler('next')
        }
        if (this.actions.autoPlay.isPlaying()) {
          this.visiblePanel = 'autoPlay'
        }
        this.panelVisible = !this.panelVisible
      }
      const hammer = new Hammer(this.$refs.contentWrapper)
      if (env.isBooxLeaf()) {
        hammer.on('swipeleft', () => this.pageHandler('next'))
        hammer.on('swiperight', () => this.pageHandler('prev'))
      }
      hammer.on('tap', contentTapHandler)
      this.hammer = hammer
    },
    initAction() {
      this.actions = {
        autoPlay: createAutoPlay({
          nextPage: () => this.pageHandler(direction),
          scrollVertical: () => this.$refs.contentWrapper.scrollTop += 1
        })
      }
    },
    async actionHandler(control) {
      // action: readSpeak | darkMode | fullscreen | autoPlay | catalog
      if (control === 'fullscreen') {
        await fullscreen.toggle()
        this.controlState.fullscreen = fullscreen.isActivated()
      }
      if (control === 'darkMode') {
        darkMode.toggle()
        this.controlState.darkMode = darkMode.isActivated
      }
      if (control === 'readSpeak') {
        readSpeak.toggle(this.getCurrentP())
        this.controlState.readSpeak = readSpeak.isSpeaking()
      } else if (control === 'autoPlay') {
        this.visiblePanel = 'autoPlay'
        this.actions.autoPlay.toggle()
        this.controlState.autoPlay = this.actions.autoPlay.isPlaying()
      } else if (control === 'catalog') {
        this.visiblePanel = 'catalog'
      }
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
      if (env.isBooxLeaf()) {
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

      this.chapterList[nextIndex].status = 'loading'
      const { content } = await services[this.server].getContent(this.chapterList[nextIndex], nextIndex, this.book)
      this.chapterList[nextIndex].status = 'loaded'
      this.chapterList[nextIndex].content = content
    },
    hScrollHandler() {
      if (env.isBooxLeaf()) {
        this.updateProgress()
        if (this.needAppendNextChapter()) {
          this.appendNextChapter()
        }
      }
    },
    scrollHandler() {
      this.updateProgress()
      if (this.needAppendNextChapter()) {
        this.appendNextChapter()
      }
    }
  }
}