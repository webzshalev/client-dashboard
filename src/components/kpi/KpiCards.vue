<template>
  <div class="kpi-grid">

    <!-- Card 1: Sent Leads -->
    <div class="kpi-card fade-up fade-up-1">
      <div class="card-header">
        <span class="card-label">לידים נשלחו</span>
        <div class="card-icon" style="color: var(--gold)"><IconUsers /></div>
      </div>
      <div class="card-value font-display">{{ fmt(stats?.total || 0) }}</div>
      <div class="card-sub">
        <span class="sub-dot" style="background: var(--gold)"></span>
        בטווח הנבחר
      </div>
    </div>

    <!-- Card 2: Top Platform -->
    <div class="kpi-card fade-up fade-up-2">
      <div class="card-header">
        <span class="card-label">פלטפורמה מובילה</span>
        <div class="card-icon" style="color: var(--info)"><IconChart /></div>
      </div>
      <div class="card-value font-display">{{ topPlatformLabel }}</div>
      <div class="card-sub">
        <span class="sub-dot" style="background: var(--info)"></span>
        {{ topPlatformSub }}
      </div>
    </div>

    <!-- CPL cards: one per platform with budget data -->
    <template v-if="cplCards.length">
      <div
        v-for="(card, idx) in cplCards"
        :key="card.name"
        class="kpi-card fade-up"
        :class="`fade-up-${3 + idx}`"
      >
        <div class="card-header">
          <span class="card-label">
            עלות לליד
            <span v-if="cplCards.length > 1" class="card-label-platform">— {{ card.label }}</span>
          </span>
          <div class="card-icon" style="color: var(--gold)"><IconCoin /></div>
        </div>
        <div
          class="card-value font-display"
          :style="card.cpl != null ? { color: 'var(--gold)' } : { color: 'var(--text-dim)', fontSize: '36px', marginBottom: '20px' }"
        >
          {{ card.cpl != null ? '₪' + Math.round(card.cpl).toLocaleString('he-IL') : '—' }}
        </div>
        <div class="card-sub">
          <template v-if="card.cpl != null">
            <span class="sub-dot" style="background: var(--gold)"></span>
            {{ fmtCurrency(card.actual_spend) }} / {{ fmt(card.leads) }} לידים
            <span v-if="card.mergedChildLabel" class="merge-note">(כולל {{ card.mergedChildLabel }})</span>
          </template>
          <span v-if="periodLabel" class="period-tag">{{ periodLabel }}</span>
        </div>
      </div>
    </template>

    <!-- Fallback single CPL card when no per-platform data -->
    <template v-else>
      <div class="kpi-card fade-up fade-up-3">
        <div class="card-header">
          <span class="card-label">עלות לליד</span>
          <div class="card-icon" style="color: var(--gold)"><IconCoin /></div>
        </div>
        <div
          class="card-value font-display"
          :style="globalCpl != null ? { color: 'var(--gold)' } : { color: 'var(--text-dim)', fontSize: '36px', marginBottom: '20px' }"
        >
          {{ globalCpl != null ? '₪' + Math.round(globalCpl).toLocaleString('he-IL') : '—' }}
        </div>
        <div class="card-sub">
          <template v-if="globalCpl != null">
            <span class="sub-dot" style="background: var(--gold)"></span>
            {{ fmtCurrency(budget?.actual_spend || 0) }} / {{ fmt(leadsForCpl) }} לידים
          </template>
          <span v-if="periodLabel" class="period-tag">{{ periodLabel }}</span>
        </div>
      </div>
    </template>

    <!-- Budget cards: only when budget data is entered -->
    <template v-if="hasBudget">

      <!-- Utilization -->
      <div class="kpi-card util-card fade-up" :class="`fade-up-${3 + cplCards.length}`">
        <div class="card-header">
          <span class="card-label">ניצול תקציב</span>
          <div class="card-icon" :style="{ color: utilColor }"><IconGauge /></div>
        </div>
        <div class="card-value font-display" :style="{ color: utilColor }">
          {{ utilization != null ? utilization + '%' : '—' }}
        </div>
        <div class="util-track">
          <div class="util-fill" :style="{ width: Math.min(utilization || 0, 100) + '%', background: utilColor }"></div>
        </div>
        <div class="card-sub">
          <span class="sub-dot" :style="{ background: utilColor }"></span>
          מתוך {{ fmtCurrency(budget?.monthly_budget || 0) }}
        </div>
      </div>

      <!-- Monthly Budget -->
      <div class="kpi-card fade-up" :class="`fade-up-${4 + cplCards.length}`">
        <div class="card-header">
          <span class="card-label">תקציב חודשי</span>
          <div class="card-icon" style="color: var(--info)"><IconCalendar /></div>
        </div>
        <div class="card-value font-display">{{ fmtCurrency(budget?.monthly_budget || 0) }}</div>
        <div class="card-sub">
          <span class="sub-dot" style="background: var(--info)"></span>
          {{ periodLabel || 'החודש הנוכחי' }}
        </div>
      </div>

      <!-- Actual Spend -->
      <div class="kpi-card fade-up" :class="`fade-up-${5 + cplCards.length}`">
        <div class="card-header">
          <span class="card-label">הוצאה בפועל</span>
          <div class="card-icon" :style="{ color: utilColor }"><IconReceipt /></div>
        </div>
        <div class="card-value font-display" :style="{ color: utilColor }">
          {{ fmtCurrency(budget?.actual_spend || 0) }}
        </div>
        <div class="card-sub">
          <span class="sub-dot" :style="{ background: utilColor }"></span>
          {{ utilization != null ? utilization + '% ניצול' : '—' }}
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { formatNumber, getPlatformLabel, CPL_PLATFORM_MERGE } from '../../lib/constants.js'

