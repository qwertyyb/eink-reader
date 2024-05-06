import { services } from "../../js/services/index.js"
import { parseCatalog } from "../../js/txt-file.js"
import { showToast } from "../../js/utils/index.js"
import CDialog from "../common/c-dialog.js"

export default {
  props: {
    visible: Boolean,
  },
  template: /*html*/`
    <c-dialog :visible="visible"
      @open="onPopOpened"
      @close="$emit('close')" class="catalog-setting-dialog">
      <div class="form-item">
        <label for="level1" class="form-item-label">一级目录</label>
        <input type="text" id="level1" class="form-item-input" v-model="level1" />
      </div>
      <div class="form-item">
        <label for="level2" class="form-item-label">二级目录</label>
        <input type="text" id="level2" class="form-item-input" v-model="level2" />
      </div>
      <div class="form-item">
        <button class="submit-btn" @click="submit">保存</button>
      </div>
    </c-dialog>
  `,
  components: {
    CDialog,
  },
  inject: ['book'],
  data() {
    return {
      level1: '^第.+章',
      level2: '',
    }
  },
  methods: {
    async onPopOpened() {
      const { meta } = await services.local.getBook(this.book.id)
      this.level1 = meta?.catalog?.level1 || '^第.+章'
      this.level2 = meta?.catalog?.level2 || ''
    },
    async submit() {
      const { content, ...rest } = await services.local.getBook(this.book.id)
      const regList = [this.level1, this.level2].filter(item => item).map(item => new RegExp(item))
      const catalog = parseCatalog(content, { regList })
      await services.local.updateBook(this.book.id, {
        ...rest,
        content,
        catalog,
        meta: {
          ...rest.meta,
          catalog: { level1: this.level1, level2: this.level2 }
        }
      })
      showToast('目录已更新')
    }
  }
}