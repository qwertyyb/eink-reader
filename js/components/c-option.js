export default {
  template: `<div class="c-option" :class="{selected: selected}" @click="select"><slot></slot></div>`,
  props: {
    value: [Number, String],
    label: [Number, String]
  },
  inject: ['selectedValue', 'onOptionSelected', 'updateSelectedLabel'],
  computed: {
    selected() {
      return this.selectedValue === this.value
    }
  },
  watch: {
    selected() {
      this.updateSelectLabel()
    }
  },
  mounted() {
    this.updateSelectLabel()
  },
  methods: {
    select() {
      this.onOptionSelected && this.onOptionSelected(this.value, { label: this.label || this.$el.textContent.trim() })
    },
    updateSelectLabel() {
      if (this.selected) {
        this.updateSelectedLabel(this.label || this.$el.textContent.trim())
      }
    }
  }
}