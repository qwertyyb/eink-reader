import { bridge } from "../../register-sw.js"
import CDialog from "./c-dialog.js"
import AboutDialog from "./about-dialog.js"
import FontsDialog from "./fonts-dialog.js"
import { showToast } from "../utils/index.js"

export default {
  components: {
    CDialog,
    AboutDialog,
    FontsDialog,
  },
  template: /*html*/`
    <c-dialog :visible="visible"
      class="menu-dialog"
      @close="$emit('close')">
      <ul class="menu">
        <li class="menu-item" @click="dialog='fonts'">字体管理</li>
        <li class="menu-item" @click="clearCache()">清除缓存</li>
        <li class="menu-item" @click="dialog='about'">关于EInk Reader</li>
      </ul>
      <about-dialog :visible="dialog==='about'" @close="dialog=null"></about-dialog>
      <fonts-dialog :visible="dialog==='fonts'" @close="dialog=null"></fonts-dialog>
    </c-dialog>
  `,
  props: {
    visible: Boolean
  },
  data() {
    return {
      dialog: null
    }
  },
  methods: {
    async clearCache() {
      await bridge.invoke('deleteAllCache')
      showToast('缓存已清除')
    }
  }
}