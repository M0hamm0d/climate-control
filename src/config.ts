// Application configuration.
// The app is normally served from the controller itself (same-origin).
// A different base URL can be supplied for development via .env.local.

/**
 * Base URL of the ESP8266 API.
 * Set VITE_CONTROLLER_BASE_URL in .env.local to talk to a controller on another
 * host (e.g. http://192.168.4.1). Empty string = same origin, which is how the
 * app is served from the controller's own file system.
 */
export const CONTROLLER_BASE_URL: string = import.meta.env.VITE_CONTROLLER_BASE_URL ?? ''

/** Polling interval in milliseconds. Kept modest for an ESP8266. */
export const POLL_INTERVAL_MS: number = Number(
  import.meta.env.VITE_POLL_INTERVAL_MS ?? 2000,
)

/** A snapshot older than this is considered stale and flagged in the UI. */
export const STALE_AFTER_MS: number = Number(
  import.meta.env.VITE_STALE_AFTER_MS ?? 10000,
)

/** Maximum entries retained in the browser-side event log. */
export const EVENT_LOG_LIMIT: number = 50

/** Seconds of temperature history kept in the browser (in-memory only). */
export const HISTORY_WINDOW_S: number = 300

/** Target temperature bounds and step, matching the firmware's accepted range. */
export const TARGET_TEMP_MIN = 15
export const TARGET_TEMP_MAX = 35
export const TARGET_TEMP_STEP = 0.5
