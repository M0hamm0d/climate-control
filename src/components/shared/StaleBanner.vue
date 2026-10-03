<script setup lang="ts">
defineProps<{
  ageSeconds: number
}>()
</script>

<template>
  <div class="stale banner-warn" role="alert">
    <span class="mark">⚠</span>
    <span>
      Data may be outdated — last updated
      {{ ageSeconds <= 1 ? 'just now' : `${ageSeconds} seconds ago` }}.
    </span>
  </div>
</template>

<style scoped>
.stale {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--warn);
  background: color-mix(in srgb, var(--warn) 12%, var(--surface));
  font-size: 0.92rem;
}

.mark {
  color: var(--warn);
}
</style>
