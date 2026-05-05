<template>
  <!-- Gear trigger — fixed bottom-left, subtle -->
  <button class="gear-trigger" @click="open" title="פאנל מנהל" aria-label="admin panel">⚙</button>

  <Teleport to="body">
    <Transition name="backdrop-fade">
      <div v-if="panelState !== 'closed'" class="panel-backdrop" @click.self="close">

        <!-- PIN Modal -->
        <Transition name="modal-pop">
          <div v-if="panelState === 'pin'" class="modal pin-modal" :class="{ shake: pinShaking }" @click.stop>
            <div class="pin-lock-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3 class="modal-title">פאנל מנהל</h3>
            <p class="modal-sub">הזן קוד גישה</p>

            <div class="pin-row">
              <button class="pin-eye" @click="showPinText = !showPinText" type="button">
                <svg v-if="showPinText" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <input
                ref="pinInputRef"
                v-model="pinInput"
                :type="showPinText ? 'text' : 'password'"
                class="pin-input"
                placeholder="••••"
                maxlength="6"
                inputmode="numeric"
                dir="ltr"
                @keydown.enter="submitPin"
              />
            </div>

            <p v-if="pinError" class="pin-error">{{ pinError }}</p>
            <button class="submit-btn" @click="submitPin">כניסה</button>
          </div>
        </Transition>

        <!-- Admin Panel -->
        <Transition name="modal-pop">
          <div v-if="panelState === 'panel'" class="modal admin-modal" @click.stop>
            <div class="modal-header">
              <h3 class="modal-title">פאנל מנהל</h3>
              <button class="modal-close" @click="close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Section A: Lead visibility -->
            <div class="panel-section">
              <div class="section-heading">הצגת לידים</div>
              <div class="toggle-row">
                <span class="toggle-label">הצג לידים שנכשלו</span>
                <button
                  class="toggle-switch"
                  :class="{ on: showFailed }"
                  @click="setShowFailed(!showFailed)"
                  role="switch"
                  :aria-checked="showFailed"
                >
                  <span class="toggle-thumb"></span>
                </button>
              </div>
              <div class="toggle-row">
                <span class="toggle-label">הצג לידים בהמתנה</span>
                <button
                  class="toggle-switch"
                  :class="{ on: showPending }"
                  @click="setShowPending(!showPending)"
                  role="switch"
                  :aria-checked="showPending"
                >
                  <span class="toggle-thumb"></span>
                </button>
              </div>
            </div>

            <!-- Section B: Per-platform budget -->
            <div class="panel-section">
              <div class="section-heading">תקציב לפי פלטפורמה</div>

              <div class="field-wrap">
                <label class="field-label">חודש</label>
                <select v-model="selectedMonthKey" class="field-select">
                  <option v-for="m in monthOptions" :key="m.key" :value="m.key">{{ m.label }}</option>
                </select>
              </div>

              <div v-if="projectNames.length > 1" class="field-wrap">
                <label class="field-label">פרויקט</label>
                <select v-model="selectedProject" class="field-select">
                  <option value="">כל הלקוח</option>
                  <option v-for="p in projectNames" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>

              <div v-if="props.platforms.length > 0">
                <div class="pbt-header">
                  <span>פלטפורמה</span>
                  <span>תקציב חודשי</span>
                  <span>ניצול בפועל</span>
                </div>
                <div v-for="p in props.platforms" :key="p.name" class="pbt-row">
                  <span class="pbt-name">
                    <span class="pbt-dot" :style="{ background: getPlatformColor(p.name) }"></span>
                    {{ getPlatformLabel(p.name) }}
                  </span>
                  <div class="currency-field">
                    <span class="currency-sym">₪</span>
                    <input
                      v-if="platformForm[p.name]"
                      v-model="platformForm[p.name].monthly_budget"
                      type="number" min="0" placeholder="0" dir="ltr"
                      class="pbt-input"
                    />
                  </div>
                  <div class="currency-field">
                    <span class="currency-sym">₪</span>
                    <input
                      v-if="platformForm[p.name]"
                      v-model="platformForm[p.name].actual_spend"
                      type="number" min="0" placeholder="0" dir="ltr"
                      class="pbt-input"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="empty-platforms">אין פלטפורמות בטווח הנבחר</div>

              <div class="field-wrap" style="margin-top: 16px">
                <label class="field-label">כמות לידים לחישוב CPL <span class="field-hint">(ריק = אוטומטי מה-API)</span></label>
                <input v-model="cplOverride" type="number" min="0" :placeholder="String(sentCount || 0)" dir="ltr" class="field-input full-width" />
              </div>

              <div class="action-row">
                <button class="save-btn" @click="savePlatformForm">שמור</button>
                <Transition name="fade-msg">
                  <span v-if="savedMsg" class="saved-msg">✓ נשמר</span>
                </Transition>
              </div>
            </div>

            <!-- Section C: Link Generator -->
            <div class="panel-section">
              <div class="section-heading">קישור ללקוח</div>
              <div class="link-box">
                <span class="link-url">{{ generatedLink }}</span>
                <button class="copy-btn" :class="{ copied: linkCopied }" @click="copyLink">
                  {{ linkCopied ? '✓ הועתק' : 'העתק' }}
                </button>
              </div>
            </div>

            <div class="panel-footer">
              <button class="lock-btn" @click="lockAdmin">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                נתק
              </button>
            </div>
          </div>
        </Transition>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useAdmin } from '../../composables/useAdmin.js'
