<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import ConnectingScreen from './components/shared/ConnectingScreen.vue'
import StaleBanner from './components/shared/StaleBanner.vue'
import DisconnectedNotice from './components/shared/DisconnectedNotice.vue'
import ConfirmDialog from './components/shared/ConfirmDialog.vue'
import { useClimateController } from './composables/useClimateController'
import { useConnection } from './composables/useConnection'
import { useTemperatureHistory } from './composables/useTemperatureHistory'
import { useTheme } from './composables/useTheme'
import { log } from './composables/useEventLog'

useTheme()

const {
  connectionState,
  isStale,
  turnOff,
  startPolling,
  receivedAt,
  now,
} = useClimateController()

const { record } = useTemperatureHistory()
const { lastSnapshot } = useConnection()
const router = useRouter()

const showOffConfirm = ref(false)
const turningOff = ref(false)
const offError = ref<string | null>(null)

onMounted(() => {
  startPolling()
})

// Feed every successful response into the chart history.
watch(lastSnapshot, (snapshot) => {
  if (snapshot) record(snapshot)
})

// Log connection transitions for the event log.
watch(connectionState, (next, prev) => {
  if (next === 'connected' && prev !== 'connected') log('Connected to controller', 'success')
  if (next === 'reconnecting') log('Connection lost', 'warning')
  if (next === 'disconnected' && prev === 'reconnecting') log('Connection lost', 'error')
})

function requestTurnOff(): void {
  offError.value = null
  showOffConfirm.value = true
}

async function confirmTurnOff(): Promise<void> {
  turningOff.value = true
  offError.value = null
  try {
    await turnOff()
  } catch {
    offError.value = 'The controller did not accept the OFF command.'
  } finally {
    turningOff.value = false
  }
}

const lastUpdatedLabel = computed(() => {
  if (!receivedAt.value) return ''
  const seconds = Math.max(0, Math.round((now.value - receivedAt.value) / 1000))
  return seconds <= 1 ? 'just now' : `${seconds}s ago`
})

// While we have never heard from the controller, show a full-screen connecting
// state instead of fake live data.
const showConnectingScreen = computed(
  () => connectionState.value !== 'connected' && receivedAt.value === null,
)

// Disconnected banner only appears after we've had data and lost it.
const showDisconnected = computed(
  () => connectionState.value === 'disconnected' && receivedAt.value !== null,
)

const staleAge = computed(() =>
  receivedAt.value ? Math.max(0, Math.round((now.value - receivedAt.value) / 1000)) : 0,
)

log('Dashboard started', 'info')
</script>

<template>
  <div class="app-shell">
    <AppHeader
      :busy="turningOff"
      @turn-off="requestTurnOff"
    />

    <main class="app-main">
      <ConnectingScreen v-if="showConnectingScreen" />

      <template v-else>
        <div class="banner-stack">
          <div
            v-if="connectionState === 'reconnecting'"
            class="banner banner-warn"
            role="status"
          >
            Connection interrupted. Trying again...
          </div>

          <DisconnectedNotice v-if="showDisconnected" />

          <StaleBanner
            v-if="isStale && connectionState === 'connected'"
            :age-seconds="staleAge"
          />
        </div>

        <RouterView />
      </template>
    </main>

    <AppFooter />

    <ConfirmDialog
      :open="showOffConfirm"
      title="Turn system off?"
      message="This sends the software OFF command. Cooling, heating, and the fans will stop."
      confirm-label="Turn System Off"
      :busy="turningOff"
      :error="offError"
      @confirm="confirmTurnOff"
      @cancel="showOffConfirm = false"
    />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px 16px 32px;
}

.banner-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.banner-stack:empty {
  display: none;
  margin: 0;
}

.banner {
  padding: 10px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--warn);
  background: color-mix(in srgb, var(--warn) 12%, var(--surface));
  font-size: 0.92rem;
}
</style>
