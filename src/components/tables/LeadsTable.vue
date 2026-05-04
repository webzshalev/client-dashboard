<template>
  <div class="leads-card card fade-up fade-up-6">
    <div class="card-top">
      <div>
        <div class="section-label">רשימת לידים</div>
        <h3 class="section-title">
          לידים
          <span v-if="pagination" class="total-badge">{{ fmt(pagination.total) }}</span>
        </h3>
      </div>

      <div class="filters-row">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchInput"
            type="text"
            class="search-input"
            placeholder="חפש לפי שם, טלפון..."
            dir="rtl"
          />
          <button v-if="searchInput" class="search-clear" @click="searchInput = ''" title="נקה חיפוש">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <select v-model="localPlatform" class="filter-select">
          <option value="">כל הפלטפורמות</option>
          <option v-for="p in platformOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
    </div>

    <!-- Active filter pill -->
    <div v-if="localPlatform" class="active-filters">
      <span class="filter-pill">
        <span class="pill-dot" :style="{ background: getPlatformColor(localPlatform) }"></span>
        {{ getPlatformLabel(localPlatform) }}
        <button class="pill-remove" @click="localPlatform = ''">×</button>
      </span>
    </div>

    <div v-if="loading" class="loading-row">
      <div class="spinner"></div>
      <span>טוען לידים...</span>
    </div>

    <div v-else-if="!leads.length" class="empty-state">
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
          <tr v-for="(lead, i) in leads" :key="lead.id">
            <td class="num-td">
              <span class="row-num">{{ (page - 1) * perPage + i + 1 }}</span>
            </td>
            <td>
              <div class="name-cell">
                <span class="lead-name">{{ lead.full_name || '—' }}</span>
              </div>
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

    <div v-if="pagination && pagination.total_pages > 1" class="pagination">
      <button class="page-btn" :disabled="page <= 1" @click="$emit('update:page', page - 1)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      <div class="page-info">
        <span class="page-current">{{ page }}</span>
        <span class="page-sep">/</span>
        <span class="page-total">{{ pagination.total_pages }}</span>
      </div>

      <button class="page-btn" :disabled="page >= pagination.total_pages" @click="$emit('update:page', page + 1)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <span class="page-count text-muted">{{ fmt(pagination.total) }} לידים סה"כ</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useDebounce } from '@vueuse/core'
import { getPlatformColor, getPlatformLabel, formatNumber, formatDateTime } from '../../lib/constants.js'

const props = defineProps({
  leads: { type: Array, default: () => [] },
  pagination: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  page: { type: Number, default: 1 },
  perPage: { type: Number, default: 50 },
  search: { type: String, default: '' },
  filterPlatform: { type: String, default: '' },
  stats: { type: Object, default: null },
})

const emit = defineEmits(['update:search', 'update:filterPlatform', 'update:page'])

const searchInput = ref(props.search)
const localPlatform = ref(props.filterPlatform)
const debouncedSearch = useDebounce(searchInput, 400)

watch(debouncedSearch, (v) => emit('update:search', v))
watch(localPlatform, (v) => emit('update:filterPlatform', v))

// Sync local state if parent clears filters (e.g. project switch)
watch(() => props.filterPlatform, (v) => { if (v !== localPlatform.value) localPlatform.value = v })
watch(() => props.search, (v) => { if (v !== searchInput.value) searchInput.value = v })

const platformOptions = computed(() => {
  const platforms = Object.keys(props.stats?.by_platform || {})
  return platforms.map((p) => ({ value: p, label: getPlatformLabel(p) }))
})

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
  flex-wrap: wrap;
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

.filters-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  right: 10px;
  color: var(--text-dim);
  pointer-events: none;
}

.search-input {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: 'Heebo', sans-serif;
  font-size: 13px;
  padding: 7px 32px 7px 32px;
  width: 200px;
  transition: border-color 0.18s;
}

.search-input:focus { outline: none; border-color: var(--gold); }
.search-input::placeholder { color: var(--text-dim); }

.search-clear {
  position: absolute;
  left: 8px;
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 3px;
  transition: color 0.15s;
}
.search-clear:hover { color: var(--text); }

.filter-select {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: 'Heebo', sans-serif;
  font-size: 12px;
  padding: 7px 10px;
  cursor: pointer;
  transition: border-color 0.18s;
  direction: rtl;
}

.filter-select:focus { outline: none; border-color: var(--gold); }
.filter-select option { background: var(--surface-2); }

/* Active filter pill */
.active-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  margin-top: -8px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--gold-dim);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 14px;
  padding: 3px 8px 3px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--gold);
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pill-remove {
  background: none;
  border: none;
  color: var(--gold);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 0 0 2px;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.pill-remove:hover { opacity: 1; }

.table-wrap { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;
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
.num-th, .num-td { width: 40px; text-align: center; }

.row-num { font-size: 11px; color: var(--text-dim); }

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

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

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  direction: ltr;
  justify-content: center;
}

.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.page-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  min-width: 60px;
  justify-content: center;
}

.page-current { color: var(--gold); font-weight: 700; }
.page-sep, .page-total { color: var(--text-muted); }
.page-count { font-size: 12px; margin-right: 8px; direction: rtl; }
</style>
