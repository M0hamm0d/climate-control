// CSV export of browser-recorded temperature history.
// Local only — nothing is uploaded anywhere.

import type { HistoryPoint } from '../composables/useTemperatureHistory'

function timestamp(t: number): string {
  // ISO local-ish format: 2026-10-01 14:23:05
  const d = new Date(t)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

function csvCell(value: number | null): string {
  return value === null ? '' : String(value)
}

export function historyToCsv(points: readonly HistoryPoint[]): string {
  const header = 'time,temperature_c,target_c'
  const rows = points.map(
    (p) => `${timestamp(p.time)},${csvCell(p.temperature)},${csvCell(p.target)}`,
  )
  return [header, ...rows].join('\r\n')
}

/** Trigger a client-side download of the given history as CSV. */
export function downloadHistoryCsv(points: readonly HistoryPoint[]): boolean {
  if (points.length === 0) return false
  const blob = new Blob([historyToCsv(points)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = timestamp(Date.now()).replace(/[: ]/g, '-')
  link.href = url
  link.download = `climate-controller-history-${stamp}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return true
}
