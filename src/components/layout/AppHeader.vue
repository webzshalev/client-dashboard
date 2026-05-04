<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="brand-block">
        <div class="brand-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="var(--gold)" opacity="0.15"/>
            <path d="M8 14L12 10L16 16L20 12" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="20" cy="12" r="2" fill="var(--gold)"/>
          </svg>
        </div>
        <div class="client-info">
          <span class="client-label">דאשבורד לקוח</span>
          <h1 class="client-name">{{ clientName }}</h1>
        </div>
      </div>

      <div class="controls-block">
        <div class="date-presets">
          <button
            v-for="preset in presets"
            :key="preset.label"
            class="preset-btn"
            :class="{ active: activePreset === preset.label }"
            @click="applyPreset(preset)"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="date-inputs">
          <input type="date" class="date-input" v-model="from" :max="to" />
          <span class="date-sep">—</span>
          <input type="date" class="date-input" v-model="to" :min="from" :max="today" />
        </div>

        <button
          class="theme-toggle"
          @click="toggle"
          :title="isDark ? 'מצב בהיר' : 'מצב כהה'"
          aria-label="toggle theme"
        >
          <transition name="theme-icon">
            <span :key="isDark ? 'sun' : 'moon'" class="theme-icon-inner">{{ isDark ? '☀️' : '🌙' }}</span>
          </transition>
        </button>
      </div>
    </div>

    <div class="header-bar"></div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '../../composables/useTheme.js'

const { isDark, toggle } = useTheme()

const props = defineProps({
  clientName: { type: String, default: '' },
  presets: { type: Array, default: () => [] },
  activePreset: { type: String, default: null },
  from: { type: String, required: true },
  to: { type: String, required: true },
})

const emit = defineEmits(['update:from', 'update:to', 'applyPreset'])

const from = computed({
  get: () => props.from,
  set: (v) => emit('update:from', v),
})

const to = computed({
  get: () => props.to,
  set: (v) => emit('update:to', v),
})

const today = new Date().toISOString().substring(0, 10)

function applyPreset(preset) {
  emit('applyPreset', preset)
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--header-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.header-bar {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  opacity: 0.4;
}

.header-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  flex-shrink: 0;
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.client-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
  line-height: 1;
}

.client-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.controls-block {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-presets {
  display: flex;
  gap: 4px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 3px;
}

.preset-btn {
  padding: 5px 12px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: 'Heebo', sans-serif;
  font-size: 13px;
  font-weight: 500;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.preset-btn:hover {
  color: var(--text);
  background: var(--surface-2);
}

.preset-btn.active {
  background: var(--gold);
  color: #0F1117;
  font-weight: 700;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-sep {
  color: var(--text-dim);
  font-size: 12px;
}

.date-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: 'Heebo', sans-serif;
  font-size: 13px;
  padding: 6px 10px;
  cursor: pointer;
  transition: border-color 0.18s;
  direction: ltr;
}

.date-input:hover,
.date-input:focus {
  border-color: var(--gold);
  outline: none;
}

/* Calendar picker icon adapts to theme */
.date-input::-webkit-calendar-picker-indicator {
  filter: var(--picker-filter);
  cursor: pointer;
}

/* Theme toggle button */
.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.theme-toggle:hover {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-dim);
}

.theme-icon-inner {
  font-size: 15px;
  line-height: 1;
  display: block;
}

.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: transform 0.2s ease, opacity 0.15s ease;
  position: absolute;
}

.theme-icon-enter-from {
  transform: rotate(-90deg) scale(0.5);
  opacity: 0;
}

.theme-icon-leave-to {
  transform: rotate(90deg) scale(0.5);
  opacity: 0;
}

@media (max-width: 768px) {
  .header-inner {
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;
  }

  .controls-block {
    flex-direction: column;
    align-items: stretch;
  }

  .date-presets {
    justify-content: space-between;
  }

  .preset-btn {
    flex: 1;
    text-align: center;
    font-size: 11px;
    padding: 5px 6px;
  }
}
</style>
