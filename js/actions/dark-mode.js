const createDarkMode = () => ({
  enter() {
    document.documentElement.classList.add('dark-mode')
  },
  exit() {
    document.documentElement.classList.remove('dark-mode')
  },
  isActivated() {
    document.documentElement.classList.contains('dark-mode')
  },
  toggle() {
    return this.isActivated() ? this.exit() : this.enter()
  }
})

export const darkMode = createDarkMode()