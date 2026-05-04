<template>
  <div class="skeleton-wrap">
    <div class="kpi-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton s-label"></div>
        <div class="skeleton s-number"></div>
        <div class="skeleton s-sub"></div>
      </div>
    </div>

    <div class="skeleton-card chart-card">
      <div class="skeleton s-chart-title"></div>
      <div class="skeleton s-chart"></div>
    </div>

    <div class="two-col">
      <div class="skeleton-card">
        <div class="skeleton s-label"></div>
        <div v-for="i in 4" :key="i" class="skeleton s-row"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton s-label"></div>
        <div v-for="i in 4" :key="i" class="skeleton s-row"></div>
      </div>
    </div>

    <div class="skeleton-card">
      <div class="skeleton s-label"></div>
      <div v-for="i in 5" :key="i" class="skeleton s-table-row"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.skeleton-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-card {
  gap: 16px;
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface) 0px,
    var(--surface-2) 40px,
    var(--surface) 80px
  );
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite linear;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: -800px 0; }
  100% { background-position: 800px 0; }
}

.s-label { height: 12px; width: 80px; }
.s-number { height: 48px; width: 60%; }
.s-sub { height: 10px; width: 40%; }
.s-chart-title { height: 16px; width: 160px; }
.s-chart { height: 220px; }
.s-row { height: 32px; }
.s-table-row { height: 44px; }

@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .two-col { grid-template-columns: 1fr; }
}
</style>
