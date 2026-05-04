import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

function toISODate(d) {
  return d.toISOString().substring(0, 10)
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export function useDateRange() {
  const route = useRoute()
  const router = useRouter()

  const today = toISODate(new Date())
  const defaultFrom = toISODate(daysAgo(30))

  const from = ref(route.query.from || defaultFrom)
  const to = ref(route.query.to || today)

  const presets = [
    {
      label: 'היום',
      apply() {
        from.value = today
        to.value = today
      },
    },
    {
      label: 'שבוע אחרון',
      apply() {
        from.value = toISODate(daysAgo(7))
        to.value = today
      },
    },
    {
      label: 'חודש אחרון',
      apply() {
        from.value = toISODate(daysAgo(30))
        to.value = today
      },
    },
    {
      label: '3 חודשים',
      apply() {
        from.value = toISODate(daysAgo(90))
        to.value = today
      },
    },
    {
      label: 'השנה',
      apply() {
        const y = new Date().getFullYear()
        from.value = `${y}-01-01`
        to.value = today
      },
    },
  ]

  const activePreset = computed(() => {
    const f = from.value
    const t = to.value
    const todayStr = toISODate(new Date())
    const y = new Date().getFullYear()
    const checks = [
      { label: 'היום',        from: todayStr,                   to: todayStr },
      { label: 'שבוע אחרון',  from: toISODate(daysAgo(7)),      to: todayStr },
      { label: 'חודש אחרון',  from: toISODate(daysAgo(30)),     to: todayStr },
      { label: '3 חודשים',   from: toISODate(daysAgo(90)),     to: todayStr },
      { label: 'השנה',        from: `${y}-01-01`,               to: todayStr },
    ]
    return checks.find((c) => c.from === f && c.to === t)?.label || null
  })

  watch([from, to], ([f, t]) => {
    router.replace({ query: { ...route.query, from: f, to: t } })
  })

  function applyPreset(preset) {
    preset.apply()
  }

  return { from, to, presets, activePreset, applyPreset }
}
