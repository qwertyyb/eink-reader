import BookCover from "./book-cover.js"
import { coverSize } from "../../constant.js"

export default {
  name: 'book-cover-animation',
  props: {
    server: String,
    id: String,
    book: Object,
    bookPosition: {
      type: Object,
      default: () => ({
        top: 0,
        left: 0,
      })
    },
  },
  components: {
    BookCover
  },
  template: /*html*/`
    <div class="book-cover-animation" :class="{done: done}">
      <div class="book-cover-animation-wrapper" ref="bw">
        <div class="book-contents-wrapper" ref="cw">
          <div class="book-contents" ref="contents">
            <router-view :close="closeBook"></router-view>
          </div>
        </div>
        <div class="book-cover-wrapper" ref="cover">
          <book-cover
            :book="book"
            :style="{
              transformOrigin: 'top left',
              transform: 'scale(' + (1/coverScale) + ')'
            }"></book-cover>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      coverScale: 0.25,
      done: false,
      enableAnim: true,
    }
  },
  mounted() {
    this.openBook()
  },
  methods: {
    async openBook() {
      if (this.enableAnim) {
        // 动画1. 把从书架上拿出来
        const { width: pw, height: ph } = document.documentElement.getBoundingClientRect()
        const { top, left } = this.bookPosition
        const offsetX = (pw / 2) + 'px'
        const offsetY = (ph / 2) + 'px'
        const coverScale = coverSize.width / pw
        this.coverScale = coverScale
        await this.$refs.bw.animate([
          { transform: `scale(${coverScale}) translate(${left/coverScale}px, ${top/coverScale}px)`, },
          { transform: `scale(0.5) translate(${offsetX}, ${offsetY})` },
        ], { duration: 400, easing: 'ease' }).finished
        this.$refs.bw.style.transform = `scale(0.5) translate(${offsetX}, ${offsetY})`

        // 动画2. 翻开书封面
        await this.$refs.cover.animate([
          { transform: `rotateY(0)` },
          { transform: `rotateY(-180deg)` }
        ], { duration: 500, easing: 'ease' }).finished
        this.$refs.cover.style.transform = 'rotateY(-180deg)'

        // // 动画3. 缩放书本内容
        await this.$refs.bw.animate([
          { transform: `scale(0.5) translate(${offsetX}, ${offsetY})` },
          { transform: `none`}
        ], { duration: 400, easing: 'ease-out' }).finished
        this.$refs.bw.style.transform = `none`
        this.done = true
      } else {
        this.$refs.cover.style.transform = 'rotateY(-180deg)'
        this.done = true
      }

      this.$refs.bw.style.transform = 'none'
      this.$refs.contents.style.transform = 'none'
    },
    async closeBook() {
      this.done = false
      const { width: pw, height: ph } = document.documentElement.getBoundingClientRect()
      const { top, left } = this.bookPosition
      const offsetX = (pw / 2) + 'px'
      const offsetY = (ph / 2) + 'px'
      const coverScale = coverSize.width / pw
      this.coverScale = coverScale

      // 动画3. 缩放书本内容
      await this.$refs.bw.animate([
        { transform: `scale(0.5) translate(${offsetX}, ${offsetY})` },
        { transform: `none`}
      ], { duration: 300, easing: 'ease-out', direction: 'reverse' }).finished
      this.$refs.bw.style.transform = `scale(0.5) translate(${offsetX}, ${offsetY})`

      // 动画2. 翻开书封面
      await this.$refs.cover.animate([
        { transform: `rotateY(0)` },
        { transform: `rotateY(-180deg)` }
      ], { duration: 600, easing: 'ease', direction: 'reverse' }).finished
      this.$refs.cover.style.transform = 'rotateY(0)'

      await this.$refs.bw.animate([
        { transform: `scale(${coverScale}) translate(${left/coverScale}px, ${top/coverScale}px)`, },
        { transform: `scale(0.5) translate(${offsetX}, ${offsetY})` },
      ], { duration: 300, easing: 'ease', direction: 'reverse' }).finished
      this.$refs.bw.style.transform = `scale(${coverScale}) translate(${left/coverScale}px, ${top/coverScale}px)`
    }
  }
}