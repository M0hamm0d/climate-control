<script setup lang="ts">
import { ref } from 'vue'
import { useClimateController } from '../../composables/useClimateController'
import { log } from '../../composables/useEventLog'

const { refresh, lastErrorMessage } = useClimateController()
const retrying = ref(false)

async function retry(): Promise<void> {
  retrying.value = true
  try {
    await refresh()
  } catch {
    log('Retry failed', 'error')
  } finally {
    retrying.value = false
  }
}
</script>

<template>
  <div class="disconnected card" role="alert">
    <div>
      <h2 class="title">Controller unavailable</h2>
      <p class="hint">
        Check that your device is connected to the Climate Controller Wi-Fi network.
      </p>
      <p v-if="lastErrorMessage" class="error">{{ lastErrorMessage }}</p>
    </div>
    <button class="btn primary" type="button" :disabled="retrying" @click="retry">
      {{ retrying ? 'Retrying…' : 'Retry' }}
    </button>
  </div>
</template>

<style scoped>
.disconnected {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-color: var(--error);
}

.title {
  font-size: 1rem;
  margin-bottom: 4px;
}

.hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.error {
  margin: 6px 0 0;
  color: var(--error);
  font-size: 0.85rem;
}
</style>
