<script setup lang="ts">
import { ref } from 'vue'
import { useClimateController } from '../../composables/useClimateController'

const props = defineProps<{
  fan: 'fan1' | 'fan2'
  title: string
  subtitle: string
}>()

const { fan1, fan2, isConnected, setFan1, setFan2 } = useClimateController()

const pending = ref(false)
const errorText = ref<string | null>(null)

const currentState = (): 'ON' | 'OFF' | 'UNKNOWN' =>
  props.fan === 'fan1' ? fan1.value : fan2.value

const isOn = (): boolean => currentState() === 'ON'

async function toggle(): Promise<void> {
  if (!isConnected.value || pending.value) return
  pending.value = true
  errorText.value = null
  const next = !isOn()
  try {
    if (props.fan === 'fan1') await setFan1(next)
    else await setFan2(next)
  } catch (error) {
    errorText.value =
      error instanceof Error && error.message
        ? error.message
        : 'The controller rejected the command.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="card fan-card">
    <div class="fan-head">
      <div>
        <h3 class="fan-title">{{ title }}</h3>
        <p class="fan-subtitle">{{ subtitle }}</p>
      </div>
      <span class="fan-state">
        <span class="dot" :class="isOn() ? 'ok' : 'off'" />
        {{ currentState() }}
      </span>
    </div>

    <button
      class="btn"
      :class="isOn() ? '' : 'primary'"
      type="button"
      :disabled="!isConnected || pending"
      @click="toggle"
    >
      {{ pending ? 'Sending…' : isOn() ? 'Turn Off' : 'Turn On' }}
    </button>

    <p v-if="errorText" class="fan-error" role="alert">{{ errorText }}</p>

    <slot />
  </section>
</template>

<style scoped>
.fan-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fan-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.fan-title {
  font-size: 1rem;
}

.fan-subtitle {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.fan-state {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.88rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.fan-error {
  margin: 0;
  font-size: 0.85rem;
  color: var(--error);
}
</style>
