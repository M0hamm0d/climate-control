<script setup lang="ts">
import FanControlCard from '../components/controls/FanControlCard.vue'
import DeviceDiagnostics from '../components/controls/DeviceDiagnostics.vue'
import EventLogList from '../components/controls/EventLogList.vue'
import { useClimateController } from '../composables/useClimateController'
import { log } from '../composables/useEventLog'
import { mockControls } from '../api'

const { peltier } = useClimateController()

const isDemoMode = import.meta.env.VITE_USE_MOCK === 'true'

function simulateConnectionLoss(): void {
  const down = !mockControls.isConnectionDown()
  mockControls.setConnectionDown(down)
  log(down ? 'Simulating connection loss' : 'Simulation: connection restored', 'warning')
}
</script>

<template>
  <div class="controls">
    <section class="section">
      <h2 class="section-title">Manual Controls</h2>
      <div class="fan-grid">
        <FanControlCard fan="fan1" title="Fan 1" subtitle="Main Fan" />
        <FanControlCard fan="fan2" title="Fan 2" subtitle="Heatsink Fan">
          <p v-if="peltier !== 'OFF'" class="restriction">
            Fan 2 is required while the Peltier is running.
          </p>
        </FanControlCard>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Diagnostics</h2>
      <div class="diag-grid">
        <DeviceDiagnostics />
        <EventLogList />
      </div>
    </section>

    <section v-if="isDemoMode" class="section">
      <h2 class="section-title">Demo Controls</h2>
      <div class="card">
        <p class="demo-note">
          These controls only exist in demo mode and simulate hardware conditions to
          exercise the interface.
        </p>
        <button class="btn" type="button" @click="simulateConnectionLoss">
          {{ mockControls.isConnectionDown() ? 'Restore connection' : 'Simulate connection loss' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.fan-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.diag-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.restriction {
  margin: 0;
  font-size: 0.82rem;
  color: var(--warn);
}

.demo-note {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

@media (min-width: 720px) {
  .fan-grid {
    grid-template-columns: 1fr 1fr;
  }

  .diag-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
