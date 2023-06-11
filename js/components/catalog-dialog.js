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
    visible() {
      if (!this.visible) return;
      this.refresh()
    }
  },
  methods: {
    async refresh() {
      // 等待页面更新完成
      await new Promise(resolve => setTimeout(resolve, 100))
      const index = Math.max(0, this.catalog.findIndex(item => `${item.id}` === `${this.selectedItem.id}`))
      this.$refs.catalog.scrollToIndex(index)
    }
  }
}