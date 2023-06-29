import { env } from "../../js/utils/env.js"
import { getSettings, saveAllSettings } from "../../js/utils/settings.js"
import CProgress from "../common/c-progress.js"
import CSelect from "../common/c-select.js"
import COption from "../common/c-option.js"
import CatalogDialog from "./catalog-dialog.js"
import { DarkMode, ReadSpeak, AutoPlay } from "../../js/actions/index.js"
import { getNearestTopEl } from "../../js/utils/index.js"

export default {
  components: {
    CProgress,
    CSelect,
    COption,
    CatalogDialog
  },
  template: /*html*/`
    <div class="control-wrapper">
      <transition name="slide-down">
        <div class="navigator" v-if="panelVisible">
          <div class="material-icons back-to-index"
            @click="$router.replace('/')">arrow_back</div>
        </div>
      </transition>

      <catalog-dialog :visible="visiblePanel==='catalog'"
        @close="visiblePanel=null">
        <slot name="catalog"></slot>
      </catalog-dialog>

      <div class="content-container" ref="content" @touchstart="touchstartHandler">
        <slot :settings="settings"></slot>
      </div>

      <transition name="slide-up">
        <div class="control" v-if="panelVisible">
          <div class="control-panel play-panel" data-target-control="autoPlay" v-if="visiblePanel === 'autoPlay'">
            <div class="speed">
              <c-progress
                :min="10"
                :max="200"
                :step="10"
                style="flex: 1"
                @change="changeAutoPlayDuration"
                v-model="settings.autoPlayDuration">
                <template v-slot:prefix>-</template>
                <template v-slot:suffix>+</template>
              </c-progress>
            </div>
          </div>

          <div class="control-panel font-panel" data-target-control="font" v-if="visiblePanel === 'font'">
            <div class="font-weight">
              <c-progress
                :min="100"
                :max="900"
                :step="100"
                :steps="[100, 200, 300, 400, 500, 600, 700, 800, 900]"
                style="flex: 1"
                v-model="settings.fontWeight">
                <template v-slot:prefix>B-</template>
                <template v-slot:suffix>B+</template>
              </c-progress>
            </div>
            <div class="font-size">
              <c-progress
                :min="10"
                :max="30"
                :step="1"
                style="flex: 1"
                v-model="settings.fontSize">
                <template v-slot:prefix>A-</template>
                <template v-slot:suffix>A+</template>
              </c-progress>
            </div>
            <div class="font-family">
              <c-select :value="settings.fontFamily" @input="settings.fontFamily=$event">
                <template v-slot:label="{ label }">
                  <div class="font-family-label" :data-font="settings.fontFamily">{{ label }}</div>
                </template>
                <c-option value="思源宋体" data-font="思源宋体">思源宋体</c-option>
                <c-option value="方正书宋" data-font="方正书宋">方正书宋</c-option>
                <c-option value="方正仿宋" data-font="方正仿宋">方正仿宋</c-option>
                <c-option value="方正黑体" data-font="方正黑体">方正黑体</c-option>
                <c-option value="方正楷体" data-font="方正楷体">方正楷体</c-option>
                <c-option value="落霞文楷" data-font="落霞文楷">落霞文楷</c-option>
                <c-option value="落霞文楷 屏幕阅读版" data-font="落霞文楷 屏幕阅读版">落霞文楷 屏幕阅读版</c-option>
                <c-option value="975圆体" data-font="975圆体">975圆体</c-option>
              </c-select>
              <span class="material-icons">chevron_right</span>
            </div>
          </div>
          <div class="control-list">
            <div class="control-item" data-control="catalog"
              @click="actionHandler('catalog')">
              <div class="control-icon material-icons">menu</div>
              <div class="control-label"></div>
            </div>
            <div class="control-item" data-control="autoPlay"
              @click="actionHandler('autoPlay')">
              <div class="control-icon material-icons">{{ controlState.autoPlay ? 'pause' : 'play_arrow' }}</div>
              <div class="control-label"></div>
            </div>
            <div class="control-item" data-control="readSpeak" @click="actionHandler('readSpeak')">
              <div class="control-icon material-icons">{{ controlState.readSpeak ? 'pause_circle' : 'play_circle' }}</div>
              <div class="control-label"></div>
            </div>
            <div class="control-item" data-control="font" @click="visiblePanel='font'">
              <span class="material-icons">text_format</span>
              <div class="control-label"></div>
            </div>
            <div class="control-item" data-control="darkMode" @click="actionHandler('darkMode')">
              <span class="material-icons">{{ controlState.darkMode ? 'light_mode' : 'dark_mode' }}</span>
              <div class="control-label"></div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  `,
  data() {
    return {
      panelVisible: false,
      visiblePanel: null,

      controlState: {
        darkMode: false,
        readSpeak: false,
        autoPlay: false
      },

      settings: getSettings(),
      isInk: env.isInk()
    }
  },
  watch: {
    settings: {
      deep: true,
      handler() {
        saveAllSettings(this.settings)
      }
    }
  },
  created() {
    this.actions = {
      darkMode: new DarkMode({
        auto: true,
        changeHandler: event => this.controlState.darkMode = event.detail.enabled
      }),
      readSpeak: new ReadSpeak({
        getNextElement: () => {
          const el = this.$refs.content.querySelector('p.reading')
          return el.nextElementSibling
        },
        changeHandler: event => {
          this.controlState.readSpeak = event.detail.speaking
        }
      }),
      autoPlay: new AutoPlay({
        nextPage: () => this.$emit('next-page'),
        scrollVertical: () => this.$emit('scroll-vertical', 1),
        autoPlayDuration: this.settings.autoPlayDuration,
        changeHandler: (event) => {
          this.controlState.autoPlay = event.detail.playing
        }
      })
    }
  },
  mounted() {
    this.initHammer()
  },
  beforeUnmount() {
    this.hammer?.destroy?.()
    this.actions?.autoPlay?.stop?.()
    this.actions?.readSpeak?.stop?.()
    this.actions?.darkMode?.exit()
  },
  methods: {
    touchstartHandler(e) {
      const p = e.changedTouches[0]
      if (p.pageX < 20 || p.pageX > window.innerWidth - 20) {
        e.preventDefault()
      }
    },
    initHammer() {
      const contentTapHandler = (event) => {
        if (env.isInk()) {
          /**
           * 把点击区域分为九个区域，如下
           * 1|2|3
           * 4|5|6
           * 7|8|9
           * 先计算在点击落于哪个区域
           */
          const { x, y } = event.center
          const centerLeft = window.innerWidth / 3
          const centerRight = 2 * centerLeft
          const centerTop = window.innerHeight / 3
          const centerBottom = 2 * centerTop
          let area = -1
          if (y <= centerTop) {
            area = x < centerLeft ? 1 : x < centerRight ? 2 : 3
          } else if (y <= centerBottom) {
            area = x < centerLeft ? 4 : x < centerRight ? 5 : 6
          } else {
            area = x < centerLeft ? 7 : x < centerRight ? 8 : 9
          }
          
          const nextPageArea = [3, 7, 9]
          const prevPageArea = [1, 4, 6]

          if (nextPageArea.includes(area)) {
            this.$emit('next-page')
          } else if (prevPageArea.includes(area)) {
            this.$emit('prev-page')
          } else {
            this.panelVisible = !this.panelVisible
            return
          }
        }
        if (this.actions.autoPlay.isPlaying()) {
          this.visiblePanel = 'autoPlay'
        }
        this.panelVisible = !this.panelVisible
      }
      const hammer = new Hammer.Manager(this.$refs.content, {
        recognizers: [
          [Hammer.Tap],
          [Hammer.Swipe, { direction: Hammer.DIRECTION_ALL, threshold: 10 }]
        ]
      })
      if (env.isInk()) {
        hammer.on('swipeleft', () => this.$emit('next-page'))
        hammer.on('swiperight', () => this.$emit('prev-page'))
      } else {
        hammer.on('swiperight', (() => {
          let backed = false
          return (e) => {
            const { center: { x }, deltaX } = e
            const startX = x - deltaX
            if (startX <= 80 && !backed) {
              backed = true
              this.$router.back()
            }
          }
        })())
        hammer.on('swipeleft', () => {
          this.visiblePanel = 'catalog'
        })
      }
      hammer.on('tap', contentTapHandler)
      this.hammer = hammer
    },
    openPanel() {
      this.panelVisible = true
    },
    closePanel() {
      this.panelVisible = false
    },
    async actionHandler(control) {
      // action: readSpeak | darkMode | autoPlay | catalog
      if (control === 'darkMode') {
        this.actions?.darkMode?.toggle()
      }
      if (control === 'readSpeak') {
        this.actions.readSpeak.toggle(getNearestTopEl(this.$refs.content.querySelectorAll('.chapter')))
      } else if (control === 'autoPlay') {
        this.visiblePanel = 'autoPlay'
        this.actions.autoPlay.toggle()
      } else if (control === 'catalog') {
        this.visiblePanel = 'catalog'
      }
    },
    changeAutoPlayDuration(duration) {
      this.settings.autoPlayDuration = duration
      this.actions.autoPlay.updateInterval(duration)
    },
  }
}