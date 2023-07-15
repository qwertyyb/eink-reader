export default {
  template: `<div class="c-option" :class="{selected: selected}" @click="select"><slot></slot></div>`,
  props: {
    value: [Number, String]
  },
  inject: {
    'selectedValue': Symbol.for('c-select:modelValue'),
    'onOptionSelected': Symbol.for('c-select:onOptionSelected')
  },
  computed: {
    selected() {
      return this.selectedValue === this.value
    }
  },
  methods: {
    select() {
      this.onOptionSelected && this.onOptionSelected(this.value)
    }
  }
}