import { marks } from "../../js/storage.js"
import CDialog from "../common/c-dialog.js"

export default {
  props: {
    visible: Boolean,
    range: Object
  },
  template: /*html*/`
    <c-dialog :visible="visible" @close="$emit('close')" class="marks-dialog">
      <ul class="mark-list">
        <li class="mark-item" v-for="mark in markList" :key="mark.id">
          <p class="mark-content">{{ mark.thought }}</p>
          <p class="mark-quote">{{ mark.text }}</p>
        </li>
      </ul>
    </c-dialog>
  `,
  components: {
    CDialog
  },
  inject: ['book', 'chapter'],
  data() {
    return {
      markList: []
    }
  },
  watch: {
    range() {
      this.refresh()
    }
  },
  methods: {
    async refresh() {
      const list = await marks.getListByChapterAndBook(this.book.id, this.chapter.id)
      this.markList = list.filter(mark => {
        const { start, length } = mark.range
        const end = start + length
        return this.range.start <= start && start <= this.range.start + this.range.length || this.range.start <= end && end <= this.range.start + this.range.length
      })
    }
  }
}