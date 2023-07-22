import { services } from "../../js/services/index.js"
import { marks } from "../../js/storage.js"
import MarkList from "./mark-list.js"

export default {
  components: {
    MarkList
  },
  template: /*html*/`
    <div class="marks-viewer">
      <div class="mark-chapter" v-for="chapter in chapterMarkList" :key="chapter.id">
        <h4 class="mark-chapter-title">{{ chapter.title }}</h4>
        <mark-list :mark-list="chapter.markList"></mark-list>
      </div>
    </div>
  `,
  inject: ['book', 'chapterList'],
  data() {
    return {
      chapterMarkList: []
    }
  },
  created() {
    this.getMarkList()
  },
  methods: {
    async getMarkList() {
      const markList = await marks.getListByBook(this.book.id)
      const chapterLabels = this.chapterList.reduce((acc, chapter) => {
        return {
          ...acc,
          [chapter.cursor]: chapter.title
        }
      }, {})
      const chapterIdMarkList = markList.reduce((acc, mark) => {
        if (!acc[mark.chapterId]) {
          acc[mark.chapterId] = []
        }
        acc[mark.chapterId].push(mark)
        return acc
      }, {})
      const chapterMarkList = Object.keys(chapterIdMarkList).map(chapterId => {
        return {
          id: chapterId,
          title: chapterLabels[chapterId] || '未知章节',
          markList: chapterIdMarkList[chapterId]
        }
      }).sort((a, b) => a.chapterId - b.chapterId)
      
      this.chapterMarkList = chapterMarkList
      console.log(chapterMarkList)
    }
  }
}