import { encodeClientId } from '../../lib/tokenUtils.js'
import { getPlatformColor, getPlatformLabel } from '../../lib/constants.js'

const props = defineProps({
  clientId: { type: [String, Number], default: '' },
  projectNames: { type: Array, default: () => [] },
  activeProject: { type: String, default: '' },
  sentCount: { type: Number, default: 0 },
  platforms: { type: Array, default: () => [] },
  projects: { type: Array, default: () => [] }, // [{name, platforms:[{name,updated_budget,budget_usage}]}]
})

const emit = defineEmits(['budgetSaved'])

const clientIdRef = computed(() => String(props.clientId || ''))
const {
  isUnlocked, showFailed, showPending,
  validatePin, unlock, lock,
  setShowFailed, setShowPending,
  loadBudget, saveBudget,
  loadPlatformBudgets, savePlatformBudgets,
} = useAdmin(clientIdRef)

// Panel state machine
const panelState = ref('closed')

// PIN
const pinInput = ref('')
const pinError = ref('')
const pinShaking = ref(false)
const showPinText = ref(false)
const pinInputRef = ref(null)

// Budget
const selectedProject = ref(props.activeProject || '')
const platformForm = ref({})
const cplOverride = ref('')
const savedMsg = ref(false)

// Month selector — generate last 12 months + next month
const monthOptions = computed(() => {
  const opts = []
  const now = new Date()
  for (let i = -1; i <= 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    const label = d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    opts.push({ key: `${year}-${month}`, month, year, label })
  }
  return opts
})

const now = new Date()
const selectedMonthKey = ref(`${now.getFullYear()}-${now.getMonth() + 1}`)

const selectedMonth = computed(() => {
  const found = monthOptions.value.find(m => m.key === selectedMonthKey.value)
  return found || monthOptions.value[0]
})

// Link generator
const linkCopied = ref(false)
const generatedLink = computed(() => {
  if (!props.clientId) return '—'
  const token = encodeClientId(String(props.clientId))
  return `${window.location.origin}/dashboard/${token}`
})

watch(() => props.activeProject, (p) => { selectedProject.value = p || '' })
watch([selectedProject, selectedMonthKey, clientIdRef], () => { initPlatformForm(); loadCplOverride() })
watch(() => props.platforms, initPlatformForm)

function initPlatformForm() {
  const { month, year } = selectedMonth.value
  const saved = loadPlatformBudgets(selectedProject.value, month, year)

  // Collect API budget defaults: sum across matching projects
  const apiDefaults = {}
  const matchingProjects = selectedProject.value
    ? props.projects.filter(p => p.name === selectedProject.value)
    : props.projects
  for (const proj of matchingProjects) {
    for (const plat of (proj.platforms || [])) {
      const name = (plat.name || '').toLowerCase()
      if (!apiDefaults[name]) apiDefaults[name] = { monthly_budget: 0, actual_spend: 0 }
      apiDefaults[name].monthly_budget += plat.updated_budget || plat.monthly_budget || 0
      apiDefaults[name].actual_spend += plat.budget_usage || 0
    }
  }

  const result = {}
  for (const p of props.platforms) {
    const savedVals = saved[p.name]
    const api = apiDefaults[p.name] || {}
    result[p.name] = {
      monthly_budget: savedVals?.monthly_budget > 0
        ? String(savedVals.monthly_budget)
        : (api.monthly_budget > 0 ? String(Math.round(api.monthly_budget)) : ''),
      actual_spend: savedVals?.actual_spend > 0
        ? String(savedVals.actual_spend)
        : (api.actual_spend > 0 ? String(Math.round(api.actual_spend)) : ''),
    }
  }
  platformForm.value = result
}

