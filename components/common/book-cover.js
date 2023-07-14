export default {
  props: {
    book: Object,
    width: String,
    height: String,
  },
  template: /*html*/`
    <div class="book-cover" :style="{width,height}">
      <img class="book-cover-img" :src="book.cover" :alt="book.title" />
    </div>
  `
}