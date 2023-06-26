
import { services } from '../js/services/index.js'
import { env } from '../js/utils/env.js'
import { lastReadBooks, lastReadBook } from '../js/utils/last-read.js'
import { showToast } from '../js/utils/index.js'
import CatalogDialog from '../components/book/catalog-dialog.js'
import ControlWrapper from '../components/book/control-wrapper.js'

export default {
  template: /*html*/`
    <div class="page-container detail-page route-book">
      <control-wrapper ref="control-wrapper">
        <template v-slot:catalog>
          <virtual-list
            class="catalog-content-wrapper"
            data-key="id"
            :data-sources="chapterList"
            ref="catalog"
            :estimate-size="48">
            <template #="{ source, index }">
              <div class="catalog-item"
                @click="$emit('to-catalog-item', source, index)"
                :class="{active: index === curChapterIndex}"
                :data-catalog-id="source.id">
                <div class="catalog-label">{{ source.title }}</div>
              </div>
            </template>
          </virtual-list>
        </template>
        <template v-slot="{ settings }">
          <div class="content-wrapper" ref="contentWrapper" @scroll="scrollHandler">
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
  data() {
    return {
      inited: false,

      book: null,
      chapterList: [],
      startChapterIndex: 0,
      curChapterIndex: 0,
      isInk: env.isInk()
    }
  },
  computed: {
    chapter() {
      return this.chapterList[this.curChapterIndex]
    },
    content() {
      return this.chapterList.slice(this.startChapterIndex, this.curChapterIndex + 20).map(chapter => chapter.content).filter(i => i).join('\n') || '<div class="placeholder">正在加载</div>';
    },
  },
  async created() {
    await this.fetchBook()
    await this.startRead()
    lastReadBook.set({
      server: this.server,
      bookId: this.id
    })
  },
  async beforeRouteLeave(to, from, next) {
    this.$refs['control-wrapper']?.closePanel?.()
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

      if (el) {
        el.scrollIntoView()
      }
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
      await this.$nextTick()
      this.$refs.contentWrapper.scrollTo(0, 0)
      this.updateProgress()
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

      this.chapterList[nextIndex].status = 'loading'
      const { content } = await services[this.server].getContent(this.chapterList[nextIndex], nextIndex, this.book)
      this.chapterList[nextIndex].status = 'loaded'
      this.chapterList[nextIndex].content = content
    },
    hScrollHandler() {
      if (env.isInk()) {
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
    },
  }
}