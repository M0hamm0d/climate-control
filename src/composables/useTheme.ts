// Light/dark theme with localStorage persistence.
// Same components, different CSS variables — no separate designs.

import { readonly, ref, watchEffect } from 'vue'

export type ThemePreference = 'light' | 'dark'

const STORAGE_KEY = 'cc-theme'
const theme = ref<ThemePreference>(resolveInitial())

function resolveInitial(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function useTheme() {
  watchEffect(() => {
    document.documentElement.dataset['theme'] = theme.value
  })

  function toggle(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function set(next: ThemePreference): void {
    theme.value = next
  }

  return {
    theme: readonly(theme),
    toggle,
    set,
  }
}

// Persist across changes wherever they come from.
watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, theme.value)
})
