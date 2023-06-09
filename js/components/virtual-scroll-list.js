export default {
  name: 'VirtualScrollList',
  template: `
    <div class="virtual-scroll-list-wrapper">
      <div class="virtual-scroll-list"
        ref="list"
        :style="{paddingTop: paddingTop + 'px', paddingBottom: paddingBottom + 'px'}">
        <div class="virtual-scroll-item"
          v-for="(item, index) in visibleList"
          :data-index="index + startIndex"
          :key="index + startIndex">
          <slot :item="item" :index="index"></slot>
        </div>
      </div>
    </div>
  `,
  props: {
    list: Array,
  },
  data() {
    return {
      startIndex: 0,
      paddingTop: 0,
      paddingBottom: 0,
    }
  },
  computed: {
    visibleList() {
      return this.list.slice(this.startIndex)
    }
  },
  mounted() {
    this.$el.addEventListener('scroll', this.scrollHandler)
  },
  beforeUnmount() {
    this.$el.removeEventListener('scroll', this.scrollHandler)
  },
  methods: {
    scrollHandler() {
      const { top, bottom, height } = this.$el.getBoundingClientRect()
      const minY = top - height
      const maxY = bottom + height
      const { top: listTop } = this.$refs.list.getBoundingClientRect()
      const children = Array.from(this.$refs.list.children)
      let startIndex = 0
      let endIndex = 0
      let paddingTop = 0
      console.log(children)
      children.forEach(child => {
        const { top, bottom } = child.getBoundingClientRect()

        // 可视区域上方
        if (bottom < minY) {
          startIndex = +child.dataset.index
          paddingTop = bottom - listTop
          console.log(bottom)
        } else if (top > maxY) {
          endIndex = +child.dataset.index
          return
        }
      })
      
      console.log('startIndex', startIndex, minY, paddingTop, listTop)
      console.log('endIndex', endIndex)
      this.startIndex = startIndex
      this.paddingTop = paddingTop
    }
  }
}