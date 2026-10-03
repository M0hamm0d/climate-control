<script setup lang="ts">
import { computed, onMounted, onScopeDispose } from 'vue'
import { useRouter } from 'vue-router'
import { useClimateController } from '../composables/useClimateController'
import TemperatureChart from '../components/dashboard/TemperatureChart.vue'
import { formatDifference, formatTemperature } from '../utils/formatting'

const router = useRouter()

const {
  connectionState,
  currentTemperature,
  targetTemperature,
  difference,
  mode,
  peltier,
  fan1,
  fan2,
  atTarget,
} = useClimateController()

const actionLabel = computed(() => {
  switch (peltier.value) {
    case 'COOLING':
      return 'COOLING'
    case 'HEATING':
      return 'HEATING'
    case 'OFF':
      return mode.value === 'OFF' ? 'SYSTEM OFF' : 'HOLDING'
    default:
      return 'UNKNOWN'
  }
})

const actionClass = computed(() => {
  switch (peltier.value) {
    case 'COOLING':
      return 'cool'
    case 'HEATING':
      return 'warm'
    case 'OFF':
      return 'off'
    default:
      return 'unknown'
  }
})

const fanSummary = computed(() => `FAN 1 ${fan1.value} · FAN 2 ${fan2.value}`)

const statusLine = computed(() => {
  if (connectionState.value !== 'connected') return 'CONTROLLER OFFLINE'
  if (atTarget.value) return 'AT TARGET'
  return formatDifference(difference.value).toUpperCase()
})

function exit(): void {
  router.push('/dashboard')
}

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') exit()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})

onScopeDispose(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="exhibition" :data-action="actionClass" @click="exit">
    <header class="ex-header">
      <span class="ex-title">CLIMATE CONTROLLER</span>
      <span class="ex-conn" :data-state="connectionState">
        ● {{ connectionState.toUpperCase() }}
      </span>
    </header>

    <main class="ex-main">
      <div class="ex-reading">
        <span class="ex-temp">{{ formatTemperature(currentTemperature) }}</span>
        <span class="ex-unit">°C</span>
      </div>

      <div class="ex-status-line" :data-action="actionClass">
        {{ statusLine }}
      </div>

      <div class="ex-rows">
        <div class="ex-row">
          <span class="ex-label">TARGET</span>
          <span class="ex-value">
            {{ formatTemperature(targetTemperature) }} °C
          </span>
        </div>
        <div class="ex-row">
          <span class="ex-label">MODE</span>
          <span class="ex-value">{{ mode }}</span>
        </div>
        <div class="ex-row">
          <span class="ex-label">ACTION</span>
          <span class="ex-value" :data-tone="actionClass">{{ actionLabel }}</span>
        </div>
        <div class="ex-row">
          <span class="ex-label">FANS</span>
          <span class="ex-value">{{ fanSummary }}</span>
        </div>
      </div>

      <TemperatureChart class="ex-chart" />
    </main>

    <footer class="ex-footer">
      <span>Press ESC or click anywhere to return to the dashboard</span>
    </footer>
  </div>
</template>

<style scoped>
.exhibition {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--background);
  color: var(--text);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  user-select: none;
}

.ex-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 28px;
  border-bottom: 1px solid var(--border);
}

.ex-title {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.ex-conn {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--off);
}

.ex-conn[data-state='connected'] { color: var(--ok); }
.ex-conn[data-state='reconnecting'] { color: var(--warn); }
.ex-conn[data-state='disconnected'] { color: var(--error); }

.ex-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 24px;
  overflow: hidden;
}

.ex-reading {
  display: flex;
  align-items: baseline;
  gap: 14px;
  line-height: 1;
}

.ex-temp {
  font-size: clamp(5rem, 18vh, 11rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  transition: color 0.6s ease;
}

.exhibition[data-action='cool'] .ex-temp { color: var(--cool); }
.exhibition[data-action='warm'] .ex-temp { color: var(--warm); }

.ex-unit {
  font-size: clamp(1.6rem, 5vh, 3rem);
  color: var(--text-muted);
}

.ex-status-line {
  font-size: clamp(1rem, 3vh, 1.6rem);
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--off);
}

.ex-status-line[data-action='cool'] { color: var(--cool); }
.ex-status-line[data-action='warm'] { color: var(--warm); }
.ex-status-line[data-action='off'] { color: var(--off); }

.ex-rows {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 12px 42px;
}

.ex-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.ex-label {
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  color: var(--text-muted);
}

.ex-value {
  font-size: clamp(1rem, 2.6vh, 1.5rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.ex-value[data-tone='cool'] { color: var(--cool); }
.ex-value[data-tone='warm'] { color: var(--warm); }

.ex-chart {
  width: min(860px, 90vw);
}

.ex-footer {
  padding: 12px 28px;
  border-top: 1px solid var(--border);
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);
}

@media (max-width: 720px) {
  .ex-rows {
    grid-template-columns: repeat(2, auto);
  }
}
</style>
