export default {
  props: {
    book: Object,
    width: String,
    height: String,
  },
  template: /*html*/`
    <div class="book-cover" :style="{width,height}">
      {{ book.title }}
      <div class="download-progress-size" v-if="!book.downloaded && book.total && book.progress">
        {{ book.fProgress }}
      </div>
      <div class="download-progress-percent" v-if="!book.downloaded && book.total && book.progress">
        ({{ Math.round(book.progress/book.total * 100) + '%' }})
      </div>
      <div class="downloaded-label" v-if="book.downloaded">已下载</div>
    </div>
  `
}