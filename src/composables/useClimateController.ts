// Application-wide climate state: wraps the poll loop, exposes derived values
// (difference, tone, freshness) and the write commands. Components stay free
// of any HTTP details.

import { computed } from 'vue'
import { api, ControllerRequestError } from '../api'
import {
  useConnection,
  runCommand,
} from './useConnection'
import { log } from './useEventLog'
import { temperatureTone } from '../utils/formatting'
import type {
  ControllerStatus,
  OperatingMode,
} from '../types/climate'

export function useClimateController() {
  const {
    connectionState,
    lastSnapshot,
    lastErrorMessage,
    isStale,
    isConnected,
    now,
    startPolling,
    stopPolling,
    poll,
  } = useConnection()

  const status = computed<ControllerStatus | null>(() => lastSnapshot.value?.status ?? null)
  const receivedAt = computed<number | null>(() => lastSnapshot.value?.receivedAt ?? null)
  const lastUpdateTime = computed(() => (receivedAt.value ? new Date(receivedAt.value) : null))

  const currentTemperature = computed<number | undefined>(() => status.value?.temperature)
  const targetTemperature = computed<number | undefined>(() => status.value?.targetTemperature)
  const mode = computed<OperatingMode>(() => status.value?.mode ?? 'OFF')
  const peltier = computed(() => status.value?.peltier ?? 'UNKNOWN')
  const fan1 = computed(() => status.value?.fan1 ?? 'UNKNOWN')
  const fan2 = computed(() => status.value?.fan2 ?? 'UNKNOWN')

  /** Display-only difference (current − target). Never used for control. */
  const difference = computed<number | undefined>(() => {
    if (currentTemperature.value === undefined || targetTemperature.value === undefined) {
      return undefined
    }
    return currentTemperature.value - targetTemperature.value
  })

  const temperatureToneValue = computed(() =>
    temperatureTone(currentTemperature.value, targetTemperature.value),
  )

  const atTarget = computed<boolean>(
    () => difference.value !== undefined && Math.abs(difference.value) <= 0.3,
  )

  const controllerAction = computed<string>(() => {
    if (connectionState.value === 'connected') {
      if (isStale.value) return 'Unknown'
      const p = peltier.value
      if (p === 'COOLING') return 'Cooling'
      if (p === 'HEATING') return 'Heating'
      if (p === 'OFF') return mode.value === 'OFF' ? 'Off' : 'Holding temperature'
    }
    return 'Unknown'
  })

  const lastResponseTime = computed(() =>
    receivedAt.value ? new Date(receivedAt.value) : null,
  )

  // --- commands -------------------------------------------------------------

  async function setTarget(value: number): Promise<void> {
    const confirmed = await runCommand(() => api.setTargetTemperature(value))
    log(`Target changed to ${confirmed.targetTemperature ?? value} °C`, 'success')
  }

  async function setMode(next: OperatingMode): Promise<void> {
    const confirmed = await runCommand(() => api.setMode(next))
    log(`Mode changed to ${confirmed.mode}`, 'success')
  }

  async function setFan1(on: boolean): Promise<void> {
    const confirmed = await runCommand(() => api.setFan1(on))
    log(`Fan 1 turned ${confirmed.fan1 === 'ON' ? 'on' : 'off'}`, 'success')
  }

  async function setFan2(on: boolean): Promise<void> {
    const confirmed = await runCommand(() => api.setFan2(on))
    log(`Fan 2 turned ${confirmed.fan2 === 'ON' ? 'on' : 'off'}`, 'success')
  }

  async function turnOff(): Promise<void> {
    await runCommand(() => api.turnOff())
    log('System turned off', 'warning')
  }

  async function refresh(): Promise<void> {
    await poll()
  }

  return {
    // state
    connectionState,
    isStale,
    isConnected,
    status,
    receivedAt,
    lastUpdateTime,
    lastErrorMessage,
    now,
    // derived
    currentTemperature,
    targetTemperature,
    difference,
    temperatureToneValue,
    atTarget,
    mode,
    peltier,
    fan1,
    fan2,
    controllerAction,
    lastResponseTime,
    // commands + control
    setTarget,
    setMode,
    setFan1,
    setFan2,
    turnOff,
    refresh,
    startPolling,
    stopPolling,
  }
}

// Re-export so components import from one place.
export { ControllerRequestError }
