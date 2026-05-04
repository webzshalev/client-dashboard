<template>
  <div class="dashboard">
    <AppHeader
      :clientName="client?.name || '...'"
      :presets="presets"
      :activePreset="activePreset"
      v-model:from="from"
      v-model:to="to"
      @applyPreset="applyPreset"
    />

    <ProjectTabs
      v-if="tabs.length > 1"
      :tabs="tabs"
      :activeProject="activeProject"
      @select="setProject"
    />

    <main class="dashboard-main">
      <div v-if="loading && !leadsResponse" class="container">
        <LoadingSkeleton />
      </div>

      <div v-else-if="error" class="container">
        <div class="error-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.5" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
          <h2 class="font-display">לא ניתן לטעון את הנתונים</h2>
          <p>{{ error }}</p>
          <button class="retry-btn" @click="refresh">נסה שוב</button>
        </div>
      </div>

      <template v-else>
        <div class="container">
          <KpiCards
            :stats="stats"
            :budget="activeBudget"
            :platformBudgets="platformBudgets"
            :periodLabel="periodLabel"
          />

          <DailyLeadsChart :dailyData="dailyChart" :loadingAll="loadingAll" />

          <div v-if="platforms.length || sources.length" class="two-col">
            <PlatformTable :platforms="platforms" />
            <SourceTable :sources="sources" />
          </div>

          <LeadsTable
            :leads="leads"
            :pagination="pagination"
            :loading="loading"
            :page="page"
            :perPage="perPage"
            :search="search"
            :filterPlatform="filterPlatform"
            :stats="stats"
            @update:page="(v) => { page.value = v }"
            @update:search="(v) => { search.value = v }"
            @update:filterPlatform="(v) => { filterPlatform.value = v }"
          />

          <div v-if="projects.length">
            <ProjectsGrid :projects="projects" />
          </div>

          <div class="footer-note">
            <span>עודכן לאחרונה: {{ lastUpdated }}</span>
          </div>
        </div>
      </template>
    </main>

    <AdminPanel
      :clientId="clientId"
      :projectNames="projectNames"
      :activeProject="activeProject"
      :sentCount="stats?.total || 0"
      :platforms="platforms"
      :projects="projects"
      @budgetSaved="reloadBudget"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDateRange } from '../composables/useDateRange.js'
import { useClientData } from '../composables/useClientData.js'
import { useAdmin } from '../composables/useAdmin.js'
import { decodeToken } from '../lib/tokenUtils.js'

import AppHeader from '../components/layout/AppHeader.vue'
import ProjectTabs from '../components/layout/ProjectTabs.vue'
import LoadingSkeleton from '../components/layout/LoadingSkeleton.vue'
import KpiCards from '../components/kpi/KpiCards.vue'
import DailyLeadsChart from '../components/charts/DailyLeadsChart.vue'
import PlatformTable from '../components/tables/PlatformTable.vue'
import SourceTable from '../components/tables/SourceTable.vue'
import LeadsTable from '../components/tables/LeadsTable.vue'
import ProjectsGrid from '../components/projects/ProjectsGrid.vue'
import AdminPanel from '../components/admin/AdminPanel.vue'

const route = useRoute()
const router = useRouter()

const clientId = computed(() => {
  const t = route.params.token
  if (!t) return ''
  if (/^\d+$/.test(t)) return t
  const decoded = decodeToken(t)
  return decoded ? String(decoded) : ''
})

const { from, to, presets, activePreset, applyPreset } = useDateRange()

const { showFailed, showPending, loadBudget, loadPlatformBudgets } = useAdmin(clientId)
const adminOptions = { showFailed, showPending }

const activeProject = ref(route.query.project || '')
watch(() => route.query.project, (p) => { activeProject.value = p || '' })

function setProject(key) {
  activeProject.value = key
  const query = { ...route.query }
  if (key) { query.project = key } else { delete query.project }
  router.replace({ query })
  reloadBudget()
}

