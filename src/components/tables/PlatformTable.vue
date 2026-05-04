<template>
  <div class="table-card card fade-up fade-up-6">
    <div class="card-header">
      <div class="section-label">ערוצי שיווק</div>
      <h3 class="section-title">פלטפורמות</h3>
    </div>

    <div v-if="!platforms.length" class="empty-state">
      <span class="text-muted">אין נתוני פלטפורמות</span>
    </div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>פלטפורמה</th>
          <th class="num-col">לידים</th>
          <th class="bar-col">אחוז</th>
          <th class="date-col">אחרון</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="p in sorted"
          :key="p.name"
          class="clickable-row"
          :class="{ 'row-active': activeFilter === p.name }"
          @click="toggleFilter(p.name)"
        >
          <td>
            <div class="platform-cell">
              <span class="platform-dot" :style="{ background: getColor(p.name) }"></span>
              <span class="platform-name">{{ getLabel(p.name) }}</span>
            </div>
          </td>
          <td class="num-col">
            <span class="num-val">{{ fmt(p.lead_count) }}</span>
          </td>
          <td class="bar-col">
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: pct(p.lead_count) + '%', background: getColor(p.name) }"
              ></div>
            </div>
            <span class="bar-label">{{ pct(p.lead_count) }}%</span>
          </td>
          <td class="date-col">
            <span class="date-val">{{ fmtDate(p.last_lead) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getPlatformColor, getPlatformLabel, formatNumber, formatDate } from '../../lib/constants.js'

const props = defineProps({
  platforms: { type: Array, default: () => [] },
  activeFilter: { type: String, default: '' },
})

const emit = defineEmits(['filterBy'])

function toggleFilter(name) {
  emit('filterBy', props.activeFilter === name ? '' : name)
}

const sorted = computed(() =>
  [...props.platforms].sort((a, b) => b.lead_count - a.lead_count)
)

const totalLeads = computed(() =>
  props.platforms.reduce((sum, p) => sum + Number(p.lead_count), 0)
)

function pct(count) {
  if (!totalLeads.value) return 0
  return Math.round((Number(count) / totalLeads.value) * 100)
}

function getColor(name) { return getPlatformColor(name) }
function getLabel(name) { return getPlatformLabel(name) }
function fmt(n) { return formatNumber(n) }
function fmtDate(d) { return formatDate(d) }
</script>

<style scoped>
.table-card {
  padding: 24px;
}

.card-header {
  margin-bottom: 20px;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
  padding: 0 0 10px;
  text-align: right;
  border-bottom: 1px solid var(--border);
}

.data-table td {
  padding: 12px 0;
  border-bottom: 1px solid var(--row-border);
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.platform-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.platform-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.platform-name {
  font-weight: 500;
}

.num-val {
  font-family: 'DM Serif Display', serif;
  font-size: 15px;
  color: var(--text);
}

.bar-col { width: 110px; }

.bar-track {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
  opacity: 0.85;
}

.bar-label {
  font-size: 11px;
  color: var(--text-muted);
}

.date-col { width: 90px; }

.date-val {
  font-size: 11px;
  color: var(--text-muted);
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.15s;
}

.clickable-row:hover td {
  background: var(--surface-2);
}

.row-active td {
  background: rgba(212, 175, 55, 0.07);
}

.row-active .platform-name {
  color: var(--gold);
  font-weight: 700;
}
</style>
