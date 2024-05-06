import CDialog from "../common/c-dialog.js"

export default {
  components: {
    CDialog
  },
  template: /*html*/`
    <c-dialog :visible="visible"
      class="book-menu-dialog"
      @close="$emit('close')">

      <ul class="book-menu">
        <li class="menu-item" @click="viewMarks">
          <span class="material-symbols-outlined menu-item-icon">
          overview
          </span>
          <div class="menu-item-label">查看笔记</div>
        </li>
        <li class="menu-item" @click="exportMarks">
          <span class="material-symbols-outlined menu-item-icon">
          export_notes
          </span>
          <div class="menu-item-label">导出笔记</div>
        </li>
        <li class="menu-item" @click="catalogSetting">
          <span class="material-symbols-outlined menu-item-icon">
          toc
          </span>
          <div class="menu-item-label">目录设置</div>
        </li>
      </ul>
    </c-dialog>
  `,
  props: {
    visible: Boolean
  },
  data() {
    return {
    }
  },
  methods: {
    viewMarks() {
      this.$emit('action', 'marksViewer')
      console.log('查看笔记')
    },
    exportMarks() {
      console.log('导出笔记')
    },
    catalogSetting() {
      console.log('设置目录')
      this.$emit('action', 'catalogSetting')
    }
  }
}