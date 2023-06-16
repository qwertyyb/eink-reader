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
  watch: {
    selectedIndex() {
      this.refresh()
    },
    list() {
      return this.catalog.map((item, index) => {
        return {
          ...item,
          selected: index === this.selectedIndex
        }
      })
    }
  },
  methods: {
    async refresh() {
      // 等待页面更新完成
      await this.$nextTick()
      this.$refs.catalog.scrollToIndex(Math.max(0, this.selectedIndex - 2))
    }
  }
}