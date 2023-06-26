import { bridge } from "../../register-sw.js";
import { showToast } from "../../js/utils/index.js";
import CDialog from "../common/c-dialog.js";
import { version } from "../../constant.js";

export default {
  components: {
    CDialog
  },
  template: /*html*/`
    <c-dialog class="update-dialog" :visible="visible" @close="visible=false">
      <div class="update-title">
        已检测到新的版本
      </div>
      <div class="version-info">
        最新版本: {{ newInfo.version }} <br>
        当前版本: {{ localVersion }}
      </div>
      <div class="changelog" v-if="false">
        更新内容: xxxx
      </div>
      <div class="update-actions">
        <button class="cancel-btn" @click="visible=false">取消</button>
        <button class="confirm-btn" @click="update">更新</button>
      </div>
    </c-dialog>
  `,
  data() {
    return {
      visible: false,
      localVersion: version,
      newInfo: {
        version: '',
        changelog: '',
      }
    }
  },
  created() {
    this.checkUpdates({ slient: true })
    this.interval = setInterval(() => {
      this.checkUpdates({ slient: true })
    }, 3 * 60 * 60 * 1000)
  },
  beforeUnmount() {
    this.interval && clearInterval(this.interval)
  },
  methods: {
    async checkUpdates({ slient = false } = {}) {
      !slient && showToast('正在检查更新')
      const res = await bridge.invoke('checkUpdates')
      if (res.hasUpdates) {
        this.newInfo = {
          version: res.version,
          changelog: res.changelog
        }
        this.visible = true
      } else {
        !slient && showToast('当前已是最新版本')
      }
    },
    async update() {
      await bridge.invoke('deleteAllCache')
      location.reload()
    }
  }
}