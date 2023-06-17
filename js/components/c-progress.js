export default {
  template: `<div class="c-progress" @click="onTap" @touchmove="onMove">
    <div class="c-progress-line"></div>
    <div class="c-progress-indicator" :style="{left: left}"></div>
  </div>`,
  props: {
    modelValue: Number,
    steps: Array,
  },
  computed: {
    left() {
      const index = Math.max(0, this.steps.indexOf(this.modelValue))
      return `${index / (this.steps.length - 1) * 100}%`
    }
  },
  methods: {
    onTap(e) {
      const { x, width } = this.$el.getBoundingClientRect();
      const index = Math.round((e.clientX - x) / width * (this.steps.length - 1))
      this.$emit('update:modelValue', this.steps[index])
    },
    onMove(e) {
      const { x, width } = this.$el.getBoundingClientRect();
      const { clientX } = e.touches[0]
      const index = Math.round((clientX - x) / width * (this.steps.length - 1))
      this.$emit('update:modelValue', this.steps[index])
    }
  }
}