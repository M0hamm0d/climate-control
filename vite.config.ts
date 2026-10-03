import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Base URL of the ESP8266 for the dev proxy. Override with
// VITE_CONTROLLER_BASE_URL in .env.local when the board is elsewhere.
const controllerHost =
  process.env.VITE_CONTROLLER_BASE_URL?.replace(/\/$/, '') ?? 'http://192.168.4.1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // The app always talks to same-origin paths; in dev this forwards the
      // firmware endpoints to the real board so no CORS setup is needed. Not
      // used in production, where the app is served by the ESP8266 itself.
      '/status': { target: controllerHost, changeOrigin: true },
      '/settemp': { target: controllerHost, changeOrigin: true },
      '/mode': { target: controllerHost, changeOrigin: true },
      '/fan1': { target: controllerHost, changeOrigin: true },
      '/fan2': { target: controllerHost, changeOrigin: true },
      '/off': { target: controllerHost, changeOrigin: true },
    },
  },
})
