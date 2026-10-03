// ---------------------------------------------------------------------------
// Mock controller: a browser-side simulation of the ESP8266.
//
// Implements the same ClimateApi interface as the real adapter, so the UI
// cannot tell the difference. Used only when VITE_USE_MOCK=true.
// ---------------------------------------------------------------------------

import { ref } from 'vue'
import type { ClimateApi } from './climateApi'
import { ControllerRequestError } from './climateApi'
import type {
  ControllerStatus,
  OperatingMode,
  PeltierState,
} from '../types/climate'

// --- simulated physics ------------------------------------------------------

const ROOM_TEMPERATURE = 28.5 // °C ambient the box leaks towards
const HEAT_LEAK_PER_S = 0.01 // warming from ambient per second
const COOLING_RATE_PER_S = 0.09 // °C/s while Peltier cools (fans on)
const HEATING_RATE_PER_S = 0.07 // °C/s while Peltier heats
const TARGET_BAND = 0.3 // °C inside which AUTO considers target reached
const SENSOR_NOISE = 0.15 // max random drift added to readings

// --- simulated device state -------------------------------------------------

interface MockState {
  temperature: number
  target: number
  mode: OperatingMode
  fan1: boolean
  fan2: boolean
  peltier: PeltierState
  sensorError: boolean
  // command failure simulation
  failNextCommand: boolean
}

// Connection loss is a Vue ref so demo UI bindings update reactively.
const connectionDown = ref(false)

const state: MockState = {
  temperature: 28.4,
  target: 25,
  mode: 'AUTO',
  fan1: true,
  fan2: true,
  peltier: 'COOLING',
  sensorError: false,
  failNextCommand: false,
}

const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

/** Advance the simulation one tick. Called from the poll path (mock "loop"). */
function tick(): void {
  const dt = 2 // seconds simulated per poll tick
  const running = state.mode !== 'OFF'

  let peltier: PeltierState = 'OFF'
  if (running && !state.sensorError) {
    if (state.mode === 'COOL') peltier = 'COOLING'
    else if (state.mode === 'HEAT') peltier = 'HEATING'
    else if (state.mode === 'AUTO') {
      if (state.temperature > state.target + TARGET_BAND) peltier = 'COOLING'
      else if (state.temperature < state.target - TARGET_BAND) peltier = 'HEATING'
    }
  }
  state.peltier = peltier

  let delta = HEAT_LEAK_PER_S * dt * ((ROOM_TEMPERATURE - state.temperature) / 3)
  if (peltier === 'COOLING') delta -= COOLING_RATE_PER_S * dt
  if (peltier === 'HEATING') delta += HEATING_RATE_PER_S * dt
  delta += (Math.random() - 0.5) * SENSOR_NOISE * 0.2

  state.temperature = Math.round((state.temperature + delta) * 10) / 10
  state.temperature = Math.min(45, Math.max(5, state.temperature))

  // Heatsink fan follows the Peltier in AUTO/cooled modes (safety logic lives here,
  // just like it would in the real firmware).
  if (peltier !== 'OFF') state.fan2 = true
}

function snapshot(): ControllerStatus {
  const atTarget = Math.abs(state.temperature - state.target) <= TARGET_BAND
  // Keep the reported mode consistent with the Peltier state: the real
  // firmware has no mode field, so the adapter derives mode from the Peltier.
  // Deriving it here too keeps the mock indistinguishable from the real device.
  const reportedMode: OperatingMode =
    state.peltier === 'COOLING'
      ? 'COOL'
      : state.peltier === 'HEATING'
        ? 'HEAT'
        : 'OFF'
  return {
    temperature: state.sensorError ? undefined : state.temperature,
    sensorError: state.sensorError,
    targetTemperature: state.target,
    mode: reportedMode,
    peltier: state.peltier,
    fan1: state.fan1 ? 'ON' : 'OFF',
    fan2: state.fan2 ? 'ON' : 'OFF',
    fan2RequiredWithPeltier: true,
    atTarget,
    firmwareVersion: 'mock-1.0.0',
    uptimeMs: Math.round(performance.now()),
    raw: {
      temperature: state.sensorError ? null : state.temperature,
      target: state.target,
      mode: state.mode,
      peltier: state.peltier,
      fan1: state.fan1,
      fan2: state.fan2,
      ip: '192.168.4.1',
      wifiSignalDbm: -52 - Math.floor(Math.random() * 8),
      clients: 1 + Math.floor(Math.random() * 2),
      demo: true,
    },
  }
}

function assertConnected(): void {
  if (connectionDown.value) {
    throw new ControllerRequestError('Could not reach the controller')
  }
}

function assertCommandAllowed(): void {
  if (state.failNextCommand) {
    state.failNextCommand = false
    throw new ControllerRequestError('Controller rejected the request', 400)
  }
}

function latency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 60 + Math.random() * 120))
}

// --- public test/demo controls ----------------------------------------------

export const mockControls = {
  /** Toggle simulated connection loss. */
  setConnectionDown(down: boolean): void {
    connectionDown.value = down
    notify()
  },
  /** Make the next write command fail (to exercise error UI). */
  failNextCommand(): void {
    state.failNextCommand = true
  },
  /** Simulate a sensor fault. */
  setSensorError(broken: boolean): void {
    state.sensorError = broken
  },
  /** Jump the simulated temperature (demo scenarios). */
  setTemperature(value: number): void {
    state.temperature = value
  },
  isConnectionDown(): boolean {
    return connectionDown.value
  },
  onChange(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

// --- ClimateApi implementation ----------------------------------------------

export const mockController: ClimateApi = {
  async getStatus() {
    assertConnected()
    tick()
    return latency(snapshot())
  },

  async setTargetTemperature(value) {
    assertConnected()
    await latency(null)
    assertCommandAllowed()
    state.target = Math.round(value * 2) / 2
    tick()
    return snapshot()
  },

  async setMode(mode) {
    assertConnected()
    await latency(null)
    assertCommandAllowed()
    state.mode = mode
    if (mode === 'OFF') {
      state.peltier = 'OFF'
      state.fan1 = false
    } else {
      state.fan1 = true
    }
    tick()
    return snapshot()
  },

  async setFan1(on) {
    assertConnected()
    await latency(null)
    assertCommandAllowed()
    state.fan1 = on
    return snapshot()
  },

  async setFan2(on) {
    assertConnected()
    await latency(null)
    assertCommandAllowed()
    // Firmware-side safety rule the UI must respect and display, not override.
    if (!on && state.peltier !== 'OFF') {
      throw new ControllerRequestError(
        'Fan 2 is required while the Peltier is running',
        409,
      )
    }
    state.fan2 = on
    return snapshot()
  },

  async turnOff() {
    assertConnected()
    await latency(null)
    assertCommandAllowed()
    state.mode = 'OFF'
    state.peltier = 'OFF'
    state.fan1 = false
    state.fan2 = false
    return snapshot()
  },
}
