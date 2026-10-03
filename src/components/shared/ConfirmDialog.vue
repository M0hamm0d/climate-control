<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('cancel')">
    <div class="dialog card" role="dialog" aria-modal="true" :aria-label="title">
      <h2 class="dialog-title">{{ title }}</h2>
      <p class="dialog-message">{{ message }}</p>
      <p v-if="error" class="dialog-error">{{ error }}</p>
      <div class="dialog-actions">
        <button class="btn" type="button" :disabled="busy" @click="emit('cancel')">
          Cancel
        </button>
        <button
          class="btn danger"
          type="button"
          :disabled="busy"
          @click="emit('confirm')"
        >
          {{ busy ? 'Working…' : confirmLabel ?? 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.dialog {
  width: 100%;
  max-width: 380px;
  padding: 20px;
}

.dialog-title {
  font-size: 1.05rem;
  margin-bottom: 6px;
}

.dialog-message {
  color: var(--text-muted);
  font-size: 0.92rem;
  margin: 0 0 16px;
}

.dialog-error {
  color: var(--error);
  font-size: 0.85rem;
  margin: -8px 0 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
