<script setup lang="ts">
import CurrentTemperature from "../components/dashboard/CurrentTemperature.vue";
import TargetControl from "../components/dashboard/TargetControl.vue";
import ModeSelector from "../components/dashboard/ModeSelector.vue";
import SystemStatusGrid from "../components/dashboard/SystemStatusGrid.vue";
import TemperatureChart from "../components/dashboard/TemperatureChart.vue";
import SensorErrorNotice from "../components/shared/SensorErrorNotice.vue";
import { useClimateController } from "../composables/useClimateController";
import { formatDifference } from "../utils/formatting";

const { difference, controllerAction, atTarget } = useClimateController();
</script>

<template>
  <div class="dashboard">
    <SensorErrorNotice />

    <div class="grid">
      <div class="col-main">
        <CurrentTemperature />
        <TemperatureChart />
      </div>

      <div class="col-side">
        <TargetControl />
        <ModeSelector />
        <SystemStatusGrid />
      </div>
    </div>

    <p class="explain" aria-live="polite">
      <template v-if="atTarget"> At target — holding temperature. </template>
      <template v-else-if="difference !== undefined">
        {{ formatDifference(difference) }} — {{ controllerAction }}.
      </template>
    </p>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.col-main,
.col-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.explain {
  margin: 0;
  padding: 10px 14px;
  background: var(--surface-alt);
  border-radius: var(--radius);
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: center;
}

@media (min-width: 900px) {
  .grid {
    grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr);
  }
}
</style>
