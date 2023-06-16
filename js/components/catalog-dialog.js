export default {
  template: document.querySelector('#components .catalog').outerHTML,
  props: {
    visible: Boolean,
    catalog: {
      type: Array,
      default: () => []
    },
    selectedItem: {
      type: Object,
      default: () =>({})
    }
  },
  watch: {
    selectedItem() {
      this.refresh()
    }
  },
  methods: {
    async refresh() {
      // 等待页面更新完成
      await this.$nextTick()
      const index = Math.max(0, this.catalog.findIndex(item => `${item.id}` === `${this.selectedItem.id}`) - 2)
      this.$refs.catalog.scrollToIndex(index)
    }
  }
}