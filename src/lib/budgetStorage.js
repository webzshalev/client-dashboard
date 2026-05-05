/**
 * Budget storage layer — currently backed by localStorage.
 * To migrate to a database: replace each function body with an `api` call
 * and update callers to `await` the result (all functions already return values,
 * making the future async swap mechanical).
 */

const NS = 'wbz'

function lsRead(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}
function lsWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}
function lsErase(key) {
  try { localStorage.removeItem(key) } catch {}
}

// ─── Key helpers ──────────────────────────────────────────────────────────────
const k = {
  budget:          (cid, proj) => `${NS}_${cid}_${proj || '__all__'}_budget`,
  platformBudgets: (cid, proj, month, year) => {
    const m = month || (new Date().getMonth() + 1)
    const y = year  || new Date().getFullYear()
    return `${NS}_${cid}_${proj || '__all__'}_${y}_${m}_platform_budgets`
  },
  session:         (cid)       => `${NS}_admin_ts_${cid}`,
  toggle:          (cid, name) => `${NS}_${cid}_${name}`,
}

// ─── Budget ───────────────────────────────────────────────────────────────────
export const budgetStorage = {
  getProjectBudget(clientId, project) {
    return lsRead(k.budget(clientId, project), { monthly_budget: 0, actual_spend: 0, leads_override: 0 })
  },
  setProjectBudget(clientId, project, data) {
    lsWrite(k.budget(clientId, project), data)
  },
  getPlatformBudgets(clientId, project, month, year) {
    return lsRead(k.platformBudgets(clientId, project, month, year), {})
  },
  setPlatformBudgets(clientId, project, data, month, year) {
    lsWrite(k.platformBudgets(clientId, project, month, year), data)
  },
}

// ─── Admin session ────────────────────────────────────────────────────────────
export const adminSession = {
  getTimestamp(clientId) { return lsRead(k.session(clientId), null) },
  setTimestamp(clientId) { lsWrite(k.session(clientId), Date.now()) },
  clear(clientId)        { lsErase(k.session(clientId)) },
  getToggle(clientId, name)        { return localStorage.getItem(k.toggle(clientId, name)) === '1' },
  setToggle(clientId, name, value) { lsWrite(k.toggle(clientId, name), value ? 1 : 0) },
}
