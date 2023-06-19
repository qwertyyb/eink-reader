import CDialog from './c-dialog.js'

export default {
  components: {
    CDialog
  },
  props: {
    visible: Boolean,
  },
  template: /*html*/`
    <c-dialog :visible="visible" @close="$emit('close')" class="about-dialog">
      <div class="about">
        <img class="logo" src="https://cdn.jsdelivr.net/gh/qwertyyb/eink-reader/assets/icons/128.png" />
        <h3 class="name">EInk Reader</h3>
        <p class="version">v202306182205</p>
      </div>
    </c-dialog>
  `
}