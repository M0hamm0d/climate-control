// Browser-side event log. Local only — the ESP8266 does not store these.

import { readonly, ref } from 'vue'
import { EVENT_LOG_LIMIT } from '../config'

export interface LogEntry {
  id: number
  time: number
  message: string
  kind: 'info' | 'success' | 'warning' | 'error'
}

const entries = ref<LogEntry[]>([])
let nextId = 1

export function log(message: string, kind: LogEntry['kind'] = 'info'): void {
  entries.value.unshift({
    id: nextId++,
    time: Date.now(),
    message,
    kind,
  })
  if (entries.value.length > EVENT_LOG_LIMIT) {
    entries.value.length = EVENT_LOG_LIMIT
  }
}

export function useEventLog() {
  return {
    entries: readonly(entries),
    log,
    clear(): void {
      entries.value = []
    },
  }
}
