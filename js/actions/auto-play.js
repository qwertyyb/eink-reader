import { env } from '../utils/env.js'

export class AutoPlay extends EventTarget {
  static CHANGE_EVENT_NAME = 'change'

  scrollVertical = () => {}
  nextPage = () => {}
  autoPlayDuration = 24

  #interval = null

  constructor({ scrollVertical, nextPage, autoPlayDuration, changeHandler } = {}) {
    super()
    this.scrollVertical = scrollVertical
    this.nextPage = nextPage
    this.autoPlayDuration = autoPlayDuration
    if (typeof changeHandler === 'function') {
      this.addEventListener(AutoPlay.CHANGE_EVENT_NAME, changeHandler)
    }
  }

  start() {
    this.stop()
    if (env.isHorizontal()) {
      this.#interval = setInterval(() => {
        this.nextPage()
      }, this.autoPlayDuration * 1000)
    } else {
      this.#interval = setInterval(() => {
        this.scrollVertical()
      }, this.autoPlayDuration)
    }
    this.dispatchEvent(new CustomEvent(AutoPlay.CHANGE_EVENT_NAME, { detail: { playing: true } }))
  }

  stop() {
    this.#interval && clearInterval(this.#interval)
    this.#interval = null
    this.dispatchEvent(new CustomEvent(AutoPlay.CHANGE_EVENT_NAME, { detail: { playing: false } }))
  }

  updateInterval(s) {
    this.autoPlayDuration = s
    if (this.isPlaying()) {
      this.start()
    }
  }

  toggle() {
    if (this.isPlaying()) {
      return this.stop()
    }
    this.start()
  }

  isPlaying() {
    return !!this.#interval
  }
}
