import { ref, computed, watch } from 'vue'

export function useBudget(clientId, stats) {
  const budget = ref(0)

  function load(id) {
    const saved = localStorage.getItem(`budget_${id}`)
    budget.value = saved !== null ? Number(saved) : 0
  }

  watch(clientId, (id) => { if (id) load(id) }, { immediate: true })

  function saveBudget(raw) {
    const num = Number(String(raw).replace(/[^\d.]/g, '')) || 0
    budget.value = num
    if (clientId.value) localStorage.setItem(`budget_${clientId.value}`, num)
  }

  const cpl = computed(() => {
    const total = Number(stats.value?.total || 0)
    if (!budget.value || !total) return null
    return budget.value / total
  })

  return { budget, saveBudget, cpl }
}
