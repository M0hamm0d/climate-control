<script setup lang="ts">
import { computed } from 'vue'
import { useClimateController } from '../../composables/useClimateController'
import {
  formatDifference,
  formatTemperature,
  timeAgo,
} from '../../utils/formatting'

const {
  currentTemperature,
  targetTemperature,
  difference,
  controllerAction,
  peltier,
  receivedAt,
  now,
  isConnected,
} = useClimateController()

const toneClass = computed(() => {
  const diff = difference.value ?? 0
  if (!isConnected.value) return 'neutral'
  if (Math.abs(diff) < 0.3) return 'neutral'
  return diff > 0 ? 'warm' : 'cool'
})

const updatedLabel = computed(() =>
  receivedAt.value ? timeAgo(receivedAt.value, now.value) : '',
)

const differenceLabel = computed(() => {
  if (difference.value === undefined) return ''
  return formatDifference(difference.value)
})

const actionLabel = computed(() => {
  if (peltier.value === 'COOLING') return 'Cooling'
  if (peltier.value === 'HEATING') return 'Heating'
  return controllerAction.value
})
</script>

<template>
  <section class="card temp-card" aria-label="Current temperature">
    <h2 class="card-title">Current Temperature</h2>

    <div class="reading" :class="toneClass">
      <span class="value">{{ formatTemperature(currentTemperature) }}</span>
      <span class="unit">°C</span>
    </div>

    <div class="context">
      <span class="difference">{{ differenceLabel }}</span>
      <span
        v-if="actionLabel"
        class="action"
        :data-tone="toneClass"
      >
        {{ actionLabel }}
      </span>
    </div>

    <p class="freshness">Updated {{ updatedLabel }}</p>
  </section>
</template>

<style scoped>
.temp-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px 18px;
}

.reading {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1;
  transition: color 0.6s ease;
}

.reading .value {
  font-size: clamp(3.8rem, 14vw, 5.2rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.reading .unit {
  font-size: 1.6rem;
  color: var(--text-muted);
  font-weight: 500;
}

.reading.cool .value { color: var(--cool); }
.reading.warm .value { color: var(--warm); }

.context {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.difference {
  color: var(--text-muted);
  font-size: 1rem;
}

.action {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.action::before {
  content: '● ';
}

.action[data-tone='cool'] { color: var(--cool); }
.action[data-tone='warm'] { color: var(--warm); }
.action[data-tone='neutral'] { color: var(--off); }

.freshness {
  margin: 14px 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