const props = defineProps({
  stats: { type: Object, default: null },
  budget: { type: Object, default: () => ({}) },
  platformBudgets: { type: Array, default: () => [] }, // [{name, monthly_budget, actual_spend}]
  periodLabel: { type: String, default: '' },
})

function fmt(n) { return formatNumber(n) }
function fmtCurrency(n) {
  if (!n) return '₪0'
  return '₪' + Number(n).toLocaleString('he-IL')
}

// ── Top platform ───────────────────────────────────────────────────────────
const topEntry = computed(() => {
  const bp = props.stats?.by_platform || {}
  const entries = Object.entries(bp).sort((a, b) => b[1] - a[1])
  return entries[0] || null
})
const topPlatformLabel = computed(() => topEntry.value ? getPlatformLabel(topEntry.value[0]) : '—')
const topPlatformSub = computed(() => topEntry.value ? `${fmt(topEntry.value[1])} לידים` : 'אין נתונים')

// ── Per-platform CPL cards ─────────────────────────────────────────────────
// Build reverse map: which platform's leads are consumed by another (e.g., 'website' → 'google')
const MERGED_INTO = Object.fromEntries(
  Object.entries(CPL_PLATFORM_MERGE).map(([parent, child]) => [child, parent])
)

const cplCards = computed(() => {
  if (!props.platformBudgets.length) return []
  const byPlatform = props.stats?.by_platform || {}
  const budgetNames = new Set(props.platformBudgets.filter(p => p.monthly_budget > 0 || p.actual_spend > 0).map(p => p.name))

  return props.platformBudgets
    .filter(p => {
      if (!(p.monthly_budget > 0 || p.actual_spend > 0)) return false
      // Hide child platforms whose leads are merged into a parent that has budget
      const parent = MERGED_INTO[p.name]
      if (parent && budgetNames.has(parent)) return false
      return true
    })
    .map(p => {
      const mergedChild = CPL_PLATFORM_MERGE[p.name]
      const ownLeads = Number(byPlatform[p.name] || 0)
      const childLeads = mergedChild ? Number(byPlatform[mergedChild] || 0) : 0
      const leads = ownLeads + childLeads
      const cpl = p.actual_spend > 0 && leads > 0 ? p.actual_spend / leads : null
      return {
        name: p.name,
        label: getPlatformLabel(p.name),
        monthly_budget: p.monthly_budget,
        actual_spend: p.actual_spend,
        leads,
        ownLeads,
        childLeads,
        mergedChildLabel: childLeads > 0 ? getPlatformLabel(mergedChild) : null,
        cpl,
      }
    })
})

