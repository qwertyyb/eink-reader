import BookCover from "./book-cover.js"

export default {
  props: {
    book: Object,
    enableAnim: Boolean,
    originRect: {
      type: Object,
      default: () => ({
        top: 0,
        left: 123,
        width: 103,
        height: 137
      })
    }
  },
  components: {
    BookCover
  },
  template: /*html*/`
    <div class="book-cover-animation" :class="{done: done}">
      <div class="book-cover-animation-wrapper" ref="bw">
        <div class="book-contents-wrapper" ref="cw">
          <div class="book-contents" ref="contents">
            <slot></slot>
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
      done: false
    }
  },
  mounted() {
    this.openBook()
  },
  methods: {
    async openBook() {
      if (this.enableAnim) {
        // 动画1. 把从书架上拿出来
        const { top: pt, left: pl, width: pw, height: ph } = document.documentElement.getBoundingClientRect()
        const { top, left, width, height } = this.originRect
        const offsetX = (pw / 2) + 'px'
        const offsetY = (ph / 2) + 'px'
        const coverScale = width / pw
        this.coverScale = coverScale
        const shelfBook = document.querySelector(`.book-list .book-item[data-book-id="${this.book.id}"]`)
        shelfBook && (shelfBook.style.opacity = 0)
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
        // this.$refs.bw.style.transformOrigin = 'top left'
        this.$refs.bw.style.transform = `none`
        this.done = true
        shelfBook && (shelfBook.style.opacity = '1')
      } else {
        this.$refs.cover.style.transform = 'rotateY(-180deg)'
        this.done = true
      }

      this.$refs.bw.style.transform = 'none'
      this.$refs.contents.style.transform = 'none'
    },
    async closeBook() {
      this.done = false
      const { top: pt, left: pl, width: pw, height: ph } = document.documentElement.getBoundingClientRect()
      const { top, left, width, height } = this.originRect
      const offsetX = (pw / 2) + 'px'
      const offsetY = (ph / 2) + 'px'
      const coverScale = width / pw
      this.coverScale = coverScale
      const shelfBook = document.querySelector(`.book-list .book-item[data-book-id="${this.book.id}"]`)
      shelfBook && (shelfBook.style.opacity = 0)

      // 动画3. 缩放书本内容
      await this.$refs.bw.animate([
        { transform: `scale(0.5) translate(${offsetX}, ${offsetY})` },
        { transform: `none`}
      ], { duration: 400, easing: 'ease-out', direction: 'reverse' }).finished
      this.$refs.bw.style.transform = `scale(0.5) translate(${offsetX}, ${offsetY})`

      // 动画2. 翻开书封面
      await this.$refs.cover.animate([
        { transform: `rotateY(0)` },
        { transform: `rotateY(-180deg)` }
      ], { duration: 500, easing: 'ease', direction: 'reverse' }).finished
      this.$refs.cover.style.transform = 'rotateY(0)'

      await this.$refs.bw.animate([
        { transform: `scale(${coverScale}) translate(${left/coverScale}px, ${top/coverScale}px)`, },
        { transform: `scale(0.5) translate(${offsetX}, ${offsetY})` },
      ], { duration: 400, easing: 'ease', direction: 'reverse' }).finished
      this.$refs.bw.style.transform = `scale(${coverScale}) translate(${left/coverScale}px, ${top/coverScale}px)`

      shelfBook && (shelfBook.style.opacity = '1')

      this.$router.back()
    }
  }
}