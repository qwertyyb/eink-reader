import { computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import CDialog from './c-dialog.js'

export default {
  template: `<div class="c-select">
    <div class="c-select-label" @click="optionsVisible=true">
      <slot name="label" :label="valueLabel">{{ valueLabel }}</slot>
    </div>
    <c-dialog :visible="optionsVisible" @close="optionsVisible=false" class="c-select-dialog">
      <div class="c-option-list">
        <slot></slot>
      </div>
    </c-dialog>
  </div>`,
  components: {
    CDialog
  },
  props: {
    value: {
      type: [Number, String]
    }
  },
  data() {
    return {
      valueLabel: '方正宋体',
      optionsVisible: false,
    }
  },
  provide() {
    return {
      selectedValue: computed(() => this.value)
    }
  },
  methods: {
    onOptionSelected(value, options = {}) {
      this.$emit('input', value)
      this.valueLabel = options.label
      this.optionsVisible = false
    }
  }
}