<script setup lang="ts">
import { computed } from 'vue'
import { useClimateController } from '../../composables/useClimateController'

const { mode, peltier, isConnected, isStale } = useClimateController()

// The firmware has no mode field or mode command: it always auto-regulates
// around the target. The displayed mode is derived from the Peltier state
// (same rule as src/api/climateApi.ts) and is therefore read-only.
const description = computed<string>(() => {
  switch (peltier.value) {
    case 'COOLING':
      return 'Actively cooling toward your target temperature.'
    case 'HEATING':
      return 'Actively heating toward your target temperature.'
    case 'OFF':
      return 'Idle — the controller holds the current state.'
    default:
      return 'Waiting for controller data…'
  }
})

const stale = computed(() => isConnected.value && isStale.value)
</script>

<template>
  <section class="card" aria-label="Operating mode">
    <h2 class="card-title">Operating Mode</h2>

    <div class="segmented" role="group" aria-label="Operating mode (automatic)">
      <span class="segment" :class="{ active: mode === 'COOL' }">COOL</span>
      <span class="segment" :class="{ active: mode === 'HEAT' }">HEAT</span>
      <span class="segment" :class="{ active: mode === 'OFF' }">OFF</span>
    </div>

    <p class="hint">
      {{ description }}
    </p>
    <p v-if="stale" class="hint warn">Controller data is stale — mode may be outdated.</p>
  </section>
</template>

<style scoped>
.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.segment {
  padding: 12px 4px;
  min-height: 46px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  text-align: center;
}

.segment:last-child {
  border-right: none;
}

.segment.active {
  background: var(--accent);
  color: #fff;
}

.hint {
  margin: 10px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.hint.warn {
  color: var(--warning, #b45309);
}
</style>
