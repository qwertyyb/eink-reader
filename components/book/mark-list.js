import { MarkStyles, MarkStyleIcons, MarkType } from "../../js/utils/mark.js"

export default {
  props: {
    markList: Array
  },
  template: /*html*/`
    <ul class="mark-list">
      <li class="mark-item"
        v-for="mark in markListWithStyle" :key="mark.id">
        <span class="material-symbols-outlined mark-icon"
          v-if="mark.type === MarkType.UNDERLINE"
          :style="mark.iconStyle">{{ MarkStyleIcons[mark.style] }}</span>
        <span class="material-icons-outlined mark-icon"
          v-else-if="mark.type === MarkType.THOUGHT"
          :style="mark.iconStyle">comment</span>
        <span class="remove-action" @click="$emit('remove', mark)">
          <span class="material-symbols-outlined remove-icon">delete</span>
          删除
        </span>
        <div class="mark-content">
          <p class="mark-thought" v-if="mark.type === MarkType.THOUGHT">{{ mark.thought }}</p>
          <div class="mark-quote-wrapper">
            <div class="pre-line"></div>
            <p class="mark-quote"><mark :style="mark.textStyle">{{ mark.text }}</mark></p>
          </div>
        </div>
      </li>
    </ul>
  `,
  data() {
    return {
      MarkStyleIcons,
      MarkType
    }
  },
  computed: {
    markListWithStyle() {
      return this.markList.map(mark => {
        return {
          ...mark,
          iconStyle: { color: mark.color },
          textStyle: mark.style === MarkStyles.HIGHLIGHT ? {
            backgroundColor: mark.color
          } : {
            textDecoration: `underline ${mark.style === MarkStyles.WAVE ? 'wavy' : 'solid'} ${mark.color}`,
            textUnderlineOffset: '0.3em'
          }
        }
      })
    }
  }
}