import { ref, watch, computed } from 'vue'
import api from '../lib/api.js'

export function useClientData(clientId, from, to, activeProject, adminOptions) {
  const _proj = activeProject || ref('')
  const _opts = adminOptions || {}

  const leadsResponse = ref(null)
  const allLeads = ref([])
  const loading = ref(false)
  const loadingAll = ref(false)
  const error = ref(null)

  const page = ref(1)
  const perPage = ref(50)
  const search = ref('')
  const filterPlatform = ref('')
  const sortBy = ref('lead_date')
  const sortDir = ref('DESC')

  // Status param: 'sent' by default, '' (all) when admin shows extras
  const statusParam = computed(() => {
    const sf = _opts.showFailed?.value
    const sp = _opts.showPending?.value
    return (sf || sp) ? '' : 'sent'
  })

  // ── Client name ────────────────────────────────────────────────────────────
  const clientName = ref('')
  async function fetchClientName() {
    if (!clientId.value) return
    try {
      const res = await api.get('/clients')
      const list = res.data?.clients || []
      const match = list.find((c) => String(c.id) === String(clientId.value))
      if (match) clientName.value = match.name
    } catch { /* non-critical */ }
  }

  // ── Leads — request counter prevents stale responses ──────────────────────
  let _leadsReqId = 0

  async function fetchLeads() {
    if (!clientId.value) return
    const myReq = ++_leadsReqId
    loading.value = true
    error.value = null
    try {
      const params = {
        date_from: from.value,
        date_to: to.value,
        page: page.value,
        per_page: perPage.value,
        sort: sortBy.value,
        dir: sortDir.value,
      }
      if (search.value) params.search = search.value
      if (filterPlatform.value) params.platform = filterPlatform.value
      if (statusParam.value) params.status = statusParam.value
      if (_proj.value) params.project_name = _proj.value

      const res = await api.get(`/leads/client/${clientId.value}`, { params })
      if (myReq !== _leadsReqId) return // stale — a newer request is in flight
      leadsResponse.value = res.data
    } catch (e) {
      if (myReq !== _leadsReqId) return
      error.value = e?.response?.data?.error || 'שגיאה בטעינת הנתונים'
    } finally {
      if (myReq === _leadsReqId) loading.value = false
    }
  }

  // ── All leads for chart ────────────────────────────────────────────────────
  let _chartReqId = 0

  async function fetchAllLeadsForChart() {
    if (!clientId.value) return
    const myReq = ++_chartReqId
    loadingAll.value = true
    allLeads.value = []
    try {
      const params = {
        date_from: from.value,
        date_to: to.value,
        per_page: 200,
        sort: 'lead_date',
        dir: 'ASC',
      }
      if (statusParam.value) params.status = statusParam.value
      if (_proj.value) params.project_name = _proj.value

      let currentPage = 1
      let totalPages = 1
      const collected = []

      while (currentPage <= totalPages && currentPage <= 50) {
        if (myReq !== _chartReqId) return
        const res = await api.get(`/leads/client/${clientId.value}`, { params: { ...params, page: currentPage } })
        const d = res.data
        collected.push(...(d.leads || []))
        totalPages = d.total_pages || 1
        currentPage++
        if (currentPage <= totalPages) allLeads.value = [...collected]
      }
      if (myReq === _chartReqId) allLeads.value = collected
    } catch { /* chart stays empty */ } finally {
      if (myReq === _chartReqId) loadingAll.value = false
    }
  }

  // ── Projects/campaigns ─────────────────────────────────────────────────────
  const projectsRaw = ref([])
  async function fetchProjects() {
    if (!clientId.value) return
    try {
      const now = new Date()
      const res = await api.get('/campaigns', { params: { month: now.getMonth() + 1, year: now.getFullYear() } })
      const clientGroup = (res.data?.campaigns || []).find((g) => String(g.client_id) === String(clientId.value))
      projectsRaw.value = (clientGroup?.projects || []).map(mapProject)
    } catch { /* non-critical */ }
  }

  function mapProject(proj) {
    const platforms = (proj.platforms || []).map((c) => ({
      name: (c.platform || 'unknown').toLowerCase(),
      monthly_budget: parseFloat(c.monthly_budget || 0),
      updated_budget: parseFloat(c.updated_budget || c.monthly_budget || 0),
      budget_usage: parseFloat(c.monthly_budget_usage || 0),
      local_leads: parseInt(c.local_leads || 0),
    }))
    const total = platforms.reduce(
      (acc, p) => { acc.monthly_budget += p.monthly_budget; acc.updated_budget += p.updated_budget; acc.budget_usage += p.budget_usage; return acc },
      { monthly_budget: 0, updated_budget: 0, budget_usage: 0 }
    )
    const effective = total.updated_budget > 0 ? total.updated_budget : total.monthly_budget
    total.usage_percent = effective > 0 ? Math.round((total.budget_usage / effective) * 10000) / 100 : 0
    return { name: proj.project_name, platforms, total_budget: total, leads: proj.local_leads || 0 }
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const stats = computed(() => {
    const r = leadsResponse.value
    if (!r) return null
    return {
      total: r.total || 0,
      by_platform: r.platformCounts || {},
      by_source: computeBySource(r.leads || []),
    }
  })

  const client = computed(() => clientName.value ? { id: clientId.value, name: clientName.value } : null)

  const pagination = computed(() => {
    const r = leadsResponse.value
    if (!r) return null
    return { page: r.page, per_page: r.per_page, total: r.total, total_pages: r.total_pages }
  })

  const leads = computed(() => leadsResponse.value?.leads || [])
  const projects = computed(() => projectsRaw.value)
  const projectNames = computed(() => projectsRaw.value.map((p) => p.name).filter(Boolean).sort())

  const platforms = computed(() =>
    Object.entries(stats.value?.by_platform || {})
      .map(([name, lead_count]) => ({ name, lead_count: Number(lead_count) }))
      .sort((a, b) => b.lead_count - a.lead_count)
  )

  const sources = computed(() =>
    Object.entries(stats.value?.by_source || {})
      .map(([name, lead_count]) => ({ name, lead_count: Number(lead_count), platform: '' }))
      .sort((a, b) => b.lead_count - a.lead_count)
  )

  const dailyChart = computed(() => {
    const src = allLeads.value.length ? allLeads.value : leads.value
    const daily = {}
    for (const lead of src) {
      const day = lead.lead_date?.substring(0, 10)
      if (day) daily[day] = (daily[day] || 0) + 1
    }
    return Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
  })

  function computeBySource(leadsArr) {
    const map = {}
    for (const lead of leadsArr) {
      if (lead.source) map[lead.source] = (map[lead.source] || 0) + 1
    }
    return map
  }

  // ── Refresh ────────────────────────────────────────────────────────────────
  async function refreshAll() {
    page.value = 1
    search.value = ''
    filterPlatform.value = ''
    sortBy.value = 'lead_date'
    sortDir.value = 'DESC'
    await Promise.all([fetchLeads(), fetchProjects(), fetchClientName()])
    fetchAllLeadsForChart()
  }

  async function refreshData() {
    page.value = 1
    await fetchLeads()
    fetchAllLeadsForChart()
  }

  function refresh() { return refreshAll() }

  // When clientId changes → full refresh
  watch(clientId, (id) => { if (id && id !== '0') refreshAll() }, { immediate: true })

  // When date range changes → refetch data (not projects/client)
  watch([from, to], () => { if (clientId.value && clientId.value !== '0') refreshData() })

  // When status or project filter changes → refetch data
  watch([statusParam, _proj], () => { if (clientId.value && clientId.value !== '0') refreshData() })

  // When sort changes → reset to page 1, refetch
  watch([sortBy, sortDir], () => {
    if (!clientId.value || clientId.value === '0') return
    page.value = 1
    fetchLeads()
  })

  // When search or platform filter changes → reset to page 1, refetch
  watch([search, filterPlatform], () => {
    if (!clientId.value || clientId.value === '0') return
    page.value = 1
    fetchLeads()
  })

  // When page or perPage changes → refetch (only if not caused by filter reset above)
  watch(page, (newPage, oldPage) => {
    if (newPage === oldPage) return
    if (!clientId.value || clientId.value === '0') return
    fetchLeads()
  })
  watch(perPage, () => {
    if (!clientId.value || clientId.value === '0') return
    page.value = 1
    fetchLeads()
  })

  return {
    loading, loadingAll, error,
    leadsResponse, stats, client, pagination, leads,
    platforms, sources, projects, projectNames,
    allLeads, dailyChart,
    page, perPage, search, filterPlatform, sortBy, sortDir,
    refresh, fetchLeads,
  }
}
