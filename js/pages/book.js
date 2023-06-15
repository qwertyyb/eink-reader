
import { services } from '../services/index.js'
import { createAutoPlay, darkMode, fullscreen, readSpeak } from '../actions/index.js'
import { getSettings, saveAllSettings } from '../utils/settings.js'
import { env } from '../utils/env.js'
import { lastReadBooks, lastReadBook } from '../utils/last-read.js'
import { showToast } from '../utils/index.js'
import CatalogDialog from '../components/catalog-dialog.js'
import CSelect from '../components/c-select.js'
import COption from '../components/c-option.js'

export default {
  template: document.querySelector('#components .route-book').outerHTML,
  components: {
    CatalogDialog,
    // SelectorDialog,
    CSelect,
    COption
  },
  props: {
    server: String,
    id: [String, Number]
  },
  data() {
    return {
      inited: false,

      book: null,
      catalog: [],
      content: '<div class="placeholder">正在加载</div>',
      curCatalogItem: {},
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
  mounted() {
    this.initHammer()
    this.initAction()
  },
  beforeUnmount() {
    this.hammer && this.hammer.destroy()
    this.actions.autoPlay.stop()
    fullscreen.exit()
    darkMode.exit()
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
      this.catalog = catalog
      this.book = book
    },
    async startRead() {
      const { catalogId = this.catalog[0].id, cursor = 0 } = lastReadBooks.get(this.id) || {}
      
      let index = this.catalog.findIndex(item => `${item.id}` === `${catalogId}`)
      index = index >= 0 ? index : 0
      await this.toCatalogItem(this.catalog[index], index)

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
    async toCatalogItem(item, index) {
      this.curCatalogItem = item
      const { content } = await services[this.server].getContent(item, this.book)
      this.content = content
      this.visiblePanel = null
      this.panelVisible = false
      await this.$nextTick()
      this.$refs.contentWrapper.scrollTo(0, 0)
      this.scrollHandler()
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
    getCurrentP() {
      // 找到距离上方最近的段落的cursor
      const els = Array.from(document.querySelectorAll('.content [data-cursor]'))
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
      return target;
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
    hScrollHandler() {
      if (env.isBooxLeaf()) {
        this.scrollHandler()
      }
    },
    scrollHandler() {
      if (!this.inited) return;
      const p = this.getCurrentP()
      if (!p) return;

      // 可以往前回溯一个段落
      const cursor = p.previousElementSibling ? p.previousElementSibling.dataset.cursor : p.dataset.cursor
      lastReadBooks.set(this.book.id, { catalogId: this.curCatalogItem.id, cursor })
    }
  }
}