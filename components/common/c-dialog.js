export default {
  template: /*html*/`
  <transition name="fade-in"
    @enter="contentVisible=true">
    <div class="c-dialog" v-if="containerVisible">
      <div class="mask" @pointerdown="$emit('close')"></div>
      <transition :name="anim" @after-leave="containerVisible=false">
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
      } else {
        this.contentVisible = false
      }
    }
  }
}