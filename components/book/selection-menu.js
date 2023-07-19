import { toRaw } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import CDialog from "../common/c-dialog.js"
import { ChapterMark, ChapterMarkRange, MarkType } from '../../js/utils/mark.js'
import { marks } from '../../js/storage.js'
import MarksDialog from './marks-dialog.js'

export default {
  template: /*html*/`<div class="selection-menu">
    <div class="selection-menu-content-wrapper" @pointerdown.capture="contentTapHandler" ref="contentWrapper">
      <slot></slot>
    </div>
    <ul class="selection-menu-list" :style="{top: rect.top + 'px', left: rect.left + 'px'}" v-show="visible">
      <li class="selection-menu-item" @pointerdown.capture="actionHandler($event, 'thought')">
        <span class="material-icons">lightbulb</span>
        <span class="menu-item-label">想法</span>
      </li>
      <li class="selection-menu-item"
        v-if="selectedUnderlineMark"
        @pointerdown.capture="actionHandler($event, 'removeUnderline')">
        <span class="material-icons">format_color_text</span>
        <span class="menu-item-label">删除划线</span>
      </li>
      <li class="selection-menu-item"
        v-else
        @pointerdown.capture="actionHandler($event, 'underline')">
        <span class="material-icons">format_color_text</span>
        <span class="menu-item-label">划线</span>
      </li>
      <li class="selection-menu-item"
        v-if="selectedUnderlineMark"
        @pointerdown.capture="actionHandler($event, 'viewMark')">
        <span class="material-icons">format_color_text</span>
        <span class="menu-item-label">查看</span>
      </li>
    </ul>
    <c-dialog :visible="dialog==='thoughtInput'" class="thought-input-dialog" @close="dialog=null">
      <div class="thought-input-wrapper">
        <textarea class="thought-input" placeholder="写下这一刻的想法" ref="input" v-model="mark.thought"></textarea>
        <button class="save-btn" @click="saveThought">保存</button>
      </div>
    </c-dialog>
    <marks-dialog :visible="dialog==='marks'" @close="dialog=null" v-bind="dialogProps">
    </marks-dialog>
  </div>`,
  components: {
    CDialog,
    MarksDialog
  },
  inject: ['book', 'chapter'],
  data() {
    return {
      rect: {
        top: 0,
        left: 0,
      },
      visible: false,
      dialog: null,
      dialogProps: {},
      mark: {
        range: null,
        type: 1, // 0: none, 1: underline, 2: thought
        thought: ''
      },
      selectedUnderlineMark: null,
    }
  },
  computed: {
    chapterMark() {
      return this.$refs.contentWrapper.querySelector(`.chapter[data-id="${this.chapter.id}"]`)?.chapterMark
    }
  },
  mounted() {
    document.addEventListener('selectionchange', this.selectionChangeHandler)
    this.registerMutationObserver()
  },
  beforeUnmount() {
    document.removeEventListener('selectionchange', this.selectionChangeHandler)
    this.unregisterMutationObserver()
  },
  methods: {
    registerMutationObserver() {
      const observer = new MutationObserver(() => {
        const chapterEls = this.$refs.contentWrapper.querySelectorAll('.chapter')
        chapterEls.forEach(chapterEl => {
          if (chapterEl.chapterMark) return
          chapterEl.chapterMark = new ChapterMark(this.book.id, chapterEl.dataset.id, chapterEl)
          chapterEl.chapterMark.refresh()
        })
      })
      observer.observe(this.$refs.contentWrapper, {
        childList: true,
        subtree: true
      })
    },
    unregisterMutationObserver() {
      this.observer?.disconnect()
    },
    selectionChangeHandler() {
      const selection = window.getSelection()

      if (selection.isCollapsed) {
        this.visible = false
        return
      }

      // 现代浏览器只支持一个range
      const range = selection.getRangeAt(0)

      if (range.startContainer.nodeType !== Node.TEXT_NODE || range.endContainer.nodeType !== Node.TEXT_NODE) {
        this.visible = false
        return
      }

      const chapterMarkRange = new ChapterMarkRange(range)
      const mark = {
        bookId: this.book.id,
        chapterId: this.chapter.id,
        text: range.toString(),
        range: chapterMarkRange,
        type: MarkType.UNKNOWN,
        thought: '',
      }
      this.mark = mark

      const { bottom, left, width } = range.getBoundingClientRect()
      this.selectedUnderlineMark = false
      this.visible = true
      this.rect = {
        top: bottom + 10,
        left: left + width / 2,
      }
    },
    async underlineActionHandler() {
      this.mark.type = MarkType.UNDERLINE
      await marks.add({
        ...toRaw(this.mark),
      })
      this.chapterMark.refresh()
      window.getSelection().empty()
      this.visible = false
    },
    async removeUnderlineHandler() {
      await marks.remove(this.selectedUnderlineMark)
      this.chapterMark.refresh()
      this.visible =false
    },
    thoughtActionHandler() {
      this.dialog = 'thoughtInput'
      // create invisible dummy input to receive the focus first
      const fakeInput = document.createElement('input')
      fakeInput.setAttribute('type', 'text')
      fakeInput.style.position = 'absolute'
      fakeInput.style.opacity = 0
      fakeInput.style.height = 0
      fakeInput.style.fontSize = '16px' // disable auto zoom

      // you may need to append to another element depending on the browser's auto 
      // zoom/scroll behavior
      document.body.prepend(fakeInput)

      // focus so that subsequent async focus will work
      fakeInput.focus()
      setTimeout(() => {
        this.$refs.input?.focus()
        fakeInput.remove()
      }, 300)
    },
    async saveThought() {
      this.mark.type = MarkType.THOUGHT
      await marks.add(toRaw(this.mark))
      this.chapterMark.refresh()
      this.dialog = null
      this.visible = false
    },
    contentTapHandler(e) {
      const markEl = e.target.nodeName === 'MARK' ? e.target : e.target.closest('mark')
      if (!markEl) return
      e.preventDefault()
      if (parseInt(markEl.dataset.type, 10) === MarkType.UNDERLINE) {
        this.visible = true
        this.selectedUnderlineMark = parseInt(markEl.dataset.id, 10)
        const { bottom, left, width } = markEl.getBoundingClientRect()
        this.rect = {
          top: bottom + 10,
          left: left + width / 2
        }
      }
    },
    async actionHandler(event, action) {
      event.preventDefault()
      // action: thought | underline
      if (action === 'underline') {
        this.underlineActionHandler()
      } else if (action === 'thought') {
        this.thoughtActionHandler()
      } else if (action === 'removeUnderline') {
        this.removeUnderlineHandler()
      } else if (action === 'viewMark') {
        this.dialog = 'marks'
        const mark = await marks.get(this.selectedUnderlineMark)
        this.dialogProps = {
          range: mark.range
        }
      }
    }
  }
}