function loadCplOverride() {
  const { month, year } = selectedMonth.value
  const key = `${selectedProject.value}__${year}_${month}`
  const data = loadBudget(key)
  cplOverride.value = data.leads_override > 0 ? String(data.leads_override) : ''
}

function open() {
  if (isUnlocked.value) {
    panelState.value = 'panel'
    initPlatformForm()
    loadCplOverride()
  } else {
    panelState.value = 'pin'
    pinInput.value = ''
    pinError.value = ''
    showPinText.value = false
    nextTick(() => pinInputRef.value?.focus())
  }
}

function close() { panelState.value = 'closed' }

async function submitPin() {
  if (!pinInput.value) return
  if (validatePin(pinInput.value)) {
    unlock()
    pinInput.value = ''
    pinError.value = ''
    panelState.value = 'panel'
    initPlatformForm()
    loadCplOverride()
  } else {
    pinError.value = 'קוד שגוי'
    pinShaking.value = true
    pinInput.value = ''
    setTimeout(() => { pinShaking.value = false }, 450)
  }
}

function savePlatformForm() {
  const { month, year } = selectedMonth.value
  const data = {}
  for (const [name, vals] of Object.entries(platformForm.value)) {
    data[name] = {
      monthly_budget: Number(vals.monthly_budget) || 0,
      actual_spend: Number(vals.actual_spend) || 0,
    }
  }
  savePlatformBudgets(selectedProject.value, data, month, year)
  const budgetKey = `${selectedProject.value}__${year}_${month}`
  saveBudget(budgetKey, {
    monthly_budget: 0,
    actual_spend: 0,
    leads_override: Number(cplOverride.value) || 0,
  })
  emit('budgetSaved')
  savedMsg.value = true
  setTimeout(() => { savedMsg.value = false }, 2000)
}

function lockAdmin() { lock(); close() }

async function copyLink() {
  if (!generatedLink.value || generatedLink.value === '—') return
  try {
    await navigator.clipboard.writeText(generatedLink.value)
  } catch {
    const el = document.createElement('textarea')
    el.value = generatedLink.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}

function onKeydown(e) {
  if (e.key === 'Escape' && panelState.value !== 'closed') close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* ── Gear trigger ─────────────────────────────────────────────────────────── */
.gear-trigger {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 999;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.45;
  transition: opacity 0.2s, border-color 0.2s, transform 0.3s ease, color 0.2s;
}

.gear-trigger:hover {
  opacity: 1;
  border-color: var(--gold);
  color: var(--gold);
  transform: rotate(45deg);
}

/* ── Backdrop ─────────────────────────────────────────────────────────────── */
.panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* ── Modal base ───────────────────────────────────────────────────────────── */
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.pin-modal {
  max-width: 320px;
  padding: 36px 32px 32px;
  text-align: center;
}

.admin-modal { max-width: 500px; padding: 0; }

/* ── PIN modal ────────────────────────────────────────────────────────────── */
.pin-lock-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--gold-dim);
  border: 1px solid rgba(201, 168, 76, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.modal-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.modal-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }

.pin-row {
  display: flex;
  align-items: center;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 12px;
}

.pin-eye {
  width: 40px; height: 44px;
  border: none; background: transparent;
  color: var(--text-dim); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: color 0.15s;
}
.pin-eye:hover { color: var(--text); }

.pin-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--text); font-family: 'Heebo', sans-serif;
  font-size: 20px; padding: 10px 12px 10px 4px;
  letter-spacing: 0.15em; direction: ltr;
}

.pin-error { font-size: 12px; color: var(--danger); margin-bottom: 12px; min-height: 18px; }

.submit-btn {
  width: 100%; padding: 11px;
  background: var(--gold); color: #0F1117;
  border: none; border-radius: var(--radius-sm);
  font-family: 'Heebo', sans-serif; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s;
}
.submit-btn:hover { opacity: 0.88; }

.shake { animation: shake 0.42s ease; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}

/* ── Admin panel modal ────────────────────────────────────────────────────── */
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--border);
}

.modal-close {
  width: 30px; height: 30px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent;
  color: var(--text-muted); display: flex; align-items: center;
  justify-content: center; cursor: pointer; transition: all 0.15s;
}
.modal-close:hover { border-color: var(--danger); color: var(--danger); }

.panel-section { padding: 20px 24px; border-bottom: 1px solid var(--border); }

.section-heading {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
}

