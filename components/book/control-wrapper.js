import { env } from "../../js/utils/env.js"
import { getSettings, saveAllSettings } from "../../js/utils/settings.js"
import CProgress from "../common/c-progress.js"
import CSelect from "../common/c-select.js"
import COption from "../common/c-option.js"
import CatalogDialog from "./catalog-dialog.js"
import { darkMode } from "../../js/actions/dark-mode.js"
import { fullscreen } from "../../js/actions/fullscreen.js"
import { readSpeak } from "../../js/actions/read-speak.js"
import { createAutoPlay } from "../../js/actions/auto-play.js"

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
              <button class="material-icons speed-dec" data-action="dec" @click="changeAutoPlayDuration(settings.autoPlayDuration - 1)">
                remove
              </button>
              <span class="speed-value">{{ settings.autoPlayDuration }}</span>
              <button class="material-icons speed-inc" data-action="inc" @click="changeAutoPlayDuration(settings.autoPlayDuration + 1)">
                add
              </button>
            </div>
          </div>

          <div class="control-panel font-panel" data-target-control="font" v-if="visiblePanel === 'font'">
            <div class="font-weight">
              <div class="lighter-btn" @click="changeFontWeight('dec')">B-</div>
              <c-progress
                :steps="[100, 200, 300, 400, 500, 600, 700, 800, 900]"
                style="flex: 1"
                v-model="settings.fontWeight"></c-progress>
              <div class="bolder-btn" @click="changeFontWeight('inc')">B+</div>
            </div>
            <div class="font-family-size">
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
              <div class="font-size">
                <button class="material-icons text-dec" @click="settings.fontSize -= 1">
                    text_decrease
                </button>
                <span class="text-size">{{ settings.fontSize }}</span>
                <button class="material-icons text-inc" @click="settings.fontSize += 1">
                    text_increase
                </button>
              </div>
            </div>
          </div>
          <div class="control-list">
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
            <div class="control-item" data-control="catalog"
              @click="actionHandler('catalog')">
              <div class="control-icon material-icons">menu</div>
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
        fullscreen: false,
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
      autoPlay: createAutoPlay({
        nextPage: () => this.$emit('next-page'),
        scrollVertical: () => this.$emit('scroll-vertical', 1)
      })
    }
  },
  mounted() {
    this.initHammer()
  },
  beforeUnmount() {
    this.hammer?.destroy?.()
    this.actions?.autoPlay?.stop?.()
    fullscreen.exit()
    darkMode.exit()
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
          // 左、中、右
          const { x } = event.center
          const centerLeft = window.innerWidth / 3
          const centerRight = 2 * centerLeft
          const isLeft = x < centerLeft
          const isRight = x > centerRight
          if (isLeft) return this.$emit('prev-page')
          if (isRight) return this.$emit('next-page')
        }
        if (this.actions.autoPlay.isPlaying()) {
          this.visiblePanel = 'autoPlay'
        }
        this.panelVisible = !this.panelVisible
      }
      const hammer = new Hammer.Manager(this.$refs.content, {
        recognizers: [
          [Hammer.Tap],
          [Hammer.Pan, { direction: Hammer.DIRECTION_ALL, threshold: 120 }]
        ]
      })
      if (env.isInk()) {
        hammer.on('panleft', () => this.$emit('next-page'))
        hammer.on('panright', () => this.$emit('prev-page'))
      } else {
        hammer.on('panright', (() => {
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
        hammer.on('panleft', () => this.visiblePanel = 'catalog')
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
      // action: readSpeak | darkMode | fullscreen | autoPlay | catalog
      if (control === 'fullscreen') {
        await fullscreen.toggle()
        this.controlState.fullscreen = fullscreen.isActivated()
      }
      if (control === 'darkMode') {
        darkMode.toggle()
        this.controlState.darkMode = darkMode.isActivated
      }
      if (control === 'readSpeak') {
        readSpeak.toggle(this.getCurrentP())
        this.controlState.readSpeak = readSpeak.isSpeaking()
      } else if (control === 'autoPlay') {
        this.visiblePanel = 'autoPlay'
        this.actions.autoPlay.toggle()
        this.controlState.autoPlay = this.actions.autoPlay.isPlaying()
      } else if (control === 'catalog') {
        this.visiblePanel = 'catalog'
      }
    },
    changeAutoPlayDuration(duration) {
      this.settings.autoPlayDuration = duration
      this.actions.autoPlay.updateInterval(duration)
    },
    changeFontWeight(action) {
      if (action === 'dec') {
        this.settings.fontWeight = Math.max(100, this.settings.fontWeight - 100)
      } else if (action === 'inc') {
        this.settings.fontWeight = Math.min(900, this.settings.fontWeight + 100)
      }
    },
  }
}