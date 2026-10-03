<script setup lang="ts">
import { useClimateController } from '../../composables/useClimateController'

const { status } = useClimateController()
</script>

<template>
  <div v-if="status?.sensorError" class="sensor-error" role="alert">
    <span class="mark">⚠</span>
    Temperature sensor unavailable — the controller cannot read the current temperature.
  </div>
</template>

<style scoped>
.sensor-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--error);
  background: color-mix(in srgb, var(--error) 10%, var(--surface));
  font-size: 0.92rem;
}

.mark {
  color: var(--error);
}
</style>
