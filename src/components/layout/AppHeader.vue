<script setup lang="ts">
import { computed, ref } from 'vue'
import { useClimateController } from '../../composables/useClimateController'
import { useTheme } from '../../composables/useTheme'
import { log } from '../../composables/useEventLog'

const props = defineProps<{ busy?: boolean }>()
const emit = defineEmits<{ turnOff: [] }>()

const { connectionState } = useClimateController()
const { theme, toggle } = useTheme()

const navOpen = ref(false)

const statusLabel = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'Connected'
    case 'reconnecting':
      return 'Reconnecting…'
    default:
      return 'Disconnected'
  }
})

const statusClass = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'ok'
    case 'reconnecting':
      return 'warn'
    default:
      return 'err'
  }
})

const isDemoMode = import.meta.env.VITE_USE_MOCK === 'true'

function onTurnOff(): void {
  if (props.busy) return
  emit('turnOff')
}

function toggleTheme(): void {
  toggle()
  log(`Theme switched to ${theme.value}`, 'info')
}

function onNavClick(): void {
  navOpen.value = false
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink to="/dashboard" class="brand">
        <svg
          class="logo"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" stroke-width="2" />
        </svg>
        <span class="brand-name">Climate Controller</span>
        <span v-if="isDemoMode" class="demo-chip">DEMO</span>
      </RouterLink>

      <div class="header-center">
        <span class="conn" :data-state="connectionState">
          <span class="dot" :class="statusClass" />
          {{ statusLabel }}
        </span>
      </div>

      <div class="header-actions">
        <button
          class="btn icon"
          type="button"
          :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="toggleTheme"
        >
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" fill="currentColor" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" fill="currentColor" />
          </svg>
        </button>

        <button
          class="btn danger off-btn"
          type="button"
          :disabled="busy || connectionState === 'disconnected'"
          @click="onTurnOff"
        >
          OFF
        </button>

        <button
          class="btn icon nav-toggle"
          type="button"
          aria-label="Menu"
          @click="navOpen = !navOpen"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <nav class="nav" :class="{ open: navOpen }" aria-label="Main">
      <RouterLink to="/dashboard" class="nav-link" @click="onNavClick">Dashboard</RouterLink>
      <RouterLink to="/controls" class="nav-link" @click="onNavClick">Controls</RouterLink>
      <RouterLink to="/about" class="nav-link" @click="onNavClick">About</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  text-decoration: none;
  font-weight: 600;
}

.logo {
  color: var(--accent);
}

.demo-chip {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--warn);
  color: #fff;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.conn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.88rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.conn[data-state='connected'] { color: var(--ok); }
.conn[data-state='reconnecting'] { color: var(--warn); }
.conn[data-state='disconnected'] { color: var(--error); }

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.off-btn {
  font-weight: 700;
  letter-spacing: 0.06em;
}

/* --- navigation ----------------------------------------------------------- */

.nav {
  display: flex;
  gap: 4px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px 8px;
}

.nav-link {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-decoration: none;
}

.nav-link:hover {
  color: var(--text);
}

.nav-link.router-link-active {
  background: var(--surface-alt);
  color: var(--text);
  font-weight: 600;
}

.nav-toggle {
  display: none;
}

/* --- mobile --------------------------------------------------------------- */

@media (max-width: 720px) {
  .brand-name {
    font-size: 0.95rem;
  }

  .header-center {
    justify-content: flex-start;
  }

  .nav {
    display: none;
  }

  .nav.open {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: 10px;
  }

  .nav.open .nav-link {
    padding: 12px 14px;
    border-radius: 8px;
    font-size: 1rem;
  }

  .nav-toggle {
    display: inline-flex;
  }
}
</style>
