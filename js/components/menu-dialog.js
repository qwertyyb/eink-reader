import { bridge } from "../../register-sw.js"
import CDialog from "./c-dialog.js"
import AboutDialog from "./about-dialog.js"
import { showToast } from "../utils/index.js"

export default {
  components: {
    CDialog,
    AboutDialog
  },
  template: /*html*/`
    <c-dialog :visible="visible"
      class="menu-dialog"
      anim="slide-right"
      @close="$emit('close')">
      <ul class="menu">
        <li class="menu-item">字体管理</li>
        <li class="menu-item" @click="clearCache()">清除缓存</li>
        <li class="menu-item" @click="aboutDialogVisible=true">关于EInk Reader</li>
      </ul>
      <about-dialog :visible="aboutDialogVisible" @close="aboutDialogVisible=false"></about-dialog>
    </c-dialog>
  `,
  props: {
    visible: Boolean
  },
  data() {
    return {
      aboutDialogVisible: false
    }
  },
  methods: {
    async clearCache() {
      await bridge.invoke('deleteAllCache')
      showToast('缓存已清除')
    }
  }
}