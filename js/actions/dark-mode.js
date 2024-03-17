export class DarkMode extends EventTarget {
  static CHANGE_EVENT_NAME = 'change'

  constructor({ auto = true, changeHandler }) {
    super()
    if (typeof changeHandler === 'function') {
      this.addEventListener(DarkMode.CHANGE_EVENT_NAME, changeHandler)
    }
    if (auto) {
      const match = window.matchMedia('(prefers-color-scheme: dark)')
      match.addEventListener('change', this.#callback)
      if (match.matches) {
        this.enter()
      }
    }
  }

  #callback = (event) => {
    if (event.matches) {
      this.enter()
    } else {
      this.exit()
    }
  }

  destroy() {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.#callback)
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
