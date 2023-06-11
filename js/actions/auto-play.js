import { getSettings } from "../utils/settings.js";
import { env } from '../utils/env.js'

export const createAutoPlay = ({ scrollVertical, nextPage } = {}) => {
  let interval = null;
  const isPlaying = () => !!interval;
  const stop = () => {
    interval && clearInterval(interval)
    interval = null
  }
  const start = () => {
    stop()
    if (env.isHorizontal()) {
      interval = setInterval(() => {
        nextPage()
      }, getSettings().autoPlayDuration * 1000)
    } else {
      interval = setInterval(() => {
        scrollVertical()
      }, getSettings().autoPlayDuration)
    }
  }
  const updateInterval = s => {
    if (isPlaying()) {
      start()
    }
  }
  const toggle = () => {
    if (isPlaying()) {
      return stop()
    }
    start()
  }
  return {
    interval: () => getSettings().autoPlayDuration,
    isPlaying,
    start,
    stop,
    updateInterval,
    toggle,
  }
}