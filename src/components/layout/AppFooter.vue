<script setup lang="ts">
import { computed } from 'vue'
import { useClimateController } from '../../composables/useClimateController'
import { useTemperatureHistory } from '../../composables/useTemperatureHistory'
import { downloadHistoryCsv } from '../../utils/exportCsv'
import { log } from '../../composables/useEventLog'

const { connectionState, lastUpdateTime } = useClimateController()
const { series } = useTemperatureHistory()

const label = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'Connected to controller'
    case 'reconnecting':
      return 'Reconnecting to controller'
    case 'connecting':
      return 'Connecting to controller'
    default:
      return 'Controller unavailable'
  }
})

const isDemoMode = import.meta.env.VITE_USE_MOCK === 'true'

function exportCsv(): void {
  if (downloadHistoryCsv(series.value)) {
    log(`Exported ${series.value.length} readings to CSV`, 'success')
  }
}
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <span>{{ label }}</span>
      <span v-if="lastUpdateTime" class="sep">·</span>
      <span v-if="lastUpdateTime">Last response {{ lastUpdateTime.toLocaleTimeString() }}</span>
      <span v-if="isDemoMode" class="sep">·</span>
      <span v-if="isDemoMode" class="demo">Demo mode — simulated data</span>

      <span class="spacer" />

      <button
        class="footer-btn"
        type="button"
        :disabled="series.length === 0"
        title="Export recorded temperature history as CSV"
        @click="exportCsv"
      >
        Export CSV
      </button>
      <span class="sep">·</span>
      <RouterLink to="/exhibition" class="footer-link">
        Exhibition mode
      </RouterLink>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--border);
  background: var(--surface);
  padding: 10px 16px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.spacer {
  flex: 1;
}

.sep {
  opacity: 0.6;
}

.demo {
  color: var(--warn);
  font-weight: 600;
}

.footer-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 3px 9px;
  cursor: pointer;
}

.footer-btn:hover:not(:disabled) {
  color: var(--text);
  border-color: var(--text-muted);
}

.footer-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.footer-link {
  color: var(--text-muted);
}
</style>
