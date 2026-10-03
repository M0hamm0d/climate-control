// Connection + polling composable.
//
// Owns the single poll loop for the whole app (started once in App.vue).
// Guarantees no overlapping requests, cleans up timers, tracks freshness
// and connection state transitions.

import { computed, onScopeDispose, readonly, ref } from 'vue'
import { api, ControllerRequestError } from '../api'
import { POLL_INTERVAL_MS, STALE_AFTER_MS } from '../config'
import type {
  ConnectionState,
  ControllerStatus,
  StatusSnapshot,
} from '../types/climate'

const state = ref<ConnectionState>('connecting')
const lastSnapshot = ref<StatusSnapshot | null>(null)
const lastErrorMessage = ref<string | null>(null)

// Driven by a 1s UI ticker so "Updated 2 seconds ago" and staleness stay honest.
const now = ref(Date.now())

let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null
let pollInFlight = false
let consecutiveFailures = 0

/** Back off after failures; never hammer a struggling ESP8266. */
function currentInterval(): number {
  const extra = Math.min(consecutiveFailures, 4) * POLL_INTERVAL_MS
  return POLL_INTERVAL_MS + extra
}

function setState(next: ConnectionState): void {
  if (state.value !== next) state.value = next
}

let pollTimeout: ReturnType<typeof setTimeout> | null = null

function scheduleNext(): void {
  pollTimeout = setTimeout(() => {
    void poll().finally(() => {
      if (pollTimer !== null) scheduleNext()
    })
  }, currentInterval())
}

async function poll(): Promise<void> {
  if (pollInFlight) return // never overlap requests
  pollInFlight = true
  try {
    const status: ControllerStatus = await api.getStatus()
    lastSnapshot.value = { status, receivedAt: Date.now() }
    lastErrorMessage.value = null
    consecutiveFailures = 0
    setState('connected')
  } catch (error) {
    consecutiveFailures += 1
    lastErrorMessage.value =
      error instanceof ControllerRequestError
        ? error.message
        : 'Unknown controller error'
    setState(consecutiveFailures === 1 ? 'reconnecting' : 'disconnected')
  } finally {
    pollInFlight = false
  }
}

function startPolling(): void {
  if (pollTimer !== null) return
  pollTimer = setTimeout(() => undefined, 0) // marks "running"
  // First poll happens immediately so the UI never waits for the first tick.
  void poll().finally(() => {
    if (pollTimer !== null) scheduleNext()
  })
  tickTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
}

function stopPolling(): void {
  if (pollTimer !== null) {
    if (pollTimeout !== null) clearTimeout(pollTimeout)
    clearTimeout(pollTimer)
    pollTimer = null
  }
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

const isStale = computed<boolean>(() => {
  const snapshot = lastSnapshot.value
  if (!snapshot) return true
  return now.value - snapshot.receivedAt > STALE_AFTER_MS
})

const isConnected = computed<boolean>(() => state.value === 'connected' && !isStale.value)

export function useConnection() {
  onScopeDispose(stopPolling)
  return {
    connectionState: readonly(state),
    lastSnapshot,
    lastErrorMessage: readonly(lastErrorMessage),
    isStale,
    isConnected,
    now: readonly(now),
    startPolling,
    stopPolling,
    poll,
  }
}

/**
 * Wrap a write command: runs it, applies the returned confirmed state,
 * and lets callers react to success/failure without touching fetch().
 */
export async function runCommand(
  action: () => Promise<ControllerStatus>,
): Promise<ControllerStatus> {
  const status = await action()
  lastSnapshot.value = { status, receivedAt: Date.now() }
  lastErrorMessage.value = null
  consecutiveFailures = 0
  setState('connected')
  return status
}
