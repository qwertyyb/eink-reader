export default {
  template: `<div class="c-option" :class="{selected: selected}" @click="select"><slot></slot></div>`,
  props: {
    value: [Number, String],
    label: [Number, String]
  },
  inject: ['selectedValue'],
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
      this.$parent && this.$parent.$parent.onOptionSelected(this.value, { label: this.label || this.$el.textContent.trim() })
    },
    updateSelectLabel() {
      if (this.selected) {
        this.$parent.$parent.valueLabel = this.label || this.$el.textContent.trim()
      }
    }
  }
}