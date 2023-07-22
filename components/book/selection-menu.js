import { toRaw } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import CDialog from "../common/c-dialog.js"
import { ChapterMark, MarkData, MarkType, MarkColors, MarkStyles } from '../../js/utils/mark.js'
import { marks } from '../../js/storage.js'
import MarksDialog from './marks-dialog.js'

export default {
  template: /*html*/`<div class="selection-menu">
    <div class="selection-menu-content-wrapper" @click.capture="contentTapHandler" ref="contentWrapper">
      <slot></slot>
    </div>
    <ul class="selection-menu-list" :style="{top: rect.top + 'px', left: rect.left + 'px'}" v-show="visible">
      <li class="selection-menu-item" @pointerdown.capture="actionHandler($event, 'thought')">
        <div class="menu-item-wrapper">
          <span class="material-icons menu-icon">lightbulb</span>
          <span class="menu-item-label">想法</span>
        </div>
      </li>
      <li class="selection-menu-item"
        v-if="selectedUnderlineMark">
        <div class="menu-item-wrapper"
          @pointerdown.capture="actionHandler($event, 'removeUnderline')">
          <span class="material-icons menu-icon">format_color_text</span>
          <span class="menu-item-label">删除划线</span>
        </div>
        <ul class="underline-submenu-list">
          <li class="underline-submenu-item mark-style"
            v-for="style in MarkStyles"
            @click="actionHandler($event, 'update', { style })"
            :style="{color: selectedUnderlineMark.style === style ? selectedUnderlineMark.color : ''}"
            :key="style">
            <span class="material-symbols-outlined style-icon" v-if="style === MarkStyles.WAVE">
            format_underlined_squiggle
            </span>
            <span class="material-symbols-outlined style-icon" v-else-if="style === MarkStyles.HIGHLIGHT">
            texture
            </span>
            <span class="material-symbols-outlined style-icon" v-else>
            format_underlined
            </span>
          </li>
          <li class="underline-submenu-item"
            v-for="color in MarkColors"
            @click="actionHandler($event, 'update', { color })"
            :key="color"
            :style="{background: color}">
            <span class="material-symbols-outlined" v-if="selectedUnderlineMark.color===color">
            check
            </span>
          </li>
        </ul>
      </li>
      <li class="selection-menu-item"
        v-else
        @pointerdown.capture="actionHandler($event, 'underline')">
        <div class="menu-item-wrapper">
          <span class="material-icons menu-icon">format_color_text</span>
          <span class="menu-item-label">划线</span>
        </div>
      </li>
      <li class="selection-menu-item"
        v-if="selectedUnderlineMark"
        @pointerdown.capture="actionHandler($event, 'viewMark')">
        <div class="menu-item-wrapper">
          <span class="material-symbols-outlined menu-icon">list</span>
          <span class="menu-item-label">查看</span>
        </div>
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
      MarkStyles,
      MarkColors,
      rect: {
        top: 0,
        left: 0,
      },
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
    },
    visible() {
      return this.mark.text || this.selectedUnderlineMark
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

      let text = ''
      let range = null

      if (selection.rangeCount) {
        // 现代浏览器只支持一个range
        range = selection.getRangeAt(0)
        text = range.toString()

        if (range.startContainer.nodeType !== Node.TEXT_NODE || range.endContainer.nodeType !== Node.TEXT_NODE) {
          text = ''
        }
      }

      this.mark.text = text

      if (!text) return

      const mark = new MarkData({
        range,
        bookId: this.book.id,
        chapterId: this.chapter.id
      })
      this.mark = mark

      const { bottom, left, width } = range.getBoundingClientRect()
      this.selectedUnderlineMark = null
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
      this.mark.text = ''
    },
    async removeUnderlineHandler() {
      await marks.remove(this.selectedUnderlineMark.id)
      this.chapterMark.refresh()
      this.selectedUnderlineMark = null
    },
    async updateSelectedMarkHandler(newData) {
      const newMark = {
        ...toRaw(this.selectedUnderlineMark),
        ...newData
      }
      await marks.update(this.selectedUnderlineMark.id, newMark)
      this.selectedUnderlineMark = newMark
      this.chapterMark.refresh()
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
      this.mark.text = ''
    },
    async contentTapHandler(e) {
      this.selectedUnderlineMark = null
      const markEl = e.target.nodeName === 'MARK' ? e.target : e.target.closest('mark')
      if (!markEl) return
      e.preventDefault()
      if (parseInt(markEl.dataset.type, 10) === MarkType.UNDERLINE) {
        const mark = await marks.get(parseInt(markEl.dataset.id, 10))
        if (!mark) return
        this.selectedUnderlineMark = mark
        const { bottom, left, width } = markEl.getBoundingClientRect()
        this.rect = {
          top: bottom + 10,
          left: left + width / 2
        }
      }
    },
    async actionHandler(event, action, params) {
      event.preventDefault()
      // action: thought | underline
      if (action === 'underline') {
        this.underlineActionHandler()
      } else if (action === 'thought') {
        this.thoughtActionHandler()
      } else if (action === 'removeUnderline') {
        this.removeUnderlineHandler()
      } else if (action === 'viewMark') {
        event.stopImmediatePropagation()
        event.stopPropagation()
        this.dialog = 'marks'
        const mark = await marks.get(this.selectedUnderlineMark.id)
        this.selectedUnderlineMark = mark
        this.dialogProps = {
          range: mark.range
        }
      } else if (action === 'update') {
        this.updateSelectedMarkHandler(params)
      }
    }
  }
}