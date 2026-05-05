import { ref, watch } from 'vue'
import { budgetStorage, adminSession } from '../lib/budgetStorage.js'

const SESSION_MS = 30 * 60 * 1000

// Singleton — all consumers share the same reactive state
const _clientId = ref('')
const isUnlocked = ref(false)
const showFailed = ref(false)
const showPending = ref(false)

function _checkSession() {
  const ts = adminSession.getTimestamp(_clientId.value)
  isUnlocked.value = !!(ts && Date.now() - Number(ts) < SESSION_MS)
}

function _loadToggles() {
  showFailed.value = adminSession.getToggle(_clientId.value, 'show_failed')
  showPending.value = adminSession.getToggle(_clientId.value, 'show_pending')
}

watch(_clientId, (id) => {
  if (id) { _checkSession(); _loadToggles() }
  else { isUnlocked.value = false; showFailed.value = false; showPending.value = false }
})

export function useAdmin(clientId) {
  if (clientId) {
    watch(clientId, (id) => { _clientId.value = String(id || '') }, { immediate: true })
  }

  function validatePin(pin) {
    return String(pin) === String(import.meta.env.VITE_ADMIN_PIN || '1234')
  }

  function unlock() {
    adminSession.setTimestamp(_clientId.value)
    isUnlocked.value = true
  }

  function lock() {
    adminSession.clear(_clientId.value)
    isUnlocked.value = false
  }

  function setShowFailed(v) {
    showFailed.value = Boolean(v)
    adminSession.setToggle(_clientId.value, 'show_failed', v)
  }

  function setShowPending(v) {
    showPending.value = Boolean(v)
    adminSession.setToggle(_clientId.value, 'show_pending', v)
  }

  function loadBudget(project) {
    return budgetStorage.getProjectBudget(_clientId.value, project)
  }

  function saveBudget(project, data) {
    budgetStorage.setProjectBudget(_clientId.value, project, data)
  }

  function loadPlatformBudgets(project, month, year) {
    return budgetStorage.getPlatformBudgets(_clientId.value, project, month, year)
  }

  function savePlatformBudgets(project, data, month, year) {
    budgetStorage.setPlatformBudgets(_clientId.value, project, data, month, year)
  }

  return {
    isUnlocked, showFailed, showPending,
    validatePin, unlock, lock,
    setShowFailed, setShowPending,
    loadBudget, saveBudget,
    loadPlatformBudgets, savePlatformBudgets,
  }
}
