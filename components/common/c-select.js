import { computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import CDialog from './c-dialog.js'

export default {
  template: `<div class="c-select">
    <div class="c-select-label" @click="optionsVisible=true">
      <slot name="label" :value="modelValue">{{ label }}</slot>
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
    modelValue: {
      type: [Number, String]
    },
    label: {
      type: String,
    }
  },
  data() {
    return {
      optionsVisible: false,
    }
  },
  provide() {
    return {
      [Symbol.for('c-select:modelValue')]: computed(() => this.modelValue),
      [Symbol.for('c-select:onOptionSelected')]: this.onOptionSelected,
    }
  },
  methods: {
    onOptionSelected(value) {
      this.$emit('update:modelValue', value)
      this.optionsVisible = false
    }
  }
}