<script setup lang="ts">
import { computed, ref } from 'vue'
import { useClimateController } from '../../composables/useClimateController'
import { extractDiagnostics } from '../../api/climateApi'
import { formatDbm, formatTime, formatUptime } from '../../utils/formatting'

const { status, lastResponseTime, isConnected } = useClimateController()

const diagnostics = computed(() => extractDiagnostics(status.value ?? { mode: 'OFF', peltier: 'UNKNOWN', fan1: 'UNKNOWN', fan2: 'UNKNOWN' }))

const showTechnical = ref(false)

const rows = computed(() => {
  const d = diagnostics.value
  const result: Array<{ label: string; value: string }> = []
  if (isConnected.value) result.push({ label: 'Connection', value: 'Connected' })
  else result.push({ label: 'Connection', value: 'Not connected' })
  if (d.firmwareVersion) result.push({ label: 'Firmware', value: d.firmwareVersion })
  if (d.ipAddress) result.push({ label: 'IP Address', value: d.ipAddress })
  if (d.uptimeMs !== undefined) result.push({ label: 'Uptime', value: formatUptime(d.uptimeMs) })
  if (d.wifiSignalDbm !== undefined) {
    result.push({ label: 'Wi-Fi Signal', value: formatDbm(d.wifiSignalDbm) })
  }
  if (d.clients !== undefined) result.push({ label: 'Clients', value: String(d.clients) })
  return result
})

const technicalPayload = computed(() => JSON.stringify(status.value?.raw ?? {}, null, 2))
</script>

<template>
  <section class="card">
    <h2 class="card-title">Device</h2>

    <dl class="rows">
      <div v-for="row in rows" :key="row.label" class="row">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
      <div class="row">
        <dt>Last response</dt>
        <dd>{{ lastResponseTime ? formatTime(lastResponseTime.getTime()) : '—' }}</dd>
      </div>
      <div class="row">
        <dt>API status</dt>
        <dd :class="isConnected ? 'ok-text' : 'error-text'">
          {{ isConnected ? 'Available' : 'Unavailable' }}
        </dd>
      </div>
    </dl>

    <button
      class="tech-toggle"
      type="button"
      @click="showTechnical = !showTechnical"
    >
      {{ showTechnical ? 'Hide' : 'Show' }} technical details
    </button>

    <pre v-if="showTechnical" class="technical">{{ technicalPayload }}</pre>
  </section>
</template>

<style scoped>
.rows {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
}

.row:last-child {
  border-bottom: none;
}

dt {
  color: var(--text-muted);
  font-size: 0.88rem;
}

dd {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 500;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ok-text { color: var(--ok); }
.error-text { color: var(--error); }

.tech-toggle {
  margin-top: 10px;
  background: none;
  border: none;
  padding: 0;
  color: var(--accent);
  font-size: 0.82rem;
  cursor: pointer;
}

.technical {
  margin: 10px 0 0;
  padding: 10px;
  background: var(--surface-alt);
  border-radius: 8px;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 240px;
}
</style>
