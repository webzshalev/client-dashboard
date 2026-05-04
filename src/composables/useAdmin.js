import { ref, watch } from 'vue'

// Singleton — all consumers share the same reactive state
const _clientId = ref('')
const isUnlocked = ref(false)
const showFailed = ref(false)
const showPending = ref(false)
const SESSION_MS = 30 * 60 * 1000

function sk(k) { return `wbz_${_clientId.value}_${k}` }

function _checkSession() {
  const ts = localStorage.getItem(`wbz_admin_ts_${_clientId.value}`)
  isUnlocked.value = !!(ts && Date.now() - Number(ts) < SESSION_MS)
}

function _loadToggles() {
  showFailed.value = localStorage.getItem(sk('show_failed')) === '1'
  showPending.value = localStorage.getItem(sk('show_pending')) === '1'
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
    localStorage.setItem(`wbz_admin_ts_${_clientId.value}`, String(Date.now()))
    isUnlocked.value = true
  }

  function lock() {
    localStorage.removeItem(`wbz_admin_ts_${_clientId.value}`)
    isUnlocked.value = false
  }

  function setShowFailed(v) {
    showFailed.value = Boolean(v)
    localStorage.setItem(sk('show_failed'), v ? '1' : '0')
  }

  function setShowPending(v) {
    showPending.value = Boolean(v)
    localStorage.setItem(sk('show_pending'), v ? '1' : '0')
  }

  function _bk(project) {
    return `wbz_${_clientId.value}_${project || '__all__'}_budget`
  }

  function _pbk(project) {
    return `wbz_${_clientId.value}_${project || '__all__'}_platform_budgets`
  }

  function loadBudget(project) {
    try {
      const raw = localStorage.getItem(_bk(project))
      if (!raw) return { monthly_budget: 0, actual_spend: 0, leads_override: 0 }
      return JSON.parse(raw)
    } catch { return { monthly_budget: 0, actual_spend: 0, leads_override: 0 } }
  }

  function saveBudget(project, data) {
    localStorage.setItem(_bk(project), JSON.stringify(data))
  }

  function loadPlatformBudgets(project) {
    try {
      const raw = localStorage.getItem(_pbk(project))
      if (!raw) return {}
      return JSON.parse(raw)
    } catch { return {} }
  }

  function savePlatformBudgets(project, data) {
    localStorage.setItem(_pbk(project), JSON.stringify(data))
  }

  return {
    isUnlocked, showFailed, showPending,
    validatePin, unlock, lock,
    setShowFailed, setShowPending,
    loadBudget, saveBudget,
    loadPlatformBudgets, savePlatformBudgets,
  }
}
