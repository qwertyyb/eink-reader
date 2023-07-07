import CDialog from "../common/c-dialog.js"

const getClosestCursor = (node) => {
  if (+node?.dataset?.cursor) return +node.dataset.cursor
  if (!node) return 0
  return getClosestCursor(node.parentElement)
}

const MarkType = {
  UNKNOWN: 0,
  UNDERLINE: 1,
  THOUGHT: 2,
}

export default {
  template: /*html*/`<div class="selection-menu">
    <slot></slot>
    <ul class="selection-menu-list" :style="{top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px'}" v-show="visible">
      <li class="selection-menu-item" @mousedown.capture="actionHandler($event, 'thought')">
        <span class="material-icons">lightbulb</span>
        <span class="menu-item-label">想法</span>
      </li>
      <li class="selection-menu-item" @mousedown.capture="actionHandler($event, 'underline')">
        <span class="material-icons">format_color_text</span>
        <span class="menu-item-label">划线</span>
      </li>
    </ul>
    <c-dialog :visible="thoughtInputVisible" class="thought-input-dialog" @close="thoughtInputVisible=false">
      <div class="thought-input-wrapper">
        <textarea class="thought-input" placeholder="写下这一刻的想法" ref="input" v-model="mark.thought"></textarea>
        <button class="save-btn" @click="saveThought">保存</button>
      </div>
    </c-dialog>
  </div>`,
  components: {
    CDialog
  },
  data() {
    return {
      rect: {
        top: 0,
        left: 0,
        width: 120
      },
      visible: false,
      thoughtInputVisible: false,
      mark: {
        start: { cursor: 0, offset: 0 },
        end: { cursor: 0, offset: 0 },
        type: 1, // 0: none, 1: underline, 2: thought
        thought: ''
      }
    }
  },
  mounted() {
    document.addEventListener('selectionchange', this.selectionChangeHandler)
  },
  beforeUnmount() {
    document.removeEventListener('selectionchange', this.selectionChangeHandler)
  },
  methods: {
    selectionChangeHandler() {
      const selection = window.getSelection()

      if (selection.isCollapsed) {
        this.visible = false
        return
      }

      // 现代浏览器只支持一个range
      const range = selection.getRangeAt(0)
      const { startContainer, startOffset, endContainer, endOffset } = range
      if (!this.$el.contains(startContainer) || !this.$el.contains(endContainer)) return;
      
      // 获取开始和结束index
      const [start, end] = [getClosestCursor(startContainer), getClosestCursor(endContainer)]
      if (!start || !end) return;
      console.log(start, end)

      const mark = {
        start: { cursor: start, offset: startOffset },
        end: { cursor: end, offset: endOffset },
        type: MarkType.UNKNOWN,
        thought: ''
      }
      this.mark = mark

      // @todo 暂时不考虑多个node的情况
      const { bottom, left, width } = range.getBoundingClientRect()
      this.visible = true
      this.rect = {
        ...this.rect,
        top: bottom + 10,
        left: left + width / 2 - this.rect.width / 2,
      }
    },
    underlineActionHandler() {
      const range = window.getSelection().getRangeAt(0)
      const mark = document.createElement('mark')
      mark.classList.add('underline')
      range.surroundContents(mark)
      this.mark.type = MarkType.UNDERLINE
    },
    thoughtActionHandler() {
      this.thoughtInputVisible = true
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
      }, 100)
    },
    saveThought() {
      this.mark.type = MarkType.THOUGHT
      console.log(this.mark)
    },
    actionHandler(event, action) {
      event.preventDefault()
      // action: thought | underline
      if (action === 'underline') {
        this.underlineActionHandler()
      } else if (action === 'thought') {
        this.thoughtActionHandler()
      }
    }
  }
}