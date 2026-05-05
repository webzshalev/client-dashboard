import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

function toISODate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfThisWeek() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay()) // back to Sunday
  return d
}

function startOfThisMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfLastMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

function endOfLastMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 0)
}

export function useDateRange() {
  const route = useRoute()
  const router = useRouter()

  const today = toISODate(new Date())
  const defaultFrom = toISODate(startOfThisMonth())

  const from = ref(route.query.from || defaultFrom)
  const to = ref(route.query.to || today)

  const presets = [
    {
      label: 'השבוע',
      apply() {
        from.value = toISODate(startOfThisWeek())
        to.value = today
      },
    },
    {
      label: 'החודש',
      apply() {
        from.value = toISODate(startOfThisMonth())
        to.value = today
      },
    },
    {
      label: 'חודש קודם',
      apply() {
        from.value = toISODate(startOfLastMonth())
        to.value = toISODate(endOfLastMonth())
      },
    },
  ]

  const activePreset = computed(() => {
    const f = from.value
    const t = to.value
    const todayStr = toISODate(new Date())
    const checks = [
      { label: 'השבוע',      from: toISODate(startOfThisWeek()),  to: todayStr },
      { label: 'החודש',      from: toISODate(startOfThisMonth()), to: todayStr },
      { label: 'חודש קודם', from: toISODate(startOfLastMonth()), to: toISODate(endOfLastMonth()) },
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
