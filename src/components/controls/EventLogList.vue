<script setup lang="ts">
import { useEventLog } from '../../composables/useEventLog'
import { formatTime } from '../../utils/formatting'

const { entries, clear } = useEventLog()
</script>

<template>
  <section class="card">
    <div class="log-head">
      <h2 class="card-title">Event Log</h2>
      <button class="btn small" type="button" :disabled="entries.length === 0" @click="clear">
        Clear
      </button>
    </div>

    <p class="note">Stored in this browser only — the controller keeps no history.</p>

    <ul v-if="entries.length" class="log">
      <li v-for="entry in entries" :key="entry.id" class="entry" :data-kind="entry.kind">
        <span class="time">{{ formatTime(entry.time) }}</span>
        <span class="message">{{ entry.message }}</span>
      </li>
    </ul>
    <p v-else class="empty">No events yet.</p>
  </section>
</template>

<style scoped>
.log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.log-head .card-title {
  margin: 0;
}

.note {
  margin: 0 0 10px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.log {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.entry {
  display: flex;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
}

.entry:last-child {
  border-bottom: none;
}

.time {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.entry[data-kind='success'] .message { color: var(--ok); }
.entry[data-kind='warning'] .message { color: var(--warn); }
.entry[data-kind='error'] .message { color: var(--error); }

.empty {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0;
}
</style>
