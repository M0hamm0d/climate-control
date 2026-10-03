// ---------------------------------------------------------------------------
// Transport-agnostic climate controller API.
//
// Everything that touches the wire lives here. The rest of the app never sees
// fetch() or endpoint details, so adapting to a firmware change means editing
// this file only.
//
// Real firmware protocol (ESP8266):
// - GET /status
//     → {"temperature":1.0,"target":25.0,"peltier":"HEATING","fan1":true,"fan2":true}
// - Commands are plain GET requests, one endpoint per action:
//     GET /settemp?value=20.5            set target temperature (°C)
//     GET /mode?value=auto|cool|heat|off
//     GET /fan1?value=1|0
//     GET /fan2?value=1|0
//     GET /off                           software off
// - /status has no mode field; the operating mode shown in the UI is derived
//   from the Peltier state and the mode selector stays read-only.
//
// Base URL rules:
// - Default (empty) = same origin: in production the app is served by the
//   ESP8266 itself; in development vite.config.ts proxies /status and /set to
//   the board, so the browser keeps using same-origin URLs and no CORS setup
//   is needed.
// - VITE_CONTROLLER_BASE_URL overrides it (talking to the board cross-origin
//   directly — requires CORS headers on the firmware).
// ---------------------------------------------------------------------------

import { CONTROLLER_BASE_URL } from '../config'
import type {
  ControllerStatus,
  DeviceDiagnostics,
  FanState,
  OperatingMode,
  PeltierState,
} from '../types/climate'

export interface ClimateApi {
  /** Fetch the full controller status snapshot. */
  getStatus(): Promise<ControllerStatus>
  /** Request a new target temperature (°C). Rejects if the controller refuses. */
  setTargetTemperature(value: number): Promise<ControllerStatus>
  /** Request an operating mode. Rejects if the controller refuses. */
  setMode(mode: OperatingMode): Promise<ControllerStatus>
  /** Turn fan 1 on/off. Rejects if the controller refuses. */
  setFan1(on: boolean): Promise<ControllerStatus>
  /** Turn fan 2 on/off. Rejects if the controller refuses (e.g. Peltier safety). */
  setFan2(on: boolean): Promise<ControllerStatus>
  /** Software OFF command: stop Peltier, fans, and automatic control. */
  turnOff(): Promise<ControllerStatus>
}

export class ControllerRequestError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ControllerRequestError'
    this.status = status
  }
}

const TIMEOUT_MS = 5000

// --- firmware endpoint map (edit here if the firmware changes) --------------

const STATUS_PATH = '/status'
const SETTEMP_PATH = '/settemp'
const MODE_PATH = '/mode'
const FAN1_PATH = '/fan1'
const FAN2_PATH = '/fan2'
const OFF_PATH = '/off'

function url(path: string): string {
  return `${CONTROLLER_BASE_URL}${path}`
}

/** Per-request timeout so a hung ESP8266 cannot stall the UI. */
async function fetchWithTimeout(path: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url(path), { signal: controller.signal })
    if (!response.ok) {
      throw new ControllerRequestError(
        `Controller responded with HTTP ${response.status}`,
        response.status,
      )
    }
    return response
  } catch (error) {
    if (error instanceof ControllerRequestError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ControllerRequestError('Controller did not respond in time')
    }
    throw new ControllerRequestError('Could not reach the controller')
  } finally {
    clearTimeout(timer)
  }
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetchWithTimeout(path)
  try {
    return (await response.json()) as unknown
  } catch {
    throw new ControllerRequestError('Controller sent a malformed response')
  }
}

/** Keys that identify a payload as a real status snapshot. */
const STATUS_KEYS = ['temperature', 'target', 'peltier', 'fan1', 'fan2']

function looksLikeStatus(payload: object): boolean {
  return STATUS_KEYS.some((key) => key in payload)
}

/**
 * Send a command as a plain GET request, as the firmware expects. If the
 * reply isn't a JSON status (some firmwares answer plain text like "OK" or a
 * bare {"ok":true}), fall back to a fresh /status poll so callers always get
 * a confirmed status snapshot.
 */