const {
  loading, loadingAll, error,
  leadsResponse, stats, client, pagination, leads,
  platforms, sources, projects, projectNames,
  dailyChart,
  page, perPage, search, filterPlatform,
  refresh,
} = useClientData(clientId, from, to, activeProject, adminOptions)

const tabs = computed(() => [
  { key: '', label: 'כל הלקוח' },
  ...(projectNames.value || []).map((name) => ({ key: name, label: name })),
])

// ── Budget ─────────────────────────────────────────────────────────────────
const activeBudget = ref({ monthly_budget: 0, actual_spend: 0, leads_override: 0 })
const platformBudgets = ref([]) // [{name, monthly_budget, actual_spend}]

function reloadBudget() {
  const saved = loadPlatformBudgets(activeProject.value)

  // Build platform budget map: start from API project data
  const budgetMap = {}
  const matchingProjects = activeProject.value
    ? projects.value.filter(p => p.name === activeProject.value)
    : projects.value

  for (const proj of matchingProjects) {
    for (const plat of (proj.platforms || [])) {
      const name = (plat.name || 'unknown').toLowerCase()
      if (!budgetMap[name]) budgetMap[name] = { name, monthly_budget: 0, actual_spend: 0 }
      budgetMap[name].monthly_budget += Number(plat.updated_budget || plat.monthly_budget || 0)
      budgetMap[name].actual_spend += Number(plat.budget_usage || 0)
    }
  }

  // Apply admin overrides (override API values when admin has explicitly saved)
  for (const [name, vals] of Object.entries(saved)) {
    if (!budgetMap[name]) budgetMap[name] = { name, monthly_budget: 0, actual_spend: 0 }
    if (Number(vals.monthly_budget) > 0) budgetMap[name].monthly_budget = Number(vals.monthly_budget)
    if (Number(vals.actual_spend) > 0) budgetMap[name].actual_spend = Number(vals.actual_spend)
  }

  platformBudgets.value = Object.values(budgetMap).filter(p => p.monthly_budget > 0 || p.actual_spend > 0)

  // Global budget for utilization cards
  const projectBudget = loadBudget(activeProject.value)
  const pList = platformBudgets.value
  if (pList.length > 0) {
    activeBudget.value = {
      monthly_budget: pList.reduce((s, p) => s + p.monthly_budget, 0),
      actual_spend: pList.reduce((s, p) => s + p.actual_spend, 0),
      leads_override: Number(projectBudget.leads_override) || 0,
    }
  } else {
    activeBudget.value = projectBudget
  }
}

// Reload when project/client changes or admin saves
watch([activeProject, clientId], reloadBudget, { immediate: true })
// Reload when API project data arrives (to populate API defaults)
watch(projects, reloadBudget)

// ── Period label for CPL cards ─────────────────────────────────────────────
const periodLabel = computed(() => {
  if (!from.value || !to.value) return ''
  const f = new Date(from.value + 'T00:00:00')
  const t = new Date(to.value + 'T00:00:00')
  if (f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear()) {
    return f.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  }
  return `${f.toLocaleDateString('he-IL', { month: 'short' })} — ${t.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })}`
})

const lastUpdated = computed(() => {
  const now = new Date()
  return now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--bg);
}

.dashboard-main {
  padding: 28px 0 60px;
}

.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  text-align: center;
}

.error-state h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--text);
}

.error-state p { color: var(--text-muted); font-size: 14px; }

.retry-btn {
  background: var(--gold);
  color: #0F1117;
  border: none;
  border-radius: var(--radius-sm);
  padding: 10px 24px;
  font-family: 'Heebo', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 8px;
}

.retry-btn:hover { opacity: 0.85; }

.footer-note {
  text-align: center;
  font-size: 11px;
  color: var(--text-dim);
  padding: 12px 0 0;
  letter-spacing: 0.04em;
}

@media (max-width: 768px) {
  .container { padding: 0 16px; }
  .two-col { grid-template-columns: 1fr; }
}
</style>
