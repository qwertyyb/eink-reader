import { marks } from "../storage.js"
import { getChapterOffset } from "./index.js"

export class ChapterMarkRange {
  start = 0
  length = 0
  constructor(start = 0, length = 0) {
    this.start = start
    this.length = length
  }

  static fromRange(range) {
    const chapterStartOffset = getChapterOffset({ node: range.startContainer, offset: range.startOffset })
    const chapterEndOffset = getChapterOffset({ node: range.endContainer, offset: range.endOffset })
    return new ChapterMarkRange(chapterStartOffset, chapterEndOffset - chapterStartOffset)
  }
}

export const MarkType = {
  UNKNOWN: 0,
  UNDERLINE: 1,
  THOUGHT: 2,
}

export class MarkData {
  id = 0
  bookId = 0
  chapterId = 0
  text = ''
  /** @type ChapterMarkRange */
  range = null
  type = MarkType.UNKNOWN
  thought = ''
}

export class ChapterMark {
  bookId = 0
  chapterId = 0
  /** @type MarkData[] */
  markList = []
  markInstance = null
  constructor(bookId, chapterId, container) {
    this.container = container
    this.bookId = bookId
    this.chapterId = chapterId
    this.markInstance = new Mark(this.container)
  }
  render() {
    this.markInstance.unmark()
    this.markList.forEach(markData => {
      const { range, id, type } = markData
      const className = type === MarkType.UNDERLINE ? 'underline' : 'thought'
      this.markInstance.markRanges([range], {
        className,
        each(markedDom, range) {
          console.log(markedDom)
          markedDom.dataset.id = id
          markedDom.dataset.type = type
        }
      })
    })
    return this.container
  }
  async refresh() {
    this.markList = await marks.getListByChapterAndBook(this.bookId, this.chapterId)
    return this.render()
  }
  /**
   * 
   * @param {MarkData} markData 待新增的markData
   */
  async mark(markData) {
    await marks.add(markData)
    await this.refresh()
  }
  /**
   * 
   * @param {number} id Mark id
   */
  async unmark(id) {
    await marks.remove(id)
    await this.refresh()
  }
}