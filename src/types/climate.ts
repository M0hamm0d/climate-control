// Domain types shared by the API layer, composables, and components.
// The controller (ESP8266) is the source of truth; these types describe
// what the dashboard needs from it.

export type OperatingMode = 'AUTO' | 'COOL' | 'HEAT' | 'OFF'

export type PeltierState = 'COOLING' | 'HEATING' | 'OFF' | 'UNKNOWN'

export type FanState = 'ON' | 'OFF' | 'UNKNOWN'

/** Connection state of the dashboard's link to the controller. */
export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

/** Overall data freshness classification, derived from last successful poll. */
export type DataFreshness = 'live' | 'stale'

/**
 * The canonical status shape used across the app.
 * All fields optional where the firmware may not provide them.
 */
export interface ControllerStatus {
  /** Current measured temperature in °C, undefined if sensor unavailable. */
  temperature?: number
  /** True when the controller reports the temperature sensor as unavailable. */
  sensorError?: boolean
  /** Currently confirmed target temperature in °C. */
  targetTemperature?: number
  /** Currently active operating mode. */
  mode: OperatingMode
  /** Peltier element state as reported by the controller. */
  peltier: PeltierState
  /** Fan 1 state as reported by the controller. */
  fan1: FanState
  /** Fan 2 state as reported by the controller. */
  fan2: FanState
  /** True if Fan 2 cannot be turned off while the Peltier runs (firmware restriction). */
  fan2RequiredWithPeltier?: boolean
  /** Milliseconds since the controller booted, if provided. */
  uptimeMs?: number
  /** Firmware version string, if provided. */
  firmwareVersion?: string
  /** True when the controller is at/holding target temperature. */
  atTarget?: boolean
  /** Raw payload from the controller, preserved for the technical details view. */
  raw?: unknown
}

/** Device-level diagnostics, only fields the API actually exposes. */
export interface DeviceDiagnostics {
  firmwareVersion?: string
  ipAddress?: string
  uptimeMs?: number
  wifiSignalDbm?: number
  clients?: number
}

/** A single controller response, stamped client-side. */
export interface StatusSnapshot {
  status: ControllerStatus
  /** Browser time (ms) at which the response was received. */
  receivedAt: number
}

export interface ConnectionEvents {
  onStateChange?: (state: ConnectionState) => void
  onError?: (message: string) => void
}
