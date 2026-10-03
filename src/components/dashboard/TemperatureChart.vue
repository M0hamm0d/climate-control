<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTemperatureHistory } from '../../composables/useTemperatureHistory'
import { useClimateController } from '../../composables/useClimateController'
import { formatTime } from '../../utils/formatting'

const { series } = useTemperatureHistory()
const { targetTemperature, isStale, isConnected } = useClimateController()

const WIDTH = 600
const HEIGHT = 200
const PAD = { top: 12, right: 12, bottom: 22, left: 34 }

const hoverIndex = ref<number | null>(null)

const points = computed(() =>
  series.value.filter((p) => p.temperature !== null) as Array<{
    time: number
    temperature: number
    target: number | null
  }>,
)

const bounds = computed(() => {
  if (points.value.length === 0) return null
  const temps = points.value.map((p) => p.temperature)
  const targets = points.value
    .map((p) => p.target)
    .filter((t): t is number => t !== null)
  const all = [...temps, ...targets]
  let min = Math.min(...all)
  let max = Math.max(...all)
  // Always include the current target in view so the target line is visible.
  if (targetTemperature.value !== undefined) {
    min = Math.min(min, targetTemperature.value)
    max = Math.max(max, targetTemperature.value)
  }
  const span = Math.max(max - min, 2) // at least 2 °C of vertical range
  const mid = (min + max) / 2
  return { min: mid - span / 2 - 0.5, max: mid + span / 2 + 0.5 }
})

const x = (time: number): number => {
  const b = bounds.value
  if (!b || points.value.length < 2) return PAD.left
  const [first, last] = [points.value[0]!.time, points.value[points.value.length - 1]!.time]
  const t = (time - first) / Math.max(1, last - first)
  return PAD.left + t * (WIDTH - PAD.left - PAD.right)
}

const y = (temp: number): number => {
  const b = bounds.value
  if (!b) return HEIGHT - PAD.bottom
  const t = (temp - b.min) / (b.max - b.min)
  return HEIGHT - PAD.bottom - t * (HEIGHT - PAD.top - PAD.bottom)
}

const tempPath = computed(() => {
  if (points.value.length < 2) return ''
  return points.value
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.time).toFixed(1)},${y(p.temperature).toFixed(1)}`)
    .join(' ')
})

const targetPath = computed(() => {
  if (points.value.length < 2 || targetTemperature.value === undefined) return ''
  const yv = y(targetTemperature.value)
  return `M${PAD.left},${yv.toFixed(1)}L${WIDTH - PAD.right},${yv.toFixed(1)}`
})

const yTicks = computed(() => {
  const b = bounds.value
  if (!b) return []
  const steps = 3
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = b.min + ((b.max - b.min) * i) / steps
    return { value, y: y(value) }
  })
})

const timeTicks = computed(() => {
  if (points.value.length < 2) return []
  const [first, last] = [points.value[0]!.time, points.value[points.value.length - 1]!.time]
  const count = 4
  return Array.from({ length: count }, (_, i) => {
    const time = first + ((last - first) * i) / (count - 1)
    return { time, x: x(time) }
  })
})

const hoverPoint = computed(() => {
  if (hoverIndex.value === null) return null
  return points.value[hoverIndex.value] ?? null
})

function onMove(event: PointerEvent): void {
  if (points.value.length === 0) return
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const px = ((event.clientX - rect.left) / rect.width) * WIDTH
  let closest = 0
  let best = Infinity
  points.value.forEach((p, i) => {
    const d = Math.abs(x(p.time) - px)
    if (d < best) {
      best = d
      closest = i
    }
  })
  hoverIndex.value = closest
}

function onLeave(): void {
  hoverIndex.value = null
}

const hasData = computed(() => points.value.length >= 2)
</script>

<template>
  <section class="card" aria-label="Temperature history">
    <div class="chart-head">
      <h2 class="card-title">Temperature — last 5 minutes</h2>
      <span class="legend">
        <span class="key temp-key">Temperature</span>
        <span class="key target-key">Target</span>
      </span>
      <span class="source">Browser-collected history</span>
    </div>

    <div v-if="!hasData" class="placeholder">
      <template v-if="isConnected && !isStale">Collecting readings…</template>
      <template v-else>Waiting for controller data…</template>
    </div>

    <svg
      v-else
      class="chart"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      role="img"
      aria-label="Temperature over the last five minutes"
      @pointermove="onMove"
      @pointerleave="onLeave"
    >
      <!-- horizontal grid + y labels -->
      <g v-for="tick in yTicks" :key="tick.value">
        <line
          :x1="PAD.left"
          :x2="WIDTH - PAD.right"
          :y1="tick.y"
          :y2="tick.y"
          class="gridline"
        />
        <text :x="PAD.left - 6" :y="tick.y + 3" class="tick-label" text-anchor="end">
          {{ tick.value.toFixed(1) }}
        </text>
      </g>

      <!-- x labels -->
      <g v-for="tick in timeTicks" :key="tick.time">
        <text :x="tick.x" :y="HEIGHT - 6" class="tick-label" text-anchor="middle">
          {{ formatTime(tick.time) }}
        </text>
      </g>

      <!-- target line -->
      <path v-if="targetPath" :d="targetPath" class="target-line" />

      <!-- temperature line -->
      <path v-if="tempPath" :d="tempPath" class="temp-line" />

      <!-- hover marker -->
      <g v-if="hoverPoint">
        <line
          :x1="x(hoverPoint.time)"
          :x2="x(hoverPoint.time)"
          :y1="PAD.top"
          :y2="HEIGHT - PAD.bottom"
          class="hover-line"
        />
        <circle
          :cx="x(hoverPoint.time)"
          :cy="y(hoverPoint.temperature)"
          r="3.5"
          class="hover-dot"
        />
      </g>
    </svg>

    <div v-if="hoverPoint" class="tooltip" role="status">
      {{ formatTime(hoverPoint.time) }} — {{ hoverPoint.temperature.toFixed(1) }} °C
    </div>
  </section>
</template>

<style scoped>
.chart-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.chart-head .card-title {
  margin: 0;
}

.legend {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.key::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 2px;
  margin-right: 5px;
  vertical-align: middle;
}

.temp-key::before {
  background: var(--cool);
}

.target-key::before {
  background: var(--warn);
  height: 1px;
}

.source {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.chart {
  width: 100%;
  height: auto;
  display: block;
  touch-action: pan-y;
}

.gridline {
  stroke: var(--border);
  stroke-width: 1;
}

.tick-label {
  fill: var(--text-muted);
  font-size: 10px;
}

.temp-line {
  fill: none;
  stroke: var(--cool);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.target-line {
  fill: none;
  stroke: var(--warm);
  stroke-width: 1.2;
  stroke-dasharray: 5 4;
}

.hover-line {
  stroke: var(--text-muted);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}

.hover-dot {
  fill: var(--cool);
  stroke: var(--surface);
  stroke-width: 1.5;
}

.placeholder {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  background: var(--surface-alt);
  border-radius: 8px;
}

.tooltip {
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  min-height: 1.2em;
}
</style>
