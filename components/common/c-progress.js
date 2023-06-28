export default {
  template: `<div class="c-progress">
    <div class="c-progress-prefix" @click="this.action('dec')"><slot name="prefix"></slot></div>
    <div class="c-progress-bar" @click="onTap" @touchmove="onMove" ref="bar">
      <div class="c-progress-line"></div>
      <div class="c-progress-indicator" :style="{left: left}"></div>
    </div>
    <div class="c-progress-suffix" @click="this.action('inc')"><slot name="suffix"></slot></div>
  </div>`,
  props: {
    modelValue: Number,
    min: Number,
    max: Number,
    step: Number,
  },
  computed: {
    left() {
      return `${(this.modelValue - this.min) / (this.max - this.min) * 100}%`
    }
  },
  methods: {
    onTap(e) {
      const { x, width } = this.$refs.bar.getBoundingClientRect();
      const percent = (e.clientX - x) / width
      const value = Math.round(percent * (this.max - this.min) / this.step) * this.step + this.min
      this.$emit('update:modelValue', value)
    },
    onMove(e) {
      const { clientX } = e.touches[0]
      const { x, width } = this.$refs.bar.getBoundingClientRect();
      const percent = (clientX - x) / width
      const value = Math.round(percent * (this.max - this.min) / this.step) * this.step + this.min
      this.$emit('update:modelValue', value)
    },
    action(action) {
      if (action === 'dec') {
        this.$emit('update:modelValue', Math.max(this.min, this.modelValue - this.step))
      } else if (action === 'inc') {
        this.$emit('update:modelValue', Math.min(this.max, this.modelValue + this.step))
      }
    }
  }
}