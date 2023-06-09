export const getSettings = () => {
  const defaultSettings = {
    fontFamily: 'SYST',
    fontSize: 24,

    autoPlayDuration: 24, // 24s
  }
  const settings = JSON.parse(localStorage.getItem('settings') || '{}')

  return {
    ...defaultSettings,
    ...settings,
  }
}

export const saveSettings = (name, value) => {
  localStorage.setItem('settings', JSON.stringify({
    ...getSettings(),
    [name]: value,
  }))
}

export const saveAllSettings = (settings) => {
  localStorage.setItem('settings', JSON.stringify({
    ...getSettings(),
    ...settings,
  }))
}
