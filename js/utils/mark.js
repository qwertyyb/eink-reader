import { marks } from "../storage.js"
import { getChapterOffset, getParagraphPoint } from "./index.js"

export class ChapterMarkRange {
  start = 0
  length = 0
  markStart = { cursor: 0, offset: 0 }
  markEnd = { cursor: 0, offset: 0 }
  constructor(range) {
    const chapterStartOffset = getChapterOffset({ node: range.startContainer, offset: range.startOffset })
    const chapterEndOffset = getChapterOffset({ node: range.endContainer, offset: range.endOffset })
    this.start = chapterStartOffset
    this.length = chapterEndOffset - chapterStartOffset
    this.markStart = getParagraphPoint({ node: range.startContainer, offset: range.startOffset })
    this.markEnd = getParagraphPoint({ node: range.endContainer, offset: range.endOffset })
  }
}

export const MarkType = {
  UNKNOWN: 0,
  UNDERLINE: 1,
  THOUGHT: 2,
}

export const MarkStyles = {
  SOLID: 1,
  WAVE: 2,
  HIGHLIGHT: 3,
}

export const MarkStyleIcons = {
  [MarkStyles.SOLID]: 'format_underlined',
  [MarkStyles.WAVE]: 'format_underlined_squiggle',
  [MarkStyles.HIGHLIGHT]: 'texture'
}

export const MarkColors = {
  YELLOW: 'yellow',
  BLUE: 'blue',
  PURPLE: 'purple',
  GREEN: 'green',
  RED: 'red'
}

export class MarkData {
  bookId = 0
  chapterId = 0
  text = ''
  /** @type ChapterMarkRange */
  range = null
  type = MarkType.UNKNOWN
  thought = ''
  style = MarkStyles.SOLID
  color = MarkColors.BLUE

  constructor({
    range, bookId, chapterId
  }) {
    this.range = new ChapterMarkRange(range)
    this.bookId = bookId
    this.chapterId = chapterId
    this.text = range.toString()
  }
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
      const { range, id, type, color, style } = markData
      const className = type === MarkType.UNDERLINE ? 'underline' : 'thought'
      this.markInstance.markRanges([range], {
        className,
        each(markedDom, range) {
          markedDom.dataset.id = id
          markedDom.dataset.type = type
          if (style === MarkStyles.HIGHLIGHT) {
            markedDom.style.backgroundColor = color || ''
          } else {
            markedDom.style.cssText = `text-decoration: underline ${style === MarkStyles.WAVE ? 'wavy' : 'solid'} ${color};text-underline-offset: 0.3em`
          }
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