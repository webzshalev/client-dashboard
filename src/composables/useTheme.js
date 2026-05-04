import { shallowRef } from 'vue'

const isDark = shallowRef(true)

function applyClass() {
  document.documentElement.classList.toggle('light', !isDark.value)
}

const saved = localStorage.getItem('theme')
if (saved === 'light') isDark.value = false
applyClass()

export function useTheme() {
  function toggle() {
    document.documentElement.classList.add('theme-transitioning')
    isDark.value = !isDark.value
    applyClass()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350)
  }
  return { isDark, toggle }
}
