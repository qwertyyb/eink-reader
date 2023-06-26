import { bridge } from "../../register-sw.js"
import CDialog from "../common/c-dialog.js"
import AboutDialog from "./about-dialog.js"
import FontsDialog from "./fonts-dialog.js"
import UpdateDialog from "./update-dialog.js"
import { showToast } from "../../js/utils/index.js"

export default {
  components: {
    CDialog,
    AboutDialog,
    FontsDialog,
    UpdateDialog
  },
  template: /*html*/`
    <div class="menu-dialog">
      <c-dialog :visible="visible"
        class="menu-dialog"
        @close="$emit('close')">
        <ul class="menu">
          <li class="menu-item" @click="dialog='fonts'">字体管理</li>
          <li class="menu-item" @click="clearCache()">清除缓存</li>
          <li class="menu-item" @click="checkUpdates()">检查更新</li>
          <li class="menu-item" @click="dialog='about'">关于EInk Reader</li>
        </ul>
        <about-dialog :visible="dialog==='about'" @close="dialog=null"></about-dialog>
        <fonts-dialog :visible="dialog==='fonts'" @close="dialog=null"></fonts-dialog>
      </c-dialog>
      <update-dialog ref="checkUpdateDialog"></update-dialog>
    </div>
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
    },
    async checkUpdates() {
      this.$refs.checkUpdateDialog.checkUpdates({ slient: false })
    }
  }
}