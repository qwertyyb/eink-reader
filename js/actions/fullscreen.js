export const fullscreen = {
  enter() {
    if (!document.fullscreenElement) {
      return document.documentElement.requestFullscreen();
    }
  },
  exit() {
    if (document.exitFullscreen && this.isActivated()) {
      return document.exitFullscreen();
    }
  },
  isActivated() {
    return !!document.fullscreenElement
  },
  toggle() {
    return this.isActivated() ? this.exit() : this.enter()
  }
}