// ── Global CPL (fallback when no per-platform data) ───────────────────────
const hasBudget = computed(() => {
  const b = props.budget || {}
  return (Number(b.monthly_budget) || 0) > 0 || (Number(b.actual_spend) || 0) > 0
})

const leadsForCpl = computed(() => {
  const override = Number(props.budget?.leads_override) || 0
  return override || Number(props.stats?.total || 0)
})

const globalCpl = computed(() => {
  const spend = Number(props.budget?.actual_spend) || 0
  const leads = leadsForCpl.value
  if (!spend || !leads) return null
  return spend / leads
})

// ── Budget utilization (global) ────────────────────────────────────────────
const utilization = computed(() => {
  const monthly = Number(props.budget?.monthly_budget) || 0
  const spend = Number(props.budget?.actual_spend) || 0
  if (!monthly) return null
  return Math.round((spend / monthly) * 1000) / 10
})

const utilColor = computed(() => {
  const u = utilization.value
  if (u === null) return 'var(--text-dim)'
  if (u < 70) return 'var(--success)'
  if (u < 90) return 'var(--warning)'
  return 'var(--danger)'
})

// ── Icons ──────────────────────────────────────────────────────────────────
function IconUsers() {
  return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, [
    h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
    h('circle', { cx: 9, cy: 7, r: 4 }),
    h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
    h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }),
  ])
}
function IconChart() {
  return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, [
    h('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' }),
  ])
}
function IconCoin() {
  return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, [
    h('circle', { cx: 12, cy: 12, r: 10 }),
    h('path', { d: 'M12 6v2' }),
    h('path', { d: 'M12 16v2' }),
    h('path', { d: 'M8.5 9.5A3.5 1.5 0 0 1 12 8a3.5 1.5 0 0 1 3.5 1.5c0 .83-1.57 1.5-3.5 1.5s-3.5.67-3.5 1.5A3.5 1.5 0 0 0 12 14a3.5 1.5 0 0 0 3.5-1.5' }),
  ])
}
function IconGauge() {
  return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, [
    h('path', { d: 'M12 2a10 10 0 0 1 10 10' }),
    h('path', { d: 'M2 12a10 10 0 0 0 10 10' }),
    h('path', { d: 'M12 2C6.48 2 2 6.48 2 12' }),
    h('path', { d: 'M12 12l4-6' }),
    h('circle', { cx: 12, cy: 12, r: 2 }),
  ])
}
function IconCalendar() {
  return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, [
    h('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2 }),
    h('path', { d: 'M16 2v4' }),
    h('path', { d: 'M8 2v4' }),
    h('path', { d: 'M3 10h18' }),
  ])
}
function IconReceipt() {
  return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, [
    h('path', { d: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z' }),
    h('path', { d: 'M16 8H8' }),
    h('path', { d: 'M16 12H8' }),
    h('path', { d: 'M13 16H8' }),
  ])
}
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px 24px 20px;
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-hover);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.card-label-platform {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  color: var(--gold);
}

.card-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--icon-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-value {
  font-family: 'DM Serif Display', serif;
  font-size: 44px;
  line-height: 1;
  color: var(--text);
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

.card-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.sub-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.merge-note {
  font-size: 10px;
  color: var(--text-dim);
}

.period-tag {
  font-size: 10px;
  color: var(--text-dim);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1px 6px;
  margin-right: 2px;
}

.cpl-hint {
  font-size: 13px;
  color: var(--text-dim);
  font-style: italic;
  padding: 8px 0 20px;
}

/* Utilization card */
.util-track {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0 12px;
}

.util-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.7s ease;
}

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .card-value { font-size: 38px; }
}

@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
