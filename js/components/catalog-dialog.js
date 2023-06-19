export default {
  template: document.querySelector('#components .catalog').outerHTML,
  props: {
    visible: Boolean,
    catalog: {
      type: Array,
      default: () => []
    },
    selectedIndex: {
      type: Number,
      default: 0
    },
  },
  data() {
    return {
      anim: '', // slide-right | slide-left
      zIndex: -1,
      maskAnim: '', // fade-in | fade-out
    }
  },
  watch: {
    selectedIndex() {
      this.refresh()
    },
    visible() {
      if (this.visible) {
        this.zIndex = 10
        this.anim = 'slide-right'
        this.maskAnim = 'fade-in'
        setTimeout(() => {
          this.anim = ''
          this.maskAnim = ''
        }, 200)
      } else {
        this.anim = 'slide-left'
        this.maskAnim = 'fade-out'
        setTimeout(() => {
          this.zIndex = -1
          this.anim = ''
          this.maskAnim = ''
        }, 200)
      }
    }
  },
  methods: {
    async refresh() {
      // 等待页面更新完成
      await this.$nextTick()
      this.$refs.catalog.scrollToIndex(Math.max(0, this.selectedIndex - 2))
    },
  }
}