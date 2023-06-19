export default {
  template: /*html*/`
  <transition name="fade-in">
    <div class="c-dialog" v-if="containerVisible">
      <div class="mask" @click="$emit('close')"></div>
      <transition :name="anim">
        <div class="c-dialog-content" v-if="contentVisible">
          <slot></slot>
        </div>
      </transition>
    </div>
  </transition>
  `,
  props: {
    visible: Boolean,
    anim: {
      type: String,
      default: 'slide-up',
    }
  },
  data() {
    return {
      containerVisible: this.visible,
      contentVisible: this.visible
    }
  },
  watch: {
    visible() {
      if (this.visible) {
        this.containerVisible = true
        setTimeout(() => {
          this.contentVisible = this.containerVisible
        })
      } else {
        this.contentVisible = false
        setTimeout(() => {
          this.containerVisible = false
        }, 200)
      }
    }
  }
}