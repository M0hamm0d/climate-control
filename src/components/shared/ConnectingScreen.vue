<script setup lang="ts">
import { useClimateController } from '../../composables/useClimateController'

const { connectionState, lastErrorMessage } = useClimateController()
</script>

<template>
  <div class="connecting card">
    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true" class="icon">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>

    <h1 class="title">
      {{
        connectionState === 'disconnected'
          ? 'Controller unavailable'
          : connectionState === 'reconnecting'
            ? 'Connection interrupted. Trying again...'
            : 'Connecting to Climate Controller...'
      }}
    </h1>

    <p v-if="lastErrorMessage" class="error">{{ lastErrorMessage }}</p>

    <p class="hint">
      Check that this device is connected to the Climate Controller Wi-Fi network.
    </p>
  </div>
</template>

<style scoped>
.connecting {
  max-width: 460px;
  margin: 12vh auto 0;
  text-align: center;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.icon {
  color: var(--accent);
  animation: spin 1.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.title {
  font-size: 1.05rem;
  font-weight: 600;
}

.hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.error {
  color: var(--error);
  font-size: 0.88rem;
  margin: 0;
}
</style>
