import { env } from "../../js/utils/env.js"

export default {
  template: /*html*/`
    <div class="catalog" :style="{ zIndex: zIndex}">
      <div class="mask" :class="maskAnim" @click="$emit('close')"></div>
      <div class="catalog-content" :class="anim" ref="list-wrapper">
        <slot></slot>
      </div>
    </div>
  `,
  props: {
    visible: Boolean,
  },
  data() {
    return {
      anim: '', // slide-right | slide-left
      zIndex: -1,
      maskAnim: '', // fade-in | fade-out
    }
  },
  mounted() {
    this.initHammer()
  },
  beforeUnmount() {
    this.hammer && this.hammer.destroy()
  },
  watch: {
    selectedIndex() {
      this.refresh()
    },
    visible() {
      if (this.visible) {
        this.zIndex = 10
        if (env.isInk()) {
          return
        }
        this.anim = 'slide-left'
        this.maskAnim = 'fade-in'
        setTimeout(() => {
          this.anim = ''
          this.maskAnim = ''
        }, 200)
      } else {
        if (env.isInk()) {
          this.zIndex = -1
          return
        }
        this.anim = 'slide-left-leave'
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
    // async refresh() {
    //   // 等待页面更新完成
    //   await this.$nextTick()
    //   this.$refs.catalog.scrollToIndex(Math.max(0, this.selectedIndex - 2))
    // },
    initHammer() {
      const hammer = new Hammer(this.$refs['list-wrapper'])
      hammer.on('swipeleft', () => this.$emit('close'))
      this.hammer = hammer
    }
  }
}