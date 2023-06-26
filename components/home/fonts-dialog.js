import CDialog from "../common/c-dialog.js";
import { bridge } from '../../register-sw.js'

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

const fonts = [
  {
    family: '思源宋体',
    source: 'https://cdn.jsdelivr.net/gh/qwertyyb/eink-reader/css/fonts/SourceHanSerifCN-VF.otf.woff2'
  },
  {
    family: '方正书宋',
    source: 'https://cdn.jsdelivr.net/gh/qwertyyb/eink-reader/css/fonts/FZSSSC.ttf',
  },
  {
    family: '方正仿宋',
    source: 'https://cdn.jsdelivr.net/gh/qwertyyb/eink-reader/css/fonts/FZFSSC.ttf',
  },
  {
    family: '方正黑体',
    source: 'https://cdn.jsdelivr.net/gh/qwertyyb/eink-reader/css/fonts/FZHTSC.ttf',
  },
  {
    family: '方正楷体',
    source: 'https://cdn.jsdelivr.net/gh/qwertyyb/eink-reader/css/fonts/FZKTSC.ttf',
  },
  {
    family: '落霞文楷',
    source: 'https://cdn.jsdelivr.net/gh/lxgw/LxgwWenKai/fonts/TTF/LXGWWenKai-Light.ttf',
    fontWeight: 100,
  },
  {
    family: '落霞文楷',
    source: 'https://cdn.jsdelivr.net/gh/lxgw/LxgwWenKai/fonts/TTF/LXGWWenKai-Regular.ttf',
    fontWeight: 400,
  },
  {
    family: '落霞文楷',
    source: 'https://cdn.jsdelivr.net/gh/lxgw/LxgwWenKai/fonts/TTF/LXGWWenKai-Bold.ttf',
    fontWeight: 700,
  },
  {
    family: '落霞文楷 屏幕阅读版',
    source: 'https://cdn.jsdelivr.net/gh/qwertyyb/eink-reader/css/fonts/LXGWWenKaiGBScreenR.ttf',
  },
  {
    family: '975圆体',
    source: 'https://cdn.jsdelivr.net/gh/lxgw/975maru/TTF%20SC/975MaruSC-Regular.ttf',
    fontWeight: 200
  },
  {
    family: '975圆体',
    source: 'https://cdn.jsdelivr.net/gh/lxgw/975maru/TTF%20SC/975MaruSC-Medium.ttf',
    fontWeight: 500
  },
  {
    family: '975圆体',
    source: 'https://cdn.jsdelivr.net/gh/lxgw/975maru/TTF%20SC/975MaruSC-Bold.ttf',
    fontWeight: 800
  }
]

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
            <span class="font-label">{{ v.family }}</span>
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
      fonts: {}
    }
  },
  watch: {
    visible() {
      if (!this.visible) return;
      this.refresh()
    }
  },
  methods: {
    async refresh() {
      const cachedUrls = await bridge.invoke('checkCachedUrls', fonts.map(font => font.source))
      this.fonts = fonts.reduce((obj, font) => {
        if (!obj[font.family]) {
          obj[font.family] = {
            family: font.family,
            fonts: [],
            status: 'loaded'
          }
        }
        obj[font.family].fonts.push(font)
        const originStatus = this.fonts[font.family] && this.fonts[font.family].status
        obj[font.family].status = obj[font.family].fonts.every(font => cachedUrls[font.source]) ? 'loaded' : originStatus === 'loading' ? 'loading' : 'unloaded'
        return obj
      }, {})
    },
    async download(font) {
      font.status = 'loading'
      const fontFaceList = [...document.fonts.values()].filter(fontFace => fontFace.family === font.family)
      await Promise.all(fontFaceList.map(item => item.load()))
      this.refresh()
    },
    downloadAll() {
      Object.values(this.fonts)
        .filter(item => item.status !== 'loaded')
        .forEach(this.download)
    }
  }
}