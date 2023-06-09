const createReadSpeak = (selector = '.content p') => {
  const getFirst = () => {
    return Array.from(document.querySelectorAll(selector))
      .find(item => item.getBoundingClientRect().x > 0)
  }

  const createUtterance = (p, readyNext) => {
    const utterThis = new SpeechSynthesisUtterance(p.textContent);
    let nextTriggered = false
    utterThis.addEventListener('boundary', event => {
      if (event.charIndex > event.utterance.text.length - 10 && !nextTriggered) {
        nextTriggered = true
        readyNext(p)
      }
    })
    utterThis.addEventListener('start', event => {
      Array.from(document.querySelectorAll('.content p.reading'))
        .forEach(el => el.classList.remove('reading'))
      p.classList.add('reading')
      console.log('scrollIntoView')
      p.scrollIntoView({ block: 'center' })
    })
    utterThis.addEventListener('end', event => {
      p.classList.remove('reading')
    })
    return utterThis
  }
  const isEnd = p => p.parentNode.lastElementChild === p
  const readyNext = (prevP) => {
    if (isEnd(prevP)) return;
    const nextP = prevP.nextElementSibling
    const utterance = createUtterance(nextP, readyNext)
    window.speechSynthesis.speak(utterance)
  }
  const speak = (first) => {
    const utterance = createUtterance(first, readyNext)
    window.speechSynthesis.speak(utterance)
  }
  return {
    start() {
      const first = getFirst()
      speak(first)
    },
    stop() {
      window.speechSynthesis.cancel()
    },
    toggle() {
      if (window.speechSynthesis.speaking) {
        return this.stop()
      }
      this.start()
    },
    isSpeaking() {
      return window.speechSynthesis.speaking
    }
  }
}

export const readSpeak = createReadSpeak()
