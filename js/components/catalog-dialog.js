import { env } from "../utils/env.js"

export default {
  template: /*html*/`
    <div class="catalog" :style="{ zIndex: zIndex}">
      <div class="mask" :class="maskAnim" @click="$emit('close')"></div>
      <div class="catalog-content" :class="anim" ref="list-wrapper">
        <virtual-list
          class="catalog-content-wrapper"
          data-key="id"
          :data-sources="catalog"
          ref="catalog"
          :estimate-size="48">
          <template #="{ source, index }">
            <div class="catalog-item"
              @click="$emit('to-catalog-item', source, index)"
              :class="{active: index === selectedIndex}"
              :data-catalog-id="source.id">
              <div class="catalog-label">{{ source.title }}</div>
            </div>
          </template>
        </virtual-list>
      </div>
    </div>
  `,
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
        this.anim = 'slide-right'
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
    initHammer() {
      const hammer = new Hammer(this.$refs['list-wrapper'])
      hammer.on('swipeleft', () => this.$emit('close'))
      this.hammer = hammer
    }
  }
}