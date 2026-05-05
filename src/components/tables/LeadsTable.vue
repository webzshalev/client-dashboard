<template>
  <div class="leads-card card fade-up fade-up-6">
    <div class="card-top">
      <div>
        <div class="section-label">רשימת לידים</div>
        <h3 class="section-title">
          10 הלידים האחרונים
          <span v-if="pagination" class="total-badge">{{ fmt(pagination.total) }} סה"כ</span>
        </h3>
      </div>
    </div>

    <div v-if="loading" class="loading-row">
      <div class="spinner"></div>
      <span>טוען לידים...</span>
    </div>

    <div v-else-if="!recentLeads.length" class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" stroke-width="1.5" stroke-linecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <p>אין לידים בטווח הנבחר</p>
      <span class="text-muted">נסה לבחור טווח תאריכים רחב יותר</span>
    </div>

    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="num-th">#</th>
            <th>שם מלא</th>
            <th>טלפון</th>
            <th>פלטפורמה</th>
            <th>מקור</th>
            <th>פרויקט</th>
            <th>תאריך</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(lead, i) in recentLeads" :key="lead.id">
            <td class="num-td">
              <span class="row-num">{{ i + 1 }}</span>
            </td>
            <td>
              <span class="lead-name">{{ lead.full_name || '—' }}</span>
            </td>
            <td>
              <a v-if="lead.phone" :href="`tel:${lead.phone}`" class="phone-link">
                {{ lead.phone }}
              </a>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <span class="platform-badge" :style="platformStyle(lead.platform)">
                {{ getPlatformLabel(lead.platform) }}
              </span>
            </td>
            <td>
              <span class="source-text">{{ lead.source || '—' }}</span>
            </td>
            <td>
              <span class="project-text" :title="lead.project_name">{{ truncate(lead.project_name, 22) }}</span>
            </td>
            <td>
              <span class="date-text">{{ fmtDateTime(lead.lead_date) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getPlatformColor, getPlatformLabel, formatNumber, formatDateTime } from '../../lib/constants.js'

const props = defineProps({
  leads: { type: Array, default: () => [] },
  pagination: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const recentLeads = computed(() => props.leads.slice(0, 10))

function fmt(n) { return formatNumber(n) }
function fmtDateTime(d) { return formatDateTime(d) }

function platformStyle(platform) {
  const color = getPlatformColor(platform)
  return { background: color + '1A', color, border: `1px solid ${color}33` }
}

function truncate(str, max) {
  if (!str) return '—'
  return str.length > max ? str.substring(0, max) + '…' : str
}
</script>

<style scoped>
.leads-card { padding: 24px; }

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-badge {
  background: var(--gold-dim);
  color: var(--gold);
  border: 1px solid rgba(201,168,76,0.25);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  font-family: 'Heebo', sans-serif;
}

.table-wrap { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.data-table th {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
  padding: 0 8px 10px;
  text-align: right;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.data-table td {
  padding: 11px 8px;
  border-bottom: 1px solid var(--row-border);
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
}

.data-table tbody tr:hover td { background: var(--row-hover); }
.data-table tr:last-child td { border-bottom: none; }
.num-th, .num-td { width: 36px; text-align: center; }

.row-num { font-size: 11px; color: var(--text-dim); }

.lead-name { font-weight: 500; color: var(--text); }

.phone-link {
  color: var(--gold);
  text-decoration: none;
  font-size: 13px;
  transition: opacity 0.15s;
  direction: ltr;
  display: inline-block;
}
.phone-link:hover { opacity: 0.75; }

.platform-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.source-text, .project-text {
  font-size: 12px;
  color: var(--text-muted);
}

.date-text {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  direction: ltr;
  display: inline-block;
}

.loading-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