/* ── Toggles ──────────────────────────────────────────────────────────────── */
.toggle-row {
  display: flex; align-items: center; justify-content: space-between; padding: 8px 0;
}
.toggle-label { font-size: 13px; color: var(--text); }

.toggle-switch {
  width: 42px; height: 24px; border-radius: 12px;
  background: var(--surface-2); border: 1px solid var(--border);
  position: relative; cursor: pointer;
  transition: background 0.2s, border-color 0.2s; flex-shrink: 0;
}
.toggle-switch.on { background: var(--success); border-color: var(--success); }

.toggle-thumb {
  position: absolute; width: 16px; height: 16px;
  border-radius: 50%; background: #fff;
  top: 3px; left: 3px;
  transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-switch.on .toggle-thumb { transform: translateX(18px); }

/* ── Platform budget table ────────────────────────────────────────────────── */
.pbt-header {
  display: grid;
  grid-template-columns: 1fr 120px 120px;
  gap: 8px;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.pbt-row {
  display: grid;
  grid-template-columns: 1fr 120px 120px;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--row-border);
}
.pbt-row:last-child { border-bottom: none; }

.pbt-name {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

.pbt-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}

.currency-field {
  display: flex; align-items: center;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden; transition: border-color 0.15s;
}
.currency-field:focus-within { border-color: var(--gold); }

.currency-sym {
  padding: 0 6px; font-size: 13px;
  color: var(--gold); font-weight: 600; flex-shrink: 0;
}

.pbt-input {
  background: transparent; border: none; outline: none;
  color: var(--text); font-family: 'Heebo', sans-serif;
  font-size: 13px; padding: 6px 6px 6px 2px;
  width: 0; flex: 1; direction: ltr;
}

.empty-platforms {
  font-size: 12px; color: var(--text-dim);
  padding: 8px 0; font-style: italic;
}

/* ── Shared field styles ──────────────────────────────────────────────────── */
.field-wrap { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }

.field-label {
  font-size: 11px; font-weight: 600;
  color: var(--text-muted); letter-spacing: 0.04em;
}
.field-hint { font-weight: 400; color: var(--text-dim); }

.field-input {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text);
  font-family: 'Heebo', sans-serif; font-size: 14px;
  padding: 8px 10px; transition: border-color 0.15s; direction: ltr;
}
.field-input:focus { outline: none; border-color: var(--gold); }
.field-input.full-width { width: 100%; }

.field-select {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text);
  font-family: 'Heebo', sans-serif; font-size: 13px;
  padding: 8px 10px; width: 100%; cursor: pointer; direction: rtl;
}

.action-row { display: flex; align-items: center; gap: 12px; margin-top: 4px; }

.save-btn {
  padding: 9px 24px; background: var(--gold); color: #0F1117;
  border: none; border-radius: var(--radius-sm);
  font-family: 'Heebo', sans-serif; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s;
}
.save-btn:hover { opacity: 0.88; }

.saved-msg { font-size: 12px; color: var(--success); font-weight: 600; }

/* ── Link generator ───────────────────────────────────────────────────────── */
.link-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  overflow: hidden;
}

.link-url {
  flex: 1;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: ltr;
  text-align: left;
}

.copy-btn {
  flex-shrink: 0;
  padding: 5px 12px;
  background: var(--gold-dim);
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: var(--radius-sm);
  color: var(--gold);
  font-family: 'Heebo', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.copy-btn:hover { opacity: 0.8; }
.copy-btn.copied { background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3); color: var(--success); }

/* ── Footer ───────────────────────────────────────────────────────────────── */
.panel-footer { padding: 16px 24px; display: flex; justify-content: flex-end; }

.lock-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; background: transparent;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-muted); font-family: 'Heebo', sans-serif;
  font-size: 12px; cursor: pointer; transition: all 0.15s;
}
.lock-btn:hover { border-color: var(--danger); color: var(--danger); }

/* ── Transitions ──────────────────────────────────────────────────────────── */
.backdrop-fade-enter-active,
.backdrop-fade-leave-active { transition: opacity 0.22s ease; }
.backdrop-fade-enter-from,
.backdrop-fade-leave-to { opacity: 0; }

.modal-pop-enter-active,
.modal-pop-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.modal-pop-enter-from { opacity: 0; transform: scale(0.94) translateY(12px); }
.modal-pop-leave-to { opacity: 0; transform: scale(0.97) translateY(-6px); }

.fade-msg-enter-active,
.fade-msg-leave-active { transition: opacity 0.2s; }
.fade-msg-enter-from,
.fade-msg-leave-to { opacity: 0; }
</style>
