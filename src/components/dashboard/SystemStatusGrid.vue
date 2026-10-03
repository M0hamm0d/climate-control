<script setup lang="ts">
import { computed } from 'vue'
import { useClimateController } from '../../composables/useClimateController'

const { peltier, fan1, fan2 } = useClimateController()

const peltierLabel = computed(() => {
  switch (peltier.value) {
    case 'COOLING':
      return '❄ Cooling'
    case 'HEATING':
      return '🔥 Heating'
    case 'OFF':
      return 'Off'
    default:
      return 'Unknown'
  }
})

const peltierClass = computed(() => {
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

function fanLabel(state: string): string {
  if (state === 'ON') return 'ON'
  if (state === 'OFF') return 'OFF'
  return 'Unknown'
}

function fanClass(state: string): string {
  if (state === 'ON') return 'ok'
  if (state === 'OFF') return 'off'
  return 'unknown'
}
</script>

<template>
  <section class="card" aria-label="System status">
    <h2 class="card-title">System Status</h2>

    <div class="grid">
      <div class="cell" :data-state="peltierClass">
        <span class="cell-label">Peltier</span>
        <span class="cell-value">
          <span class="dot" :class="peltierClass" />
          {{ peltierLabel }}
        </span>
      </div>

      <div class="cell" :data-state="fanClass(fan1)">
        <span class="cell-label">Fan 1</span>
        <span class="cell-value">
          <span class="dot" :class="fanClass(fan1)" />
          {{ fanLabel(fan1) }}
        </span>
      </div>

      <div class="cell" :data-state="fanClass(fan2)">
        <span class="cell-label">Fan 2</span>
        <span class="cell-value">
          <span class="dot" :class="fanClass(fan2)" />
          {{ fanLabel(fan2) }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.cell {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.cell-value {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.95rem;
  font-weight: 600;
}

@media (max-width: 420px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
