<template>
  <div class="table-card card fade-up fade-up-7">
    <div class="card-header">
      <div class="section-label">מקורות תנועה</div>
      <h3 class="section-title">מקורות</h3>
    </div>

    <div v-if="!sources.length" class="empty-state">
      <span class="text-muted">אין נתוני מקורות</span>
    </div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>מקור</th>
          <th class="num-col">לידים</th>
          <th class="bar-col">אחוז</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in sorted" :key="`${s.name}-${s.platform}`">
          <td>
            <span class="source-name">{{ s.name || '—' }}</span>
          </td>
          <td class="num-col">
            <span class="num-val">{{ fmt(s.lead_count) }}</span>
          </td>
          <td class="bar-col">
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: pct(s.lead_count) + '%', background: getColor(s.platform) }"
              ></div>
            </div>
            <span class="bar-label">{{ pct(s.lead_count) }}%</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getPlatformColor, getPlatformLabel, formatNumber } from '../../lib/constants.js'

const props = defineProps({
  sources: { type: Array, default: () => [] },
})

const sorted = computed(() =>
  [...props.sources].sort((a, b) => b.lead_count - a.lead_count).slice(0, 10)
)

const totalLeads = computed(() =>
  props.sources.reduce((sum, s) => sum + Number(s.lead_count), 0)
)

function pct(count) {
  if (!totalLeads.value) return 0
  return Math.round((Number(count) / totalLeads.value) * 100)
}

function getColor(name) { return getPlatformColor(name) }
function getLabel(name) { return getPlatformLabel(name) }
function fmt(n) { return formatNumber(n) }

function badgeStyle(platform) {
  const color = getPlatformColor(platform)
  return {
    background: color + '1A',
    color: color,
    border: `1px solid ${color}33`,
  }
}
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
  padding: 10px 0;
  border-bottom: 1px solid var(--row-border);
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.source-name {
  font-weight: 500;
  color: var(--text);
}

.platform-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.num-col { text-align: right; width: 100px; padding-right: 20px; }

.num-val {
  font-family: 'DM Serif Display', serif;
  font-size: 15px;
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

.empty-state {
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
}
</style>
