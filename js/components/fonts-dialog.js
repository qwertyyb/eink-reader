import CDialog from "./c-dialog.js";

const fontLabel = {
  SYST: '思源宋体',
  FZSS: '方正书宋',
  FZFS: '方正仿宋',
  FZHT: '方正黑体',
  FZKT: '方正楷体',
  LXWK: '落霞文楷',
  'LXWK SCREEN': '落霞文楷 屏幕阅读版',
  '975MARU': '975圆体'
}

export default {
  components: {
    CDialog
  },
  props: {
    visible: Boolean,
  },
  template: /*html*/`
    <c-dialog class="fonts-dialog" :visible="visible" @close="$emit('close')">
      <div class="fonts-wrapper">
        <ul class="fonts">
          <li class="font-item" v-for="(v, k) in fonts"
            :key="k">
            <span class="font-label">{{ v.label }}</span>
            <span class="material-icons font-status"
              v-if="v.status !== 'loaded'"
              @click="download(v)">{{ v.status === 'loading' ? 'downloading' : 'download' }}</span>
          </li>
        </ul>
        <div class="download-all-btn" @click="downloadAll">下载全部</div>
      </div>
    </c-dialog>
  `,
  data() {
    return {
      fonts: []
    }
  },
  created() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.fonts = [...document.fonts.values()].reduce((obj, font) => {
        const label = fontLabel[font.family]
        if (!label) return obj;
        if (!obj[font.family]) {
          obj[font.family] = {
            label,
            fonts: [],
            status: 'loaded'
          }
        }
        obj[font.family].fonts.push(font)
        obj[font.family].status = obj[font.family].fonts.every(font => font.status === 'loaded') ? 'loaded' : 'unloaded'
        return obj
      }, {})
    },
    download(font) {
      font.status = 'loading'
      Promise.all(font.fonts.map(item => item.load())).then(() => {
        this.refresh()
      })
    },
    downloadAll() {
      Object.values(this.fonts)
        .filter(item => item.status !== 'loaded')
        .forEach(this.download)
    }
  }
}