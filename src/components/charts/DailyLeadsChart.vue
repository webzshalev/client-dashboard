<template>
  <div class="chart-card card fade-up fade-up-5">
    <div class="chart-header">
      <div>
        <div class="section-label">מגמת לידים</div>
        <h3 class="section-title">לידים לפי יום</h3>
      </div>
      <div v-if="loadingAll" class="loading-dot">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <div v-if="!dailyData.length" class="empty-chart">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" stroke-width="1.5" stroke-linecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <p>אין נתונים להצגה</p>
    </div>

    <div v-else class="chart-container">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { Chart, LineController, BarController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler } from 'chart.js'
import { useTheme } from '../../composables/useTheme.js'

Chart.register(LineController, BarController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler)

const props = defineProps({
  dailyData: { type: Array, default: () => [] },
  loadingAll: { type: Boolean, default: false },
})

const { isDark } = useTheme()
const canvasRef = ref(null)
let chartInstance = null

function formatDateHebrew(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
}

function buildChart() {
  if (!canvasRef.value || !props.dailyData.length) return
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const labels = props.dailyData.map((d) => formatDateHebrew(d.date))
  const data = props.dailyData.map((d) => d.count)
  const isBar = props.dailyData.length < 4

  const gold = '#C9A84C'
  const goldLight = 'rgba(201, 168, 76, 0.25)'
  const goldDim = 'rgba(201, 168, 76, 0.06)'
  const dark = isDark.value
  const gridColor = dark ? 'rgba(255,255,255,0.04)' : 'rgba(27,43,75,0.07)'
  const tickColor = dark ? '#5A5E72' : '#9DAABF'
  const tooltipBg = dark ? '#1A1F2E' : '#FFFFFF'
  const tooltipBody = dark ? '#F0EDE8' : '#1B2B4B'
  const tooltipBorder = dark ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.4)'
  const pointBorder = dark ? '#0F1117' : '#FFFFFF'

  chartInstance = new Chart(canvasRef.value, {
    type: isBar ? 'bar' : 'line',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: isBar ? goldLight : (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height)
          gradient.addColorStop(0, goldLight)
          gradient.addColorStop(1, goldDim)
          return gradient
        },
        borderColor: gold,
        borderWidth: 2,
        pointRadius: props.dailyData.length > 60 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: gold,
        pointBorderColor: pointBorder,
        pointBorderWidth: 2,
        fill: !isBar,
        tension: 0.4,
        borderRadius: isBar ? 4 : 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          borderWidth: 1,
          titleColor: '#C9A84C',
          bodyColor: tooltipBody,
          padding: 12,
          cornerRadius: 8,
          rtl: true,
          textDirection: 'rtl',
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex
              const raw = props.dailyData[idx]?.date
              if (!raw) return ''
              const d = new Date(raw + 'T00:00:00')
              return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            },
            label: (item) => ` ${item.raw} לידים`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: tickColor,
            font: { family: 'Heebo', size: 11 },
            maxTicksLimit: 12,
          },
          border: { display: false },
        },
        y: {
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: tickColor,
            font: { family: 'Heebo', size: 11 },
            precision: 0,
          },
          border: { display: false },
          beginAtZero: true,
        },
      },
    },
  })
}

watch(() => props.dailyData, async () => {
  await nextTick()
  buildChart()
}, { deep: true })

watch(isDark, async () => {
  await nextTick()
  buildChart()
})

onMounted(async () => {
  await nextTick()
  buildChart()
})

onUnmounted(() => {
  chartInstance?.destroy()
})
</script>

<style scoped>
.chart-card {
  padding: 24px;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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

.chart-container {
  height: 240px;
  position: relative;
}

.empty-chart {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-dim);
  font-size: 14px;
}

.loading-dot {
  display: flex;
  gap: 4px;
  align-items: center;
  padding-top: 4px;
}

.loading-dot span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold);
  animation: bounce 1.2s ease infinite;
}

.loading-dot span:nth-child(2) { animation-delay: 0.2s; }
.loading-dot span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
