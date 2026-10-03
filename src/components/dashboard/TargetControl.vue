<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useClimateController } from '../../composables/useClimateController'
import { TARGET_TEMP_MAX, TARGET_TEMP_MIN, TARGET_TEMP_STEP } from '../../config'
import { formatTemperature } from '../../utils/formatting'

const {
  targetTemperature,
  isConnected,
  setTarget,
} = useClimateController()

const pending = ref(false)
const feedback = ref<null | { kind: 'success' | 'error'; text: string }>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

// Draft value for the slider; the confirmed value only changes when the
// controller accepts the command.
const draft = ref<number>(targetTemperature.value ?? 25)

watch(targetTemperature, (value) => {
  if (value !== undefined && !pending.value) draft.value = value
})

const canSubmit = computed(() => isConnected.value && !pending.value)

const presets: Array<{ value: number; label: string }> = [
  { value: 22, label: 'Sleep' },
  { value: 25, label: 'Comfortable' },
  { value: 28, label: 'Warm' },
]

const activePreset = computed<number | null>(() => {
  const t = targetTemperature.value
  return t !== undefined && presets.some((p) => p.value === t) ? t : null
})

async function applyPreset(value: number): Promise<void> {
  if (!canSubmit.value || pending.value) return
  draft.value = value
  await submit()
}

function clamp(value: number): number {
  return Math.min(TARGET_TEMP_MAX, Math.max(TARGET_TEMP_MIN, value))
}

function step(delta: number): void {
  draft.value = clamp(Math.round((draft.value + delta) / TARGET_TEMP_STEP) * TARGET_TEMP_STEP)
}

async function submit(): Promise<void> {
  if (!canSubmit.value) return
  pending.value = true
  feedback.value = null
  try {
    await setTarget(draft.value)
    feedback.value = {
      kind: 'success',
      text: `✓ Target set to ${formatTemperature(draft.value)} °C`,
    }
  } catch {
    feedback.value = {
      kind: 'error',
      text: 'Could not change target temperature. The controller rejected the request.',
    }
  } finally {
    pending.value = false
    if (feedbackTimer) clearTimeout(feedbackTimer)
    feedbackTimer = setTimeout(() => {
      feedback.value = null
    }, 4000)
  }
}
</script>

<template>
  <section class="card" aria-label="Target temperature">
    <h2 class="card-title">Target</h2>

    <div class="target-display">
      <span class="value">{{ formatTemperature(targetTemperature) }}</span>
      <span class="unit">°C</span>
    </div>

    <div class="stepper">
      <button
        class="btn icon"
        type="button"
        :disabled="!canSubmit || draft <= TARGET_TEMP_MIN"
        aria-label="Decrease target temperature"
        @click="step(-TARGET_TEMP_STEP)"
      >
        −
      </button>

      <input
        v-model.number="draft"
        class="slider"
        type="range"
        :min="TARGET_TEMP_MIN"
        :max="TARGET_TEMP_MAX"
        :step="TARGET_TEMP_STEP"
        :disabled="!canSubmit"
        aria-label="Target temperature slider"
      />

      <button
        class="btn icon"
        type="button"
        :disabled="!canSubmit || draft >= TARGET_TEMP_MAX"
        aria-label="Increase target temperature"
        @click="step(TARGET_TEMP_STEP)"
      >
        +
      </button>
    </div>

    <div class="presets" role="group" aria-label="Temperature presets">
      <button
        v-for="p in presets"
        :key="p.value"
        class="preset"
        :class="{ active: activePreset === p.value }"
        type="button"
        :disabled="!canSubmit || pending"
        @click="applyPreset(p.value)"
      >
        <span class="preset-temp">{{ p.value }} °C</span>
        <span class="preset-label">{{ p.label }}</span>
      </button>
    </div>

    <div class="draft-row">
      <span class="draft-label">Selected: {{ formatTemperature(draft) }} °C</span>
      <button class="btn primary small" type="button" :disabled="!canSubmit || pending" @click="submit">
        {{ pending ? 'Setting…' : 'Set' }}
      </button>
    </div>

    <p v-if="feedback" class="feedback" :class="feedback.kind" role="status">
      {{ feedback.text }}
    </p>
  </section>
</template>

<style scoped>
.target-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 5px;
  margin: 2px 0 12px;
}

.target-display .value {
  font-size: 2.4rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.target-display .unit {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider {
  flex: 1;
  accent-color: var(--accent);
  min-height: 44px;
}

.presets {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.preset {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 8px 4px;
  min-height: 48px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}

.preset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset.active {
  border-color: var(--accent);
  color: var(--accent);
}

.preset-temp {
  font-size: 0.92rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.preset-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.preset.active .preset-label {
  color: var(--accent);
}

.draft-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  gap: 10px;
}

.draft-label {
  font-size: 0.88rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.feedback {
  margin: 10px 0 0;
  font-size: 0.88rem;
}

.feedback.success {
  color: var(--ok);
}

.feedback.error {
  color: var(--error);
}
</style>
