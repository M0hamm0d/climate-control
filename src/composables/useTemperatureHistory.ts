// Browser-collected temperature history for the live chart.
// This is NOT device history — the ESP8266 does not store past readings.

import { computed, ref } from 'vue'
import { HISTORY_WINDOW_S } from '../config'
import type { StatusSnapshot } from '../types/climate'

export interface HistoryPoint {
  time: number
  temperature: number | null
  target: number | null
}

const history = ref<HistoryPoint[]>([])
let lastRecordedAt = 0

export function useTemperatureHistory() {
  /** Record a snapshot (called once per successful poll). */
  function record(snapshot: StatusSnapshot): void {
    const t = snapshot.status.temperature
    if (t === undefined) return
    // At most one point per second; polls are ≥2s apart anyway.
    if (snapshot.receivedAt - lastRecordedAt < 1000) return
    lastRecordedAt = snapshot.receivedAt
    history.value.push({
      time: snapshot.receivedAt,
      temperature: t,
      target: snapshot.status.targetTemperature ?? null,
    })
    const cutoff = snapshot.receivedAt - HISTORY_WINDOW_S * 1000
    while (history.value.length > 0 && history.value[0]!.time < cutoff) {
      history.value.shift()
    }
    // Hard cap to protect memory on long sessions.
    if (history.value.length > 200) history.value.splice(0, history.value.length - 200)
  }

  const series = computed<readonly HistoryPoint[]>(() => history.value)

  return { series, record }
}
