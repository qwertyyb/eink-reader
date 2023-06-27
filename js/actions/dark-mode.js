export class DarkMode extends EventTarget {
  static CHANGE_EVENT_NAME = 'change'

  constructor(changeHandler) {
    super()
    if (typeof changeHandler === 'function') {
      this.addEventListener(DarkMode.CHANGE_EVENT_NAME, changeHandler)
    }
  }

  #changeHandler() {
    this.dispatchEvent(new CustomEvent(DarkMode.CHANGE_EVENT_NAME, { detail: { enabled: this.isActivated() } }))
  }

  enter() {
    document.documentElement.classList.add('dark-mode')
    this.#changeHandler()
  }

  exit() {
    document.documentElement.classList.remove('dark-mode')
    this.#changeHandler()
  }

  isActivated() {
    return document.documentElement.classList.contains('dark-mode')
  }

  toggle() {
    return this.isActivated() ? this.exit() : this.enter()
  }
}
