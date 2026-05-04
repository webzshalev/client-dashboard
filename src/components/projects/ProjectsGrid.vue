<template>
  <div class="projects-section">
    <div class="section-head fade-up fade-up-1">
      <div class="section-label">תקציבים חודשיים</div>
      <h3 class="section-title">פרויקטים</h3>
    </div>

    <div v-if="!projects.length" class="empty-state card">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" stroke-width="1.5" stroke-linecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
      </svg>
      <p>אין נתוני פרויקטים לחודש הנוכחי</p>
    </div>

    <div v-else class="projects-grid">
      <div
        v-for="(project, i) in projects"
        :key="project.name"
        class="project-card card fade-up"
        :class="`fade-up-${Math.min(i + 2, 7)}`"
      >
        <div class="project-header">
          <h4 class="project-name">{{ project.name }}</h4>
          <div class="project-leads" v-if="project.leads">
            <span class="leads-num">{{ fmt(project.leads) }}</span>
            <span class="leads-label">לידים</span>
          </div>
        </div>

        <div class="platforms-row">
          <span
            v-for="p in project.platforms"
            :key="p.name"
            class="platform-tag"
            :style="platformStyle(p.name)"
          >
            {{ p.name }}
          </span>
        </div>

        <div class="budget-section">
          <div class="budget-row">
            <span class="budget-label">תקציב מעודכן</span>
            <span class="budget-val">{{ fmtCurrency(project.total_budget?.updated_budget || project.total_budget?.monthly_budget) }}</span>
          </div>
          <div class="budget-row">
            <span class="budget-label">ניצול בפועל</span>
            <span class="budget-usage" :style="{ color: usageColor(project.total_budget?.usage_percent) }">
              {{ fmtCurrency(project.total_budget?.budget_usage) }}
            </span>
          </div>

          <div class="budget-bar-wrap">
            <div class="budget-bar-track">
              <div
                class="budget-bar-fill"
                :style="{
                  width: Math.min(project.total_budget?.usage_percent || 0, 100) + '%',
                  background: usageColor(project.total_budget?.usage_percent),
                }"
              ></div>
            </div>
            <span class="usage-pct" :style="{ color: usageColor(project.total_budget?.usage_percent) }">
              {{ Math.round(project.total_budget?.usage_percent || 0) }}%
            </span>
          </div>
        </div>

        <div v-if="project.platforms.length > 1" class="platform-details">
          <div
            v-for="p in project.platforms"
            :key="p.name"
            class="platform-row"
          >
            <div class="plat-dot" :style="{ background: getPlatformColor(p.name) }"></div>
            <span class="plat-name">{{ p.name }}</span>
            <span class="plat-budget">{{ fmtCurrency(p.updated_budget || p.monthly_budget) }}</span>
            <span class="plat-usage" :style="{ color: getPlatformColor(p.name) }">
              {{ fmtCurrency(p.budget_usage) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getPlatformColor, formatNumber, formatCurrency } from '../../lib/constants.js'

const props = defineProps({
  projects: { type: Array, default: () => [] },
})

function fmt(n) { return formatNumber(n) }
function fmtCurrency(n) { return formatCurrency(n) }

function usageColor(pct) {
  const p = Number(pct || 0)
  if (p >= 90) return '#EF4444'
  if (p >= 70) return '#F59E0B'
  return '#22C55E'
}

function platformStyle(name) {
  const color = getPlatformColor(name)
  return { background: color + '18', color, border: `1px solid ${color}2E` }
}
</script>

<style scoped>
.projects-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.project-card {
  padding: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-hover);
}

.project-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.project-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  flex: 1;
}

.project-leads {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.leads-num {
  font-family: 'DM Serif Display', serif;
  font-size: 22px;
  color: var(--gold);
  line-height: 1;
}

.leads-label {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

.platforms-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.platform-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.budget-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.budget-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-label {
  font-size: 11px;
  color: var(--text-muted);
}

.budget-val {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.budget-usage {
  font-size: 14px;
  font-weight: 700;
}

.budget-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.budget-bar-track {
  flex: 1;
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
}

.budget-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s ease;
}

.usage-pct {
  font-size: 12px;
  font-weight: 700;
  min-width: 36px;
  text-align: left;
}

.platform-details {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.platform-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.plat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.plat-name {
  flex: 1;
  color: var(--text-muted);
}

.plat-budget {
  color: var(--text);
}

.plat-usage {
  font-weight: 600;
  min-width: 60px;
  text-align: left;
}

.empty-state {
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