async function sendCommand(path: string, query?: string): Promise<ControllerStatus> {
  const response = await fetchWithTimeout(query ? `${path}?${query}` : path)
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = undefined
  }
  if (
    payload !== null &&
    typeof payload === 'object' &&
    looksLikeStatus(payload)
  ) {
    return toStatus(payload)
  }
  return toStatus(await fetchJson(STATUS_PATH))
}

/** The firmware reports no mode; derive the operating mode from the Peltier. */
export function deriveOperatingMode(peltier: PeltierState): OperatingMode {
  if (peltier === 'COOLING') return 'COOL'
  if (peltier === 'HEATING') return 'HEAT'
  return 'OFF'
}

function toPeltier(value: unknown): PeltierState {
  if (value === 'COOLING' || value === 'HEATING' || value === 'OFF') return value
  return 'UNKNOWN'
}

function toFanState(value: unknown): FanState {
  // Real firmware sends booleans; tolerate the ON/OFF string style too.
  if (value === true || value === 'ON' || value === 1) return 'ON'
  if (value === false || value === 'OFF' || value === 0) return 'OFF'
  return 'UNKNOWN'
}

/**
 * Normalise a firmware response into the canonical ControllerStatus shape.
 * Adjust the field mapping here when the firmware's JSON keys change.
 */
function toStatus(payload: unknown): ControllerStatus {
  const data = (payload ?? {}) as Record<string, unknown>
  const peltier = toPeltier(data.peltier)
  const temperature = typeof data.temperature === 'number' ? data.temperature : undefined
  return {
    temperature,
    // The firmware payload has no dedicated sensor-error field: a missing or
    // invalid temperature is treated as a sensor fault so the UI warns
    // instead of silently showing nothing.
    sensorError: data.sensorError === true || data.sensor_error === true || temperature === undefined,
    targetTemperature:
      typeof data.target === 'number'
        ? data.target
        : typeof data.targetTemperature === 'number'
          ? data.targetTemperature
          : undefined,
    mode: deriveOperatingMode(peltier),
    peltier,
    fan1: toFanState(data.fan1),
    fan2: toFanState(data.fan2),
    fan2RequiredWithPeltier: data.fan2RequiredWithPeltier === true,
    uptimeMs: typeof data.uptimeMs === 'number' ? data.uptimeMs : undefined,
    firmwareVersion:
      typeof data.firmwareVersion === 'string' ? data.firmwareVersion : undefined,
    atTarget: data.atTarget === true,
    raw: payload,
  }
}

export const climateApi: ClimateApi = {
  async getStatus() {
    return toStatus(await fetchJson(STATUS_PATH))
  },

  async setTargetTemperature(value) {
    return sendCommand(SETTEMP_PATH, `value=${value}`)
  },

  async setMode(mode) {
    // Firmware mode values are lowercase: auto | cool | heat | off.
    // The dashboard's mode selector stays read-only; this mapping exists so
    // the ClimateApi interface matches the firmware's real capability.
    return sendCommand(MODE_PATH, `value=${mode.toLowerCase()}`)
  },

  async setFan1(on) {
    return sendCommand(FAN1_PATH, `value=${on ? 1 : 0}`)
  },

  async setFan2(on) {
    return sendCommand(FAN2_PATH, `value=${on ? 1 : 0}`)
  },

  async turnOff() {
    return sendCommand(OFF_PATH)
  },
}

/** Diagnostics are read from the same status payload when the firmware provides it. */
export function extractDiagnostics(status: ControllerStatus): DeviceDiagnostics {
  const raw = (status.raw ?? {}) as Record<string, unknown>
  return {
    firmwareVersion: status.firmwareVersion,
    ipAddress: typeof raw.ip === 'string' ? raw.ip : undefined,
    uptimeMs: status.uptimeMs,
    wifiSignalDbm: typeof raw.wifiSignalDbm === 'number' ? raw.wifiSignalDbm : undefined,
    clients: typeof raw.clients === 'number' ? raw.clients : undefined,
  }
}
