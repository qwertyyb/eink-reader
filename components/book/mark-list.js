import { MarkStyles, MarkStyleIcons } from "../../js/utils/mark.js"

export default {
  props: {
    markList: Array
  },
  template: /*html*/`
    <ul class="mark-list">
      <li class="mark-item"
        v-for="mark in markListWithStyle" :key="mark.id">
        <span class="material-icons-outlined mark-icon" :style="mark.iconStyle">{{ MarkStyleIcons[mark.style] }}</span>
        <div class="mark-content">
          <p class="mark-content">{{ mark.thought }}</p>
          <p class="mark-quote" :style="mark.textStyle">{{ mark.text }}</p>
        </div>
      </li>
    </ul>
  `,
  data() {
    return {
      MarkStyleIcons
    }
  },
  computed: {
    markListWithStyle() {
      return this.markList.map(mark => {
        return {
          ...mark,
          iconStyle: { color: mark.color },
          textStyle: mark.style === MarkStyles.HIGHLIGHT ? { backgroundColor: mark.color } : { borderBottom: `1px solid ${mark.color}` }
        }
      })
    }
  }
}