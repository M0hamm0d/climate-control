// Small pure formatting helpers. No controller or component logic here.

export function formatTemperature(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return '--.-'
  return value.toFixed(1)
}

export function formatDifference(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return ''
  const abs = Math.abs(value)
  if (abs < 0.05) return 'At target'
  return `${abs.toFixed(1)} °C ${value > 0 ? 'above' : 'below'} target`
}

export function formatUptime(ms?: number): string {
  if (ms === undefined) return 'Unknown'
  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatDbm(dbm?: number): string {
  if (dbm === undefined) return 'Unknown'
  return `${dbm} dBm`
}

/** "2 seconds ago" style strings, kept coarse on purpose. */
export function timeAgo(from: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - from) / 1000))
  if (seconds <= 1) return 'just now'
  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
}

/** Temperature → CSS color token name for subtle visual feedback. */
export function temperatureTone(value?: number, target?: number): 'cool' | 'neutral' | 'warm' {
  if (value === undefined) return 'neutral'
  if (target !== undefined) {
    const diff = value - target
    if (diff <= -1) return 'cool'
    if (diff >= 1) return 'warm'
    return 'neutral'
  }
  if (value <= 18) return 'cool'
  if (value >= 26) return 'warm'
  return 'neutral'
}
