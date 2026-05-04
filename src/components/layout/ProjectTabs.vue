<template>
  <div class="project-tabs">
    <div class="tabs-inner">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeProject === tab.key }"
        @click="$emit('select', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tabs: { type: Array, default: () => [] },
  activeProject: { type: String, default: '' },
})
defineEmits(['select'])
</script>

<style scoped>
.project-tabs {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 57px;
  z-index: 90;
}

.tabs-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-inner::-webkit-scrollbar { display: none; }

.tab-btn {
  padding: 12px 20px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--text-muted);
  font-family: 'Heebo', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.18s, border-color 0.18s;
  margin-bottom: -1px;
}

.tab-btn:hover { color: var(--text); }

.tab-btn.active {
  color: var(--gold);
  border-bottom-color: var(--gold);
  font-weight: 700;
}

@media (max-width: 768px) {
  .tabs-inner { padding: 0 16px; }
  .tab-btn { padding: 10px 14px; font-size: 12px; }
}
</style>
